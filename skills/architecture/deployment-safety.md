---
name: nexus-deployment-safety
description: >
  Use this sub-skill for pre-deployment validation before pushing or merging code to production.
  Trigger phrases include: "is this deployment safe", "what breaks if I deploy this", "pre-deployment
  check", "deployment safety check", "review this PR for deployment risk", "is this migration safe",
  "can I deploy this without downtime", "will this break existing clients", "check for backwards
  incompatible changes", "what is my rollback plan", "is this schema change reversible".
  Expected output: Go / No-Go verdict with specific conditions, risk classification, affected
  surface area, and rollback instructions. When in doubt, use this skill.
---

# Deployment Safety Validator

Classify risk, identify rollback paths, and produce a Go/No-Go verdict before any production deploy.

---

## Compatibility
- Loaded by: `skills/architecture/SKILL.md` when deployment safety track is selected
- Required tools: Read, Grep, Glob, Bash
- Output: Go/No-Go verdict with risk classification, affected surface, and rollback instructions

---

## Core Principle

**A deployment is safe only when you have a tested rollback path and know which users/endpoints are affected.**

Do not issue a "Go" verdict without completing all five steps. A partial check is worse than no check
because it creates false confidence.

---

## Workflow

### Step 1 — Capture What Changed

Run these commands to establish the complete change surface:

```bash
# All files changed in this branch vs base
git diff main...HEAD --name-only

# Full diff of changed files
git diff main...HEAD

# Migration files specifically
find . -name "*.sql" -newer $(git merge-base HEAD main --) 2>/dev/null
find . -path "*/migrations/*.py" -newer $(git merge-base HEAD main --) 2>/dev/null
find . -path "*/db/migrate/*.rb" -newer $(git merge-base HEAD main --) 2>/dev/null

# Dependency changes
git diff main...HEAD -- requirements.txt package.json go.mod Cargo.toml pyproject.toml

# Config / environment changes
git diff main...HEAD -- .env.example config/ settings/ *.yaml *.yml *.toml
```

Produce a change inventory:

```
Change Inventory:
  Application code: [N files changed] — [areas affected: e.g., billing routes, user model]
  Migrations:       [N migration files] — [names/descriptions]
  Config changes:   [yes/no] — [what changed]
  Dependency bumps: [packages and version ranges]
  API changes:      [endpoint additions/removals/modifications]
```

### Step 2 — Classify Risk

Score each changed area against the risk taxonomy below. Assign the highest applicable tier.

#### Risk Tier Table

| Tier | Risk Level | Examples | Default Verdict |
|------|-----------|----------|----------------|
| T1 | Critical | Non-reversible schema migration (DROP COLUMN, DROP TABLE, removing NOT NULL), removing a public API endpoint entirely | No-Go unless explicit rollback plan verified |
| T2 | High | Additive migration with NOT NULL + no default, changing response shape of a public endpoint, removing a required request field, major dependency version bump (e.g., Django 3→4) | Conditional Go — requires feature flag or dual-write |
| T3 | Medium | Backwards-compatible API addition, new column with default value, adding a non-required field, config change with env-var fallback | Go with monitoring for 30 min post-deploy |
| T4 | Low | Internal refactor with no public API change, test additions, documentation, adding an optional query param | Go |
| T5 | None | Comment changes, whitespace, log message text | Go |

For each changed area, record:
```
Risk Classification:
  [area]: Tier [N] — [one-sentence reason]
  [area]: Tier [N] — [one-sentence reason]
  Overall tier: [highest tier found]
```

### Step 3 — Rollback Assessment

For each Tier 1 or Tier 2 change, answer:

| Question | Must answer |
|----------|-------------|
| Can the migration be reversed with a rollback script? | Write the exact SQL or command |
| Can the old code run against the new schema? | Yes/No — if No, this is a T1 |
| Can the new code run against the old schema? | Yes/No — required for blue-green deploys |
| Is there a feature flag that disables the change at runtime? | Yes/No — if no T2, request one |
| What is the rollback window? | Time before data migration or irreversible side-effects |

