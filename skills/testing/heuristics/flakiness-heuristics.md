# Flakiness Heuristics

Pattern-matching reference for each flakiness type. Use these as diagnostic shortcuts after
capturing the basic failure signals. Each heuristic includes the detection method, the
confirmation test, and the mechanism it points to.

---

## Master Decision Tree

```
Test fails intermittently
│
├── Does it fail when run ALONE?
│   │
│   ├── YES → Not an ordering bug. Continue below.
│   │   │
│   │   ├── Does failure message VARY between runs?
│   │   │   ├── YES → Concurrency or external dependency
│   │   │   └── NO  → Timing or resource contention
│   │   │
│   │   ├── Does failure rate INCREASE under parallel execution?
│   │   │   ├── YES → Resource contention or concurrency
│   │   │   └── NO  → Timing (absolute delay) or external dependency
│   │   │
│   │   └── Does it fail ONLY IN CI (not locally)?
│   │       ├── YES → Environment delta — check clock, parallelism, network, OS
│   │       └── NO  → Timing or external dependency reproducible locally
│   │
│   └── NO → Ordering bug (shared state from another test)
│       │
│       └── Run with --randomly-seed=random, capture failing seed
│           Run with that seed to reproduce deterministically
│           Bisect to find the test that causes the failure
```

---

## Heuristic 1 — "Fails on Retry Without Code Changes"

**Observation:** CI retries the test (no code change) and it passes. This happens repeatedly.

**What it points to:** Environment leak or resource contention.

**Why:** If the test is truly dependent only on its own code, it should be deterministic. The
only way a retry produces a different result is if external state (a shared resource, a leaked
connection, a lingering process) from a previous run has been cleaned up by the time the retry
runs. The retry window (typically 30–120 seconds) is enough for OS to reclaim a port or a DB
lock to expire.

**Diagnosis:**

```bash
# Check if the test creates any resources it might not clean up
grep -n "socket\|connect\|open(\|tempfile\|mkdir\|lock" tests/path/to/test.py

# Check if teardown is guarded (runs even on failure)
grep -n "finally\|yield\|addCleanup\|t.Cleanup\|defer" tests/path/to/test.py conftest.py
```

**Confirmation test:** Run the test twice in immediate succession — no sleep between runs.
If the second run fails when the first passed, or vice versa, the resource is not being cleaned
up between runs.

---

## Heuristic 2 — "Fails Only in CI, Passes Locally Every Time"

**Observation:** Developer runs the test 10 times locally — always passes. CI fails 3 out of 10.

**What it points to:** Environment delta. The root cause is in the environment, not the test code.

**Check in this order:**

| Check | Command | What to look for |
|-------|---------|-----------------|
| Runtime version | `python --version` vs CI YAML | Minor version differences change behavior |
| Parallelism | `grep -n "parallel\|-n\|workers" .github/workflows/*.yml` | CI may run `-n auto` |
| Timezone | `echo $TZ` vs CI env | `datetime.now()` vs `datetime.utcnow()` differences |
| Env vars | `diff <(cat .env.example \| sort) <(cat ci-env-vars.txt \| sort)` | Missing required var |
| Network | Curl the external endpoint from a CI runner | DNS, firewall, or rate limit |
| OS/arch | `uname -a` locally vs `runs-on: ubuntu-latest` | Path case sensitivity, signals |
| File I/O speed | Check if test has timing assumptions | CI shared storage is slower |

**Confirmation test:** Add `print(os.environ)` to the test (temporarily) and compare CI output
to local output. The delta is the root cause.

**Key CI-specific timing delta:** On GitHub Actions shared runners, tasks that take 200ms locally
can take 800ms–2s under concurrent job load. Any test with a sleep under 3 seconds is risky.

---

## Heuristic 3 — "Passes When Run Alone, Fails in Suite"

**Observation:** `pytest tests/path/test.py::test_fn -xvs` always passes. `pytest tests/` sometimes fails.

**What it points to:** Ordering bug — another test is polluting shared state.

**Diagnosis:**

```bash
# Step 1: capture the failing seed
pytest tests/ --randomly-seed=random -x -v 2>&1 | head -3
# Output: "Using --randomly-seed=12345"

# Step 2: reproduce with that seed
pytest tests/ --randomly-seed=12345 -x -v

# Step 3: find which test runs immediately before the failing test
pytest tests/ --randomly-seed=12345 -v --collect-only 2>&1 | grep -B5 "test_fn"

# Step 4: run just those two tests in order to confirm
pytest tests/path/to/suspect_test.py tests/path/to/test.py -xvs

# Step 5: find what shared state the suspect test modifies
grep -n "global\|module\|cache\|singleton\|os.environ\|monkeypatch" tests/path/to/suspect_test.py
```

**Common shared state sources:**

