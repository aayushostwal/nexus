---
name: nexus-observability
description: >
  Use this skill when investigating correlated API failures, cascading errors, or distributed system
  failures. Trigger phrases: "multiple services failing at once", "cascading failure", "error rate
  correlation", "why are these APIs failing together", "investigate distributed failure", "trace
  a failure through microservices", "which service is causing the cascade", "correlation between
  error spikes", "dependency failure analysis", "upstream downstream failure impact",
  "service mesh error investigation", "circuit breaker opened". Also trigger when the user
  shares multiple error logs from different services and wants to understand the causal chain.
  When in doubt, use this skill.
---

# Nexus Observability — API Failure Correlation Engine

Systematically correlate failures across distributed services to identify causal chains, blast
radius, and the origin service — before proposing any fix.

---

## Compatibility
- Supporting files: `examples/production-scenarios.md`, `checklists/investigation-checklist.md`,
  `heuristics/correlation-heuristics.md`, `anti-patterns/common-mistakes.md`,
  `validation/output-validation.md`
- Required tools: Read, Bash, Grep
- Optional tools: WebSearch (for vendor-specific error lookups)
- Hands off to: `nexus:debugging` for single-service root cause after the origin service is identified
- Hands off to: `nexus:planning` after the fix is agreed upon

---

## Core Principle

**Never assign blame to a service before building the full cross-service timeline.**

A cascading failure always has one origin. Fixing a downstream victim while the upstream cause
remains live means the failure will recur. Every step below exists to work backward from symptoms
to source.

---

## Workflow

### Step 1 — Context Acquisition

Before reading any logs, collect everything in this table. Do not proceed until you have at least
items 1–5:

| # | What to collect | Why |
|---|----------------|-----|
| 1 | Error logs from **all** affected services — verbatim, not summarized | Paraphrased logs lose the exact timestamp and error code |
| 2 | Distributed traces (Jaeger, Zipkin, X-Ray, Tempo) for at least 3 failing requests | Traces show the exact call path and which hop introduced latency or error |
| 3 | Metrics snapshots: error rate, p99 latency, RPS, saturation (CPU/mem/conn pool) for each service | Distinguishes saturation from errors from cascades |
| 4 | Exact timestamps: when did each service first show elevated error rate? | Required for timeline construction in Step 2 |
| 5 | Dependency map: which services call which (direct + indirect) | Required for Step 3 — blast radius |
| 6 | Recent changes: deployments, config pushes, feature flags, cron jobs, infra changes in the 4h window before failure | Most failures are triggered by a change |
| 7 | Alert firing history: which alerts fired, in what order | Alert order often mirrors the failure propagation direction |

If the user cannot provide all of these, ask targeted questions — one message, all questions at once.
Never ask for information you can infer from what was already provided.

---

### Step 2 — Timeline Construction

Align all log timestamps to a single timezone (UTC). Build a timeline table:

```
| Time (UTC)     | Service         | Event                                | Error Rate |
|----------------|-----------------|--------------------------------------|------------|
| T+00:00        | database        | connection pool at 95% utilization   | 0%         |
| T+00:47        | database        | connection pool exhausted            | 0%         |
| T+01:03        | api-gateway     | upstream timeouts begin              | 2%         |
| T+01:15        | auth-service    | DB queries failing, JWT verify slow  | 8%         |
| T+01:22        | user-service    | auth check timeouts                  | 34%        |
| T+01:31        | api-gateway     | circuit breaker opens on auth        | 78%        |
```

Rules for timeline construction:
- Use the **first occurrence** of an elevated error signal per service, not when it peaked
- If log timestamps differ from trace timestamps, trust trace timestamps (they are clock-synchronized)
- Note any gaps in the timeline where no data is available — these are blind spots, not clean windows

---

### Step 3 — Identify the Origin Service

The origin service is the one with the **earliest elevated error signal** on the timeline. Apply
these tests to confirm:

| Test | Method | What it proves |
|------|--------|---------------|
| Earliest timestamp | Compare T+00:xx across all services | Service with lowest T is a candidate origin |
| No upstream errors at that time | Check if any service calling the candidate was already erroring | Confirms the candidate is not itself a victim |
| Error type is local | DB timeout in a service with no downstream → local origin; HTTP 503 from a service that only calls others → victim | Distinguishes originator from propagator |
| Metrics confirm saturation | CPU, memory, connection pool, or I/O maxed out at the origin time | Saturation precedes errors at the origin |

State the origin as:
> *"[Service X] is the origin. Its [metric] saturated at [T+XX:XX], [N] seconds before the first
> downstream error appeared in [Service Y]."*

If two candidates exist and you cannot disambiguate, state both with the ambiguity clearly — do
not guess.

---

### Step 4 — Map the Dependency Graph and Failure Mode

Classify the failure using the pattern table:

| Failure Mode | Signature | What it means |
|-------------|-----------|--------------|
| **Linear cascade** | Errors propagate in a chain: A → B → C, each with a delay matching timeout settings | One upstream service's failure propagates through the call chain |
| **Fan-out cascade** | One service fails; N downstream services all spike simultaneously | A shared dependency (DB, cache, auth) failed; all its consumers degrade at once |
| **Independent failures** | Multiple services spike at the same time with no call relationship | Shared infrastructure failure: network partition, DNS, load balancer, or cloud platform event |
| **Thundering herd** | Error rate drops briefly then re-spikes repeatedly in waves | Cache or circuit breaker retry storm — all retries fire simultaneously after a brief recovery |
| **Brownout** | Latency rises gradually, error rate follows slowly | Resource saturation (connection pool, thread pool, memory) approaching limit |

