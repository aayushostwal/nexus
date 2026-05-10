---
name: nexus-testing
description: >
  Use this skill when tests are flaky, intermittently failing, or the test suite is unreliable.
  Trigger phrases: "my test is flaky", "tests fail randomly", "test passes locally but fails in CI",
  "non-deterministic test failure", "test suite is unstable", "this test fails 1 in 5 times",
  "why does this test randomly fail", "investigate test flakiness", "fix flaky tests",
  "test race condition", "timing-dependent test failure". Also trigger when CI shows intermittent
  red builds that pass on retry, or when a test has been marked skip/xfail without investigation.
  When in doubt, use this skill.
---

# Nexus Flaky Test Root Cause Analyzer

A structured engineering system for diagnosing, isolating, and permanently eliminating
non-deterministic test failures. This is not a retry wrapper — it is a root cause investigation
protocol that treats flakiness as a first-class defect.

---

## Metadata

```
name:             nexus-testing
category:         testing / quality
required_context: test file path, failure frequency, CI log or local output, stack trace if available
expected_inputs:  test name, test framework (pytest/jest/go test/etc), failure pattern description,
                  environment where it fails (local / CI / both), reproduction rate estimate
expected_outputs: flakiness type classification, reproduction steps, root cause statement (one sentence),
                  narrowest fix with verification command, prevention recommendation
```

---

## Skill Philosophy

**Flaky tests are more dangerous than consistently failing tests.**

A test that always fails is immediately visible and blocks the pipeline until fixed. A flaky test
corrupts trust in the entire test suite: engineers start retrying instead of investigating, CI
policies grow "allow N retries" rules, and real regressions hide in the noise of known-flaky tests.

Key principles:

1. **Never treat flakiness as acceptable.** A test that fails 1-in-20 runs is failing 1-in-20 times.
   That is not a test — it is a false alarm factory.
2. **A retry without investigation is not a fix.** Retrying a flaky test means shipping unknown risk.
3. **The fix must address the root cause, not suppress the symptom.** Removing a `time.sleep()`
   without fixing the race condition it was masking makes the test fail even more often.
4. **Never mark a test `xfail` or `skip` without a linked issue and expiry date.** Silent skips
   accumulate into untested code paths.
5. **Flakiness is a signal about production risk.** A test that races in CI often reflects a real
   concurrency hazard in the production system — fixing the test may also require fixing the code.

---

## Context Acquisition

Before any investigation step, collect these signals. Do not proceed without them.

### Required signals

| Signal | How to collect |
|--------|---------------|
| Failure rate | "How often does it fail? 1/5 runs? 1/100?" — estimate from CI history |
| Stack trace | Full trace from a failing run — verbatim, not paraphrased |
| Test name and file path | Exact path: `tests/users/test_create.py::test_create_user` |
| Framework and version | `pytest --version`, `jest --version`, `go version` |
| CI vs local | Does it fail only in CI, only locally, or both? |
| Parallelism config | Is the test suite run in parallel? (`-n auto`, `--workers`, `t.Parallel()`) |
| Recent changes | `git log --oneline -10` on the test file and files it imports |

### Environment delta checklist (CI vs local)

If it fails only in CI, diff these before reading any code:

- Runtime version: `python --version`, `node --version`, `go version`
- OS/arch: Ubuntu vs macOS — file path casing, `/proc` availability, signals differ
- Parallelism: CI often runs `pytest -n auto`; local often runs single-threaded
- Clock and timezone: `TZ` env var, NTP sync state — affects time-dependent logic
- External network: CI may not have internet access or may have different DNS
- Env vars: compare `.env.example` to CI secrets — missing vars silently produce defaults
- File system: CI runners often have slower I/O — timeouts that pass locally fail under load
- Docker layer caching: stale image may pin an older dep version

---

## Execution Workflow

### Step 1 — Classify the Flakiness Type

Identify which category applies before any investigation. A test can belong to multiple categories —
pick the primary cause first, then check for secondary causes.

