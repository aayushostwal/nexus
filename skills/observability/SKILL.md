---
name: nexus-observability
description: >
  Use for correlated API failures, cascading errors, and distributed-system incident tracing.
  Trigger on multi-service error spikes, dependency-chain analysis, circuit-breaker events,
  or requests to identify origin service and blast radius from logs/metrics across components.
  When in doubt, use this skill.
---

# Nexus Observability — API Failure Correlation Engine

Systematically correlate failures across distributed services to identify causal chains, blast radius, and the origin service — before proposing any fix.

---

## Compatibility
- Supporting files: `checklists/investigation-checklist.md`, `anti-patterns/common-mistakes.md`, `validation/output-validation.md`
- Required tools: Read, Bash, Grep
- Optional tools: WebSearch (vendor-specific error lookups)
- Hands off to: `nexus:debugging` once origin service is identified; the `roadmap-planner` agent after fix is agreed upon

---

## Core Principle

**Never assign blame before building the full cross-service timeline.** A cascade always has one origin — fixing a victim while the cause is live means the failure recurs.

---

## Workflow

### Step 1 — Context Acquisition

Collect before reading any logs. Require items 1–5 minimum; ask for all in one message:

| # | Collect | Why |
|---|---------|-----|
| 1 | Verbatim error logs from **all** affected services | Paraphrased logs lose exact timestamps and error codes |
| 2 | Distributed traces (Jaeger/Zipkin/X-Ray/Tempo) for ≥3 failing requests | Shows exact call path and which hop introduced error/latency |
| 3 | Metrics: error rate, p99 latency, RPS, CPU/mem/conn-pool per service | Distinguishes saturation from errors from cascades |
| 4 | Exact first-elevated-error timestamp per service | Required for timeline in Step 2 |
| 5 | Dependency map (direct + indirect call relationships) | Required for blast radius in Step 3 |
| 6 | Changes in the 4h window: deploys, config, feature flags, cron, infra | Most failures are change-triggered |
| 7 | Alert firing history and order | Alert order mirrors propagation direction |

---

### Step 2 — Timeline Construction

Align all timestamps to UTC. Use **first occurrence** per service, not peak. Trust trace timestamps over log timestamps when they differ. Note data gaps explicitly — they are blind spots, not clean windows.

```
| Time (UTC) | Service     | Event                              | Error Rate |
|------------|-------------|------------------------------------|------------|
| T+00:00    | database    | connection pool at 95% utilization | 0%         |
| T+00:47    | database    | connection pool exhausted          | 0%         |
| T+01:03    | api-gateway | upstream timeouts begin            | 2%         |
| T+01:15    | auth-service| DB queries failing, JWT slow       | 8%         |
| T+01:22    | user-service| auth check timeouts                | 34%        |
| T+01:31    | api-gateway | circuit breaker opens on auth      | 78%        |
```

---

### Step 3 — Identify the Origin Service

The origin has the **earliest** elevated error signal. Confirm with all three tests:

| Test | Method | What it proves |
|------|--------|----------------|
| Earliest timestamp | Lowest T+XX:XX across services | Candidate origin |
| No upstream errors at that time | Check if anything calling the candidate was already erroring | Confirms not a victim |
| Error type is local | DB timeout with no downstream = local origin; HTTP 503 from a pass-through = victim | Distinguishes originator from propagator |
| Metrics confirm saturation | CPU/mem/conn-pool maxed at origin time | Saturation precedes errors at the origin |

State the origin as: *"[Service X] is the origin. Its [metric] saturated at [T+XX:XX], [N]s before the first downstream error in [Service Y]."*

If two candidates remain ambiguous, state both — do not guess.

---

### Step 4 — Map Dependency Graph and Failure Mode

Classify using this table:

| Failure Mode | Signature | Meaning |
|-------------|-----------|---------|
| **Linear cascade** | Errors propagate A → B → C with delays matching timeout settings | Upstream timeout drives downstream retry storm |
| **Fan-out cascade** | One service fails; N downstream services spike simultaneously | Shared dependency (DB, cache, auth) failed |
| **Independent failures** | Multiple services spike with no call relationship | Shared infra failure: network, DNS, load balancer, cloud event |
| **Thundering herd** | Error rate drops then re-spikes in waves | Circuit breaker retry storm after brief recovery |
| **Brownout** | Latency rises gradually, error rate follows slowly | Resource saturation (pool, thread, memory) near limit |

Draw the dependency graph and mark each node: `ORIGIN`, `PROPAGATOR`, or `VICTIM`.

