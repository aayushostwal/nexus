# Planning Execution Checklist

Use this checklist to verify each phase of the Nexus Planning Protocol before proceeding.

---

## Pre-Planning — Context Gathering

Before producing any output, confirm all of the following:

- [ ] Read the relevant source files (not just file names — actually read the code)
- [ ] Ran `git log --oneline -20` to understand recent change patterns
- [ ] Read infra-as-code (CDK/TF/Pulumi) for any infra-touching change
- [ ] Read CI/CD config (`.github/workflows/`, `buildspec.yml`, `Jenkinsfile`) to understand deploy pipeline
- [ ] Identified all callers/consumers of the system being changed (not just the file being modified)
- [ ] Checked for existing feature flags, env vars, or config that affects the change
- [ ] Verified naming conventions, directory structure, and linting config match what the plan will produce
- [ ] Confirmed what language/framework versions are in use (check `pyproject.toml`, `package.json`, `go.mod`)
- [ ] Identified any shared libraries or internal packages that might be affected
- [ ] Asked exactly one clarifying question if a critical piece of context is missing

---

## During Planning — Scoping Table Construction

- [ ] Every task in the scoping table names a specific file or service (not a vague system area)
- [ ] Every risk level is `Low`, `Med`, or `High` with a one-sentence "what breaks if this fails" explanation
- [ ] Every dependency is named (another task number, an external team, a provisioned resource)
- [ ] No task is larger than 1 day of work — split any task that is larger
- [ ] Cross-team dependencies are called out explicitly (team name + what they must do)
- [ ] The scoping table has been presented and **you have not proceeded** past it without explicit approval

---

## During Planning — Architecture & Design

- [ ] Mermaid diagram is included for any change touching more than one service or module
- [ ] Diagram type matches the change: sequence (flows), ERD (data models), C4 (system-level overview)
- [ ] Trade-off matrix covers every major decision point (not just the recommended option)
- [ ] API contracts are defined explicitly (request/response schema, versioning)
- [ ] Schema migrations are classified: reversible or destructive, zero-downtime or not, backfill required or not
- [ ] Rollback triggers are defined for every `High` risk task

---

## Plan Review Checklist (20+ items)

Review the completed plan against every item below before presenting it:

- [ ] Each implementation step names the exact file(s) being changed
- [ ] Each implementation step names the type of change (add function, modify schema, update config)
- [ ] Each implementation step has a `Depends on:` field (or explicitly says "none")
- [ ] Each implementation step has a `Verify:` command — a concrete shell command or test, not "check it works"
- [ ] No step says "update X appropriately" or "modify as needed"
- [ ] Steps are ordered so no step depends on a later step
- [ ] The first step has no dependencies (it is always independently executable)
- [ ] The plan includes a rollback condition for every `High` risk item
- [ ] The rollback condition is an exact command or sequence, not a vague description
- [ ] An E2E test command is provided in the Validation section
- [ ] A performance baseline is included if the change touches a hot path
- [ ] For AI/LLM features: token cost estimate per call and monthly projection are included
- [ ] For infra changes: blast radius assessment (which services fail if this component goes down) is included
- [ ] For schema migrations: reversibility, zero-downtime status, and backfill requirement are stated
- [ ] For multi-team changes: team names and required approvals are listed before the execution steps
- [ ] The Mermaid diagram renders correctly (check bracket/quote balance)
- [ ] No implementation details leaked into the scoping table (scope = what, not how)
- [ ] The plan does not propose more than one architectural approach — one recommendation, clearly stated
- [ ] Total plan length is actionable — not so long it becomes a design doc, not so short it skips critical steps
- [ ] The plan can be handed to a different engineer and executed without additional verbal context

---

## Approval Gate Checklist

Do not begin execution until:

- [ ] The user has explicitly said "approved", "LGTM", "go ahead", "proceed", or equivalent
- [ ] Any concerns raised by the user about the scoping table have been addressed and re-approved
- [ ] If the plan changed significantly during review, the updated scoping table has been re-presented
- [ ] Multi-team approvals (if required) are confirmed, not just planned
