# Planning Output Validation

How to verify that a plan produced by the Nexus Planning Protocol is complete and ready to execute.

---

## Structural Completeness Check

A complete plan must contain all of the following sections. If any are missing, the plan is incomplete:

| Section | Required? | Minimum content |
|---------|-----------|----------------|
| Scoping Table | Always | At least 1 row with all 5 columns populated |
| Architecture Diagram | If > 1 service/module touched | Valid Mermaid syntax, correct diagram type |
| Trade-off Matrix | If > 1 viable approach existed | At least 2 options, includes a Verdict column |
| Implementation Steps | Always | Numbered, ordered, with file + change type + depends + verify |
| Validation | Always | E2E command, performance baseline (if applicable), rollback condition |

---

## Scoping Table Validation

For each row in the scoping table, verify:

- [ ] **Task** — names a specific action (verb + noun), not a category ("Update auth" not "Authentication")
- [ ] **System Impact** — names a specific file or service, not a layer ("app/auth.py" not "auth layer")
- [ ] **Risk Level** — is exactly `Low`, `Med`, or `High` followed by a "what breaks" sentence
- [ ] **Dependencies** — names a specific step number, team name, or "None"
- [ ] **Status** — is `Proposed` before approval, `Approved` after, `In Progress` or `Done` during execution

---

## Implementation Steps Validation

For each numbered step, verify:

- [ ] Names the exact file(s) to change (full path preferred, basename acceptable if unambiguous)
- [ ] Names the type of change (add function, modify schema, update env config, create resource)
- [ ] Has `Depends on: [step N]` or `Depends on: none`
- [ ] Has `Verify: [exact shell command or test invocation]`
- [ ] The verify command is self-contained — it can be run as written without additional setup
- [ ] No step depends on a later step (topological ordering is correct)
- [ ] Step 1 has no dependencies

**Red flags that indicate incomplete steps:**
- "Update X appropriately" — no file named, no change type
- "Verify: it works" — not a command
- "Depends on: previous steps" — not specific
- "Modify the configuration" — no file named

---

## Validation Section Check

- [ ] E2E test command is a runnable shell command (not a description)
- [ ] Performance baseline is a specific metric with a specific target (not "should be fast")
- [ ] Every `High` risk step has a rollback condition in the format: `if [signal] → [exact command]`
- [ ] Rollback commands are specific enough to execute under production incident conditions

---

## Specialization Validation

Apply the relevant checks based on the type of change:

**AI/LLM features:**
- [ ] Token cost per call is estimated
- [ ] Monthly cost projection at expected load is included
- [ ] Latency p95 target is specified

**Infrastructure changes:**
- [ ] Blast radius assessment names which services fail if this component goes down
- [ ] IAM scoping is mentioned (least-privilege principle applied?)
- [ ] Terraform/CDK plan output is used as a verify step before apply

**Schema migrations:**
- [ ] Migration is classified as reversible or destructive
- [ ] Zero-downtime status is stated (yes/no and how)
- [ ] Backfill requirement is stated (none, automated, manual)
- [ ] The migration step is sequenced before the code step that depends on the new schema

**Multi-team changes:**
- [ ] Each affected team is named
- [ ] Required approval from each team is listed as a task or dependency
- [ ] Communication timing is specified (before deploy? before step N?)

---

## Final Readiness Gate

A plan is ready to present when every item below is true:

- [ ] The plan can be handed to a different engineer and executed with no additional verbal context
- [ ] No step requires the executor to make an architectural decision (those decisions are made in the plan)
- [ ] The rollback path is as detailed as the forward path
- [ ] The plan does not contain the phrases: "appropriately", "as needed", "update accordingly", "handle the case", "usual setup", or "standard approach" — each of these is a sign that a decision was deferred instead of made