| Type | Signature | Primary mechanism |
|------|-----------|------------------|
| Ordering | Fails when run after specific other tests; passes alone | Shared mutable state not reset between tests |
| Timing | Fails on slow machines or under load; passes immediately in isolation | Hard-coded delays, polling without backoff, wall-clock assumptions |
| Resource contention | Fails when suite is run in parallel; passes single-threaded | Port conflicts, file locks, shared temp dirs, DB row locks |
| Environment | Fails in CI, passes locally; or fails on specific OS/arch | Runtime delta, missing env var, OS-specific behavior |
| External dependency | Fails with network errors, connection refused, or timeouts | Real HTTP calls, real DB, DNS resolution, third-party API |
| Concurrency | Fails with assertion errors that vary each run; stack trace differs | Thread or async race, missing lock, event loop ordering |

**Classification heuristic:**

```
Does it fail when run alone (pytest tests/foo.py::test_x -xvs)?
  YES → Timing, resource, external dependency, or concurrency
  NO  → Ordering (shared state from another test is the cause)

Does it fail only in CI?
  YES → Environment delta (check clock, parallelism, network, OS)
  NO  → Reproducible locally — continue to Step 2

Does the failure message vary between runs?
  YES → Concurrency or external dependency (non-deterministic output)
  NO  → Timing or resource (deterministic trigger, variable timing)

Does it fail more often under load (parallel test run)?
  YES → Resource contention or concurrency
  NO  → Timing (absolute delay) or external dependency
```

Record your classification as: `Primary: <type> | Secondary: <type or none>`

### Step 2 — Reproduce the Failure

**Minimum 5 runs required before investigation.** A single failure run is not enough evidence.
Confirm the test is truly flaky and not consistently failing under a specific condition.

**Isolation strategy by type:**

```bash
# Run alone, verbose, stop on first failure
pytest tests/path/to/test_file.py::test_function_name -xvs

# Run in a randomized order to surface ordering bugs
pytest tests/ --randomly-seed=last -x

# Run in parallel to surface contention
pytest tests/ -n auto -x

# Run N times to confirm flakiness rate
for i in {1..20}; do pytest tests/path/to/test.py::test_fn -x --tb=no -q; done | grep -c FAILED
```

For Go:
```bash
# Run 20 times
go test ./pkg/... -run TestFunctionName -count=20 -v 2>&1 | grep -E "PASS|FAIL"
```

For Jest:
```bash
# Run with --runInBand to isolate from parallelism
jest --testNamePattern "test name" --runInBand --verbose
```

**Record:**
- Failure count out of N runs: `X/20 failed`
- Whether failure reproduces alone or only with other tests running
- Whether failure rate changes under parallelism (`-n auto` vs single-threaded)
- The exact stack trace from a failing run (capture one verbatim)

If you cannot reproduce after 20 runs: the test may have been fixed by a recent commit,
or the trigger condition is rare. Check `git log` for recent changes to the test file.

### Step 3 — Root Cause Identification

Starting from the failure type classified in Step 1, apply the matching investigation path.

**For Ordering (shared state):**

```bash
# Find what global/module-level state the test reads or writes
grep -n "global\|module\|class-level\|@classmethod\|setUp\|tearDown\|autouse" tests/path/to/test_file.py

# Find fixtures that don't clean up
grep -n "yield\|finally\|rollback\|teardown" conftest.py

# Run with pytest-randomly and capture the seed that triggers the failure
pytest tests/ --randomly-seed=random -x -v 2>&1 | head -5  # prints seed used
pytest tests/ --randomly-seed=<seed> -x -v                  # reproduce with that seed
```

Look for: database rows not rolled back, in-memory caches not cleared, module-level singletons
mutated, class-level state shared across test methods, fixtures with `scope="session"` that
modify state.

**For Timing:**

```bash
# Find all time-based calls
grep -rn "time.sleep\|asyncio.sleep\|setTimeout\|setInterval\|time.Now\|datetime.now" tests/

# Find polling loops without proper backoff
grep -rn "while.*retry\|for.*attempt\|poll\|wait_for" tests/
```

