---
name: nexus-prd
description: >
  Elite PRD generation skill. Use when the user wants to write, draft, create, or generate
  a Product Requirements Document (PRD). Trigger on: "write a PRD", "create a PRD",
  "draft requirements for", "help me write product requirements", "I have a feature idea",
  "turn this into a PRD", "product spec for", "requirements doc for", "I need a PRD for".
  Also trigger when given rough notes, a feature description, or a product concept and
  asked to structure it formally. When in doubt, use this skill.
---

# Nexus PRD Writer

Translate ambiguous ideas, user feedback, and market context into a clear, agile, and actionable Product Requirements Document — the single source of truth for the product team.

---

## Skill Philosophy

**Problem:** Product teams act on ambiguous briefs, leading to misaligned engineering effort, scope creep, and unmeasurable outcomes.

**Why it matters:** A well-structured PRD reduces re-work, aligns stakeholders, and gives engineering the clarity to innovate on implementation rather than guess at intent.

**Principles:**
1. **Problem before solution** — articulate the pain, not the prescription.
2. **Ruthless prioritization** — every requirement is labeled Must-Have, High-Want, or Nice-to-Have.
3. **Measurable outcomes** — no PRD ships without KPIs and release criteria.

---

## Context Acquisition

Gather the following before generating. Extract from context first; only ask what cannot be inferred.

| Signal | How to collect |
|---|---|
| Product / feature name | User message or ask |
| Target users | User message — infer from domain if missing |
| Core problem being solved | User message — required before proceeding |
| Business goal or metric | User message — use `[Assumption to be validated]` if missing |
| Scope constraints or known out-of-scope items | User message — skip section if missing |
| Target release or milestone | User message — use `[TBD]` if missing |

**Stop and ask if:** the core problem is completely undefined or the user provides only a solution description with no user context.

---

## Execution Workflow

1. **Classify input** — determine if the input is a rough idea, structured notes, or an existing partial PRD.
2. **Extract known signals** — map user input to the 10 PRD sections; mark gaps as `[Assumption to be validated]`.
3. **Draft the PRD** — follow the Output Contract template exactly (10 sections, in order).
4. **Flag assumptions** — every inferred field is labeled inline.
5. **Surface open questions** — add a table in Section 10 for anything the user must answer before the PRD can be finalized.
6. **Deliver** — output the complete PRD as a single formatted document.

---

## Engineering Heuristics

- IF the user describes only a solution (e.g., "build a button that does X"), THEN reframe as a problem statement and ask for confirmation BECAUSE requirements must anchor on user pain, not implementation.
- IF fewer than 2 KPIs are derivable from context, THEN include placeholder metrics with `[Assumption to be validated]` BECAUSE a PRD without measurable success cannot be approved.
- IF the input mentions more than 5 features, THEN categorize them as Must-Have / High-Want / Nice-to-Have before writing requirements BECAUSE unbounded feature lists cause scope creep.
- IF no target users are specified, THEN infer 1-2 personas from domain context and label them as assumptions BECAUSE user personas are required for JTBD framing.
- IF the user provides a deadline or milestone, THEN carry it through to the Release Criteria section BECAUSE release criteria without a timeline are unenforceable.

---

## Failure Modes

| Failure Mode | Trigger Condition | Mitigation |
|---|---|---|
| Solution-first framing | User provides only a technical spec | Reframe to problem statement; ask "what pain does this solve?" |
| Missing KPIs | Business context too vague | Insert placeholder metrics with explicit `[Assumption]` labels |
| Unbounded scope | User lists 10+ features | Force Must-Have / Nice-to-Have split before writing requirements |
| No release criteria | No launch conditions given | Add a default release criteria section with `[TBD]` gates |
| Persona missing | No user info provided | Infer 1-2 personas from domain; label as assumptions |

---

## Validation

Before delivering, confirm:

- [ ] All 10 sections are present and in order
- [ ] Every inferred field is labeled `[Assumption to be validated]`
- [ ] At least 1 JTBD statement is included
- [ ] At least 2 KPIs are defined (or explicitly marked `[TBD]`)
- [ ] Must-Have / High-Want / Nice-to-Have labels applied to all functional requirements
- [ ] Out-of-scope section explicitly lists at least 1 exclusion
- [ ] Release criteria section is not empty
- [ ] Open questions table is populated with owner and deadline columns

