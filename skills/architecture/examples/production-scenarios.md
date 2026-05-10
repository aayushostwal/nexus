---
name: architecture-examples
description: >
  Production scenario walkthroughs for the nexus-architecture skill. Each scenario shows the
  full mapping workflow applied to a real class of codebase. Load this file when you need
  concrete examples to calibrate output quality or when the user asks "show me an example".
---

# Architecture Mapping — Production Scenarios

Three real classes of architecture problems, with full workflow traces.

---

## Scenario 1: Mapping a 200k-Line Django Monolith

**Context:** A SaaS platform for healthcare scheduling. 200k lines of Python, 8 years old, 6 Django apps,
single PostgreSQL database, 12 engineers across 4 teams. The CTO wants to understand where they can extract
services to scale the notification and reporting workloads independently.

### Step 1 Output — Layer Map

```
Layer Map:
  API:      accounts/, scheduling/, reporting/, notifications/views.py
  Service:  scheduling/services.py, notifications/tasks.py, billing/processors.py
  Data:     accounts/models.py, scheduling/models.py, reporting/models.py, billing/models.py,
            notifications/models.py — all in a single DB
  Infra:    integrations/twilio.py, integrations/sendgrid.py, integrations/stripe.py
  Shared:   core/models.py, core/permissions.py, core/middleware.py
  Workers:  notifications/tasks.py (Celery), reporting/tasks.py (Celery)
```

Flag: `notifications/tasks.py` appears in both Service and Workers layers — it owns business logic
AND is the task runner. This is an internal coupling signal.

### Step 2 Output — Dependency Graph (top modules by fan-in)

| Module | Fan-in | Fan-out | Most depended on by | Extraction Risk |
|--------|--------|---------|--------------------|--------------------|
| `core/models.py` | 18 | 0 | All 6 apps + integrations | Critical — extract last |
| `accounts/models.py` (User, Practice) | 14 | 2 | All feature apps | High |
| `scheduling/models.py` | 7 | 4 | billing, notifications, reporting | High |
| `billing/processors.py` | 3 | 6 | api, scheduling/services | Medium |
| `notifications/tasks.py` | 4 | 3 | scheduling, billing, accounts | Medium |
| `reporting/tasks.py` | 2 | 5 | api only | Low |
| `integrations/sendgrid.py` | 3 | 0 | notifications, billing | Low |

### Step 3 Output — Bounded Contexts

Co-commit analysis showed:
- `accounts/` and `core/` commit together 91% of the time → same context
- `billing/` and `scheduling/` commit together 68% of the time → coupled, but separable
- `reporting/` commits independently 85% of the time → strong extraction candidate
- `notifications/` commits independently 72% of the time → good candidate

```
Bounded Contexts Identified:
  1. Identity & Access — owns: accounts/, core/ — data: users, practices, permissions tables
     Seam: All other contexts call accounts.models.User (FK coupling — must be resolved before extraction)

  2. Scheduling — owns: scheduling/ — data: appointments, slots, providers tables
     Seam: billing reads scheduling.models.Appointment directly (shared table read)

  3. Billing — owns: billing/ — data: invoices, payments, subscriptions tables
     Seam: reads Appointment from scheduling; calls Stripe via integrations/

  4. Notifications — owns: notifications/ — data: notification_log, templates tables
     Seam: called by scheduling and billing with send_* function calls; no reverse dependency

  5. Reporting — owns: reporting/ — data: report_runs, cached_metrics tables (+ reads from all others via raw SQL)
     Seam: reads raw SQL across all tables — this is the false boundary (it's tightly coupled via SQL)
```

### Step 4 Output — Coupling Matrix

| From \ To | Identity | Scheduling | Billing | Notifications | Reporting |
|-----------|----------|------------|---------|---------------|-----------|
| Identity | — | None | None | None | None |
| Scheduling | FK + model import | — | None | Function call | None |
| Billing | FK + model import | DB read (Appointment) | — | Function call | None |
| Notifications | FK import (User) | None | None | — | None |
| Reporting | Raw SQL reads | Raw SQL reads | Raw SQL reads | None | — |

