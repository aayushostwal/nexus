---
name: nexus-performance-memory-leak
description: >
  Use this sub-skill when investigating memory leaks, OOM kills, or gradual memory growth in a
  running service. Trigger phrases: "memory leak", "OOM kill", "memory growing over time",
  "process killed by OS", "RSS increasing", "heap size growing", "garbage collector not freeing
  memory", "memory usage doesn't drop after GC", "heapdump analysis", "tracemalloc output".
  Expected output: confirmed leak vs. normal growth, object type causing retention, minimal
  reproduction, and a targeted fix. When in doubt, use this skill.
---

# Memory Leak Investigation

Systematically confirm a memory leak, identify the retaining object type, and produce a targeted fix.

---

## Core Principle

**Confirm the leak before hunting the cause.**

High memory usage is not a memory leak. A memory leak is memory that grows without bound and
is not reclaimed by GC after the workload that produced it completes. Confusing the two wastes
hours chasing the wrong problem.

---

## Workflow

### Step 1 — Confirm the Leak (Not Just High Memory Usage)

A memory leak exhibits **all three** of these characteristics:

1. **Growth**: RSS or heap size increases monotonically over time (hours, not seconds)
2. **Non-reclamation**: Memory does not drop after GC runs or after the peak load subsides
3. **Unbounded**: Growth rate is proportional to traffic or time, not to a fixed ceiling

Collect the following before proceeding:

| Signal | Command / Source | What to look for |
|--------|-----------------|-----------------|
| RSS growth over time | `ps aux`, container metrics, Prometheus `process_resident_memory_bytes` | Steady upward slope, no recovery |
| Heap vs. RSS delta | Language-specific (see below) | Large gap between heap and RSS = native/C extension leak |
| GC behavior | GC logs, runtime metrics | GC runs but memory does not drop = reference retention |
| Rate of growth | Calculate MB/hr from two data points 1h apart | Linear growth = leak; step-function growth = large allocation on specific event |

**If memory growth stops at a fixed ceiling and does not grow further: this is not a leak.** It
is pre-allocated pool memory or a growing cache with a max size. Stop here and state this finding.

---

### Step 2 — Baseline Measurement

Establish a clean baseline before the leak manifests:

1. Restart the process (or use a fresh container instance)
2. Record memory immediately after startup (idle baseline)
3. Apply a fixed, repeatable workload (N requests, N jobs, N minutes of traffic)
4. Record memory after the workload
5. Trigger GC if the language allows it (`gc.collect()` in Python, `runtime.GC()` in Go)
6. Record memory after GC

If memory after GC is significantly higher than idle baseline → leak confirmed.
If memory after GC returns close to idle baseline → not a leak; this is normal working set growth.

---

### Step 3 — Heap Profiling by Language

#### Python

```python
# tracemalloc — built-in, zero dependencies
import tracemalloc
tracemalloc.start()

# ... run the workload that causes the leak ...

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:20]:
    print(stat)
```

What to look for:
- Lines allocating large or growing counts of the same object type
- `tracemalloc` shows allocations, not live references — also check `gc.get_objects()` for object counts

```python
# objgraph — find what is retaining objects
import objgraph
objgraph.show_growth(limit=20)  # objects that grew most since last call
objgraph.show_refs([my_suspect_object], filename='refs.png')  # reference chain
```

Check for:
- Circular references not collected by CPython's reference counter: `gc.garbage` list
- Global state accumulation: `sys.getsizeof()` on module-level dicts and lists

#### Node.js

```bash
# Start with --inspect to enable remote debugging
node --inspect app.js

# Take heap snapshot via Chrome DevTools or:
node -e "require('v8').writeHeapSnapshot()"
```

What to look for in the heap snapshot (Chrome DevTools Memory tab → Heap Snapshot):
- Objects with high "Retained Size" — these are holding large subgraphs live
- `(closure)` objects with unexpectedly high retained size → closure variable leak
- `EventEmitter` instances accumulating listeners → missing `removeListener` calls

```javascript
// Runtime heap monitoring
const v8 = require('v8');
setInterval(() => {
  const stats = v8.getHeapStatistics();
  console.log(`Heap used: ${(stats.used_heap_size / 1024 / 1024).toFixed(1)} MB`);
}, 10000);
```

#### Go

```go
import _ "net/http/pprof"
// Then: go tool pprof http://localhost:6060/debug/pprof/heap
```

```bash
# Take a heap profile
go tool pprof -alloc_objects http://localhost:6060/debug/pprof/heap

# Compare two snapshots to find growing allocations
go tool pprof -base baseline.prof current.prof
```

What to look for:
- `alloc_objects` shows what was allocated (not just what is live)
- `inuse_objects` shows what is currently retained — use this for leak detection
- Look for goroutine leaks: `go tool pprof http://localhost:6060/debug/pprof/goroutine`

#### Java / JVM

```bash
# JVM heap dump
jmap -dump:format=b,file=heap.hprof <pid>

# Analyze with Eclipse MAT or VisualVM
# Look for: Dominator Tree (largest retained objects), Leak Suspects report
```

---

### Step 4 — Object Retention Analysis

Once the profiler shows the allocating code, identify **what is holding the reference** that
prevents GC from collecting it:

