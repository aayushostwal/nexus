# Exploring Output Validation

How to verify that an exploration output is complete, well-grounded, and ready to present.

---

## Structural Completeness Check

A complete exploration must contain all of the following:

| Section | Required? | Minimum content |
|---------|-----------|----------------|
| Goal statement | Always | One sentence: "Build [X] that does [Y] given [Z] constraints." |
| Options table | Always | 2–4 rows, all columns populated |
| Community Consensus line | Always | Names a specific community and their consensus |
| Recommendation | Always | One tool, one sentence of rationale tied to user's constraints |
| At least one source URL | Always | Per recommended option |
| Next Step / routing decision | Always | LOW (implement) or HIGH (planning) — not omitted |

---

## Goal Statement Validation

- [ ] The goal fits the template: "Build [X] that does [Y] given [Z] constraints."
- [ ] The constraints in [Z] match what the user actually said — not assumed or padded
- [ ] The goal is specific enough that a different engineer reading it could evaluate options independently
- [ ] If the goal was ambiguous, it was clarified before research started

---

## Options Table Validation

- [ ] Contains 2–4 options (not 1, not 5+)
- [ ] All columns are populated: Option, Stars, Last Release, Complexity, Best For, Avoid If
- [ ] Star counts come from a search result or fetched page (not from training knowledge)
- [ ] Last Release dates come from fetched official docs or GitHub releases
- [ ] No option has a last release older than 2 years
- [ ] "Best For" is specific to a use case, not generic ("async FastAPI apps" not "general use")
- [ ] "Avoid If" is specific to the user's context — at least one "Avoid If" applies to a constraint the user named

---

## Research Validation

- [ ] At least 2 web searches were run
- [ ] At least one search targeted a community source (Reddit, HN)
- [ ] At least one search included a year token (2024 or 2025)
- [ ] The top 2 options' primary URLs were fetched (not just search snippets)
- [ ] No benchmark data cited is older than 2 years
- [ ] At least one source URL is included in the output per recommended option

---

## Recommendation Validation

- [ ] Exactly one tool is recommended (no "it depends" or "A or B")
- [ ] The rationale is one sentence
- [ ] The rationale names at least one user-specific constraint from the goal statement
- [ ] The rationale does not use: "battle-tested", "widely adopted", "popular", "well-supported" without specifics
- [ ] The recommendation would change if the user's constraints changed — it is not a default answer

**The portability test:** Could this recommendation sentence be copy-pasted into a session with a completely different user and still be correct? If yes, it is too generic. Rewrite it.

---

## Routing Validation

- [ ] The routing decision is stated explicitly: "Complexity: LOW" or "Complexity: HIGH"
- [ ] The routing is based on the actual signals (not a default)
- [ ] If LOW: only one path is being followed (direct implementation — not also handing off to planning)
- [ ] If HIGH: the confirmed approach is named in the handoff to nexus:planning
- [ ] The user confirmed the recommendation before routing occurred

---

## Final Readiness Gate

An exploration output is ready to present when:

- [ ] A reader with no prior context could understand what was compared and why one was chosen
- [ ] The recommendation is falsifiable — the user could cite a constraint that would change it
- [ ] The sources are verifiable — the user can click the cited URLs and see the data referenced
- [ ] The routing decision is unambiguous — there is no scenario where both LOW and HIGH apply simultaneously
