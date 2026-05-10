# Production Performance Scenarios

Two fully worked production performance investigations with root cause, fix, and verification.

---

## Scenario 1: Python Web Service Memory Growing by 50MB/Hour (SQLAlchemy Session Leak)

### Situation

A Python/FastAPI web service handling patient data queries is showing steadily growing memory
usage. The service starts at 180MB RSS after deployment, grows to ~400MB over 4 hours, and then
gets OOM-killed by the container runtime (memory limit: 512MB). The cycle repeats every 4 hours.
Engineers have increased the memory limit twice. The service is on Python 3.11, FastAPI 0.100,
SQLAlchemy 1.4.

### Step 1 — Confirming the Leak

| Check | Observation |
|-------|-------------|
| RSS growth pattern | Linear: +50MB/hr regardless of traffic level |
| Memory after GC (`gc.collect()`) | Memory does not drop — confirms retention, not just peak allocation |
| Growth at idle | Growth slows to +5MB/hr at idle — leak is traffic-proportional but not zero at idle |
| Heap vs RSS delta | Python heap (tracemalloc) shows 40MB; RSS shows 200MB delta → native extension or identity map |

Conclusion: Memory leak confirmed. Growth is traffic-proportional → likely per-request allocation
that is not being cleaned up.

### Step 2 — Baseline

```
After restart (idle): 182 MB RSS
After 1000 requests:  231 MB RSS
After gc.collect():   229 MB RSS    ← 47 MB not reclaimed after GC
```

### Step 3 — Profiling with tracemalloc and objgraph

```python
import tracemalloc, objgraph, gc

tracemalloc.start()
snapshot1 = tracemalloc.take_snapshot()

# Simulate 100 requests
for _ in range(100):
    process_patient_query(patient_id=1)

gc.collect()
snapshot2 = tracemalloc.take_snapshot()

top_stats = snapshot2.compare_to(snapshot1, 'lineno')
for stat in top_stats[:5]:
    print(stat)
```

Output:
```
/app/services/patient.py:34: size=12.3 MiB (+12.3 MiB), count=84320 (+84320), average=153 B
/app/db/session.py:12: size=8.1 MiB (+8.1 MiB), count=100 (+100), average=83.2 KiB
```

`objgraph.show_growth(limit=5)` output:
```
InstanceState       +100      200
Query               +4800    9600
Row                 +84000  168000
```

`InstanceState` and `Query` objects growing in proportion to request count → SQLAlchemy Session
identity map is being retained.

### Step 4 — Root Cause

Reading `/app/db/session.py`:

```python
# LEAKING CODE — session created per request, never closed
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()        # session opened
    return db                  # session returned WITHOUT closing it
```

Reading `/app/services/patient.py`:

```python
def process_patient_query(patient_id: int):
    db = get_db()
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    return patient             # session never closed; identity map holds all queried objects
```

The SQLAlchemy `Session` holds an identity map — a dictionary of all queried ORM objects — for
as long as the session is open. Since the session is never closed, the identity map grows with
every query made in the session, retaining all `Patient`, `Row`, and related ORM objects.

### Root Cause Statement

> "Memory grows by 50MB/hr because the SQLAlchemy Session is created per request but never
> closed — the session's identity map accumulates all queried ORM objects indefinitely,
> growing in proportion to the number of requests processed since the last restart."

### Step 5 — Fix

```python
# FIXED — session.py: use a context-managed generator (FastAPI pattern)
from contextlib import contextmanager

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()   # ← identity map cleared; ORM objects released for GC
```

```python
# FIXED — patient.py: use context manager
def process_patient_query(patient_id: int):
    with get_db() as db:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        return patient    # session closed after with block; objects eligible for GC
```

For FastAPI dependency injection, use the standard pattern:

```python
# FastAPI dependency — correct pattern
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/patients/{patient_id}")
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    return db.query(Patient).filter(Patient.id == patient_id).first()
```

### Minimal Reproduction

```python
import tracemalloc, gc
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine)

tracemalloc.start()

# LEAKING — session never closed
sessions = []
for _ in range(200):
    s = SessionLocal()
    sessions.append(s)   # hold reference; never close

gc.collect()
snap = tracemalloc.take_snapshot()
for stat in snap.statistics('lineno')[:3]:
    print(stat)
# Shows InstanceState objects growing with each iteration
```

### Verification

After the fix:
```
After restart (idle): 181 MB RSS
After 1000 requests:  189 MB RSS     ← 8 MB growth (normal working set, not a leak)
After gc.collect():   183 MB RSS     ← returns close to baseline
```

Growth rate: < 2 MB/hr, stable. No OOM kills in 72h monitoring period.

---

## Scenario 2: Node.js Memory Leak from EventEmitter Listener Accumulation on Request Completion

