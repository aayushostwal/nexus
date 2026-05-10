# Performance Heuristics

Fast pattern-matching rules for diagnosing performance issues before full investigation.
Each heuristic includes the signal, the conclusion it supports, and the verification step.

---

## Memory Heuristics

### Heuristic M1: RSS Grows but Heap is Stable → Native/C Extension Leak

**Signal:** Process RSS is climbing steadily, but the runtime's own heap measurement (Python's
`tracemalloc`, Node.js `heapUsed`, Go's `runtime.MemStats.HeapInuse`) remains relatively stable
or grows much more slowly than RSS.

**Conclusion:** The leak is outside the managed heap — in a native C extension, a compiled
Cython module, a Node.js native addon, or a Go CGO library. Python examples: `numpy`, `Pillow`,
`lxml`, `psycopg2`. Node.js examples: `sharp`, `canvas`, `bcrypt` (native), `sqlite3`.

**Verification:**
1. List all native extensions: `python -c "import pkg_resources; [print(d) for d in pkg_resources.working_set if d.location.endswith('.so')]"`
2. Remove one native extension at a time from the code path and observe if growth stops
3. Check the extension's GitHub Issues for known memory leak reports

**Fix direction:** Report the leak to the extension maintainer. In the interim, implement a
process restart on a schedule (e.g., graceful restart every 24h) to bound the OOM risk.

---

### Heuristic M2: GC Runs but Memory Does Not Drop → Reference Retention (Closure or Global)

**Signal:** GC is running (GC pause metrics confirm collections are happening, or `gc.collect()`
is called manually), but RSS or heap memory does not decrease meaningfully after collection.

**Conclusion:** Objects are being retained by a live reference — GC cannot collect them because
something still holds a pointer. Common culprits: closure variables, module-level dicts/lists,
class-level state, thread-local storage, or the identity map of an ORM session.

**Verification:**
1. Run `objgraph.show_growth()` before and after GC — objects that survive GC are the leak candidates
2. Look for module-level mutable state: `grep -r "^[A-Z_]* = \[\|^[A-Z_]* = {" . --include="*.py"`
3. Check if the growing object type has any global or class-level references to it

**Fix direction:** Find the root reference. Use `objgraph.show_backrefs()` to trace the reference
chain from the leaked object back to the root that is keeping it alive.

---

### Heuristic M3: Memory Growth Rate Exactly Proportional to Request Count → Per-Request Allocation Not Freed

**Signal:** Plotting memory growth vs. cumulative request count produces a straight line with a
fixed slope (e.g., exactly 3KB per request, or 50KB per 100 requests).

**Conclusion:** A fixed-size allocation is made per request and never freed. Common patterns:
adding to a module-level list per request, creating a new DB session per request and not closing
it, or registering a callback per request without cleanup.

**Verification:**
1. Calculate the per-request leak size: `(MB_after - MB_before) / request_count`
2. Use `tracemalloc` with allocation tracking to identify the exact allocation per request
3. The leaking allocation typically matches the calculated per-request size

---

### Heuristic M4: Memory Growth Stops at a Fixed Ceiling → Cache or Pool, Not a Leak

**Signal:** RSS or heap grows from startup to some ceiling (e.g., 400MB) and then remains stable.

**Conclusion:** This is not a memory leak. A cache has filled to its maximum size, a connection
pool is fully allocated, or a fixed-size pre-allocation was made. This is expected behavior.

**Verification:**
1. Check for LRU cache configurations: `@functools.lru_cache(maxsize=N)` — memory grows until N items are cached
2. Check connection pool `pool_size` setting — pool allocates all connections at startup or first use
3. Monitor for a few hours — if memory stays stable at the ceiling, it is bounded

**Action:** Document the ceiling as expected behavior. Set a memory limit with headroom above it.

---

### Heuristic M5: Heap Dump Shows Many Small Objects of the Same Type → Identity Map or Cache Without Eviction

**Signal:** A heap snapshot or `tracemalloc` output shows tens of thousands of instances of the
same class (e.g., `Row`, `Patient`, `InstanceState`, `ModelInstance`).

**Conclusion:** An ORM identity map, a result cache, or an in-memory accumulator is retaining
all instances of this type without eviction.

**Verification:**
1. Check if the class is an ORM model class — SQLAlchemy, Django ORM, and Hibernate all maintain identity maps
2. Check if a session or unit-of-work is being kept open across multiple requests
3. Count instances: `len(objgraph.by_type('Patient'))` — compare before and after requests

---

## CPU Heuristics

### Heuristic C1: CPU Spike Correlates with Traffic → Algorithmic Complexity Issue (O(n²) or N+1)

**Signal:** CPU usage rises and falls proportionally to request rate. At 100 RPS, CPU is 40%.
At 200 RPS, CPU is 80% (doubling — linear). Or: at 100 RPS with 100-item payloads, CPU is 20%;
at 100 RPS with 1000-item payloads, CPU is 200% (10× increase for 10× data — quadratic).

**Conclusion if linear:** The per-request work is roughly constant — normal scaling behavior.
CPU is the bottleneck; add capacity or reduce per-request cost.

