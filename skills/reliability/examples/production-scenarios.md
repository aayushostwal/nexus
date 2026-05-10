# Production Incident Scenarios

Three real-pattern production incidents with full timelines, investigation paths, and post-mortem findings. Use these as reference templates when structuring an investigation.

---

## Scenario 1: Memory Leak from New Feature — Gradual OOM Across All Pods

**Pattern:** Gradual degradation over 2 hours → total service outage

### Context
- Service: Image processing microservice (Python, Kubernetes)
- Change: New "high-res export" feature deployed at T-2h00
- Traffic: Normal (no spike)
- First alert: `pod_memory_usage > 90%` at T-0h10

### Timeline

```
T-2h00: Deploy v4.7.0 pushed. New feature: /api/export/highres endpoint.
         CI passed. Staging tested with 5 sample images.
T-1h45: All pods healthy. Memory usage at baseline 42% per pod.
T-1h00: Memory usage trending upward: 55% across all pods.
         No alert fired (threshold at 90%). No on-call notification.
T-0h30: Memory usage 74%. First slow query logs appear (GC pressure).
T-0h10: Alert fires: pod-memory-usage > 90%.
         On-call acknowledges. Begins looking at DB metrics (wrong direction).
T-0h05: Pod-3 OOM killed. K8s restarts it. Memory climbs back immediately.
T+0h00: All 8 pods OOM-killed within 90 seconds of each other.
         Service completely unavailable. 503 rate: 100%.
T+0h03: Incident declared P0. Rollback initiated.
T+0h06: Rollback to v4.6.2 complete. Pods restart.
T+0h09: Memory stabilizes at 42%. Error rate drops to 0%.
T+0h11: Service healthy. Incident resolved.
```

### Initial Symptoms
- Gradual memory rise across ALL pods simultaneously
- No traffic spike
- No error rate increase until the very end (OOM kills caused 503s, not the feature itself)
- GC pressure visible as increased latency p99 (from 120ms to 340ms) before OOMs

### Investigation Path

1. **Wrong initial direction:** On-call checked DB metrics first (CPU, connections) — all normal.
2. **Timeline built:** Correlated memory trend start time with deploy time at T-2h00. Exact match.
3. **Hypothesis formed:** New endpoint has a memory leak. Evidence: all pods affected simultaneously, gradual rise, correlates with deploy.
4. **Code read:** Found `PIL.Image.open(file_path)` loading entire high-res image (400MB+) into memory per request, no chunking, no explicit `image.close()`. Object held in a module-level cache with no TTL.
5. **Confirmed:** 1 request to `/api/export/highres` in staging with a large image reproduced 400MB memory increase. After 10 requests, process consumed 4GB.

### Root Cause

> The high-res export feature loaded full images into a module-level PIL cache without TTL or explicit cleanup. Each unique image request added 400–800MB to the process heap permanently, causing all pods to exhaust their 2GB memory limits within 2 hours of normal traffic.

### Fix Applied (immediate)
- Rollback to v4.6.2

### Permanent Fix
- Added `with PIL.Image.open(path) as img:` context manager (auto-closes file)
- Removed module-level image cache; replaced with LRU cache with 100MB max size and 5-minute TTL
- Added explicit `img.close()` after processing
- Added memory profiling in CI for image processing code paths

### Post-Mortem Findings

**What went well:**
- Rollback was fast (3 minutes from initiation to recovery)
- Timeline correlation was clear once built

**What went poorly:**
- Staging used 5 small test images; never tested with production-scale images (250 unique images/hour)
- Alert threshold at 90% gave only 10 minutes of warning for a 2-hour degradation
- On-call investigated DB before building timeline — wasted 3 minutes

**Action items:**
| Item | Owner | Type |
|------|-------|------|
| Add memory profiling script to CI for image processing PRs | Platform | Prevention |
| Add memory usage alert at 70% (not 90%) | SRE | Detection |
| Add load test with production-realistic images to staging pipeline | QA | Testing |
| Update runbook: "build timeline before investigating signals" | On-Call Lead | Process |

---

## Scenario 2: Database Connection Pool Exhaustion After Traffic Spike — Sudden P0

