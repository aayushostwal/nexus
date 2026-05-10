# Common Incident Response Mistakes

Anti-patterns observed in real production incidents. Each entry includes the mistake, why engineers make it, what goes wrong, and the correct behavior.

---

## 1. Fixing Symptoms Without Finding Root Cause

**The mistake:** Seeing a pod OOM-killing and restarting all pods. Seeing high CPU and scaling out. Seeing database errors and restarting the database. The metric recovers — incident closed.

**Why engineers do it:** Under pressure, restoring service looks like success. The symptom is gone. The alert stops firing. It feels resolved.

**What goes wrong:** The root cause is untouched. The incident recurs — sometimes within hours, sometimes days later. Each recurrence trains the team that the correct response is "restart it", which is not a resolution, it is a delay. Eventually the team loses the ability to permanently fix anything because they never build the muscle for root cause analysis.

**The correct behavior:** Restarts and scaling are valid mitigations — they buy time. But they are not resolutions. After stabilizing:
1. Find the root cause before closing the incident
2. Confirm the mitigation explains the temporary recovery (the restart cleared memory, confirming a leak)
3. Log a follow-up action item for permanent fix with a due date
4. Reopen the incident if the symptom recurs before the fix is applied

**Signal that you're doing this wrong:** Your post-mortem action items say "restart the service if memory exceeds X" instead of "fix the memory leak."

---

## 2. Not Establishing a Timeline Before Investigating

**The mistake:** Alert fires. Engineer opens the monitoring dashboard and immediately starts drilling into the most recent metrics. Starts reading code without knowing when the incident started or what changed.

**Why engineers do it:** Looking at graphs is intuitive and feels productive. The timeline feels like documentation — something you do after the investigation, not before.

**What goes wrong:** Without a timeline, you investigate symptoms in isolation. You miss the correlation between a deploy 90 minutes ago and the current incident. You investigate a red herring that coincidentally shows up in the same window. Two engineers independently investigate different theories without a shared chronological baseline.

**The correct behavior:** The first thing the Scribe does is open a timeline document. The first entry is the incident start time. Before any investigation proceeds, add:
- When did the first alert fire?
- When did the first user report arrive?
- What deploys or config changes happened in the last 2 hours?
- When do the metrics show the first deviation from baseline?

The timeline is the map. Without a map, you are wandering.

**Signal that you're doing this wrong:** At the post-mortem, the team disagrees about what happened first.

---

## 3. Over-Indexing on the Last Deploy (Confirmation Bias)

**The mistake:** A deploy happened 4 hours ago. An incident starts now. Engineer immediately assumes the deploy is responsible and rolls it back — without checking whether the incident actually correlates with the deploy time.

**Why engineers do it:** The "recent change" heuristic is correct (80% of incidents do correlate with recent changes). But engineers apply it as a reflex instead of a hypothesis to verify.

**What goes wrong:** The rollback removes a valid change, creates a second deploy (which itself carries risk), and the incident continues — because it was caused by something else entirely (a cron job, a traffic spike, a third-party API change). Now you have wasted time, introduced another change event, and the team's confidence in the investigation process is damaged.

**The correct behavior:** The deploy is always the first hypothesis — not the first action. Verify the hypothesis before rolling back:
1. Does the incident start time correlate with the deploy? (Exact time match, not "it was today")
2. Does the failure affect the service areas touched by the deploy?
3. Are there other explanations? (traffic spike, time-based pattern, downstream change)

If correlation is clear → roll back immediately. If correlation is ambiguous → investigate before rolling back.

**Signal that you're doing this wrong:** You roll back a deploy and the incident doesn't resolve.

---

## 4. Not Communicating Status Updates During an Incident

**The mistake:** The engineering team is heads-down debugging. Nobody posts updates to the incident channel. Stakeholders are refreshing Slack waiting for information. Customer support doesn't know what to tell users. Leadership pages the on-call directly for status, breaking their concentration.

