---
name: nexus-code-review
description: >
  Use for senior-level PR or diff review focused on correctness, regressions, security, migration risk,
  and deploy safety. Trigger on "review this PR", pasted diffs/branch links, or requests for
  merge-readiness and missed-issue analysis. When in doubt, use this skill.
---

# Nexus Code Review

Semantic PR review — not a style linter. Understand what code is *supposed* to do, what it *actually* does, and where those diverge in ways that cause production incidents.

---

## Execution Workflow

### Phase 1 — Context Collection (never skip)

Build a mental model before reading the diff and determine the base branch first. usually repositories have `main` and `master` but you can check the git history of commits.

```bash
git diff origin/{base_branch}...HEAD --stat
git log origin/{base_branch}...HEAD --oneline
git log --oneline -10 -- path/to/changed/file.py
```

For each changed file type, also inspect:

| Changed code | Also inspect |
|---|---|
| Function signature | Every caller in the codebase |
| DB schema | Migration history, ORM models, serializers, API shapes |
| Auth/middleware | All protected routes, token validation paths |
| Config | Where it's read: startup vs. request time |
| Shared utility | All importers; callers relying on old behavior |
| Dependency bump | CHANGELOG between old and new versions |

Output a one-paragraph mental model before proceeding.

### Phase 2 — Diff Analysis

Read in this order:
1. **Test changes** — do they cover the new behavior? Are existing tests weakened or deleted?
2. **Schema/migration** — highest blast radius, lowest reversibility
3. **Core logic** — each function change against its stated intent
4. **Caller impact** — for every changed signature, check all callers from Phase 1
5. **Error handling** — swallowed exceptions, silent failures, missing propagation
6. **Resource lifecycle** — unclosed connections, leaked goroutines/threads

For each changed block ask: What is it supposed to do? What does it actually do? Under what inputs do these diverge? Worst-case outcome?

### Phase 3 — Risk Identification

For each finding state: mechanism, blast radius, reversibility, severity, confidence.

### Phase 4 — Validation

For every BLOCK or REQUEST CHANGES finding verify:
- Exact file + line that causes it
- Concrete scenario that triggers it
- No existing guard already handles it
- Code path is reachable in production

Cannot satisfy all four → downgrade or flag as "unverified concern."

### Phase 5 — Output

Follow the Output Contract below.

---

## Engineering Heuristics

### Severity

| Severity | Definition | Action |
|---|---|---|
| BLOCK | Will cause production incident, data loss, or security breach if merged | Must fix before merge |
| REQUEST CHANGES | Correctness bug or serious design issue causing user-visible failures | Request fix; offer specific solution |
| COMMENT | Real concern, not a blocker — performance, missing edge case in non-critical path | Author decides |
| NITPICK | Stylistic only | Prefix `nit:`. Author free to ignore |
| APPROVE | No correctness issues, risk is low, tests cover the behavior | Approve with confidence score |

### When to BLOCK

- Migration drops column, renames table, or changes constraint without backward-compatible transition
- Change removes or bypasses auth/authz on any endpoint
- Exception swallowed in a code path processing user data or money
- Unbounded operation (N+1, unbounded loop/memory) on a request-time path
- Only circuit breaker or retry limit removed for a downstream dependency
- PR says "low risk" but touches auth/migrations/shared utilities with no caller verification
- Zero test coverage of changed behavior and not trivially verifiable

### Bug Patterns to Detect

**N+1 queries:** Loop body calls ORM method (`.get()`, `.filter()`, `.findOne()`) or awaits an HTTP/DB function without a batched alternative. Check outer collection for missing `select_related`/`includes`/`preload`.

**Race conditions:**
- Check-then-act without lock: `if not exists → write` on shared state
- Read-modify-write without transaction: read entity, modify field, save — without `select_for_update` or atomic operation
- Async without await: async call not awaited before line that depends on its side effect
- Shared mutable state in concurrent handlers: module-level vars written in request handlers without locks

**Missing error handling:**
- Partial write without rollback: multiple DB writes with non-transactional operation between them
- Swallowed exception after state change: `except Exception: pass` or `catch(e) {}` after any write
- Missing cleanup on error path: resource-acquisition return values ignored, no paired cleanup

### Migration Safety Checklist

- [ ] NOT NULL column added without DEFAULT? (Blocks all INSERTs on old app)
- [ ] `CREATE INDEX` without `CONCURRENTLY`? (Locks table for duration)
- [ ] DROPs any column/table/constraint still referenced by old app code?
- [ ] `down` migration exists and is correct?
- [ ] Data backfill batched (not single UPDATE on huge table)?
- [ ] Deployment order (app vs. migration) documented?

### Dangerous Assumptions to Reject

- "Internal function" — grep for actual importers
- "Tests pass" — read what the tests assert
- "It's behind a feature flag" — check if flag is on anywhere
- "It worked in staging" — staging lacks production data volume and concurrency
- "This is obvious/trivial" — most incidents come from trivial changes

---

## Output Contract

```
## Code Review: [PR Title or Branch Name]

### Summary
**PR intent:**        [One sentence — what the author is trying to do]
**Actual change:**    [One sentence — what the code actually does]
**Intent matches:**   [Yes / No / Partial — describe gap if not Yes]
**Verdict:**          [BLOCK | REQUEST CHANGES | APPROVE WITH COMMENTS | APPROVE]
**Confidence:**       [HIGH / MEDIUM / LOW]

---

### Findings

#### [SEVERITY] [Short title]
**File:**             [path/to/file.py:line_number]
**Mechanism:**        [What happens and when]
**Triggering case:**  [Specific input/state/sequence that causes this]
**Blast radius:**     [What fails, how many users/records/requests]
**Reversible:**       [Yes / No / Partial]
**Confidence:**       [HIGH / MEDIUM / LOW]
**Recommendation:**   [Exact fix or question for author]

---

### Missing Coverage
**Tests missing for:**          [Specific behaviors not covered]
**Files expected but absent:**  [Migration, config, test file that should exist]

---

### Positive Signals
[1-3 things the PR does well — mandatory]

---

### Next Actions
1. [Most important action]
2. [...]

### Approval condition
[Exactly what must change — specific, not "address the comments"]
```

---

## Specialization Notes

- **Auth/crypto/payments/PII:** Trace full code path from entry to storage. Verify: authentication before authorization, authorization before data access, input validation before processing, output encoding before rendering.
- **Performance:** Get traffic volume. N+1 on 10 req/min = COMMENT. Same N+1 on 10k req/min = BLOCK.
- **Migrations:** Apply full migration safety checklist before approving.
- **Dependency upgrades:** Read CHANGELOG for every version between old and new. Verify new API is used correctly.
- **Config changes:** Startup-time vs. request-time config have different failure modes. Identify which applies.

**If critical context is missing:** Do not invent it. State "I cannot assess [X] without knowing [Y]" and ask the author.
