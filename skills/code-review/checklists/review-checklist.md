# Code Review Checklist

Use this checklist mechanically — do not rely on memory or "I'll know it when I see it."
The value of a checklist is that it catches things your pattern-matching brain skips.

---

## Pre-Review Checklist (Complete Before Reading the Diff)

Work through these in order. Items marked [CRITICAL] cannot be skipped for any severity finding.

### Context & Scope

- [ ] Read the PR title and description — write one sentence summarizing the author's intent
- [ ] Run `git diff --stat` to see all changed files and line counts
- [ ] Run `git log origin/main...HEAD --oneline` to see all commits in this PR
- [ ] Identify the "center of gravity" — the 1-3 files containing the core logic change
- [ ] Note whether the PR description matches the actual files changed (gaps are findings)
- [ ] Check if the PR is part of a larger feature — are there dependent PRs?

### Function & API Impact [CRITICAL]

- [ ] List every function, method, or class whose **signature** changed
- [ ] For each changed signature: run `git grep "function_name"` across the whole repo
- [ ] Read every caller of every changed function — all of them, not a sample
- [ ] For each caller: verify the call still works with the new signature/contract
- [ ] Check if any interface, abstract class, or protocol is being implemented — are all implementors updated?

### Test Coverage [CRITICAL]

- [ ] Open the test file(s) in the diff — read the actual assertions, not just the test names
- [ ] Identify which behaviors are tested by the new/modified tests
- [ ] Identify which behaviors of the changed code are NOT covered by any test
- [ ] Check if any existing tests were deleted or weakened (assertions removed, edge cases removed)
- [ ] If no tests changed: is the change provably correct without tests? If not, flag as REQUEST CHANGES

### Database & Storage

- [ ] Does the diff contain any migration files? (`.sql`, `alembic/versions/`, `db/migrate/`, `migrations/`)
- [ ] If yes: apply the full Migration Safety Checklist (see below)
- [ ] Are there any raw SQL queries in the diff? Check for SQL injection (unparameterized input)
- [ ] Are there any ORM calls inside loops? (N+1 candidate)
- [ ] Are there any `select_related` / `prefetch_related` / `include:` / `JOIN` omissions on collection queries?

### Security Surface

- [ ] Does the diff change any authentication logic? (token parsing, session validation, cookie handling)
- [ ] Does the diff change any authorization logic? (role checks, permission guards, `@require_permission`)
- [ ] Does the diff add a new endpoint, route, or function? Is it protected with the correct auth?
- [ ] Does the diff expose any new data in an API response? Is that data appropriate for all callers?
- [ ] Does the diff handle any user-supplied input? Is it validated before use?
- [ ] Does the diff use any user-supplied value in a query, command, or template? Is it properly escaped?
- [ ] Does the diff log any data? Could that log contain PII, secrets, or credentials?

### Error Handling

- [ ] Does every new code path that can fail have error handling?
- [ ] Does the error handling propagate errors to the caller or silently swallow them?
- [ ] Is there any `except Exception: pass`, `catch(e) {}`, or equivalent?
- [ ] If an exception is swallowed: what state has already been committed at that point?
- [ ] Are there any resource acquisitions (file, connection, lock) without a matching cleanup in the error path?

### Concurrency & State

- [ ] Does any changed code access shared mutable state (module-level vars, class vars, singletons)?
- [ ] Are there any check-then-act patterns on shared state without an atomic operation?
- [ ] Are there any read-modify-write patterns on shared state without a transaction or lock?
- [ ] Are there any async calls that are not awaited where the result matters?
- [ ] Does the diff introduce any new background job, goroutine, or thread? Does it have a bounded lifetime?

### Dependencies & Config

- [ ] Does the diff add or update any dependency? Check the CHANGELOG for breaking changes.
- [ ] Is any new dependency pinned to an exact version?
- [ ] Does the diff change any configuration? Is the config read at startup or at request time?
- [ ] Does the diff introduce any new environment variable? Is it documented and does it have a default?

### Reversibility & Deployment

- [ ] Can this change be rolled back without data loss if it causes an incident?
- [ ] Does the deployment order matter (app code vs. migration vs. config)?
- [ ] If the change is behind a feature flag: is the flag off by default in production?
- [ ] Are there any changes that cannot be rolled back (data deletion, column drop, irreversible migration)?