- Django/SQLAlchemy: database rows not rolled back (especially with `transaction=True`)
- Python: module-level singletons (`_cache = {}` at module scope)
- Environment variables: `os.environ["KEY"] = "value"` without cleanup
- pytest fixtures with wrong scope: `scope="module"` or `scope="session"` when state is mutated
- Class-level variables in test classes: `class TestFoo: shared_list = []`
- Django signals: signal handler registered once, fires on every subsequent test

**Cleanup patterns:**

```python
# Pytest: use autouse fixture with yield for guaranteed cleanup
@pytest.fixture(autouse=True)
def reset_cache():
    yield
    from myapp import cache
    cache.clear()

# Pytest: monkeypatch for env vars (auto-reverts after test)
def test_something(monkeypatch):
    monkeypatch.setenv("KEY", "value")

# Django: use TestCase.setUp/tearDown or @pytest.mark.django_db (auto-rollback)
```

---

## Heuristic 4 — "Always Fails at the Same Time of Day"

**Observation:** CI consistently fails in overnight runs (00:00–06:00) but passes during business hours.

**What it points to:** Cron job or external dependency with time-of-day behavior (rate limits
reset at midnight, scheduled maintenance windows, different API tiers for off-peak hours).

**Diagnosis:**

```bash
# Find real external calls in the test
grep -rn "requests\.\|httpx\.\|urllib\.\|http.Get\|fetch(" tests/

# Check if the code under test calls a third-party API
grep -rn "api_key\|API_KEY\|BASE_URL\|EXCHANGE_RATE\|WEATHER\|STRIPE" src/

# Check for date-dependent logic in the test itself
grep -rn "datetime.now\|date.today\|time.localtime\|strftime" tests/
```

**Common causes:**

- Free-tier API: rate limit resets at midnight UTC — tests that run at 00:01 UTC hit the reset
  and get 429 errors while the previous day's limit was not exhausted
- Scheduled maintenance: third-party API has documented 02:00–04:00 UTC maintenance window
- Time-zone-dependent logic: `datetime.now()` returns different date in UTC vs local time at
  midnight, causing date-comparison assertions to fail

**Fix:** Never call real external APIs in tests that run in automated CI. Mock the external call.
If the integration must be tested, use a dedicated `integration` test suite that runs separately
with real credentials and accepts a higher failure tolerance.

---

## Heuristic 5 — Detecting asyncio Timing Bugs

**Observation:** Test uses `async def` and `await`. Assertion fails with a value that looks
"almost right" (e.g., a counter that is 1 instead of 2, or a list with one item instead of two).

**What it points to:** Asyncio task not awaited before assertion, or tasks completing in
non-deterministic order.

**Pattern search:**

```python
# Find unawaited tasks
grep -n "asyncio.create_task\|asyncio.ensure_future\|loop.create_task" tests/

# Find assertions that run after task creation without explicit await
# (manual review required — search for create_task not followed by await)
```

**Common asyncio flakiness patterns:**

```python
# BROKEN: task created but not awaited — runs after assertion sometimes
async def test_counter():
    counter = Counter()
    asyncio.create_task(counter.increment())   # task may not run before assertion
    asyncio.create_task(counter.increment())
    assert counter.value == 2                  # FLAKY: may be 0, 1, or 2

# FIXED: await all tasks explicitly
async def test_counter():
    counter = Counter()
    t1 = asyncio.create_task(counter.increment())
    t2 = asyncio.create_task(counter.increment())
    await asyncio.gather(t1, t2)               # guarantees both complete
    assert counter.value == 2                  # deterministic

# BROKEN: asyncio.sleep(0) used as a "yield" — unreliable
async def test_event():
    event = asyncio.Event()
    asyncio.create_task(trigger_event(event))
    await asyncio.sleep(0)                     # FLAKY: may not be enough cycles
    assert event.is_set()

# FIXED: wait for the condition explicitly
async def test_event():
    event = asyncio.Event()
    asyncio.create_task(trigger_event(event))
    await asyncio.wait_for(event.wait(), timeout=5.0)  # waits for event, not a fixed delay
    assert event.is_set()
```

**Test loop isolation:** Each test must use a fresh event loop. Configure in `pytest.ini`:

```ini
[pytest]
asyncio_mode = auto
```

Without this, event loop state leaks across tests in some versions of `pytest-asyncio`.

---

## Heuristic 6 — Detecting Database Transaction Leaks Between Tests

**Observation:** A test that reads from the database returns unexpected rows. The test passes
when run first in the suite but fails when run after other tests.

**Diagnosis:**

