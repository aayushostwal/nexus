---
name: nexus-code-review
description: >
  Use this skill when the user needs a thorough, senior-engineer-quality review of a pull request,
  diff, or code change. Trigger phrases include: "review this PR", "review my code changes",
  "what are the issues with this diff", "can you find bugs in this PR", "review this before I merge",
  "is this safe to deploy", "check my migration for issues", "security review this change",
  "is this PR production-ready", "what did I miss in this PR". Also trigger when the user pastes
  a diff, GitHub PR URL, list of changed files, or branch name and asks for feedback, risk assessment,
  correctness analysis, or approval advice. Also trigger when the user asks you to be a code reviewer,
  catch bugs before merge, or assess blast radius of a change.
  When in doubt, use this skill.
---

# Nexus Code Review

Semantic PR review as an engineering reasoning system — not a style linter, not a prompt wrapper.

---

## Metadata

| Field | Value |
|-------|-------|
| name | nexus-code-review |
| category | code-review |
| description | Systematic semantic review of pull requests with blast radius, risk, and correctness analysis |
| required_context | Diff or list of changed files; base branch; PR description (if available) |
| expected_inputs | Git diff, file paths, PR title/description, repo context (tech stack, language, framework) |
| expected_outputs | Structured review report: findings with severity, evidence, blast radius, confidence, and recommendations |

---

## Skill Philosophy

### What problem this solves

Most code review is syntactic: formatting, naming, obvious null checks. That kind of review is
already automated by linters. What linters cannot do — and what this skill does — is **semantic
review**: understanding what the code is *supposed* to do, what it *actually* does, and where
those diverge in ways that will cause production incidents.

The failure mode this skill addresses is not "reviewer was careless." It is "reviewer read the
code without reading the *system* the code lives in." A function change that looks safe in isolation
can be catastrophic when you know it is called by 40 different callers, three of which pass
unbounded inputs.

### Why it matters

Post-mortem analysis of major production incidents consistently traces back to PRs that were
reviewed and approved. The reviewer read the lines. The lines looked fine. Nobody checked:
- Whether a migration was reversible
- Whether a new index lock would block the table for 20 minutes
- Whether a changed function signature had callers with different assumptions
- Whether a "trivial config change" was read at startup vs. runtime
- Whether removing a circuit breaker would take down a dependency chain under load

This skill builds the mental model a senior engineer builds before approving: the diff is the
last thing they look at, not the first.

### Engineering principles

1. **Evidence before verdict.** Every finding must cite exact file + line + mechanism. No vague concerns.
2. **Blast radius over line count.** A 3-line change can be more dangerous than a 300-line refactor.
3. **Correctness before style.** If the logic is wrong, formatting is irrelevant.
4. **Callers matter.** The safety of a change depends on every caller, not just the changed code.
5. **Reversibility is a first-class concern.** Irreversible changes require a higher bar.
6. **Test changes are code.** A PR that adds bad tests or removes test coverage is dangerous.

---

## Context Acquisition

### What to collect before reading the diff

Run these commands to build system context before analyzing a single line of the PR:

```bash
# Understand the shape of the change
git diff origin/main...HEAD --stat
git log origin/main...HEAD --oneline

# Read callers of changed functions (critical — do not skip)
git grep -n "function_name" -- "*.py" "*.ts" "*.go"

# Check if changed files touch shared utilities or core paths
git diff origin/main...HEAD --name-only

# Check recent history of changed files — were they recently broken/fixed?
git log --oneline -10 -- path/to/changed/file.py

# Check if any tests exist for the changed code
find . -name "test_*.py" -o -name "*.test.ts" -o -name "*_test.go" | xargs grep -l "function_name"
```

### What files to inspect beyond the diff

| Changed code type | Also inspect |
|------------------|-------------|
| Function signature change | Every caller of that function in the codebase |
| Database schema change | Migration history, ORM models, serializers, API response shapes |
| Authentication/auth change | All routes protected by that middleware, token validation paths |
| Config change | Where config is read: startup vs. request time, which services read it |
| Shared utility change | All importers; check if any caller relies on old behavior |
| Dependency version bump | CHANGELOG for the new version; imports that use changed APIs |
| Queue/async change | Consumers of the queue; retry logic; dead letter handling |
| Cache change | Cache invalidation paths; TTL assumptions; cache stampede risk |

### Signals that matter most

Prioritize your review time on these signals — they are disproportionately associated with
production incidents:

