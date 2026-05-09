# Framework Debugging

## Goal

Debug framework/tooling failures using current official documentation, local evidence, and repo conventions before implementing a fix.

## Required Workflow

Follow `skills/debugging/common.md`, plus:

1. Identify the framework, tool, package, version, and command involved.
2. Always fetch current official documentation from the internet.
3. Confirm the installed version and whether docs match that version.
4. Prefer the smallest idiomatic framework fix.

## Documentation Rules

- Use official documentation first.
- For Django, prefer `docs.djangoproject.com`.
- For FastAPI, prefer `fastapi.tiangolo.com`.
- For Bazel, prefer `bazel.build`.
- For Jenkins, prefer `jenkins.io/doc`.
- For GitHub Actions, prefer `docs.github.com`.

And add other links also as per the requirement of the codebase.

## Investigation Rules

- Check framework conventions before introducing custom workarounds.
- Identify whether the issue is configuration, lifecycle hooks, dependency versions, plugin behavior, environment variables, path resolution, caching, or permissions.
- Avoid cargo-cult config changes.
