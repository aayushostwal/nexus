---
name: architecture-heuristics
description: >
  Decision heuristics for the nexus-architecture skill. Load this file when making extraction
  order decisions, assessing coupling, or advising on strangler fig vs big-bang approaches.
  These heuristics are grounded in DDD, evolutionary architecture, and microservices patterns.
---

# Architecture Heuristics

Rules of thumb for making architecture decisions. Each heuristic has a signal, the conclusion it
implies, and a practical test to confirm it.

---

## Heuristic 1: Co-Change = Co-Ownership

**Signal:** Module A and Module B change together in more than 60% of commits.

**Conclusion:** They belong in the same bounded context — or they are too tightly coupled.

**Test:**
```bash
# Find files that always commit together
git log --name-only --pretty=format: | \
  grep -v '^$' | sort | uniq -c | sort -rn | head -60
```

If `billing/models.py` and `orders/models.py` appear together in 70% of commits, splitting them
into separate services will cause constant cross-service deploys — defeating the purpose of extraction.

**Action:** Either keep them in the same context, or identify and cut the coupling before extracting.

---

## Heuristic 2: High Fan-in = High Extraction Risk = Extract Last

**Signal:** Module X is imported by N other modules (fan-in = N).

**Conclusion:** Extraction risk scales linearly with fan-in. A module with fan-in 12 requires
updating 12 call sites when it moves — and each update is a risk surface.

**Rule:**
- Fan-in 0–2: Leaf module — safe to extract first
- Fan-in 3–5: Low-risk — can extract early with careful interface design
- Fan-in 6–9: Medium-risk — extract only after lower-risk modules are extracted
- Fan-in 10+: Core module — extract last; consider whether extraction is worth the effort

**Test:**
```bash
# Python
grep -r "from users.models import\|from users import" . --include="*.py" -l | wc -l

# JavaScript/TypeScript
grep -r "from.*users" . --include="*.ts" --include="*.js" -l | wc -l
```

**Exception:** A high fan-in module that is purely a utility (logging, config, datetime helpers)
is different from a high fan-in domain module. Utilities are not extraction candidates — they
stay as shared libraries.

---

## Heuristic 3: Shared Database Table = False Boundary

**Signal:** Two "separate" modules or services write to the same database table.

**Conclusion:** They are not actually separate. The database is the true coupling point.
No amount of HTTP facades or message queues between them resolves this — they still coordinate
implicitly through shared mutable state.

**Test:**
```bash
# Find ORM model definitions for the same table across multiple modules
grep -r "db_table = \|__tablename__ = \|TableName(" . --include="*.py" --include="*.ts" | \
  awk -F: '{print $2}' | sort | uniq -d
```

If the same table name appears in multiple ORM models across modules → false boundary.

**Action:** Assign single ownership. Pick one module as the writer. All others must read via that
module's API. This is the "single writer principle" — enforce it before any extraction.

---

## Heuristic 4: Independent Deployability Test

**Signal:** Deploying module A requires coordinating with the teams that own modules B and C.

**Conclusion:** The modules are not actually independent — they share an implicit contract that
is not yet codified as a stable API.

**Test (three questions):**
1. Can you deploy this module at 2am without waking anyone else?
2. If this module's deploy fails and is rolled back, do any other modules need to be rolled back too?
3. Can you increment this module's version independently without updating other modules?

Three "Yes" answers = independently deployable.
Any "No" answer = not yet a true service boundary.

**Action:** Before extraction, establish stable API contracts (versioned HTTP endpoints or schema-validated
event payloads). The contract must be stable enough that a consumer can be written without reading
the producer's source code.

---

## Heuristic 5: Database-Per-Service Test for True Microservice Boundaries

**Signal:** You claim two modules are separate microservices.

**Conclusion:** A true microservice must own its own database. If it shares a database with another
service, it is a monolith deployed as multiple processes — a distributed monolith.

**Test:**
```bash
# Check database connection strings across services
grep -r "DATABASE_URL\|DB_HOST\|postgres://" . --include="*.env*" --include="*.yaml" --include="*.py"
```

If all services point to the same DB host and database name → distributed monolith.

**Corollary:** The distributed monolith has all the operational complexity of microservices
(network calls, partial failures, distributed tracing) with none of the isolation benefits.
It is strictly worse than a well-structured monolith. Consolidate it before adding more services.

---

## Heuristic 6: Import Graph = Accidental Dependencies

**Signal:** The stated architecture says "Users and Billing are separate" but the import graph
shows `billing/processors.py` importing `from users.models import User, Subscription`.

**Conclusion:** The import graph is the truth. Architecture diagrams lie; imports do not.

