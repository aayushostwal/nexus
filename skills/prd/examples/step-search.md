# Worked Reference: "Step Search"

A real doc produced with this skill, reduced to its structure. Names are generic; the shape is what to copy.

## Context

- **Ask:** filter workflow runs by what a step returned, e.g. `active_malignancy = true`.
- **Constraint from the user:** searches must not query the workflow engine.
- **Found in code:** branches are saved for 14 days; step input and output live only in the engine for 30 days, and are readable one run at a time through an existing client.
- **Found in infra:** the API and the engine share one database cluster.

## How the doc went wrong first (versions 1–3)

| Version | Reader feedback | Fix that worked |
|---|---|---|
| 1 | "Word dump" | Story-first structure; appendices collapsed |
| 2 | "How does ingestion work? Where does the job run?" | Sequence diagrams with one lane per process |
| 3 | "Too complex, too many tables, poor headings" | Rewrite around one live example; tables only for data |

## Final structure (version 4)

1. **The problem:** 3 bullets.
2. **The idea in one picture.**
   - Top row, "when a run finishes": executor (no change) → API (sends run id) → queue (ids only) → copier (new).
   - Copier ↔ engine: "read once per run".
   - Copier → database: "save chosen fields".
   - Bottom row, "when someone searches": UI → API (audit, look up) → database.
3. **Live example**, labeled as invented data.
   - **0 The workflow:** a small 4-node diagram, plus the author's picked fields:
     ```
     extract_findings  output.active_malignancy, output.nodule_size_mm, output.laterality
     is_suspicious     output.branch
     ```
   - **1 The run executes as today:** the step's JSON output, including fields that will be dropped (`patient_name`, `summary`).
   - **2 Run finishes:** the existing status call is named (`PATCH /api/v1/runs/{id}`). The new queue message is shown: `{ "run_id": "7f3a…" }`.
   - **3 Copier reads the engine once:** says which existing code it reuses, and which fields are dropped and why.
   - **4 Saves two things:** both tables printed as query output with actual rows.
   - **5 Someone searches:** the request URL, the audit-then-lookup SQL, and the page result `37 runs match · Checked 412 of 415 · 3 not copied yet`.
   - **6 After 30 days:** deleted by day.
   - **Try it:** edit a JSON output and a field list, and see the "Saved" and "Not saved" columns.
4. **Will it slow anything down?** One bullet each for runs, the API, the engine (not measured), the database (shared; checked in code on a date; prod not checked) and search (bounded, 5 s timeout).
5. **If something breaks:** copier down, poison message, lost message, copier more than 30 days behind.
6. **Patient data:** off by default; picked fields only (allow-list); audited; 30-day deletion; compliance approval first.
7. **Decisions.**
   - *Made by you:* 2 dated lines. Four rounds of ingestion debate became one line.
   - *Still open:* 5 items, each with who answers.
8. **Plan:** 5 steps, plus undo.
9. **Details (collapsed):** DDL with plain column names (`yes_no`, `number`, `text`), other designs with why-not, and checked claims with file:line and dates.

## Chat summary that accompanied it

> Rewrote the doc from scratch, version 4, same link. It is half the size (27 KB, down from 60 KB). It's built around one workflow run, and the only tables left show actual data. Decisions has two of yours; the 4 ingestion rounds are merged into one. Two calls are mine, not yours: picked fields only, and the copier as a separate service. Tell me if either should change.
