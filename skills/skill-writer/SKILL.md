---
name: nexus-skill-writer-md
description: >
  Use for creating, refactoring, or debugging skills and improving SKILL.md trigger quality.
  Trigger on "write/create/update/improve skill", trigger-miss complaints, pasted-skill feedback,
  or repeated workflows that should be skillized. Output production-ready skill structure and routing logic.
  When in doubt, use this skill.
---

# Nexus Skill Writer

Produce a **complete, production-ready skill** every session — not a draft, not a skeleton.

---

## Required Directory Layout

```
skill-name/
├── SKILL.md                        ← entry point, <500 lines
├── checklists/
│   └── execution-checklist.md
├── anti-patterns/
│   └── common-mistakes.md
└── validation/
    └── output-validation.md
```

Every SKILL.md must have YAML frontmatter:

```yaml
---
name: nexus-{skill-name}          # kebab-case, unique, descriptive
description: >                    # THE TRIGGER MECHANISM — be explicit and dense
  Use this skill when ... [detailed trigger conditions].
  Trigger phrases include: "...", "...", "...".
  Also trigger when ... [edge cases].
  When in doubt, use this skill.
---
```

The `description` is the single most important field. Claude selects skills based only on name + description. A vague description means the skill never triggers. Under-triggering is the #1 skill failure mode.

---

## Phase 0 — Skill Classification

Before writing anything, classify the request:

**New skill or extension?**
1. Scan `available_skills` in the system prompt.
2. If an existing skill covers 60%+ of the use case, offer to extend instead.
3. Present options as a table:

| Option | Best when | Risk |
|--------|-----------|------|
| Extend existing | Same domain, similar triggers | May bloat the existing skill |
| Create new | Distinct triggers, different output contract | Maintenance overhead |
| Merge two skills | Overlapping triggers, narrow scopes | Wider scope per skill |

Never decide for the user — present options and wait for direction.

**Category:**

| Category | Description |
|----------|-------------|
| engineering | Code generation, architecture, implementation |
| debugging | Failure investigation, root cause, regression |
| devops | CI/CD, infra, deployments |
| code-review | PR review, diff analysis, quality checks |
| testing | Test writing, coverage, test strategy |
| reliability | SLOs, on-call, incident management |
| observability | Logs, metrics, traces, dashboards |
| refactoring | Code transformation, technical debt |
| performance | Profiling, optimization, benchmarking |

**Primary or sub-skill?** Primary = own directory + full SKILL.md. Sub-skill = .md inside an existing skill directory (only for very narrow, truly subordinate scope).

---

## Phase 1 — Requirements Gathering (MANDATORY)

Ask conversationally — max 2 questions per turn. Extract answers from context first; only ask what you cannot infer. Do not proceed to Phase 2 without answers to Q1, Q2, Q3.

| # | Question | Why |
|---|----------|-----|
| 1 | What should this skill enable Claude to do? | Defines scope |
| 2 | What phrases/contexts should trigger it? | Shapes description |
| 3 | What is the expected output format? | Shapes Output Contract |
| 4 | Are there constraints? (tools, env, audience) | Shapes Compatibility |
| 5 | Example input + ideal output? | Becomes a production example |
| 6 | What does failure look like? What must never happen? | Shapes Failure Modes |
| 7 | What context must be gathered before acting? | Shapes Context Acquisition |
| 8 | What are the hallucination risks or dangerous assumptions? | Shapes Failure Modes |

Never assume answers to Q6, Q7, or Q8.

---

## Phase 2 — SKILL.md Writing

Use this exact section order. Adapt depth to domain; do not drop sections.

