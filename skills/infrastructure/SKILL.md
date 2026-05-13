---
name: nexus-infra
description: >
  Use for infrastructure design, deployment architecture, cloud cost planning, or infra audits.
  Trigger on IaC reviews, "what should I deploy with", bill spikes, production-readiness checks,
  and paid-to-cheaper replacement requests. Route to design, evaluate, or free-alternatives flow.
  When in doubt, use this skill.
---

# Nexus Infrastructure Planning

Route to the correct sub-skill based on the infrastructure request type.

---

## Compatibility
- Sub-skills: `design.md`, `evaluate.md`, `free-alternatives.md`
- Required tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
- Hands off to: `nexus:planning` after the user approves the output, for implementation steps

---

## Workflow

### Step 1 — Classify the Request

Pick exactly one track based on user intent:

| Track | Signal | Sub-skill |
|-------|--------|-----------|
| **Design** | Starting from a codebase with no infra, or asking "how to deploy", "what cloud do I need", "give me an HLD", "cost estimate" | `design.md` |
| **Evaluate** | Existing Terraform / CDK / Pulumi / K8s / docker-compose files are present; user asks to review, audit, optimize, or plan improvements | `evaluate.md` |
| **Free Alternatives** | User mentions specific paid services they want to replace; "free", "cheap", "OSS", "self-hosted", "can't afford", specific product names like Heroku/Firebase/Datadog | `free-alternatives.md` |

If the request combines tracks (e.g., "design infra but use only free tools"), run **Design** first then pipe the component list into **Free Alternatives**.

### Step 2 — Read Sub-Skill and Execute
Read the appropriate sub-skill file. Follow its numbered steps in order without skipping any.

### Step 3 — Hand Off to Planning
After the user approves the output, offer: *"Want me to hand this off to nexus:planning to produce the Terraform / CDK / deployment implementation steps?"*

---

## Output Format
Each sub-skill defines its own output format. The router produces no standalone output.

---

## Anti-Patterns
- Never recommend a cloud service without verifying its current pricing via WebSearch — prices change quarterly.
- Never produce a diagram without a cost table alongside it.
- Never mix tracks in one output — complete one sub-skill fully before starting another.
- Never skip clarifying questions in `design.md` — the wrong architecture wastes real money.
- Never evaluate infra without reading the actual files first.

---

## Examples

**"Design cloud infra for my FastAPI app"** → route to `design.md`

**"My AWS bill jumped 3x, what's wrong with my setup"** → route to `evaluate.md`

**"I want something free instead of Firebase"** → route to `free-alternatives.md`

**"Design infra for my app but I want free tools only"** → run `design.md`, then pipe component list into `free-alternatives.md`
