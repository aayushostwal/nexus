---
name: nexus-release-readiness
description: >
  Use this sub-skill when evaluating whether a release is safe to deploy to production.
  Trigger phrases: "is this safe to deploy", "pre-deployment checklist", "release gate",
  "deploy confidence", "should we roll back", "go/no-go for release", "release risk assessment",
  "is this change safe", "what's the blast radius of this deploy", "review this PR for deployment risk".
  Loaded automatically by skills/reliability/SKILL.md when release readiness intent is detected.
  When in doubt, use this skill.
---

# Release Readiness Evaluator

Structured pre-deployment risk assessment producing a Go / No-Go decision with confidence score.

---

## Compatibility
- Parent skill: `skills/reliability/SKILL.md`
- Required tools: Read, Bash, Grep
- Hands off to: `nexus:planning` for rollback plan creation if not already defined

---

## Core Principle

**Every release is a risk event. The goal is not to eliminate risk — it is to make the risk visible and ensure the team is prepared to respond.**

A No-Go is not a failure. A release that goes out without a rollback plan and brings down production is.

---

## Workflow

### Step 1 — Change Inventory

Build a complete picture of what is being deployed. Never evaluate readiness without knowing what changed.

```bash
git log --oneline <base-branch>...HEAD          # all commits in this release
git diff --stat <base-branch>...HEAD             # files changed, lines added/removed
git diff <base-branch>...HEAD                    # full diff
```

Categorize changes by type:

| Category | Examples | Base risk |
|----------|----------|-----------|
| **Database schema** | Migration adds/removes column, index change | High |
| **API contract** | Endpoint removed/renamed, response shape changed | High |
| **Auth/Security** | Token validation, permission change, new secret required | High |
| **Data pipeline** | ETL logic, aggregation change, backfill required | High |
| **Config/Env** | New required env var, feature flag change | Medium |
| **Service dependency** | New external API call, new internal service dependency | Medium |
| **Business logic** | Core calculation or workflow change | Medium |
| **New feature** | Additive feature behind feature flag | Low |
| **Bug fix** | Targeted fix for known issue | Low |
| **Refactor** | Internal restructure, no behavior change | Low |
| **Docs/Tests only** | No production code changed | Minimal |

### Step 2 — Risk Scoring

Score the release on each dimension. Sum the scores to get total release risk.

#### Change Risk Score

| Dimension | Score |
|-----------|-------|
| Contains database schema migration | +3 |
| Contains API breaking change | +3 |
| Contains auth or security change | +3 |
| Contains new required environment variable | +2 |
| Changes a high-traffic code path (>10% of requests) | +2 |
| Changes shared infrastructure or shared libraries | +2 |
| Has no feature flag (cannot be toggled off) | +2 |
| >500 lines changed | +1 |
| Touches >5 services or modules | +1 |
| Contains third-party dependency upgrades | +1 |

#### Readiness Deductions (subtract from risk score)

| Readiness factor | Score |
|-----------------|-------|
| Has a tested rollback path (verified in staging) | -2 |
| Was load tested at expected production traffic | -2 |
| Has been running in staging/canary for >24h | -2 |
| Has comprehensive test coverage for changed paths | -1 |
| Monitored by a specific alert for this change | -1 |
| Has been deployed to a subset (canary/blue-green) | -1 |

#### Risk Level

| Total Score | Risk Level | Recommendation |
|-------------|-----------|---------------|
| ≤ 0 | Minimal | Auto-deploy |
| 1–3 | Low | Deploy with standard monitoring |
| 4–6 | Medium | Deploy with enhanced monitoring; on-call heads up |
| 7–9 | High | Deploy with war room; staged rollout required |
| ≥ 10 | Critical | Block deploy until mitigations reduce score below 7 |

### Step 3 — Pre-Deploy Checklist Evaluation

Evaluate each item as Pass / Fail / N/A. A single Fail on a starred item is a No-Go.

**Testing**
- [ ] * All existing tests pass in CI
- [ ] * New tests added for changed behavior
- [ ] * Regression test for the bug being fixed (if this is a bug fix)
- [ ] Load test run if this change affects a high-traffic path
- [ ] Contract tests pass if this changes an API used by other services

**Database**
- [ ] * Migration is reversible (down migration written and tested)
- [ ] * Migration has been tested on a staging DB with production-scale data volume
- [ ] * No destructive migration (DROP COLUMN, DELETE) without explicit sign-off
- [ ] Migration does not lock a high-traffic table during deploy window
- [ ] Backfill plan exists if migration requires data transformation

**Rollback**
- [ ] * Rollback procedure is documented and tested
- [ ] * Rollback time is known and acceptable (< 5 minutes for P0 scenarios)
- [ ] * Previous version is still deployable (no database incompatibility with old code)
- [ ] Feature flag exists to disable the change without a redeploy (where applicable)

