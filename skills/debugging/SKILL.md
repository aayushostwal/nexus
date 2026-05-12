---
name: nexus-debugging
description: Debug broken behavior by isolating root cause, applying the smallest correct fix, and verifying with evidence.
---

# Debugging Protocol

## Tracks
- `ci-cd.md`: pipeline/build/deploy failures
- `codebase.md`: test/runtime/regression failures
- `frameworks.md`: tooling/platform integration failures
- `common.md`: shared rules and output shape

## Workflow
1. Classify failure into one track.
2. Collect exact error text, recent changes, environment, and reproduction steps.
3. Follow the selected sub-guide completely.
4. Apply narrowest fix.
5. Verify with the failing command/test.

## Rules
- Never guess without logs/evidence.
- Never claim fixed without verification.
- Keep fix scoped to root cause.

## Output Shape
```text
Outcome:
Track:
Symptom:
Root Cause:
Fix:
Verification:
Prevention:
Next Step:
```
