# Production PR Review Scenarios

Three real-world PR archetypes with the kind of findings that separate a semantic review
from a syntactic scan. Each scenario shows what a naive reviewer misses and why.

---

## Scenario 1 — Database Migration: Blast Radius of "Just Adding an Index"

### PR Description

> **Title:** Improve user search performance
>
> **Description:** User search is slow (p95 ~4s). Adding an index on `users.email` and
> `users.created_at` to speed up the search query. Low risk — no schema changes, no
> data loss possible, just adding indexes.

### The Diff

```sql
-- migrations/20240315_add_user_search_indexes.sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_name_search ON users(lower(name) text_pattern_ops);
```

```python
# alembic/versions/20240315_add_user_search_indexes.py
def upgrade():
    op.execute("CREATE INDEX idx_users_email ON users(email)")
    op.execute("CREATE INDEX idx_users_created_at ON users(created_at DESC)")
    op.execute("CREATE INDEX idx_users_name_search ON users(lower(name) text_pattern_ops)")

def downgrade():
    op.execute("DROP INDEX idx_users_email")
    op.execute("DROP INDEX idx_users_created_at")
    op.execute("DROP INDEX idx_users_name_search")
```

### What the Naive Reviewer Approved

The naive reviewer read the migration, confirmed the SQL was syntactically correct, noted that
indexes are additive and reversible, and approved. The PR description said "low risk." The
reviewer agreed.

### What the Semantic Reviewer Found

**Finding 1 — BLOCK: `CREATE INDEX` without `CONCURRENTLY` acquires an exclusive table lock**

`CREATE INDEX` in PostgreSQL (and MySQL) acquires an `ACCESS EXCLUSIVE` lock on the table
for the entire duration of the index build. On a `users` table with 12 million rows, this
index build takes 4-8 minutes. During that time:
- All `INSERT`, `UPDATE`, `DELETE`, and `SELECT` queries on `users` queue behind the lock
- The queue grows without bound — connection pool exhausts
- Every endpoint that touches users (login, profile, search, onboarding) returns 504s

The correct migration is:
```sql
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```
`CONCURRENTLY` builds the index without holding an exclusive lock, but it cannot run inside
a transaction block. The Alembic migration must not wrap it in a transaction:
```python
def upgrade():
    # Cannot run inside transaction — use raw connection
    op.execute("CREATE INDEX CONCURRENTLY idx_users_email ON users(email)")
```
And the Alembic config must set `transaction_per_migration = false` for this migration.

**Finding 2 — REQUEST CHANGES: Three indexes created in one migration with no order guarantee**

If the migration fails after the first index and before the third, the downgrade path drops
all three — but `idx_users_email` now exists (partially built) and `idx_users_name_search`
does not. The downgrade errors on the missing index. Split into three separate migrations
with independent up/down paths.

**Finding 3 — COMMENT: `text_pattern_ops` index will not be used by the current query**

The search query in `user_search.py` uses `ILIKE '%term%'` (leading wildcard). No index on
PostgreSQL supports leading-wildcard LIKE. The `text_pattern_ops` index only accelerates
prefix matches (`ILIKE 'term%'`). This index will be built, consume ~200MB, and never be
used. Use `pg_trgm` with a GIN index for full-text search.

### Why It Matters

This PR would have taken the production database offline for 4-8 minutes during peak traffic.
The author was right that indexes are additive and reversible. The blast radius came from the
lock behavior of the DDL operation, not the index itself — a distinction invisible without
knowing how PostgreSQL handles `CREATE INDEX`.

---

## Scenario 2 — Auth Change: "Just Refactoring the Middleware"

### PR Description

> **Title:** Refactor auth middleware to support API key auth
>
> **Description:** Splitting the monolithic `require_auth` decorator into two decorators:
> `require_jwt` and `require_api_key`. This makes it easier to add API key support to
> specific endpoints without changing existing behavior. All existing routes still use
> `require_jwt`. No behavior change.

### The Diff (abbreviated)

```python
# Before
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'unauthorized'}), 401
        payload = verify_jwt(token)
        if not payload:
            return jsonify({'error': 'invalid token'}), 401
        g.user_id = payload['user_id']
        g.user_role = payload['role']
        return f(*args, **kwargs)
    return decorated

# After
def require_jwt(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'unauthorized'}), 401
        payload = verify_jwt(token)
        if not payload:
            return jsonify({'error': 'invalid token'}), 401
        g.current_user = payload          # CHANGED: was g.user_id and g.user_role separately
        return f(*args, **kwargs)
    return decorated

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get('X-API-Key')
        if not key or not validate_api_key(key):
            return jsonify({'error': 'unauthorized'}), 401
        g.current_user = {'user_id': None, 'role': 'api_client'}
        return f(*args, **kwargs)
    return decorated
```

```python
# routes/users.py — all routes updated:
@app.route('/users/<id>', methods=['GET'])
@require_jwt   # was @require_auth
def get_user(id):
    # ... handler body unchanged
```

### What the Naive Reviewer Approved

The reviewer confirmed all routes were updated from `require_auth` to `require_jwt`. The
functionality looked equivalent. The new `require_api_key` was additive. "No behavior change"
sounded correct.

### What the Semantic Reviewer Found

**Finding 1 — BLOCK: `g.user_id` changed to `g.current_user['user_id']` — all route handlers will crash on access**

