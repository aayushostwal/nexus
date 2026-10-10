---
name: system-design
description: Design or review software systems through requirements discovery, independent review, architecture selection, detailed low-level design, and operational planning. Use for system-design requests, architecture reviews, scalability and resilience planning, API and data-flow design, and observability design. Do not trigger for routine implementation questions unless architecture work is requested.
---

# System Design

Produce the simplest defensible design that satisfies the user's actual needs.
Make the result understandable, implementable, and testable.

## 1. Choose the Scope

Identify whether the user needs:
- A new system design.
- A review of an existing system.
- A focused design for one component or workflow.
- A migration or scaling plan.

For existing systems, inspect available documentation and code before proposing
replacements. Separate observed behavior from intended behavior.

Match detail to scope. Do not turn a focused question into a full platform design.

## 2. Discover the Problem and Define Success

Understand the business problem before discussing infrastructure.

Start with information already available. Ask only unanswered questions that
materially affect the design, in batches of no more than five.

Keep questions short, concrete, and easy to answer. Explain unfamiliar terms.
Allow "unknown" and offer clearly labeled assumptions where useful.

Begin with:
1. What are we building, and who will use it?
2. What problem should it solve?
3. What outcome would make it successful?
4. What must the first version support?
5. What constraints must we work within?

Then investigate only relevant areas:
- Main user journeys and failure consequences.
- Expected average traffic, peak traffic, concurrency, and growth.
- Data size, write/read patterns, retention, and sensitivity.
- Latency expectations and availability needs.
- Acceptable data loss and recovery time.
- Consistency, ordering, and duplicate-processing requirements.
- Integrations and dependency limitations.
- Team size, skills, delivery timeline, and operating budget.
- Existing stack, deployment environment, and migration constraints.
- Security, tenant isolation, and applicable compliance requirements.

Separate business success metrics from technical service objectives.

For each success metric, define:
- What is measured.
- Target and measurement window.
- How it will be measured.
- Whether the target is confirmed or proposed.

Do not invent precise traffic, budget, latency, or reliability targets and
present them as user requirements.

### Stop Condition

Proceed when the goal, critical workflows, major constraints, and
architecture-changing uncertainties are sufficiently understood.

If an unknown would substantially change the architecture, ask a targeted
question or present conditional alternatives.

For non-blocking unknowns, state assumptions and proceed. Do not require approval
after every phase or repeat questions already answered.

## 3. Create the Requirements Baseline

Summarize the original context before interpreting it.

Record:
- Problem statement and intended users.
- Business outcomes and success metrics.
- In-scope and out-of-scope behavior.
- Functional requirements: FR-001, FR-002, etc.
- Non-functional requirements: NFR-001, NFR-002, etc.
- Constraints, dependencies, assumptions, and open questions.

For each requirement, include:
- ID and descriptive title.
- A complete sentence describing the required behavior or quality.
- Why it matters.
- Priority: must, should, or could.
- Source: explicit user input, supplied evidence, or proposed assumption.
- Acceptance criterion or measurement method.

Use measurable language. Replace "fast" and "highly available" with agreed
targets, or mark the target as unresolved.

Separate a required outcome from a suggested implementation.
"Users receive updates within the target delay" is a requirement.
"Use Kafka" is a solution choice unless explicitly mandated.

## 4. Independently Review Requirements

Delegate to requirements-reviewer when available.

Supply:
- Relevant original user input and source material.
- Requirements baseline.
- Assumption register and unresolved questions.
- Scope, priorities, and constraints.

Ask the reviewer to identify:
- Missing critical workflows or failure cases.
- Contradictions and ambiguous acceptance criteria.
- Unsupported assumptions.
- Unrealistic or conflicting quality targets.
- Solutions incorrectly recorded as requirements.
- Unnecessary scope and overengineering risks.

