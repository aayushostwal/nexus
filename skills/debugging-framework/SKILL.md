---
name: nexus-debugging-framework
description: Use when debugging framework, tooling, or platform-specific failures involving Django, FastAPI, Bazel, Jenkins, GitHub Actions, build systems, package managers, or similar technologies; always fetch current official documentation.
---

# Framework Debugging

## Goal

Debug framework/tooling failures using current official documentation, local evidence, and repo conventions before implementing a fix.

## Required Workflow

1. Identify the framework, tool, package, version, and command involved.
2. Always fetch current official documentation from the internet.
3. Verify changes from the base branch.
4. See what is failing and capture the exact error.
5. Identify the root cause.
6. Explain why this is happening and how to fix it.
7. Propose the solution.
8. Improve the solution through user interaction when multiple valid approaches exist.
9. Implement the changes.
10. Update documentation if required.
11. Update or add test cases if required.
12. Verify with framework-native checks.

## Documentation Rules

- Use official documentation first.
- For Django, prefer `docs.djangoproject.com`.
- For FastAPI, prefer `fastapi.tiangolo.com`.
- For Bazel, prefer `bazel.build`.
- For Jenkins, prefer `jenkins.io/doc`.
- For GitHub Actions, prefer `docs.github.com`.
- For package managers, prefer official npm, pnpm, pip, poetry, uv, or language docs.
- Clearly distinguish documented behavior from local inference.

## Investigation Rules

- Confirm the installed version and whether docs match that version.
- Check framework conventions before introducing custom workarounds.
- Identify whether the issue is configuration, lifecycle hooks, dependency versions, plugin behavior, environment variables, path resolution, caching, or permissions.
- Prefer the smallest idiomatic framework fix.
- Avoid cargo-cult config changes.

## Output Format

```text
Outcome:
Framework/Tool:
Version:
Failure:
Official Docs Checked:
Root Cause:
Why It Happens:
Proposed Fix:
User Decision Needed:
Changes:
Verification:
Documentation/Test Updates:
Next Step:
```
