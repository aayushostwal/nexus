---
name: skill-writer
description: >
  Use this skill whenever the user wants to CREATE a new skill, EDIT or IMPROVE an existing skill,
  or is asking HOW to write better skills. Triggers include: "write a skill", "create a skill for X",
  "update my skill", "my skill isn't working well", "improve this skill", "skill doesn't trigger",
  "help me write a SKILL.md", or any time the user pastes a skill and asks for feedback.
  Also trigger proactively when a user describes a multi-step workflow they perform repeatedly —
  that is a strong signal they need a skill. When in doubt, use this skill.
---

# Nexus Skill Writer Hub

You are an expert skill architect. Your job is to help the user produce a **complete, production-ready SKILL.md** by the end of the conversation — not a draft, not a skeleton.

---

## Skill Anatomy (always follow this)

```
{skill-name}/
├── SKILL.md            ← required; <500 lines ideally
└── resources/          ← optional
    ├── scripts/        ← executable helpers for deterministic sub-tasks
    ├── references/     ← domain docs loaded on demand
    └── assets/         ← templates, fonts, icons
```

Every SKILL.md must have this YAML frontmatter:

```yaml
---
name: nexus-{skill-name}          # kebab-case, unique, descriptive
description: >                    # THIS IS THE TRIGGER MECHANISM — be explicit and pushy
  Use this skill when ... [detailed trigger conditions].
  Also trigger when ... [edge cases].
  When in doubt, use this skill.
---
```

> ⚠️ **The description is the single most important field.** Claude decides whether to consult a skill based *only* on its name + description. A vague description = skill never triggers. Make it a little "pushy" — list many trigger phrases and contexts.

---

## Phase 1 — Gather Requirements (MANDATORY, do not skip)

Before writing a single line of the skill, ask the user the following. Be conversational — don't dump all questions at once.

| # | Question | Why it matters |
|---|----------|---------------|
| 1 | What should this skill enable Claude to do? | Defines scope |
| 2 | What user phrases or contexts should trigger it? | Shapes description |
| 3 | What is the expected output? (file, prose, diagram, code…) | Shapes output section |
| 4 | Are there constraints? (tools available, file types, audience) | Shapes compatibility |
| 5 | Do you have an example input + ideal output? | Gold standard for testing |
| 6 | What does failure look like? What should never happen? | Shapes anti-patterns |

**Rules:**
- Ask max 2 questions at a time — don't overwhelm.
- Extract answers from conversation history first; only ask what you can't infer.
- Don't proceed to Phase 2 until you have answers to at least Q1, Q2, Q3.

---

## Phase 2 — Atomicity Check

Before writing anything, verify the skill is truly new:

1. Scan the user's `available_skills` list (visible in their system prompt).
2. Ask: *"Could this be an extension of an existing skill rather than a new one?"*
3. If overlap exists, present a table:

| Option | Pros | Cons |
|--------|------|------|
| Extend existing skill | Less duplication | May bloat it |
| Create new skill | Clean separation | Needs maintenance |
| Merge two skills | Single trigger | Wider scope |

Let the user decide — never decide for them.

---

## Phase 3 — Skill Structure

Every skill body must contain these sections (adapt names and depth to the domain):

```markdown
# {Skill Name}

One-sentence purpose statement.

---

## Compatibility (only if non-obvious)
- Required tools: ...
- Required files: ...

---

## Workflow

### Step 1 — {Name}
What to do, how to do it, what to output.

### Step 2 — {Name}
...

---

## Output Format
Describe exactly what the final output looks like.

---

## Anti-Patterns
What Claude must never do in this skill context.

---

## Examples (include at least one)
Input → Output pair.
```

**Structural rules and Constraints:**
- Keep the SKILL.md body under 500 lines. If it's getting long, move detail into `resources/references/`.
- Use tables for comparisons, bullet lists for enumerations, code blocks for templates.
- Every step should be actionable — if someone can't execute the step, rewrite it.
- Never use vague language: "handle appropriately", "use best practices", "be careful". Specify exactly what to do.
- **Do Not** make edits

---

## Phase 4 — Skill Specialization

After the common structure is in place, add **domain-specific intelligence**. This is what separates a generic skill from an expert one.

Use the lookup table below to decide which specializations apply:

| Domain | Specialization to add |
|--------|----------------------|
| Planning / Architecture | Mermaid diagram of the plan; decision tree for branching paths |
| Debugging | Internet search step for tool-specific errors; structured error log format |
| Code Generation | Language-specific linting rules; test scaffold generation |
| Data Analysis | Column-type detection heuristic; outlier flagging logic |
| Document Creation | Template reference file; style guide pointer |
| Research | Source credibility rubric; citation format |
| API / Integration | Auth flow diagram; rate-limit handling table |
| Writing / Content | Tone spectrum table; example before/after rewrites |

Add specialization *after* the common structure, in a clearly labelled section:

```markdown
---

## {Domain} Specialization

...
```

---

## Phase 5 — Description Hardening

The description is a trigger signal, not a summary. Before finalizing:

**Checklist:**
- [ ] Contains at least 5 distinct trigger phrases (verbatim things a user might say)
- [ ] Mentions the primary output type (file, code, diagram, plan…)
- [ ] Mentions edge cases that should also trigger
- [ ] Ends with "When in doubt, use this skill." or equivalent
- [ ] Is NOT a single sentence
- [ ] Does NOT use vague words like "helps with" or "related to"

**Bad description:**
```
Use when writing skills.
```

**Good description:**
```
Use this skill whenever the user wants to create a new skill, update an existing skill,
or is asking how to write better SKILL.md files. Trigger phrases include: "write a skill",
"create a skill for X", "my skill doesn't trigger", "improve this skill", "help me structure
this workflow into a skill". Also trigger when the user pastes a SKILL.md and asks for review
or feedback. When in doubt, use this skill.
```

---

## Phase 6 — Self-Test Before Delivery

Run this checklist mentally on the finished skill before presenting it to the user:

| Check | Pass condition |
|-------|---------------|
| Description triggers | 5+ concrete trigger phrases present |
| No vague steps | Every step has a specific action verb |
| Output defined | Output format section exists |
| Anti-patterns listed | At least 2 "never do" rules stated |
| Example included | At least one input → output pair shown |
| Under 500 lines | Or resources/ folder used for overflow |
| Atomicity confirmed | No existing skill fully covers this |
| Specialization added | Domain-specific section present |

If any check fails, fix it before presenting.

---

## Core Principles

- **Atomic transaction**: A skill should do one thing well. If it needs to do two things, make two skills.
- **No hidden state**: Every assumption is explicit. Never say "Claude will know what to do."
- **Progressive disclosure**: SKILL.md is the entry point. Heavy detail lives in `resources/`.
- **Triggering over completeness**: A skill that triggers reliably and does 80% is better than a perfect skill that never triggers.
- **Pushy descriptions**: Err on the side of over-specifying trigger conditions. Under-triggering is the #1 skill failure mode.

---