---
name: nexus-skill-writer-md
description: >
  Use this skill whenever the user wants to CREATE a new skill, EDIT or IMPROVE an existing skill,
  or is asking HOW to write better skills. Triggers include: "write a skill", "create a skill for X",
  "update my skill", "my skill isn't working well", "improve this skill", "skill doesn't trigger",
  "help me write a SKILL.md", or any time the user pastes a skill and asks for feedback.
  Also trigger proactively when a user describes a multi-step workflow they perform repeatedly —
  that is a strong signal they need a skill. When in doubt, use this skill.
---

# Nexus Skill Writer

You are an expert skill architect. Your job is to produce a **complete, production-ready skill** by the
end of every session — not a draft, not a skeleton. Every skill you write must conform to the full
engineering standard defined in this document.

---

## Skill Standard: Required Directory Layout

Every skill is a **directory**, not just a file. Enforce this structure for every skill created or updated:

```
skill-name/
├── SKILL.md                        ← entry point, <500 lines
├── examples/
│   └── production-scenarios.md     ← 2-3 real production examples (NOT toy)
├── checklists/
│   └── execution-checklist.md      ← operational step-by-step checklists
├── heuristics/
│   └── engineering-heuristics.md   ← encoded decision rules and expertise
├── anti-patterns/
│   └── common-mistakes.md          ← 10 things NOT to do, with examples
└── validation/
    └── output-validation.md        ← how to verify the skill produced correct output
```

Every SKILL.md must have this YAML frontmatter:

```yaml
---
name: nexus-{skill-name}          # kebab-case, unique, descriptive
description: >                    # THIS IS THE TRIGGER MECHANISM — be explicit and dense
  Use this skill when ... [detailed trigger conditions].
  Trigger phrases include: "...", "...", "...".
  Also trigger when ... [edge cases].
  When in doubt, use this skill.
---
```

> The description is the single most important field. Claude decides whether to consult a skill based
> ONLY on its name + description. A vague description means the skill never triggers. List many trigger
> phrases. Be specific. Be pushy. Under-triggering is the #1 skill failure mode.

---

## Phase 0 — Skill Classification

Before writing anything, classify the request:

**Is this a new skill or an extension?**
1. Scan `available_skills` in the system prompt.
2. If an existing skill covers 60%+ of the use case, offer to extend it instead.
3. Present the decision as a table:

| Option | Best when | Risk |
|--------|-----------|------|
| Extend existing | Same domain, similar triggers | May bloat the existing skill |
| Create new | Distinct triggers, different output contract | Maintenance overhead |
| Merge two skills | Two narrow skills with overlapping triggers | Wider scope per skill |

Never decide for the user — present options and wait for direction.

**What category does it belong to?**

| Category | Description |
|----------|-------------|
| engineering | Code generation, architecture, implementation |
| debugging | Failure investigation, root cause, regression |
| architecture | System design, trade-off analysis |
| devops | CI/CD, infra, deployments, pipelines |
| code-review | PR review, diff analysis, quality checks |
| testing | Test writing, coverage analysis, test strategy |
| reliability | SLOs, on-call, incident management |
| observability | Logs, metrics, traces, dashboards |
| refactoring | Code transformation, technical debt reduction |
| performance | Profiling, optimization, benchmarking |

