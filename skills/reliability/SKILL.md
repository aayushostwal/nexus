---
name: nexus-reliability
description: >
  Use this skill when investigating a production incident, outage, degradation, or anomaly.
  Trigger phrases: "production is down", "service degraded", "latency spike", "error rate jumped",
  "investigate this incident", "why is the service slow", "we're getting 500s", "on-call alert fired",
  "SLA breach", "runbook execution", "post-mortem", "RCA for incident", "root cause production failure",
  "CPU spike in prod", "memory leak production", "database connection pool exhausted".
  Also trigger for release readiness ("is this safe to deploy", "pre-deployment checklist",
  "release gate", "deploy confidence", "should we roll back").
  When in doubt, use this skill.
---

# Nexus Production Incident Investigator

Time-boxed, evidence-driven workflow for investigating production incidents and evaluating release readiness.

---

## Compatibility
- Sub-skills: `release-readiness.md`
- Supporting materials: `checklists/incident-checklist.md`, `heuristics/reliability-heuristics.md`, `anti-patterns/common-mistakes.md`, `validation/output-validation.md`
- Required tools: Read, Bash, Grep
- Optional tools: WebSearch (for tool-specific error lookups)
- Hands off to: `nexus:debugging` for code-level root cause; `nexus:planning` for post-mortem action items

---

## Core Principle

**Stabilize first. Investigate second. Never skip the timeline.**

Every minute spent investigating before mitigating is a minute of customer impact. Every investigation without a timeline produces a wrong root cause. These two rules are inviolable.

---

## Incident Classification

Before doing anything else, classify severity. This determines the pace and who gets paged.

| Severity | Definition | Response target |
|----------|-----------|-----------------|
| **P0** | Complete service outage or data loss affecting all/most users | Immediate; page all on-call |
| **P1** | Major feature broken or >25% of requests failing | < 5 min acknowledgement; page on-call lead |
| **P2** | Degraded performance or partial failure affecting subset of users | < 15 min acknowledgement; one engineer |
| **P3** | Minor anomaly, no user impact, investigate async | Next business hour |

If you cannot classify immediately, default to P1 and downgrade after Phase 1.

---

## Incident Investigation Workflow

### Phase 1 — Triage (0–5 minutes)

**Goal:** Confirm the incident is real, classify severity, identify blast radius.

1. **Confirm the signal is real** — verify the alert against at least one independent data source:
   - Alert from monitoring tool → cross-check with logs or another dashboard
   - User report → attempt to reproduce manually
   - Never declare an incident from a single data point (alerts misfire)

2. **Classify severity** using the table above. Write it down immediately.

3. **Identify blast radius:**
   - Which services are affected? (not just the alerting service)
   - Which user segments are affected? (all users, paying users, specific region, specific feature)
   - Is data integrity at risk? (writes failing, corrupted state, data loss)
   - What is the revenue/SLA impact per minute?

4. **Open an incident channel** (Slack, PagerDuty, etc.) and post:
   ```
   [P0/P1/P2] <service> — <one-line symptom> — investigating
   ```

5. **Assign roles** (for P0/P1):
   - Incident Commander: coordinates, owns communication, does NOT debug
   - Tech Lead: drives investigation
   - Scribe: documents timeline in real time

Proceed to Phase 2 immediately. Do not spend more than 5 minutes here.

---

### Phase 2 — Stabilize (5–15 minutes)

**Goal:** Reduce customer impact. Apply mitigations before finding root cause.

**Stabilize before you investigate.** A rollback that takes 5 minutes is worth more than 30 minutes of investigation.

Ask in this order — stop at the first "yes":

| Question | Action if yes |
|----------|--------------|
| Was there a deploy in the last 2 hours? | Roll back the deploy immediately. Confirm error rate drops. |
| Was there a config/feature-flag change? | Revert the config change. Confirm error rate drops. |
| Is one instance/pod the source? | Remove it from the load balancer and restart it. |
| Is a downstream dependency unavailable? | Enable fallback/circuit breaker or degrade gracefully. |
| Is the database connection pool exhausted? | Restart connection pooler (PgBouncer, etc.), reduce pool size, shed load. |
| Is there a traffic spike causing saturation? | Enable rate limiting, add capacity, or activate load shedding. |