### Blast Radius Assessment [CRITICAL]

- [ ] What is the maximum number of users/requests/records affected if this change has a bug?
- [ ] What other services or teams depend on the code being changed?
- [ ] What would fail first, and how quickly, if this change were wrong?
- [ ] Is there monitoring or alerting that would catch a regression from this change within minutes?

---

## Migration Safety Checklist

Apply this checklist to every migration file in the diff. Do not skip items.

### Backward Compatibility (old app code against new schema)

- [ ] Does the migration add a column? Is it nullable or does it have a DEFAULT? (NOT NULL without DEFAULT = old INSERT fails)
- [ ] Does the migration rename a column? (Old code reading the old name will get NULL or error)
- [ ] Does the migration change a column type? (Old code may fail type coercion)
- [ ] Does the migration add a constraint (NOT NULL, UNIQUE, FK)? Does existing data violate it? (Migration will fail)
- [ ] Does the migration drop a column? (Old app code reading the column gets NULL or error)

### Lock Risk

- [ ] Does the migration use `CREATE INDEX` without `CONCURRENTLY`? (Exclusive lock for index build duration — minutes on large tables)
- [ ] Does the migration use `ALTER TABLE ... ADD COLUMN NOT NULL`? (Full table rewrite on some DB engines)
- [ ] Does the migration use `ALTER TABLE ... ALTER COLUMN TYPE`? (Full table rewrite + exclusive lock)
- [ ] Does the migration run a `DELETE` or `UPDATE` without a `WHERE` clause or batch limit? (Long-running transaction, escalating locks)

### Rollback Safety

- [ ] Does a `down` migration exist?
- [ ] Does the `down` migration actually reverse what the `up` does? (Read both)
- [ ] Does the `down` migration cause data loss that the team is aware of and has accepted?
- [ ] Is the rollback safe to run under production traffic?

### Data Backfill

- [ ] Does the migration backfill data? Is it batched (e.g., `LIMIT 1000 OFFSET n`) or a single statement on the full table?
- [ ] If batched: is there a script to run the backfill, separate from the migration? (Backfills in migrations hold transactions open)
- [ ] Does the backfill script have a timeout or progress indicator?

### Deployment Order

- [ ] Does the migration need to run before or after the app deploy?
- [ ] Is that order documented in the PR description?
- [ ] Does the app code handle both the pre-migration and post-migration schema states? (Required for zero-downtime)

---

## Severity Classification Checklist

For each finding, work through this in order to assign severity:

**Step 1 — Is it a correctness issue?**
- [ ] Will this code produce wrong output, corrupt data, or cause a crash for any real input?
- If yes: go to Step 2. If no: go to Step 4.

**Step 2 — What is the blast radius?**
- [ ] Affects all users / all requests / all records → BLOCK candidate
- [ ] Affects a subset of users/requests with a specific trigger condition → REQUEST CHANGES candidate
- [ ] Affects only edge cases that are rare in production → COMMENT candidate

**Step 3 — Is it reversible?**
- [ ] Not reversible without data loss → upgrade to BLOCK
- [ ] Reversible but requires downtime → upgrade to REQUEST CHANGES
- [ ] Fully reversible with a quick rollback → maintain current severity

**Step 4 — Is it a style/preference issue?**
- [ ] Yes, and a linter could have caught it → NITPICK (or do not mention — linters exist for a reason)
- [ ] No, it is a genuine concern about maintainability or design → COMMENT

---

## Approval / Block Decision Checklist

Before marking APPROVE, confirm all of the following:

- [ ] No finding is severity BLOCK
- [ ] No finding is severity REQUEST CHANGES that has not been acknowledged by the author
- [ ] Test coverage exists for the new/changed behavior
- [ ] If there is a migration: migration safety checklist is complete and all items pass
- [ ] If there is an auth change: full code path traced from entry to data
- [ ] Callers of all changed functions have been verified
- [ ] You have read the PR description and confirmed it matches the actual diff
- [ ] You have checked at least one of: the test changes, the migration, or the changed core logic in full

Before marking BLOCK, confirm:

- [ ] The finding is concrete — you have file path, line number, and triggering scenario
- [ ] The finding is not already handled by existing code (check guards, middleware, validators)
- [ ] The blast radius is non-trivial — it would affect real users or real data
- [ ] You have suggested a specific fix or asked a specific question to resolve the block