**Pattern:** Sudden onset → total service failure → requires traffic shedding to resolve

### Context
- Service: E-commerce API (Node.js, PostgreSQL via pg-pool)
- Change: No recent deploy (last deploy 3 days ago)
- Trigger: Viral marketing campaign launched at T+0h00 (team forgot to notify engineering)
- First alert: `5xx_rate > 1%` at T+0h02

### Timeline

```
T-0h05: Normal traffic. 850 RPS. DB connections: 45/100. p99: 95ms.
T+0h00: Marketing sends campaign email to 2M users. Traffic spike begins.
T+0h01: Traffic: 4,200 RPS. DB connections: 98/100. p99: 890ms.
T+0h02: Alert fires: 5xx rate > 1%. On-call acknowledges.
         DB connections: 100/100 (pool exhausted). Requests queuing.
T+0h03: 5xx rate: 67%. All new DB requests timeout (30s timeout hit).
         Application logs: "Error: timeout expired (waiting for connection from pool)"
T+0h04: Incident declared P0. All on-call paged.
T+0h07: Identified: connection pool exhausted. No recent deploy — spike-driven.
T+0h09: Rate limiting enabled at load balancer (cap at 1,000 RPS).
         Traffic shed: 4,200 → 1,050 RPS. DB connections drop: 100 → 48.
T+0h11: 5xx rate drops to 0.2%. Service recovering.
T+0h15: p99 returns to 110ms. Error rate: 0%. Incident resolved.
T+0h20: Rate limit gradually raised. Traffic allowed back in.
T+1h00: Traffic at 3,800 RPS with DB connections stable at 65/100.
         (Long-lived connections being reused more efficiently post-restart)
```

### Initial Symptoms
- Sudden 5xx spike with no prior warning
- Log message: `timeout expired (waiting for connection from pool)` — key indicator
- No deploy correlated (3 days since last deploy)
- CPU and memory healthy — pure connection exhaustion

### Investigation Path

1. **Timeline built:** No deploy in last 2 hours. Eliminated deployment as cause.
2. **Traffic checked:** RPS had spiked 5x in 2 minutes. Root cause suspect: traffic-driven saturation.
3. **Resource checked using USE method:**
   - Utilization: DB connections 100% (pool fully utilized)
   - Saturation: 200+ requests queuing for a connection (visible in pg_stat_activity)
   - Errors: "timeout expired" in app logs
4. **Blast radius:** All endpoints requiring DB access (98% of the API surface).
5. **Mitigation path:** Rate limiting at LB to reduce incoming RPS below pool capacity.

### Root Cause

> The pg-pool connection pool was configured for steady-state traffic (100 connections, 30s timeout). A 5x traffic spike from a marketing campaign exceeded pool capacity within 60 seconds. Once the pool was exhausted, all new requests waited 30 seconds and then failed, creating a cascade where slow retries further saturated the pool.

### Fix Applied (immediate)
- Rate limiting at load balancer to shed traffic below pool capacity

### Permanent Fix
- Increased connection pool from 100 to 250 (after verifying PostgreSQL `max_connections` headroom)
- Added connection pool metrics alert at 80% utilization (not 100%)
- Implemented PgBouncer as connection pooler (multiplexes application connections more efficiently)
- Established process: engineering must be notified 24h before marketing campaigns

### Post-Mortem Findings

**What went well:**
- Fast identification of connection pool error in logs
- Rate limiting mitigation available and effective
- Recovery was clean once traffic was shed

**What went poorly:**
- No communication between marketing and engineering about campaign launch
- Connection pool alert was at 100% (too late — by then requests are already failing)
- No load shedding mechanism existed before this incident (had to configure ad hoc)
- Pool size had never been reviewed after service scaled from 20 → 40 pods (each pod has its own pool)

**Action items:**
| Item | Owner | Type |
|------|-------|------|
| Add pre-configured rate limiting rule in load balancer (off by default) | Platform | Mitigation |
| Add connection pool utilization alert at 75% | SRE | Detection |
| Implement PgBouncer to multiplex connections | Backend | Prevention |
| Establish marketing → engineering 24h pre-notice process | Engineering Lead | Process |
| Review and document pod-count × pool-size math quarterly | SRE | Prevention |