- Lock operations (database, distributed, file system)
- Migrations with destructive operations (DROP, ALTER, DELETE, TRUNCATE)
- Authentication and authorization path changes
- Changes to error handling that swallow exceptions
- Changes to retry logic or circuit breakers
- Changes to data serialization/deserialization format
- Changes to background jobs or queue consumers
- Removal of input validation or type checking

---

## Execution Workflow

### Phase 1 — Context Collection (do not skip)

**Goal:** Build a mental model of the system before reading the diff.

1. Read the PR title and description. Identify the stated intent.
2. Run `git diff --stat` to understand the scope: which files changed, how many lines.
3. Identify the "center of gravity" — the 1-3 files that contain the core logic change.
4. For each center-of-gravity file, find all callers and dependents.
5. Check if the change touches any of the high-priority signal areas listed above.
6. Note what the PR description says it changes — you will verify this against the actual diff.

**Output of Phase 1:** A one-paragraph mental model:
> "This PR changes [X] in [Y] in order to [Z]. It touches [N] files. The highest-risk surface
> is [file/function] because [reason]. I need to check [specific concern] before approving."

### Phase 2 — Diff Analysis

**Goal:** Read the actual code changes with the mental model from Phase 1 active.

Read the diff in this order:
1. **Test changes first.** Do new tests cover the new behavior? Are any existing tests weakened or deleted?
2. **Schema/migration changes.** These are highest blast radius and lowest reversibility.
3. **Core logic changes.** Read each function change against its stated intent.
4. **Caller impact.** For every changed function signature, check all callers found in Phase 1.
5. **Error handling.** Look for swallowed exceptions, missing error propagation, silent failures.
6. **Resource lifecycle.** Look for unclosed connections, missing cleanup, leaked goroutines/threads.

For each changed block, ask:
- What is this code supposed to do? (From context and comments)
- What does it actually do? (From reading the logic)
- Under what inputs or conditions do these diverge?
- What is the worst-case outcome of that divergence?

### Phase 3 — Risk Identification

**Goal:** Classify every finding by severity and blast radius.

For each finding:
1. State the **mechanism** — what specifically happens and when.
2. State the **blast radius** — what fails, how many users/requests/records are affected.
3. State the **reversibility** — can this be rolled back without data loss or downtime?
4. Assign **severity** (see Engineering Heuristics below).
5. Assign **confidence** (see Validation section below).

### Phase 4 — Validation

**Goal:** Verify your findings are grounded in evidence, not assumptions.

For each BLOCK or CRITICAL finding:
- Can you point to the exact file and line that causes the problem?
- Can you construct a concrete scenario (specific input, state, or sequence of events) that triggers it?
- Have you checked whether there is existing code (tests, guards, middleware) that already handles this?
- Are you certain the code path is reachable in production, not just in a test?

If you cannot answer yes to all four: downgrade to a lower severity or flag as "unverified concern."

### Phase 5 — Structured Output

**Goal:** Produce a review report that is immediately actionable.

Format and content specified in the Output Contract section below.

---

## Engineering Heuristics

### Severity classification

| Severity | Definition | Action |
|----------|-----------|--------|
| BLOCK | The PR will cause a production incident, data loss, or security breach if merged. Evidence is concrete, blast radius is non-trivial. | Do not approve. Must be fixed before merge. |
| REQUEST CHANGES | The code has a correctness bug, missing case, or serious design issue that will cause user-visible failures or tech debt severe enough to block the next feature. | Request changes. Offer specific fix. |
| COMMENT | A genuine concern worth addressing but not a blocker — performance, readability, missing edge case in a non-critical path. | Leave comment. Author decides. |
| NITPICK | Purely stylistic or preference-based. Not required for approval. | Prefix with `nit:`. Author free to ignore. |
| APPROVE | No correctness issues found. Risk is low. Tests cover the behavior. | Approve with confidence score. |

### When to BLOCK

Block the PR if **any** of these conditions is met:
- A migration drops a column, renames a table, or changes a constraint without a backward-compatible transition period.
- A change removes or bypasses authentication/authorization on any endpoint.
- A change causes an exception to be silently swallowed in a code path that processes user data or money.
- A change introduces an unbounded operation (N+1 query, unbounded loop, unbounded memory accumulation) on a code path that runs at request time.
- A change removes the only circuit breaker or retry limit protecting a downstream dependency.
- The PR description says "low risk" but the diff touches a high-signal surface (auth, migrations, shared utilities) with no evidence the author verified callers.
- Test coverage of the changed behavior is zero and the behavior is not trivially verifiable by inspection.

