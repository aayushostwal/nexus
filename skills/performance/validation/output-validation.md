# Output Validation — Performance Investigations

Use this checklist to validate a completed performance investigation report before presenting it.
Every item must pass. If any item fails, the report is incomplete — do not present it.

---

## Memory Leak Report Validation

### Completeness Checks

- [ ] **Confirmed Leak** is explicitly stated as "yes" or "no" — not implied
- [ ] **Growth Rate** is a number with units (MB/hr or MB per N requests) — not "significant" or "large"
- [ ] **Language** is stated explicitly
- [ ] **Leak Location** is a specific file and line number — not just a module or function name
- [ ] **Retaining Object** names the specific class or type — not "a Python object"
- [ ] **Retention Pattern** is one of the classified patterns (event listener / closure / cache / ORM session / global accumulator / thread-local / file descriptor)
- [ ] **Minimal Repro** is a runnable code snippet that shows growth in < 5 minutes
- [ ] **Fix** specifies exact file, line, and the before/after code change
- [ ] **Blast Radius** states what the fix might affect (other callers, performance impact of the change)
- [ ] **Verification** shows actual memory measurements before and after the fix (not just "it should work")
- [ ] **Prevention** states a specific measure (lint rule, code review item, monitoring alert) — not just "be careful"

### Accuracy Checks

- [ ] The growth rate is calculated from actual measurements, not estimated
- [ ] The leak is confirmed by non-reclamation after GC — not just by high memory usage
- [ ] The leak location was found by profiling, not by code inspection alone
- [ ] If RSS >> heap, native extension leak was investigated before blaming application code
- [ ] The fix addresses the retaining reference, not just the allocating code

### Anti-Pattern Checks

- [ ] Report does not use "memory leak" if GC reclaims the memory after collection
- [ ] Report does not recommend increasing memory limits as the fix (it may appear in mitigation, not fix)
- [ ] Minimal reproduction exists before the fix was implemented
- [ ] Profiler overhead was not applied to production without a staging assessment

---

## Dependency Blast Radius Report Validation

### Completeness Checks

- [ ] **Dependency** states both current and target versions
- [ ] **Semver Change** is classified correctly: patch / minor / major / pre-release
- [ ] **Upgrade Reason** is stated: CVE / new feature / EOL / performance / other
- [ ] **Consumer Map** includes both direct and transitive consumers
- [ ] **Breaking Changes** table is populated — if empty, explicitly states "no breaking changes found in changelog for versions X through Y"
- [ ] **Test Coverage** is assessed per affected code path — not just "we have tests"
- [ ] **Risk Score** shows the calculation (sum of the five factors)
- [ ] **Risk Level** is one of: Low / Medium / High / Critical
- [ ] **Recommendation** is one of: Go / No-Go / Staged upgrade — with a one-sentence justification
- [ ] **Migration Steps** are ordered and specific (not "update the code to use the new API")
- [ ] **Rollback Plan** states how to revert the upgrade if it causes a production issue
- [ ] **Validation** lists the commands to run: test suite + smoke test + production metrics to watch

### Accuracy Checks

- [ ] Changelog was read for every version in the upgrade range — not just the target version
- [ ] Consumer discovery covered all repositories / services, not just the current repo
- [ ] Breaking changes table was cross-referenced against actual code usage patterns
- [ ] Risk score factors were applied correctly (see scoring table in `dependency-blast-radius.md`)

### Anti-Pattern Checks

- [ ] Risk was not assessed from semver number alone without reading the changelog
- [ ] Report does not recommend a Go for High or Critical risk without a migration window
- [ ] Report does not treat "all tests pass" as sufficient validation for a major upgrade
- [ ] This upgrade is the only dependency being changed in the PR (no bundled major upgrades)

---

## Go/No-Go Decision Validation

Before presenting a Go recommendation, confirm all of these:

- [ ] Risk score is Low or Medium (score ≤ 7)
- [ ] All breaking changes that affect the codebase have a stated mitigation
- [ ] Test coverage for affected paths is Medium or High
- [ ] A rollback plan exists (pinned version + deployment procedure)
- [ ] No other major dependency upgrades are bundled in the same PR

Before presenting a No-Go recommendation, confirm:

- [ ] Risk score is High or Critical (score ≥ 8), OR
- [ ] Breaking changes affect core paths with no test coverage and no stated mitigation, OR
- [ ] The upgrade reason is not urgent (not a CVE) and the engineering cost exceeds the benefit

Before presenting a Staged upgrade recommendation, confirm:

- [ ] A specific staging order is described (which service first, validation period between stages)
- [ ] Success criteria for each stage are defined before proceeding to the next stage
- [ ] A per-stage rollback procedure is described