**Observability**
- [ ] * Metrics exist for the changed code paths
- [ ] * Alerts are configured for the expected failure modes
- [ ] Dashboards updated to include new service or endpoint
- [ ] Log sampling rate is adequate for the change

**Operations**
- [ ] * On-call engineer is aware of the release
- [ ] * Runbook exists or has been updated for the new failure modes
- [ ] Deploy is scheduled outside peak traffic hours (if Medium or above risk)
- [ ] Stakeholders have been notified of expected behavior changes

**Security**
- [ ] New environment variables or secrets are provisioned in all environments
- [ ] No hardcoded credentials, tokens, or PII in the diff
- [ ] Auth changes have been reviewed by a second engineer

### Step 4 — Blast Radius Assessment

Define what breaks and who is affected if this deploy fails:

```
Blast Radius Assessment
-----------------------
Services affected if this deploy fails:     [list all downstream consumers]
User segments affected:                     [all users / paying users / specific feature users]
Data at risk:                               [none / reads / writes / potential corruption]
Revenue impact per minute of outage:        [estimate or "unknown"]
Time to detect failure:                     [based on alert thresholds — how long until we know?]
Time to mitigate (rollback):                [known / estimated / unknown]
```

### Step 5 — Go / No-Go Decision

State one of three decisions:

**GO** — All starred checklist items pass AND risk score < 7.
```
Decision: GO
Confidence: [High / Medium / Low]
Deploy window: [recommended time]
On-call: [who is on-call and aware]
Monitoring: [specific metrics/dashboards to watch for first 30 minutes]
Rollback trigger: if [specific signal] → [exact rollback command or procedure]
```

**GO WITH CONDITIONS** — All starred items pass AND risk score 7–9 AND specific mitigations are in place.
```
Decision: GO WITH CONDITIONS
Conditions that must be met before deploy:
  - [ ] [condition 1]
  - [ ] [condition 2]
Confidence: Medium
Deploy window: [off-peak recommended]
Staged rollout: [canary % → full %]
Rollback trigger: if [specific signal] → [exact rollback command]
```

**NO-GO** — Any starred checklist item fails OR risk score ≥ 10 OR rollback path unknown.
```
Decision: NO-GO
Blockers:
  - [specific starred item that failed]
  - [specific risk factor driving score above threshold]
Required before re-evaluation:
  - [ ] [action 1 — owner — due date]
  - [ ] [action 2 — owner — due date]
```

---

## Output Contract

```
## Release Readiness Assessment

**Release:**              [branch name / PR / version tag]
**Assessed by:**          [engineer]
**Assessment date:**      [date and time]

**Change Summary:**
  [3-5 bullet points covering what this release changes, not how]

**Risk Score:**           [total] ([breakdown: +X schema, +X api, -X rollback, etc.])
**Risk Level:**           [Minimal / Low / Medium / High / Critical]

**Checklist:**
  Testing:     [Pass / Fail / N/A with notes on any failures]
  Database:    [Pass / Fail / N/A with notes]
  Rollback:    [Pass / Fail / N/A with notes]
  Observability: [Pass / Fail / N/A with notes]
  Operations:  [Pass / Fail / N/A with notes]
  Security:    [Pass / Fail / N/A with notes]

**Blast Radius:**         [one sentence — who is affected and how badly if this deploy fails]

**Decision:**             [GO / GO WITH CONDITIONS / NO-GO]
**Confidence:**           [High / Medium / Low]
**Rollback Trigger:**     [specific metric threshold or error signal → exact remediation]
**Deploy Window:**        [recommended time and why]
**Owner:**                [who is responsible for monitoring post-deploy]
```

---

## Anti-Patterns

- Never issue a GO when the rollback procedure has not been tested
- Never skip the risk score because the change "looks small" — perception is not evidence
- Never deploy a database migration without a verified down migration
- Never approve a GO WITH CONDITIONS without a mechanism to verify the conditions are met
- Never assess readiness without reading the actual diff — summaries miss the details that cause incidents
- Never schedule a High or Critical risk deploy during peak traffic hours

---

## Heuristics for Quick Assessment

- **Single-file change + unit tests + no schema change** → usually Low, can auto-approve
- **Schema migration + no reversible down migration** → immediate No-Go, no exceptions
- **"It's just a config change"** → config changes cause a disproportionate share of P0 incidents; treat as Medium minimum
- **"We'll just roll back if something goes wrong"** → if rollback time is unknown, it's a blocker
- **"We tested this in staging"** → check staging data volume; staging with 1000 rows does not test production with 10M rows
- **Feature flag present** → reduces blast radius significantly; allows score deduction and faster mitigation if issues arise