Require this result:
- Verdict: ready, ready with assumptions, or blocked.
- Findings with requirement IDs and supporting evidence.
- Impact of each finding.
- Smallest recommended correction.
- Essential follow-up questions only.

The reviewer must not silently introduce new business requirements.
Record proposed additions as recommendations until justified or confirmed.

Resolve material findings before architecture selection. Keep non-blocking
findings visible without creating endless review loops.

## 5. Select the Architecture

Delegate design to system-designer using the reviewed baseline.

Start with the simplest viable architecture. Consider alternatives when a real
trade-off exists; do not manufacture alternatives for appearances.

For significant choices, explain:
- Requirements served.
- Recommended approach.
- Simpler alternative considered.
- Why that alternative is insufficient, if rejected.
- Operational burden and cost implications.
- Conditions that would justify changing the decision.

Do not default to microservices, Kubernetes, queues, caches, sharding,
multi-region deployments, or event sourcing without a specific need.

Provide capacity estimates where they influence the design. Show assumptions,
units, formulas, peak factors, and headroom. Label estimates as estimates.

Distinguish:
- What should be built now.
- What is deliberately deferred.
- Measurable triggers for future expansion.

Verify current product limits, API behavior, and pricing against authoritative
documentation when those facts influence the recommendation. Cite sources.
If verification is unavailable, identify the uncertainty.

## 6. Produce the Design

Use the following structure, scaling detail to the task.

### A. Overview and Requirements

Explain the problem, users, intended outcomes, scope, and recommended solution.

List the requirements with descriptive headings and readable explanations.
Include their importance, priority, and acceptance criteria.

State assumptions and unresolved decisions explicitly.

### B. High-Level Architecture

Show system boundaries, external actors, major components, data stores,
dependencies, and deployment boundaries.

Explain each component's responsibility, ownership, and reason for existing.

### C. Low-Level Design and Flows

Use Mermaid diagrams where supported.

Provide:
- A component diagram for internal structure.
- Sequence diagrams for important workflows.
- State diagrams for meaningful lifecycles.

Split large diagrams by workflow or subsystem. Keep a consistent legend and IDs.

Assign stable component IDs such as C1 and C2.
Label interaction steps such as F1.1 and F1.2.
Use those same IDs in the written explanations.

Show synchronous versus asynchronous interactions, trust boundaries, and relevant
failure paths. Do not force every detail into one unreadable diagram.

Immediately follow each diagram with a numbered explanation of its components
and interactions.

For each important interaction, specify as applicable:
- Trigger, caller, recipient, and responsibility.
- Protocol, API method and path, or event name.
- Authentication and authorization.
- Request and response examples.
- Field names, types, meanings, requiredness, and validation.
- Success and error status codes with caller behavior.
- Timeouts and cancellation behavior.
- Retry eligibility, limits, backoff, and jitter.
- Idempotency, deduplication, ordering, and delivery guarantees.
- State transitions and transactional boundaries.
- Failure handling, recovery, and user-visible outcome.
- Relevant configuration and telemetry.

Explain asynchronous acknowledgements separately from completed business work.
Do not equate HTTP success with successful downstream processing.

Include pseudocode for complex logic, concurrency, transactions, retries, or
recovery. Avoid pseudocode that merely repeats obvious CRUD operations.

### D. Data Model and Lifecycle

Describe relevant:
- Entities, fields, identifiers, and relationships.
- Constraints, indexes, and access patterns.
- Data ownership and source of truth.
- Transaction and consistency boundaries.
- Retention, deletion, archival, and audit requirements.
- Schema evolution and migration compatibility.

For background jobs, notifications, or webhooks, describe lifecycle states,
duplicate handling, retries, exhausted attempts, and reconciliation.

### E. Resilience, Security, and Operations

Explain the applicable failure scenarios:
- Dependency timeouts or outages.
- Partial completion.
- Duplicate or out-of-order messages.
- Process termination during work.
- Traffic spikes and exhausted capacity.
- Data-store unavailability.
- Deployment failures and incompatible schema changes.

