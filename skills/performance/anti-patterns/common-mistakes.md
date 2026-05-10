# Common Mistakes in Performance Investigation

These are the most frequent errors made during memory leak and dependency upgrade investigations.
Each entry describes the mistake, its consequence, and the correct approach.

---

## Memory Leak Investigation Mistakes

### Mistake 1: Labeling High Memory Usage as a Memory Leak Without Confirmation

**What happens:** A service is using 800MB of RAM. An engineer files a "memory leak" bug and
spends two days hunting for a leak that does not exist. The service has a 500MB LRU cache that
is working as intended — it filled up and stabilized.

**Consequence:** Engineering time wasted. The actual performance issue (oversized cache hurting
other services via memory pressure) is never addressed because the team is looking for a leak.

**Correct approach:** Before using the word "leak", confirm non-reclamation. Trigger GC manually
and measure memory before and after. If memory returns close to baseline after GC, this is not
a leak — it is a high working set or cache. Characterize and document it as such.

---

### Mistake 2: Fixing a Leak by Increasing Memory Limits

**What happens:** A service hits its 512MB memory limit and gets OOM-killed. The fix is to
increase the limit to 1GB. This buys 4 hours before the next OOM kill.

**Consequence:** The cycle repeats. Each limit increase buys progressively less time because the
leak rate stays constant while the headroom between current usage and the new limit starts full.
No root cause is found. Infrastructure costs grow.

**Correct approach:** Increasing the memory limit is an emergency mitigation only, not a fix.
It should be paired with a root cause investigation. State explicitly: "We increased the memory
limit to 1GB as mitigation. Root cause investigation is in progress."

---

### Mistake 3: Profiling in Production Without Measuring Profiler Overhead

**What happens:** An engineer enables `tracemalloc` or attaches `py-spy` to a production
service to catch a memory leak. `tracemalloc` adds 2–10MB of tracking overhead per traced
object type. Under high load, this overhead degrades the service.

**Consequence:** Profiling causes the service to consume even more memory, potentially
accelerating OOM kills. In the worst case, the service degrades enough to trigger a customer-
facing incident during the investigation.

**Correct approach:** Measure profiler overhead in a staging environment before using it in
production. For Python: `tracemalloc` overhead is proportional to the number of distinct
allocation sites. For Node.js: `--inspect` adds < 1% CPU overhead but enables remote heap
snapshots safely. For Go: `pprof` CPU profiling adds 5–10% CPU overhead.

---

### Mistake 4: Stopping at the Allocating Code Without Finding the Retaining Reference

**What happens:** `tracemalloc` shows that `services/patient.py:34` is allocating the growing
objects. The engineer adds a comment to that line and calls the investigation done.

**Consequence:** The root cause is not the allocation — it is the reference that prevents
the allocated object from being freed. Identifying the allocation site without the retention
chain does not lead to a fix.

**Correct approach:** The allocation site is the starting point, not the end point. Use
`objgraph.show_backrefs()` or equivalent to trace the reference chain from the allocating
object back to the root that is keeping it alive. The root is where the fix belongs.

---

### Mistake 5: Skipping the Minimal Reproduction

**What happens:** The leak is identified. The engineer applies the fix directly to production
code without a minimal reproduction. The fix is deployed. Memory still leaks. There was a
second leak that the first profiling session didn't reveal.

**Consequence:** The fix was not verified before deployment. The second leak is harder to
find now because the first one was changed. A second investigation begins from scratch.

**Correct approach:** Always write a minimal reproduction that demonstrates the leak in
< 5 minutes. The minimal repro is the verification mechanism. If the fix stops the growth
in the minimal repro, confidence in the fix is high. If it does not, keep investigating.

---

### Mistake 6: Attributing a Native Extension Leak to Application Code

**What happens:** Python heap profiling shows no significant growth. RSS is growing by 200MB/hr.
The engineer spends a week auditing Python code looking for closures and global accumulators.
The actual leak is in the `lxml` C extension's internal XML parser cache.

**Consequence:** A week of investigation produces no fix. The native extension leak is never
identified.

**Correct approach:** If RSS >> heap metric (the runtime's own measurement), check for native
extensions first. List all `.so` / `.dll` / `.node` files in the dependency tree. Search each
extension's GitHub Issues for "memory leak". Test by isolating each native extension from the
code path and observing if the growth rate changes.

---

## Dependency Blast Radius Mistakes

### Mistake 7: Assessing Risk from the Semver Version Number Alone

**What happens:** An engineer proposes upgrading `requests` from 2.28.0 to 2.31.0 (minor bump)
and files it as "low risk, just a minor version bump." The 2.29.0 changelog contains a breaking
change to the SSL verification behavior that affects all services with custom SSL configs.

**Consequence:** The upgrade is merged without reading the changelog. Custom SSL configurations
stop working in production. A rollback is required under pressure.

**Correct approach:** Read the changelog for every version in the upgrade range, regardless of
the semver signal. Many libraries do not follow semver strictly. The semver classification is
a starting point for risk assessment, not a substitute for reading the changelog.

---

### Mistake 8: Scoping Consumer Discovery to One Repository

**What happens:** An engineer discovers that `auth-sdk` (an internal library) uses `PyJWT` 1.x
and that 3 files in the `auth-service` repo import `PyJWT` directly. The blast radius report
lists 3 files. In reality, `auth-sdk` is also imported by 12 other services — all of which
pull in `PyJWT` 1.x transitively.

**Consequence:** The upgrade is planned and executed for 3 files. The 12 transitive consumers
are not updated. `auth-sdk`'s `PyJWT` 1.x and the direct import's `PyJWT` 2.x conflict in
services that use both, causing `ImportError` or silent behavioral differences.

**Correct approach:** Always discover transitive consumers. Run `pip show <package> | grep Required-by`
and `npm ls <package>` across the entire organization's dependency graph, not just the repo
you are currently in.

---

### Mistake 9: Upgrading Multiple Dependencies in a Single PR

**What happens:** An engineer upgrades SQLAlchemy 1.4 → 2.0 and Python 3.9 → 3.11 in the
same PR. Two days after deployment, an edge case in the ORM query behavior is broken. The
engineer cannot determine if the bug was introduced by the SQLAlchemy change or the Python
version change.

**Consequence:** Debugging requires reverting both changes and testing each in isolation — which
doubles the rollback and re-investigation time.

**Correct approach:** Never upgrade multiple major dependencies in the same PR. One dependency
per PR. If the upgrades are related (e.g., upgrading Python requires upgrading a library for
compatibility), document the coupling explicitly and treat it as one coordinated upgrade with
extra testing time.

---

### Mistake 10: Treating "All Tests Pass" as Sufficient Validation for a Major Upgrade

**What happens:** The test suite passes after a SQLAlchemy 1.4 → 2.0 upgrade. The team ships
to production. A week later, a rarely-exercised admin report endpoint crashes because it uses
`session.execute()` with the old SQLAlchemy 1.x string literal syntax that was removed in 2.0.
The test for this endpoint was marked `@pytest.mark.skip` 6 months ago when it became flaky.

**Consequence:** A production bug reaches users in a code path with no test coverage. The
fix requires a hotfix deployment.

**Correct approach:** Before a major upgrade, enumerate all APIs that changed in the upgrade
range. Cross-reference them against your codebase. For any changed API with no test coverage,
either write a test or manually exercise the flow before approving the upgrade for production.
"No failing tests" is necessary but not sufficient.
