# Production Reliability Heuristics

Battle-tested patterns for rapid diagnosis. Each heuristic reduces the hypothesis space. Apply them in the first 15 minutes before deep investigation begins.

---

## The Golden Rules

These are the highest-signal heuristics. Apply them before anything else.

### Rule 1: The Recent Change Rule

> **80% of production incidents are caused by the most recent deploy or config change.**

Before investigating anything else, answer: "What changed in the last 2 hours?"

```bash
git log --oneline --after="2 hours ago"          # code changes
kubectl rollout history deployment/<service>      # K8s deploy history
aws cloudtrail lookup-events --start-time ...     # AWS config/infra changes
# Check: feature flag dashboards, Vault/SSM change log, Terraform applies
```

If there was a deploy or config change that overlaps with the incident start time within 5 minutes, treat it as the primary suspect. Roll back first, investigate why second.

**Why it works:** Deployment windows concentrate risk. The longer a system runs without change, the more confident you can be it's stable. New changes introduce new failure modes.

**When it fails:** Long-running issues (resource leaks, disk fill) that were introduced days ago but take time to manifest. Traffic-driven incidents (spike exceeds capacity) with no recent change.

---

### Rule 2: Symptom Pattern → Failure Class

Match the symptom pattern to the failure class before reading a single line of code.

| Symptom pattern | Most likely failure class | First signal to check |
|----------------|--------------------------|----------------------|
| Gradual degradation over hours | Resource leak (memory, connections, file handles, disk) | Memory trend, connection count trend, disk usage |
| Sudden onset, correlated with deploy | Code or config regression | Deploy time vs. incident start time |
| Sudden onset, no deploy, traffic spike | Capacity / saturation | RPS spike, CPU/memory/connection spike |
| Sudden onset, no deploy, no spike | Infrastructure failure (DB, cache, network) | Dependency health checks |
| Consistent interval pattern | Cron job or batch process | Check cron schedules, batch job logs |
| Only affects subset of traffic | Feature flag, canary, data pattern, or AB test | Feature flag state, canary percentage |
| Only affects one region | Regional config, network partition, regional infra issue | Cross-region metrics comparison |
| Affects only one endpoint | Endpoint-specific logic or dependency | Endpoint-scoped error rate |
| Affects all endpoints equally | Shared infrastructure (DB, cache, LB, auth) | Dependency health |

---

### Rule 3: The USE Method for Resource Diagnosis

For any resource (CPU, memory, disk, network, DB connections, thread pool), ask three questions:

- **U**tilization: What percentage of the resource's capacity is being used?
  - High utilization (>80%) means you are close to exhaustion
- **S**aturation: Are requests queuing up waiting for the resource?
  - Saturation means you have already exceeded capacity for some requests
- **E**rrors: Is the resource returning errors?
  - Errors mean requests are actively failing, not just slow

Saturation before Errors: you will see saturation (latency rise, queuing) before you see errors. Watch saturation as the leading indicator.

```bash
# CPU utilization and saturation (run queue)
top -bn1 | grep "Cpu(s)"
vmstat 1 5                   # look at 'r' (run queue) for saturation

# Memory
free -h
cat /proc/meminfo | grep -E "MemAvailable|SwapUsed"

# Disk I/O
iostat -x 1 5               # %util column = utilization, await = saturation signal

# Network connections
ss -s                        # connection summary
netstat -an | grep ESTABLISHED | wc -l

# PostgreSQL connections
psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
psql -c "SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock';"
```

---

## Intermediate Heuristics

### Heuristic: Leading vs. Lagging Indicators

Leading indicators warn before failures. Lagging indicators confirm failures after they happen.

| Leading (detect early) | Lagging (confirm failure) |
|-----------------------|--------------------------|
| Memory usage trend | OOM kill |
| Connection pool utilization % | "timeout waiting for connection" error |
| p99 latency rising | 5xx error rate |
| Disk usage trend | "no space left on device" |
| Queue depth increasing | Consumer lag → job failures |
| CPU run queue > 1 | CPU 100% and requests timing out |

**Alert on leading indicators.** Most teams alert only on lagging indicators (error rate, 5xx). By the time the error rate fires, the system is already degraded. Add alerts at 70-80% utilization, not 100%.

---

### Heuristic: Deployment Blast Radius Patterns

The shape of the impact tells you about the failure mode:

**All pods affected simultaneously + correlated with deploy:**
- Likely: code change, new required environment variable, startup crash
- Check: pod logs on startup, exit codes

**Pods failing gradually after a rolling deploy:**
- Likely: the new version has a memory leak or runtime accumulation issue
- Check: memory trend since first pod updated, GC metrics

**50% of traffic failing:**
- Likely: canary or blue/green with exactly half traffic on new version
- Check: load balancer split configuration, canary percentage

**Traffic failing in waves that match pod restart times:**
- Likely: the new version crashes on startup or fails health check
- Check: readiness probe, startup logs, container exit codes

---

### Heuristic: Database Incident Patterns

Database incidents follow predictable patterns:

