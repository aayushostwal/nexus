# Skill Design Heuristics

Real decision rules for skill architecture. Each heuristic is in IF/THEN/BECAUSE format.
These encode the non-obvious decisions that determine whether a skill is maintainable,
reliable, and actually useful in production.

---

## Section 1 — When to Build a Skill vs Inline Instruction

**Heuristic 1.1 — The Repetition Test**
If a user describes a workflow they perform more than once per week and the workflow has more
than 4 distinct steps, then build a skill, because repeated multi-step workflows executed
ad-hoc from memory accumulate errors and skip steps under time pressure.

**Heuristic 1.2 — The Expertise Encoding Test**
If the correct action requires judgment that only comes from experience (e.g., "when to rollback
vs fix-forward", "how to scope blast radius"), then build a skill, because this expertise
cannot be reliably reproduced from a blank-slate prompt every time.

**Heuristic 1.3 — The Context Dependency Test**
If executing the workflow correctly requires gathering specific context from the environment
(files, logs, configs, external APIs) before deciding what to do, then build a skill,
because ad-hoc instructions cannot encode the context acquisition protocol reliably.

**Heuristic 1.4 — The "Inline Instruction is Enough" Counter-Rule**
If the task is a single-step transformation (e.g., "format this JSON", "summarize this text"),
then an inline instruction is sufficient. Do not build a skill for something that takes one step
and requires no context gathering, because skills have overhead — the model must load and parse
them, and that cost is only justified by complexity.

---

## Section 2 — Skill Scope: Too Broad vs Too Narrow

**Heuristic 2.1 — The Trigger Ambiguity Test**
If two different user inputs would trigger the same skill but require fundamentally different
workflows to handle correctly, then the skill is too broad and must be split. The test: write
two example inputs that would both trigger the skill. If they require different Steps 1-3, split
the skill.

Example of a too-broad skill: "nexus-engineering" that handles both debugging AND architecture
decisions. The context needed (error logs vs system constraints) and the workflow (isolate failure
vs compare designs) are entirely different.

**Heuristic 2.2 — The 500-Line Rule**
If SKILL.md exceeds 500 lines, then move domain-specific detail to supporting files, because
a SKILL.md that is too long takes too long to parse and the model will start skipping sections.
The SKILL.md is an orchestrator, not a reference manual.

**Heuristic 2.3 — The Output Contract Divergence Test**
If a skill's Output Contract would need to produce fundamentally different field sets for
different inputs (e.g., sometimes a triage report, sometimes a migration plan), then it is too
broad. Split it into skills with distinct output contracts.

**Heuristic 2.4 — The Merge Test**
If two skills have nearly identical descriptions, trigger on the same phrases, and produce
the same output structure, then merge them into one skill, because duplicate trigger conditions
cause the model to pick inconsistently between them — users get different quality depending on
which one is selected.

---

## Section 3 — Writing Descriptions That Trigger Reliably

**Heuristic 3.1 — The Phrase Density Rule**
Include at least 5 trigger phrases. Fewer than 5 means the description is too sparse for
reliable matching, because Claude matches descriptions probabilistically and sparse descriptions
lose to richer ones for ambiguous inputs.

**Heuristic 3.2 — The Specificity Gradient**
Start with the most specific, highest-confidence trigger phrases first, then move to edge cases.
The first 2-3 phrases are weighted most heavily. "we have an incident" is more specific and
triggers more reliably than "something is wrong" — put the specific version first.

**Heuristic 3.3 — The Artifact Trigger Rule**
Always include at least one "Also trigger when the user pastes X" phrase. This covers the case
where the user does not describe what they want but provides an artifact (log, diff, config,
error message) and asks "what do I do?" — these are high-value triggering contexts that bare
description triggers often miss.

**Heuristic 3.4 — The Closing Instruction Rule**
Always end with "When in doubt, use this skill." This captures the ambiguous cases where the
user's phrase almost matches but not perfectly. It shifts the tie-breaking logic toward using
the skill, which is almost always better than falling back to no-skill behavior.

**Heuristic 3.5 — The Negative Space Test**
After writing the description, ask: "What would a user say that should NOT trigger this skill?"
If you cannot identify a clear case that would not trigger it, the description is too broad.
Add qualifier language to exclude the non-target cases.

---

## Section 4 — Sub-Skills vs Sub-Directories

**Heuristic 4.1 — Sub-Skill vs Supporting File**
If the content is a workflow the model needs to execute (steps, decisions, output), it belongs
in SKILL.md or a sub-skill SKILL.md. If the content is reference material the model consults
during execution (examples, heuristics, checklists), it belongs in a supporting file
(e.g., `heuristics/engineering-heuristics.md`).

**Heuristic 4.2 — When to Create a Sub-Skill**
If a skill has a specialized mode that requires a fundamentally different workflow (not just
different parameters), then create a sub-skill with its own SKILL.md inside the parent directory.
Example: `nexus-deploy/` as the parent, with `nexus-deploy/canary/SKILL.md` as a sub-skill for
canary-specific deployments.

**Heuristic 4.3 — Supporting File vs Inline Content**
If content is longer than 50 lines and is not core workflow logic, move it to a supporting file,
because SKILL.md should be parseable in one pass. The model should not need to hunt through 400
lines to find the workflow steps.

---

## Section 5 — Encoding Engineering Intelligence

**Heuristic 5.1 — The "Junior Would Get This Wrong" Test**
For each engineering heuristic in the skill, ask: "Would a junior engineer naturally do this
correctly?" If yes, it is not a heuristic worth encoding — it is obvious. A heuristic only
earns its place if it captures a non-obvious decision that experience teaches.

**Heuristic 5.2 — Threshold Specificity**
Whenever a heuristic involves "too much", "too slow", or "too many", replace the vague qualifier
with a specific threshold. "If error rate increases by more than 0.1% during canary" is a
heuristic. "If error rate increases significantly" is a description.

**Heuristic 5.3 — Decision Tree vs Narrative**
When a skill requires branching logic (if X do A, else if Y do B), encode it as a table or
numbered IF/THEN structure, not prose. Prose decision logic is parsed inconsistently.

**Heuristic 5.4 — The "Why" is Mandatory**
Every heuristic must include the reasoning, not just the action. "Rollback before debugging
because debugging in production under pressure introduces secondary incidents" is a heuristic.
"Rollback before debugging" is a rule without enforcement — a model under pressure will skip it
without the reason.

---

## Section 6 — Skill Maintenance

**Heuristic 6.1 — When to Update vs Rewrite**
If more than 40% of a skill's steps need to change due to a new requirement, rewrite from Phase 0
(classification). Patching a fundamentally misscoped skill produces a Frankenstein skill that
triggers inconsistently and produces mixed-quality output.

**Heuristic 6.2 — The Drift Signal**
If a skill is being used but users consistently report that the output "almost" answers their
question or needs manual adjustment, this is scope drift — the skill's Output Contract no longer
matches the actual use case. Update the Output Contract first, then trace backward to fix the
steps that produce the wrong fields.

**Heuristic 6.3 — Version the Output Contract**
When the Output Contract changes (fields added, removed, or renamed), document the change and
update `validation/output-validation.md` immediately. Output contract drift is the #1 cause of
"the skill used to work but doesn't anymore" complaints.
