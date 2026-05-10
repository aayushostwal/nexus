# Incident Response Checklists

Concrete checklists for each phase of incident response. Use during an active incident. Check off items in real time — do not rely on memory under pressure.

---

## Immediate Response Checklist (First 5 Minutes)

**Run this the moment an incident is declared. Time each step.**

- [ ] Note the exact time the alert fired or you were paged: `___________`
- [ ] Confirm the incident is real — verify against a second data source (logs, dashboard, manual test)
- [ ] Classify severity: P0 / P1 / P2 / P3 (use the table in SKILL.md)
- [ ] Open the incident Slack channel: `#incident-YYYY-MM-DD-<service>`
- [ ] Post initial update to channel:
  ```
  [P?] <service> — <one-line symptom> — <your name> investigating
  ```
- [ ] Assign Incident Commander (IC) — this is NOT the same person debugging
- [ ] Assign Scribe — someone to maintain the real-time timeline document
- [ ] Start the timeline document. First entry:
  ```
  T+0:00 — Incident declared. Alert: <alert name>. Severity: P?.
  ```
- [ ] For P0/P1: page the on-call lead immediately
- [ ] For P0: notify engineering leadership
- [ ] Identify blast radius in one sentence: "Who and what is affected right now?"

**Time check: if you have spent more than 5 minutes on this list, proceed to Phase 2 immediately.**

---

## Stabilization Checklist (Mitigations Before Root Cause)

**Goal: reduce customer impact. Do not wait for root cause.**

Work through these in order. Stop at the first item that applies and execute it.

- [ ] **Check for recent deploy:**
  ```bash
  # Kubernetes
  kubectl rollout history deployment/<service-name>
  # Or check your CI/CD deploy log
  ```
  - If deploy was within the last 2 hours: **roll back now**
    - [ ] Execute rollback
    - [ ] Wait 2–3 minutes
    - [ ] Check error rate — did it drop? If yes: incident root cause is the deploy.

- [ ] **Check for recent config change:**
  - Feature flags, environment variables, secrets rotation, infrastructure config
  - If config changed: **revert now**, confirm metrics recover

- [ ] **Check for unhealthy instances:**
  ```bash
  kubectl get pods | grep -v Running
  # Or check your load balancer health checks
  ```
  - If one instance is unhealthy: drain it from load balancer, restart, confirm others healthy

- [ ] **Check for downstream dependency failure:**
  - Run health checks against: database, cache (Redis), message queue, external APIs
  - If dependency is down: activate circuit breaker or fallback behavior

- [ ] **Check for resource saturation:**
  - CPU, memory, disk I/O, network, DB connection pool
  - If connection pool exhausted: restart connection pooler, reduce concurrency
  - If memory pressure: restart affected pods (temporary relief, investigate leak)
  - If traffic spike: enable rate limiting at the load balancer level

- [ ] **Check for traffic anomaly:**
  ```bash
  # Look for unusual IPs or user agents in access logs
  # Check your load balancer access log or WAF
  ```
  - If bot traffic or spike from one source: block at WAF level

After any mitigation applied:
- [ ] Post update to incident channel: "Applied [mitigation]. Error rate: [before] → [after]."
- [ ] Add to timeline: `T+XX:XX — [mitigation] applied. Metrics: [status].`

---

## Communication Checklist (Stakeholder Updates)

**Who needs to know. What to say. When to say it.**

### Internal Communication

- [ ] **T+5 min** — Post to incident channel with current status
- [ ] **Every 15 minutes** — Post a status update even if nothing has changed:
  ```
  [Update — T+15] Still investigating. Current status: [symptom]. 
  Mitigation: [what's been tried]. Next step: [what we're doing now].
  ```
- [ ] **On resolution** — Post resolution summary:
  ```
  [Resolved — T+XX] <service> is healthy. Root cause: [one sentence]. 
  Duration: XX minutes. Post-mortem: [date].
  ```

### External Communication (for P0/P1 with user-facing impact)

- [ ] **T+10 min** — Update status page with "Investigating" status
  - Be factual: "We are investigating elevated error rates on <service>"
  - Do not speculate on root cause in public communications
- [ ] **T+30 min** — Post update to status page: "Identified" or "Monitoring a fix"
- [ ] **On resolution** — Update status page with resolution summary
- [ ] **Within 24h** — Post post-mortem summary to status page (for P0 incidents)

### Escalation Triggers

Escalate to engineering leadership if:
- [ ] Incident is P0 and duration exceeds 15 minutes
- [ ] Data loss or data corruption is confirmed or suspected
- [ ] Incident affects a regulated workload (HIPAA, PCI, SOC 2)
- [ ] On-call team has applied mitigations without resolution after 30 minutes

---

## Post-Mortem Checklist

**Complete within 48 hours of incident resolution. No exceptions for P0/P1.**

### Scheduling
- [ ] Post-mortem meeting scheduled within 48 hours
- [ ] All participants invited: IC, Tech Lead, Scribe, and any engineers who participated
- [ ] Blameless framing communicated before the meeting

### Document Preparation (before the meeting)
- [ ] Timeline reviewed and finalized (Scribe's notes + monitoring data)
- [ ] Root cause confirmed and written as a one-sentence mechanism statement
- [ ] Impact calculated: duration × affected users × revenue impact (if known)
- [ ] Draft of "what went well" and "what went poorly" prepared

### Meeting Agenda
- [ ] Walk the timeline together — ensure everyone agrees on sequence of events
- [ ] Review root cause — does it explain all symptoms and the resolution?
- [ ] Identify: why didn't we catch this before it reached production?
- [ ] Identify: why did it take as long as it did to detect?
- [ ] Identify: why did it take as long as it did to mitigate?
- [ ] Generate action items — each must have an owner and due date

### Action Item Quality Check
For each action item, verify:
- [ ] Is it preventive (stops recurrence) or detective (catches it earlier)?
- [ ] Does it have a single named owner (not a team)?
- [ ] Does it have a due date (not "soon" or "next sprint")?
- [ ] Is it verifiable — will we know when it's done?

### Document Finalization
- [ ] Post-mortem document published to team wiki or runbook repository
- [ ] Action items added to the team's issue tracker
- [ ] Document shared with relevant stakeholders
- [ ] For P0 incidents: summarized and shared with leadership

### 30-Day Follow-up
- [ ] Schedule 30-day check: have all action items been completed?
- [ ] If recurring pattern: add to reliability review agenda

---

## Runbook Review Checklist

**Run after every P0/P1 incident to keep runbooks current.**

- [ ] Does a runbook exist for this type of incident?
  - If no: create one. A new runbook is always an action item from a P0/P1.
- [ ] Is the runbook accurate based on what you learned in this incident?
- [ ] Did the runbook help on-call respond faster? If not, what was missing?
- [ ] Are the escalation paths in the runbook current? (correct names, Slack channels, pager contacts)
- [ ] Does the runbook include the mitigation steps that worked in this incident?
- [ ] Update the runbook. Commit the change. Add to post-mortem action items if significant.