Write the rollback plan:
```
Rollback Plan:
  Step 1: [exact command to revert application code — e.g., `git revert <sha>` or `kubectl rollout undo`]
  Step 2: [exact SQL or migration command to reverse schema change — or "not required"]
  Step 3: [cache invalidation or config reset if needed]
  Rollback window: [time before rollback becomes impossible — e.g., "30 min before data migration fills column"]
  Rollback test: [how to verify rollback succeeded — e.g., "GET /api/health returns 200 with old schema"]
```

If no rollback plan can be written: the change is a No-Go until one is established.

### Step 4 — Traffic Impact Assessment

Identify which users and endpoints are affected:

#### API Surface Analysis
```bash
# Find all route definitions touched by the diff
git diff main...HEAD -- . | grep -E "^\+" | grep -E "@app\.(get|post|put|delete|patch)|router\.(get|post|put|delete|patch)|path\(|url\("
```

For each changed endpoint, classify impact:

| Endpoint | Change Type | Clients Affected | Backwards Compatible? |
|----------|------------|-----------------|----------------------|
| `POST /api/users` | Added `required_field` to request body | All API consumers | No — T2 |
| `GET /api/orders` | Added optional `status` query param | None (additive) | Yes — T4 |
| `GET /api/billing/invoice` | Removed `legacy_id` from response | Any client reading this field | No — T1 |

#### Database Impact Analysis
For each migration, assess:
- **Additive** (new table, new nullable column, new index): safe to deploy while old code runs
- **Destructive** (DROP, column rename, type change, add NOT NULL without default): requires coordinated deploy or dual-write period
- **Data migration** (backfill, transform existing rows): assess lock duration and table size

```bash
# Estimate table size for lock duration assessment
# (PostgreSQL)
SELECT relname, pg_size_pretty(pg_total_relation_size(oid))
FROM pg_class WHERE relname IN ('affected_table');
```

#### Affected User Groups
```
Traffic Impact:
  Endpoints affected: [list]
  User groups affected: [all users / authenticated users / admin only / internal only]
  Peak traffic window to avoid: [e.g., "9am-6pm PST weekdays — 80% of traffic"]
  Recommended deploy window: [e.g., "Saturdays 2-4am PST — lowest traffic"]
```

### Step 5 — Output: Go / No-Go Verdict

```
## Deployment Safety Report

**Verdict: [GO | CONDITIONAL GO | NO-GO]**

**Overall Risk Tier:** [T1 / T2 / T3 / T4 / T5]

### Change Summary
[Change inventory from Step 1]

### Risk Classification
| Change | Tier | Reason |
|--------|------|--------|
| [area] | T[N] | [reason] |

### Critical Issues (No-Go blockers — must resolve before deploy)
- [issue 1 — specific, not vague]
- [issue 2]
(Write "None" if Verdict is GO)

### Conditions for Go (required for CONDITIONAL GO)
- [ ] [specific condition — e.g., "Feature flag BILLING_V2 must be off at deploy time"]
- [ ] [specific condition — e.g., "Run migration with --lock-timeout 5s to prevent table lock"]
(Write "None" if Verdict is GO)

### Traffic Impact
[Impact table from Step 4]

### Rollback Plan
[Plan from Step 3]

### Recommended Deploy Window
[Timing recommendation from Step 4]

### Monitoring Checklist (first 30 min post-deploy)
- [ ] Error rate on affected endpoints < baseline + 0.5%
- [ ] p99 latency on affected endpoints within 20% of baseline
- [ ] No spike in 5xx responses in application logs
- [ ] Database query times on migrated tables within 10% of baseline
- [ ] [any change-specific metric to watch]
```

---

## Risk Pattern Reference

### Schema Migration Patterns

| Migration Type | Risk | Safe Approach |
|----------------|------|---------------|
| Add nullable column | T4 | Deploy freely |
| Add column with default | T3 | Deploy; old code ignores new column |
| Add NOT NULL without default | T2 | Add with default first, then add NOT NULL constraint separately |
| Rename column | T1 | Add new column, dual-write, backfill, remove old — never rename directly |
| DROP COLUMN | T1 | Remove all code references first, deploy, then drop in a separate migration |
| DROP TABLE | T1 | Remove all references, deploy code, wait 30 days, then drop |
| Change column type | T2-T1 | Depends on type — widening (int→bigint) is safe; narrowing is not |
| Add index (non-concurrent) | T2 | Locks table — use `CREATE INDEX CONCURRENTLY` (PostgreSQL) or equivalent |
| Add foreign key | T2 | Locks both tables — use `NOT VALID` then `VALIDATE CONSTRAINT` separately |

