---
name: architecture-checklists
description: >
  Checklists loaded during architecture mapping and deployment safety checks.
  Load this file at the start of any architecture mapping session and before issuing
  any deployment safety verdict. Each checklist must be completed in full — do not skip items.
---

# Architecture Checklists

Three checklists: pre-mapping, architecture review, and deployment safety.
Complete each in full before producing output for the relevant workflow stage.

---

## Checklist 1 — Pre-Mapping (Complete Before Step 1 of Mapping Workflow)

Answer each question before writing any analysis. If you cannot answer a question, read the
relevant files before proceeding.

### Codebase Understanding
- [ ] Have you read the top-level directory structure (not just guessed it from context)?
- [ ] Have you identified every entry point (main.py, index.ts, manage.py, wsgi.py, etc.)?
- [ ] Have you identified the primary programming language and framework?
- [ ] Have you located the database configuration (ORM, connection strings, migration directory)?
- [ ] Have you found the API route definitions (not just assumed their shape)?
- [ ] Have you checked for a monorepo structure (multiple packages/apps in one repo)?
- [ ] Have you read any existing architecture docs (README, ARCHITECTURE.md, ADRs, Confluence links)?
- [ ] Have you run `git log --oneline -20` to understand recent change velocity and areas of activity?

### Scope Confirmation
- [ ] Do you know the codebase size (line count, file count, package count)?
- [ ] Do you know how many engineers maintain this codebase?
- [ ] Do you know the current deploy model (monolith / services / serverless)?
- [ ] Do you know the database topology (single DB / multiple DBs / multi-tenant)?
- [ ] Has the user stated a specific goal (extract a service / understand coupling / plan a migration)?

If more than 3 items above are unchecked: ask the user for the missing context before proceeding.

---

## Checklist 2 — Architecture Review (Complete Before Writing Coupling Matrix)

Work through each category. Flag any item that fails — flagged items are coupling signals
that must appear in the output.

### Layering
- [ ] Every directory is classified into exactly one layer (API / Service / Data / Infra / Shared / Worker)
- [ ] No directory spans multiple layers (e.g., a module that is both a service and a data access layer)
- [ ] The API layer does not directly access the database (must go through the service layer)
- [ ] The data layer is not calling the API layer (no circular layer dependency)
- [ ] Infrastructure concerns (email, S3, queues) are isolated from business logic

### Coupling
- [ ] Identified all cross-module imports (not just top-level — check nested imports in functions)
- [ ] Confirmed no circular imports (A imports B which imports A)
- [ ] Identified all shared ORM models (model classes imported by more than one bounded context)
- [ ] Identified all raw SQL queries that cross context boundaries
- [ ] Checked for shared global singletons or module-level state (Redis clients, DB sessions, config objects)
- [ ] Checked for implicit coupling via shared test fixtures or test helpers

### Data Ownership
- [ ] Every database table is assigned to exactly one bounded context (single writer)
- [ ] No table is written by more than one module/service
- [ ] Foreign keys that cross bounded context boundaries are identified and flagged
- [ ] Shared lookup tables (e.g., enums, config) are distinguished from domain tables
- [ ] Database migrations are owned by a single context (not shared migration directories)

### API Contracts
- [ ] All public API endpoints are documented (or at least enumerated)
- [ ] Versioning strategy is identified (URL versioning / header versioning / none)
- [ ] Breaking vs non-breaking API changes are distinguishable from the diff
- [ ] Internal API calls between modules are distinguished from external-facing API calls
- [ ] Event schemas (Celery tasks, SQS messages, Kafka topics) are documented if present

### Deployment Independence Test
For each candidate bounded context, answer:
- [ ] Can this context be deployed without coordinating with other context teams?
- [ ] Does this context have its own CI/CD pipeline (or could it)?
- [ ] Can this context be rolled back independently without affecting other contexts?
- [ ] Does this context have its own database (or could it, without cross-context FK violations)?

Any "No" answer = the context is not truly independent yet. Document why.

---

## Checklist 3 — Deployment Safety (Complete Before Issuing Go/No-Go Verdict)

All 15+ items must be checked. A single unchecked Tier 1 item = No-Go.

### Schema Migrations
- [ ] Every migration file in the PR has been read and classified (T1 / T2 / T3 / T4)
- [ ] No DROP COLUMN or DROP TABLE without verifying zero code references first
- [ ] No column rename (rename = drop + add — use the add/dual-write/remove pattern instead)
- [ ] No NOT NULL constraint added without a default value or simultaneous backfill
- [ ] No decimal precision narrowing without checking existing data exceeds new precision
- [ ] Large table migrations assessed for lock duration (tables > 10M rows need CONCURRENTLY or maintenance window)
- [ ] Each migration has a corresponding rollback script or the rollback is documented as "non-reversible"
- [ ] Old application code can still run against the new schema (forward compatibility)
- [ ] New application code can run against the old schema during a rolling deploy (backward compatibility)

### API Changes
- [ ] All changed route handlers are identified
- [ ] Required request fields added to existing endpoints are assessed for existing callers
- [ ] Response fields removed or renamed are searched for in all known clients (web, mobile, internal)
- [ ] Endpoint removals verified to have no active callers (check analytics / access logs if available)
- [ ] API versioning is in place for any breaking change, OR a migration period is defined

### Configuration & Environment
- [ ] New required environment variables are documented and set in all environments before deploy
- [ ] Removed environment variables are confirmed unused across all environments
- [ ] Config file changes are backwards compatible or a fallback exists
- [ ] Feature flags for new functionality are set to the correct default (off) before deploy

### Rollback
- [ ] A tested rollback plan exists for every T1 and T2 change
- [ ] Rollback plan includes exact commands (not "revert the code" — give the git command or kubectl command)
- [ ] Rollback window is identified (time before rollback becomes impossible)
- [ ] Someone on the team is designated to execute rollback if needed during the deploy window

### Dependency Bumps
- [ ] Major version bumps have been tested in a staging environment
- [ ] Security patches are confirmed to not introduce API breaking changes
- [ ] Transitive dependency changes are assessed (not just direct deps)

### Monitoring
- [ ] Post-deploy monitoring plan defined (which metrics, which dashboards, how long to watch)
- [ ] Alerting is in place for error rate spikes on affected endpoints
- [ ] On-call contact identified for the deploy window
- [ ] Rollback trigger threshold defined ("If error rate exceeds X%, execute rollback immediately")