The old decorator set `g.user_id = payload['user_id']` and `g.user_role = payload['role']`.
The new decorator sets `g.current_user = payload`. Every route handler that accesses `g.user_id`
directly will get `AttributeError: '_AppCtxGlobals' object has no attribute 'user_id'` after
this change.

Running `git grep "g.user_id"` reveals 47 occurrences across 12 route files. None of them were
updated in this PR. The PR only updated the decorator references, not the handler bodies.

```python
# Example of a handler that will crash:
@app.route('/users/<id>/orders', methods=['GET'])
@require_jwt
def get_user_orders(id):
    orders = Order.query.filter_by(user_id=g.user_id).all()  # AttributeError after merge
    return jsonify([o.to_dict() for o in orders])
```

Every authenticated endpoint will return a 500 error in production.

**Finding 2 — BLOCK: `require_api_key` sets `g.current_user['user_id'] = None` — handlers that insert `user_id` will write NULL**

Routes that use `@require_api_key` and write to the database using `g.current_user['user_id']`
as a foreign key will silently insert NULL for `user_id`. If the column has a NOT NULL constraint,
they will throw. If it does not, they will corrupt audit logs, ownership records, and access
control rows.

**Finding 3 — REQUEST CHANGES: `validate_api_key` is called but its implementation is not in the diff**

`validate_api_key` is used in `require_api_key` but is not defined in this PR's diff.
Running `git grep "def validate_api_key"` returns no results. This function does not exist.
Any endpoint decorated with `require_api_key` will crash with `NameError` at decoration time,
which means the app will fail to start.

### Why It Matters

The PR description said "no behavior change." The diff showed route decorators updated from
`require_auth` to `require_jwt`. A reviewer checking those two facts would approve. The blast
radius came from a quiet attribute rename inside the decorator — not visible in the route diffs,
only visible by reading the decorator body and then searching for every usage of `g.user_id`
in the codebase. This is exactly the kind of change that causes a 100% error rate on all
authenticated endpoints immediately after deploy.

---

## Scenario 3 — Performance: The "Tiny Loop" That Takes Down Search

### PR Description

> **Title:** Add user tags to search results
>
> **Description:** Product wants to show user tags on the search results page. Adding tags
> to the search result serializer. Small change — just adding a field to the response.

### The Diff

```python
# serializers/search.py

class SearchResultSerializer:
    def serialize(self, user):
        return {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'avatar_url': user.avatar_url,
            'tags': self._get_tags(user),    # NEW
        }

    def _get_tags(self, user):
        return [tag.name for tag in user.tags.all()]   # NEW
```

```python
# views/search.py — no change to the view itself
def search_users(request):
    query = request.GET.get('q', '')
    users = User.objects.filter(name__icontains=query)[:50]
    serializer = SearchResultSerializer()
    return JsonResponse({
        'results': [serializer.serialize(u) for u in users]
    })
```

### What the Naive Reviewer Approved

The change is 4 lines. It adds a field to an existing serializer. The reviewer confirmed
`user.tags.all()` is correct Django ORM syntax for accessing a ManyToMany relationship. Approved.

### What the Semantic Reviewer Found

**Finding 1 — BLOCK: Classic N+1 query — 1 query to fetch users + 1 query per user for tags = 51 queries per search request**

The search view fetches `users` with one query (correct). The serializer then calls
`user.tags.all()` inside the `.serialize()` loop. Django's ORM executes a separate `SELECT`
for each call to `user.tags.all()`. For a result of 50 users, this is 50 additional queries.
Total: 51 queries per search request, up from 1.

At 100 search requests/minute (moderate traffic), this is 5,000 additional queries/minute
against the database. The search endpoint has a p95 of 80ms today. With this change,
p95 will be dominated by 50 sequential queries. Based on the database's current query latency
(~2ms/query), p95 will increase to ~180ms minimum — likely higher under load due to connection
pool contention.

The fix is one line in the view:
```python
users = User.objects.filter(name__icontains=query).prefetch_related('tags')[:50]
```
`prefetch_related('tags')` issues a single `SELECT ... WHERE user_id IN (...)` query for all
tags, regardless of result count.

**Finding 2 — REQUEST CHANGES: `user.tags.all()` returns a QuerySet — under some Django versions with caching, re-serializing the same user object re-issues the query**

If the search result contains the same user twice (possible in some query patterns), `tags.all()`
is called twice per user, doubling the tag queries. `prefetch_related` caches the result and
avoids this.

**Finding 3 — COMMENT: Missing test for the new field**

The PR adds `tags` to the serializer but adds no test asserting the field appears in the
search response, or asserting the query count. A test using `django.test.utils.assertNumQueries`
would prevent this regression from reappearing:
```python
def test_search_does_not_issue_n_plus_one_queries():
    UserFactory.create_batch(10, tags=['python', 'ml'])
    with self.assertNumQueries(2):  # 1 for users, 1 for tags
        response = self.client.get('/search/?q=test')
    self.assertEqual(response.status_code, 200)
```

### What Was Missed by Naive Review

The reviewer saw correct Django syntax and a small diff. The blast radius required knowing:
1. How Django's ORM evaluates `user.tags.all()` (lazy by default — one query per call)
2. The traffic volume on the search endpoint (not in the diff — requires asking or checking metrics)
3. That `prefetch_related` exists and is the correct fix (framework knowledge)
4. That `assertNumQueries` can prevent this class of regression (testing knowledge)

None of these are visible in the 4-line diff. All of them are visible to an engineer who
knows the framework, checks the pattern, and constructs the scenario.