### When to REQUEST CHANGES (not BLOCK)

- A function is called with an unchecked assumption that will fail for some subset of inputs.
- A new code path lacks error handling that the rest of the codebase applies consistently.
- A race condition exists but only under concurrent load that may not occur immediately in production.
- A dependency is added without pinning to a specific version (in a language/ecosystem where this matters).
- A test tests the implementation rather than the behavior (it will pass even when behavior is wrong).

### How to detect N+1 queries from code reading

N+1 is a loop that issues a database query per iteration instead of a single batched query.

**Pattern 1 — Explicit loop with ORM call:**
```python
# N+1: one query per user
for user in users:
    profile = Profile.objects.get(user_id=user.id)
```
Look for: a `for` loop or `.map()` that calls an ORM method (`.get()`, `.filter()`, `.find()`,
`.findOne()`, `.query()`) inside the body. Check if the outer collection is fetched without
`.prefetch_related()`, `include:`, `JOIN`, or `eager loading`.

**Pattern 2 — Lazy-loaded relationship accessed in loop:**
```python
# N+1: accessing .profile triggers a query per iteration
for user in User.objects.all():
    print(user.profile.bio)  # lazy load fires here
```
Look for: a relationship attribute (`.related_model`, `.association`, `.join_column`) accessed
inside a loop on a queryset that does not use `select_related` / `includes` / `preload`.

**Pattern 3 — Service call inside loop:**
```typescript
// N+1: HTTP call per item
for (const item of items) {
    const detail = await fetchItemDetail(item.id);
}
```
Look for: `await` or async call inside a loop body to a function that wraps an HTTP call, cache
read, or DB query. Check if a batch version of the call exists.

**Detection rule:** Any loop whose body contains a call that goes to storage or network is a
candidate N+1. Confirm by checking whether the called function issues a query (read the function
body). Check if the caller uses `.all()` or `find()` before the loop without a join hint.

### How to detect race conditions from code reading

**Pattern 1 — Check-then-act without lock:**
```python
if not cache.exists(key):      # check
    result = compute_expensive()
    cache.set(key, result)     # act
```
Between the check and the set, another request can run the same check and also find the key
missing. Look for: `if not exists` / `if none` / `if null` followed by a write to shared state
(cache, DB, file, queue) without a lock, transaction, or atomic operation.

**Pattern 2 — Read-modify-write without transaction:**
```python
user = User.objects.get(id=user_id)
user.balance -= amount
user.save()
```
Two concurrent requests can both read the same balance, both subtract, and both write — losing
one decrement. Look for: read an entity, modify a field, save — without `select_for_update`,
`UPDATE ... WHERE`, atomic increment, or a database transaction wrapping all three steps.

**Pattern 3 — Async without await:**
```typescript
// Bug: write is fire-and-forget — next line runs before write completes
db.save(record);
return { success: true };
```
Look for: async function calls that are not awaited before the next line that depends on their
side effect.

**Pattern 4 — Shared mutable state in concurrent handlers:**
Look for: module-level mutable variables, class variables, or singleton attributes that are
written by request handlers without a lock. In Python: `global` keyword in a view function.
In Go: map write without `sync.Mutex`. In Node: shared array/object modified in async handlers.

### How to spot missing error handling that causes data corruption

**Pattern 1 — Partial write without rollback:**
```python
db.insert(record_a)
external_api.call()   # if this throws, record_a is committed but b is not
db.insert(record_b)
```
Look for: multiple writes to persistent storage (DB, file, object store) that are not wrapped
in a transaction, with a non-transactional operation (HTTP call, email, queue publish) between
them.

**Pattern 2 — Swallowed exception after partial state change:**
```python
try:
    charge_card(amount)
    send_confirmation_email()
except Exception:
    pass  # charge happened, email did not — user charged silently
```
Look for: `except Exception: pass`, `catch(e) {}`, or `catch (ignored)` after any operation
that changes state. The question is: what has already been committed before this exception is
swallowed?

**Pattern 3 — Missing cleanup on error path:**
```go
file, _ := os.Open(path)   // ignores error
defer file.Close()          // panics if file is nil
```
Look for: return values from resource-acquisition calls that are ignored (Go `_`, Python
missing `if err != nil`, Node missing `.catch()`). Any resource acquired without a paired
cleanup in the error path is a leak.

