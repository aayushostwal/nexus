# Infrastructure Design Playbook

## Goal
Create a production-ready high-level design with architecture, cost estimate, risks, and rollout path.

## Inputs
- Functional requirements
- Traffic/scale expectations
- Budget and provider preference
- Reliability/compliance constraints

## Workflow
1. Detect system components: ingress, compute, data store, cache, async jobs, storage, observability.
2. Ask clarifying questions (traffic, budget, uptime, ops maturity, compliance).
3. Map components to managed services first; keep operator burden low.
4. Produce a simple architecture diagram and component table.
5. Estimate monthly cost using current provider pricing.
6. Provide scaling, security, and failure-mode notes.

## Required Output
- System overview
- Mermaid architecture diagram
- Component table
- Cost table
- Trade-off matrix (2-3 options)
- Scaling and failure strategy

## Rules
- Keep provider-agnostic language unless provider is specified.
- Avoid runtime/framework-specific assumptions.
- Quantify costs and risks clearly.
