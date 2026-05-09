---
name: nexus-planning
description: >
  Use this skill when the user needs a concrete execution plan for technical work and the direction is
  already known or can be assumed without much ambiguity. Trigger when the main need is to turn an intended
  change into scope, ordered steps, dependencies, risks, validation, rollout, and rollback rather than to
  compare fundamentally different approaches. This applies to production features, infrastructure changes,
  migrations, architecture updates, and repo-local modifications that need structured delivery planning.
  The expected output is an actionable implementation plan, not just ideas or options. Prefer exploration
  first when the core uncertainty is still choosing the approach. When in doubt, use this skill.
---

# Nexus Planning Protocol

Produce a complete, decision-ready technical plan before any implementation begins.

---

## Compatibility
- Output: Scoping table + Mermaid diagram + trade-off matrix + ordered execution steps
- Requires: Read access to source code, infra-as-code, CI/CD config, and recent git history

---

## Workflow

### Step 1 — Context & Discovery
Build a complete technical map before proposing anything:
1. Read source code patterns, infra-as-code (CDK/TF), CI/CD flows, and `git log --oneline -20`
2. Identify tech debt, bottlenecks, security boundaries, and breaking change risks
3. Confirm alignment with existing naming conventions, directory structures, and linting config

If information is missing: ask a direct, specific technical question ("What auth middleware is in use?" not "Tell me about your auth").

### Step 2 — Research & Trade-offs
For each approach being considered, evaluate:

| Category | What to assess |
|----------|---------------|
| Standard tech | Performance benchmarks, operational cost, maintenance complexity |
| AI/LLM stack | Token cost per call, latency p95, tool-calling reliability, RAG retrieval quality |
| Cloud/Infra | IAM scoping, VPC/SG boundaries, disaster recovery RTO, blast radius |

### Step 3 — Scoping Table (Stop & Wait for Approval)
Present the scoping table and **do not proceed** until the user explicitly approves:

| Task | System Impact | Risk Level | Dependencies | Status |
|------|---------------|------------|--------------|--------|
| [Item] | [File/Service changed] | [Low/Med/High + what breaks if it fails] | [Upstream task or team] | Proposed |

### Step 4 — Architecture & Design
After approval:
1. Draw a Mermaid diagram — use sequence diagram for flows, ERD for data models, C4 for system-level
2. Present a trade-off matrix for each major decision:

| Approach | Latency | Cost | Complexity | Verdict |
|----------|---------|------|------------|---------|
| Option A | Low | High | Low | ✅ if budget unconstrained |
| Option B | Med | Low | Med | ✅ default recommendation |

3. Define API contracts, schema migrations (reversible vs. destructive), and rollback triggers explicitly

### Step 5 — Execution Plan
Write numbered, ordered implementation steps. Each step must name:
- The exact file(s) to change
- The type of change (add function, modify schema, update env config)
- The dependency on any prior step number
- The verification command to confirm this step succeeded

### Step 6 — Validation Criteria
Define before closing the plan:
- End-to-end test command that proves the feature works
- Performance baseline to verify against (if applicable)
- Rollback condition: "If [specific signal], revert by running [exact command]"

---

## Output Format

```
## Plan: [Feature Name]

### Scoping Table
[table]

### Architecture
[Mermaid diagram]

### Trade-off Matrix
[table]

### Implementation Steps
1. [File] — [Change type] — Depends on: none — Verify: [command]
2. [File] — [Change type] — Depends on: step 1 — Verify: [command]
...

### Validation
- E2E test: [command]
- Performance: [baseline metric]
- Rollback: if [signal] → [exact command]
```

---

## Anti-Patterns
- Never begin implementation before the scoping table is explicitly approved by the user.
- Never use vague risk levels — state what specifically breaks if the risk materializes.
- Never produce a plan without a rollback condition for any task marked High risk.
- Never write a step that says "update X appropriately" — name the exact file and the type of change.
- Never skip the architecture diagram for any change that touches more than one service or module.
- Never propose a solution before completing Step 1 (Context & Discovery).

---

## Examples

**Input:** "I need to add rate limiting to our FastAPI service."

**Output:**
```
## Plan: API Rate Limiting

### Scoping Table
| Task | System Impact | Risk Level | Dependencies | Status |
|------|--------------|------------|--------------|--------|
| Add slowapi middleware | main.py, requirements.txt | Low — breaks app startup if misconfigured | None | Proposed |
| Per-user rate limits | auth.py, Depends() injection | Med — breaks all authed routes if limiter raises | slowapi installed | Proposed |
| Redis backend for distributed limits | infra/redis.tf, .env | High — Redis outage = all requests blocked | Redis instance provisioned | Proposed |

### Architecture
sequenceDiagram
  Client->>FastAPI: POST /api/data
  FastAPI->>slowapi: check limit (Redis key: user:{id})
  slowapi-->>FastAPI: 429 Too Many Requests (if over limit)
  FastAPI->>Handler: process request (if under limit)

### Trade-off Matrix
| Approach | Latency | Cost | Complexity | Verdict |
|----------|---------|------|------------|---------|
| In-memory limiter | +0ms | $0 | Low — broken across replicas | ❌ not viable multi-instance |
| Redis-backed limiter | +2ms | ~$15/mo | Med — correct for horizontal scale | ✅ recommended |

### Implementation Steps
1. requirements.txt — add `slowapi==0.1.9` — Depends on: none — Verify: pip install -r requirements.txt
2. main.py — wrap app: `app.state.limiter = Limiter(key_func=get_remote_address)` — Depends on: step 1 — Verify: uvicorn starts without error
3. routes.py — add `@limiter.limit("100/minute")` to /api/data — Depends on: step 2 — Verify: curl 101 times, assert 429 on 101st
4. infra/redis.tf — add ElastiCache Redis cluster — Depends on: step 3 approved — Verify: terraform plan shows only redis resources

### Validation
- E2E test: locust -f locustfile.py --headless -u 10 -r 2 --run-time 60s — assert p99 < 50ms, 429 rate > 0%
- Performance: baseline = 0ms overhead (no rate limiting), target = +2ms max
- Rollback: if Redis unreachable → set SLOWAPI_BACKEND=memory in .env and restart
```

---

## Planning Specialization
- For AI/LLM features: include token cost estimate per call and monthly projection at expected load (e.g., "10k calls/day × 2k tokens × $0.003/1k = $60/mo").
- For infra changes: include blast radius assessment — which services fail if this component goes down.
- For schema migrations: specify whether the migration is reversible, zero-downtime, and whether a backfill is needed.
- For multi-team changes: list which teams must be notified and what approvals are required before Step 5.
