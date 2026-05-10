# Output Validation

How to verify that an incident investigation is complete, a root cause is correct, and a post-mortem is acceptable. Use these criteria before closing an incident or publishing a post-mortem.

---

## Verifying Root Cause Correctness

A root cause is confirmed when it passes all four tests below. If any test fails, you have a hypothesis, not a confirmed root cause.

### Test 1: One-Sentence Mechanism Test

State the root cause in one sentence using this structure:

> "[Component] failed because [mechanism] when [condition]."

Examples of confirmed root causes:
- "The image processor OOMed because PIL loaded entire files into a module-level cache with no TTL, exhausting pod memory over 2 hours under normal traffic."
- "The auth endpoint returned 500 because the new JWT signing key was 512-bit but the application requires 2048-bit minimum, enforced at runtime."
- "The connection pool was exhausted because a 5x traffic spike from a marketing campaign exceeded the pool's 100-connection capacity within 60 seconds."

If you cannot state it in one sentence without conjunctions like "and also" or "or maybe" — you have not found the root cause yet.

**Fail condition:** The "root cause" is actually a symptom:
- "The service went down because pods were OOM-killed." (This is what happened, not why.)
- "Users couldn't log in because the auth service returned 500s." (Symptom, not mechanism.)

---

### Test 2: Timeline Alignment Test

The root cause must explain the exact timeline:

| Timeline checkpoint | What the root cause must explain |
|--------------------|--------------------------------|
| Incident start time | Why did the failure begin at exactly this time? |
| Onset speed (sudden vs. gradual) | Does the mechanism produce sudden or gradual degradation? Memory leaks are gradual. Config errors are sudden. |
| Scope (all users vs. subset) | Why were exactly these users/endpoints/regions affected? |
| Resolution (rollback worked) | Why did rolling back (or the specific fix applied) stop the failure? |
| Non-affected components | Why were these services/endpoints NOT affected? |

If the root cause cannot explain why the mitigation worked, it is likely the wrong root cause. The rollback resolved a memory leak → the new code introduced the leak → the root cause is in the new code.

**Fail condition:** Root cause explains onset but not scope, or explains scope but not why the fix worked.

---

### Test 3: Counterfactual Test

Ask: "If the root cause were not present, would the incident have occurred?"

- Memory leak root cause: "If we had not deployed the image caching code, would pods have OOM'd?" → No. Test passes.
- Wrong root cause candidate: "If the alert threshold were 80% instead of 90%, would the incident have occurred?" → No, but it would have been caught earlier. This is a detection gap, not a root cause.

The counterfactual test separates contributing factors (things that made the incident worse or harder to detect) from root causes (things that directly caused the failure).

**Fail condition:** Removing the "root cause" would only have made the incident easier to detect, not prevented it.

---

### Test 4: Reproduction Test (Where Possible)

For code, config, or data-pattern root causes:
1. Reproduce the failure condition in staging or locally
2. Confirm the reproduction produces the same symptoms as production
3. Confirm that applying the fix (or rollback) resolves it in the reproduction environment

This test is not always possible (capacity incidents require production-scale traffic, infrastructure failures require specific hardware conditions) — document why if skipped.

**Fail condition:** The fix is applied to production without being confirmed to resolve the issue in any environment.

---

## RCA Confidence Scoring

Assign a confidence level to the root cause before closing the incident.

| Confidence | Criteria |
|-----------|---------|
| **High** | All four tests pass. Root cause explains timeline, scope, and resolution. Reproduced in staging. Code or config change identified. |
| **Medium** | Timeline alignment and one-sentence test pass. Counterfactual test passes but reproduction not possible. Strong circumstantial evidence (e.g., metric confirms the mechanism but cannot reproduce at scale). |
| **Low** | Timeline correlation present but mechanism unclear. Could be one of two possible root causes. Reproduction not attempted or failed to reproduce. |
| **Unknown** | Incident resolved (likely by mitigation) but root cause not identified. This is acceptable for P2/P3 if a follow-up action item exists. For P0/P1, Low confidence is the minimum acceptable. |