### How to assess migration safety

For every database migration in the diff, check all five properties:

| Property | Check | Safe | Unsafe |
|----------|-------|------|--------|
| Backward compatibility | Can the old app code run against the new schema? | Add nullable column; add index concurrently | Add NOT NULL column without default; rename column |
| Forward compatibility | Can the new app code run against the old schema? | Read new nullable column with default | Require new column to exist |
| Lock risk | Does the migration acquire a table lock? | Create index CONCURRENTLY; add nullable column | Create index without CONCURRENTLY; ALTER COLUMN type |
| Rollback | Can the migration be reversed without data loss? | Add column (drop it); add index (drop it) | Drop column; DROP TABLE; data backfill |
| Zero-downtime | Can the migration be applied while the app serves traffic? | Most additive changes | Any change that requires app and DB to be in sync simultaneously |

**Migration review checklist:**
- [ ] Does the migration add a NOT NULL column without a DEFAULT? (Blocks all INSERTs on old app code)
- [ ] Does the migration use `CREATE INDEX` without `CONCURRENTLY`? (Locks table for duration)
- [ ] Does the migration DROP any column, table, or constraint that old app code still references?
- [ ] Is the migration reversible? Does a `down` migration exist and is it correct?
- [ ] Is there a data backfill? If so, is it batched (not a single UPDATE on a huge table)?
- [ ] Does the deployment order (app deploy vs. migration run) matter? Is it documented?

### The "single-owner assumption" anti-pattern

A change is described as safe because the author knows how the code is used — by them, in their
service, in their tests. The assumption: no one else calls this. No one else depends on this behavior.

This is the most dangerous assumption in code review. Validate it: `git grep "function_name"` and
`git grep "ClassName"`. Count the callers. Read each one. Only then say the change is safe.

Specifically watch for:
- "This is an internal function" — check if it is actually imported elsewhere
- "We control both sides" — check if there is a client SDK, a queue consumer, or a CLI tool on the other side
- "The tests pass" — check what the tests actually assert (implementation vs. behavior)
- "It's behind a feature flag" — check if the flag is on in any environment already

### Semantic vs syntactic review

| Dimension | Syntactic (what linters do) | Semantic (what this skill does) |
|-----------|---------------------------|--------------------------------|
| Focus | Style, formatting, naming | Correctness, safety, intent |
| Tool | ESLint, Prettier, Black, golangci-lint | Human reasoning, system context |
| Example finding | Variable name should be camelCase | This function silently returns nil on the error path callers do not check |
| Value | Consistency | Production safety |
| When to care | Never during review — automate it | Always |

Do not spend review time on anything a linter could catch. If a PR has linting issues, tell
the author to run the linter and re-submit. Your finite review attention is for semantic issues only.

---

## Failure Modes

### Hallucination risks

- **Inventing callers.** Claiming a function has no callers without running `git grep`. Always grep.
- **Wrong blast radius.** Estimating how many users/records are affected without checking actual data volume or query patterns.
- **False security finding.** Flagging something as a security issue based on surface appearance without tracing the full code path. Always trace.
- **Missing context.** Flagging a missing null check without checking whether the null case is prevented upstream.

### Incomplete context dangers

- Reviewing a migration without knowing whether the app deploys before or after migrations run.
- Reviewing an auth change without knowing which routes use the middleware being changed.
- Reviewing a performance change without knowing the actual traffic volume on the affected path.
- Reviewing a change to a shared library without knowing which services import it.

**If you cannot get critical context:** Do not invent it. State "I cannot assess [X] without knowing [Y]." Downgrade the finding to "unverified concern" and ask the author.

### Dangerous assumptions

| Assumption | Why dangerous | What to do instead |
|-----------|--------------|-------------------|
| "The tests cover this" | Tests may test the implementation, not the behavior | Read the test assertions |
| "This is obvious/trivial" | Most production incidents come from "trivial" changes | Check every change against the blast radius heuristics |
| "The author knows what they're doing" | Authors miss their own edge cases | Check mechanically, not by trust |
| "This looks like a refactor" | Refactors change behavior; that's often the bug | Diff expected inputs/outputs, not just structure |
| "It worked in staging" | Staging rarely has production data volume, concurrency, or edge-case inputs | Ask about load testing or traffic replay |

---

## Validation

### Correctness checks for the review itself

