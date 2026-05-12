# Output Validation

How to confirm a flaky test fix is genuine, score root-cause confidence, and decide when to escalate.

---

## Required Consecutive Passes

| Observed failure rate | Minimum passes |
|----------------------|----------------|
| >50% | 10 |
| 20–50% | 20 |
| 5–20% | 30–50 |
| 1–5% | 50 |
| <1% | 100 OR 30-day CI monitoring with 0 failures |

**Verification commands:**
```bash
# pytest — N runs
N=20; failed=0
for i in $(seq 1 $N); do pytest tests/path/to/test.py::test_fn -x --tb=no -q || ((failed++)); done
echo "Result: $failed/$N failed"

pytest tests/ -n auto --count=20 --tb=short               # parallel (contention bugs)
go test ./pkg/... -run TestFn -count=20 -race              # Go with race detector
for i in $(seq 1 20); do jest --testNamePattern "name" --runInBand --silent || echo "FAILED $i"; done
```

Verify in the **same environment** (OS, parallelism, env vars) where failure occurred.

**"Confirmed Fixed" requires ALL:**
- [ ] Required consecutive passes achieved in the failure environment
- [ ] Full module test suite passes (no new failures introduced)
- [ ] At least one CI run green after merge

---

## Confidence Scoring (score before fixing; minimum 6 to proceed)

| Dimension | 0–3 pts | Criteria |
|-----------|---------|----------|
| Evidence quality | 0–3 | 0=single run/no trace; 1=multiple runs+trace; 2=traced to line; 3=minimal repro |
| Isolation consistency | 0–2 | 0=not tested; 1=matches hypothesis; 2=exact trigger confirmed |
| Environment confirmation | 0–2 | 0=not compared; 1=delta found; 2=only plausible cause identified |
| Fix traceability | 0–3 | 0=workaround (sleep/retry/skip); 1=likely cause; 2=eliminates mechanism; 3=new test proves it |

| Total (0–10) | Level | Action |
|--------------|-------|--------|
| 0–5 | Low/Medium-low | More investigation — do not fix yet |
| 6–7 | Medium | Proceed with extra care |
| 8–9 | High | Apply fix and verify |
| 10 | Very High | Fix is mechanical |

---

## Escalation

**Fix locally when:** score ≥ 6, fix is test-only, < 2 hours, no production impact suspected.

**Escalate when:**
- Fix requires production code changes (real race / data integrity bug)
- Multiple tests share the same root cause (architectural issue)
- Fix requires changing shared infra (DB fixtures, CI config, test framework)
- Failure rate is accelerating (signals production regression)
- Score remains < 6 after a full investigation session

**Escalation template:**
```
Test: [path + name] | Rate: [X/N, env] | Type: [type] | Confidence: [N/10]
Evidence: [what was found]
Tried: [commands + results]
Why escalating: [reason]
Repro command: [exact command]
Stack trace: [verbatim]
```

---

## Long-Term Monitoring

| Original rate | Monitor for | Pass criterion |
|---------------|-------------|---------------|
| >20% | 7 days | 0 CI failures |
| 5–20% | 14 days | 0 CI failures |
| 1–5% | 30 days | 0 CI failures |
| <1% | 60 days | 0 CI failures |

If test fails again during monitoring: reinvestigate from Step 1 — do not retry. Compare new
stack trace to original; identical = same bug (fix didn't work), different = second independent bug.
Rising failure rate over time signals a production regression, not just a test problem.
