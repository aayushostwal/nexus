---
name: nexus-planning
description: Use when planning, architecting, or scoping production-critical AI, DevOps, cloud, backend, or multi-domain engineering work before implementation.
---

# Nexus Planning Protocol

## Phase 1: Context & Discovery

**Goal:** Build a 360 degree technical map.

- **Audit:** Source code patterns, infra-as-code (CDK/TF), CI/CD flows, and recent Git history.
- **Analysis:** Identify tech debt, bottlenecks, security boundaries, and breaking change risks.
- **Validation:** Align with existing naming conventions, directory structures, and linting standards.

Incomplete info? Ask direct, technical questions. No assumptions.

## Phase 2: Research & Trade-offs

**Goal:** Validate the "Why" and "How."

- **Standard Tech:** Evaluate performance, cost, and operational complexity.
- **AI/LLM Stack:** Analyze token efficiency, latency, tool-calling reliability, and RAG strategy.
- **Cloud/Infra:** Check IAM scoping, networking (VPC/SG), and disaster recovery.

## Phase 3: Research TODOs (The Roadmap)

**Goal:** Define the mission.

Present a **Scoping Table** for user approval:

| Task | System Impact | Risk Level | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- |
| [Item] | [Service/File] | [Low/High] | [Upstream] | Proposed |

Wait for confirmation before implementation.

## Phase 4: Architecture & Design

**Goal:** Visualize the solution.

- **Diagrams:** Use **Mermaid** for sequence flows, ERDs, or system architecture.
- **Strategies:** Compare Approach A vs. B with a trade-off matrix, for example latency vs. cost.
- **Planning:** Detail API contracts, schema migrations, and rollback triggers.

## Phase 5: Incremental Execution

**Goal:** Precise, scoped coding.

- **Rules:** Follow project idioms, maintain backward compatibility, and ensure type safety.
- **Logic:** Implement robust error handling, structured logging, and observability hooks.
- **Constraints:** No "magic" code. No unnecessary dependencies.

## Phase 6: Validation & Testing

**Goal:** Ensure production readiness.

- **Verify:** End-to-end functionality, unit/integration tests, and edge-case resilience.
- **Checks:** Run linters, verify performance impact, and validate failure modes such as circuit breakers.

## Phase 7: Documentation & Pruning

**Goal:** Long-term maintainability.

- **Docs:** Update `README.md`, API specs, and runbooks. Do not create new documentation if user asks so.
- **Cleanup:** Strictly remove dead code, unused imports, and temporary debug logs.

## Core Principles

- **Optimize for:** Reliability, simplicity, and operational excellence.
- **Avoid:** Over-engineering, hidden state, and large "big bang" deployments.
- **Output Style:** Scannable, table-heavy, diagram-rich, and strictly engineering-focused.