Before finalizing your review, verify:

- [ ] Every BLOCK or REQUEST CHANGES finding cites an exact file path and line number.
- [ ] Every finding states the concrete scenario that triggers it (not "could potentially").
- [ ] You have run `git grep` for every changed function/class to check callers.
- [ ] You have read the test changes, not just the logic changes.
- [ ] You have checked the migration safety checklist if any migration files are in the diff.
- [ ] You have not flagged any issue that existing code already handles (check guards, middleware, validators).
- [ ] Your severity ratings follow the definitions in the Heuristics section, not your intuition.

### Confidence scoring

Assign a confidence level to each finding:

| Confidence | Meaning | Criteria |
|-----------|---------|---------|
| HIGH | This issue definitely exists and will cause the described problem. | Traced the full code path. Found the exact caller. Constructed a triggering scenario. Verified no existing guard handles it. |
| MEDIUM | This issue very likely exists but I cannot fully verify without runtime information. | Found the code pattern. Cannot confirm it is reachable in production without traffic data or config values. |
| LOW | This is a plausible concern but I am missing context to confirm it. | Recognized a known-dangerous pattern but could not trace it to a concrete failure mode without more information. |
| UNVERIFIED | I suspect an issue but cannot confirm or deny without information I do not have. | Raise as a question to the author, not as a finding. |

### How to know if you have missed something important

Ask these questions before closing the review:

1. **Did I read the test changes?** If no: stop. Read them now.
2. **Did I check callers of every changed function?** If no: run `git grep` now.
3. **Is there a migration in the diff?** If yes: did I apply the full migration safety checklist?
4. **Does the PR touch auth, payments, or data deletion?** If yes: have I traced the full code path end-to-end?
5. **Did the PR description match the actual diff?** If no: the gap is a finding in itself.
6. **Are there files that are NOT in the diff but should be?** (Missing test file, missing migration, missing config update)

---

## Output Contract

Every review produced by this skill must follow this structure. Fill in every field. Write `none` if not applicable — never leave a field blank.

```
## Code Review: [PR Title or Branch Name]

### Summary
**PR intent:**        [One sentence — what the author is trying to do]
**Actual change:**    [One sentence — what the code actually does, based on reading the diff]
**Intent matches:**   [Yes / No / Partial — if Partial or No, describe the gap]
**Verdict:**          [BLOCK | REQUEST CHANGES | APPROVE WITH COMMENTS | APPROVE]
**Confidence:**       [HIGH / MEDIUM / LOW — confidence in the verdict, not in individual findings]

---

### Findings

#### [SEVERITY] [Short title]
**File:**             [path/to/file.py:line_number]
**Mechanism:**        [What happens and when — concrete, not abstract]
**Triggering case:**  [Specific input, state, or sequence of events that causes this]
**Blast radius:**     [What fails, how many users/records/requests are affected]
**Reversible:**       [Yes / No / Partial — can this be rolled back without data loss?]
**Confidence:**       [HIGH / MEDIUM / LOW]
**Recommendation:**   [Exact fix or question to ask the author]

[Repeat for each finding]

---

### Missing Coverage
**Tests missing for:**   [Specific behaviors not covered by the test changes]
**Files expected but absent:**  [Migration, config update, test file, etc. that should exist but does not]

---

### Positive Signals
[1-3 things the PR does well — mandatory, not optional. Omitting this makes reviews feel adversarial.]

---

### Next Actions
1. [Most important action for the author]
2. [Second action if applicable]
3. [...]

### Approval condition
[Exactly what must change for this PR to be approved — specific, not "address the comments"]
```

---

## Specialization Notes

- **For security-sensitive PRs** (auth, crypto, payments, PII): Trace the full code path from entry point to storage. Do not assess surface code only. Check: authentication before authorization, authorization before data access, input validation before processing, output encoding before rendering.
- **For performance-critical PRs**: Ask for the traffic volume on the affected path. An N+1 that runs on 10 req/min is a COMMENT. The same N+1 on 10k req/min is a BLOCK.
- **For migrations**: Apply the full migration safety checklist. Do not approve a migration you have not assessed for lock risk and rollback safety.
- **For dependency upgrades**: Read the CHANGELOG for every version between old and new. Flag breaking changes. Check if the new API is used correctly.
- **For config changes**: Determine whether config is read at startup or at request time. Startup-time config changes require a redeploy; runtime-time config changes may take effect immediately — both have different failure modes.
