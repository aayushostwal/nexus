# Debugging Checklist

Use this checklist in sequence. Do not skip items to move faster — skipped items are the most
common cause of wasted investigation time.

---

## Pre-Debugging Checklist

Complete every item before touching code.

- [ ] Read the **full error message** — not just the last line. Read every line.
- [ ] Read the **full stack trace** — identify the first frame in user code (not library code).
- [ ] Write down the **exact symptom** in one sentence before reading any code.
- [ ] Identify **what changed recently**: last deploy, last commit, last config change, last dependency update, last infra change.
- [ ] Check **when it last worked**: confirm this failure is new, not pre-existing.
- [ ] Check if the same error has appeared before: `git log --all --grep="<keyword>"` and Sentry history.
- [ ] **Reproduce the failure** using the exact command — not a "similar" command.
- [ ] Confirm the failure is **not flaky**: run the failing command 5 times. If it fails fewer than 3 of 5, treat as intermittent.
- [ ] Record: `Local: [passes/fails] | CI: [passes/fails]`.
- [ ] If it only fails in CI, diff these between local and CI: runtime version, env vars, OS/arch, network access, file permissions.
- [ ] Check **open Sentry issues** for the same error to see if it is already being investigated.
- [ ] Check **recent deployments** — did the failure start after a specific deploy? Check the deploy log.
- [ ] Check **dependency changelogs** — did a dependency auto-update between the last passing run and now?
- [ ] Identify the **blast radius** before starting: how many users / endpoints / services are affected?
- [ ] Check **resource constraints** that could cause the failure: disk space, memory limits, connection pool limits, rate limits.
- [ ] If the failure is in CI logs, capture the **complete raw log output** — not a screenshot.
- [ ] If the failure is a performance regression, capture **baseline metrics** to compare against after the fix.
- [ ] Write down your **initial hypothesis** — this prevents unconscious anchoring during the investigation.
- [ ] Check that you are debugging **the right environment** — confirm the branch, the deploy tag, and the database.
- [ ] Do not open the code yet. Spend at least 2 minutes on the above before reading any source file.

---

## Investigation Checklist

Complete during active debugging.

- [ ] State the **first user-code frame** from the stack trace — this is where to start reading.
- [ ] Read the code at the first user-code frame **before** reading callers or callees.
- [ ] Run `git diff` or `git log` to see what changed in the file at the failing frame.
- [ ] Ask the six root cause questions in order:
  - [ ] Null / undefined access?
  - [ ] Type mismatch?
  - [ ] Missing import or dependency?
  - [ ] Config or env var absent or wrong?
  - [ ] Race condition or async ordering issue?
  - [ ] Version breaking change?
- [ ] If you cannot answer one of the above, **add logging or a debugger breakpoint** at the failing frame — do not guess.
- [ ] Test each hypothesis by **changing one variable at a time**.
- [ ] When testing a hypothesis, note the result: confirmed / ruled out.
- [ ] Keep a running list of ruled-out hypotheses — this prevents revisiting the same dead ends.
- [ ] If the failure is intermittent, reproduce it 10 times before analyzing — note the failure rate and conditions.
- [ ] If the failure is performance-related, **measure before changing anything**: query count, memory usage, wall time.
- [ ] Search for the exact error message verbatim: `"<exact error text>" <tool-name> <version>`.
- [ ] Check the tool's GitHub Issues for the exact error keyword.
- [ ] Check the tool's CHANGELOG for breaking changes in the version in use.
- [ ] State the root cause as one sentence: *"X fails because Y when Z."* — if you cannot, keep narrowing.

---

## Fix Validation Checklist

Complete before marking the fix ready.

- [ ] State **what** the fix changes: exact file, line number, and change.
- [ ] State **why** the fix addresses the root cause — not just "this fixes it".
- [ ] State the **blast radius**: what else could be affected by this change.
- [ ] Confirm the fix is **the narrowest possible change** — no unrelated cleanup included.
- [ ] The fix does not introduce new assumptions that could fail under different conditions.
- [ ] Run the **exact failing command** from the pre-debugging checklist — confirm it now passes.
- [ ] Run the **full test suite for the affected module** — confirm no regressions.
- [ ] If the fix touches a system boundary (API, DB, queue), run integration tests.
- [ ] If the fix is performance-related, **re-measure** and confirm the metric improved.
- [ ] A regression test exists that would catch this failure in the future (or document why one is not needed).
- [ ] The regression test is named after the **behaviour**, not the bug: `test_filter_returns_empty_for_null_input` not `test_fix_issue_123`.
- [ ] The fix has been tested in a **non-production environment** before being applied to production.
- [ ] Fill in the **Debug Report** from `common.md` — every field is complete, none are blank.

---

## Post-Fix Checklist

Complete after the fix is deployed and verified in production.

- [ ] Monitor **error rate** for the fixed component for at least 30 minutes post-deploy.
- [ ] Confirm the **Sentry issue is resolved** (error rate dropped to zero or expected level).
- [ ] Update or close the **Jira / GitHub issue** tracking the bug.
- [ ] Document **what you tried that did not work** in the PR description or issue — saves time for the next investigator.
- [ ] Add a note to the **runbook** if this type of failure is likely to recur (connection pool, timezone, N+1, etc.).
- [ ] If the root cause was a missing safeguard (no null check, no query count test, no load test), open a follow-up task to add it.
- [ ] Share a one-paragraph summary with the team if the bug affected users or caused an incident.
- [ ] Update `docs/` if the fix changes behaviour visible to other teams or users.