**Why engineers do it:** Communication feels like overhead when you're trying to fix something. Updates take time. Engineers feel they don't have enough information to say something useful.

**What goes wrong:** Information vacuum gets filled by speculation and rumor. Customer support invents explanations for users that conflict with what engineering eventually communicates. Leadership escalates unnecessarily because they have no signal. The incident duration extends because on-call attention is fragmented by status questions.

**The correct behavior:** Post an update every 15 minutes, even if the update is:
> "Still investigating. No new information. Team is actively working on root cause. Next update in 15 minutes."

A "no new information" update has positive value — it proves someone is still working on it and prevents speculation.

Assign the Incident Commander (IC) to communication. The IC does NOT debug. The IC owns: status page updates, stakeholder communication, 15-minute check-ins. This separation is critical — debugging engineers should not split attention.

**Signal that you're doing this wrong:** Stakeholders are asking on-call for status updates.

---

## 5. Skipping the Post-Mortem for "Minor" Incidents

**The mistake:** A P2 incident resolves in 20 minutes. The team collectively decides it wasn't that bad and doesn't write a post-mortem. Or a P0 post-mortem is written, but P1/P2 incidents accumulate without review.

**Why engineers do it:** Post-mortems feel like extra work. Minor incidents feel like noise. The team is busy and wants to move on.

**What goes wrong:** Minor incidents contain the most actionable learning because they haven't yet caused catastrophic damage. A P2 "service was slow for 20 minutes" is often a P0 waiting to happen if the underlying condition is not fixed. Patterns across multiple P2 incidents frequently predict a major P0 that could have been prevented. Without systematic post-mortems, the same incidents recur.

**The correct behavior:**
- Every P0 and P1: mandatory post-mortem within 48 hours, meeting with full team
- Every P2: lightweight async post-mortem — the engineer who resolved it writes a short (5-bullet) summary and creates at least one action item
- P3: optional, but log the incident and scan for patterns quarterly

**Signal that you're doing this wrong:** The same incident type has occurred more than once.

---

## 6. Rolling Back Without Confirming the Rollback Fixed the Issue

**The mistake:** Rollback is initiated. Metrics are checked once 30 seconds after rollback starts. Team declares incident resolved. Goes back to sleep. The issue wasn't actually the deploy — it was a database migration that the rollback didn't reverse. Customers are still affected.

**Why engineers do it:** Rollback is the standard playbook. It usually works. Once initiated, there's psychological relief — "we did the thing." The instinct to close the incident is strong.

**What goes wrong:** A premature "resolved" declaration creates a second incident when it becomes clear the issue persists. Trust in the on-call team erodes. The window for investigating the real cause (while context is fresh) gets lost.

**The correct behavior:** After initiating any mitigation (rollback, config revert, restart):
1. Wait 2–3 minutes for the change to propagate
2. Check the key metric that defined the incident (error rate, latency p99, etc.)
3. Confirm it has returned to baseline (not just dropped — returned to normal levels)
4. Post to incident channel: "Mitigation confirmed. Error rate: [before] → [after]. Monitoring for 10 minutes."
5. Keep monitoring for 10 minutes before declaring resolved

If the metric does not recover: the rollback was not the fix. Do not close the incident. Resume investigation.

**Signal that you're doing this wrong:** You declared an incident resolved and re-opened it within 30 minutes.

---

## 7. Investigating Without Assigning an Incident Commander

**The mistake:** Multiple engineers are all debugging independently on the same incident. No one owns communication. No one owns the timeline. No one is coordinating who is doing what.

**Why engineers do it:** In small teams, the IC role feels bureaucratic. When an incident starts, everyone jumps in to help — which feels like the right instinct.

**What goes wrong:** Duplicated effort (two engineers investigate the same hypothesis). Investigation gaps (everyone assumes someone else is looking at the database). No communication (everyone is busy debugging, no one is updating stakeholders). When the root cause is found, no one knows the full context because there was no single thread of ownership.