Look for: `time.sleep(N)` where N is a fixed delay insufficient on slow machines, polling loops
with no timeout, wall-clock assertions like `assert elapsed < 1.0`, tests that assume an async
operation completes in a fixed time window.

**For Resource contention:**

```bash
# Find hardcoded ports
grep -rn "port.*=.*[0-9]\{4,5\}\|localhost:[0-9]\{4,5\}" tests/

# Find shared temp files or directories
grep -rn "tmp\|tempfile\|/tmp\|mkdtemp" tests/

# Find database connection setup without transaction isolation
grep -rn "engine\|connection\|cursor\|transaction" tests/conftest.py
```

Look for: hardcoded port numbers shared across parallel test workers, shared temp directories
without per-test isolation, DB connections without rollback in teardown, file locks not released
on test failure.

**For Environment:**

Diff these between local and CI — do not read code until the delta is identified:

```bash
# Check runtime version used in CI
cat .github/workflows/*.yml | grep -E "python-version|node-version|go-version"

# Compare env vars
cat .env.example | sort > /tmp/local_env.txt
# Then compare to CI secrets list in your CI config
```

**For External dependency:**

```bash
# Find any real network calls in tests
grep -rn "requests\.\|httpx\.\|fetch(\|urllib\.\|http.Get\|axios" tests/

# Find real DB connections (not mocked)
grep -rn "psycopg2\|pymysql\|sqlalchemy.create_engine\|pg.connect\|mysql.connect" tests/
```

Look for: tests making real HTTP calls without mocking, tests connecting to real databases with
shared state, tests that depend on third-party APIs that have rate limits or outages.

**For Concurrency:**

```bash
# Find thread creation
grep -rn "threading\.\|Thread(\|asyncio\.\|await\|Promise\|goroutine\|go func" tests/

# Find missing locks or synchronization
grep -rn "threading.Lock\|asyncio.Lock\|sync.Mutex\|RLock" tests/
```

Look for: assertions on shared variables mutated from multiple threads, asyncio tasks that
complete in non-deterministic order, missing `await` on coroutines, `asyncio.create_task()`
without `await task` before assertion.

**State the root cause as exactly one sentence:**

> *"test_X fails intermittently because Y when Z."*

If you cannot state it in one sentence, the root cause is not yet identified. Narrow further.

### Step 4 — Fix with Verification

Apply the **narrowest** fix that eliminates the root cause. Do not improve unrelated test code.

**Fix patterns by type:**

| Type | Wrong fix | Correct fix |
|------|-----------|-------------|
| Ordering | Delete the interfering test | Add teardown that resets shared state after each test |
| Timing | Increase `time.sleep(N)` | Replace sleep with `wait_for(condition, timeout=N)` |
| Resource | Assign a different port manually | Use `port=0` (OS assigns free port) or a port fixture |
| Environment | Hard-code CI environment locally | Parametrize config via env var; test both modes in CI |
| External | Add retry logic to the test | Mock the external call; test real integration separately |
| Concurrency | Add sleep before assertion | Use proper synchronization (lock, event, barrier, join) |

**Verification requirement:**

The fix is not done until the test passes in N consecutive runs where N is:

| Flakiness rate | Required consecutive passes |
|---------------|----------------------------|
| Fails 1/5 (20%) | 20 consecutive passes |
| Fails 1/20 (5%) | 50 consecutive passes |
| Fails 1/100 (1%) | 100 consecutive passes or statistical argument |

Run the verification command and record its output:

```bash
# Verify fix: run 20 consecutive times, confirm 0 failures
for i in {1..20}; do pytest tests/path/to/test.py::test_fn -x --tb=short -q; done
```

### Step 5 — Prevention and Monitoring

After fixing, put guardrails in place so the same class of flakiness does not return.

**For ordering:**
- Add a linting rule or CI check: `pytest --randomly-seed=random` on every PR
- Add fixture teardown review to PR template

**For timing:**
- Add a utility function `wait_for(condition, timeout, poll_interval)` to the test helpers
- Grep CI on every push for new `time.sleep` calls in tests: flag for review

