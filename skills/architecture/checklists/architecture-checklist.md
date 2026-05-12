---
name: architecture-checklists
description: >
  Checklists for architecture mapping and deployment safety.
  Load at start of any mapping session and before deployment safety verdict.
  Complete each checklist fully — do not skip items.
---

# Architecture Checklists

Three checklists: pre-mapping, architecture review, deployment safety.
Complete each before producing output for relevant workflow stage.

---

## Checklist 1 — Pre-Mapping (Before Step 1)

### Codebase Understanding
- [ ] Read top-level directory structure
- [ ] Identified every entry point (main.py, index.ts, etc.)
- [ ] Identified primary language/framework
- [ ] Located DB config (ORM, connection strings, migrations)
- [ ] Found API route definitions
- [ ] Checked for monorepo structure
- [ ] Read existing architecture docs (README, ADRs)
- [ ] Ran `git log --oneline -20` for recent activity

### Scope Confirmation
- [ ] Codebase size (lines, files, packages)
- [ ] Number of engineers maintaining it
- [ ] Current deploy model (monolith/services/serverless)
- [ ] Database topology (single/multiple/multi-tenant)
- [ ] User's stated goal (extraction/coupling/migration)

**If >3 unchecked: ask user for missing context.**

---

## Checklist 2 — Architecture Review (Before Coupling Matrix)

### Layering
- [ ] Each directory in exactly one layer (API/Service/Data/Infra/Shared/Worker)
- [ ] No directory spans multiple layers
- [ ] API layer does not directly access DB (goes through service)
- [ ] Data layer does not call API layer (no circular layer)
- [ ] Infrastructure (email, S3, queues) isolated from business logic

### Coupling
- [ ] Identified all cross-module imports (including nested)
- [ ] No circular imports
- [ ] Identified all shared ORM models (imported >1 bounded context)
- [ ] Identified raw SQL crossing context boundaries
- [ ] Checked for shared singletons/module-level state (Redis, DB sessions, config)
- [ ] Checked implicit coupling via shared test fixtures/helpers

### Data Ownership
- [ ] Every table assigned to exactly one bounded context (single writer)
- [ ] No table written by >1 module/service
- [ ] Foreign keys crossing bounded contexts flagged
- [ ] Shared lookup tables (enums, config) distinguished from domain tables
- [ ] DB migrations owned by single context (not shared dirs)

### API Contracts
- [ ] All public API endpoints documented (or enumerated)
- [ ] Versioning strategy identified (URL/header/none)
- [ ] Breaking vs non-breaking changes distinguishable from diff
- [ ] Internal APIs distinguished from external-facing
- [ ] Event schemas (Celery/SQS/Kafka) documented if present

### Deployment Independence Test (per candidate bounded context)
- [ ] Can deploy without coordinating with other context teams?
- [ ] Has its own CI/CD pipeline (or could)?
- [ ] Can roll back independently without affecting others?
- [ ] Has its own DB (or could, without cross-context FK violations)?

**Any "No" = not truly independent. Document why.**

---

## Checklist 3 — Deployment Safety (Before Go/No-Go Verdict)

**All 15+ items must be checked. Any unchecked Tier 1 item = No-Go.**

### Schema Migrations
- [ ] Every migration file read and classified (T1/T2/T3/T4)
- [ ] No DROP COLUMN/TABLE without verifying zero code references
- [ ] No column rename (use add/dual-write/remove pattern)
- [ ] No NOT NULL constraint added without default or simultaneous backfill
- [ ] No decimal precision narrowing without checking existing data
- [ ] Large table migrations (>10M rows) assessed for lock duration (need CONCURRENTLY or maintenance window)
- [ ] Each migration has rollback script or documented as non-reversible
- [ ] Old code can run against new schema (forward compatibility)
- [ ] New code can run against old schema during rolling deploy (backward compatibility)

### API Changes
- [ ] All changed route handlers identified
- [ ] Required request fields added to existing endpoints assessed for existing callers
- [ ] Response fields removed/renamed searched in all known clients (web/mobile/internal)
- [ ] Endpoint removals verified to have no active callers (check analytics/access logs)
- [ ] API versioning in place for breaking changes, or migration period defined

### Configuration & Environment
- [ ] New required env vars documented and set in all environments before deploy
- [ ] Removed env vars confirmed unused across all environments
- [ ] Config file changes backward compatible or fallback exists
- [ ] Feature flags for new functionality default to `off` before deploy

### Rollback
- [ ] Tested rollback plan exists for every T1 and T2 change
- [ ] Plan includes exact commands (git revert, kubectl, etc.)
- [ ] Rollback window identified (time before impossible)
- [ ] Designated person on team to execute rollback during deploy window

### Dependency Bumps
- [ ] Major version bumps tested in staging
- [ ] Security patches confirmed not to introduce API breaking changes
- [ ] Transitive dependency changes assessed

### Monitoring
- [ ] Post-deploy monitoring plan defined (metrics, dashboards, duration)
- [ ] Alerting in place for error rate spikes on affected endpoints
- [ ] On-call contact identified for deploy window
- [ ] Rollback trigger threshold defined ("If error rate > X%, rollback immediately")