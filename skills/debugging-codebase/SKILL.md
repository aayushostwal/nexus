---
name: nexus-debugging-codebase
description: Use when debugging bugs, regressions, unexpected behavior, failing tests, race conditions, or production issues inside a codebase.
---

# Codebase Debugging

## Goal

Read the codebase, trace the failure to the root cause, understand project conventions, ask for clarification when needed, and fix the issue with verified tests.

## Required Workflow

1. Understand the reported failure or unexpected behavior.
2. Read relevant project instructions, conventions, docs, and tests.
3. Verify changes from the base branch.
4. Reproduce or localize the failure when possible.
5. Trace backward from symptom to caller to source of bad state.
6. Identify the root cause.
7. Explain why this is happening and how to fix it.
8. Propose the solution.
9. Improve the solution through user interaction when the fix has trade-offs.
10. Implement the changes.
11. Update documentation if required.
12. Update or add test cases if required.
13. Verify the fix with the smallest relevant test, then broader checks.

## Investigation Rules

- Read the code path before editing.
- Follow existing naming, directory, testing, and error-handling conventions.
- Check for race conditions, shared mutable state, retries, caching, async behavior, transactions, and ordering assumptions.
- Check common practices used elsewhere in the repo before introducing a new pattern.
- Ask the user for clarification if expected behavior, acceptance criteria, or production context is ambiguous.
- Do not implement broad refactors unless they are necessary to fix the root cause.

## Race Condition Checklist

- Is there concurrent access to shared state?
- Is ordering assumed but not guaranteed?
- Are async tasks awaited correctly?
- Are database writes transactional?
- Are locks, idempotency keys, or retries needed?
- Can stale cache or delayed propagation explain the failure?

## Output Format

```text
Outcome:
Symptom:
Root Cause:
Why It Happens:
Proposed Fix:
User Decision Needed:
Changes:
Verification:
Documentation/Test Updates:
Next Step:
```
