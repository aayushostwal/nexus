---
name: nexus-tutorial
description: Create reproducible technical tutorials as shareable notebook-style walkthroughs or markdown guides, with setup, architecture, implementation, validation, and troubleshooting.
---

# Tutorial Protocol

## Goal
Produce a runnable, concise tutorial that works on first execution and is easy to share.

## Workflow
1. Define objective, audience, prerequisites, and final outcome in 4 lines.
2. Add reproducibility setup first: environment creation, dependency install, and run command.
3. Present architecture overview (small Mermaid diagram for multi-step systems).
4. Implement in small steps: one concept per section, each with expected output.
5. Include a validation section with exact verification commands.
6. End with troubleshooting and cleanup.

## Required Sections
- Title
- Objective
- Prerequisites
- Setup
- Architecture
- Step-by-step implementation
- Validation
- Troubleshooting
- Cleanup

## Rules
- Keep examples runtime-agnostic unless the user asks for a specific stack.
- Never hardcode secrets or credentials.
- Keep code blocks small and focused.
- Explain why each step exists, not just what it does.

## Output Shape
```text
Outcome:
Build Target:
Prerequisites:
Setup:
Architecture:
Implementation Steps:
Validation:
Troubleshooting:
Next Step:
```
