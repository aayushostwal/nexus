---
name: prd
description: >
  Use to write, rewrite, or iterate on a PRD, design doc, technical proposal, or architecture
  write-up that other people will read and decide on. Trigger on "write a PRD", "create a design
  doc", "prepare a plan/proposal for X", "write this up for the team/my manager", "make the doc
  simpler", "add a diagram/LLD", "update the design doc", "send this proposal to <person>", or
  when a Slack/Jira ask must become a reviewable proposal. Also trigger when the user says a doc
  is hard to read, too long, too many tables, or gives them no confidence in the implementation.
  Produces a short, plain-language doc built around one live worked example, with diagrams,
  verified claims, and a summarized Decisions log. When in doubt, use this skill.
---

# Nexus PRD Writer

Write proposals that a busy reader understands in ten minutes and can decide on. One live example carries the design; everything else supports it.

| Field | Value |
|---|---|
| Category | engineering |
| Required tools | Code search (fff/grep), Read, Bash; web search for cloud/vendor claims; a renderer (Playwright) for HTML; the user's doc store or chat-message tools when publishing |
| Required context | The ask (link or text), the code/infra it touches, the user's decisions so far |
| Expected inputs | A request thread, rough notes, an earlier draft, or "update the doc" feedback |
| Expected outputs | One self-contained HTML doc (default) or Markdown, plus a short chat summary |

## Philosophy

- **Problem:** design docs fail by being long, abstract and table-heavy. Readers finish them unable to picture what runs where, so they have "zero confidence" and stop reading.
- **Why it matters:** a doc exists to get a decision. If the reader cannot follow one request end to end, they cannot judge it.
- **Principles:**
  1. *Show, then tell.* One concrete example, followed step by step with real-looking data, beats any number of concept tables.
  2. *Every moving part has an address.* For each step, say which process or service does it, whether that code is new or existing, and what it costs the systems around it.
  3. *Claims carry evidence.* File:line, command and date, or "not verified". A confident wrong claim costs more than an admitted gap.

## Context Acquisition

Collect before writing. Stop and ask only for items you cannot find.

| Signal | How to collect |
|---|---|
| The original ask, verbatim | Read the thread/ticket/link; quote one sentence of it |
| What exists today | Search the code for the tables, endpoints and jobs involved; read the top hits |
| Where each new piece would run | Find the entry point (main, worker, handler) of every service the design touches |
| Shared resources | Check infra code for shared databases, queues and connection limits |
| Retention and limits | Read config for TTLs, size caps, batch sizes; check live config when a claim depends on it |
| The user's decisions | Re-read the conversation; list only what the user actually decided |
| Destination | Ask once if unknown: HTML in the user's doc store (default) or Markdown in the repo |

**Stop and ask** when the design depends on a fact you could not verify and cannot mark as an assumption, such as a compliance rule, a production setting you lack access to, or who the reader is.

## Workflow

1. **Restate the ask.** Write the problem in at most 3 bullets and the decision the reader must make. *Failure signal:* you cannot name the decision.
2. **Verify the ground.** For each fact the design rests on, record its source (`path:line`, command and date). Mark unverified facts as such. *Failure signal:* a claim about a live system with no date.
3. **Challenge before agreeing.** If the user proposed an approach, list its real strengths and real weaknesses, and propose a better option if one exists. Never rubber-stamp it. *Output:* the alternatives, each with a one-line reason it was not chosen.
4. **Pick one design to present.** The doc shows one design. The others go in a collapsed "Other designs we considered" section.
5. **Draw the picture.** Make one flow diagram of the whole idea, split into "when X happens" and "when someone uses it", with new parts highlighted. Add a sequence diagram for any flow with more than 3 hops. Inline SVG, theme-aware.
6. **Write the live example.** Use one realistic scenario, labeled as invented data, as numbered steps 0…N. Each step names the actor, shows the actual payload or request, and shows the resulting rows or response. Include what is *dropped* or *not stored*. End with what the user sees.
7. **Add one interactive box when data shape matters**, e.g. "edit this input and see what gets stored". Skip it when there is no data transformation.
8. **Answer the reader's fears in bullets.** Cover these sections: *Will it slow anything down?* (one bullet per touched system, with "not measured" where true), *If something breaks*, and *Data safety* when PII/PHI is involved.
9. **Write the Decisions section.** Use two lists: **Made by you** (dated, one line each, with several iterations on one topic merged into one entry) and **Still open** (each with an owner or the next step). Your own recommendations are never listed as the user's decisions.
10. **Write the plan.** Use at most 5 steps, then one "To undo" line.
11. **Collapse the reviewer details.** Put schema/DDL, alternatives and "what was checked, and how" in `<details>`.
12. **Render and check.** Check desktop, a 390px phone width and dark mode. There must be no horizontal overflow and no JS errors, and every diagram must be screenshot and looked at. *Failure signal:* overlapping SVG labels.
13. **Publish and hand off.** Upload as a new revision of the same asset rather than a new link. Before anyone is sent the link, check they have access. Draft messages; do not send unless asked.

## Doc Skeleton (HTML default)

```
Header: kicker (project · version N · date · status), title (2–4 words), one-line lede, inline nav
1 The problem            3 bullets + the decision needed
2 The idea in one picture flow SVG + one-line caption
3 Live example           numbered steps 0…N with payloads, rows, request, response; optional try-it box
4 Will it slow anything down?   bullets per system
5 If something breaks    bullets
6 Data safety            bullets (only if sensitive data)
7 Decisions              Made by you · Still open
8 Plan                   ≤5 steps + undo
9 Details for reviewers  <details>: schema · other designs · what was checked
```

