# Debug Report Output Validation

Use before closing any debug session or handing off to another engineer.

---

## Completeness Check

All fields from `common.md` must be filled. Blank only if an explicit `"none: <reason>"` is written.

| Field | Required? |
|-------|-----------|
| Outcome | Yes |
| Symptom | Yes — verbatim, not paraphrased |
| Root Cause | Yes — "X fails because Y when Z" |
| Why It Happens | Yes — mechanism in 2–3 sentences |
| Proposed Fix | Yes — file path + line + change; or "none: root cause identified, no code fix needed" |
| Decision Needed | Yes — or "no" if not applicable |
| Changes Made | Yes — or "none: awaiting approval" |
| Verification | Yes — exact command + output; or "pending: awaiting deployment to staging" |
| Test / Doc Updates | Yes — or "none required: <reason>" |
| Next Step | Yes |

---

## Confidence Scoring

### High Confidence (all three required)
- [ ] Root cause stated as one specific sentence: *"X fails because Y when Z."*
- [ ] Failure reproduced using the exact failing command.
- [ ] Changing/removing root cause stops the failure (tested, not assumed).
- [ ] Fix verified by re-running the exact failing command.
- [ ] Full test suite for the affected module passes.
- [ ] Regression test exists for the fixed case.

**Action:** Apply fix, add regression test, mark resolved.

### Medium Confidence
- [ ] Everything in Low, plus:
- [ ] Failure reproduced with the exact failing command.
- [ ] At least one alternative hypothesis explicitly ruled out with evidence.
- [ ] Proposed root cause confirmed by reading the relevant source lines.

**Action:** Apply fix in staging, verify, escalate to High before production.

### Low Confidence
- [ ] Symptom captured verbatim.
- [ ] Plausible mechanism connects symptom to a code or environment cause.
- [ ] At least one hypothesis stated explicitly.

**Action:** Do not apply a fix. Gather more evidence. State what evidence would elevate to Medium/High.

---

## "Explain It to a Colleague" Test

Before marking complete, explain the root cause as if describing it to someone not in the investigation:
- [ ] They can understand why the failure happens (mechanism, not just symptom).
- [ ] They can understand why the proposed fix works.
- [ ] They can understand what prevents recurrence.
- [ ] No "trust me" or "it just works now."
- [ ] No vague language: "something was wrong with the config."

If you cannot explain it clearly, return to investigation.

---

## Escalation Decision Table

| Condition | Action |
|-----------|--------|
| Your team's code, fully understood | Fix locally |
| Your team's code, risky or large blast radius | Fix locally + second review |
| External library / framework | Open issue upstream; add local workaround if needed |
| Infrastructure (cloud, network, DB config) | Escalate to infra/SRE; no infra changes without approval |
| Root cause unknown after full investigation | Escalate to senior engineer before guessing |
| Affecting production users now | Escalate immediately; apply fastest safe mitigation (flag/rollback) while investigating |
| DB migration or schema change | Escalate for review; validate against production data volume in staging |
| Security-sensitive change (auth, tokens, credentials) | Escalate for security review; do not self-approve |

**Default:** if uncertain, escalate. An unnecessary escalation costs 15 minutes; an incorrect local fix can cost hours.

---

## Final Checklist Before Closing

- [ ] Debug Report complete — no blank fields without explicit reason.
- [ ] Confidence level stated: Low / Medium / High.
- [ ] If Low or Medium, "Decision Needed" set to "yes" with the open question.
- [ ] Verification command actually run — not just described.
- [ ] Regression test actually written — not just planned.
- [ ] "Next Step" contains exactly one clear action.
- [ ] No secrets, tokens, or credentials in the report.
- [ ] Any external write (Slack, Jira, AWS) was approved per Approval Gates in `common.md`.
- [ ] Investigation notes (what was tried and ruled out) captured in PR description or issue.