**Conclusion if superlinear (CPU grows faster than traffic):** Algorithmic complexity issue —
likely O(n²) (nested loop over the input), N+1 query, or exponential recursion. The fix is
algorithmic, not scaling.

**N+1 Query detection:**
```python
# Django — enable query counting per request
from django.db import connection
print(len(connection.queries))  # count DB queries per request

# SQLAlchemy — log all queries
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

If the number of DB queries per request grows with the size of the input list → N+1 query.

---

### Heuristic C2: CPU Spike Independent of Traffic → Runaway Process, Tight Loop, or GC Pressure

**Signal:** CPU is high but request rate is low or zero. The spike persists even after traffic
stops. Or: CPU spikes at fixed intervals regardless of traffic.

**Conclusion:** A background process, a tight retry loop, or GC pressure is consuming CPU
independently of requests.

**Verification:**
1. Sample the stack at the CPU spike: `py-spy top --pid <pid>` (Python), `rbspy` (Ruby), `async_profiler` (JVM)
2. Look for: tight retry loops with no backoff, scheduled tasks running expensive operations, or GC pause metrics spiking
3. Check GC stats: if GC time is > 20% of wall time, GC is causing the CPU pressure

**Fix direction:** For GC pressure — reduce allocation rate (pool objects, reuse buffers). For
tight loops — add exponential backoff with jitter. For scheduled tasks — move to off-peak hours.

---

### Heuristic C3: CPU Spike After a Specific Event → One-Time Expensive Operation

**Signal:** CPU is normal, then spikes to 100% for 5–30 seconds after a specific trigger
(a deployment, the first request to a new endpoint, a cache flush, or a user action).

**Conclusion:** An expensive one-time operation is being triggered synchronously: initial cache
warm-up, model loading, index rebuild, or database migration.

**Fix direction:** Move the operation to a background job or startup hook. Cache the result.
Use lazy initialization with a lock to prevent thundering herd on first access.

---

## Latency Heuristics

### Heuristic L1: p50 Fine, p99 High → Tail Latency (Lock Contention, GC Pause, Hot Key)

**Signal:** p50 latency is normal (e.g., 20ms), but p99 is elevated by 5–50× (e.g., 400ms).
Most users are fine; a small fraction of requests are very slow.

**Conclusion:** A fraction of requests are hitting a slow path. Common causes:
- **Database lock contention**: concurrent requests locking the same row
- **GC pause**: periodic GC stops all goroutines/threads for 10–200ms
- **Hot key in cache**: one key receives many simultaneous reads, causing serialization
- **Retry amplification**: slow requests trigger retries that compound the latency

**Verification:**
1. Sample slow traces specifically — filter your tracing tool for requests with p99 latency
2. Check DB lock wait time: `SELECT * FROM pg_locks WHERE NOT granted`
3. Check GC pause logs for Java/Go at the same time as p99 spikes
4. Check if the slow requests cluster around specific inputs (user IDs, tenant IDs, resource IDs)

---

### Heuristic L2: Latency Regression Exactly After a Deployment → New Code Introduced Slow Path

**Signal:** p99 or p50 latency was stable for days, then increased exactly at the time of a
deployment. No infrastructure changes were made.

**Conclusion:** The deployment introduced a slower code path. Most common causes: a new ORM
query without proper indexing, a new external HTTP call added to a synchronous request handler,
or an expensive computation added to the hot path.

**Verification:**
1. `git log --oneline` — find the exact commit deployed
2. `git diff <previous-commit>..<deployment-commit>` — identify new DB queries, HTTP calls, or heavy computations
3. Profile the specific endpoint that regressed using a load test

---

### Heuristic L3: N+1 Query Pattern Detection

**Signal:** DB query count per request grows linearly with the size of a collection in the response.
Fetching 10 items makes 11 queries; fetching 100 items makes 101 queries.

**Verification command (Python/SQLAlchemy):**

```python
from sqlalchemy import event
query_count = []

@event.listens_for(engine, "before_cursor_execute")
def count_queries(conn, cursor, statement, parameters, context, executemany):
    query_count.append(1)

# Run the operation
result = fetch_user_with_orders(user_ids=[1, 2, 3, 4, 5])
print(f"Queries executed: {len(query_count)}")   # should be 1 or 2, not 6+
```

**Fix:** Use eager loading (`joinedload`, `selectinload` in SQLAlchemy) or batch fetching
to replace N individual queries with one batch query.

---

### Heuristic L4: Latency High Only on First Request to Each New Endpoint → Cold Start or Lazy Initialization

**Signal:** The first request to a specific endpoint is slow (5–30s). Subsequent requests are fast.
This repeats for the first request after a service restart.

**Conclusion:** Lazy initialization on the hot path — model loading, DB schema introspection,
first connection pool allocation, or JIT compilation (JVM/PyPy warm-up).

**Fix direction:** Move initialization to service startup (`@app.on_event("startup")` in FastAPI,
`ApplicationReadyEvent` in Spring). Use health checks that confirm the service is warm before
receiving traffic.
