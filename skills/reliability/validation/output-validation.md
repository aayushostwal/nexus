# Output Validation

Criteria for verifying incident investigation completeness, root cause correctness, and post-mortem acceptability.

---

## Root Cause Verification (4 Tests)

A root cause is confirmed only when all four tests pass. Fail any test = hypothesis, not root cause.

**Test 1 — One-Sentence Mechanism**
State root cause as: `"[Component] failed because [mechanism] when [condition]."`
- Fail: statement describes what happened, not why ("pods were OOM-killed" = symptom, not root cause)
- Fail: requires "and also" or "or maybe" to express

**Test 2 — Timeline Alignment**
Root cause must explain: (a) why failure began at the exact onset time, (b) sudden vs. gradual onset matches mechanism, (c) exactly which users/endpoints/regions were affected, (d) why the specific mitigation worked, (e) why unaffected components were spared.
- Fail: explains onset but not scope, or scope but not why the fix worked

**Test 3 — Counterfactual**
Ask: "If the root cause were absent, would the incident have occurred?" If no → passes. If it would only have been caught later → that's a detection gap, not root cause.
- Fail: removing the "root cause" would only improve detection, not prevention

**Test 4 — Reproduction (where possible)**
Reproduce in staging: failure matches production symptoms, fix resolves it. Document reason if skipped (capacity/hardware incidents may not be reproducible).
- Fail: fix deployed to production without confirming resolution in any environment

---

## RCA Confidence Scoring

| Confidence | Criteria |
|-----------|---------|
| **High** | All 4 tests pass; reproduced in staging; code/config change identified |
| **Medium** | Tests 1-3 pass; reproduction not possible; strong circumstantial evidence |
| **Low** | Timeline correlation present; mechanism unclear; reproduction not attempted |
| **Unknown** | Incident resolved but root cause not identified — acceptable P2/P3 with follow-up action item; P0/P1 minimum is Low |

Document confidence in incident report. Unknown for P0 = post-mortem action item to keep investigating.

---

## Post-Mortem Acceptability

**Content completeness:**
- [ ] Timeline complete from baseline through full resolution, every event timestamped
- [ ] Root cause stated in one sentence with mechanism (not a symptom)
- [ ] Impact quantified: duration, affected users/traffic %, SLA breach Y/N
- [ ] Detection gap answered ("why didn't we catch it earlier?")
- [ ] Response gap answered ("why did mitigation take as long as it did?")
- [ ] "What went well" is honest and non-empty
- [ ] "What went poorly" is honest and non-empty

**Action item quality** — each item must be:
- [ ] Specific (exact change, not "improve monitoring")
- [ ] Categorized: Prevention / Detection / Mitigation / Process
- [ ] Owned by a single named person (not a team)
- [ ] Time-bound with a specific due date
- [ ] Verifiable (clear definition of "done")

**Min action items:** P0 = 3+ (one each: prevention, detection, process) | P1 = 2+ | P2 = 1+
**Blamelessness:** Rewrite sentences naming individuals with implied error, using "should have known/negligent/failed to", or focusing on human error without examining system conditions.
**Timing:** P0 ≤ 48h | P1 ≤ 72h | P2 ≤ 1 week. If not achievable, post draft with known unknowns and completion date.

---

## Incident Closure Checklist

**Technical:**
- [ ] Key metric returned to baseline and stable for ≥10 minutes
- [ ] No dependent services still degraded
- [ ] Mitigation confirmed as cause of recovery (not coincidence)

**Communication:**
- [ ] Status page updated to "Resolved" (P0/P1)
- [ ] Final update posted to incident channel
- [ ] On-call lead and affected stakeholders notified

**Follow-up:**
- [ ] Post-mortem scheduled (P0/P1) or async summary assigned (P2)
- [ ] Action items created in issue tracker with owners
- [ ] 30-day follow-up scheduled to verify action item completion

**Documentation:**
- [ ] Runbook updated if gaps found
- [ ] Monitoring updated if coverage gaps found
- [ ] Timeline saved (not in local notes)

---

## Common Validation Failures

| Failure | Detection | Remedy |
|---------|-----------|--------|
| Root cause is a symptom | One-sentence test describes what, not why | Ask "why?" one level deeper |
| No detection action items | All items are prevention type | Add: "Why did alert fire so late?" |
| Action items have no owners | Items assigned to "the team" | Name a specific individual per item |
| Post-mortem never published | Check wiki 72h post-resolution | Assign post-mortem owner at incident close; IC is accountable |
| Incident recurred within 30 days | Pattern match on incident log | Check if action items were completed |
| P0 with Unknown confidence | Check incident report field | Block post-mortem close until Medium confidence |
