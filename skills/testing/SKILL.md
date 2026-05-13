---
name: nexus-testing
description: >
  Use for flaky or nondeterministic tests, especially local-vs-CI inconsistencies.
  Trigger on intermittent failures, race/timing symptoms, retry-only greens,
  or unexplained skip/xfail markers. Output should isolate reproducible cause, narrowest durable fix,
  and prevention guidance. When in doubt, use this skill.
---

# Nexus Flaky Test Root Cause Analyzer

Structured protocol for diagnosing, isolating, and permanently eliminating non-deterministic test
failures. Not a retry wrapper — treats flakiness as a first-class defect.

```
name:             nexus-testing
category:         testing / quality
required_context: test file path, failure frequency, CI log or local output, stack trace if available
expected_inputs:  test name, framework, failure pattern, environment (local/CI/both), reproduction rate
expected_outputs: flakiness type, reproduction steps, root cause (one sentence), narrowest fix +
                  verification command, prevention recommendation
```

## Core Principles

1. A test failing 1-in-20 runs is still failing — it is a false alarm factory.
2. A retry without investigation ships unknown risk.
3. Fix the root cause, not the symptom — masking a race condition makes it fail more often.
4. Never mark `xfail`/`skip` without a linked issue and expiry date.
5. Test flakiness often mirrors a real production concurrency or data integrity hazard.

---

## Step 1 — Collect Context

Required before any investigation:

| Signal | How |
|--------|-----|
| Failure rate | Estimate from CI history (1/5? 1/100?) |
| Stack trace | Full verbatim trace from a failing run |
| Test path | Exact: `tests/users/test_create.py::test_create_user` |
| Framework + version | `pytest --version`, `jest --version`, `go version` |
| CI vs local | Fails only in CI, only locally, or both? |
| Parallelism config | `-n auto`, `--workers`, `t.Parallel()`? |
| Recent changes | `git log --oneline -10` on test file and its imports |

**If CI-only failure**, diff these before reading code: runtime version, OS/arch, parallelism,
`TZ` / NTP, network access, env vars (missing vars silently produce defaults), I/O speed, Docker layer cache.

---

## Step 2 — Classify Flakiness Type

| Type | Signature | Mechanism |
|------|-----------|-----------|
| Ordering | Fails after specific other tests; passes alone | Shared mutable state not reset |
| Timing | Fails on slow machines or under load | Hard-coded delays, no backoff, wall-clock assertions |
| Resource | Fails parallel, passes single-threaded | Port conflicts, shared temp dirs, DB row locks |
| Environment | Fails in CI only | Runtime delta, missing env var, OS behavior |
| External | Network errors, connection refused, timeouts | Real HTTP/DB calls in test |
| Concurrency | Assertion error varies each run; stack trace differs | Thread/async race, missing lock |

**Heuristic:**
- Fails when run alone → Timing / Resource / External / Concurrency
- Passes when run alone → Ordering (shared state from another test)
- Fails only in CI → Environment delta
- Failure message varies → Concurrency or External
- Fails more under parallel load → Resource contention or Concurrency

Record: `Primary: <type> | Secondary: <type or none>`

---

## Step 3 — Reproduce

Run at minimum 5 times before investigating. Confirm flaky, not consistently failing.

```bash
pytest tests/path/to/test.py::test_fn -xvs                          # alone, verbose
pytest tests/ --randomly-seed=last -x                                # ordering check
pytest tests/ -n auto -x                                             # contention check
for i in {1..20}; do pytest tests/path/to/test.py::test_fn -x --tb=no -q; done | grep -c FAILED
```

```bash
go test ./pkg/... -run TestFn -count=20 -v 2>&1 | grep -E "PASS|FAIL"  # Go
jest --testNamePattern "name" --runInBand --verbose                       # Jest
```

Record: X/N failed, fails alone or suite-only, rate under parallelism, verbatim stack trace.

---

## Step 4 — Identify Root Cause

**Ordering:** find unreset shared state — `grep -n "global\|@classmethod\|setUp\|tearDown\|autouse"`;
look for DB rows not rolled back, in-memory caches, module-level singletons, `scope="session"` fixtures.