Document the confidence level in the incident report. "Unknown" root cause for a P0 is a post-mortem action item by itself.

---

## Acceptable Post-Mortem Criteria

A post-mortem is acceptable to publish when all of the following are true:

### Content Completeness

- [ ] Timeline is complete from baseline state through full resolution
- [ ] Every significant event in the timeline has a timestamp (not "around noon")
- [ ] Root cause is stated in one sentence with mechanism (not a symptom)
- [ ] Impact is quantified: duration, affected users or traffic %, SLA breach Y/N
- [ ] "Why we didn't catch it earlier" is answered (detection gap identified)
- [ ] "Why mitigation took as long as it did" is answered (response gap identified)
- [ ] "What went well" section is honest (not empty, not generic praise)
- [ ] "What went poorly" section is honest (not empty, not defensive)

### Action Item Quality

Every action item must pass all five of these checks:

- [ ] **Specific:** Names the exact change to make (not "improve monitoring")
- [ ] **Categorized:** Prevention / Detection / Mitigation / Process
- [ ] **Owned:** Assigned to a single named person (not a team)
- [ ] **Time-bound:** Has a specific due date (not "next quarter")
- [ ] **Verifiable:** There is a clear definition of "done" — a test, an alert, a runbook update

**Minimum action item count:**
- P0: at least 3 action items (at least one prevention, one detection, one process)
- P1: at least 2 action items
- P2: at least 1 action item

### Blamelessness Check

Read every sentence in the post-mortem. If any sentence:
- Names an individual and implies they made an error
- Uses language like "should have known", "was negligent", "failed to"
- Focuses on human error without examining why the system allowed the error

Rewrite it to focus on system conditions, process gaps, or tooling failures.

Acceptable: "The deployment ran without a load test because our CI pipeline does not include one."
Not acceptable: "The engineer who deployed this should have run a load test."

### Timing Check

- [ ] P0 post-mortem: published within 48 hours of resolution
- [ ] P1 post-mortem: published within 72 hours of resolution
- [ ] P2 post-mortem: summary posted within 1 week

If not achievable, post a draft with known unknowns and a completion date.

---

## Verification Checklist for Incident Closure

Run this before declaring an incident fully resolved. All items must be checked.

**Technical resolution:**
- [ ] The key incident metric (error rate, latency p99, etc.) has returned to baseline
- [ ] The metric has been stable at baseline for at least 10 minutes
- [ ] No dependent services are still degraded due to this incident
- [ ] The mitigation applied is confirmed to be the reason for recovery (not coincidence)

**Communication:**
- [ ] Status page updated to "Resolved" (for P0/P1 with user-facing impact)
- [ ] Final update posted to incident channel with resolution summary
- [ ] On-call lead notified of resolution
- [ ] Stakeholders notified if they were informed of the incident

**Follow-up scheduled:**
- [ ] Post-mortem scheduled (P0/P1) or async summary assigned (P2)
- [ ] Follow-up action items created in issue tracker with owners
- [ ] 30-day follow-up scheduled to verify action items were completed

**Documentation:**
- [ ] Runbook updated if the incident revealed a gap or outdated step
- [ ] Monitoring updated if the incident revealed a coverage gap
- [ ] Timeline document is complete and saved (not in someone's local notes)

---

## Common Validation Failures

| Failure | How to detect | Remedy |
|---------|--------------|--------|
| Root cause is actually a symptom | Apply one-sentence test — statement describes what happened, not why | Ask "why did this happen?" one more level deeper |
| Post-mortem has no detection action items | Every action item is prevention | Add: "Why did this alert fire so late?" or "Why did users report before we knew?" |
| Action items have no owners | Items assigned to "the team" | Name a specific individual for each |
| Post-mortem was never published | Check the team wiki 72h after resolution | Assign post-mortem owner at incident close; IC is accountable |
| Incident recurred within 30 days | Pattern match across incident log | Check if action items were actually completed; this is a post-mortem failure |
| Confidence is "Unknown" for P0 | Check incident report confidence field | Block post-mortem close until at least Medium confidence achieved |
