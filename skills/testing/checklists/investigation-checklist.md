# Flaky Test Investigation Checklist

Use this checklist at each phase of investigation. Check off each item before moving to the next
phase. Do not skip items — each exists to prevent a known class of wrong diagnosis.

---

## Phase 1 — Pre-Investigation (Gather Before You Read Any Code)

### Failure Signal Collection

- [ ] Captured the full stack trace verbatim from a failing run (not paraphrased)
- [ ] Recorded the exact test name and file path: `tests/path/to/file.py::test_function_name`
- [ ] Recorded the test framework and version: `pytest 7.4.0`, `jest 29.6`, `go 1.21`
- [ ] Confirmed the failure rate: ran the test N times, failed M times (`M/N`)
- [ ] Noted whether the failure message is consistent or varies between runs
- [ ] Noted the exact CI job name and step where the failure appears

### Environment Delta (CI vs Local)

- [ ] Compared runtime version: `python --version`, `node --version`, `go version` (local vs CI YAML)
- [ ] Compared OS/arch: local macOS vs CI Ubuntu — check for path casing, `/proc`, signals
- [ ] Confirmed parallelism setting: local single-threaded? CI uses `-n auto` or `--parallel N`?
- [ ] Checked timezone: `TZ` env var in CI vs local — matters for any time-based logic
- [ ] Compared env vars: `.env.example` vs CI secrets — any required var missing in CI?
- [ ] Checked network access: does the test make real HTTP/DB calls that CI might block?
- [ ] Noted file system speed: CI runners have shared storage — file I/O is slower than local SSD

### Recent Changes

- [ ] Ran `git log --oneline -10` on the test file — any recent edits?
- [ ] Ran `git log --oneline -10` on the source files the test imports
- [ ] Ran `git log --oneline -10` on `conftest.py` or fixture files
- [ ] Checked for recent dependency changes: `git diff HEAD~5 -- requirements.txt package.json go.mod`
- [ ] Confirmed when the test last passed (last passing CI run or commit SHA)

### Initial Classification (Before Running Anything)

- [ ] Formed a hypothesis: what type of flakiness is this? (Ordering / Timing / Resource / Environment / External / Concurrency)
- [ ] Documented the hypothesis: "I believe this is X because Y"

---

## Phase 2 — During Investigation (Reproduction and Isolation)

### Reproduction

- [ ] Run the test in isolation (alone, verbose): `pytest tests/path/to/test.py::test_fn -xvs`
  - Result: passes / fails / fails consistently
- [ ] Run the test at least 5 times alone to confirm flakiness rate in isolation
  - Result: `X/5 failed in isolation`
- [ ] Run the test with other tests (full suite or known neighbors)
  - Result: `X/5 failed in suite`
- [ ] Compared isolation rate vs suite rate — does running with others change the failure rate?
  - If yes: ordering or resource contention
  - If no: timing, external dependency, or concurrency

### Ordering Investigation (if passes alone but fails in suite)

- [ ] Ran with `--randomly-seed=random` and captured the failing seed
- [ ] Reproduced with the specific seed: `pytest --randomly-seed=<seed> -x`
- [ ] Identified which other test(s) cause the failure when run before this test
- [ ] Found the shared state that the other test leaves behind (DB rows, module var, file, cache)
- [ ] Confirmed teardown exists and runs: `grep -n "yield\|finally\|teardown\|cleanup" conftest.py`

### Timing Investigation (if fails on slow machines or under load)

- [ ] Located all `time.sleep()` calls in the test and its fixtures
- [ ] Located all polling loops without explicit timeout
- [ ] Measured actual operation duration on CI: added timing logs or captured timestamps from logs
- [ ] Confirmed the fixed delay is the bottleneck (not an unrelated slow operation)

### Resource Contention Investigation (if fails under parallel execution)

- [ ] Confirmed failure rate increases with `-n auto` vs single-threaded
- [ ] Identified the shared resource: port / file / temp dir / DB table / cache key
- [ ] Found the hardcoded resource identifier (port number, file path, table name)
- [ ] Confirmed no per-worker isolation exists for the shared resource

### Concurrency Investigation (if failure message varies or assertion values vary)

- [ ] Identified all threads / tasks / goroutines created in the test or the code under test
- [ ] Found the shared variable that is mutated from multiple goroutines/tasks/threads
- [ ] Confirmed missing synchronization: no lock, no `await`, no barrier, no join
- [ ] Checked if `asyncio.create_task()` results are awaited before assertions

### External Dependency Investigation (if fails with network errors or status codes)

- [ ] Found the real HTTP/DB/network call in the test or code under test
- [ ] Confirmed the call goes to a real external endpoint (not a mock)
- [ ] Checked the external service's SLA and rate limits
- [ ] Checked if the failure correlates with time of day or CI load

### Root Cause Statement

- [ ] Stated the root cause in exactly one sentence: "test_X fails intermittently because Y when Z"
- [ ] Verified the sentence names a specific mechanism, not a category: not "it's a timing issue"
  but "the 2-second sleep is insufficient on CI runners where file processing takes 3-5 seconds"

---

## Phase 3 — Fix Validation (Confirm Flakiness is Gone)

### Fix Application

- [ ] Applied the fix to the root cause only — no unrelated changes
- [ ] Traced the fix back to the root cause statement — does the fix directly address it?
- [ ] Verified the fix does not suppress the symptom instead of addressing the cause
  (e.g., adding retry is suppression; removing the hardcoded delay is a fix)

### Required Consecutive Passes

Based on observed failure rate, confirm this many consecutive passes before closing:

| Observed failure rate | Required passes before closing |
|----------------------|-------------------------------|
| > 20% (fails 1/5) | 20 consecutive passes |
| 5–20% (fails 1/5 to 1/20) | 30 consecutive passes |
| 1–5% (fails 1/20 to 1/100) | 50 consecutive passes |
| < 1% (fails < 1/100) | 100 passes OR statistical argument with CI history |

- [ ] Ran the required number of consecutive passes: `for i in {1..N}; do <test command>; done`
- [ ] Recorded the result: `M/N passed` — must be `N/N` (zero failures)
- [ ] Ran in the environment where the failure was most frequent (CI or parallel)

### Regression Check

- [ ] Ran the full test suite for the affected module — confirm no new failures introduced
- [ ] Ran any integration tests that use the same fixture or shared resource
- [ ] Confirmed the fix does not change behavior visible to callers of the production code
  (if it does: update the relevant unit tests to cover the new behavior)

### Prevention in Place

- [ ] Added or updated teardown to reset the shared state (for ordering bugs)
- [ ] Added `wait_for(condition, timeout)` helper to replace `time.sleep` (for timing bugs)
- [ ] Added a `free_port()` fixture or used port `0` (for resource contention bugs)
- [ ] Mocked the external service (for external dependency bugs)
- [ ] Added proper synchronization (for concurrency bugs)
- [ ] Added a CI check that will catch the same class of bug on future PRs

### Report Complete

- [ ] Filled in every field of the Flaky Test Report (see SKILL.md Output Contract)
- [ ] Added the reproduction command to the ticket or PR description
- [ ] Updated the PR template or onboarding docs if a new testing pattern was established
- [ ] Closed or resolved any `xfail` / `skip` markers that this fix makes obsolete