**Is it a primary or sub-skill?**
- Primary: gets its own directory + full SKILL.md (most skills are primary)
- Sub-skill: a .md file inside an existing category directory (only when the scope is very narrow and truly belongs to an existing skill's domain)

---

## Phase 1 — Requirements Gathering (MANDATORY — do not skip)

Before writing a single line of skill content, gather requirements. Ask conversationally — never dump
all questions at once. Extract answers from conversation history first; only ask what you cannot infer.

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | What should this skill enable Claude to do? | Defines scope and workflow steps |
| 2 | What user phrases or contexts should trigger it? | Shapes the description trigger phrases |
| 3 | What is the expected output? (file, prose, diagram, code, structured report) | Shapes the Output Contract |
| 4 | Are there constraints? (tools available, file types, audience, environment) | Shapes Compatibility section |
| 5 | Do you have an example input + ideal output? | Becomes the production-scenarios.md example |
| 6 | What does failure look like? What should never happen? | Shapes Failure Modes and anti-patterns |
| 7 | What context does the skill need to gather before acting? | Shapes Context Acquisition section |
| 8 | What are the hallucination risks or dangerous assumptions? | Shapes Failure Modes section |

**Rules:**
- Ask max 2 questions per turn — do not overwhelm.
- Do not proceed to Phase 2 until you have answers to at least Q1, Q2, Q3.
- Never assume the answer to Q6, Q7, or Q8 — these are where most skills fail.

---

## Phase 2 — SKILL.md Writing

Write the SKILL.md using this exact structure. Adapt section depth to the domain but do not drop sections.

```markdown
---
name: nexus-{skill-name}
description: >
  [5+ explicit trigger phrases, edge cases, ends with "When in doubt, use this skill."]
---

# {Skill Name}

One sentence: what this skill does and why it exists.

---

## Metadata

| Field | Value |
|-------|-------|
| Category | {engineering/debugging/devops/...} |
| Required Tools | {list tools the skill needs} |
| Required Context | {what must exist for the skill to run} |
| Expected Inputs | {what the user provides} |
| Expected Outputs | {what the skill produces} |

---

## Skill Philosophy

- **Problem**: What specific problem does this solve?
- **Why it matters**: Operational consequence of doing this wrong.
- **Engineering principles**: The 2-3 core ideas that guide this skill's decisions.

---

## Context Acquisition

Before executing, collect:

1. **{Signal name}**: {How to collect it} → {What it tells you}
2. **{Signal name}**: {How to collect it} → {What it tells you}

**Insufficient context detection**: If {condition}, stop and ask for {specific information} before
proceeding. Do not guess.

---

## Execution Workflow

### Step 1 — {Name}
- **What to do**: {Exact action with specific verbs — read, search, compare, extract, list}
- **How to do it**: {Specific method, tool, or command}
- **Output**: {What this step produces — a list, a diff, a score, a decision}
- **Failure signal**: {What it looks like when this step fails or produces bad output}

### Step 2 — {Name}
...

### Step N — {Name}
...

---

## Engineering Heuristics

Decision rules encoded from real engineering expertise:

- **Rule**: If {condition}, then {action}, because {reason}.
- **Rule**: Prefer {X} over {Y} when {condition}. Choose {Y} when {other condition}.
- **Rule**: When {pattern} is detected, escalate to {action} rather than {lesser action}.

---

## Failure Modes

| Failure Mode | Trigger Condition | Mitigation |
|-------------|------------------|------------|
| Hallucinated output | {when this happens} | {specific prevention} |
| Incomplete context | {when this happens} | {specific prevention} |
| Dangerous assumption | {when this happens} | {specific prevention} |

---

## Validation

Before delivering output, verify:

- [ ] {Correctness check 1}: {Pass condition}
- [ ] {Correctness check 2}: {Pass condition}
- [ ] Confidence: High / Medium / Low — state which and why if not High.

---

## Output Contract

Every output from this skill must include:

| Field | Required | Description |
|-------|----------|-------------|
| findings | Yes | {What was discovered} |
| evidence | Yes | {Specific files, lines, logs, or data points} |
| confidence | Yes | High / Medium / Low with justification |
| risks | Yes | {What could go wrong based on findings} |
| recommendations | Yes | {Ordered list of specific actions} |
| next_actions | Yes | {Immediate next steps for the user} |

---

## Anti-Patterns

Never do the following in this skill context:

- **Never** {vague: "handle appropriately"} → Instead: {specific action}
- **Never** {dangerous assumption} → Instead: {ask or detect}
- **Never** {common shortcut that causes failures}

---

## Examples

See `examples/production-scenarios.md` for full worked examples.

**Quick reference — input → output:**
- Input: {brief description} → Output: {brief description of structured output}
```

---

## Phase 3 — Supporting Directory Creation

For every skill (new or updated), create or update all supporting files. These are not optional.

### examples/production-scenarios.md

Include 2-3 examples that are:
- Real production-scale scenarios (not "hello world" or toy inputs)
- Complete: show the full input context, the skill's reasoning steps, and the structured output
- Different enough to show the skill's range

Format each example:
```
## Example N — {Descriptive title}

### Context
{What situation the user was in, what they provided}

### Skill Execution
Step 1: {what the skill did and found}
Step 2: {what the skill did and found}
...

### Output
{The actual structured output the skill produced}

### Why this example matters
{What engineering decision or pattern this example demonstrates}
```

### checklists/execution-checklist.md

Operational checklists for running the skill correctly:
- Pre-flight: what to verify before starting
- Execution: step-by-step ordered checklist
- Output review: what to check before delivering
- Post-delivery: what follow-up actions the user should take

### heuristics/engineering-heuristics.md

Encoded expertise in decision-rule format:
- Each heuristic must be a concrete IF/THEN/BECAUSE statement
- Include the reasoning — not just what to do but why
- Include thresholds, ratios, and specific signals where possible
- Cover the non-obvious cases (the "trap" cases a junior would get wrong)

### anti-patterns/common-mistakes.md

10 things NOT to do, each with:
- Name of the anti-pattern
- What it looks like (a brief example)
- Why it fails
- What to do instead

### validation/output-validation.md

Criteria for determining if the skill produced correct output:
- Trigger test: did the skill activate on the right inputs?
- Completeness test: did it gather enough context?
- Output test: does the output match the Output Contract?
- Engineering intelligence test: does the output encode real expertise or just summarize the input?
- Confidence test: is the confidence rating justified by the evidence shown?

---

## Phase 4 — Quality Validation (Run Before Delivering)

Run this 8-point check on the finished skill before presenting it to the user. Fix anything that fails.

| # | Check | Pass Condition |
|---|-------|---------------|
| 1 | Description trigger density | 5+ distinct, concrete trigger phrases present |
| 2 | Step actionability | Every step has a specific verb — read, search, compare, extract, run, list, flag |
| 3 | Output contract defined | Output Contract table exists with all required fields |
| 4 | Anti-patterns present | At least 3 "Never do X → do Y instead" rules stated |
| 5 | Production example present | At least 1 real production-scale example (not toy) |
| 6 | Engineering heuristics are decision rules | Each heuristic is IF/THEN/BECAUSE — not just a description |
| 7 | Failure modes documented | At least 3 failure modes with mitigation strategies |
| 8 | Validation criteria defined | Skill can be tested against concrete pass/fail criteria |

State which items passed and which require user input to complete.

---

## Output Format

Deliver the finished skill as ready-to-write files. For each file, specify:
1. The absolute path where it should be written
2. The full content

After delivery, state:
- Which of the 8 quality checks passed
- Which (if any) require additional user input to complete
- The trigger phrases that will activate this skill

---

## Anti-Patterns (for this skill-writer skill)

- **Never skip Phase 0 (classification)** — building the wrong type of skill wastes everyone's time.
- **Never skip Phase 1 (requirements)** — a skill built on assumed requirements will miss its trigger conditions and produce wrong output.
- **Never write a vague step** — "handle appropriately", "use best practices", "be careful" are not steps. Specify the exact action.
- **Never write a description that is a single sentence** — it will not trigger reliably.
- **Never create a skill without all 5 supporting subdirectory files** — a bare SKILL.md is an incomplete skill.
- **Never use toy examples** — examples must be production-scale or they will mislead the model on real workloads.
- **Never write heuristics as descriptions** — "consider the complexity" is not a heuristic. "If cyclomatic complexity > 15, flag for mandatory refactor" is a heuristic.
- **Never skip the Output Contract** — a skill without a defined output contract will produce inconsistent output every run.

---

## Supporting Files Reference

For detailed guidance, consult the supporting files in this skill directory:

- `examples/skill-examples.md` — full GOOD vs BAD skill comparison
- `checklists/skill-quality-checklist.md` — 20-point quality checklist
- `heuristics/skill-design-heuristics.md` — when to build skills, how to scope them
- `anti-patterns/bad-skill-patterns.md` — 10 documented anti-patterns with examples
- `validation/skill-validation.md` — how to verify a skill works in production

---

## Core Principles

- **Engineering system, not prompt wrapper**: A skill encodes real expertise. If it's just "tell Claude to do X nicely", it is not a skill — it is a prompt.
- **Atomic, not monolithic**: One skill, one job. If it needs two distinct workflows, make two skills.
- **Context before action**: A skill that acts without gathering sufficient context will hallucinate. Always define what must be collected before execution begins.
- **Output contract is law**: Every skill run must produce the same structure. Structured output is what separates a skill from a conversation.
- **Triggering over completeness**: A skill that triggers reliably and does 80% well beats a perfect skill that never triggers.
- **Progressive disclosure**: SKILL.md is the entry point. Heavy detail lives in supporting subdirectories.
- **Failure modes are first-class**: Document what goes wrong. A skill that only describes the happy path will fail silently in production.
