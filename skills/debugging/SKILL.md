---
name: nexus-debugging
description: >
  Use this skill when debugging any failure: CI/CD pipeline failures, broken tests, build errors,
  deployment failures, tooling issues, framework bugs, or codebase regressions. Trigger phrases include:
  "this is failing", "CI is broken", "tests won't pass", "build failed", "my deploy is failing",
  "getting an error in", "why is X broken", "help me debug", "I have a stack trace", "error in production",
  "something regressed", "flaky test", "pipeline is red". Also trigger when the user pastes a stack trace,
  GitHub Actions log, pytest output, or Docker build error. When in doubt, use this skill.
---

# Nexus Debugging

Route to the correct sub-guide and follow it end-to-end.

---

## Compatibility
- Sub-guides: `skills/debugging/ci-cd.md`, `skills/debugging/codebase.md`, `skills/debugging/frameworks.md`
- Shared rules and output formats: `skills/debugging/common.md`

---

## Workflow

### Step 1 — Classify the Failure
Pick exactly one track:

| Track | Failure origin | Sub-guide |
|-------|---------------|-----------|
| CI/CD | GitHub Actions, Jenkins, CircleCI, or deployment pipeline log | `ci-cd.md` |
| Codebase | Failing test, runtime exception, or regression in application code | `codebase.md` |
| Framework | Django, FastAPI, Bazel, or other tooling misbehavior | `frameworks.md` |

If unsure: ask "Is the failure in pipeline logs, app code, or a framework?"

### Step 2 — Gather Error Context
Before reading the sub-guide, collect:
1. Full error message or stack trace — copy exact text, do not paraphrase
2. What changed recently: last commit, dependency update, config change, environment change
3. Environment details: local vs CI, OS, Python/Node/runtime version
4. Steps to reproduce (minimum reproducible case if possible)

### Step 3 — Read Sub-Guide & Execute
Read the appropriate sub-guide. Follow its steps in order. Do not skip steps.
Read `common.md` for shared output format and checklists.

### Step 4 — Search for Tool-Specific Errors
If the error is framework-specific or tool-specific:
1. Search: `"<exact error message>" <tool-name> <version>` — use exact error text
2. Check the official tool changelog for breaking changes in the version in use
3. Check GitHub Issues for the tool repo filtered by the error keyword

### Step 5 — Apply Fix & Verify
1. Apply the narrowest fix that addresses the root cause — do not clean up unrelated code
2. Run the exact verification command that confirms the fix (re-run the failing test or job)
3. State what would prevent this from recurring

---

## Output Format

```
## Debug Report
**Track:** [CI/CD | Codebase | Framework]
**Root Cause:** [one sentence — specific, not "something went wrong"]
**Fix:** [exact command or minimal code diff]
**Verification:** [command to run to confirm fix]
**Prevention:** [what change stops this from recurring]
```

---

## Anti-Patterns
- Never guess the root cause without reading the full error message and stack trace first.
- Never apply a fix without stating and running a verification step.
- Never mix tracks — pick one sub-guide and follow it completely before considering another.
- Never paraphrase an error message when searching — copy it verbatim.
- Never mark the issue resolved before running the verification command.
- Never clean up unrelated code as part of a bug fix — scope the change to the root cause only.

---

## Examples

**Input:** User pastes GitHub Actions log:
```
ModuleNotFoundError: No module named 'pydantic'
Error: Process completed with exit code 1.
```

**Step 1:** Track = CI/CD (failure in pipeline)
**Step 2:** Error = `ModuleNotFoundError: No module named 'pydantic'`; changed = recent dependency PR; env = GitHub Actions Ubuntu 22.04
**Step 4:** Search `"ModuleNotFoundError: No module named 'pydantic'" github actions` → find pydantic missing from requirements.txt

**Output:**
```
## Debug Report
Track: CI/CD
Root Cause: pydantic installed locally but not in requirements.txt — CI builds from scratch so it's absent
Fix: pip freeze | grep pydantic >> requirements.txt && git add requirements.txt && git commit -m "fix: add pydantic to requirements"
Verification: Re-run the failing GitHub Actions job — confirm it passes
Prevention: Add a CI step that runs `pip check` after install to catch missing transitive deps
```

---

## Debugging Specialization
- For CI/CD failures: always check if the failure is environment-specific — works locally but fails in CI = env delta (missing secret, different OS, version mismatch).
- For codebase bugs: always check if a recent commit introduced the regression; use `git bisect` if the commit is not obvious.
- For framework issues: always check the framework changelog for the exact version in use before assuming it's your code.
- For flaky tests: run the test 5 times in isolation before investigating — confirm it's truly flaky vs. consistently failing.