**The correct behavior:** Within the first 2 minutes of a P0/P1:
1. Name an Incident Commander — one person, by name
2. IC role: coordinate, communicate, manage the timeline. Does NOT debug.
3. Tech Lead role: drives the investigation. Reports findings to IC.
4. Everyone else: single assigned investigation tracks, reported back to Tech Lead.

For P2 with a single on-call engineer: the IC and Tech Lead are the same person, but the communication responsibility still exists (use an async update cadence).

**Signal that you're doing this wrong:** The post-mortem has no clear owner for the incident timeline.

---

## 8. Not Testing the Rollback Plan Before Needing It

**The mistake:** The team has a rollback procedure in the runbook that says "revert the deploy and restart the service." Nobody has ever actually tested whether this works, how long it takes, or whether there are database compatibility issues between old code and the new schema.

**Why engineers do it:** Testing rollbacks is invisible work. The service is running fine; it feels wasteful to simulate a failure. Rollback testing is almost never planned in sprint cycles.

**What goes wrong:** In a P0, you discover for the first time that:
- The old code doesn't work with the new schema (migration was destructive)
- The rollback takes 20 minutes, not the 5 minutes assumed
- The database migration cannot be reversed (no down migration written)
- The previous Docker image was deleted from the registry after 30 days

These discoveries happen at the worst possible time — during a live incident with customers affected.

**The correct behavior:**
- Every release with High or Critical risk score: test the rollback procedure in staging before deploying to production
- Database migrations: always write and test the down migration before the up migration
- Know the rollback time: measure it in staging, document it in the runbook
- Image retention: ensure previous N versions are retained in the registry

**Signal that you're doing this wrong:** The post-mortem action items include "write a down migration for the schema we deployed."

---

## 9. Alert Fatigue From Low-Specificity Alerts

**The mistake:** The team has added many alerts over time, and many of them fire frequently for non-incidents. On-call engineers start ignoring alerts or acknowledging without investigating. A real P0 fires, is ignored for 12 minutes, and causes significant damage.

**Why engineers do it:** Adding alerts feels like safety. "When in doubt, alert." Low-threshold alerts catch real issues sometimes. Nobody owns removing alerts that are noisy.

**What goes wrong:** Alert fatigue is one of the most dangerous reliability anti-patterns. Every false positive trains the on-call team to treat alerts as noise. When the critical alert arrives, the conditioned response is to snooze it.

**The correct behavior:**
- Every alert must have a runbook: "when this fires, do X"
- If an alert fires and the on-call response is "check if it's real, usually it isn't" → the alert needs tuning or removal
- Quarterly alert review: for every alert, check its firing frequency vs. times it corresponded to a real incident
- Separate: pages (must wake someone up, always actionable) from tickets (investigate next business day)
- Target: on-call engineers should sleep through most nights (P0/P1 pages only, nothing else wakes them)

**Signal that you're doing this wrong:** On-call engineers acknowledge alerts without reading them.

---

## 10. Writing Blameful Post-Mortems

**The mistake:** Post-mortem includes language like "Engineer X made an error by deploying without testing" or "The team was negligent in not catching this." Focus on what individual did wrong, not what system conditions made the failure possible.

**Why engineers do it:** When something goes wrong, the instinct is to find who is responsible. The deploy author is a visible cause.

**What goes wrong:** Blame creates fear. Fear prevents people from being honest in post-mortems. People stop raising near-misses. Engineers avoid risky but important work. The next post-mortem has less useful information because people self-censor. The system conditions that made the individual error possible are never addressed — and cause the next incident.

**The correct behavior:** Assume engineers made reasonable decisions with the information they had. The post-mortem's job is to find what system conditions made the error possible:
- Not: "X deployed without testing"
- But: "Our CI pipeline did not run the performance test that would have caught this"

- Not: "X didn't read the runbook"
- But: "The runbook was 8 pages long and didn't have a quick-reference section for this scenario"

Action items should change systems, processes, and tooling — not reprimand or retrain individuals.
