# Common Mistakes When Dealing With Flaky Tests

These are the most frequent wrong approaches engineers take when they encounter a flaky test.
Each entry explains why the approach fails and what to do instead.

---

## Anti-Pattern 1 — Adding `time.sleep()` to Fix Timing Issues

### What it looks like

```python
# Test was failing because async operation didn't complete in time
async def test_message_processed():
    await send_message(queue, "hello")
    time.sleep(1)          # <-- added to "fix" the test
    assert queue.processed_count == 1
```

### Why it fails

`time.sleep(N)` waits for a fixed wall-clock interval. The test passes because on a typical
development machine with light load, `N` seconds is enough. But:

1. On a loaded CI runner, the same operation takes longer — the sleep is still insufficient
2. On a faster machine or in a future code optimization, the sleep is now wastefully long
3. The sleep masks the race condition in the production code — the code under test still has
   a timing dependency that will manifest in production under load
4. Every future developer who encounters the failure will increase the sleep — eventually the
   test suite becomes unacceptably slow

The root problem is not the delay — it is that the test is asserting a condition that depends on
an asynchronous operation completing. The fix must wait for the condition, not for time.

### What to do instead

```python
# Poll for the condition with a timeout — fast when operation is fast, correct when it's slow
async def test_message_processed():
    await send_message(queue, "hello")
    await wait_for(lambda: queue.processed_count == 1, timeout=10, poll_interval=0.1)
    assert queue.processed_count == 1

# Or use an event/signal if the code under test supports it
async def test_message_processed():
    processed_event = asyncio.Event()
    queue.on_processed = lambda: processed_event.set()
    await send_message(queue, "hello")
    await asyncio.wait_for(processed_event.wait(), timeout=10)
    assert queue.processed_count == 1
```

---

## Anti-Pattern 2 — Marking Tests as `xfail` Instead of Fixing Them

### What it looks like

```python
@pytest.mark.xfail(reason="flaky, TODO fix later")
def test_payment_webhook_processed():
    # ... test body
```

Or in Go:

```go
func TestPaymentWebhookProcessed(t *testing.T) {
    t.Skip("flaky, see JIRA-1234")
    // ... test body
}
```

### Why it fails

1. `xfail` with no linked issue and no expiry becomes permanent — "later" never comes
2. The code path tested by the skipped test is now untested in CI
3. When the production code regresses in exactly the way the test was checking, the regression
   ships undetected
4. The team gradually normalizes skipped tests — the suite accumulates dark matter: tests that
   are not running
5. The original flakiness root cause is never understood, so the same pattern is repeated

"We'll fix it later" for a flaky test means accepting unknown risk in production on every deploy.

### What to do instead

1. Never mark a test `xfail` or `skip` without a linked issue with a target date
2. If the test cannot be fixed immediately, delete it and open a ticket to add it back properly
   (a deleted test is honest — `xfail` is dishonest because it looks like coverage)
3. If you must keep it as `xfail`, add an expiry: `@pytest.mark.xfail(strict=True, reason="JIRA-1234 — fix by 2026-06-01")`
   and a CI check that fails if any `xfail` test is older than 30 days

---

## Anti-Pattern 3 — Retrying the Test in CI Without Investigating

### What it looks like

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pytest tests/ --retry=3    # or pytest-rerunfailures --reruns 3
```

Or in jest:
```json
{
  "jest": {
    "testRunnerOptions": { "retries": 2 }
  }
}
```

### Why it fails

1. Retries hide failures — the test suite shows green, but a real bug may be triggering 1-in-3
   times and being swallowed by the retry
2. The flakiness root cause is never investigated — it accumulates and gets worse over time
3. Retry configuration makes the test suite slower and more expensive (2x–4x runtime for flaky tests)
4. When a real regression is introduced that triggers the flaky condition more frequently, the
   retry count is simply increased rather than the regression being caught
5. The practice spreads — once retries are normalized, new tests are written with the same poor
   patterns because "it'll just retry anyway"

Retries are acceptable as a temporary safety net during an active incident investigation —
but they must be removed once the root cause is identified and fixed.

### What to do instead

- Treat every flaky test as a bug — open a ticket, assign it, fix it within a sprint
- Track flakiness rate per test in CI (many CI platforms have flakiness dashboards)
- Never merge a PR that increases flakiness rate
- Use `pytest-flakefinder` to identify flaky tests proactively: `pytest --flake-finder --flake-runs=50`

---

## Anti-Pattern 4 — Running the Test in Isolation to "Confirm" Flakiness as a Final Step

### What it looks like

```
Engineer: "I can't reproduce it locally. I ran the test 3 times in isolation and it passed.
           Must be something specific to CI. I'll mark it as 'known flaky'."