---

## Scenario 3: Config Change Causing 100% Error Rate on One Endpoint — Deployment-Correlated

**Pattern:** Immediate onset on deploy → partial failure (one endpoint) → fast rollback

### Context
- Service: Authentication API (Go, Kubernetes)
- Change: Config map update to rotate JWT signing key (deployed at T+0h00)
- First alert: `POST /api/auth/token 500 rate > 5%` at T+0h01

### Timeline

```
T-0h05: Normal operation. Auth token endpoint: 0% error rate. p99: 45ms.
T+0h00: ConfigMap updated: JWT_SIGNING_KEY rotated to new 512-bit key.
         Kubernetes rolling update begins. 2 of 8 pods pick up new config.
T+0h01: Alert fires: /api/auth/token 500 rate > 5%.
         On-call acknowledges. Checks: "was there a deploy?" → yes, config change 1 min ago.
T+0h02: On-call verifies only /api/auth/token affected (not /api/auth/validate).
         Investigation: token endpoint uses signing key (write path). Validate uses public key (read path).
T+0h03: Hypothesis: new key format incompatible or key not properly base64-encoded.
         Evidence: error log shows "crypto/rsa: invalid key size" on pods with new config.
T+0h04: Decision: revert ConfigMap to previous key. Requires approval from security lead.
         Security lead paged.
T+0h06: Security lead approves revert.
T+0h07: ConfigMap reverted. Rolling restart begins.
T+0h09: All pods on old config. /api/auth/token error rate: 0%.
T+0h10: Incident resolved. Total duration: 10 minutes. Impact: token generation only.
```

### Initial Symptoms
- Immediate 100% error rate on `/api/auth/token` (token generation endpoint)
- Zero impact on `/api/auth/validate` (token validation endpoint — different code path)
- No traffic spike, no resource saturation
- Exact correlation with config map deployment time
- Error in logs: `crypto/rsa: invalid key size`

### Investigation Path

1. **Deploy correlated immediately** (1 minute gap between config change and alert).
2. **Blast radius scoped:** Only token generation failed; validation (using cached/public keys) was unaffected. New logins broken; existing sessions healthy.
3. **Log read:** `crypto/rsa: invalid key size` on new config pods. Healthy pods were on old config.
4. **Root cause in config:** New JWT_SIGNING_KEY was 512-bit RSA key; application required 2048-bit minimum (enforced at runtime, not at config write time).
5. **No code change needed** — config-only incident with config-only fix.

### Root Cause

> The JWT signing key rotation deployed a 512-bit RSA key; the application's Go crypto library enforces a 2048-bit minimum and rejected the key at runtime. Because Kubernetes did a rolling update, only pods that received the new config failed — creating a partial failure where 25% of token generation requests failed (hitting new pods) while 75% succeeded (hitting old pods).

### Fix Applied
- Revert ConfigMap to previous (valid) key
- Rolling restart to clear new config from all pods

### Permanent Fix
- Added startup validation: application validates key size and format at boot, fails fast before accepting traffic
- Added key validation step to the key rotation runbook (verify key size before applying)
- Added integration test: "token generation fails gracefully on invalid key" (caught in staging)

### Post-Mortem Findings

**What went well:**
- Fast correlation: deploy → incident detected in 1 minute
- Blast radius was narrow (only new-login flow affected; existing sessions healthy)
- On-call correctly identified the deploy as prime suspect immediately

**What went poorly:**
- Config validation happened at runtime, not at deploy time — 10 minutes of impact was preventable
- Key rotation runbook had no "verify key format" step
- Security lead approval gate added 2 minutes delay to a clear rollback decision

**Action items:**
| Item | Owner | Type |
|------|-------|------|
| Add key format/size validation at application startup (fail fast) | Backend | Prevention |
| Add key validation step to key rotation runbook | Security | Process |
| Pre-authorize on-call to revert config changes without security lead approval (for <15 min incidents) | Security Lead | Process |
| Add `/api/auth/token` endpoint to synthetic monitoring (detect before users report) | SRE | Detection |
