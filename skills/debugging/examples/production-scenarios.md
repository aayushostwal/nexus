# Production Debugging Scenarios

Three real-world scenarios showing the full investigation path from symptom to prevention.
Each scenario follows the workflow defined in `skills/debugging/common.md`.

---

## Scenario 1: "Works Locally, Fails in CI"

### Symptom

Python test passes on every developer machine. Fails consistently in GitHub Actions.

```
FAILED tests/test_orders.py::test_orders_due_today - AssertionError: assert 0 == 5
```

Full CI output:
```
_ test_orders_due_today _____________________________________________________

    def test_orders_due_today():
        now = datetime.datetime.now()
        due = Order.objects.filter(due_date__date=now.date()).count()
        assert due == 5

AssertionError: assert 0 == 5
E   assert 0 == 5

FAILED tests/test_orders.py::test_orders_due_today
1 failed in 0.83s
Error: Process completed with exit code 1.
```

### Investigation Path

**Step 1 — What changed?**

```bash
git log --oneline -5
# fd23a11  add due-today filter to orders API
# b3e8c12  update Django to 4.2.3
# ...

git diff HEAD~1 -- tests/test_orders.py
# Shows: no change to this test file
```

The test was not changed. The filter logic was added. Suspect is in the new queryset, not the test itself.

**Step 2 — Local vs CI signal**

```
Local: passes  |  CI: fails
```

"Works locally, fails in CI" pattern → environment delta. Diff the variables:

| Variable | Local | CI |
|----------|-------|----|
| Python version | 3.11.4 | 3.11.4 |
| Django version | 4.2.3 | 4.2.3 |
| OS | macOS 14 | Ubuntu 22.04 |
| Timezone | America/New_York (UTC-5) | UTC |

Timezone differs. The test creates orders with `due_date = datetime.date.today()` seeded in
`conftest.py`. Locally, "today" is in `America/New_York`. In CI, "today" is UTC.

**Step 3 — Confirm hypothesis**

```bash
TZ=UTC pytest tests/test_orders.py::test_orders_due_today -xvs
# FAILED — confirms timezone is the cause
```

Running locally with `TZ=UTC` reproduces the CI failure exactly.

**Step 4 — Root cause**

`Order.objects.filter(due_date__date=now.date())` uses a naive `datetime.now()` which evaluates
to the machine's local timezone. In CI (UTC) the date is different from local (EST), so the
seeded orders fall on a different date from the filter's perspective.

Root cause: *"`datetime.datetime.now()` is naive and resolves against the machine timezone, causing the due-date filter to return a different date in UTC-based CI than in the developer's local timezone."*

### Fix

```python
# Before (naive — timezone-dependent):
now = datetime.datetime.now()
due = Order.objects.filter(due_date__date=now.date()).count()

# After (timezone-aware — explicit UTC):
import datetime
import django.utils.timezone as tz

now = tz.now()  # Returns UTC-aware datetime regardless of machine timezone
due = Order.objects.filter(due_date__date=now.date()).count()
```

Also update `conftest.py` seed data to use `tz.now().date()` instead of `datetime.date.today()`.

### Verification

```bash
TZ=UTC pytest tests/test_orders.py::test_orders_due_today -xvs
# PASSED

pytest tests/test_orders.py -v
# 12 passed in 1.04s
```

Re-run CI job → passes.

### Prevention

- **Rule:** Never use `datetime.datetime.now()` or `datetime.date.today()` in tests or production code that runs in multiple timezones. Use `django.utils.timezone.now()` (Django) or `datetime.datetime.now(tz=datetime.timezone.utc)` (stdlib).
- **CI config:** Add `TZ=UTC` to the local `pytest.ini` or `pyproject.toml` so local runs match CI:
  ```toml
  [tool.pytest.ini_options]
  env = ["TZ=UTC"]
  ```
- **Code review:** Flag any bare `datetime.now()` call in a PR touching time-sensitive logic.

---

## Scenario 2: "Slow Query Regression After Deploy"

### Symptom

`GET /api/projects` was averaging 45 ms. After a "trivial" ORM model change deployed on Friday,
it averages 480 ms — a 10x regression. No errors; just slow.

### Investigation Path

**Step 1 — What changed in the deploy?**

```bash
git log --oneline origin/main~5..origin/main
# a7f3c88  add team_lead field to Project model
# 3c12b01  bump black to 23.9.1
```

The only functional change is adding a `team_lead` ForeignKey to `Project`. Appears trivial.

**Step 2 — Measure before reading code**

Open Django Debug Toolbar on the `/api/projects` endpoint:

```
Queries: 302
Total query time: 431 ms
```

Before the deploy (from Datadog historical metrics):

```
Queries: 3
Total query time: 38 ms
```

3 queries became 302 queries. N+1 introduced.

**Step 3 — Identify the N+1**

Django Debug Toolbar shows 300 nearly identical queries:

```sql
SELECT * FROM auth_user WHERE id = %s   -- repeated 300 times
```

There are 300 projects returned. Each project triggers a separate query to fetch `team_lead` (a `User`).

**Step 4 — Find the code**

```bash
git diff HEAD~1 -- api/views.py
```

