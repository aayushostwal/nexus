# Skill Examples: GOOD vs BAD

This file provides concrete before/after comparisons and a full worked example of a well-structured
skill. Use these as ground truth when evaluating skill quality.

---

## Example 1 — BAD Skill vs GOOD Skill (same topic: Production Incident Response)

### BAD SKILL — "Prompt Wrapper" Anti-Pattern

```yaml
---
name: incident-response
description: Use when there is an incident.
---
```

```markdown
# Incident Response

When there is an incident, help the user respond to it effectively.

## Steps
1. Understand the incident.
2. Gather relevant information.
3. Suggest appropriate remediation steps.
4. Help communicate to stakeholders appropriately.

## Output
A helpful response about the incident.
```

**Why this BAD skill fails:**

| Failure Point | Problem |
|---------------|---------|
| Description | "Use when there is an incident" — this is a single vague sentence. It will trigger inconsistently and compete with every other skills's description. |
| Step 1 | "Understand the incident" — this is not a step. What does the model read? What does it extract? |
| Step 2 | "Gather relevant information" — what information? From where? In what format? |
| Step 3 | "Suggest appropriate remediation" — "appropriate" is a hallucination invitation. |
| Step 4 | "Communicate appropriately" — to whom? In what format? With what structure? |
| Output | "A helpful response" — this is not an output contract. It is meaningless. |
| Missing | No context acquisition. No failure modes. No output structure. No anti-patterns. No examples. |

This skill is a prompt wrapper. It tells Claude to do the obvious thing without encoding any
engineering expertise. A model without this skill would do roughly the same thing.

---

### GOOD SKILL — Engineering System (same topic)

```yaml
---
name: nexus-incident-response
description: >
  Use this skill when a production system is degraded, down, or behaving unexpectedly and the user
  needs structured incident response guidance. Trigger phrases include: "we have an incident",
  "production is down", "service is degraded", "error rate spiked", "on-call alert fired",
  "p0 incident", "site is slow", "customers are impacted", "I got paged". Also trigger when the
  user pastes an error log, alert body, or Slack thread describing a production failure and asks
  what to do. When in doubt, use this skill.
---
```