For each material failure, state:
- Detection.
- User impact.
- Containment.
- Recovery.
- Remaining risk.

Connect mechanisms such as backpressure, load shedding, circuit breakers,
replication, and failover to specific requirements. Omit unnecessary mechanisms.

Include applicable authentication, authorization, tenant isolation, encryption,
secret management, and abuse protection.

Describe backup restoration, recovery objectives, rollout, rollback, and
operational ownership where relevant.

List environment configuration with purpose, type, requiredness, default,
and whether it is sensitive. Use secret references, never real credentials.

### F. Observability and OpenTelemetry

Include a minimal operational baseline. Expand dashboards, instrumentation,
alerts, and debugging when requested or required by the system's criticality.

Separate telemetry collection from storage, visualization, and alerting.
Do not imply OpenTelemetry alone provides dashboards or incident management.

Define:
- Service identifiers and useful resource attributes.
- Trace propagation across HTTP, messaging, and background jobs.
- Span boundaries for critical operations.
- Structured logs correlated with traces.
- Metrics for user outcomes and service health.
- Sampling, retention, telemetry overhead, and sensitive-data controls.

Avoid unbounded metric labels such as user IDs or request IDs.

For each metric, provide:
- Name or proposed name.
- Meaning, type, and unit.
- Collection point.
- Bounded dimensions.
- Requirement or operational question it supports.

Cover relevant request rate, error rate, latency distributions, saturation,
dependency failures, queue age, and business completion rates.

Define service-level indicators, objectives, and error-budget calculations
where applicable.

Use the organization's incident-severity definitions. If none are provided,
propose definitions and label them as provisional.

For each proposed P0/P1 alert, specify:
- User impact and severity rationale.
- Exact signal or query/pseudocode.
- Threshold and evaluation window.
- Minimum traffic or sample requirements where needed.
- Missing-data behavior.
- Owner, notification destination, and runbook.
- Immediate diagnostic and mitigation steps.
- Recovery condition.

Derive thresholds from service objectives and impact. Label unvalidated
thresholds as starting points that require calibration.

Prefer actionable user-impact and error-budget alerts over arbitrary
infrastructure thresholds.

### G. Cost and Evolution

Explain major cost drivers and total operating effort.

Include infrastructure, storage, requests, data transfer, telemetry, and
engineering/on-call burden where relevant.

State workload assumptions, pricing date, region, and uncertainty for numerical
estimates. Avoid false precision.

Show the initial design and explicit capacity, reliability, or organizational
triggers for adding complexity.

### H. Validation and Traceability

Map every must-have requirement to:
- Design component or flow.
- Verification method.
- Relevant operational signal, where applicable.

Propose meaningful tests for:
- Core workflows.
- Contract and validation behavior.
- Authorization and isolation.
- Load and latency targets.
- Failure recovery and duplicate processing.
- Backup restoration and migration/rollback where relevant.

Distinguish proposed tests from tests actually executed.

## 7. Review the Completed Design

Send the design and requirements baseline to requirements-reviewer.

Check:
- Must-have requirements are covered.
- Diagrams, contracts, state transitions, and prose agree.
- Failure and retry behavior preserve correctness.
- Components have justified responsibilities.
- The team can operate the proposed system.
- Cost and complexity are proportionate.
- Remaining assumptions and risks are visible.

Resolve material findings and record significant accepted trade-offs.
If a blocking issue remains, label the design provisional and explain exactly
what must be resolved.

## 8. Final Delivery Rules

Lead with the recommended architecture and why it fits.

Use complete sentences. Define acronyms on first use.
Keep descriptions specific to the user's system.

Provide enough detail for implementation without adding unrelated sections.
Mark non-applicable concerns briefly rather than inventing requirements.

Never claim a design is production-ready merely because it has diagrams.
State what was reviewed, what was verified, and what still needs validation.