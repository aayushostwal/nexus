# Production Failure Scenarios — Observability

Two fully worked cascading failure scenarios with timeline, causal chain, and fix.

---

## Scenario 1: Database Connection Pool Exhaustion Cascade

### Situation

An e-commerce platform experiences sudden user-facing errors across checkout, login, and profile
pages at 14:32 UTC on a Tuesday afternoon. The on-call engineer sees PagerDuty alerts for
`api-gateway` (high error rate) and `user-service` (high error rate) fire within seconds of each
other, followed by `auth-service` 40 seconds later.

### Services Involved

```
[PostgreSQL RDS] ← [auth-service:5001] ← [api-gateway:8080] ← users
                                        ↑
                  [user-service:5002] ← [api-gateway:8080]
                                        ↑
                  [order-service:5003] ← [api-gateway:8080]
```

### Raw Timeline

| Time (UTC)   | Service          | Event                                                     | Error Rate |
|--------------|-----------------|-----------------------------------------------------------|------------|
| 14:28:03     | PostgreSQL       | `max_connections` reached (200/200 connections used)      | 0%         |
| 14:28:11     | PostgreSQL       | New connection attempts timing out after 30s wait         | 0%         |
| 14:28:41     | auth-service     | DB query `SELECT * FROM sessions WHERE token=?` timeout   | 3%         |
| 14:29:02     | auth-service     | JWT validation rate drops 60% — DB-backed session checks failing | 28%   |
| 14:29:15     | api-gateway      | Upstream `auth-service` returning HTTP 503               | 12%        |
| 14:29:31     | api-gateway      | All authenticated routes failing — circuit breaker opens  | 78%        |
| 14:29:38     | user-service     | Auth check to `api-gateway` returning 503                | 34%        |
| 14:29:44     | order-service    | Auth check to `api-gateway` returning 503                | 41%        |
| 14:30:10     | api-gateway      | Circuit breaker half-opens — retry storm begins           | 65%        |
| 14:32:00     | On-call alert    | PagerDuty fires for api-gateway and user-service          | —          |
| 14:36:18     | DBA              | Kills idle connections; pool drops to 40/200              | —          |
| 14:36:45     | auth-service     | DB queries resume; error rate drops                       | 4%         |
| 14:37:10     | api-gateway      | Circuit breaker closes; error rate drops                  | 2%         |
| 14:37:40     | user-service     | Normal operation resumes                                  | 0%         |

### Failure Mode Classification

**Fan-out cascade.** One shared dependency (PostgreSQL) failed; all of its consumers
(`auth-service`, `order-service`, `user-service` via auth) degraded simultaneously.

### Causal Chain

```
PostgreSQL (ORIGIN: connection pool exhausted)
    ↓ DB queries timeout
auth-service (PROPAGATOR: session validation fails → returns 503)
    ↓ auth checks fail
api-gateway (PROPAGATOR: circuit breaker opens on auth-service)
    ↓ all authenticated requests rejected
user-service (VICTIM: cannot pass auth check)
order-service (VICTIM: cannot pass auth check)
```

### Root Cause Statement

> "PostgreSQL failed because its connection pool was exhausted (200/200 connections) after a
> mid-afternoon traffic spike increased concurrent queries by 35%, causing a fan-out cascade
> that propagated through auth-service → api-gateway to all authenticated endpoints, with 78%
> of user-facing requests failing by T+01:28."

### Blast Radius

| Service       | Role        | Peak Error Rate | User Impact                        |
|---------------|-------------|----------------|-------------------------------------|
| PostgreSQL    | ORIGIN      | 100% timeouts  | Internal only (no direct user calls)|
| auth-service  | PROPAGATOR  | 28%            | Login failures, session invalidation|
| api-gateway   | PROPAGATOR  | 78%            | All authenticated API requests      |
| user-service  | VICTIM      | 34%            | Profile page, preferences           |
| order-service | VICTIM      | 41%            | Checkout, order history             |

### Fix

**Immediate:**
- Kill idle connections (`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle'`)
- Manually open the api-gateway circuit breaker after auth-service recovers

**Prevention:**

| Service       | Prevention Measure |
|---------------|-------------------|
| PostgreSQL    | Set `max_connections=400` (increase RDS instance); add PgBouncer connection pooler in transaction mode |
| auth-service  | Cache JWT session validation in Redis (TTL 30s) to reduce DB dependency for hot path |
| api-gateway   | Tune circuit breaker: open at 30% error rate (not 50%); add fallback response for auth timeout |
| All services  | Alert at 80% connection pool utilization — not 100% |

---

## Scenario 2: Redis Timeout Causing Cache-Aside Thundering Herd

### Situation