| Retention pattern | What to look for | Fix |
|------------------|-----------------|-----|
| **Event listener not removed** | `addEventListener` / `on()` without corresponding `removeEventListener` / `off()` | Add cleanup in component unmount / request teardown |
| **Closure capturing large object** | Inner function holds reference to outer scope containing large data | Break the closure chain; pass only the needed data as a parameter |
| **Circular reference** (Python 2, non-CPython) | Object A references B, B references A, neither has external references | Add `__del__` or use `weakref`; or break one direction of the cycle |
| **Cache without eviction** | Dict / Map that grows with every request/user | Add LRU eviction (`functools.lru_cache(maxsize=N)`, `lru-cache` in Node) |
| **Global accumulator** | Module-level list or dict appended to on every request | Make it request-scoped, or add periodic cleanup |
| **Thread-local storage leak** | `threading.local()` values never cleared in thread pool reuse | Explicitly clear `threading.local()` fields after each task |
| **ORM session not closed** | SQLAlchemy `Session` or Hibernate `Session` held open after request | Use context managers (`with Session() as s:`) or ensure `session.close()` in finally block |
| **File / socket descriptor leak** | Open file handles not closed | Use `with open(...)` pattern; audit `psutil.Process().open_files()` |

---

### Step 5 — Common Memory Leak Patterns by Language

#### Python-Specific

- **SQLAlchemy Session not closed**: `Session` holds identity map (all queried objects in memory) until closed. Fix: use `with Session(engine) as session:` context manager.
- **Celery task state accumulation**: `CELERY_RESULT_BACKEND` stores task results forever. Fix: set `result_expires` and periodically purge.
- **Logging handler accumulation**: `logging.getLogger().addHandler()` called on every request adds handlers without removing them. Fix: configure handlers at startup only, not per-request.
- **Django request cache not cleared**: `django.db.connection.queries` accumulates when `DEBUG=True` in production. Fix: ensure `DEBUG=False` in production.

#### Node.js-Specific

- **EventEmitter listener accumulation**: `emitter.on('event', handler)` inside a request handler adds a new listener for every request. Fix: use `emitter.once()` or remove the listener in the response handler.
- **Closure over `req`/`res`**: Callback capturing the request object holds the entire request (including body, headers) live until the callback runs. Fix: extract only the needed data from `req` before passing to callback.
- **setInterval without clearInterval**: Intervals created inside request handlers that are never cleared. Fix: clear all intervals in cleanup / shutdown logic.
- **Unhandled promise rejection**: A rejected promise with no `.catch()` holds its chain live in some Node.js versions. Fix: always handle promise rejections.

#### Go-Specific

- **Goroutine leak**: A goroutine blocked on a channel read/write with no timeout. Fix: use `context.WithTimeout` / `context.WithCancel` for all blocking operations.
- **time.Tick in a function**: `time.Tick` returns a channel that is never garbage-collected. Fix: use `time.NewTicker` and call `ticker.Stop()` in a defer.
- **sync.Pool not used for large allocations**: Large byte slices allocated per-request with no pooling. Fix: use `sync.Pool` for frequently allocated large buffers.

---

### Step 6 — Produce a Minimal Reproduction

A minimal reproduction is required before implementing a fix. It must:

1. Reproduce the growth in < 5 minutes (not hours of production traffic)
2. Require no external dependencies (no DB, no network) if possible
3. Show measurable growth with `N` iterations of the leaking operation

Template:

```python
# Python minimal reproduction template
import tracemalloc, gc

tracemalloc.start()
baseline = tracemalloc.take_snapshot()

for i in range(1000):
    # THE OPERATION THAT LEAKS
    do_leaking_operation()

gc.collect()
current = tracemalloc.take_snapshot()

top_stats = current.compare_to(baseline, 'lineno')
for stat in top_stats[:10]:
    print(stat)
```

The reproduction is valid when it shows the same object type growing as the profiler identified
in Step 3.

---

## Output Format

```
## Memory Leak Report

**Confirmed Leak:**    [yes / no — if no, state what it is instead]
**Growth Rate:**       [MB/hr or MB per N requests]
**Language:**          [Python / Node.js / Go / Java]
**Leak Location:**     [file:line — exact location of the allocating code]
**Retaining Object:**  [object type + why it is not being collected]
**Retention Pattern:** [one of: event listener, closure, cache, global accumulator, ORM session, etc.]
**Minimal Repro:**     [code snippet that reproduces growth in < 5 minutes]
**Fix:**               [exact code change — file:line:before → after]
**Blast Radius:**      [what the fix might affect — other callers, perf, behavior]
**Verification:**      [command to run the minimal repro and confirm growth stops]
**Prevention:**        [what stops this pattern from recurring — code review check or linter rule]
```

---

## Anti-Patterns

- Never label high memory usage a "leak" without confirming non-reclamation after GC.
- Never profile in production without measuring the profiler's own overhead first.
- Never fix a leak by increasing memory limits — this delays the OOM kill without addressing the cause.
- Never assume the leak is in your code — third-party C extensions and native bindings are common leak sources.
- Never skip the minimal reproduction — a fix without a repro has no verification path.
