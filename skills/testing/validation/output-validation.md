# Output Validation

How to confirm that a flaky test fix is genuine and permanent, how to score confidence in a root
cause identification, and when to escalate rather than fix locally.

---

## Confirming the Fix Eliminated Flakiness

A fix is not confirmed until the test passes the required number of consecutive times in the
environment where the failure was most frequent. Passing once or twice after a fix is not evidence
— it is luck.

### Required Consecutive Pass Count

The required number of consecutive passes scales with the observed failure rate:

| Observed failure rate | Minimum consecutive passes | Statistical justification |
|----------------------|---------------------------|--------------------------|
| > 50% (fails most runs) | 10 consecutive passes | p(10 lucky passes \| 50% fail rate) < 0.1% |
| 20–50% (fails 1/5 to 1/2) | 20 consecutive passes | p(20 lucky passes \| 20% fail rate) < 1.2% |
| 5–20% (fails 1/5 to 1/20) | 30 consecutive passes | p(30 lucky passes \| 5% fail rate) ≈ 21% — increase to 50 |
| 1–5% (fails 1/20 to 1/100) | 50 consecutive passes | p(50 lucky passes \| 5% fail rate) ≈ 7.7% |
| < 1% (fails < 1/100) | 100 passes OR CI history showing 0 failures over 30 days | |

**Note for low-rate flakiness:** A test that fails 1-in-100 runs is very hard to confirm fixed
with local runs alone. For these cases, ship the fix and monitor CI history for 30 days. If the
test fails in that window, re-investigate.

### Verification Commands

Run these in the environment where the failure was most frequent (CI if possible, parallel if
the bug was contention-related):

```bash
# Python/pytest — run N times, count failures
N=20
failed=0
for i in $(seq 1 $N); do
  pytest tests/path/to/test.py::test_fn -x --tb=no -q || ((failed++))
done
echo "Result: $failed/$N failed"

# Python/pytest — parallel (for resource contention bugs)
pytest tests/ -n auto --count=20 --tb=short

# Go — run with race detector N times
go test ./pkg/... -run TestFunctionName -count=20 -race -v 2>&1 | grep -E "ok|FAIL"

# Jest — run in-band N times
for i in $(seq 1 20); do
  jest --testNamePattern "test name" --runInBand --passWithNoTests --silent || echo "FAILED run $i"
done
```

### Environment Match Requirement

The verification must be run in the same environment class where the failure occurred:

| Where it failed | Where to verify |
|----------------|----------------|
| CI only | Run in a CI-like environment: Ubuntu, with `-n auto`, with the same env vars |
| Parallel only | Run with `pytest -n auto` or `go test -parallel N` |
| Locally and CI | Run both locally (N passes) and push to CI and confirm green |
| Only on specific OS | Run in a container matching that OS |

Running verification on a different OS or with different parallelism than the failure environment
does not confirm the fix.

### What "Confirmed Fixed" Means

A fix is confirmed when ALL of the following are true:

- [ ] Required consecutive passes achieved (see table above)
- [ ] Verification run in the failure environment (same OS, same parallelism)
- [ ] Full module test suite passes (no new failures introduced)
- [ ] At least one CI run has completed green after the fix was merged

---

## Confidence Scoring for Root Cause Identification

Use this scoring system to assess how confident you are in the root cause before applying a fix.
Low confidence means more investigation is needed before writing code.

### Scoring Dimensions

**Evidence quality (0–3 points):**

| Score | Evidence |
|-------|---------|
| 0 | Single failing run, no stack trace captured |
| 1 | Multiple failing runs, consistent stack trace, failure confirmed in isolation vs suite |
| 2 | Root cause traced to a specific line of code with an explanation of the mechanism |
| 3 | Root cause confirmed by a minimal reproduction case (a test that reliably triggers it) |

**Isolation consistency (0–2 points):**

| Score | Isolation result |
|-------|----------------|
| 0 | Did not test isolation (unknown if it fails alone or only in suite) |
| 1 | Tested isolation — result matches the hypothesized type (e.g., passes alone for ordering) |
| 2 | Isolation result combined with ordering/seed/parallel test confirms the exact trigger |

**Environment confirmation (0–2 points):**

| Score | Environment |
|-------|------------|
| 0 | Did not compare local vs CI environment |
| 1 | Compared environments — found a delta that could explain the failure |
| 2 | Eliminated alternative explanations — the identified delta is the only plausible cause |

**Fix traceability (0–3 points):**