---

## Output Contract

| Field | Required | Description |
|---|---|---|
| Title + Status + Target Release | Required | Document header |
| Overview & Business Context | Required | Elevator pitch + why now |
| Target Audience & User Profiles | Required | Personas + user goals |
| Problem Statement & JTBD | Required | Pain framing + jobs-to-be-done |
| Goals & Success Metrics | Required | Business outcomes + 2-4 KPIs |
| Product Principles | Required | 3-4 guiding trade-off principles |
| Requirements (Functional + NFRs) | Required | Prioritized feature list + perf/telemetry/security |
| UX & Interactions | Required | Key workflows + edge cases |
| Out of Scope | Required | Explicit MVC boundary |
| Release Criteria | Required | Ship conditions |
| Open Questions & Assumptions | Required | Unresolved items table with owner + deadline |

---

## PRD Template

```
**Title:** [Product/Feature Name] PRD
**Document Status:** Draft / Under Review / Approved
**Target Release:** [Milestone / Date]

### 1. Overview & Business Context
- **Purpose:** Succinct elevator pitch — what this is and why we're building it.
- **Why Now?:** Justification for prioritizing this initiative.

### 2. Target Audience & User Profiles
- **Target User(s):** Primary and secondary personas (demographics, technical proficiency, behaviors).
- **User Goals:** Underlying goals these users are trying to achieve.

### 3. Problem Statement & Opportunity
- **The Problem:** Specific pain points. Frame the problem, not the solution.
- **Jobs To Be Done:** "When [situation], I want to [motivation], so I can [expected outcome]."

### 4. Goals & Success Metrics (KPIs)
- **Business Outcomes:** Organizational goals this supports.
- **Success Metrics:** 2-4 specific, measurable KPIs.

### 5. Product Principles
- 3-4 guiding principles to help the team make trade-offs during design and development.

### 6. Requirements
**Functional Requirements:**
- [Must-Have] Feature: description and user expectation.
- [High-Want] Feature: description and user expectation.
- [Nice-to-Have] Feature: description and user expectation.

**Non-Functional Requirements:**
- **Performance:** Load times, latency limits.
- **Telemetry & Analytics:** Events to instrument for KPI tracking.
- **Security & Compliance:** Regulations, data storage constraints.

### 7. UX & Interactions
- **Key Workflows:** Step-by-step user interaction with the core feature.
- **Edge Cases:** Offline mode, invalid inputs, empty states, error paths.

### 8. Out of Scope (MVC Boundaries)
- Explicit list of features, use cases, or platforms excluded from this release.

### 9. Release Criteria
- Conditions that must be true before shipping (e.g., 0 critical bugs, load test passing, legal review).

### 10. Open Questions & Assumptions
| Question / Assumption | Owner | Deadline |
|---|---|---|
| ... | ... | ... |
```

---

## Anti-Patterns

- **Never write solution-first requirements** → Always frame requirements around user pain and expected outcomes.
- **Never leave KPIs vague** → "Improve engagement" is not a KPI; "increase DAU by 15% within 60 days of launch" is.
- **Never skip the Out of Scope section** → Scope creep starts the moment boundaries are undefined.
- **Never omit the JTBD statement** → Every PRD must anchor to at least one jobs-to-be-done framing.
- **Never produce a PRD without release criteria** → A document without ship conditions will never ship.

---

## Examples

**Input:** "I want to build a feature where users can save searches and get notified when new results match."

**Output skeleton:**
- Problem: Users repeatedly run the same searches and miss new matches.
- JTBD: "When I'm monitoring a topic over time, I want to save my search and be alerted to new results, so I can stay informed without manual effort."
- Must-Have: Save a search query with a user-defined label.
- Must-Have: Trigger notification (email/in-app) when new results match a saved search.
- High-Want: Frequency control (immediate, daily digest, weekly).
- Nice-to-Have: Shareable saved searches.
- Out of Scope: Bulk search management, team-shared searches (v1).
- KPIs: % of active users with ≥1 saved search within 30 days; notification open rate ≥ 25%.
