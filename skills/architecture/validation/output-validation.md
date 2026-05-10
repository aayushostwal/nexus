---
name: architecture-output-validation
description: >
  Validation rules for architecture mapping output and deployment safety verdicts.
  Load this file before finalizing any architecture map or issuing a Go/No-Go verdict.
  These checks prevent incomplete or overconfident output.
---

# Output Validation

Validation checks that must pass before finalizing any architecture map or deployment safety verdict.
A failed check means the output is incomplete — do not present it to the user until resolved.

---

## Validation 1 — Architecture Map Completeness

**Purpose:** Verify the architecture map accounts for the entire codebase, not just the parts
that were easy to find.

### Module Coverage Check
- [ ] Every top-level directory in the repository appears in the Layer Map
- [ ] Every Django app in `INSTALLED_APPS` (or equivalent framework equivalent) is classified
- [ ] Every file with more than 100 lines appears in the dependency graph or is explicitly categorized as "utility/config"
- [ ] The total line count of modules in the bounded context table accounts for ≥ 90% of the total codebase LOC
- [ ] No module is silently omitted because "it didn't seem important"

```bash
# Verify module coverage
find . -type d -not -path '*/.*' -not -path '*/node_modules/*' -not -path '*/__pycache__/*' | wc -l
# Compare this count against the number of directories classified in the Layer Map
```

If the counts differ by more than 10%: identify the missing modules before finalizing.

### Dependency Graph Completeness
- [ ] The top 10 modules by fan-in are all represented in the dependency graph
- [ ] Fan-in counts are based on actual grep results, not estimates
- [ ] Modules with fan-in 0 (leaves) are enumerated — these are the extraction candidates
- [ ] Cross-layer imports (API importing Data directly) are explicitly noted if present

### Bounded Context Coverage
- [ ] Every module belongs to exactly one bounded context (no module is unclaimed)
- [ ] The bounded context list accounts for all modules in the Layer Map
- [ ] Each bounded context has a stated data ownership (which tables it owns)
- [ ] Each bounded context has a stated seam (how it interfaces with other contexts)

---

## Validation 2 — Extraction Candidate Confidence Scoring

**Purpose:** Extraction recommendations must have a confidence level based on evidence quality.
Low-confidence recommendations should be flagged rather than presented as certain.

### Confidence Levels

| Level | What it means | Evidence required |
|-------|---------------|-------------------|
| High (90%+) | Confident this context can be extracted as described | Fan-in verified by grep, owned tables confirmed, no shared table conflicts found, co-commit analysis run |
| Medium (60-89%) | Likely but some signals are ambiguous | Fan-in estimated, one or two owned-table questions unresolved, co-commit not run |
| Low (< 60%) | Preliminary assessment only — more investigation needed | Based on directory names / README description only, imports not verified |

### Confidence Check Per Candidate
For each extraction candidate, confirm:
- [ ] Fan-in count verified by grep (not estimated from code reading)
- [ ] Owned tables confirmed by reading model/schema files (not inferred from module name)
- [ ] No shared tables identified by searching for table names across all ORM model files
- [ ] Co-commit overlap calculated with `git log` (or explicitly noted as not run)
- [ ] At least one developer from the team has confirmed the domain boundary matches team understanding

If confidence < 60%: add a "Low Confidence — requires further investigation" flag before the recommendation.
Do not present low-confidence extraction candidates as actionable plans.

### Extraction Order Validation
- [ ] Extraction order is strictly from lowest to highest fan-in
- [ ] No context in the extraction list has an unresolved shared-table conflict with a later-extracted context
- [ ] Each extraction step has a stated pre-requisite (what must be true before this extraction can begin)
- [ ] The final extraction candidate (highest fan-in) has a stated reason why it is last

---

## Validation 3 — Deployment Safety Verdict Coverage

**Purpose:** A deployment safety check is only complete if all risk vectors were assessed.
Partial checks create false confidence.

### Risk Vector Coverage Check

Before issuing any verdict, confirm every vector was assessed:

| Risk Vector | Assessed? | Evidence |
|-------------|-----------|---------|
| Schema migrations | [ ] | Migration files read, classified T1-T5 |
| API surface changes | [ ] | Route diffs reviewed, callers assessed |
| Required config changes | [ ] | .env.example diff reviewed |
| Dependency bumps | [ ] | requirements.txt / package.json diff reviewed |
| Data migration (backfills) | [ ] | Any migration with UPDATE / INSERT reviewed |
| Rollback feasibility | [ ] | Rollback script written or "non-reversible" declared |
| Traffic impact | [ ] | Affected endpoints and user groups named |
| Monitoring plan | [ ] | Post-deploy metrics named |

A verdict cannot be issued if any row in the table above is unchecked.

### No-Go Escalation Rules

The verdict must be No-Go if any of these conditions are true, regardless of other findings:

1. A DROP COLUMN or DROP TABLE migration exists and there is no verified zero-reference check
2. A NOT NULL column is added with no default and no simultaneous backfill plan
3. A required API request field is added with no fallback and no versioning
4. No rollback plan exists for any T1 change
5. The code references a column or endpoint that the migration removes
6. A major dependency version bump has not been tested in staging

If issuing a CONDITIONAL GO: every condition in the "Conditions for Go" list must be concrete and
verifiable. Conditions like "monitor it carefully" or "make sure it's tested" are not acceptable —
replace them with specific commands, thresholds, or boolean checks.

### Rollback Plan Validation
- [ ] Rollback plan contains exact commands (not "revert the code" — give the git SHA or kubectl command)
- [ ] Rollback plan specifies the rollback window (time before rollback is no longer possible)
- [ ] Rollback plan addresses both the application code AND the schema (if a migration was run)
- [ ] Rollback plan has been reviewed by at least one other engineer if the change is T1 or T2

---

## Validation 4 — Output Format Verification

**Purpose:** The output must match the defined contract so that downstream consumers (humans and agents)
can parse and act on it.

### Architecture Map Format Check
- [ ] Contains: Layer Map table
- [ ] Contains: Dependency graph table with fan-in/fan-out columns
- [ ] Contains: Bounded contexts list with data ownership and seam description
- [ ] Contains: Coupling matrix
- [ ] Contains: Extraction candidates in extraction order with Risk and Blocker columns
- [ ] Contains: Mermaid C4 diagram (syntactically valid — test by checking `C4Context` or `graph` keyword)
- [ ] Contains: Recommended Next Step (one concrete action, not a list of options)

### Deployment Safety Report Format Check
- [ ] Contains: Verdict (GO / CONDITIONAL GO / NO-GO) on the first line
- [ ] Contains: Overall Risk Tier (T1-T5)
- [ ] Contains: Change Summary
- [ ] Contains: Risk Classification table
- [ ] Contains: Critical Issues section (write "None" if GO)
- [ ] Contains: Conditions for Go section (write "None" if GO, must be concrete if CONDITIONAL GO)
- [ ] Contains: Rollback Plan with exact commands
- [ ] Contains: Monitoring Checklist

If any section is missing: complete it before presenting the output.
