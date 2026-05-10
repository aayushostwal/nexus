# Correlation Heuristics — API Failure Investigation

Fast pattern-matching rules for narrowing down failure type before full timeline analysis.
Each heuristic includes the diagnostic signal, the conclusion it supports, and the verification
step to confirm or reject the hypothesis.

---

## Heuristic 1: Simultaneous Spike Across Unrelated Services → Shared Infrastructure

**Signal:** Three or more services with no direct call relationship all show elevated error rates
within the same 5-second window.

**Conclusion:** The failure originates in shared infrastructure — not in any application service.
Candidates: network partition, DNS resolution failure, load balancer misconfiguration, cloud
provider event (EC2 availability zone issue, ECS control plane degradation), or certificate expiry.

**Verification:**
1. Check cloud provider status page for the region (AWS Health Dashboard, GCP Status, Azure Status)
2. Run `ping` / `traceroute` between service hosts — look for packet loss or route changes
3. Check DNS TTL — a TTL expiry during a deployment can cause brief resolution failures across all services
4. Check load balancer access logs — if all backends are returning 502, the LB itself is likely healthy but backends are not reachable

**Do not:** Blame one application service when the blast radius is 3+ unrelated services with no shared call path.

---

## Heuristic 2: Errors Propagate in a Wave Matching Timeout Values → Request-Driven Cascade