**If a rollback is available and the deploy correlates with incident start: roll back first, confirm, then investigate why.**

After mitigation: post an update to the incident channel:
```
[Update] Mitigation applied: <what you did>. Error rate: <before> → <after>. Still investigating root cause.
```

---

### Phase 3 — Root Cause (15–60 minutes)

**Goal:** Establish the exact mechanism that caused the incident. No guessing.

#### Step 3.1 — Build the Timeline

Start here. Every other step depends on this.

```
T-2h00: [context: normal state — what metrics looked like before]
T-1h45: Deploy v2.3.1 pushed to production
T-0h30: Memory usage begins rising on all pods (slow trend)
T-0h05: First OOM kill on pod-7
T+0h00: Alert fires — 503 rate > 5%
T+0h08: All pods OOM-killed, service completely down
T+0h15: Rollback initiated
T+0h18: Error rate drops to 0%
```

Sources for timeline construction:
- Deployment history (CI/CD logs, release tags)
- Config change history (feature flag audit log, Vault/SSM change log)
- Monitoring dashboards — screenshot metric state at incident start
- Application logs — find first occurrence of error pattern
- Infrastructure events (AWS CloudTrail, GCP audit log, K8s events)

#### Step 3.2 — Signal Analysis

Check these metrics in priority order. Each one narrows the hypothesis space:

| Metric | What it tells you | Tooling |
|--------|-------------------|---------|
| **Error rate** (5xx/4xx) | Which endpoints are failing | APM, access logs |
| **Latency p99** | Slowness vs. failure distinction | APM, Prometheus |
| **Saturation** (CPU, memory, connections) | Resource exhaustion | Node exporter, CloudWatch |
| **Traffic volume** (RPS) | Spike-driven vs. change-driven | Load balancer metrics |
| **Queue depth / backlog** | Upstream pressure | SQS, Kafka consumer lag |
| **Database metrics** | Connection count, lock waits, slow queries | pg_stat_activity, slow query log |
| **Dependency health** | Which downstream services are responding | Health checks, trace waterfall |

**USE Method** for rapid resource diagnosis:
- **U**tilization — what percent of time is the resource busy?
- **S**aturation — are requests queuing up waiting for the resource?
- **E**rrors — are there errors from the resource itself?

Apply to: CPUs, memory, disk I/O, network, connection pools.

#### Step 3.3 — Correlation Engine

Correlate the incident start time against these change sources — in priority order:

1. **Deploys** — any code deployment within 2 hours before incident start
2. **Config changes** — feature flags, environment variables, secrets rotated
3. **Infrastructure changes** — scaling events, instance type changes, network config
4. **Traffic patterns** — unusual spike, new client, bot traffic, marketing campaign
5. **Dependency changes** — upstream API version change, third-party maintenance window
6. **Time-based patterns** — did this happen at a consistent time? (cron, daily batch, market open)
7. **Data patterns** — did a specific user, tenant, or data shape trigger it?

Rule of thumb: **80% of incidents are caused by the most recent deploy or config change.** Start there.

```bash
# Quick correlation commands
git log --oneline --after="2 hours ago"          # recent commits
kubectl rollout history deployment/<service>      # K8s deploy history
aws cloudtrail lookup-events --start-time ...     # AWS config changes
```

#### Step 3.4 — Hypothesis Testing

Form hypotheses and test them against evidence. Never assume — confirm.

For each hypothesis, answer:
- What evidence supports it?
- What evidence would disprove it?
- Does it explain the exact timeline (onset, scope, resolution)?

A root cause is confirmed when:
1. It explains all the symptoms in the timeline
2. It explains why the mitigation (rollback/fix) resolved the incident
3. You can describe the exact mechanism in one sentence

State root cause as:
> *"The service OOMed because the new image processing feature loaded the full image into memory without chunking, causing 400MB+ allocations per request that exceeded pod memory limits under normal traffic."*

If you cannot state it in one sentence with a mechanism, you have a symptom description, not a root cause. Keep digging.

#### Step 3.5 — Reproduce in Staging (if possible)