| Score | Fix quality |
|-------|------------|
| 0 | Fix is a workaround (adds sleep, retry, or skip) |
| 1 | Fix addresses a likely cause but is not directly tied to the root cause statement |
| 2 | Fix directly eliminates the mechanism described in the root cause statement |
| 3 | Fix is verified by a new test that reproduces the root cause deterministically |

### Confidence Levels

| Total score (0–10) | Confidence level | What it means |
|--------------------|-----------------|---------------|
| 0–3 | Low | Do not apply the fix yet — more investigation required |
| 4–6 | Medium | Fix is reasonable but root cause may not be fully understood — proceed with extra care |
| 7–9 | High | Root cause is well-understood — apply fix and run verification |
| 10 | Very high | Root cause is proven with a minimal repro — fix is mechanical |

**Minimum required confidence before fixing:** 6 (Medium). Below 6, the fix is a guess.

### Example Scoring

**Scenario:** Test fails 3/10 runs. Found that it fails when run after `test_admin_exists`.
Traced to a `User` row left in the database by `test_admin_exists` due to `transaction=True`.
Fix: add explicit cleanup. New test written that runs `test_admin_exists` then `test_profile`
and confirms the failure is gone.

- Evidence quality: 3 (minimal repro confirmed)
- Isolation consistency: 2 (passes alone, fails after identified test)
- Environment confirmation: 1 (same env, not an env delta)
- Fix traceability: 3 (new test proves root cause)
- **Total: 9 — High confidence. Proceed with fix.**

---

## When to Escalate vs Fix Locally

Not every flaky test should be fixed by the engineer who first encounters it. Use this decision
matrix to determine the right path.

### Fix Locally When

- Root cause confidence score is 6 or higher
- The fix is contained to test code only (no changes to production code)
- The fix takes less than 2 hours to implement and verify
- The flakiness does not suggest a production concurrency or data integrity issue

### Escalate to Senior Engineer or Team When

**The fix requires production code changes:**
- A concurrency bug in the test reflects a real race condition in the production code
- A data integrity bug in the test reflects missing transaction isolation in the production code
- Example: test reveals that two concurrent API calls can double-write a record

**The flakiness is architectural:**
- Multiple tests in the same area are flaky for the same root cause
- The fix requires changing shared infrastructure (DB fixtures, test parallelism config, CI environment)
- The fix requires changing the testing framework or its configuration

**The flakiness rate is accelerating:**
- A test that was 1/100 is now 1/20 — something changed recently that made the underlying issue worse
- This acceleration is a signal of a production regression, not just a test problem

**Root cause cannot be determined within 2 hours:**
- Confidence score remains below 6 after a full investigation session
- The failure requires access to CI environment details you cannot replicate locally
- The failure is inconsistent even with controlled reproduction attempts

### Escalation Template

When escalating, provide this information:

```
Test: [full path and test name]
Failure rate: [X/N observed, in which environment]
Investigation so far:
  - Classified as: [type]
  - Confidence score: [N/10]
  - Evidence: [what was found]
  - What was tried: [reproduction commands run and their results]
  - Why escalating: [what makes this beyond local resolution]
Reproduction command: [exact command to reproduce]
Failing stack trace: [verbatim from a failing run]
```

---

## Long-Term Monitoring

After a fix is merged, the work is not done until CI history confirms the fix is permanent.

### Monitoring Period by Failure Rate

| Original failure rate | Monitoring period | Success criterion |
|----------------------|------------------|------------------|
| > 20% | 7 days | 0 failures in CI history |
| 5–20% | 14 days | 0 failures in CI history |
| 1–5% | 30 days | 0 failures in CI history |
| < 1% | 60 days | 0 failures in CI history |

### What to Do If the Test Fails Again in the Monitoring Period

If the test fails during monitoring:

1. Do not increment the retry count — investigate again
2. The previous fix either addressed a symptom or there is a second independent root cause
3. Start from Step 1 in the SKILL.md workflow — do not assume the previous root cause is still correct
4. Compare the new failure's stack trace to the original — are they identical? (same bug, fix didn't work)
   or different? (second independent bug)

### Flakiness Rate Tracking

Track these metrics per test over time. Most CI platforms (GitHub Actions, BuildKite, CircleCI)
have built-in flakiness dashboards. If yours does not:

```bash
# Count failures per test over the last 30 runs (requires CI log access)
# This pattern depends on your CI system's log format
grep "FAILED tests/" ci-log-*.txt | sort | uniq -c | sort -rn | head -20
```

A test with a rising failure rate over time is a signal that something is getting worse —
either the test is more sensitive, or the production code it covers is accumulating technical debt
that makes it harder to test reliably.
