# Debugging Heuristics

Pattern-matching shortcuts that narrow the hypothesis space before reading code.
These are probabilistic — use them to form an initial hypothesis, then verify it.

---

## Environment & Deployment Heuristics

### "Works on My Machine"

Signal: passes locally, fails in CI or on another developer's machine.

Root cause is always an environment delta. Check in this order:

| Delta to check | How to check |
|----------------|-------------|
| Runtime version | `python --version`, `node --version`, `go version` — compare local vs CI |
| Installed packages | `pip freeze`, `npm ls --depth=0` — compare local vs lockfile |
| Missing env var | Diff `.env.example` vs CI secrets; search for `os.getenv(` or `process.env.` |
| OS or filesystem difference | macOS case-insensitive FS vs Linux case-sensitive — check import paths |
| Network access | External API calls that work locally but are blocked in CI |
| File permissions | CI often runs as a different user; check `chmod` assumptions |
| Timezone | Local timezone vs UTC in CI — always suspect when datetime logic is involved |

Do not read application code until you have identified the environment delta.

### Sudden Behavior Change with No Code Change

Signal: nothing was deployed, but the system started misbehaving.

Check these in order:
1. **Dependency auto-update** — check `pip-audit`, `npm outdated`, or Renovate/Dependabot PRs merged in the last 48 hours.
2. **Infrastructure change** — check cloud provider change logs, Terraform state diff, or Kubernetes config change.
3. **Config drift** — check if an env var, feature flag, or secret was changed manually in the environment.
4. **External dependency** — check if a third-party API, database, or queue the service depends on had an outage or breaking change.
5. **Data pattern change** — a new type of input arrived in production that was never seen in tests (empty list, unicode character, very long string).

---

## Error Location Heuristics

### Error on the First Line of a Function

Signal: the failure occurs at the very first statement in a function (before any logic runs).

Most likely: the caller is passing bad input — null where non-null is expected, wrong type,
or missing required field. Start reading at the call site, not the failing function.

### Error Deep in a Library

Signal: the stack trace has 10+ frames, and the first user-code frame is at the very top,
with the rest being library internals.

Most likely: version incompatibility (the library changed a signature or behavior) or
API misuse (calling the library in a way it does not support). Check:
1. The library's CHANGELOG for the version in use
2. The library's GitHub Issues for the exact error message
3. Your code against the library's current documented API

### Error Only on a Specific Input

Signal: works for most inputs, fails for one specific case.

Most likely: missing input validation or an edge case not covered in tests. The specific
input reveals the assumption that is violated — read it carefully. Common culprits:
empty string, `None`/`null`, zero, negative number, unicode, very large value, or a
date at a boundary (midnight, DST transition, leap year).

---

## Timing & Concurrency Heuristics

### Periodic Failures (Cron-Correlated)

Signal: errors spike at the same time every day (midnight, top of the hour, etc.).

Most likely: a scheduled job (cron, Celery beat, AWS EventBridge) is interfering with
the application — writing to the same table, acquiring the same lock, or consuming the
same resource. Check the job schedule and what it touches.

Also check: timezone-dependent logic that behaves differently when date rolls over (UTC
midnight vs local midnight).

### Failures Only Under Concurrency

Signal: passes in single-threaded tests, fails when multiple workers or threads are running.

Most likely: race condition or shared mutable state. Checklist:
- [ ] Shared module-level variable modified by multiple workers
- [ ] Database row read-modify-write without a transaction or `SELECT FOR UPDATE`
- [ ] Cache set by one worker and invalidated by another before the first is done
- [ ] Async operation assumed to complete before another starts (missing `await`)
- [ ] File written by two processes simultaneously

### Gradual Performance Degradation

Signal: response times or memory usage increases slowly over hours or days, not suddenly.

Most likely: a resource leak. Check in order:
1. **Memory leak** — Python: `tracemalloc`, `objgraph`; Node: `--inspect` heap snapshot; Java: `jmap`
2. **Database connection leak** — connections opened but not closed; check `pg_stat_activity`
3. **File handle leak** — `lsof -p <pid>` to count open file descriptors
4. **Cache that never expires** — unbounded in-memory dict or cache with no TTL

### Errors Spike Exactly with Traffic

Signal: error rate is proportional to request rate — higher traffic = more errors.

Most likely: a load-sensitive bug. Common causes:
- Connection pool too small for peak concurrency
- Rate limit on an external API being hit
- Shared lock contention under concurrency
- Memory pressure causing GC pauses or OOM

Approach: load test in staging to reproduce, then measure connection counts, memory, and
lock wait times at the failing concurrency level.

### Errors Are Random (Not Traffic-Correlated)

Signal: errors occur at unpredictable intervals with no obvious trigger.

Most likely: a timing or race condition. The failure depends on the order in which
concurrent operations complete, which varies non-deterministically. Approach:
1. Add structured logging around the affected code path
2. Capture the thread/process ID and timestamps in each log line
3. Reproduce at high concurrency and look for interleaving patterns in the logs

---

## Regression Heuristics

### How to Use `git bisect`

Use when: a bug exists in `HEAD` but did not exist in a known-good commit and you cannot
identify the offending commit by reading `git log`.

```bash
git bisect start
git bisect bad HEAD                  # current commit is broken
git bisect good <last-known-good>    # e.g., the tag from last week's release

# Git checks out a commit halfway between good and bad.
# Run your test:
pytest tests/test_orders.py::test_due_today -xvs

# Tell git the result:
git bisect good   # if test passes
git bisect bad    # if test fails

# Repeat until git prints: "<hash> is the first bad commit"
git bisect reset  # return to HEAD when done
```

Number of iterations needed: `log2(N)` commits. For 100 commits: ~7 iterations.

### The Minimum Reproducible Case

Use when: the failure is hard to reproduce or the codebase is large.

1. Start with the full failing scenario.
2. Remove one piece of context at a time — strip fixtures, simplify inputs, remove unrelated code paths.
3. Stop removing when the error disappears — the last removed piece is relevant.
4. The minimum reproducible case is the smallest code/input/environment that still triggers the bug.

A minimum reproducible case makes it easier to reason about, easier to share with teammates,
and often reveals the root cause by itself.

---

## Root Cause Analysis Technique: Five Whys

Use when: you have identified the proximate cause but want to find the underlying cause
that would prevent recurrence.

Example:

| # | Why | Answer |
|---|-----|--------|
| 1 | Why did the API return 500? | Database connection timed out |
| 2 | Why did the connection time out? | Connection pool was exhausted |
| 3 | Why was the pool exhausted? | 3x traffic spike, pool sized for normal load |
| 4 | Why was the pool not sized for peak load? | No load test was run before the campaign |
| 5 | Why was no load test run? | No load test step in the pre-launch checklist |

Root cause at Why 5: no load test requirement in the pre-launch process.
Fix at Why 5: add load test to the launch checklist — not just increase pool size.

Stop at the point where the answer is a process or organizational gap, or where the fix
would prevent the failure class entirely, not just the specific instance.
