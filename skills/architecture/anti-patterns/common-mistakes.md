---
name: architecture-anti-patterns
description: >
  Common architecture mistakes to check for and flag during mapping and extraction planning.
  Load before writing extraction recommendations or coupling assessments.
  Each anti-pattern includes identification, harm, resolution.
---

# Common Architecture Anti-Patterns

For each found anti-pattern, include in output's Risk Assessment with evidence.

## 1. Service Boundaries Drawn by Org Chart
- **Identify**: Service names match team names; boundaries ignore domain cohesion; shared data across teams; described as "team's service" not domain concept.
- **Harm**: Boundaries become wrong when org changes; massive rework.
- **Resolve**: Map domain first (Event Storming), draw boundaries along domain seams; org follows architecture.

## 2. Extraction Before Stable API Contract
- **Identify**: Shared library/SDK coupling; version bumps require all callers redeploy; callers import shared module.
- **Harm**: More coupling, not less; coordinated deploys needed; service cannot evolve independently.
- **Resolve**: Define versioned, documented, stable API contract first; test with contract tests (e.g., Pact).

## 3. Shared Database in Microservices (Distributed Monolith)
- **Identify**: All services resolve to same DB host; schema migration affects all; ORM models for same table across services.
- **Harm**: Operational overhead of microservices without isolation; schema changes break all; queries degrade all.
- **Resolve**: Single table owner (one service writes); others read via API; separate DBs per service (start as schemas).

## 4. Over-Engineering — Microservices for Small Team
- **Identify**: Team <5 engineers, >3 services; features need multiple service PRs; codebase <2 years; no domain justification.
- **Harm**: Fixed costs (discovery, tracing, pipelines) dominate; premature boundaries require rework.
- **Resolve**: Merge into modular monolith; re-extract only when concrete scaling/ownership need (not "best practice").

## 5. Under-Engineering — Never Refactoring Monolith
- **Identify**: Huge files (>2k lines); >50 imports in one file; circular imports; no meaningful directory structure.
- **Harm**: No boundaries → every change touches everything; impossible testing; slow velocity.
- **Resolve**: Modular monolith: identify domain clusters; create packages with public APIs; enforce with linting; extract infrastructure; consider service extraction after stable.

## 6. "Just Add an API" Extraction (Tight REST Coupling)
- **Identify**: Service call chain (A→B→C→D); p99 latency increased after extraction; cascade failures; every endpoint calls extracted service.
- **Harm**: Latency adds up; failure propagates; extracted service becomes bottleneck.
- **Resolve**: Use async events where caller doesn't need response; keep sync REST for reads only; add caching; apply circuit breaker.