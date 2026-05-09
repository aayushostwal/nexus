---
name: nexus-debugging
description: Use when debugging failures (CI/CD, tests, builds, deployments, tooling, framework issues, or codebase bugs). Routes to CI/CD, codebase, or framework workflows and loads only the relevant sub-guide.
---

# Nexus Debugging

Pick the most relevant track and follow it end-to-end:

- CI/CD failures: read `skills/debugging/ci-cd.md`
- Codebase bugs: read `skills/debugging/codebase.md`
- Framework/tooling issues: read `skills/debugging/frameworks.md`

Shared rules, output formats, and checklists: `skills/debugging/common.md`

Routing hints:

- If the failure is in GitHub Actions/Jenkins logs, start with CI/CD.
- If the failure is a failing test or runtime bug in the app, start with Codebase.
- If the failure is due to Django/FastAPI/Bazel/Jenkins/tooling behavior, start with Frameworks and fetch official docs.