**Signal:** Services start erroring sequentially with delays between each that roughly match
the timeout values configured in their upstream callers (e.g., service A errors at T+0, service B
errors at T+30s — which happens to be service A's DB query timeout).

**Conclusion:** This is a request-driven cascade. Requests are blocking at the origin until
the timeout fires, then the caller returns an error, which triggers its own upstream timeout, and
so on. The cascade depth equals the number of synchronous hops in the call chain.

**Verification:**
1. Extract the timeout settings from each service's config — do the propagation delays match?
2. Check if p99 latency rose **before** the error rate rose — latency first = timeout-driven cascade
3. Look for `context deadline exceeded`, `upstream timeout`, or `gateway timeout` error codes in logs

**Implication:** The fix is at the **origin** (the service that first started being slow or erroring),
not at the cascading callers. Also add circuit breakers at each hop to stop future propagation.

---

## Heuristic 3: Regular Periodic Error Spikes → Cron Job, Batch Process, or Connection Pool Recycling

**Signal:** Error spikes appear at fixed intervals (every 5 minutes, every hour, every day at 3am).
Between spikes, the system is healthy.

**Conclusion:** A scheduled process is contending for a shared resource at its scheduled time.
Common causes:
- Cron job running heavy queries against the production DB
- Batch report generation consuming all worker threads
- Connection pool recycling on a fixed TTL (HikariCP `maxLifetime`, SQLAlchemy pool pre-ping)
- Certificate or token rotation happening on a schedule

**Verification:**
1. Overlay a cron job schedule on the error timeline — do spikes align?
2. Check DB slow query log for the times matching the spikes
3. Check connection pool metrics: does the pool drain and refill at the same interval?
4. Run `crontab -l` and check scheduler configs (Celery Beat, APScheduler, Kubernetes CronJob)

**Implication:** The fix is to either move the scheduled job to off-peak hours, add resource limits
to the batch process, or increase pool size to absorb the burst.

---

## Heuristic 4: p99 Latency Rises Before Error Rate → Saturation, Not Hard Failure

**Signal:** p99 (or p95) latency starts climbing 3–10 minutes before the error rate rises. p50
latency may remain relatively stable during this period.

**Conclusion:** A resource is approaching saturation. Requests are waiting in a queue — they are
not yet failing, but they are slowing down. Common saturating resources: connection pool slots,
thread pool workers, in-flight request limits, OS file descriptors, or memory approaching the
limit triggering GC pressure.

**Verification:**
1. Check resource utilization metrics at the time the p99 started climbing: CPU, memory, connection pool %, thread pool active count
2. Look for queuing signals in logs: `pool timeout`, `executor full`, `waiting for connection`
3. Check if the saturation metric reached 100% exactly when errors started

**Implication:** You have a warning window — the system is degrading before it fails. Add alerting
on the saturation metric at 75–80% to catch this before it cascades. The fix is capacity or efficiency.

---

## Heuristic 5: Error Rate Rises Before p99 Latency → Hard Failure, Not Saturation

**Signal:** The error rate spikes suddenly (in < 10 seconds) without a preceding latency climb.
p99 latency may even drop as failed requests complete quickly with errors instead of timing out.

**Conclusion:** A hard failure — process crash, network drop, disk full, OOM kill — not a gradual
saturation. Hard failures complete immediately with an error code; they don't queue up.

**Verification:**
1. Check process manager logs (systemd, supervisor, ECS events) for crash events at the failure time
2. Look for OOM kill in kernel logs (`dmesg | grep -i 'oom'`)
3. Check disk usage — `df -h` — a full disk causes immediate hard failures on writes
4. Check if the error code is `ECONNREFUSED` (process died) vs. `ETIMEDOUT` (process is slow)

---

## Heuristic 6: p50 Fine, p99 High → Tail Latency Issue

**Signal:** Median latency is normal (p50 stable), but p99 is elevated by 10× or more.
Most requests complete normally; a small fraction are very slow.

**Conclusion:** Tail latency issue. The slow fraction is typically caused by:
- **Lock contention**: a fraction of requests hit a locked row/table and wait
- **GC pause**: periodic garbage collection pauses a fraction of requests in Java/Go/Python
- **Hot partition**: a small subset of data (hot user, hot shard) is accessed by many concurrent requests
- **Retry amplification**: a fraction of requests trigger expensive retry logic

**Verification:**
1. Sample slow traces specifically — what is different about the slow requests vs. fast ones?
2. Check GC logs or GC metrics — do GC pause times correlate with p99 spikes?
3. Check DB lock wait time (`pg_locks`, `SHOW ENGINE INNODB STATUS`) at the same time
4. Check if slow requests cluster around specific user IDs, tenant IDs, or data IDs

---

## Heuristic 7: Error Rate Drops Briefly Then Re-Spikes in Waves → Thundering Herd / Retry Storm

**Signal:** After initial errors, the error rate partially recovers (drops 30–50%), then spikes
again almost immediately. This pattern repeats 3–5 times before full recovery.

**Conclusion:** Thundering herd caused by synchronized retries. When a circuit breaker opens and
closes, all waiting clients retry simultaneously — overloading the recovering service. Or when a
cache expires, all clients miss simultaneously and hit the DB.

**Verification:**
1. Check circuit breaker state transitions in the API gateway or service mesh logs
2. Check if retries are configured with fixed backoff (not jitter) — fixed backoff = synchronized retries
3. Check cache TTL — if many keys expire at the same time, they all miss together

**Implication:** Add **jitter** to retry backoff. Use **probabilistic cache refresh** (refresh before TTL expiry).
Tune circuit breaker half-open probe rate to slowly ramp traffic, not open fully at once.

---

## Using p99 vs. Error Rate to Distinguish Saturation from Errors

The two most important signals in distributed system investigation are p99 latency and error rate.
Use this decision matrix:

| p99 Latency | Error Rate | Pattern | Investigation |
|-------------|------------|---------|---------------|
| Rising first | Rising second | Saturation cascade | Check resource utilization metrics |
| Stable / dropping | Rising suddenly | Hard failure | Check crash logs, OOM, disk full |
| Rising | Stable | Slowdown without errors | Check thread pool, DB query time, GC |
| Stable | Stable | No incident | Confirm monitoring is working |
| Rising for p99, not p50 | Stable or low | Tail latency / lock contention | Sample slow traces specifically |
| Rises in waves | Rises in waves | Thundering herd | Check retry config and circuit breakers |