```python
# Find tests that use transaction=True in Django
grep -rn "transaction=True" tests/

# Find tests that commit explicitly
grep -rn "db.session.commit\|connection.commit\|transaction.commit\|cursor.execute" tests/

# Find tests that create fixtures with session scope that modify DB state
grep -rn "scope.*session\|scope.*module" conftest.py

# Find tests that use raw SQL without going through the ORM's rollback mechanism
grep -rn "execute.*INSERT\|execute.*UPDATE\|execute.*DELETE" tests/
```

**Key insight for Django:** `@pytest.mark.django_db` wraps each test in a transaction and rolls
it back automatically. But `@pytest.mark.django_db(transaction=True)` commits the transaction —
any rows created persist until explicitly deleted. Tests that create rows with `transaction=True`
must delete them in teardown.

**Key insight for SQLAlchemy:** `db.session.rollback()` in teardown does not help if the session
was auto-committed. Use `db.session.begin()` at the start of each test and ensure rollback is
called in a `finally` block.

**Fix pattern:**

```python
# SQLAlchemy: proper transaction isolation per test
@pytest.fixture
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()   # always rollback, even on test failure
    connection.close()
```

---

## Heuristic 7 — pytest-randomly vs Ordering Bugs

**Observation:** The test suite passes with the default pytest ordering but fails with
`pytest-randomly` installed. Or: fails on CI (which uses a fixed random seed) but passes locally.

**What it points to:** The test suite has an ordering dependency that has been masked by
a consistent execution order. The tests pass "by accident" because they always run in the same
sequence.

**How to use pytest-randomly as a diagnostic tool:**

```bash
# Install
pip install pytest-randomly

# Find a failing seed
pytest tests/ --randomly-seed=random -x 2>&1 | grep "seed="
# Note the seed number

# Reproduce with that seed
pytest tests/ --randomly-seed=<seed> -x

# Use binary search to find the culprit test
# Run first half of tests before the failing test
pytest tests/ --randomly-seed=<seed> -x --co -q | head -50 > /tmp/first_half.txt
pytest --collect-only -q | grep -f /tmp/first_half.txt | xargs pytest tests/path/to/failing.py -x

# When the culprit test is identified, run them in order to confirm
pytest tests/path/to/culprit.py tests/path/to/failing.py -xvs
```

**Prevention:** Add to CI on every PR:

```yaml
# .github/workflows/test.yml
- name: Run tests with randomized order
  run: pytest tests/ --randomly-seed=random -x
```

---

## Heuristic 8 — Detecting Thread Safety Issues in Tests

**Observation:** Test creates threads explicitly or tests code that creates threads. The assertion
value varies between runs — sometimes correct, sometimes off by one or completely wrong.

**Pattern search:**

```python
# Find thread creation
grep -n "threading.Thread\|concurrent.futures\|ThreadPoolExecutor\|multiprocessing" tests/

# Find shared mutable state accessed from threads
grep -n "global\|nonlocal" tests/path/to/test.py
```

**Common thread safety failure patterns:**

```python
# BROKEN: counter incremented from multiple threads without lock
def test_concurrent_counter():
    counter = {"value": 0}

    def increment():
        for _ in range(1000):
            counter["value"] += 1   # NOT atomic — read-modify-write race

    threads = [threading.Thread(target=increment) for _ in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()

    assert counter["value"] == 10_000   # FLAKY: will be less due to lost updates

# FIXED: use threading.Lock
def test_concurrent_counter():
    counter = {"value": 0}
    lock = threading.Lock()

    def increment():
        for _ in range(1000):
            with lock:
                counter["value"] += 1

    threads = [threading.Thread(target=increment) for _ in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()

    assert counter["value"] == 10_000   # deterministic
```

**Detection approach:** Run the test with `--count=50` (using `pytest-repeat`) and look for
the failure rate. If the failure rate is proportional to the number of iterations, it is a race
condition.

```bash
pip install pytest-repeat
pytest tests/path/to/test.py::test_fn --count=50 -x
```

**For Go tests:** Run with the race detector enabled:

```bash
go test ./... -race -count=10
```

The race detector will report the exact memory locations and goroutines involved in the data race,
with stack traces for all threads that accessed the shared variable. This is the definitive tool
for Go concurrency bugs.

---

## Quick Reference Card

| Symptom | Most likely type | First command to run |
|---------|-----------------|---------------------|
| Passes alone, fails in suite | Ordering | `pytest --randomly-seed=random -x` |
| Fails only in CI | Environment | `diff local-env ci-env; compare parallelism` |
| Failure message varies | Concurrency/External | Check for unawaited tasks, real HTTP calls |
| Fails more under `-n auto` | Resource contention | Search for hardcoded ports and shared files |
| Always fails at same assertion, varying timing | Timing | Search for `time.sleep` |
| Passes first run, fails second run | Resource leak | Check teardown/cleanup |
| Fails at night only | External dependency | Check API rate limits and cron windows |
| Assertion off by small amount | Thread safety / race | Run with `-race` or add lock |