Coupling scores:
- Reporting: **9/10** — raw SQL reads across all contexts = distributed monolith disguised as a module
- Billing: **7/10** — shares Appointment table with Scheduling
- Scheduling: **6/10** — imported by Billing and Notifications
- Notifications: **3/10** — only FK import from Identity (User lookup)
- Identity: **8/10** — imported by everyone via User model

### Step 5 Output — Extraction Candidates

```
Extraction Order:
  1. Notifications — coupling score 3
     Owns its tables, only outbound dependencies, clean function-call seam
     Risk: Low | Effort: 2 sprints | Blocker: Replace User FK with user_id integer + async lookup
     Approach: Strangler fig — intercept send_notification() calls with HTTP call to new service

  2. Reporting — WARNING: despite appearing isolated, it uses raw SQL across all tables
     Cannot extract safely until all other contexts are extracted first and have APIs
     Risk: Critical if extracted now | Correct order: Extract last
     Blocker: Rebuild reporting to call other services' APIs instead of direct SQL reads

  3. Billing — coupling score 7, but Scheduling dependency is addressable
     Blocker: Resolve shared Appointment table read — Billing must call Scheduling's API instead
     Risk: High | Effort: 4-6 sprints | Pre-requisite: Scheduling must expose GET /appointments/:id

  4. Scheduling — coupling score 6, but foundational to Billing
     Risk: High | Effort: 4-6 sprints | Pre-requisite: Billing must be extracted first

  5. Identity — the core, extract last after everything else is independent
     Risk: Critical | Effort: 8-12 sprints
```

**Key insight:** Reporting had the worst coupling score (9/10) but its *apparent* isolation fooled the team.
The co-commit pattern was low because reporting SQL queries are embedded strings — they don't show as Python
imports. Always scan raw SQL strings in addition to Python imports.

---

## Scenario 2: Deployment Safety Check Catches a Non-Reversible Migration

**Context:** An e-commerce platform, PostgreSQL, Django migrations. A PR adds "cleanup of old columns" that
the author claims are unused. Pre-deployment safety check catches a critical issue.

### The PR Contents

```diff
# billing/migrations/0047_remove_legacy_fields.py

class Migration(migrations.Migration):
    operations = [
        migrations.RemoveField(model_name='invoice', name='legacy_invoice_id'),
        migrations.RemoveField(model_name='invoice', name='legacy_provider_ref'),
        migrations.AlterField(
            model_name='invoice',
            name='amount',
            field=models.DecimalField(max_digits=8, decimal_places=2),  # was max_digits=10
        ),
    ]
```

### Step 1 Output — Change Inventory

```
Change Inventory:
  Application code: 3 files — billing/models.py, billing/serializers.py, billing/migrations/0047_*
  Migrations: 1 migration file — removes 2 columns, narrows amount field type
  Config changes: none
  Dependency bumps: none
  API changes: none declared — but serializer changes affect response shape
```

### Step 2 Output — Risk Classification

| Change | Tier | Reason |
|--------|------|--------|
| RemoveField legacy_invoice_id | T1 | DROP COLUMN — non-reversible, data permanently lost |
| RemoveField legacy_provider_ref | T1 | DROP COLUMN — non-reversible |
| AlterField amount max_digits 10→8 | T1 | Narrowing decimal precision — existing data with 9-10 digit values will be truncated or fail |
| Serializer removes legacy_invoice_id | T2 | Any API consumer reading this field breaks silently (field absent, not 404) |

Overall tier: **T1 — No-Go**

### Step 3 Output — Issues Found

**Issue 1 — Columns not actually unused:**
```bash
grep -r "legacy_invoice_id" . --include="*.py" --include="*.html" --include="*.js"
# Found in:
# api/v1/serializers.py:88 — still in response schema
# reports/legacy_export.py:34 — used in monthly billing export
# templates/billing/invoice_pdf.html:156 — rendered in PDF template
```

**Issue 2 — Decimal narrowing is data-destructive:**
```sql
SELECT COUNT(*) FROM billing_invoice WHERE amount > 99999999;
-- Returns: 847 rows with amounts over 8-digit limit
-- These rows will either fail the migration or be silently truncated
```

**Issue 3 — No rollback path:**
Once `legacy_invoice_id` is dropped, historical invoice matching to the external billing system is
permanently broken. The column was the join key for the legacy CSV reconciliation process (documented
in an internal wiki page, not in code).

