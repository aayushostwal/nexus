# Skill Quality Checklist (20-Point)

Run this checklist against any skill before declaring it complete. Every item must pass.
A skill that fails more than 3 items should be rewritten, not patched.

---

## Section 1 — Trigger Conditions (4 points)

- [ ] **1.1 Trigger phrase density**: The description contains 5 or more distinct, concrete trigger
  phrases that a real user would actually say. Not synonyms — genuinely different phrasings and contexts.

- [ ] **1.2 Edge case coverage**: The description explicitly covers at least 1 non-obvious trigger
  (e.g., "also trigger when the user pastes X and asks Y"). The obvious triggers are not enough.

- [ ] **1.3 Description length**: The description is a minimum of 4 sentences. Single-sentence
  descriptions trigger inconsistently because they are too sparse for reliable matching.

- [ ] **1.4 Closing phrase**: The description ends with "When in doubt, use this skill." or a
  functionally equivalent instruction. This catches ambiguous cases.

---

## Section 2 — Structure Completeness (5 points)

- [ ] **2.1 YAML frontmatter present**: The skill has valid YAML frontmatter with `name` and
  `description` fields. The name is in `nexus-{skill-name}` kebab-case format.

- [ ] **2.2 Directory structure complete**: All 5 supporting subdirectories exist with their
  required files:
  - `examples/production-scenarios.md`
  - `checklists/execution-checklist.md`
  - `heuristics/engineering-heuristics.md`
  - `anti-patterns/common-mistakes.md`
  - `validation/output-validation.md`

- [ ] **2.3 Metadata section present**: SKILL.md includes a Metadata table with at minimum:
  Category, Required Tools, Required Context, Expected Inputs, Expected Outputs.

- [ ] **2.4 Output Contract defined**: SKILL.md includes an Output Contract section with a table
  listing every required output field, whether it is required, and what it contains.

- [ ] **2.5 Workflow section present**: SKILL.md contains an Execution Workflow with named,
  numbered steps. Steps are not bullets in a list — each is a subsection with What/How/Output/Failure
  Signal.

---

## Section 3 — Content Depth (5 points)

- [ ] **3.1 Every step is actionable**: No step contains vague language: "handle appropriately",
  "use best practices", "be careful", "consider X", "ensure Y". Every step specifies a concrete
  action verb: read, search, extract, compare, run, list, rank, flag, draft.

- [ ] **3.2 Context Acquisition defined**: The skill specifies what information must be gathered
  before execution, how to gather it, and what to do if that information is unavailable (stop and ask
  — never guess).

- [ ] **3.3 Failure modes documented**: At least 3 failure modes are listed in a table with:
  what the failure mode is, what triggers it, and a specific mitigation (not "be more careful").

- [ ] **3.4 Engineering heuristics are decision rules**: Every heuristic follows the pattern
  "If {condition}, then {action}, because {reason}" or equivalent. Descriptions of what to think
  about are NOT heuristics.

- [ ] **3.5 Skill Philosophy present**: The skill explains the problem it solves, why it matters
  operationally, and the 2-3 core engineering principles that guide its decisions.

---

## Section 4 — Anti-Pattern Coverage (2 points)

- [ ] **4.1 Anti-patterns in SKILL.md**: The SKILL.md contains at least 3 "Never do X → do Y
  instead" rules specific to this skill's domain. These are not generic writing advice.

- [ ] **4.2 anti-patterns/common-mistakes.md exists and has 10 entries**: The supporting
  anti-patterns file documents 10 bad practices, each with: name, example, why it fails, what to
  do instead.

---

## Section 5 — Example Quality (2 points)

- [ ] **5.1 Production-scale examples**: The examples in `examples/production-scenarios.md` use
  real-world scale: named services, realistic data volumes, actual error messages or log snippets.
  No toy examples ("a user wants to sort a list of names").

- [ ] **5.2 Examples show reasoning, not just output**: Each example shows the skill's intermediate
  reasoning steps, not just the final output. A reader should be able to trace exactly how the input
  became the output.

---

## Section 6 — Validation Criteria (2 points)

- [ ] **6.1 validation/output-validation.md present**: The file exists and contains concrete,
  binary pass/fail criteria for each of the 4 validation tests:
  - Trigger test
  - Completeness test
  - Output test
  - Engineering intelligence test

- [ ] **6.2 Validation criteria are testable**: Each validation criterion can be checked without
  subjective judgment. "The output includes a severity field with value P0/P1/P2/P3" is testable.
  "The output is good" is not.

---

## Scoring

| Score | Interpretation |
|-------|---------------|
| 20/20 | Production ready. Ship it. |
| 17-19 | Minor gaps. Fix before shipping — each missing item reduces reliability. |
| 13-16 | Significant gaps. Multiple sections need work. Do not ship without revision. |
| < 13 | Foundational problems. Rewrite from Phase 0 (classification) before continuing. |

---

## Quick Fail Conditions

Any of the following is an automatic fail regardless of total score:

- Description is a single sentence
- No Output Contract
- No supporting subdirectories exist
- Steps contain "handle appropriately", "use best practices", or "be careful"
- Examples are toy-scale (not production-scale)
- Heuristics are descriptions, not decision rules
