# Code Review Heuristics

Engineering decision rules derived from real production patterns. Use these mechanically —
not as suggestions, but as the output of a classification system.

---

## BLOCK vs REQUEST CHANGES vs APPROVE — The Decision Tree

### Always BLOCK

These are non-negotiable. If any of these conditions is true, the PR cannot be approved
regardless of the author's explanation.

| Condition | Why non-negotiable |
|-----------|-------------------|
| Migration drops column/table without backward-compatible transition | Data loss risk and immediate breakage of any deployed app version still reading the old schema |
| `CREATE INDEX` without `CONCURRENTLY` on a table with >100k rows in production | Exclusive lock will take the database offline for minutes to hours |
| Auth middleware removed from an endpoint | Any request to that endpoint is now unauthenticated |
| Exception swallowed after a charge, write, or state mutation | Silent data corruption — the system shows success, the state is inconsistent |
| N+1 query on a code path serving >1k requests/minute | Database will be overwhelmed within hours of deploy |
| `DELETE` or `UPDATE` without a `WHERE` clause | Will delete or modify every row in the table |
| Secret/token/password committed in code or test file | Credential is now in git history permanently |
| Function signature change with callers that have not been updated | All callers will crash at runtime |

### BLOCK when blast radius is high, REQUEST CHANGES when blast radius is low

The same correctness issue can be a BLOCK or REQUEST CHANGES depending on how much of the
system it affects:

| Finding | Low blast radius | High blast radius |
|---------|-----------------|------------------|
| Race condition in read-modify-write | REQUEST CHANGES — flag the pattern, fix before next sprint | BLOCK — affects money, inventory, or user state that must be consistent |
| Missing input validation | REQUEST CHANGES — endpoint is internal or low-traffic | BLOCK — endpoint is public-facing, input can be weaponized |
| Error swallowed | REQUEST CHANGES — error is informational only | BLOCK — error follows a mutation; swallowing hides corruption |
| Missing null check | REQUEST CHANGES — null is possible but rare in practice | BLOCK — null causes crash on every request from unauthenticated users |

### REQUEST CHANGES without BLOCK

Use REQUEST CHANGES (not BLOCK) for issues that are correctness problems but not
production-immediate:

