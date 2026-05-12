# Production Scenarios

## Scenario A: Boundary Extraction
- Trigger: one module is a delivery bottleneck
- Approach: isolate contracts, duplicate reads, then cut writes
- Success: independent deployability and lower incident coupling

## Scenario B: High-Risk Schema Evolution
- Trigger: data model change affects multiple consumers
- Approach: expand-and-contract migration with compatibility window
- Success: zero-downtime transition with measured parity

## Scenario C: Platform Consolidation
- Trigger: duplicated infrastructure and high ops overhead
- Approach: standardize shared platform services with clear ownership
- Success: lower run cost and faster onboarding
