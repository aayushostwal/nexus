# Debug Report Output Validation

How to verify that a debug report is complete, correct, and ready to act on.
Use this file before closing any debug session or handing off to another engineer.

---

## Completeness Check

Every debug report from `common.md` must have all fields filled in. Run through this list:

| Field | Filled in? | Acceptable if blank? |
|-------|-----------|---------------------|
| Outcome | Required | No |
| Symptom | Required (verbatim, not paraphrased) | No |
| Root Cause | Required (one sentence: "X fails because Y when Z") | No |
| Why It Happens | Required (2–3 sentences on mechanism) | No |
| Proposed Fix | Required (file path + line number + change) | No — write "none: root cause identified, no code fix needed" if applicable |
| Decision Needed | Required | No — write "no" if not applicable |
| Changes Made | Required | No — write "none: awaiting approval" if not yet applied |
| Verification | Required (exact command + pass/fail output) | No — write "pending: awaiting deployment to staging" if blocked |
| Test / Doc Updates | Required | No — write "none required: <reason>" if genuinely not needed |
| Next Step | Required | No |

If any required field is blank without an explicit "none: <reason>", the report is incomplete.

---

## Confidence Scoring

Assign a confidence level to the root cause before acting on it.

### High Confidence

Evidence required (must have all three):
1. The root cause is stated in one specific sentence: *"X fails because Y when Z."*
2. The failure was reproduced using the exact failing command.
3. Removing or changing the root cause stops the failure.

Example of a high-confidence root cause:
> *"`datetime.now()` is naive and resolves against the machine timezone, causing the
> due-date filter to return a different date in UTC-based CI."*

At High confidence: apply the fix, add a regression test, mark resolved.

### Medium Confidence

Evidence: you reproduced the failure, and the root cause explains the symptom, but you have
not yet confirmed that the proposed fix stops the failure.

Example:
> *"The N+1 query pattern introduced by the new ForeignKey accessor is the likely cause of the
> 10x latency increase — confirmed by query count analysis, fix not yet tested."*

At Medium confidence: apply the fix in staging, verify, then escalate to High before
applying in production.

### Low Confidence

Evidence: the root cause is a hypothesis that explains the symptom but has not been confirmed
by reproduction or measurement.

Example:
> *"Possibly the connection pool is exhausted at peak traffic — not yet measured."*

At Low confidence: do not apply a fix. Gather more evidence: measure connection counts,
reproduce under load, confirm the hypothesis. State the hypothesis clearly in the report and
list what evidence would elevate it to Medium or High.

---

## The "Explain It to a Colleague" Test

Before marking a debug session complete, explain the root cause out loud (or in writing) as if
describing it to a colleague who was not part of the investigation.

A good explanation passes these checks:
- [ ] The colleague can understand why the failure happens (mechanism, not just symptom).
- [ ] The colleague can understand why the proposed fix works.
- [ ] The colleague can understand what would prevent recurrence.
- [ ] The explanation does not rely on "trust me" or "it just works now".
- [ ] The explanation does not use vague language: "something was wrong with the config."

If you cannot explain it clearly, you do not fully understand the root cause yet.
Return to investigation.

---

## When to Escalate vs. Fix Locally

Use this decision table:

| Condition | Action |
|-----------|--------|
| Root cause is in your team's code and you understand it fully | Fix locally |
| Root cause is in your team's code but the fix is risky or has a large blast radius | Fix locally + get a second review |
| Root cause is in an external library or framework | Open an issue on the library's repo; add a workaround locally if needed |
| Root cause is in infrastructure (cloud, network, database config) | Escalate to infrastructure/SRE team; do not apply infra changes without approval |
| Root cause is unknown after completing Steps 1–5 of `common.md` | Escalate to a senior engineer or team lead before guessing |
| The failure is affecting production users right now | Escalate immediately; apply the fastest known-safe mitigation (feature flag, rollback) while investigating root cause |
| The fix requires a database migration or schema change | Escalate to review; validate against production data volume in staging |
| The fix requires a security-sensitive change (auth, tokens, credentials) | Escalate for security review; do not self-approve |

**Default rule:** if uncertain whether to fix locally or escalate, escalate. An unnecessary
escalation costs 15 minutes. An incorrect local fix can cost hours of incident response.

---

## Required Evidence by Confidence Level

### To claim Low Confidence:
- [ ] Symptom is captured verbatim.
- [ ] A plausible mechanism exists that connects the symptom to a code or environment cause.
- [ ] At least one hypothesis is stated explicitly.

### To claim Medium Confidence:
Everything in Low, plus:
- [ ] The failure was reproduced using the exact failing command.
- [ ] At least one alternative hypothesis was explicitly ruled out with evidence.
- [ ] The proposed root cause was confirmed by reading the relevant source lines.

### To claim High Confidence:
Everything in Medium, plus:
- [ ] Changing or removing the root cause stops the failure (tested, not assumed).
- [ ] The fix was verified by re-running the exact failing command.
- [ ] The full test suite for the affected module passes.
- [ ] A regression test exists that covers the fixed case.

---

## Final Validation Before Closing a Debug Session

Run through this checklist:

- [ ] The Debug Report is complete (all fields filled, none blank without explicit reason).
- [ ] Root cause confidence level is stated: Low / Medium / High.
- [ ] If confidence is Low or Medium, the "Decision Needed" field is set to "yes" with the open question stated.
- [ ] The verification command was actually run — not just described.
- [ ] The regression test was actually written — not just planned.
- [ ] The "Next Step" field contains exactly one clear action (not a list of maybes).
- [ ] No secrets, tokens, or credentials appear anywhere in the report.
- [ ] If any external write (Slack, Jira, AWS) was made, it was approved per the Approval Gates in `common.md`.
- [ ] The investigation notes (what was tried and ruled out) are captured in the PR description or issue — not only in memory.