**For resource contention:**
- Add a shared `free_port()` fixture to conftest.py
- Add a shared `tmp_dir()` fixture that creates per-test temp directories

**For external dependency:**
- Add a CI rule: no real network calls in unit tests (`--block-network` in pytest-socket)
- Separate integration tests into a separate pytest mark (`@pytest.mark.integration`)

**For concurrency:**
- Add a shared `AsyncEventLoop` fixture that resets between tests
- Enforce `asyncio_mode = "auto"` in pytest.ini for consistent async handling

---

## Engineering Heuristics

See `heuristics/flakiness-heuristics.md` for the full decision tree.

Quick reference:

- **Fails on retry without code changes** → environment leak or resource contention
- **Fails only in CI** → parallelism, clock, network, or OS delta — not your test logic
- **Passes when run alone** → ordering — another test is polluting shared state
- **Failure message varies** → concurrency or external dependency — the trigger is non-deterministic
- **Always fails at the same assertion, varying delay** → timing — the sleep is too short
- **Fails more under load** → resource contention or concurrency at scale

---

## Failure Modes of This Skill

**False positive — test looks flaky but is consistently failing:**
- Cause: only ran the test once and it failed; did not confirm flakiness with N runs
- Mitigation: always run at least 5 times in isolation before classifying as flaky

**Wrong root cause classification:**
- Cause: classified as Timing when it was actually Ordering; applied wrong fix
- Mitigation: after classification in Step 1, confirm with isolation test (run alone vs run after others)
- Signal: fix is applied but test still fails; revisit classification

**Fix masks the symptom instead of addressing the root cause:**
- Cause: increased sleep duration, added retry, or mocked at too high a level
- Signal: test now passes but underlying code still has the race/state issue
- Mitigation: trace fix back to root cause sentence — if the fix does not directly address the
  root cause statement, it is a bandage

**Confidence inflation — declaring fix complete without enough runs:**
- Cause: ran the test 5 times and it passed; declared it fixed
- For 5% flakiness: 5 passing runs has ~77% probability of being a true fix (not luck)
- Mitigation: follow the consecutive-pass table in Step 4

---

## Output Contract

Every flaky test investigation must close with this report. Fill every field.

```
## Flaky Test Report

**Test:**                [full path + test name]
**Framework:**           [pytest / jest / go test / other]
**Failure Rate:**        [X/N runs — e.g., 3/20 runs (15%)]
**Primary Type:**        [Ordering | Timing | Resource | Environment | External | Concurrency]
**Secondary Type:**      [same options, or "none"]
**Root Cause:**          [one sentence — "test_X fails because Y when Z"]
**Why It Happens:**      [2-3 sentences — mechanism, not just restatement of symptom]
**Fix Applied:**         [exact file path + line numbers + change description]
**Verification:**        [command run + result — "20/20 passes" or "0 failures in 50 runs"]
**Prevention:**          [what guardrail stops this class of bug from returning]
**Follow-up Needed:**    [yes/no — if yes, describe — e.g., "production race condition also exists in src/worker.py"]
```

---

## Anti-Patterns

See `anti-patterns/common-mistakes.md` for the full list.

Quick reference:
- Do not add `time.sleep()` to fix timing — it masks the race and breaks on slower machines
- Do not mark `xfail` or `skip` without a linked issue and a target fix date
- Do not retry the test in CI without investigating — retries hide failures, they do not fix them
- Do not run the test in isolation to "confirm" flakiness — isolation is step 2, not the final answer
- Do not close the investigation without a reproduction command in the ticket

---

## Sub-documents

| Document | Purpose |
|----------|---------|
| `examples/production-scenarios.md` | Three annotated real-world flaky test cases with full code |
| `checklists/investigation-checklist.md` | Pre/during/post checklists for structured investigation |
| `heuristics/flakiness-heuristics.md` | Decision trees and pattern matchers for each flakiness type |
| `anti-patterns/common-mistakes.md` | Common wrong fixes and why they fail |
| `validation/output-validation.md` | How to confirm the fix is permanent, confidence scoring |
