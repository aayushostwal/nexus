# Debugging Common Rules

## Core Principle

Investigate first. Do not propose fixes before identifying the root cause from evidence.

## Common Steps

1. Verify changes from the base branch.
2. See what is the failure and capture the exact error.
3. Identify the root cause.
4. Explain why this is happening and how to fix it.
5. Propose the solution.
6. Improve the solution through user interaction when there are trade-offs.
7. Implement the changes.
8. Update the documentation if required.
9. Update the test cases if required.
10. Verify with the smallest relevant check first, then broader checks.

## Approval Rules

- Ask before any external writes (Slack, email, Jira, AWS changes, deployments).
- Never print secrets, tokens, or credentials.

## Standard Output Shape

```text
Outcome:
Symptom/Failure:
Root Cause:
Why It Happens:
Proposed Fix:
User Decision Needed:
Changes:
Verification:
Documentation/Test Updates:
Next Step:
```