```markdown
# Production Incident Response

Structured incident response guidance: detect, scope, mitigate, communicate, and resolve production
failures in the correct order, without skipping steps under pressure.

---

## Metadata

| Field | Value |
|-------|-------|
| Category | reliability |
| Required Tools | Bash, WebSearch (for runbook lookup), MCP tools if configured |
| Required Context | Alert body or symptom description, service name, environment (prod/staging) |
| Expected Inputs | Error message, alert, log snippet, or plain-language symptom description |
| Expected Outputs | Structured triage report with severity, blast radius, mitigation steps, comms draft |

---

## Skill Philosophy

- **Problem**: Under pressure, engineers skip steps, mis-scope blast radius, and escalate too slowly
  or too fast. This skill enforces discipline when adrenaline removes it.
- **Why it matters**: Every minute of unmitigated P0 costs revenue and user trust. Skipping blast
  radius assessment causes incomplete mitigation. Skipping comms causes stakeholder panic.
- **Engineering principles**:
  1. Mitigate before you understand — slow the bleeding before root-causing.
  2. Blast radius first — know who is affected before deciding severity.
  3. Communicate early and often — silence is worse than uncertainty.

---

## Context Acquisition

Before executing, collect:

1. **Symptom description**: Read the alert body, log lines, or user description.
   → Tells you: what is broken, surface vs deep failure.
2. **Service name and dependency map**: Ask if not provided.
   → Tells you: blast radius, which upstream/downstream services are at risk.
3. **Time of onset**: Extract from logs or ask the user.
   → Tells you: whether a recent deployment caused this, correlate with deploy timeline.
4. **Current mitigation state**: Has anyone already acted? What has been tried?
   → Prevents duplicate actions and rollback conflicts.

**Insufficient context detection**: If you do not know the service name and cannot infer it,
stop and ask before scoping blast radius. Do not assume.

---

## Execution Workflow

### Step 1 — Severity Triage (< 2 minutes)

- **What to do**: Classify severity using the matrix below.
- **How to do it**: Apply the matrix to the symptom description and user impact signal.
- **Output**: Severity level (P0/P1/P2/P3) with the specific condition that determined it.
- **Failure signal**: If you cannot classify severity, it means you lack blast radius info — go to
  Context Acquisition and ask for service + dependency map.

| Severity | Condition | Response SLA |
|----------|-----------|-------------|
| P0 | Revenue-impacting, >10% users affected, or data loss | Immediate |
| P1 | Significant degradation, <10% users, no data loss | 15 min |
| P2 | Minor degradation or single-user impact | 1 hour |
| P3 | Cosmetic issue, workaround available | Next sprint |

### Step 2 — Blast Radius Assessment

- **What to do**: List every system, team, and user cohort affected or at risk.
- **How to do it**: Trace the service dependency map from the affected service outward.
- **Output**: A bulleted list: `[Affected] service-name — impact description` for each affected system.
- **Failure signal**: If the dependency map is unknown, flag this explicitly and estimate based on
  the service's known function. Mark estimates with `[ESTIMATED]`.

### Step 3 — Immediate Mitigation

- **What to do**: Identify the fastest available mitigation that reduces user impact.
- **How to do it**: Check in order — (1) feature flag off, (2) rollback last deploy, (3) scale up,
  (4) redirect traffic, (5) take service offline.
- **Output**: The specific mitigation command or action, not a general suggestion.
- **Failure signal**: If no mitigation is available, escalate to Step 5 (comms) immediately — do
  not spend time on mitigation research when users are actively impacted.

### Step 4 — Root Cause Investigation

- **What to do**: After mitigation is applied, identify root cause.
- **How to do it**: Correlate onset time with: recent deploys, config changes, traffic spikes,
  dependency failures, certificate expirations.
- **Output**: A ranked hypothesis list: `[Hypothesis] description — supporting evidence — confidence`.
- **Failure signal**: If the top hypothesis has no supporting evidence, it is speculation — label
  it `[UNCONFIRMED]` and continue investigation before acting on it.

### Step 5 — Stakeholder Communication

- **What to do**: Draft the incident communication appropriate to the severity and current state.
- **How to do it**: Use the template in the Output Contract. Fill in all fields.
- **Output**: A ready-to-send message. Never deliver a draft with empty fields.
- **Failure signal**: If you do not know ETA for resolution, write "ETA unknown — next update in
  15 minutes" — never omit the ETA field.

---

## Engineering Heuristics

- **Rule**: If onset correlates within 10 minutes of a deploy, treat the deploy as cause until
  disproved. Rollback is always faster than debugging in production.
- **Rule**: If blast radius is unknown and severity appears P1 or higher, default to P0 until
  blast radius is confirmed. It is better to over-escalate than under-escalate.
- **Rule**: If the same alert has fired more than 3 times in 30 days, the mitigation is not a fix —
  it is a recurring band-aid. Flag this and recommend a permanent fix as a P2 ticket.
- **Rule**: Never recommend "restart the service" as a root cause fix. Restart to mitigate, then
  find why the service needed restarting.

---

## Failure Modes

| Failure Mode | Trigger Condition | Mitigation |
|-------------|------------------|------------|
| Wrong severity | Incomplete blast radius info | Always assess blast radius before classifying |
| Duplicate mitigation actions | Multiple on-call engineers acting without coordination | Ask "what has already been tried?" before recommending action |
| Hallucinated dependency | Service dependency map not provided | Mark all inferred dependencies as [ESTIMATED] |
| Missing comms | Engineer focused on fix, forgot communication | Step 5 is mandatory regardless of severity |

---

## Output Contract

Every incident response output must include:

| Field | Required | Description |
|-------|----------|-------------|
| severity | Yes | P0/P1/P2/P3 with the condition that determined it |
| blast_radius | Yes | Bulleted list of affected systems and user cohorts |
| current_status | Yes | Mitigated / Active / Investigating |
| mitigation_applied | Yes | What was done, or "None yet" |
| root_cause_hypothesis | Yes | Ranked list with evidence and confidence |
| next_actions | Yes | Ordered list of specific immediate steps |
| comms_draft | Yes for P0/P1 | Ready-to-send stakeholder message |

---

## Anti-Patterns

- **Never** recommend mitigation before assessing blast radius — you may mitigate the wrong thing.
- **Never** label a hypothesis as root cause without supporting evidence — mark it [UNCONFIRMED].
- **Never** skip Step 5 (comms) because "it's almost fixed" — stakeholders cannot read your mind.
```

