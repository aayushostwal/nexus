---
name: architecture-anti-patterns
description: >
  Common architecture mistakes to check for and flag during mapping and extraction planning.
  Load this file before writing any extraction recommendations or coupling assessments.
  Each anti-pattern includes how to identify it, why it is harmful, and how to resolve it.
---

# Common Architecture Anti-Patterns

Anti-patterns to identify and flag during architecture mapping. For each one found, include it
in the output's Risk Assessment section with the specific evidence that confirms it.

---

## Anti-Pattern 1: Service Boundaries Drawn by Org Chart

**What it looks like:**
"The Payments team owns the Payments service. The Users team owns the Users service."
The service boundary corresponds exactly to the team boundary, not to any domain logic.

**Why it is harmful:**
Conway's Law says your system architecture will mirror your communication structure. But applying
it backwards — drawing service boundaries from the org chart — creates services that do not align
with natural domain seams. When the org chart changes (team reorgs, acquisitions, growth), the
service boundaries become wrong and require massive rework.

**How to identify it:**
- Service names match team names exactly ("auth-team-service", "platform-team-api")
- Service boundaries do not correspond to cohesive domain vocabulary
- Multiple services share data because "both teams need it"
- Engineers describe services as "what our team owns" not "what domain concept this encapsulates"

**Resolution:**
Map the actual domain first (what concepts exist, how do they relate), then draw service boundaries
along domain seams. Let the org chart follow the architecture, not the reverse. Use Event Storming or
Domain Storytelling to surface the real domain boundaries before drawing any service lines.

---

## Anti-Pattern 2: Extracting a Service Before Establishing a Stable API Contract

**What it looks like:**
Team extracts the notifications module into a separate service. The service's callers (billing, orders)
still import shared Python functions from a common library. Every time the notifications service
changes its internal logic, the shared library must be updated and all callers must redeploy.

**Why it is harmful:**
The "extraction" created more coupling, not less. The shared library is a coupling artifact — it
means the "service" cannot evolve its interface independently. Any change ripples to all callers
through the shared library, requiring coordinated deploys.

**How to identify it:**
- A "service" is called via a shared library / SDK rather than via a versioned HTTP API or message queue
- Callers import the shared library at the module level — the import is a coupling point
- The shared library's version must be bumped simultaneously across all callers
- Service changelog always mentions "update shared library to version X.Y.Z"

**Resolution:**
Before extracting any service, define its API contract first. Contract must be:
1. Versioned (so old callers can use v1 while new callers use v2)
2. Documented independent of the implementation
3. Stable enough that a consumer can be written without reading the service's source code
4. Tested with contract tests (e.g., Pact) that verify both sides independently

---

## Anti-Pattern 3: Shared Database in Microservices (Distributed Monolith)

**What it looks like:**
"We have five microservices, each with its own repo and deploy pipeline."
All five services connect to `postgres://prod-shared-db/app`.

**Why it is harmful:**
This is strictly worse than a monolith. The services have all the operational overhead of
microservices (network calls, partial failures, distributed tracing) but none of the isolation
benefits (independent scaling, independent schema evolution, fault containment). A schema migration
in one service breaks all other services. A long-running query in one service degrades all others.

**How to identify it:**
```bash
grep -r "DATABASE_URL\|DB_HOST\|postgres://" . --include="*.env*" --include="*.yaml"
# If all services resolve to the same host+database → distributed monolith
```

Or:
- Schema migration must be announced to all service teams before running
- "Service A's deploy broke Service B" — shared database lock or schema mismatch
- Two services have ORM model definitions for the same table

**Resolution:**
1. Assign single ownership for every table (one service is the writer)
2. All other services must read via the owning service's API
3. Provision separate databases per service (can start as separate schemas in the same Postgres instance)
4. Migrate to physical separation once API contracts are stable

Do not proceed with adding more services until shared database is resolved.

---

## Anti-Pattern 4: Over-Engineering — Microservices for a Small Team