**Test:**
```bash
# Build import dependency map (Python)
grep -r "^from \|^import " . --include="*.py" | \
  grep -v "__pycache__\|test_\|#" | \
  awk -F: '{print $1, $2}' | sort -u

# Find cross-context imports specifically
grep -r "from billing" . --include="*.py" -l  # who imports billing?
grep -r "from users" . --include="*.py" -l    # who imports users?
```

Any import that crosses a stated "service boundary" is an accidental dependency. Document and
eliminate it before extraction.

---

## Heuristic 7: Strangler Fig vs Big-Bang — Decision Rule

**Use strangler fig when:**
- The system is in production with active users
- The extraction candidate has a fan-in > 2 (callers must be migrated gradually)
- The team cannot afford a code freeze for a big-bang rewrite
- The extraction context is > 5,000 lines of code
- The coupling is at the function-call level (can intercept calls with a proxy)

**Use big-bang extraction when:**
- The module has fan-in 0 or 1 (only one caller — update it in one PR)
- The module has a clear, already-stable interface (e.g., an internal HTTP endpoint)
- The module is self-contained (no shared models, no shared tables)
- The team can run both versions in parallel for a short migration period (< 1 week)
- The extraction is reversible if it fails (the monolith code is not deleted until verified)

**Never use big-bang for:**
- Any module with a coupling score above 6
- Any module with shared database tables that have not been resolved
- Any module with more than 3 direct callers in the monolith

---

## Heuristic 8: The Anti-Pattern of the Distributed Monolith

**Signal:** "We have microservices, but deployments still require coordinating with 3 other teams."

**Conclusion:** The services share state (usually a database or a shared library with embedded business
logic). They are a distributed monolith.

**Markers:**
- Shared database schema across services
- Shared business logic library (not just utilities) that all services import
- Deployment scripts that deploy multiple services together "because they have to go together"
- Service versioning that must be kept in sync across all services

**Severity:** A distributed monolith is worse than a single well-structured monolith.
The distributed monolith adds: network latency, partial failure modes, distributed tracing complexity,
eventual consistency bugs — without adding: independent scalability, independent deployability,
technology diversity.

**Resolution:** Reduce to a monolith first. Then re-extract properly with data ownership established.

---

## Heuristic 9: Extraction Order — Leaves First, Core Last

**The rule:** Extract in reverse fan-in order. The module that everything depends on is extracted last.

**Why:** If you extract a leaf (fan-in 0–2), there are 0–2 call sites to update. If you extract the
core first, you must update every other module simultaneously — a coordination nightmare.

**Extraction order template:**
1. Leaves (fan-in 0) — no callers to update
2. Near-leaves (fan-in 1–2) — trivial call site update
3. Mid-tier (fan-in 3–5) — manageable with a migration period
4. High-coupling (fan-in 6–9) — requires strangler fig with long migration period
5. Core (fan-in 10+) — extract only after all dependents are already extracted

**Practical check:** Before extracting module X, verify that all modules that depend on X are already
either (a) extracted to their own service (and will call X via API), or (b) planned to be extracted in
subsequent phases. Never leave a module mid-extraction while its callers still use the in-process version.

---

## Heuristic 10: The Right Seam is Where Change Stops Propagating

**Signal:** You change the data model in Context A, and it requires changes in Context B.

**Conclusion:** The seam between A and B is wrong. A correctly placed seam means A's internal model
changes never force B to change.

**Test:** Pick a likely seam. Ask: "If we change the internal representation of [concept] inside A,
does B need to change?" If yes, the seam is wrong. The seam should be at a stable interface — a
data transfer object (DTO), an event schema, or a versioned API contract — not at the model layer.

**Corollary:** Domain events (OrderPlaced, UserRegistered, PaymentProcessed) are the right seams
because they are immutable descriptions of what happened. Event-driven coupling is the loosest
form of coupling and the correct long-term target for bounded context integration.

---

## Heuristic 11: When Microservices Are Wrong

Microservices create real costs: network latency, distributed transactions, partial failure modes,
operational complexity, service discovery, distributed tracing. These costs are only justified if
the extraction benefits exceed them.

**Microservices are wrong when:**
- Team size < 5 engineers — Conway's Law does not apply at this scale; one team can own a monolith
- Traffic < 10k req/day — a monolith can handle this trivially; microservices add cost with no gain
- The codebase is < 50k lines — modular monolith is simpler and equally maintainable
- The system is < 2 years old — the domain model is still evolving; premature boundaries add rework
- The team has not established service contracts — adding services without contracts creates a distributed monolith

**Recommend microservices only when:**
- Two parts of the system have genuinely different scaling requirements (e.g., video transcoding vs API)
- Two parts of the system need different technology stacks (e.g., ML inference vs transaction processing)
- Two parts of the system are owned by teams that cannot coordinate (Conway's Law applies)
- The monolith's deployment time / build time is creating genuine developer productivity loss
- A specific bounded context needs independent scaling that cannot be achieved within the monolith