A SaaS analytics platform sees a sudden 10× spike in PostgreSQL query rate at 09:14 UTC, causing
DB CPU to peg at 100% and query latency to climb from 8ms to 4,200ms. The API layer error rate
rises from 0.1% to 22% over 90 seconds. Redis is showing elevated latency in the metrics
dashboard but no alerts have fired.

### Services Involved

```
[api-service] → [Redis cache] → (miss) → [PostgreSQL]
```

The platform uses cache-aside: API reads from Redis first; on a miss, reads from PostgreSQL and
writes back to Redis.

### Raw Timeline

| Time (UTC)   | Service       | Event                                                           | Metric      |
|--------------|--------------|------------------------------------------------------------------|-------------|
| 09:10:02     | Redis         | `MEMORY DOCTOR` reports fragmentation ratio 3.2 (normal < 1.5) | —           |
| 09:12:44     | Redis         | Active defragmentation starts — CPU spikes to 85%              | —           |
| 09:13:01     | Redis         | GET/SET command latency rises from 0.3ms to 180ms              | —           |
| 09:13:15     | api-service   | Cache reads timing out (timeout configured at 100ms)           | —           |
| 09:13:15     | api-service   | Cache-aside falls back: reads from PostgreSQL directly          | +600% DB RPS|
| 09:13:22     | PostgreSQL    | Query queue depth: 0 → 840 in 7 seconds                       | CPU 100%    |
| 09:13:40     | PostgreSQL    | Query latency: 8ms → 1,200ms                                   | —           |
| 09:14:05     | api-service   | API p99 latency: 45ms → 3,800ms                               | —           |
| 09:14:18     | api-service   | HTTP 504 timeouts begin (upstream timeout 4s)                  | 8% errors   |
| 09:14:40     | api-service   | 504 rate peaks                                                 | 22% errors  |
| 09:15:10     | Redis         | Defragmentation completes; latency returns to 0.4ms            | —           |
| 09:15:10     | api-service   | Cache reads succeed — cache-aside fallback stops               | —           |
| 09:15:25     | PostgreSQL    | Query queue drains; latency drops to 12ms                      | CPU 40%     |
| 09:15:50     | api-service   | Error rate returns to 0.1%                                     | —           |

### Failure Mode Classification

**Thundering herd via cache-aside fallback.** Redis did not hard-fail — it slowed down enough
to trigger client-side timeouts. Every API request that would have hit Redis fell back to
PostgreSQL simultaneously. The DB could not absorb the full uncached load.

### Causal Chain

```
Redis (ORIGIN: memory fragmentation → defrag spike → command latency > 100ms)
    ↓ all cache reads time out
api-service (PROPAGATOR: cache-aside fallback fires for every request simultaneously)
    ↓ 600% DB RPS spike
PostgreSQL (VICTIM: overwhelmed by full uncached load → query queue saturates)
    ↓ latency > 4s
api-service (PROPAGATOR: upstream timeout → HTTP 504 to clients)
```

### Root Cause Statement

> "Redis failed because active memory defragmentation spiked its command latency above the
> api-service's 100ms cache timeout, causing every API request to simultaneously fall back to
> PostgreSQL in a thundering herd, overwhelming the DB with 600% above normal query rate and
> producing 22% HTTP 504 error rate for 90 seconds."

### Blast Radius

| Service      | Role        | Peak Metric          | User Impact                       |
|--------------|-------------|---------------------|-----------------------------------|
| Redis        | ORIGIN      | 180ms GET latency   | None directly — internal cache    |
| api-service  | PROPAGATOR  | 22% 504 errors      | Dashboard loads, report queries   |
| PostgreSQL   | VICTIM      | 100% CPU, 4.2s p99  | All DB-backed operations slow     |

### Fix

**Immediate:**
- None needed — self-resolved when defragmentation completed (90 seconds)
- In a longer-running case: `CONFIG SET activedefrag no` to stop defrag and reduce latency

**Prevention:**

| Component     | Prevention Measure |
|---------------|-------------------|
| Redis         | Schedule `activedefrag` during off-peak hours using a cron-triggered `CONFIG SET`; alert when fragmentation ratio > 2.0 |
| api-service   | Add **jitter** to cache-aside fallback: `sleep(random(0, 200ms))` before hitting DB to spread the thundering herd |
| api-service   | Use a **probabilistic early expiration** (PER) pattern — refresh cache slightly before TTL expires, not after a miss |
| PostgreSQL    | Add a **DB-level rate limit** (PgBouncer `max_db_connections` per pool) so a thundering herd cannot exhaust connections |
| Both          | Add Redis slowlog alerting: alert if `SLOWLOG LEN` exceeds 100 in a 60s window |