**What it looks like:**
A 3-person startup with a 6-month-old codebase has decomposed their application into 9 microservices.
Each feature requires coordinated changes to 3-4 services. Deployments take 45 minutes.

**Why it is harmful:**
Microservices impose real fixed costs: service discovery, load balancing, distributed tracing,
service-to-service auth, eventual consistency handling, separate CI/CD pipelines per service.
For a small team, these costs dominate. Engineers spend more time on infrastructure than on product.
The domain model is also still evolving — premature service boundaries will be wrong and require
expensive rework.

**How to identify it:**
- Team size < 5 engineers and > 3 services
- Features require PRs in multiple service repos simultaneously
- "We're blocked because Service X team needs to release first"
- Codebase is < 2 years old
- No clear domain justification for the service split (the team says "it seemed cleaner")

**Resolution:**
Merge services back into a well-structured modular monolith. A modular monolith with clear package
boundaries is just as maintainable as microservices for a small team, with none of the operational
overhead. Re-extract services only when a specific, concrete scaling or ownership reason justifies
the operational cost.

Signal for re-extraction: "We need to scale [specific part] independently because [specific measured
reason]" — not "microservices is best practice".

---

## Anti-Pattern 5: Under-Engineering — Never Refactoring a Growing Monolith

**What it looks like:**
A 5-year-old codebase has every feature in a single `utils.py`, `helpers.py`, or `service.py`.
There are no modules, no packages, no clear separation of concerns. Everything imports everything.

**Why it is harmful:**
Without structural boundaries, every change touches the entire codebase. Test coverage becomes
impossible because side effects are everywhere. Onboarding takes months because the codebase has
no map. Defects in one area corrupt another area silently. Change velocity slows exponentially.

**How to identify it:**
- `find . -name "*.py" | xargs wc -l | sort -rn | head -5` shows files > 2,000 lines
- `grep -r "^from " utils.py | wc -l` shows more than 50 imports in a single file
- Circular imports exist (A imports B imports C imports A)
- There is no meaningful directory hierarchy beyond a single top-level directory

**Resolution:**
Do not jump to microservices. Start with a modular monolith:
1. Identify natural domain clusters (by reading the code, not the file names)
2. Move related files into packages with clear public APIs (`__init__.py` with explicit exports)
3. Enforce boundaries with linting rules that reject cross-package imports outside the public API
4. Extract infrastructure concerns (DB, cache, email) into adapter modules
5. Only consider service extraction after the modular structure is stable

---

## Anti-Pattern 6: "Just Add an API" Extraction (Tight REST Coupling)

**What it looks like:**
Team extracts the Orders module into a service. Instead of using events, they replace every
in-process function call with a synchronous REST API call. The result: every request to the
monolith now makes 3-4 synchronous HTTP calls to the Orders service.

**Why it is harmful:**
Synchronous REST coupling is better than shared-database coupling, but it is still tight coupling.
Latency adds up: if 4 services each add 20ms of network latency, a user request that was 50ms
is now 130ms+. More importantly, if the Orders service is down, every monolith endpoint that
calls it also fails — the failure is not contained, it propagates. The Orders service also becomes
a bottleneck: it must scale at the same rate as the monolith.

**How to identify it:**
- Service call graph is a chain (A calls B, B calls C, C calls D) — fan-out of synchronous calls
- p99 latency increased significantly after service extraction
- A service outage causes cascading failures in unrelated endpoints
- Every endpoint in the monolith calls the extracted service at least once

**Resolution:**
Use asynchronous events for integration where possible:
- "OrderPlaced" event → downstream services react (billing, notifications)
- Use a message broker (Kafka, SQS, RabbitMQ) as the integration point
- Keep synchronous REST calls for reads where the caller genuinely needs the answer now
- Use caching for frequently-read data (avoid synchronous read calls per request)
- Apply the circuit breaker pattern for all synchronous service calls to contain failures

Guideline: if the caller does not need the response to complete its own work → use an event.
If the caller needs the data to serve its own response → REST is acceptable (but add circuit breaker).
