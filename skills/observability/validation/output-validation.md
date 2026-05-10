# Output Validation — Failure Correlation Report

Use this checklist to validate a completed Failure Correlation Report before presenting it.
Every item must pass. If any item fails, the report is incomplete — do not present it.

---

## Completeness Checks

- [ ] **Outcome** is one sentence and describes what was found, not just "investigation complete"
- [ ] **Failure Mode** is one of the five valid classifications: Linear cascade / Fan-out cascade / Independent / Thundering herd / Brownout
- [ ] **Origin Service** names a specific service AND a specific metric/event (not just "the database")
- [ ] **Trigger** explains what caused the origin service to fail — a mechanism, not a description of symptoms
- [ ] **Timeline** has at least 4 rows spanning from the first anomalous event to recovery
- [ ] **Causal Chain** shows directional arrows (→) between services with a failure mode label at each hop
- [ ] **Blast Radius** table has one row per affected service with role, peak error rate, and user impact
- [ ] **Fix — Immediate** has at least one action per ORIGIN service
- [ ] **Fix — Prevention** has at least one action per ORIGIN and PROPAGATOR service
- [ ] **Blind Spots** is either a list of uninstrumented services/windows, or explicitly states "none — full observability available"
- [ ] **Next Step** is one specific action for the user

---

## Accuracy Checks

- [ ] The Origin Service is the one with the earliest error signal on the timeline — not the one that alerted first
- [ ] Every service in the Blast Radius table is either ORIGIN, PROPAGATOR, or VICTIM — not unlabelled
- [ ] The Failure Mode classification is consistent with the Timeline pattern (e.g., "fan-out" requires multiple simultaneous victims, not a sequential chain)
- [ ] Root cause is stated as "[X] failed because [mechanism] when [trigger]" — not as a symptom description
- [ ] No fix is proposed for a VICTIM service without also proposing a fix for the ORIGIN that caused the victimization
- [ ] All timestamps in the timeline use the same timezone
- [ ] Timeline events use the first occurrence of each signal, not the peak

---

## Quality Checks

- [ ] The report can be read and understood by an engineer who was not involved in the investigation
- [ ] The causal chain diagram would allow a new team member to understand why user X experienced problem Y
- [ ] Prevention measures are specific and actionable (not "add better monitoring" — instead "alert when Redis connection pool exceeds 80%")
- [ ] No field contains the word "maybe", "possibly", or "might" without an explicit statement of what evidence would confirm or refute the hypothesis
- [ ] If multiple origin candidates exist, both are named with the evidence for and against each

---

## Anti-Pattern Checks

- [ ] No service is blamed based solely on alert order — only on timeline evidence
- [ ] No log timestamps are paraphrased — all timeline entries use raw timestamps
- [ ] No claim of causation exists without a verified call relationship between the services
- [ ] No fix was applied to a VICTIM-only service
- [ ] No blind spots were treated as "clean windows" in the timeline

---

## Failure Mode Validation Rules

If the classified failure mode is **Fan-out cascade**, verify:
- At least 2 victim services have no direct call relationship to each other
- Both victims share a call relationship to the origin
- Victim error spikes are within 60 seconds of each other

If the classified failure mode is **Linear cascade**, verify:
- Services appear in the timeline in order of their call depth
- Delays between service spikes are consistent with timeout values
- p99 latency rose before error rate rose at each propagator

If the classified failure mode is **Thundering herd**, verify:
- Error rate shows a wave pattern (spike → brief drop → spike) at least twice
- Retries or circuit breaker half-open events appear in the timeline
- The triggering event was a cache miss or circuit breaker open, not a hard failure

If the classified failure mode is **Independent failures**, verify:
- Affected services have no shared call path
- A shared infrastructure event (cloud provider issue, network partition, DNS) is identified
- The cloud provider status page was checked and referenced
