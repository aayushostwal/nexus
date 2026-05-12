# Tutorial Output Validation

How to verify that a Jupyter Notebook tutorial is complete, runnable, and safe to share.

---

## Structural Completeness Check

A complete tutorial must contain all of the following cells in this order:

| Cell | Type | Required? | Minimum content |
|------|------|-----------|----------------|
| venv setup | Shell/code | Always | `python -m venv .venv && source .venv/bin/activate` |
| pip install | Code | Always | All dependencies pinned to exact versions |
| Config / BaseSettings | Code | Always | Pydantic settings class + dotenv load + missing-key error |
| H1 Title | Markdown | Always | What the tutorial builds in one sentence |
| H2 Objective | Markdown | Always | One paragraph: what you'll build and why |
| H2 Prerequisites | Markdown | Always | Table of requirements with specific versions and links |
| H2 Architecture | Markdown | Always (if > 1 component) | Mermaid diagram of end-to-end flow |
| Step cells (Markdown + Code pairs) | Mixed | Always | At least 2 steps with explanation + code |
| Cleanup | Code | Always | Closes connections, removes temp files |
| Makefile | File | Always | `make jupyter` target with venv activation |

---

## Runability Validation

This is the single most important check. A tutorial that doesn't run is not a tutorial.

**The test:** Restart the kernel, run all cells sequentially from Cell 1 to the last cell. If any cell fails:

- [ ] `NameError` — a variable is used before it is defined. Fix the cell ordering.
- [ ] `ModuleNotFoundError` — a library is used but not in the `pip install` cell. Add it with a pinned version.
- [ ] `ValidationError` from Pydantic — an env var is missing from `.env`. Add it to the Prerequisites cell.
- [ ] `AuthenticationError` or `401` — the example API key in the test `.env` has expired. Update it.
- [ ] Any red traceback cell — fix the underlying cause before saving. Never leave an unresolved error cell.

- [ ] The notebook runs end-to-end in a fresh venv with only the listed packages installed
- [ ] The last cell is the Cleanup cell and it runs without error

---

## Code Quality Validation

- [ ] No cell is longer than ~30 lines (count only code lines, not blank lines)
- [ ] All function signatures have type hints
- [ ] All print/log statements use f-strings with meaningful context (not `print("done")`)
- [ ] No hardcoded credentials in any cell, comment, or print statement
- [ ] `%%time` is present on every cell that makes a network/LLM call
- [ ] Every cell that makes an LLM call has `max_iterations` or equivalent guard set

---

## Narrative Validation

- [ ] Every pair of code cells has a Markdown cell between them
- [ ] Every Markdown bridge cell states: (1) why this approach was chosen, (2) expected output description, (3) at least one common error with its fix
- [ ] Expected output descriptions describe the structure of the output, not just "something will print"
- [ ] Comments in code explain why, not what (no `# create a list`)

---

## Security Validation

- [ ] Run `grep -r "sk-" .` — no API key patterns in any notebook or supporting file
- [ ] Run `grep -r "AKIA" .` — no AWS access key patterns
- [ ] Run `grep -r "ghp_" .` — no GitHub token patterns
- [ ] The `.env` file is not committed (check `.gitignore`)
- [ ] Saved notebook output cells do not contain any secret values (check rendered output, not just source)

---

## GitHub Readiness Validation

- [ ] Notebook filename is descriptive and uses kebab-case (`react-agent-langchain.ipynb`)
- [ ] All output cells contain clean, representative output (not partial, not error tracebacks)
- [ ] Markdown cells use bold and tables for key terms — they render on GitHub
- [ ] The Architecture cell's Mermaid diagram renders in GitHub's preview (test with a Mermaid live editor)
- [ ] The `Makefile` exists and `make jupyter` runs without error

---

## Final Readiness Gate

A tutorial is ready to share when all of the following are true:

- [ ] Restarted kernel + Run All produces zero errors
- [ ] A developer who has never seen this tutorial can complete it using only the Prerequisites cell as a guide
- [ ] No credential, token, or API key is visible anywhere in the notebook source or saved output
- [ ] The Cleanup cell leaves the system in the same state as before the notebook ran
