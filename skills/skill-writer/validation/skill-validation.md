# Skill Validation Guide

Verify a skill works correctly before declaring it production-ready. Run all 4 tests after writing or modifying a skill.

---

## Test 1 — Trigger Test

Does the skill reliably activate for the inputs it handles?

**Check against the description:** primary use case, two edge cases (non-obvious / semantically equivalent), one near-miss (should NOT trigger).

**Pass:** 3 trigger inputs match this skill more strongly than any competitor; near-miss does not.

**Auto-fail:** single-sentence description; uses domain names without trigger phrases; near-miss also triggers.

**Fix:** Add 2-3 specific trigger phrases; add explicit exclusion language.

---

## Test 2 — Completeness Test

Does the skill gather enough context to avoid hallucinating?

**Simulation:** Give only "[domain] isn't working". Trace through Context Acquisition.

**Pass:** 2+ named signals with collection methods; explicit "stop and ask" rule; skill doesn't proceed without required context.

**Auto-fail:** no Context Acquisition section; Step 1 begins "analyze X" without specifying where X comes from; no rule for missing context.

**Fix:** Add Context Acquisition with named signals and an explicit "if X not provided, ask before proceeding" rule.

---

## Test 3 — Output Test

Does the skill produce consistent output matching its Output Contract?

**Run on two different inputs and compare.**

**Pass:** every Required field present in both runs; identical field names; same structure; empty fields use `[INSUFFICIENT CONTEXT — {reason}]` not blank.

**Auto-fail:** no Output Contract in SKILL.md; contract says "provide analysis" instead of named fields; different top-level structure across runs.

**Fix:** Define every Output Contract field (name, required/optional, type, description). Trace workflow steps back to verify each feeds the contract.

---

## Test 4 — Engineering Intelligence Test

Does the skill encode real expertise, or just restate the input?

**Delta test:** compare output with vs. without the skill loaded.

**Pass:** output contains at least one conclusion a no-skill model wouldn't reliably produce; heuristics are IF/THEN/BECAUSE rules with thresholds; at least one "trap case" is caught.

**Auto-fail:** output is a polished restatement of input; heuristics are descriptions ("think carefully"); removing the skill produces the same output.

**Fix:** Ask "What would a 10-year expert know that a generalist would not?" Encode as IF/THEN/BECAUSE heuristics covering trap cases, thresholds, and experience-earned shortcuts.

---

## Summary Table

| Test | What it checks | Pass condition | Auto-fail |
|------|----------------|----------------|-----------|
| Trigger | Description reliably activates skill | Matches 3+ triggers, rejects near-miss | Single-sentence description |
| Completeness | Skill gathers sufficient context | Named signals + stop-and-ask rule | No Context Acquisition section |
| Output | Skill produces consistent structured output | All Output Contract fields in every run | No Output Contract defined |
| Engineering Intelligence | Skill encodes real expertise | Non-obvious decisions not reproduced without skill | Removing skill produces same output |

A skill must pass all 4 tests to be production-ready.

---

## Re-validation Triggers

Re-run relevant tests whenever:
- Description changes → Trigger test
- New context sources added → Completeness test
- Output Contract fields added/removed/renamed → Output test
- New heuristics added → Engineering Intelligence test
- User reports skill "not working" or "almost right" → all 4 tests