- A missing edge case that only triggers under specific inputs not commonly seen in production
- A design issue that will cause problems when the feature is extended (not today)
- A race condition that requires concurrent requests on the same entity (low probability today)
- A performance issue on a low-traffic path (benchmark it — if p99 < 500ms, it can wait)
- A test that tests the implementation instead of the behavior (it passes today, but won't catch future regressions)

### APPROVE WITH COMMENTS

Use this when:
- No correctness issue found
- Test coverage is adequate
- There are 1-3 comments worth making for maintainability or future-proofing
- None of those comments are blocking

Never use APPROVE to mean "I didn't find anything but I didn't check everything." If you
didn't check callers, say so — don't approve to get the PR off your queue.

---

## N+1 Query Detection

### The fundamental question

For every loop that accesses data: **is this loop issuing one query per iteration, or
is the data already fetched into memory?**

### Detection algorithm

1. Find every `for` loop, `.map()`, `.each()`, `.forEach()`, or comprehension in the diff.
2. For each loop, look at the loop body.
3. Does the body call any of these? → N+1 candidate
   - ORM method: `.get()`, `.filter()`, `.find()`, `.findOne()`, `.where()`, `.first()`
   - Raw SQL execution: `cursor.execute()`, `db.query()`, `connection.execute()`
   - Repository method: `userRepo.findById()`, `orderService.getByUser()`
   - Any method that has "get", "find", "fetch", "load", or "query" in its name
4. Read the function being called — confirm it actually hits storage.
5. Check whether the outer collection was fetched with a join/eager-load hint:
   - Django: `.select_related()` or `.prefetch_related()`
   - Rails: `.includes()` or `.eager_load()`
   - TypeORM: `relations: [...]` in `find()` options
   - Hibernate: `@ManyToOne(fetch = FetchType.EAGER)` or explicit JOIN FETCH
   - Sequelize: `include: [Model]`
   - Prisma: `include: { relation: true }`
6. If no join/eager-load hint: it is an N+1. Flag it.

### Patterns by language

**Python / Django:**
```python
# N+1
for order in Order.objects.filter(user=user):
    print(order.product.name)  # one query per order

# Fixed
for order in Order.objects.filter(user=user).select_related('product'):
    print(order.product.name)  # one query total
```

**TypeScript / TypeORM:**
```typescript
// N+1
const users = await userRepo.find();
for (const user of users) {
    const orders = await orderRepo.findBy({ userId: user.id }); // N queries
}

// Fixed
const users = await userRepo.find({ relations: ['orders'] }); // 1 query
```

**Ruby / ActiveRecord:**
```ruby
# N+1
User.all.each do |user|
    puts user.posts.count  # N queries
end

# Fixed
User.includes(:posts).each do |user|
    puts user.posts.count  # 1 query
end
```

**Go / GORM:**
```go
// N+1
var users []User
db.Find(&users)
for _, user := range users {
    var orders []Order
    db.Where("user_id = ?", user.ID).Find(&orders) // N queries
}

// Fixed
var users []User
db.Preload("Orders").Find(&users) // 1 + 1 queries
```

### Severity by traffic

| Requests/minute on affected path | Severity |
|----------------------------------|---------|
| < 10 | COMMENT — fix before next sprint |
| 10–1,000 | REQUEST CHANGES — fix in this PR |
| > 1,000 | BLOCK — this will cause a database incident |

---

## Race Condition Detection

### The four questions

For any concurrent system (web servers with multiple workers, any Go/Node/Python async app):
1. **Is shared state written?** (If nothing is written, no race — reads are safe)
2. **Is the write atomic?** (Single SQL UPDATE with WHERE is atomic; read-modify-write is not)
3. **Is there a check before the write?** (Check-then-act is a race window)
4. **Is there a transaction or lock protecting the sequence?** (If no: race condition)

### Pattern 1 — Check-then-act (TOCTOU)

```python
# Race: two workers can both pass the check, then both write
if not User.objects.filter(email=email).exists():  # check
    User.objects.create(email=email)               # act — may create duplicate

# Fixed: unique constraint + handle IntegrityError
# OR: use get_or_create() which uses DB-level uniqueness
user, created = User.objects.get_or_create(email=email)
```

Identify it: `if not exists` / `if count == 0` / `if null` followed by a `create`, `insert`,
or `update`. No lock or transaction around both operations.

### Pattern 2 — Read-modify-write

```python
# Race: two workers read balance=100, both compute 100-50=50, both write 50
# Net effect: balance is 50 instead of 0
user = User.objects.get(id=user_id)
user.balance -= amount
user.save()

# Fixed option 1: atomic update (never read balance into Python)
User.objects.filter(id=user_id).update(balance=F('balance') - amount)

# Fixed option 2: select_for_update (advisory lock)
with transaction.atomic():
    user = User.objects.select_for_update().get(id=user_id)
    user.balance -= amount
    user.save()
```

Identify it: read entity → modify field → save/update, without `select_for_update`,
`FOR UPDATE`, atomic increment (`F()` expression), or surrounding transaction.

### Pattern 3 — Missing await

```typescript
// Race: DB write is fire-and-forget; response is sent before write completes
// If the process crashes between response and write: data is lost
async function createUser(data: UserData) {
    db.users.create(data);        // not awaited
    return { success: true };     // sent before create completes
}

// Fixed
async function createUser(data: UserData) {
    await db.users.create(data);  // awaited
    return { success: true };
}
```

Identify it: async function call not prefixed with `await` (TypeScript/JS), not handled with
`.then()`, not checked for error. Look for `Promise<void>` return types discarded without await.

### Pattern 4 — Shared mutable module state

```python
# Race: request A sets active_users = [...], request B appends to active_users
# Under concurrent load, the list is corrupted
active_users = []  # module-level mutable

@app.route('/session')
def session_handler():
    active_users.append(current_user)  # race: unsynchronized write
```

Identify it: module-level `list`, `dict`, or object that is **written** (not just read)
inside a request handler, background worker, or thread function. Reading is safe; writing is not.

---

## Missing Error Handling That Causes Data Corruption

### The key question

**What state has already been committed when this exception is swallowed?**

If the answer is "nothing" → the swallow is safe (annoying, but safe).
If the answer is "some writes but not others" → the swallow is a corruption risk.

### Anatomy of a dangerous swallow

```python
try:
    record = db.create_order(items)        # committed to DB
    payment = stripe.charge(amount)        # external call — may fail
    db.update_order_status(record, 'paid') # not reached if stripe fails
    email.send_receipt(record)
except Exception:
    pass  # order created, not paid, status still 'pending', no receipt
          # user sees success, finance sees inconsistency
```

What to look for:
1. A `try` block that contains multiple state-changing operations
2. A `catch`/`except` that does not re-raise, does not rollback, does not log, does not alert
3. A mix of transactional (DB) and non-transactional (HTTP, email, queue) operations in the same `try`

### The three safe patterns for multi-step mutations

**Pattern A — Wrap in a transaction + propagate exception:**
```python
with transaction.atomic():
    record = db.create_order(items)
    # If payment fails, the transaction rolls back automatically
    payment = stripe.charge(amount)
    db.update_order_status(record, 'paid')
# Email is outside the transaction — only sent if no exception
email.send_receipt(record)
```

**Pattern B — Idempotent retry + compensating action:**
```python
record = db.create_order(items, status='pending')
try:
    payment = stripe.charge(amount, idempotency_key=record.id)
    db.update_order_status(record, 'paid')
except stripe.CardError:
    db.update_order_status(record, 'payment_failed')  # compensating write
    raise  # propagate to caller
```

**Pattern C — Saga / outbox pattern (for distributed systems):**
Write the intent to a durable queue inside the same DB transaction.
A background worker executes the intent and handles retries externally.
Never make external calls inside the same DB transaction.

---

## Migration Safety Assessment

### The five-point framework (apply to every migration)

**1. Lock risk** — Does this operation acquire an exclusive lock?

| Operation | Lock type | Safe for live traffic? |
|-----------|-----------|----------------------|
| `CREATE INDEX CONCURRENTLY` | No lock | Yes |
| `CREATE INDEX` (without CONCURRENTLY) | Exclusive for entire build | No — use CONCURRENTLY |
| `ADD COLUMN ... DEFAULT null` | Share lock (brief) | Yes |
| `ADD COLUMN ... NOT NULL DEFAULT x` | Full rewrite on MySQL 5.7; brief on Postgres 11+ | Check DB version |
| `ALTER COLUMN TYPE` | Full rewrite + exclusive | No — use expand-contract pattern |
| `DROP COLUMN` | Exclusive (brief) | Yes — but app code must not reference it |
| `CREATE TABLE` | None (new table) | Yes |

**2. Backward compatibility** — Does old app code work against the new schema?

- Adding a nullable column: old INSERTs succeed (new column is NULL). **Safe.**
- Adding NOT NULL without DEFAULT: old INSERTs fail (cannot provide new column). **Unsafe.**
- Dropping a column: old code reading that column gets NULL or error. **Unsafe — deploy app first.**
- Renaming a column: old code referencing old name fails. **Unsafe — use expand-contract.**
- Adding a UNIQUE constraint: old code may insert duplicates, causing errors. **Unsafe — validate first.**

**3. Rollback safety** — What does the `down` migration do?

- `ADD COLUMN` → `DROP COLUMN`: safe, data in the column is lost on rollback.
- `CREATE INDEX` → `DROP INDEX`: safe.
- `DROP TABLE` → `CREATE TABLE`: the CREATE restores structure but not data. Rollback = data loss.
- `UPDATE` (backfill) → reverse `UPDATE`: safe if original values are preserved or knowable.
- Data deletion (`DELETE FROM ...`) → no reverse: rollback is impossible.

**4. Zero-downtime compatibility** — Can you deploy this migration while the app is running?

The expand-contract pattern for safe column renames:

```
Phase 1 (this PR): Add new_column as nullable (no app code reads it yet)
Phase 2 (next PR): Deploy app code that writes both old_column and new_column
Phase 3 (third PR): Deploy app code that reads new_column instead of old_column
Phase 4 (fourth PR): Drop old_column (app no longer references it)
```

Any rename that collapses phases 1-4 into one PR is a zero-downtime violation.

**5. Data volume** — How long will this migration take to run?

- `ADD COLUMN DEFAULT NULL` on Postgres: O(1) — metadata change only.
- `UPDATE all rows`: O(N) — will run for minutes/hours on large tables. Must be batched.
- `CREATE INDEX CONCURRENTLY`: O(N log N) — will run in background. Safe but estimate the time.
- Estimate: 1M rows → ~10-30 seconds for a simple index. 100M rows → 15-45 minutes.

---

## Prioritization: Which Finding Types Justify Blocking

Ranked by frequency-of-production-incident, based on post-mortem data patterns:

1. **Migration lock risk** — Highest incident rate. A single `CREATE INDEX` without `CONCURRENTLY` takes down the DB.
2. **Auth bypass** — Immediate security breach. Any unauthenticated endpoint is exploited within hours of discovery.
3. **N+1 on high-traffic path** — Gradual but certain. Database throughput degrades over hours to days.
4. **Exception swallow after mutation** — Silent corruption. Often undetected for days. The worst kind.
5. **Race condition on money/inventory** — Inconsistency that is hard to detect and hard to fix retroactively.
6. **Missing error propagation on external calls** — Failures appear as success. Users retry, causing duplicate processing.
7. **Caller not updated after signature change** — Immediate crash in production on first request.

Items 1-4 should always be BLOCKs. Items 5-7 are BLOCKs when blast radius is high, REQUEST CHANGES when limited.

---

## The Single-Owner Assumption Anti-Pattern

### What it is

A reviewer (or author) concludes a change is safe because "we own both sides" or "this is
an internal function" or "no one else calls this." The assumption is that the known usages
are the complete set of usages.

### Why it fails

In any codebase older than 6 months:
- Internal functions get called by utilities that get imported by scripts that get called by cron jobs
- "Internal" endpoints get called by curl scripts in Runbooks, by monitoring probes, by legacy tools
- "We control both sides" ignores the client SDK published 8 months ago with 3 internal teams using it
- The function you think has 2 callers has 17 if you check `git grep`

### How to catch it

**Always run `git grep` before accepting "no other callers."** It takes 3 seconds. The blast
radius of being wrong is a 100% error rate on callers you did not know about.

```bash
# Find all callers of a function
git grep -n "function_name" -- "*.py"

# Find all importers of a module
git grep -n "from module import" -- "*.py"
git grep -n "import module" -- "*.ts"

# Find all instantiations of a class
git grep -n "ClassName(" -- "*.py" "*.ts"

# Find all implementations of an interface
git grep -n "implements InterfaceName" -- "*.ts"
git grep -n "class .* InterfaceName" -- "*.py"
```

### The test that proves you checked

In your review, write: "Ran `git grep "function_name"` — found N callers in M files, all
updated." This is the only statement that demonstrates you checked. "I believe no other callers
exist" is not evidence.

---

## Semantic vs Syntactic Review — The Full Contrast

### Syntactic review (what linters do — automate this, never do it manually)

- Variable naming conventions
- Import ordering
- Line length and formatting
- Unused imports or variables
- Obvious typos in string literals
- Missing docstrings or comments
- Obvious type annotation errors

### Semantic review (what this skill does — requires human reasoning)

- Does this code do what the PR description says it does?
- Is there a scenario where this code produces wrong output?
- What happens to existing callers when this interface changes?
- Will this code behave correctly under concurrent load?
- Is this migration safe to run against production data at production scale?
- Is the test testing the behavior or the implementation?
- What happens in the system when this code path throws an exception?
- Is this authorization check placed correctly in the request lifecycle?
- Could this input from an external actor cause unexpected behavior?

### The litmus test

Before leaving a review comment, ask: "Could a linter or static analysis tool catch this?"
- If yes: set up the linter and don't leave the comment.
- If no: leave the comment — it is a semantic finding that requires human judgment.

Spending review time on syntactic issues is an anti-pattern that:
1. Trains authors to tune out review comments (they all look like nits)
2. Wastes reviewer attention that should be on correctness
3. Makes every review feel adversarial rather than collaborative
4. Does not improve production reliability at all
