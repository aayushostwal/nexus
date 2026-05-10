# Skill Validation Guide

How to verify that a skill works correctly in practice. Use this guide after writing a new
skill and before declaring it production-ready. Each of the 4 tests has concrete, binary
pass/fail criteria.

---

## Test 1 — The Trigger Test

**Question**: Does the skill reliably activate for the inputs it is designed to handle?

**Method**: For each of the following input types, check whether the skill's description would
match it given the other available skills as competition:

| Input type | Check |
|------------|-------|
| Primary use case | The most common, canonical user request for this skill |
| Edge case 1 | A non-obvious but valid trigger (artifact-based: user pastes X) |
| Edge case 2 | A trigger phrase not in the description but semantically equivalent |
| Near-miss | A related request that should NOT trigger this skill |

**Pass criteria:**
- The 3 trigger inputs match the description more strongly than any other skill's description
- The near-miss input does NOT match this skill's description with equal or higher confidence
  than the appropriate skill's description

**Fail signals:**
- The description is a single sentence (automatic fail — too sparse for reliable matching)
- The description uses domain names ("engineering", "debugging") without specific trigger phrases
- The near-miss input would also trigger this skill (description is too broad)

**Fix for trigger test failure:**
Add 2-3 more specific trigger phrases. Narrow the description with qualifier language that
explicitly excludes the near-miss case. Check heuristics/skill-design-heuristics.md Section 3
for trigger phrase writing guidance.

---

## Test 2 — The Completeness Test

**Question**: Does the skill gather enough context to produce reliable output without hallucinating?

**Method**: Run a simulation: given only a minimal user input (e.g., "my service is slow"),
trace through the Context Acquisition section and determine what the skill would do.

**Pass criteria:**
- The Context Acquisition section lists at least 2 named signals with collection methods
- There is an explicit "Insufficient context detection" rule that tells the model when to stop
  and ask for more information rather than proceed
- The skill does NOT proceed to Step 1 of the workflow without the context it requires

**Fail signals:**
- The skill has no Context Acquisition section
- The Context Acquisition section says "gather relevant information" without specifying what
- The skill's Step 1 begins with "analyze the X" before specifying where X comes from
- There is no explicit rule for what to do when context is insufficient

**Completeness simulation:**
1. Give the skill only this input: "[skill domain] isn't working"
2. Trace through Context Acquisition. Does the skill ask for specifics or proceed anyway?
3. If it proceeds without specifics, the skill will hallucinate on sparse inputs. Fail.
4. If it asks for: service name, error message, recent changes — Pass.

**Fix for completeness test failure:**
Add a Context Acquisition section with named signals and an explicit "if X is not provided,
ask before proceeding" rule. Reference the GOOD skill example in examples/skill-examples.md.

---

## Test 3 — The Output Test

**Question**: Does the skill produce a consistently structured output that matches its Output Contract?

**Method**: Run the skill on two different inputs and compare the outputs.

**Pass criteria:**
- Both outputs contain every Required field in the Output Contract
- Field names are identical between runs (no renaming, no field omission)
- The output structure is the same even when content differs
- No required field is empty or contains "N/A" without explanation

**Fail signals:**
- The Output Contract section does not exist in SKILL.md
- The Output Contract says "provide a helpful analysis" instead of listing specific fields
- Two runs of the skill produce different top-level structure
- A required field appears in one output but not the other

**Output contract verification:**
For each field in the Output Contract table, verify:
1. The field appears in the output with the exact name
2. The field is populated with content matching the described type
3. If the field cannot be populated, it contains "[INSUFFICIENT CONTEXT — {reason}]" not a blank

**Fix for output test failure:**
Add or rewrite the Output Contract section. Define every field with: name, required/optional,
type or allowed values, and description. Then trace backward through the Workflow steps to
verify that each step produces the inputs needed to populate the Output Contract fields.

---

## Test 4 — The Engineering Intelligence Test

**Question**: Does the skill produce output that encodes real engineering expertise, or does it
just summarize the input in different words?

**Method**: Compare the skill's output to what a model with no skill loaded would produce for
the same input.

**Pass criteria:**
- The skill's output includes at least one decision or conclusion that a no-skill model would
  not reliably produce (non-obvious, experience-encoded insight)
- The Engineering Heuristics section contains IF/THEN/BECAUSE rules with specific thresholds
- The skill catches at least one "trap case" — a situation where the obvious answer is wrong

**Fail signals:**
- The skill output reads like a polished version of the input with no new information added
- The Engineering Heuristics section contains descriptions ("think carefully about X") rather
  than decision rules ("if X > threshold, do Y because Z")
- Removing the skill and asking the same question produces roughly the same output
- The skill's output has no thresholds, no ranked hypotheses, no confidence ratings

**Intelligence delta test:**
1. Ask the question with the skill loaded
2. Ask the same question with no skill, using a similar-length prompt
3. List the differences in the outputs
4. If the only differences are formatting and length, the skill is not encoding expertise — it
   is just a style guide. Fail.
5. If the skill's output includes ranked hypotheses with evidence, specific thresholds, non-obvious
   failure mode detection, or domain-specific decision rules that changed the conclusion — Pass.

**Fix for engineering intelligence test failure:**
This is the hardest fix. The skill is missing real expertise. Go back to Phase 0 and ask:
"What would an expert with 10 years of experience in this domain know that a generalist would
not?" Encode those specific insights as IF/THEN/BECAUSE heuristics. Each heuristic should
describe a trap case, a non-obvious threshold, or an experience-earned shortcut.

---

## Validation Summary Table

| Test | What it checks | Pass condition | Auto-fail condition |
|------|----------------|----------------|---------------------|
| Trigger | Description reliably activates skill | Matches 3+ trigger inputs, rejects near-miss | Single-sentence description |
| Completeness | Skill gathers enough context | Explicit context signals + stop-and-ask rule | No Context Acquisition section |
| Output | Skill produces consistent structured output | All Output Contract fields present in every run | No Output Contract defined |
| Engineering Intelligence | Skill encodes real expertise | Output contains non-obvious decisions not reproduced without the skill | Removing skill produces same output |

A skill must pass all 4 tests to be considered production-ready.

---

## Re-validation Triggers

Re-run all 4 tests whenever:
- The skill description is changed (Trigger test)
- New context sources are required by the workflow (Completeness test)
- Output Contract fields are added, removed, or renamed (Output test)
- New heuristics are added (Engineering Intelligence test)
- A user reports the skill is "not working" or "almost right" (run all 4)