```python
# Before:
queryset = Project.objects.all()

# After (the "trivial" change):
queryset = Project.objects.all()
# ... elsewhere in the serializer, team_lead.username is accessed
```

The serializer was already referencing `team_lead.username`. Before the field existed, it was
null and never fetched. After adding the FK, Django fetches each `team_lead` lazily → 300 queries.

Root cause: *"Adding the `team_lead` ForeignKey caused the existing serializer to trigger a lazy `SELECT` per project, turning a 3-query response into an N+1 query pattern with 300+ queries."*

**Step 5 — Git bisect to confirm**

```bash
git bisect start
git bisect bad HEAD
git bisect good HEAD~2

# git bisect identifies: a7f3c88  add team_lead field to Project model
```

Confirms the exact commit.

### Fix

```python
# api/views.py

# Before:
queryset = Project.objects.all()

# After:
queryset = Project.objects.select_related('team_lead').all()
```

`select_related` issues a single SQL JOIN, collapsing 300 queries into 1.

### Verification

```bash
# Run with Django Debug Toolbar:
# Queries: 1
# Total query time: 22 ms

python manage.py test api.tests.test_projects_endpoint -v 2
# 8 tests passed
```

Performance in staging matches pre-regression baseline.

### Prevention

Add a query count assertion to the endpoint test:

```python
from django.test.utils import CaptureQueriesContext
from django.db import connection

def test_list_projects_query_count():
    with CaptureQueriesContext(connection) as ctx:
        response = self.client.get('/api/projects/')
    assert len(ctx) <= 5, f"Expected ≤5 queries, got {len(ctx)}"
    assert response.status_code == 200
```

This test would have caught the regression in CI before it reached production.

---

## Scenario 3: "Intermittent 500 Errors Under Load"

### Symptom

`POST /api/orders` returns HTTP 500 for approximately 5% of requests during peak traffic
(10:00–11:00 AM EST). No errors outside peak hours. No code was deployed in the last week.

Sentry shows a spike of 500s starting Tuesday morning, coinciding with a marketing campaign
that drove a 3x traffic increase.

### Investigation Path

**Step 1 — Read the stack trace from Sentry**

```
django.db.utils.OperationalError: could not connect to server: Connection refused
    Is the server running on host "db.internal" and accepting
    TCP/IP connections on port 5432?
File "django/db/backends/base/base.py", line 219, in ensure_connection
File "orders/views.py", line 88, in create_order
```

Database connection error, not application logic.

**Step 2 — Establish the timeline**

```
Monday: avg traffic = 800 req/min, 500 rate = 0%
Tuesday 10:00 AM: avg traffic = 2,400 req/min (3x spike), 500 rate = 5%
Tuesday 10:45 AM: errors cluster in 2–5s bursts, then clear
```

The 500s are not random — they cluster in short bursts. That pattern matches connection pool
exhaustion: all connections are in use, new requests get "connection refused" until a connection
is returned.

**Step 3 — Check connection pool configuration**

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 60,
        # No pool size set — Django default = 1 persistent connection per worker
    }
}
```

Application runs 60 Gunicorn workers. Each worker holds 1 persistent connection (`CONN_MAX_AGE=60`).
Max connections to Postgres: 60. Under 3x traffic, 60 concurrent workers were all active
simultaneously, exhausting the pool.

**Step 4 — Confirm with database metrics**

```sql
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
-- Returns 60 during the peak window — all connections saturated
```

```
max_connections on RDS instance: 100
Active connections at peak: 60 (all Django workers)
Connection wait timeout: 5s → triggers OperationalError
```

Root cause: *"`POST /api/orders` returns 500 under load because all 60 Gunicorn worker connections are held simultaneously at peak concurrency, exhausting the Postgres connection pool and causing new requests to fail with OperationalError."*

### Fix

**Immediate fix (increase pool size):**

```python
# settings.py — use pgBouncer or django-db-geventpool, or increase RDS max_connections
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 0,           # Disable persistent connections — let pgBouncer manage pooling
        ...
    }
}
```

Deploy pgBouncer in front of RDS in transaction mode (pool_mode = transaction). This allows
hundreds of Django workers to share a small number of actual Postgres connections efficiently.

**Connection pool monitoring:**

```yaml
# CloudWatch alarm: alert when active connections exceed 80% of max_connections
MetricName: DatabaseConnections
Threshold: 80
```

### Verification

```bash
# Load test in staging with k6:
k6 run --vus 200 --duration 60s load_test.js

# Before fix:
# http_req_failed: 4.8%

# After fix (with pgBouncer):
# http_req_failed: 0.0%
# Postgres active connections: stable at 15 (pgBouncer holds pool)
```

Monitor Sentry for 24 hours post-deploy during peak window → 0 connection errors.

### Prevention

- **Load test in staging before every traffic-driving campaign.** Script: `k6 run --vus 300 --duration 120s`.
- **Add connection saturation alarm:** PagerDuty alert when `pg_stat_activity.count > 0.8 * max_connections`.
- **Document the pgBouncer setup** in `docs/infrastructure.md` so the next engineer knows why it exists.
- **Runbook:** Add "check connection pool saturation" to the 500-error runbook as the first step during database-related incidents.