### API Change Patterns

| Change Type | Risk | Notes |
|-------------|------|-------|
| Add optional request field | T4 | Old clients ignore it |
| Add required request field | T1-T2 | Old clients break — use default or versioning |
| Add optional response field | T4 | Old clients ignore unknown fields (if API is JSON) |
| Remove response field | T2-T1 | Any client reading this field breaks |
| Remove endpoint | T1 | Must keep endpoint active until all clients are migrated |
| Change field type (e.g., string → int) | T1 | Always breaking |
| Rename field | T1 | Old clients break — use aliases during migration period |

### Dependency Bump Patterns

| Bump Type | Risk | What to check |
|-----------|------|---------------|
| Patch version (1.2.3 → 1.2.4) | T4 | Read CHANGELOG for any mentioned breaking fixes |
| Minor version (1.2.x → 1.3.0) | T3 | Check for deprecated API usage |
| Major version (1.x → 2.0) | T2 | Read full migration guide; check for removed APIs |
| Security patch (any version) | T3 | Deploy quickly but verify tests pass first |

---

## Anti-Patterns

- Never issue a Go verdict for a T1 change without a written rollback plan
- Never assume a DROP COLUMN migration is safe because "nobody uses that field" — verify with grep
- Never deploy a NOT NULL column addition without a default value or a simultaneous backfill
- Never skip the traffic impact step for API changes — internal callers are easy to miss
- Never deploy during peak traffic windows unless the change is T4/T5
- Never classify a change as lower risk to speed up a deploy — the tier is based on facts, not urgency

---

## Examples

### Example 1: Safe Migration (Go)

**Change:** Added `preferred_language VARCHAR(10) DEFAULT 'en'` to `users` table.

```
## Deployment Safety Report

**Verdict: GO**
**Overall Risk Tier:** T4

### Risk Classification
| Change | Tier | Reason |
|--------|------|--------|
| Add preferred_language column | T4 | Nullable with default — old code unaffected, additive only |

### Rollback Plan
  Step 1: git revert <sha> && deploy
  Step 2: ALTER TABLE users DROP COLUMN preferred_language;
  Rollback window: Indefinite — column is purely additive, no data dependency
```

### Example 2: Non-Reversible Migration (No-Go)

**Change:** `ALTER TABLE orders DROP COLUMN legacy_order_id;`

```
## Deployment Safety Report

**Verdict: NO-GO**
**Overall Risk Tier:** T1

### Critical Issues
- DROP COLUMN is non-reversible once deployed to production — data cannot be recovered
- grep shows legacy_order_id still referenced in orders/serializers.py:142 and api/v1/orders.py:88
- No feature flag exists to gate this change

### Conditions for Go
- [ ] Remove all code references to legacy_order_id and deploy that code change first
- [ ] Wait for at least one deploy cycle to confirm no errors
- [ ] Create a database backup before running the DROP COLUMN migration
- [ ] Document that legacy_order_id data will be permanently lost

### Rollback Plan
  Step 1: Not possible once column is dropped — this is why Verdict is NO-GO
  Required: Resolve critical issues above before re-evaluation
```

### Example 3: Conditional Go with Feature Flag

**Change:** New billing API v2 with changed response shape for `GET /api/billing/summary`.

```
## Deployment Safety Report

**Verdict: CONDITIONAL GO**
**Overall Risk Tier:** T2

### Conditions for Go
- [ ] BILLING_V2_ENABLED feature flag must be set to false at deploy time
- [ ] Mobile app clients must be updated to handle both old and new response shapes before flag is enabled
- [ ] Dual-write period: both /api/billing/summary (v1) and /api/v2/billing/summary must respond correctly for 30 days

### Rollback Plan
  Step 1: Set BILLING_V2_ENABLED=false in environment config — immediate, no redeploy needed
  Step 2: git revert <sha> if config change is insufficient
  Rollback window: Indefinite while feature flag is off
```
