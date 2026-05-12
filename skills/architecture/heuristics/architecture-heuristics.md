# Architecture Heuristics

## Core Heuristics
- High fan-in module = stability anchor; change carefully.
- High fan-out module = orchestration hotspot; test integration heavily.
- Shared mutable state = regression risk multiplier.
- Cross-context write paths = migration and consistency risk.
- Hidden coupling often appears in implicit config and side effects.

## Signals to Track
- Change frequency
- Defect concentration
- Dependency churn
- Operational incidents by module

## Decision Rule
Prioritize changes with high business impact and low coupling first.
