---
name: nexus-infra
description: Route infrastructure requests to design, evaluation, or cost-optimization paths with concise, implementation-ready outputs.
---

# Infrastructure Router

## Tracks
- `design.md`: new architecture from requirements/codebase
- `evaluate.md`: review existing infrastructure for risk/cost/reliability
- `free-alternatives.md`: reduce spend with lower-cost managed or self-hosted substitutes

## Routing Rules
1. New build or deployment design request -> `design.md`
2. Existing stack audit/incident/cost spike -> `evaluate.md`
3. "cheaper/free alternative" request -> `free-alternatives.md`

If mixed intent, run `design` first, then `free-alternatives`.

## Output Shape
```text
Outcome:
Track:
Summary:
Decision Needed:
Next Step:
```
