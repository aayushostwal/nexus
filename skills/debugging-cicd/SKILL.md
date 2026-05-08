---
name: nexus-debugging-cicd
description: Use when investigating CI/CD failures in GitHub Actions, Jenkins, or similar pipelines, including failed builds, tests, deployments, lint jobs, and release workflows.
---

# CI/CD Failure Debugging

## Goal

Investigate CI/CD failures from evidence, identify the root cause, explain why the failure happens, propose and refine a fix, implement it, and verify the pipeline can pass.

## Required Workflow

1. Fetch CI/CD logs.
2. Verify changes from the base branch.
3. Identify the failing job, step, command, and exact error.
4. Trace the failure to the root cause.
5. Explain why this is happening and how to fix it.
6. Propose the solution.
7. Improve the solution through user interaction when there are trade-offs or risky changes.
8. Implement the changes.
9. Update documentation if required.
10. Update or add test cases if required.
11. Re-run the smallest relevant verification first, then broader checks.

## Evidence Collection

For GitHub Actions:

- Use `gh run list`, `gh run view`, and `gh run view --log` when available.
- Identify the branch, workflow, run ID, failing job, and failing step.
- Compare against the base branch with `git diff`, `git log`, and changed files.

For Jenkins:

- Fetch the build console output from Jenkins.
- Identify the job name, build number, node/agent, stage, failing command, and environment.
- Compare the failed build inputs with the last known passing build.

## Investigation Rules

- Do not guess from the last error line only.
- Read enough surrounding log context to understand the failing command.
- Check whether the failure is caused by source code, tests, dependency versions, environment variables, secrets, permissions, caching, infrastructure, or flaky timing.
- Verify whether the failure reproduces locally before changing code when practical.
- If credentials, tokens, or secrets are involved, never print them.

## Output Format

```text
Outcome:
Failing CI/CD Step:
Root Cause:
Why It Happens:
Proposed Fix:
User Decision Needed:
Changes:
Verification:
Documentation/Test Updates:
Next Step:
```