For P1/P2 incidents where the root cause is a code or config issue:
- Reproduce the failure condition in staging or locally
- Confirm the reproduction matches the production symptoms
- Confirm the fix resolves it in staging before pushing to production

---

### Phase 4 — Post-Mortem and Prevention

**Goal:** Extract maximum learning. Prevent recurrence. Done within 48 hours of resolution.

Read `checklists/incident-checklist.md` for the complete post-mortem checklist.

Post-mortem document structure:
```
## Incident Post-Mortem: [Service] [Date]

**Severity:** P0 / P1 / P2
**Duration:** <start> → <end> (<total minutes>)
**Impact:** <# users affected, revenue impact, SLA breach Y/N>

### Timeline
[Full chronological timeline from Phase 3.1]

### Root Cause
[One-sentence mechanism statement]

### Why It Happened
[2-3 sentences: the underlying system condition that made this possible]

### Why We Didn't Catch It Earlier
[What monitoring, test, or process gap allowed this to reach production]

### Mitigation Applied
[What was done to stop the bleeding]

### Resolution
[What was done to fully fix it]

### Action Items
| Item | Owner | Due | Type |
|------|-------|-----|------|
| Add memory profiling to image processor | @engineer | <date> | Prevention |
| Add memory limit alert at 80% | @sre | <date> | Detection |
| Add load test for image endpoints | @qa | <date> | Testing |

### What Went Well
[Honest assessment — fast detection, good rollback, clear comms]

### What Went Poorly
[Honest assessment — no staging test, alert threshold too high, unclear runbook]
```

---

## Release Readiness

For "is this safe to deploy" questions, route to `release-readiness.md`.

The release readiness sub-skill handles:
- Pre-deploy checklist evaluation
- Risk scoring for the release
- Go/No-Go decision framework

---

## Output Contract

Every incident investigation must produce this report. Fill every field — write `N/A` only if genuinely not applicable.

```
## Incident Report

**Severity:**             [P0 / P1 / P2 / P3]
**Status:**               [Active / Resolved / Monitoring]
**Duration:**             [HH:MM from first symptom to resolution]
**Impact:**               [# users, % of traffic, SLA breach Y/N, estimated revenue impact]

**Timeline:**
  [T-Xh]: [event]
  [T+0]:  [incident start — first detectable symptom]
  [T+Xm]: [event]
  [T+Xm]: [resolution]

**Root Cause:**           [one sentence — mechanism, not symptom]
**Contributing Factors:** [bullet list — what conditions made this possible]
**Blast Radius:**         [services, features, user segments affected]

**Mitigation:**           [what stopped the bleeding and when]
**Resolution:**           [what fully fixed it]

**Detection Gap:**        [why the incident wasn't caught earlier]
**Prevention:**           [action items to prevent recurrence]

**Next Step:**            [one clear action, with owner]
```

---

## Approval Gates

Ask before taking any of these actions — once per action, not once per session:

| Action | Requires approval |
|--------|-----------------|
| Execute a rollback in production | Yes |
| Restart a production service | Yes |
| Change a production config or feature flag | Yes |
| Post to incident channel or page someone | Yes |
| Run any cloud CLI command that mutates state | Yes |
| Delete data or database rows | Yes |

---

## Anti-Patterns

Read `anti-patterns/common-mistakes.md` for the full list. The most critical:

- Never investigate before stabilizing — apply available mitigations first
- Never skip building the timeline — investigations without timelines produce wrong root causes
- Never declare root cause before it explains all symptoms and the resolution
- Never skip the post-mortem because the incident was "minor" — minor incidents carry the most preventable learnings
- Never roll back without confirming the rollback actually fixed the issue (verify metrics drop)

---

## Heuristics

Read `heuristics/reliability-heuristics.md` for the full set of production diagnostic heuristics.

Quick reference:
- **Correlates with deploy** → deployment is the prime suspect
- **Gradual degradation over hours** → resource leak (memory, connections, disk)
- **Sudden spike at consistent interval** → cron job or batch process
- **Subset of traffic affected** → feature flag, canary, or data-pattern issue
- **Single region only** → regional config or network issue
- **Recent change window** → 80% of incidents are caused by the last deploy or config change
