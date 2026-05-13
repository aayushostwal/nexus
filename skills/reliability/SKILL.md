---
name: nexus-reliability
description: >
  Use for production incidents, outages, and service degradations, plus release-readiness gate checks.
  Trigger on 500 spikes, SLA breaches, latency/error surges, on-call alerts, rollback decisions,
  and RCA/post-mortem requests. Prioritize stabilization, timeline reconstruction, and evidence-led actions.
  When in doubt, use this skill.
---

# Nexus Production Incident Investigator

Time-boxed, evidence-driven workflow for investigating production incidents and evaluating release readiness.

---

## Compatibility
- Sub-skills: `release-readiness.md` | Materials: `checklists/incident-checklist.md`, `anti-patterns/common-mistakes.md`, `validation/output-validation.md`
- Required: Read, Bash, Grep | Optional: WebSearch | Hands off to: `nexus:debugging` (code RCA), `nexus:planning` (post-mortem actions)

---

## Core Principle

**Stabilize first. Investigate second. Never skip the timeline.**

---

## Incident Classification

| Severity | Definition | Response target |
|----------|-----------|-----------------|
| **P0** | Complete outage or data loss affecting all/most users | Immediate; page all on-call |
| **P1** | Major feature broken or >25% requests failing | < 5 min acknowledgement; page on-call lead |
| **P2** | Degraded performance or partial failure | < 15 min acknowledgement; one engineer |
| **P3** | Minor anomaly, no user impact | Next business hour |

If you cannot classify immediately, default to P1 and downgrade after Phase 1.

---

## Investigation Workflow

### Phase 1 — Triage (0–5 min)

1. **Confirm the signal** — cross-check alert against at least one independent source (logs, dashboard, manual repro). Never declare from a single data point.
2. **Classify severity** using the table above.
3. **Identify blast radius** — which services, user segments, and whether data integrity is at risk.
4. **Open incident channel** and post: `[P0/P1/P2] <service> — <symptom> — investigating`
5. **Assign roles** (P0/P1): Incident Commander (comms only), Tech Lead (investigation), Scribe (timeline).

---

### Phase 2 — Stabilize (5–15 min)

**Apply mitigations before investigating.** Stop at first "yes":

| Question | Action |
|----------|--------|
| Deploy in last 2 hours? | Roll back; confirm error rate drops |
| Config/feature-flag change? | Revert; confirm error rate drops |
| One bad instance/pod? | Remove from LB, restart |
| Downstream dependency down? | Enable fallback/circuit breaker |
| DB connection pool exhausted? | Restart pooler, reduce pool size |
| Traffic spike causing saturation? | Rate limit, add capacity, shed load |

After mitigation, post: `[Update] Mitigation: <what>. Error rate: <before> → <after>. Investigating root cause.`

---

### Phase 3 — Root Cause (15–60 min)

#### 3.1 — Build the Timeline

Start here. Every other step depends on this. Format: `T-Xh: [event]` through `T+Xm: [resolution]`. Sources: deployment history, config audit logs, monitoring dashboards, application logs, infrastructure events (CloudTrail, K8s events).

#### 3.2 — Signal Analysis

Check in priority order:

| Metric | What it tells you |
|--------|-------------------|
| Error rate (5xx/4xx) | Which endpoints are failing |
| Latency p99 | Slowness vs. failure distinction |
| Saturation (CPU, memory, connections) | Resource exhaustion |
| Traffic volume (RPS) | Spike-driven vs. change-driven |
| Queue depth / backlog | Upstream pressure |
| Database metrics | Connection count, lock waits, slow queries |
| Dependency health | Which downstreams are responding |

**USE Method:** Utilization → Saturation → Errors. Apply to CPUs, memory, disk I/O, network, connection pools.

#### 3.3 — Correlation (priority order)

1. Deploys (within 2h) 2. Config/flag changes 3. Infrastructure changes 4. Traffic spikes 5. Dependency changes 6. Time-based patterns (cron/batch) 7. Data patterns (user/tenant/shape)

**Rule: 80% of incidents are caused by the most recent deploy or config change.**

```bash
git log --oneline --after="2 hours ago"
kubectl rollout history deployment/<service>
aws cloudtrail lookup-events --start-time ...
```

#### 3.4 — Hypothesis Testing

For each hypothesis: what evidence supports it, what would disprove it, does it explain the full timeline? Root cause is confirmed when: (1) it explains all symptoms, (2) it explains why the mitigation worked, (3) you can state it in one sentence with a mechanism. If you cannot — you have a symptom, not a root cause.

#### 3.5 — Reproduce in Staging (P1/P2)

Reproduce in staging, confirm symptoms match production, confirm fix resolves it before pushing.

---

### Phase 4 — Post-Mortem (within 48h of resolution)

See `checklists/incident-checklist.md` for the full checklist. Required sections: Timeline, Root Cause (one sentence), Why It Happened, Why We Didn't Catch It Earlier, Mitigation/Resolution, Action Items (owner + due date + type), What Went Well, What Went Poorly.

---

## Release Readiness

Route "is this safe to deploy" questions to `release-readiness.md` (pre-deploy checklist, risk scoring, Go/No-Go).

---

## Output Contract

Every investigation must produce this report:

```
## Incident Report

Severity:             [P0/P1/P2/P3]
Status:               [Active / Resolved / Monitoring]
Duration:             [HH:MM from first symptom to resolution]
Impact:               [# users, % traffic, SLA breach Y/N, revenue impact]

Timeline:
  [T-Xh]: [event]
  [T+0]:  [incident start]
  [T+Xm]: [resolution]

Root Cause:           [one sentence — mechanism, not symptom]
Contributing Factors: [bullet list]
Blast Radius:         [services, features, user segments]

Mitigation:           [what stopped the bleeding and when]
Resolution:           [what fully fixed it]

Detection Gap:        [why not caught earlier]
Prevention:           [action items to prevent recurrence]

Next Step:            [one clear action, with owner]
```

---

## Approval Gates

Ask before taking any of these actions — once per action:

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

See `anti-patterns/common-mistakes.md` for the full list. Critical rules:

- Never investigate before stabilizing — apply available mitigations first.
- Never skip building the timeline — investigations without timelines produce wrong root causes.
- Never declare root cause before it explains all symptoms and the resolution.
- Never skip the post-mortem for "minor" incidents — they carry the most preventable learnings.
- Never roll back without confirming the rollback actually fixed the issue (verify metrics drop).

---

## Heuristics Quick Reference

- **Correlates with deploy** → deployment is prime suspect
- **Gradual degradation over hours** → resource leak (memory, connections, disk)
- **Sudden spike at consistent interval** → cron job or batch process
- **Subset of traffic affected** → feature flag, canary, or data-pattern issue
- **Single region only** → regional config or network issue
- **Recent change window** → 80% of incidents caused by last deploy or config change
