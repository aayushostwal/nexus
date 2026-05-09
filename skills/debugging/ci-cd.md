# CI/CD Failure Debugging

## Goal

Investigate CI/CD failures from evidence, identify the root cause, explain why the failure happens, propose and refine a fix, implement it, and verify the pipeline can pass.

## Required Workflow

Follow `skills/debugging/common.md`, plus:

1. Fetch the CI/CD logs.
2. Identify the failing job, step, command, and exact error.
3. Determine whether the failure is source code, tests, dependencies, env vars, secrets, permissions, caching, infra, or flakiness.

## Evidence Collection

For GitHub Actions:

- Use `gh run list`, `gh run view`, and `gh run view --log` when available.
- Identify the branch, workflow, run ID, failing job, and failing step.
- Compare against the base branch with `git diff`, `git log`, and changed files.

For Jenkins:

- Fetch the build console output from Jenkins.
- Identify the job name, build number, node/agent, stage, failing command, and environment.
- Compare failed build inputs with the last known passing build.

## Investigation Rules

- Do not guess from the last error line only.
- Read enough surrounding log context to understand the failing command.
- Verify whether the failure reproduces locally before changing code when practical.