Target length: under 30 KB of HTML, and readable in 10 minutes. A full worked reference is in `examples/step-search.md`.

## Heuristics

- IF a table explains a concept (pros/cons, terms, choices) THEN rewrite it as bullets or a diagram, BECAUSE the user reads concept tables as noise. Keep tables only for actual data rows and schemas.
- IF a term would need explaining (flatten, ingest, payload, idempotent, partition) THEN replace it with plain words or define it in the same sentence, BECAUSE the doc must read without a glossary.
- IF the design adds work to a hot path (request handler, run executor) THEN say so explicitly and offer an option that moves it off that path, BECAUSE "will it slow X" is the first question reviewers ask.
- IF two services share a database, queue or cluster THEN state the shared resource and the measured headroom, or say "not measured", BECAUSE "independent" is false when capacity is shared.
- IF sensitive fields are filtered THEN default to an allow-list (store only named fields), BECAUSE a deny-list silently passes new fields.
- IF the user iterated on one topic several times THEN record one decision with the final position, BECAUSE the log is for outcomes, not history.
- IF a revision changes a recommendation THEN state the change once, in the affected section, BECAUSE silent reversals destroy trust. Do not add a running changelog to the body.
- IF the doc exceeds ~30 KB or ~12 screens on desktop THEN cut or collapse, BECAUSE length was the original complaint.

## Failure Modes

| Failure mode | Trigger | Mitigation |
|---|---|---|
| Text-only design | The flow is described in prose, with no diagram | Step 5 is mandatory, and every hop gets a lane |
| Reader can't place the code | A step says "the API does X" without naming the process | Every step names the service and process, and says whether it is new or existing |
| Overclaimed safety | "Never affects runs" when capacity is shared | Heuristic on shared resources; date and method on infra claims |
| Agreeing with the user's idea | The user proposes an approach and the doc adopts it untested | Step 3 critique, with alternatives in the doc |
| Decision log bloat | Every chat turn is logged as a decision | Merge per topic; user decisions only |
| Recipient can't open the doc | Owner-only link sent | Check access before drafting the message |
| Broken render | SVG labels overlap, or the page scrolls sideways on phone | Step 12 screenshots |

## Validation

- [ ] The problem fits in 3 bullets and names the decision needed
- [ ] One flow diagram plus a sequence diagram for any flow over 3 hops
- [ ] The live example has numbered steps, real-looking payloads and resulting rows, and shows what is not stored
- [ ] Every new component says where it runs and whether it is new or existing
- [ ] Every touched system has a "slow it down?" bullet
- [ ] Concept tables: zero. Data/schema tables only.
- [ ] Decisions separate the user's decisions (dated, merged) from open items
- [ ] Every infra or live-system claim has a source and date, or is marked unverified
- [ ] Rendered on desktop, phone and dark; 0 overflow; 0 JS errors
- [ ] Confidence stated: High (all load-bearing claims verified), Medium (some measured gaps), Low (key facts unverified)

## Output Contract

| Field | Required | Description |
|---|---|---|
| findings | yes | The doc itself: path and published link or revision |
| evidence | yes | The "what was checked, and how" list inside the doc |
| confidence | yes | High/Medium/Low with the reason, in the chat summary |
| risks | yes | The open decisions and unmeasured costs, in the doc and summarized in chat |
| recommendations | yes | The single chosen design, with alternatives collapsed |
| next_actions | yes | Plan steps, plus what the user must answer next |

The chat summary is crisp: what changed, link, the 1–2 calls that were yours rather than the user's, and one question if needed.

## Anti-Patterns

- Never explain concepts in tables → use bullets or a diagram; reserve tables for data.
- Never write "how it works" as prose only → draw lanes and number the steps.
- Never present 3 designs as equals in the body → pick one; collapse the rest with reasons.
- Never log the assistant's recommendations as the user's decisions → keep "Made by you" honest.
- Never state that something exists or is absent in a live system without a date and method → or mark it unverified.
- Never send or share on the user's behalf → create drafts and ask before granting access.

See `anti-patterns/common-mistakes.md`, `checklists/execution-checklist.md` and `validation/output-validation.md`.

## Example (abridged)

**Input:** "Read this Slack thread and prepare a plan. Filter runs by a step's result, e.g. active_malignancy = true. Don't query Hatchet." Followed later by "I can't visualize the implementation, zero confidence. Too many tables."

**Output:** an HTML doc titled "Step Search", about 27 KB, with these sections:
1. *The problem:* only branches are saved, for 14 days; step outputs live in the engine for 30 days and can be read one run at a time.
2. *One picture:* run finishes → run id on queue → copier reads the engine once → two tables; search reads only the tables.
3. *Live example:* "Lung nodule follow-up". The author picks 4 fields, the run returns JSON including `patient_name`, and the copier keeps the 4 fields. The two tables are shown with actual rows, then the search request, SQL, and "37 match · 3 not copied yet".
4. *Decisions, made by you:* "Searches never query the engine (11-19)"; "Copying is queue-based and separate from runs and the API (11-20)". *Still open:* compliance sign-off, engine read cost, picked-only fields, branch-only alternative.
5. *Details:* collapsed DDL, alternatives (executor push, engine polling, copier in-process), and a checked-claims list with file:line and dates.

Full reference: `examples/step-search.md`.
