---
name: debugging-common
description: >
  This is the shared rules and output contract loaded by all nexus debugging sub-skills.
  Trigger phrases include: "debug this error", "why is this failing", "something broke",
  "find the root cause", "investigate this failure", "this stopped working after my last change",
  "fix this bug", "what's causing this crash". Also trigger when the user pastes a stack trace,
  error log, CI failure output, or test failure and asks for help diagnosing or fixing it.
  Also loaded automatically by skills/debugging/SKILL.md whenever any debugging track is active.
  When in doubt, use this skill.
---

# Debugging Common Rules

Shared investigation workflow, approval gates, and output contract for all nexus debugging tracks.

---

## Compatibility
- Loaded by: `skills/debugging/SKILL.md` (router)
- Used by: `skills/debugging/ci-cd.md`, `skills/debugging/codebase.md`, `skills/debugging/frameworks.md`
- Required tools: Read, Grep, Glob, Bash
- Optional tools: WebSearch (for tool-specific error lookups)

---

## Core Principle

**Investigate first. Never propose a fix before the root cause is established from evidence.**

A correct diagnosis with a wrong fix is recoverable. A wrong diagnosis wastes hours and may
introduce new failures. Every step below exists to narrow from symptom → mechanism → cause.

---

## Workflow

### Step 1 — Capture the Exact Failure

Do not paraphrase. Collect the raw signal:

| Failure type | What to capture |
|-------------|----------------|
| Stack trace | Full trace verbatim — every frame, not just the top one |
| CI log | The last non-empty output line before `Error:` or `exit code N` |
| Test failure | Test name, file path, line number, and exact assertion message |
| Runtime crash | Process exit code, signal name (SIGSEGV, SIGTERM), and last log line |
| Silent wrong output | Expected value, actual value, and the input that produced it |

Identify the **first frame in user code** (not library/framework code) — that is the entry
point of the failure, not necessarily the root cause.

### Step 2 — Establish What Changed

Run these commands before reading any code:

```bash
git log --oneline -10                                              # recent commits
git diff HEAD~1 -- package.json requirements.txt go.mod Gemfile   # dependency changes
git diff <base-branch>...HEAD                                      # all changes on this branch
```

Record the answers:
- When did this last work? (last passing commit or deploy)
- What changed between then and now? (commits, deps, config, env vars, infra)
- Is this failure new or has it happened before?

If the failure is in CI only: also compare runtime versions, env vars, and OS between local and CI.

### Step 3 — Reproduce the Failure

Run the **exact command** that triggers the failure — not a different command that "should" reproduce it.

```bash
# Examples of exact reproduction commands:
pytest tests/test_users.py::test_create_user -xvs
npm test -- --grep "POST /users"
go test ./internal/auth/... -run TestLoginFlow -v
```

Note in one line: `Local: [passes/fails] | CI: [passes/fails]`

If cannot reproduce locally, the root cause is an environment delta — identify it:
- Different OS or runtime version (`node --version`, `python --version`)
- Missing or different env var (compare `.env.example` vs CI secrets)
- Different network access (external API calls that fail in CI)
- File permission or path differences

### Step 4 — Read the Root Cause Evidence

Starting from the first user-code frame identified in Step 1, read the relevant source lines.
Ask these questions in order — stop when one matches:

1. **Null / undefined access** — is a value assumed non-null that can be null here?
2. **Type mismatch** — is a string passed where a number is expected, or vice versa?
3. **Missing import / dependency** — is a module present locally but not in the lockfile?
4. **Config or env var** — is a required key absent or set to a wrong value?
5. **Race condition / async** — is an async operation awaited that should be, or vice versa?
6. **Version breaking change** — did a dep upgrade change a function signature or default behaviour?

State the root cause as one sentence:
> *"X fails because Y when Z."*

If you cannot state it in one sentence, you have not found the root cause yet — keep narrowing.

### Step 5 — Search for Tool-Specific Errors

If the error comes from a framework, library, or tool (not pure user code):

1. Search verbatim: `"<exact error message>" <tool-name> <version>`
2. Check the tool's GitHub Issues filtered by the error keyword
3. Check the tool's CHANGELOG for breaking changes in the version currently in use

Prefer: official docs, GitHub Issues on the tool's own repo, Hacker News threads.
Deprioritize: generic blog posts, Stack Overflow answers older than 2 years.

### Step 6 — Propose Fix with Rationale

State all three of these — never just state the fix:

1. **What** — the exact file, line number, and change (not "update the config")
2. **Why** — how this change addresses the root cause identified in Step 4
3. **Blast radius** — what else this change might affect (other callers, tests, downstream services)

If multiple valid approaches exist, present a trade-off table and wait for the user to decide:

| Approach | Upside | Downside | Recommended if |
|----------|--------|----------|---------------|
| Option A | ... | ... | ... |
| Option B | ... | ... | ... |

### Step 7 — Implement the Narrowest Fix

Change **only** the lines that fix the root cause. Rules:
- Do not clean up unrelated code in the same commit
- Do not rename variables or extract helpers unless they are part of the fix
- Do not add error handling for scenarios that cannot occur given the root cause

### Step 8 — Update Tests and Documentation

- Add or update the test that directly covers the fixed case — name it after the behaviour:
  `test_create_user_returns_400_when_email_missing` not `test_fix_for_issue_123`
- Update documentation only if the fix changes behaviour visible to users or other teams
- If no test is needed (e.g., config-only fix), state why explicitly