```
[database] ← [auth-service] ← [api-gateway] ← [user-service]
                              ↑
                          [billing-service]
```

---

### Step 5 — Root Cause + Blast Radius

**Root cause format (required):**
> *"[Service X] failed because [mechanism] when [trigger], causing [failure mode] that propagated to [affected services], with [N]% of [user-facing operation] requests failing by [T+XX:XX]."*

**Blast radius table:**
```
| Service         | Role        | Peak Error Rate | User Impact            |
|-----------------|-------------|-----------------|------------------------|
| database        | ORIGIN      | 100% timeouts   | Internal only          |
| auth-service    | PROPAGATOR  | 45%             | Login failures         |
| api-gateway     | PROPAGATOR  | 78%             | All authenticated reqs |
| user-service    | VICTIM      | 34%             | Profile page errors    |
```

**Fix table (one action per service):**
```
| Service      | Immediate Action                          | Prevention                          |
|--------------|-------------------------------------------|-------------------------------------|
| database     | Increase pool limit; kill idle conns      | Alert at 80% pool utilization       |
| auth-service | Add circuit breaker on DB calls           | Cache JWT verify results for 30s    |
| api-gateway  | Tune circuit breaker thresholds           | Add fallback for auth timeout       |
```

---

## Signal Patterns

| Observed pattern | Most likely cause |
|-----------------|-------------------|
| All services spike simultaneously (< 1s apart) | Shared infra: network partition, DNS, load balancer, cloud event |
| Errors propagate in waves matching timeout delays | Request-driven cascade — upstream timeout → downstream retry storm |
| Periodic error spikes (regular interval) | Cron job contention, batch overloading shared resource, pool TTL recycling |
| p99 latency rises **before** error rate | Resource saturation building (pool, thread, memory near limit) |
| Error rate rises **before** latency | Hard failure (process crash, network drop) not saturation |
| Error rate drops and re-spikes in waves | Thundering herd — circuit breaker open/close/retry cycle |
| Single service high error rate, all others fine | Isolated failure — route to `nexus:debugging`, do not correlate |
| Error rate high, latency normal | Fast-failing errors (circuit breaker open, auth rejection) |
| Memory/CPU climbs gradually then all services degrade | GC pauses or OOM kills on shared nodes |

---

## Specialization Notes

**Service meshes (Istio/Linkerd):** Check control plane health first — a sick control plane degrades all data plane services simultaneously. `503 upstream connect error` and `upstream reset before response started` are cascade signatures. Envoy proxy logs often contain the causal chain before application logs do.

**Databases (PostgreSQL/MySQL):** Check `max_connections`/`pg_stat_activity` — connection exhaustion is the most common DB-originated cascade. Check slow query log (one long query can block all connection slots). Check replication lag — replica failures appear before primary errors.

**Caches (Redis/Memcached):** Check `rejected_connections` — full connection pool causes DB fallback storms. Check memory/evictions — `maxmemory-policy` evictions cause cache misses that look like cache failure. Check `slowlog` — an expensive command (LRANGE, SMEMBERS) blocks all other operations.

**API gateways/load balancers:** Check backend health check logs — misconfigured health checks mark healthy backends as down. Check connection timeout vs. read timeout mismatch — causes partial failure modes that are hard to correlate.

---

## Output Contract

Every investigation closes with this report. Fill every field; write `none` if not applicable — never leave blank:

```
## Failure Correlation Report

**Outcome:**          [one-line summary]
**Failure Mode:**     [Linear cascade | Fan-out | Independent | Thundering herd | Brownout]
**Origin Service:**   [service name + specific metric/event that triggered failure]
**Trigger:**          [what caused the origin service to fail]
**Timeline:**         [inline table T+00:00 to resolution]
**Causal Chain:**     [A → B → C with failure mode at each hop]
**Blast Radius:**     [table: service | role | peak error rate | user impact]
**Fix — Immediate:**  [per-service immediate actions]
**Fix — Prevention:** [per-service prevention measures]
**Blind Spots:**      [services or time windows with no data]
**Next Step:**        [one clear action for the user]
```

---

## Anti-Patterns

Read `anti-patterns/common-mistakes.md` before starting any investigation.

- Never blame a downstream service without proving its upstream was healthy at failure time.
- Never construct a timeline from summarized logs — raw timestamps only.
- Never propose a fix before completing Steps 1–5.
- Never skip the dependency graph — fan-out cascades look like independent failures without it.
- Never mark complete if `Blind Spots` is empty when data is missing — state what is unknown.
- Never conflate correlation with causation — simultaneous spikes do not imply causation.
