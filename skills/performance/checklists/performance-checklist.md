# Performance Investigation Checklist

Run through this checklist before closing any performance investigation. Every item must be
explicitly confirmed or marked N/A with a reason.

---

## Memory Leak Investigations

### Phase 1 — Leak Confirmation

- [ ] RSS growth is monotonic over at least 1 hour (not just a spike)
- [ ] Memory does NOT return to baseline after `gc.collect()` / `runtime.GC()` / equivalent
- [ ] Growth rate quantified: N MB/hr or N MB per N requests
- [ ] Growth confirmed to be traffic-proportional OR time-proportional (not fixed)
- [ ] "High memory usage at peak load" ruled out as an alternative explanation
- [ ] Heap vs RSS delta measured — if RSS >> heap, native extension leak suspected

### Phase 2 — Profiling

- [ ] Profiler chosen appropriate for the language (tracemalloc / --inspect / pprof / jmap)
- [ ] Profiler overhead assessed before using in production
- [ ] Baseline snapshot taken before workload
- [ ] Post-workload snapshot taken after a fixed, repeatable number of operations
- [ ] GC triggered before the post-workload snapshot
- [ ] Object type with highest growth identified by name (not just "memory is higher")
- [ ] Retention chain traced from the growing object type to the root reference

### Phase 3 — Root Cause

- [ ] Leaking code location identified to a specific file and line number
- [ ] Retention pattern classified (event listener / closure / cache / ORM session / thread-local / etc.)
- [ ] Minimal reproduction written and confirmed to show growth in < 5 minutes

### Phase 4 — Fix and Verification

- [ ] Fix changes only the leaking code — no unrelated cleanup
- [ ] Fix verified with minimal reproduction: growth stops or drops to near-zero
- [ ] Fix verified in a staging environment with production-representative traffic
- [ ] Memory Report filled out with all fields
- [ ] Prevention measure added (code review checklist item, lint rule, or monitoring alert)

---

## Dependency Blast Radius Investigations

### Phase 1 — Consumer Map

- [ ] All direct consumers identified via grep / dependency tool
- [ ] All transitive consumers identified (`pip show --required-by` / `npm ls` / `go mod graph`)
- [ ] Consumer table built with import type and usage pattern per consumer
- [ ] Consumers in other services / repos included (not just the current repo)

### Phase 2 — Breaking Change Detection

- [ ] Changelog read for EVERY version in the upgrade range (not just current → target)
- [ ] Keywords scanned: `breaking`, `removed`, `deprecated`, `renamed`, `migration guide`
- [ ] APIs used in the codebase cross-referenced against the breaking change list
- [ ] Official migration guide read if the change is major
- [ ] Breaking change table built with affected file count per change

### Phase 3 — Test Coverage Assessment

- [ ] Tests found for affected code paths
- [ ] Coverage quality assessed: does the test actually exercise the changed API, or just high-level behavior?
- [ ] Coverage level classified: high / medium / low / none per affected path
- [ ] Gaps in test coverage explicitly noted in the report

### Phase 4 — Risk Score and Recommendation

- [ ] Risk score calculated using the five factors (semver, consumer count, breaking changes, coverage, migration guide)
- [ ] Risk level assigned: Low / Medium / High / Critical
- [ ] Recommendation stated: Go / No-Go / Staged upgrade with one-sentence justification
- [ ] Migration steps ordered and concrete
- [ ] Rollback plan specified (how to revert if the upgrade breaks in production)
- [ ] Validation commands listed: test suite + smoke test + metrics to watch post-deploy

---

## Pre-Fix Gate (Both Tracks)

Do not implement any fix until all of these are true:

- [ ] Root cause is stated in the required format (one sentence, specific mechanism)
- [ ] Minimal reproduction exists (memory track) or breaking change table is complete (blast radius track)
- [ ] Blast radius of the fix itself is assessed (what else does the fix affect?)
- [ ] User has approved the proposed fix
- [ ] Rollback plan is stated