### Situation

A Node.js/Express API service shows RSS growing at approximately 30MB per 10,000 requests.
The service handles real-time progress events for long-running ML inference jobs, using an
EventEmitter to bridge the inference worker to the HTTP response stream. Under load testing
at 500 RPS, the service hits its 1GB memory limit in 18 minutes. At 50 RPS production traffic,
the limit is hit in about 3 hours.

### Step 1 — Confirming the Leak

| Check | Observation |
|-------|-------------|
| RSS growth pattern | Linear: +30MB per 10k requests |
| Memory after `global.gc()` | Drops slightly but not to baseline — reference retention |
| Heap snapshot size | v8 heap grows proportionally to request count |
| EventEmitter listener count | `progressEmitter.listenerCount('update')` grows by 2 per request |

### Step 2 — Heap Snapshot Analysis

Taking two heap snapshots (baseline and after 500 requests) in Chrome DevTools:

Objects with highest growth by count:
```
(closure)        +1,000  (2 per request × 500 requests)
EventEmitter     +1      (shared instance)
Listener         +1,000  (accumulating per request)
IncomingMessage  +0      (properly cleaned up)
```

Filtering for `(closure)` objects and inspecting their retained size reveals they each hold a
reference to an `IncomingMessage` (the HTTP request object) — holding the request body, headers,
and any large request data in memory for the lifetime of the listener.

### Step 3 — Root Cause

Reading the route handler:

```javascript
// LEAKING CODE — routes/inference.js
const progressEmitter = new EventEmitter();   // shared module-level emitter

router.get('/inference/:jobId/stream', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });

    // Listener added on every request — NEVER REMOVED
    progressEmitter.on('update', (jobId, progress) => {
        if (jobId === req.params.jobId) {          // closure captures req
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }
    });

    req.on('close', () => {
        res.end();
        // BUG: listener on progressEmitter is NOT removed here
    });
});
```

Each HTTP request adds one listener to `progressEmitter`. The listener captures `req` and `res`
in its closure. When the request ends, `req.on('close')` fires and closes `res`, but the listener
on `progressEmitter` is never removed — it remains registered and holds `req` live indefinitely.

### Root Cause Statement

> "Node.js memory grows by 30MB per 10,000 requests because a listener is registered on the
> shared `progressEmitter` for each incoming request but never removed when the request ends,
> causing the closure (which captures the full `req` object) to accumulate for the lifetime
> of the process."

### Fix

```javascript
// FIXED — routes/inference.js
router.get('/inference/:jobId/stream', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });

    // Named function so we can remove it by reference
    const onUpdate = (jobId, progress) => {
        if (jobId === req.params.jobId) {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }
    };

    progressEmitter.on('update', onUpdate);

    req.on('close', () => {
        progressEmitter.removeListener('update', onUpdate);  // ← cleanup added
        res.end();
    });
});
```

Also add a safety net to catch future leaks early:

```javascript
// Warn when listener count grows unexpectedly
progressEmitter.setMaxListeners(50);   // default is 10; triggers warning if exceeded
// Monitor listener count in health check
app.get('/health', (req, res) => {
    res.json({
        listenerCount: progressEmitter.listenerCount('update'),
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    });
});
```

### Minimal Reproduction

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();
emitter.setMaxListeners(100000);

console.log('Before:', process.memoryUsage().rss / 1024 / 1024, 'MB');

// Simulate 10,000 requests — LEAKING pattern
for (let i = 0; i < 10000; i++) {
    const fakeReq = { params: { jobId: String(i) }, data: Buffer.alloc(1024) };
    emitter.on('update', (jobId, progress) => {
        if (jobId === fakeReq.params.jobId) { /* ... */ }
    });
    // NOTE: listener never removed — simulating the bug
}

global.gc();
console.log('After 10k leaks:', process.memoryUsage().rss / 1024 / 1024, 'MB');
// Expected: +20-40MB growth
```

### Verification

After the fix:
```
Before load test:   145 MB RSS
After 50,000 requests: 152 MB RSS     ← stable, not growing
gc() afterward:     147 MB RSS        ← returns close to baseline

progressEmitter.listenerCount('update') during peak: 2-4 (concurrent requests)
progressEmitter.listenerCount('update') at idle:     0
```

### Prevention

Add an ESLint rule to require named functions for EventEmitter callbacks (enables removal):

```javascript
// .eslintrc — custom rule or comment directive
// Enforce: never use anonymous functions in emitter.on() calls
// Pattern: emitter.on('event', () => ...) → lint error
// Required: emitter.on('event', namedHandler); ... emitter.off('event', namedHandler)
```

Add a memory monitoring health check to the CI smoke test suite that fails if RSS grows
more than 5% after 1,000 requests with all connections closed.
