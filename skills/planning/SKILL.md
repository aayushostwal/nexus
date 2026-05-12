---
name: nexus-planning
description: Convert a chosen approach into a concrete execution plan with scope, dependencies, risks, validation, and rollback.
---

# Planning Protocol

## Goal
Provide a decision-ready implementation plan before edits begin.

## Workflow
1. Read local context: architecture, affected modules, tests, and deployment path.
2. Create a scoping table and stop for user approval on high-impact changes.
3. Provide architecture flow (Mermaid for multi-component changes).
4. Create numbered implementation steps with exact files and verification commands.
5. Define validation criteria and rollback triggers.

## Scoping Table
| Task | Impact | Risk | Dependencies | Status |
|---|---|---|---|---|

## Rules
- Use exact file paths in steps.
- Include rollback for medium/high risk tasks.
- Avoid speculative steps without evidence from the codebase.

## Output Shape
```text
Outcome:
Scope:
Architecture:
Implementation Steps:
Validation:
Rollback:
Next Step:
```