**Why this GOOD skill works:**

| Quality Point | How it's satisfied |
|---------------|-------------------|
| 9 trigger phrases in description | Specific user phrases + log/alert patterns |
| Context Acquisition section | 4 named signals with collection method and what each tells you |
| Every step is actionable | Specific verbs: classify, trace, list, correlate, draft |
| Engineering heuristics are decision rules | IF/THEN/BECAUSE format with thresholds |
| Failure modes documented | 4 failure modes with mitigation |
| Output contract defined | 7 fields, all required, typed |
| Anti-patterns specified | 3 "Never X → do Y instead" rules |

---

## Example 2 — Complete Well-Structured Skill: Production Deployment Skill (Abbreviated)

This shows the full directory structure for a well-built skill.

```
nexus-deploy/
├── SKILL.md                             ← entry point, workflow, output contract
├── examples/
│   └── production-scenarios.md          ← 3 scenarios: canary, blue-green, rollback
├── checklists/
│   └── execution-checklist.md           ← pre-deploy, deploy, post-deploy checklists
├── heuristics/
│   └── engineering-heuristics.md        ← when to rollback vs fix-forward, etc.
├── anti-patterns/
│   └── common-mistakes.md               ← 10 deployment anti-patterns
└── validation/
    └── output-validation.md             ← how to verify the deploy guidance is correct
```

**SKILL.md description (abbreviated):**
```yaml
description: >
  Use this skill when planning, executing, or reviewing a production deployment. Trigger phrases
  include: "deploy to production", "push this release", "how do I release this", "canary deploy",
  "blue-green deployment", "rollback a deploy", "deployment checklist", "release process",
  "how to ship this safely", "what do I do before deploying". Also trigger when the user pastes
  a deploy script, Dockerfile, or CI/CD pipeline and asks if it is production-ready.
  When in doubt, use this skill.
```

**examples/production-scenarios.md (scenario 1 excerpt):**
```markdown
## Example 1 — Canary Deployment for a High-Traffic API Service

### Context
Service: payment-service, 50k RPS, 5 replicas, no feature flags, last incident was 3 weeks ago
during a deploy. User asks: "How do I safely deploy the new rate-limiting logic?"

### Skill Execution

Step 1 (Severity/Risk Triage): Payment service = revenue-critical. Any error rate increase > 0.1%
is P1. Rate-limiting changes affect all requests. Risk: HIGH. Canary is required.

Step 2 (Blast Radius): 100% of API traffic routes through payment-service. Downstream: billing,
fraud-detection, webhook-delivery. This is a full-stack impact if broken.

Step 3 (Deployment Plan):
- Deploy to 1/5 replicas (20% canary)
- Monitor error rate for 15 minutes: if error rate increases by >0.05%, rollback
- Monitor p99 latency: if p99 increases by >50ms, rollback
- If both pass 15-minute window, deploy to remaining 4 replicas with 5-minute gap between each

### Output
{structured deployment plan with rollback criteria, monitoring thresholds, specific commands}

### Why this example matters
Shows that the skill correctly identifies revenue-criticality as a canary trigger, not just
traffic volume. A junior engineer might deploy to 1 replica and call it a canary — the skill
specifies the 15-minute validation window and concrete rollback thresholds.
```

**heuristics/engineering-heuristics.md (excerpt):**
```markdown
## Heuristic: Rollback vs Fix-Forward

**Rule**: If the failure was introduced by the current deploy AND a clean rollback path exists
(no database migrations, no breaking API changes), ROLLBACK. Do not debug in production.

**Rule**: If a database migration ran as part of the deploy, fix-forward. Rolling back will leave
the schema in an inconsistent state. Engage DBA before acting.

**Rule**: If the deploy is > 4 hours old and no incident has been declared, the deploy is not the
cause. Investigate elsewhere.
```
