# Failure Correlation Investigation Checklist

Run through this checklist in order before closing any failure correlation investigation.
Every item must be explicitly confirmed or marked N/A with a reason.

---

## Phase 1 — Data Collection

- [ ] Raw logs collected from **all** affected services (not summarized)
- [ ] Timestamps confirmed to be in the same timezone (UTC preferred)
- [ ] Distributed traces captured for at least 3 failing requests
- [ ] Metrics snapshots captured: error rate, p99 latency, RPS, CPU, memory, connection pool
- [ ] Dependency map obtained (which service calls which)
- [ ] Recent changes catalogued: deployments, config, feature flags, cron jobs, infra changes (4h window)
- [ ] Alert firing order recorded (time + alert name per service)
- [ ] Blind spots identified: services or time windows with no data explicitly noted

---

## Phase 2 — Timeline

- [ ] Timeline table built with one row per distinct event per service
- [ ] First occurrence of elevated error/latency recorded (not peak)
- [ ] Timestamps from traces used where they conflict with log timestamps
- [ ] At least T+00:00 (origin event) through T+resolved rows present
- [ ] Gaps in data explicitly annotated in the timeline

---

## Phase 3 — Origin Identification

- [ ] Service with the earliest elevated error signal identified
- [ ] Confirmed that no upstream service was erroring at the time of the candidate's failure
- [ ] Confirmed the error type is local (not an upstream HTTP error being forwarded)
- [ ] Metrics confirm resource saturation at the origin before errors appeared
- [ ] Origin statement written: "[Service X] is the origin because [metric] at [T+XX:XX]"

---

## Phase 4 — Failure Classification

- [ ] Failure mode classified: Linear cascade / Fan-out cascade / Independent / Thundering herd / Brownout
- [ ] Dependency graph drawn with all affected services
- [ ] Each service labelled: ORIGIN / PROPAGATOR / VICTIM
- [ ] No service labelled without evidence from the timeline

---

## Phase 5 — Root Cause and Blast Radius

- [ ] Root cause stated in the required format: "[X] failed because [mechanism] when [trigger]..."
- [ ] Blast radius table complete: all affected services with role, peak error rate, user impact
- [ ] Fix recommendation written for each ORIGIN and PROPAGATOR service (not just the origin)
- [ ] Prevention measures written for at least the origin service

---

## Phase 6 — Output

- [ ] Failure Correlation Report filled out (all fields, no blanks)
- [ ] Blind spots explicitly listed in the report
- [ ] No fix applied to a VICTIM service without also fixing the ORIGIN
- [ ] Investigation handed to `nexus:debugging` if single-service root cause analysis is still needed
- [ ] User confirmed next step before closing

---

## Pre-Fix Gate

Do not implement any fix until all of these are true:

- [ ] Root cause statement is written and reviewed
- [ ] The service being fixed is ORIGIN or PROPAGATOR (not just VICTIM)
- [ ] Blast radius of the fix itself is assessed (what else does this change affect?)
- [ ] User has approved the fix