```

### Why it fails

Running in isolation is step 2 of the investigation (reproduction), not the final step. Passing
in isolation is important information — it tells you the flakiness type is ordering, resource
contention, or environment-specific. It does not tell you the root cause.

Failing to distinguish "passes in isolation" from "the test is not flaky" is the most common
reason flaky tests remain unfixed. The engineer mistakes absence of reproduction for absence of
the bug.

### What to do instead

When a test passes in isolation but fails in the suite:
1. Run it after other tests to find the ordering: `pytest tests/other/ tests/path/to/test.py -xvs`
2. Use `--randomly-seed` to find the seed that triggers the failure
3. Identify the test that, when run before the flaky test, causes it to fail
4. That test is contaminating shared state — the fix is to clean up after it

When a test passes locally but fails in CI:
1. Diff the environment (runtime version, parallelism, OS, env vars, network)
2. The root cause is always an environment delta — find it, do not accept "CI is different"

---

## Anti-Pattern 5 — Not Adding the Reproduction Command to the Ticket

### What it looks like

```
JIRA-1234: "test_payment_webhook is flaky"
Description: This test fails sometimes in CI. Assigning to team to investigate.
```

### Why it fails

Without a reproduction command, every engineer who picks up the ticket has to start from scratch:
re-discover the failure conditions, re-figure out the parallelism or seed that triggers it, and
re-collect the stack trace. This wasted time compounds across every handoff.

Additionally, if the ticket is picked up months later, the code may have changed enough that the
original symptoms are different — without the original reproduction command, there is no baseline.

### What to do instead

Every flaky test ticket must include:

```
Reproduction:
  # Run 20 times to confirm failure rate
  for i in {1..20}; do pytest tests/path/to/test.py::test_fn -x --tb=no -q; done | grep -c FAILED

  # Run in parallel to reproduce resource contention
  pytest tests/ -n auto -x --tb=short

  # Seed that triggers ordering bug (if known)
  pytest tests/ --randomly-seed=12345 -x -v

Observed failure rate: 3/20 runs (15%)
Failure environment: GitHub Actions Ubuntu 22.04, pytest -n auto
Stack trace from failing run:
  [paste verbatim from one failing CI run]
```

This takes 5 minutes to write and saves hours on every subsequent investigation attempt.

---

## Anti-Pattern 6 — Increasing Test Timeouts as a "Fix"

### What it looks like

```python
# Original test
@pytest.mark.timeout(5)
def test_db_write_completes():
    ...

# "Fixed" version after timeout failure
@pytest.mark.timeout(30)   # just increase it until it doesn't fail
def test_db_write_completes():
    ...
```

### Why it fails

Increasing a timeout does not fix the slowness — it hides it. The DB write that sometimes takes
6 seconds is a performance regression or a deadlock that is being masked. By increasing the
timeout, you are:

1. Accepting degraded performance silently — the test still takes 6 seconds but now "passes"
2. Making the test suite slower — every future run of this test takes up to 30 seconds to fail
3. Missing a real production issue — a DB write that sometimes takes 6 seconds is a problem for
   real users, not just for tests

### What to do instead

Investigate the performance regression:

```bash
# Profile the test to find what is slow
pytest tests/path/to/test.py::test_db_write_completes -xvs --profile

# Check for lock waits in the database
# For PostgreSQL:
SELECT pid, wait_event_type, wait_event, query FROM pg_stat_activity WHERE wait_event IS NOT NULL;

# Check for missing indexes on frequently-queried columns
EXPLAIN ANALYZE SELECT ...;
```

The timeout should remain at the original value (or a slightly higher but still strict value).
The root cause of the slowness should be fixed, not the timeout.

---

## Anti-Pattern 7 — Investigating From a Single Failing Run

### What it looks like

```
CI fails once. Engineer immediately opens the log, finds an assertion error, reads the source
code, proposes a fix, and submits a PR — all from one run's output.
```

### Why it fails

A single failing run is insufficient evidence for a flaky test investigation:

1. The stack trace from one run may be a secondary effect, not the root cause
2. A test that fails 1-in-10 runs needs multiple failing runs to confirm which assertion is
   consistently failing vs which is coincidentally failing
3. The failure in one run may be caused by a different test that happened to run before it —
   without multiple failing runs with different orderings, this cannot be detected
4. A fix applied based on one run may suppress one symptom while leaving the root cause intact

### What to do instead

Minimum evidence required before investigation:

- At least 5 runs completed
- At least 2 failing runs with stack traces captured
- Confirmed: does it fail in isolation? (run alone N times)
- Confirmed: does it fail in the same place each time? (consistent assertion vs varying)

Only after this baseline is the failure well enough characterized to begin root cause analysis.