**Timing:** `grep -rn "time.sleep\|asyncio.sleep\|setTimeout"` and polling loops without timeout;
look for fixed delays insufficient on slow machines, wall-clock assertions.

**Resource:** `grep -rn "port.*=[0-9]\{4,5\}\|localhost:[0-9]\{4,5\}"` and `grep -rn "tmp\|tempfile"`;
look for hardcoded ports, shared temp dirs, DB connections without rollback.

**Environment:** `cat .github/workflows/*.yml | grep -E "python-version|node-version|go-version"`;
compare env vars between local and CI.

**External:** `grep -rn "requests\.\|httpx\.\|fetch(\|http.Get"` and real DB connection strings in tests.

**Concurrency:** `grep -rn "threading\.\|asyncio\.\|goroutine"` and missing `Lock`/`Mutex`/`await`.

**State root cause as exactly one sentence:**
> *"test_X fails intermittently because Y when Z."*

If you cannot state it in one sentence, root cause is not yet identified.

---

## Step 5 — Fix

Apply the narrowest fix. Do not improve unrelated code.

| Type | Wrong fix | Correct fix |
|------|-----------|-------------|
| Ordering | Delete the interfering test | Add teardown resetting shared state after each test |
| Timing | Increase `time.sleep(N)` | Replace with `wait_for(condition, timeout=N)` |
| Resource | Manually assign different port | Use `port=0` or a `free_port()` fixture |
| Environment | Hard-code CI env locally | Parametrize via env var; test both modes in CI |
| External | Add retry in test | Mock external call; test real integration separately |
| Concurrency | Add sleep before assertion | Use lock, event, barrier, or join |

**Verification — required consecutive passes by failure rate:**

| Rate | Required passes |
|------|----------------|
| >20% | 20 consecutive passes |
| 5–20% | 30–50 consecutive passes |
| 1–5% | 50 consecutive passes |
| <1% | 100 passes or 30-day CI monitoring |

```bash
for i in {1..20}; do pytest tests/path/to/test.py::test_fn -x --tb=short -q; done
```

---

## Step 6 — Prevention

- **Ordering:** add `pytest --randomly-seed=random` to every PR; fixture teardown in PR template.
- **Timing:** add `wait_for(condition, timeout, poll_interval)` helper; flag new `time.sleep` in CI.
- **Resource:** add `free_port()` and `tmp_dir()` fixtures to conftest.py.
- **External:** enforce `--block-network` in unit tests; separate `@pytest.mark.integration`.
- **Concurrency:** shared `AsyncEventLoop` fixture; `asyncio_mode = "auto"` in pytest.ini.

---

## Output Contract

Every investigation closes with this report. Fill every field.

```
## Flaky Test Report

**Test:**             [full path + test name]
**Framework:**        [pytest / jest / go test / other]
**Failure Rate:**     [X/N runs]
**Primary Type:**     [Ordering | Timing | Resource | Environment | External | Concurrency]
**Secondary Type:**   [same options, or "none"]
**Root Cause:**       [one sentence — "test_X fails because Y when Z"]
**Why It Happens:**   [2–3 sentences — mechanism]
**Fix Applied:**      [file path + line numbers + change description]
**Verification:**     [command + result — "20/20 passes"]
**Prevention:**       [guardrail that stops this class from returning]
**Follow-up Needed:** [yes/no — if yes, describe]
```

---

## Anti-Patterns (Quick Reference)

- Do not add `time.sleep()` — masks the race, breaks on slower machines.
- Do not mark `xfail`/`skip` without a linked issue and target fix date.
- Do not retry in CI without investigating — retries hide failures.
- Do not close without a reproduction command in the ticket.
- Do not declare fixed after < required consecutive passes.

---

## Sub-documents

| Document | Purpose |
|----------|---------|
| `checklists/investigation-checklist.md` | Pre/during/post checklists for structured investigation |
| `anti-patterns/common-mistakes.md` | Common wrong fixes and why they fail |
| `validation/output-validation.md` | Fix confirmation, confidence scoring, escalation |
