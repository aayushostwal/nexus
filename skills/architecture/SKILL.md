---
name: architecture
version: 1.0.0
description: Analyze large codebases into bounded contexts, dependency risks, and extraction-ready architecture decisions.
---

# Architecture Skill

## Goal
Produce a clear architecture map and a safe change plan for large systems.

## Workflow
1. Inventory modules, ownership boundaries, shared dependencies, and critical paths.
2. Build a context map: responsibilities, data boundaries, and integration points.
3. Identify coupling hot spots and high-risk seams.
4. Propose extraction or refactor options ranked by impact vs risk.
5. Define rollout plan with validation and rollback.

## Deliverables
- Context map
- Risk table
- Dependency notes
- Recommended next extraction/refactor
- Rollout and rollback plan

## Rules
- Stay framework/runtime agnostic unless user asks otherwise.
- Prefer additive, reversible changes.
- Include explicit verification steps for each recommendation.