Draw the dependency graph using the call relationships:

```
[database] ← [auth-service] ← [api-gateway] ← [user-service]
                             ↑
                         [billing-service]
```

Mark each node with: `ORIGIN`, `PROPAGATOR`, or `VICTIM`.

---

### Step 5 — Root Cause + Blast Radius Assessment

**Root cause statement** — must follow this format exactly:

> *"[Service X] failed because [mechanism] when [trigger condition], causing [failure mode]
> that propagated to [list of affected services], with [N]% of [user-facing operation] requests
> failing by [T+XX:XX]."*

**Blast radius table:**

```
| Service        | Role       | Error Rate at Peak | User Impact |
|----------------|------------|-------------------|-------------|
| database       | ORIGIN     | 100% timeouts     | Internal only |
| auth-service   | PROPAGATOR | 45%               | Login failures |
| api-gateway    | PROPAGATOR | 78%               | All authenticated requests |
| user-service   | VICTIM     | 34%               | Profile page errors |
| billing-service| VICTIM     | 12%               | Payment page slow |
```

**Fix recommendation** — one action per service:

```
| Service        | Immediate Action                            | Prevention |
|----------------|---------------------------------------------|-----------|
| database       | Increase connection pool limit; kill idle   | Add pool monitoring alert at 80% |
| auth-service   | Add circuit breaker on DB calls             | Cache JWT verify results for 30s |
| api-gateway    | Tune circuit breaker thresholds             | Add fallback response for auth timeout |
```

---

## Signal Patterns — What Correlations Mean What

| Observed pattern | Most likely cause |
|-----------------|-------------------|
| All services spike **simultaneously** (< 1s apart) | Shared infrastructure: network partition, DNS failure, load balancer failure, or cloud platform event |
| Errors propagate in a **wave with delays matching timeout settings** | Request-driven cascade — upstream timeout causes downstream retry storm |
| **Periodic** error spikes (regular interval) | Cron job contention, batch process overloading a shared resource, or connection pool recycling at fixed TTL |
| p99 latency rises **before** error rate rises | Resource saturation building up — connection pool, thread pool, or memory near limit |
| Error rate rises **before** latency rises | Hard failures (process crash, network drop) rather than saturation |
| Error rate drops and re-spikes in waves | Thundering herd — circuit breaker opened, closed, retry storm repeats |
| Single service high error rate, all others fine | Isolated failure — do not correlate; route to `nexus:debugging` |
| Error rate high, latency normal | Errors are fast-failing (circuit breaker open, auth rejection) not slow operations |
| Memory or CPU climbs gradually then all services degrade | Memory pressure causing GC pauses or OOM kills on shared nodes |

---

## Output Contract

Every correlation investigation must close with this report. Fill every field — write `none` if
not applicable, never leave a field blank:

```
## Failure Correlation Report

**Outcome:**          [one-line summary — "Identified cascade origin and blast radius"]
**Failure Mode:**     [Linear cascade | Fan-out cascade | Independent | Thundering herd | Brownout]
**Origin Service:**   [service name + the specific metric/event that triggered the failure]
**Trigger:**          [what caused the origin service to fail — e.g., "connection pool exhausted
                       after deployment increased traffic by 40%"]
**Timeline:**         [inline table — T+00:00 to resolution]
**Causal Chain:**     [A → B → C with failure mode at each hop]
**Blast Radius:**     [table: service | role | peak error rate | user impact]
**Fix — Immediate:**  [per-service immediate actions]
**Fix — Prevention:** [per-service prevention measures]
**Blind Spots:**      [services or time windows with no data — explicitly stated]
**Next Step:**        [one clear action for the user to take]
```

---

## Anti-Patterns

Read `anti-patterns/common-mistakes.md` before starting any investigation.

- Never blame a downstream service without proving its upstream was healthy at the time of its failure.
- Never construct a timeline from summarized logs — use raw timestamps only.
- Never propose a fix before completing Steps 1–5 — a fix applied to the wrong service prolongs the outage.
- Never skip the dependency graph — without it, fan-out cascades look like independent failures.
- Never mark an investigation complete if `Blind Spots` is empty and data is missing — state what is unknown.
- Never conflate correlation with causation — two services spiking together does not make one the cause.

---

## Examples

See `examples/production-scenarios.md` for two fully worked production failure scenarios.

---

## Investigation Specialization

**For service meshes (Istio, Linkerd):**
- Check control plane health first — a sick control plane degrades all data plane services simultaneously
- Envoy proxy error logs often contain the causal chain before application logs do
- Look for `503 upstream connect error` and `upstream reset before response started` — these are cascade signatures

**For databases (PostgreSQL, MySQL):**
- Check `max_connections` and `pg_stat_activity` — connection exhaustion is the most common DB-originated cascade
- Check slow query log — a single long-running query can block connection slots and saturate the pool
- Check replication lag — a standby falling behind causes read-replica failures before primary errors appear

**For caches (Redis, Memcached):**
- Check `rejected_connections` metric — a full connection pool causes cache-aside fallback storms on the DB
- Check memory usage — Redis `maxmemory-policy` evictions cause cache misses which look like a cache failure
- Check `slowlog` — a slow Redis command (expensive LRANGE, SMEMBERS) blocks all other operations

**For API gateways and load balancers:**
- Check backend health check logs — a misconfigured health check can mark healthy backends as down
- Check connection timeout vs. read timeout settings — mismatched timeouts cause partial failure modes that are hard to correlate
