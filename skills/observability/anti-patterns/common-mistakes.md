# Common Mistakes in Failure Correlation Investigation

These are the most frequent errors made during distributed system failure investigations.
Each mistake is described with its consequence and the correct approach.

---

## Mistake 1: Blaming the First Service That Alerts

**What happens:** The on-call engineer receives an alert for service B and immediately digs into
service B's code and logs, assuming it is the problem. Service B is actually a victim of service A.

**Consequence:** The team fixes service B (adds retries, increases timeouts, restarts pods) while
service A — the actual origin — continues to fail. The fix has no effect. The incident extends.

**Correct approach:** Never start investigation from the alerting service. Build the full timeline
first. The origin service is identified by earliest error timestamp and absence of upstream errors
at that time — not by which service was paged first.

---

## Mistake 2: Paraphrasing Log Lines

**What happens:** Instead of copying raw log lines, an engineer summarizes: "The auth service
was getting DB errors around 2pm." The exact timestamp is lost; the exact error code is lost.

**Consequence:** Timeline alignment becomes impossible. The difference between T+00:00 and T+00:47
determines which service is the origin. Without exact timestamps, cascade direction cannot be
established.

**Correct approach:** Always copy the raw log line verbatim, including the full ISO timestamp.
If the log is too long, copy the timestamp, the error code, and the exact error message — never
substitute a paraphrase.

---

## Mistake 3: Treating Correlation as Causation Without a Call Relationship

**What happens:** Services X and Y both show elevated error rates at T+01:00. The engineer
concludes X caused Y without checking if X and Y have any call relationship.

**Consequence:** The investigation assumes a causal chain that does not exist. The actual cause
(shared infrastructure failure) is missed. The fix applied to X has no effect on Y.

**Correct approach:** Before claiming A caused B, verify that A and B have a direct or indirect
call relationship in the dependency graph. If they do not, the correct classification is
"independent failures from shared infrastructure" — not a cascade.

---

## Mistake 4: Fixing Only the Origin Service and Ignoring Propagators

**What happens:** The database connection pool is identified as the origin. The team increases
`max_connections`. The propagating cascade pattern (no circuit breakers, no fallbacks) is left
unchanged.

**Consequence:** The next time the DB has any issue — even a brief one — the cascade repeats
because there is still no mechanism to stop propagation.

**Correct approach:** Fix the origin (prevent the failure) AND fix the propagators (add circuit
breakers, fallbacks, timeouts). A fix that only addresses origin leaves the system fragile to
any future origin-level failure.

---

## Mistake 5: Skipping the Dependency Graph

**What happens:** The investigator works from memory about which services call which, or assumes
the architecture is well-known. They miss a new service added last week that is also a victim.

**Consequence:** The blast radius is understated. Affected users are not communicated to. A fix
is applied that addresses 4 of 5 affected services — the 5th continues to fail silently.

**Correct approach:** Always build the dependency graph explicitly from actual configuration —
service discovery entries, API gateway routing rules, service mesh traffic policies. Never rely
on memory.

---

## Mistake 6: Starting the Clock from the First Alert, Not the First Log Event

**What happens:** The incident timeline says "T+00:00 = PagerDuty alert fired." The actual
failure started 3 minutes earlier — but the timeline never shows the pre-alert period.

**Consequence:** The origin event (which happened before the alert) is not captured. The root
cause appears to be a downstream service because its alert fired first.

**Correct approach:** Always look backward from the first alert by at least 5–10 minutes. The
actual failure event precedes the alert by the alerting evaluation window (typically 1–5 minutes).
Set T+00:00 to the first anomalous log event, not the first alert.

---

## Mistake 7: Ignoring Blind Spots

**What happens:** Two services have no observability (no structured logs, no traces). The
investigator builds a timeline from the four services that do have data and treats it as complete.

**Consequence:** The origin might be one of the two uninstrumented services. The team fixes the
wrong service with full confidence because they never acknowledge what they do not know.

**Correct approach:** Explicitly list every blind spot in the investigation report. State:
"No data available for [service X] and [service Y] during the incident window — the origin could
be in either." Recommendations should include adding observability to blind-spot services as a
prevention measure.

---

## Mistake 8: Closing the Incident Without a Prevention Measure for Each Origin and Propagator

**What happens:** The origin is fixed, the system recovers, and the incident is closed. No
prevention measures are added. The circuit breakers, alerts, and fallbacks that would stop the
cascade are not implemented.

**Consequence:** The identical cascade recurs — often within days or weeks — because nothing
structurally changed. The next on-call engineer investigates from scratch.

**Correct approach:** The Failure Correlation Report must have a non-empty `Fix — Prevention`
entry for every ORIGIN and PROPAGATOR service before the investigation is marked complete.

---

## Mistake 9: Using Averages Instead of Percentiles

**What happens:** The investigator looks at average API latency, sees it is 200ms (slightly
elevated from 150ms baseline), and concludes the system is "mostly fine." In reality, p99 is
4,200ms because a small fraction of requests are stuck.

**Consequence:** A real user-impacting tail latency issue is dismissed because the average
looks acceptable. The investigation closes without finding the problem.

**Correct approach:** Always check p50, p95, and p99 separately. A diverging p99 (rising while
p50 is stable) is a strong signal of lock contention, GC pressure, or hot-key saturation.
Never rely on averages for latency analysis.

---

## Mistake 10: Applying a Fix During Active Failure Without Understanding the Blast Radius of the Fix

**What happens:** An engineer restarts the auth service during an active cascade, attempting
to clear its connection pool. This causes a brief complete outage of auth rather than partial
degradation — making the user impact worse.

**Consequence:** The fix itself extends or worsens the incident.

**Correct approach:** Before applying any fix during an active incident, state its blast radius:
"Restarting auth-service will cause 100% auth failure for approximately 30 seconds while it
restarts. Current state is 28% failure. This is a worse temporary state." Get explicit approval
before proceeding. Prefer fixes that do not require restarts (config changes, connection kills,
circuit breaker state changes) during active incidents.