Required sections (in order):
1. **YAML frontmatter** — `name` + `description` (5+ trigger phrases, ends with "When in doubt, use this skill.")
2. **One-liner** — what this skill does and why it exists.
3. **Metadata table** — Category, Required Tools, Required Context, Expected Inputs, Expected Outputs.
4. **Skill Philosophy** — Problem, Why it matters, 2-3 Engineering principles.
5. **Context Acquisition** — Named signals with collection methods + explicit "stop and ask" rule for insufficient context.
6. **Execution Workflow** — Numbered steps, each with: What (specific verb), How (tool/command), Output, Failure signal.
7. **Engineering Heuristics** — IF/THEN/BECAUSE rules with thresholds. No descriptions — only decision rules.
8. **Failure Modes** — Table: Failure Mode | Trigger Condition | Mitigation (3+ rows).
9. **Validation** — Checkbox list of pass/fail criteria including a Confidence rating.
10. **Output Contract** — Table of every output field: name, required/optional, description. Fields: findings, evidence, confidence, risks, recommendations, next_actions.
11. **Anti-Patterns** — "Never X → Instead Y" rules (3+ rules).
12. **Examples** — At least 1 production-scale input → output reference.

---

## Phase 3 — Supporting Directory Creation

Create or update all supporting files for every skill. These are not optional.

### checklists/execution-checklist.md
- Pre-flight: what to verify before starting
- Execution: ordered step-by-step checklist
- Output review: what to check before delivering
- Post-delivery: follow-up actions for the user

### anti-patterns/common-mistakes.md
10 things NOT to do, each with: name, what it looks like, why it fails, what to do instead.

### validation/output-validation.md
- Trigger test: does the skill activate on the right inputs?
- Completeness test: did it gather enough context?
- Output test: does output match the Output Contract?
- Engineering intelligence test: does output encode real expertise?
- Confidence test: is the confidence rating justified by evidence?

---

## Phase 4 — Quality Validation (Run Before Delivering)

| # | Check | Pass Condition |
|---|-------|---------------|
| 1 | Description trigger density | 5+ distinct, concrete trigger phrases |
| 2 | Step actionability | Every step has a specific verb — read, search, compare, extract, run, list, flag |
| 3 | Output contract defined | Output Contract table exists with all required fields |
| 4 | Anti-patterns present | 3+ "Never do X → do Y instead" rules |
| 5 | Production example present | 1+ real production-scale example (not toy) |
| 6 | Engineering heuristics are decision rules | Each heuristic is IF/THEN/BECAUSE |
| 7 | Failure modes documented | 3+ failure modes with mitigations |
| 8 | Validation criteria defined | Concrete pass/fail criteria for testing the skill |

State which items passed and which require user input to complete.

---

## Output Format

Deliver finished skill as ready-to-write files. For each file specify:
1. Absolute path where it should be written
2. Full content

After delivery, state:
- Which of the 8 quality checks passed
- Which (if any) require additional user input
- The trigger phrases that will activate this skill

---

## Anti-Patterns (for this skill)

- **Never skip Phase 0** — building the wrong skill type wastes everyone's time.
- **Never skip Phase 1** — skills built on assumed requirements miss their triggers.
- **Never write a vague step** — "handle appropriately" is not a step. Specify the exact action.
- **Never write a single-sentence description** — it will not trigger reliably.
- **Never omit the Output Contract** — a skill without one produces inconsistent output every run.
- **Never use toy examples** — examples must be production-scale.
- **Never write heuristics as descriptions** — "consider complexity" is not a heuristic; "if cyclomatic complexity > 15, flag for mandatory refactor" is.

---

## Core Principles

- **Engineering system, not prompt wrapper**: A skill encodes real expertise. "Tell Claude to do X nicely" is a prompt, not a skill.
- **Atomic, not monolithic**: One skill, one job. Two distinct workflows = two skills.
- **Context before action**: A skill that acts without sufficient context will hallucinate.
- **Output contract is law**: Every skill run must produce the same structure.
- **Triggering over completeness**: A skill that triggers reliably at 80% beats a perfect skill that never triggers.
- **Failure modes are first-class**: Document what goes wrong. Happy-path-only skills fail silently in production.