| Pattern | Root cause | First check |
|---------|-----------|-------------|
| Suddenly all queries slow | Lock contention or autovacuum running | `pg_stat_activity` for `wait_event_type = 'Lock'`; check for long-running transactions |
| Connection refused | Max connections reached | `pg_stat_activity` connection count vs `max_connections` |
| Gradual query slowdown over hours | Index bloat, table bloat, or statistics staleness | `pg_stat_user_tables` for `n_dead_tup`; run `EXPLAIN ANALYZE` on slow query |
| Sudden query slowdown after deploy | New query without index (sequential scan) | `pg_stat_statements` for queries with high `mean_exec_time`; check `EXPLAIN` for `Seq Scan` |
| One query type slow, rest fine | Missing index or bad query plan | `pg_stat_statements` filtered by query |
| Replication lag growing | Replica write pressure or network | Check replica lag, replica server load |

```bash
# Quick DB diagnostics
psql -c "SELECT pid, state, wait_event_type, wait_event, query, now() - pg_stat_activity.query_start AS duration FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds' ORDER BY duration DESC;"

# Top 10 slowest queries by mean time
psql -c "SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

### Heuristic: Using git bisect for Performance Regressions

When you know "it was fast 2 weeks ago and is slow now" but cannot identify the commit:

```bash
# Start bisect
git bisect start
git bisect bad HEAD                    # current version is slow (bad)
git bisect good <commit-two-weeks-ago> # this commit was fast (good)

# Git checks out a middle commit. Run your performance test:
./benchmark.sh  # or whatever measures the regression

# Tell git the result:
git bisect good   # if fast
git bisect bad    # if slow

# Repeat until git identifies the exact commit that introduced the regression
git bisect reset  # when done
```

This finds the exact commit in O(log n) steps. For 20 commits: 5 tests. For 100 commits: 7 tests.

When to use bisect:
- Performance regression with no obvious candidate commit
- A test that was passing now fails and you don't know which commit broke it
- A gradual behavioral change that accumulated over many commits

---

### Heuristic: Log-Based Timeline Reconstruction

When monitoring dashboards are unavailable or don't go back far enough:

```bash
# Find first occurrence of error in logs
grep -n "ERROR\|FATAL\|Exception" /var/log/app/*.log | head -50

# Find the exact timestamp of first failure
grep "500\|error\|failed" access.log | awk '{print $4}' | head -1

# Count errors per minute to see degradation curve
grep "ERROR" app.log | awk '{print $1, $2}' | cut -c1-16 | sort | uniq -c

# Kubernetes: get events for a pod
kubectl describe pod <pod-name> | grep -A 20 Events

# Find when a pod last restarted
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
```

---

### Heuristic: The 5 Whys for Root Cause Depth

Stop at the first "why" that produces a mechanism you can change. Deeper is not always better.

Example:
1. Why did the service go down? → OOM kills on all pods.
2. Why did pods OOM? → Memory usage hit 2GB limit.
3. Why did memory grow? → Each request loaded a full image file into memory.
4. Why did it load the full image? → No streaming/chunking implemented; PIL loaded the whole file.
5. Why was it coded that way? → Developer was unaware PIL.open() doesn't stream by default.

Fix point: Step 4 (code fix) and Step 5 (documentation/review process).

Going to "why did the developer not know?" can be useful for systemic prevention but is not the root cause of this incident.

---

### Heuristic: Feature Flag and Canary Patterns

If only a subset of traffic is failing:

```
Affected traffic % ≈ canary % → canary deployment is the blast radius
Affected traffic = specific user IDs → feature flag targets specific users
Affected traffic = specific tenant → tenant-specific config or data issue
Affected traffic = specific geographic region → regional deployment or CDN issue
Affected traffic = specific browser/client → client-version-specific change
Affected traffic = requests with specific payload → data-pattern-driven bug
```

To identify if a feature flag is involved:
1. Find requests that succeed and requests that fail
2. Diff the request parameters, headers, user attributes, or session state
3. The difference between the two populations often points directly to the flag or data condition

---

### Heuristic: Alert Calibration Indicators

These heuristics tell you when your alerting needs tuning (post-mortem finding):

- **Alert fired at the same time as user reports** → alert threshold too high; you have no lead time
- **Alert fired before any user impact** → good, but check if you alert-fatigued on-call with false positives
- **On-call first heard about the incident from a user, not an alert** → synthetic monitoring or alert coverage gap
- **On-call learned something from logs that a metric alert would have caught earlier** → add the metric
- **Alert fired for a completely different reason than the actual incident** → alert specificity problem

Target: p95 of detection time (alert fires → on-call acknowledges) < 5 minutes for P0/P1.

---

## Quick Reference Card

```
Onset pattern:
  Sudden + deploy?       → Rollback candidate
  Sudden + no deploy?    → Infra or dependency failure
  Gradual over hours?    → Resource leak
  Consistent interval?   → Cron or batch
  Subset of traffic?     → Flag, canary, or data pattern
  One region?            → Regional issue

USE Method:
  Utilization > 80%?     → Approaching saturation
  Saturation present?    → Already over capacity for some requests
  Errors from resource?  → Active failures, not just slowness

Database shortcuts:
  All slow?              → Lock contention or autovacuum
  Connections refused?   → Pool exhausted
  One query slow?        → Missing index

Timeline construction:
  1. Deploy history
  2. Config/flag changes
  3. Traffic RPS trend
  4. First error occurrence in logs
  5. Metric anomaly start time
```