### Step 9 — Verify

Run in this order — stop and report if any step fails:

1. The specific failing test or command from Step 3 — confirm it now passes
2. The full test suite for the affected module: `pytest tests/users/` or `npm test -- users`
3. Any integration or E2E tests if the fix touches a system boundary

State the exact command run and its output (pass/fail line count, not just "it passed").

---

## Approval Gates

Ask before taking any of these actions — once per action, not once per session:

| Action | Requires approval |
|--------|-----------------|
| Push a commit or open a PR | Yes |
| Post to Slack, email, or any messaging tool | Yes |
| Create or update a Jira ticket | Yes |
| Run any AWS / cloud CLI command that mutates state | Yes |
| Restart a service or trigger a deployment | Yes |
| Delete files or database rows | Yes |

Never print, log, or include in any output: secrets, tokens, API keys, passwords, or credentials.

---

## Output Format

Every debug session must close with this report. Fill in every field — write `none` if not
applicable, never leave a field blank:

```
## Debug Report

**Outcome:**             [one-line summary — "Fixed X in Y" or "Identified root cause; awaiting user decision"]
**Symptom:**             [exact error message or observed wrong behaviour — verbatim, not paraphrased]
**Root Cause:**          [one sentence — "X fails because Y when Z"]
**Why It Happens:**      [2-3 sentences explaining the mechanism, not just restating the symptom]
**Proposed Fix:**        [exact file path + line number + change description]
**Decision Needed:**     [yes / no — if yes, describe the trade-off and options]
**Changes Made:**        [bullet list of files changed, or "none — awaiting approval"]
**Verification:**        [exact command run + pass/fail result]
**Test / Doc Updates:**  [what was added or changed, or "none required — <reason>"]
**Next Step:**           [one clear action for the user to take]
```

---

## Anti-Patterns

- Never propose a fix before completing Steps 1–4 — stating a fix without a root cause is a guess, not debugging.
- Never paraphrase an error message when searching in Step 5 — exact text finds the right issue; paraphrases miss it.
- Never change more than the root cause in Step 7 — scope creep in a bug fix introduces new failures and makes rollback harder.
- Never skip Step 9 verification — "it should work now" is not evidence; the verification command output is.
- Never make an external write (Slack, Jira, AWS, deploy) without the approval listed in the Approval Gates table.
- Never mark a debug session complete while the `Decision Needed` field in the report is unresolved.

---

## Examples

**Input:** User pastes:
```
TypeError: Cannot read properties of undefined (reading 'id')
    at processUser (/app/src/users.js:42:23)
    at Array.map (<anonymous>)
    at /app/src/routes/users.js:18:20
```

**Step 1:** First user-code frame → `src/users.js:42` — `.id` accessed on undefined value.

**Step 2:** `git log --oneline -3` shows last commit added bulk user import endpoint 2 hours ago.

**Step 3:** `npm test -- --grep "POST /users/bulk"` → fails with same error. `Local: fails | CI: fails`

**Step 4:** Read `src/routes/users.js:18` — `req.body.users.map(processUser)`. Read `src/users.js:42` — `user.id` with no null guard.
Root cause: *"`processUser` receives `undefined` because the client can send null entries in the users array and `Array.map` passes them through without filtering."*

**Step 6 fix:** `src/routes/users.js` line 18 — change `.map(processUser)` to `.filter(Boolean).map(processUser)`.
Blast radius: only the `/users/bulk` route. No other callers of `processUser` pass arrays.

**Output:**
```
## Debug Report

**Outcome:**            Fixed null reference crash in POST /users/bulk
**Symptom:**            TypeError: Cannot read properties of undefined (reading 'id') at processUser (src/users.js:42:23)
**Root Cause:**         `processUser` receives `undefined` because the client can send null entries in the
                        users array and `Array.map` passes them through without filtering
**Why It Happens:**     `req.body.users.map(processUser)` in routes/users.js does not validate array entries
                        before mapping. When a client sends `{"users": [null, {...}]}`, the null is passed
                        directly to `processUser`, which crashes accessing `.id` on line 42.
**Proposed Fix:**       src/routes/users.js line 18 — change `.map(processUser)` to `.filter(Boolean).map(processUser)`
**Decision Needed:**    No — single unambiguous fix, no meaningful trade-offs
**Changes Made:**       - src/routes/users.js (line 18)
**Verification:**       `npm test -- --grep "POST /users/bulk"` → 4 tests pass (was 1 failing)
**Test / Doc Updates:** Added test in test/routes/users.test.js: "returns 200 and skips null entries in bulk import"
**Next Step:**          Review whether other bulk endpoints have the same missing null filter
```

---

## Debugging Specialization

**Evidence hierarchy** — when signals conflict, trust in this order:

1. Stack trace line numbers (exact)
2. `git diff` output (what changed)
3. Test failure assertion message (expected vs actual)
4. Runtime logs (what happened)
5. Developer's description of the problem (least reliable — what they think happened)

**For intermittent failures:** run the failing command 5 times before investigating. If it fails
fewer than 3 of 5 runs, it is flaky — treat as a concurrency or state-isolation issue, not a
deterministic bug. Do not attempt root cause analysis from a single failing run.

**For "works locally, fails in CI":** the root cause is always an environment delta. Diff these
variables between local and CI before reading any code: runtime version, env vars present,
OS/arch, network access, file system permissions, working directory.
