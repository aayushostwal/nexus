# Codebase Debugging

## Goal

Read the codebase, trace the failure to the root cause, understand project conventions, ask for clarification when needed, and fix the issue with verified tests.

## Required Workflow

Follow `skills/debugging/common.md`, plus:

1. Read relevant project instructions, conventions, docs, and tests.
2. Reproduce or localize the failure when possible.
3. Trace backward from symptom to caller to source of bad state.

## Investigation Rules

- Read the code path before editing.
- Follow existing naming, directory, testing, and error-handling conventions.
- Check for race conditions, shared mutable state, retries, caching, async behavior, transactions, and ordering assumptions.
- Ask the user for clarification if expected behavior or acceptance criteria is ambiguous.
- Avoid broad refactors unless they are required to fix the root cause.

## Race Condition Checklist

- Is there concurrent access to shared state?
- Is ordering assumed but not guaranteed?
- Are async tasks awaited correctly?
- Are database writes transactional?
- Are locks, idempotency keys, or retries needed?
- Can stale cache or delayed propagation explain the failure?