### Output

```
## Deployment Safety Report

**Verdict: NO-GO**
**Overall Risk Tier:** T1

### Critical Issues
- legacy_invoice_id still referenced in 3 files (api/v1/serializers.py:88,
  reports/legacy_export.py:34, templates/billing/invoice_pdf.html:156)
- 847 rows in billing_invoice have amount > 8-digit limit — AlterField will fail or truncate data
- legacy_invoice_id is the join key for the legacy CSV reconciliation process
  (see internal wiki "Billing Reconciliation") — dropping it permanently breaks reconciliation
- No rollback script exists for any of these changes

### Required Before Re-evaluation
1. Remove all code references to legacy_invoice_id and deploy first — then drop the column
2. Run amount range analysis; widen or reject the max_digits change
3. Confirm with Finance team whether legacy_invoice_id is still needed for reconciliation
4. Create a point-in-time backup before any destructive migration runs
```

---

## Scenario 3: Shared Database Anti-Pattern Causing False Boundaries

**Context:** A logistics company has three "separate services" — Dispatch, Fleet, and Billing — each
with its own repo and independent deploy pipeline. The architecture diagram shows them as separate boxes.
But production is plagued by mysterious data inconsistencies and the teams cannot deploy independently.

### The Investigation

**Step 1 — Directory scan of each "service":**

```
dispatch-service/: app/, models/, config/ — connects to postgres://shared-prod-db/logistics
fleet-service/:    app/, models/, config/ — connects to postgres://shared-prod-db/logistics
billing-service/:  app/, models/, config/ — connects to postgres://shared-prod-db/logistics
```

All three services connect to the **same database**. The "service boundary" is only at the application layer.

**Step 2 — Import / model analysis:**

```
dispatch-service/models/vehicle.py — defines Vehicle model (table: vehicles)
fleet-service/models/vehicle.py    — ALSO defines Vehicle model (table: vehicles — same table)
billing-service/models/vehicle.py  — ALSO defines Vehicle model (table: vehicles — same table)
```

All three services have their own ORM model definition pointing at the same `vehicles` table. Any schema
change to `vehicles` requires coordinated deploys across all three services simultaneously.

**Step 3 — Coupling matrix:**

| | Dispatch | Fleet | Billing |
|--|----------|-------|---------|
| Dispatch | — | Shared `vehicles` table (write) | Shared `trips` table (read) |
| Fleet | Shared `vehicles` table (write) | — | Shared `drivers` table (read) |
| Billing | Shared `trips` table (read) | Shared `drivers` table (read) | — |

Every service reads and writes tables that other services also read and write. This is the **distributed
monolith** anti-pattern — all the operational complexity of microservices with none of the isolation benefits.

**Step 4 — Evidence of the false boundary:**

1. A Fleet team schema migration in September caused Dispatch service to crash with a column-not-found
   error because Fleet dropped a column that Dispatch was still reading.
2. Billing cannot be deployed without first checking that Dispatch and Fleet have compatible model versions.
3. The "service" boundaries were drawn along team lines, not domain lines.

### Coupling Verdict

```
Architecture Finding: Distributed Monolith

These are not microservices. They are a monolith deployed as three processes sharing one database.
The service boundaries are false — they exist only at the application layer, not at the data layer.

Evidence:
- All three services write to the same database
- Multiple ORM models across services point to the same tables
- Schema changes require coordinated deploys (deployment independence test: FAIL)
- Data inconsistency incidents are caused by racing writes from separate services to shared tables

Recommendation:
  Option A (short-term): Consolidate back to a true monolith — eliminate the pretend service split,
  reduce operational complexity, and plan a real domain-driven decomposition.

  Option B (long-term): Establish true service boundaries — each service gets its own database;
  cross-service data access happens only through APIs. Required steps:
  1. Identify which service "owns" each table (single writer principle)
  2. Migrate reads from non-owner services to API calls
  3. Split the database schema — provision separate databases per service
  4. Remove shared ORM model definitions
  Estimated effort: 6-12 months at current team size.

Do not add more services until Option A or B is completed. Adding a fourth service to this
distributed monolith increases coordination cost without adding any isolation benefit.
```
