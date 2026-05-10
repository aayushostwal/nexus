# Tutorial Execution Checklist

Use this checklist to verify a Jupyter Notebook tutorial is complete and ready to share before delivering it.

---

## Reproducibility Block

- [ ] Cell 1 is a shell cell with `python -m venv .venv && source .venv/bin/activate`
- [ ] Cell 2 is a `%pip install` cell with every required library pinned to a specific version (e.g. `langchain==0.2.0`, not `langchain>=0.2`)
- [ ] No library in the pip install cell is unpinned or uses `>=` without an upper bound
- [ ] A `Makefile` is included with a `make jupyter` target that activates the venv and launches JupyterLab
- [ ] A `.python-version` file or `Makefile` comment specifies the Python version required (e.g. `python3.10`)
- [ ] A kernel check Markdown cell is present instructing the user to select the correct kernel

---

## Configuration & Secrets

- [ ] All environment variables are loaded with `python-dotenv` (`load_dotenv()`)
- [ ] All settings are validated in a Pydantic `BaseSettings` class, not accessed via raw `os.getenv()`
- [ ] A `ValueError` with a helpful message is raised if a required env var is missing — the error names the variable and explains where to get it
- [ ] No API key, token, or credential appears in any cell — not in comments, not in print statements, not in f-strings
- [ ] The `.env` file is listed in `.gitignore` (note this in the Prerequisites Markdown cell)
- [ ] All settings references in code use `settings.variable_name`, never a bare string literal

---

## Structure & Narrative

- [ ] An H1 title cell states what the tutorial builds in one sentence
- [ ] An H2 Objective cell explains what the reader will build and why it matters (one paragraph)
- [ ] An H2 Prerequisites cell lists every API key, account, GPU, or setup step needed — with no vague entries like "install the usual libraries"
- [ ] An H2 Architecture cell contains a Mermaid diagram showing the end-to-end system flow
- [ ] Every pair of code cells has a Markdown cell between them explaining: (1) why this implementation choice was made, (2) the expected output, (3) at least one common error and its fix
- [ ] The final code cell (or a dedicated Cleanup cell) closes all open connections, deletes temp files, and spins down any local processes

---

## Code Cell Quality

- [ ] No code cell is longer than ~30 lines — longer functions are broken into named helper functions
- [ ] All function signatures have Python type hints
- [ ] Comments explain *why*, not *what* (no `# create a list`, yes `# dedup before API call to avoid double-billing`)
- [ ] Each code cell is self-contained or explicitly references a variable from a prior cell (no mystery variables)
- [ ] No hardcoded credentials anywhere in any cell
- [ ] `%%time` magic is added to any cell that makes an LLM call or takes > 5 seconds to run

---

## LLM / API Calls

- [ ] Every LLM call has a note about expected duration and estimated cost
- [ ] Rate limit errors (`RateLimitError`, `429`) are documented in the Markdown cell before the LLM call
- [ ] At least one retry or error handling example is included (not just "it might fail")
- [ ] API calls use `async` / `asyncio.run()` where the library supports it
- [ ] For agent tutorials: a `max_iterations` or equivalent guard is set to prevent infinite loops

---

## GitHub Optimization & Saved Outputs

- [ ] The notebook is saved with clean, representative outputs (no red error tracebacks visible)
- [ ] No cell has a partial or truncated output (e.g., output cut off mid-JSON)
- [ ] Bold text and tables are used in Markdown cells for key terms — they render on GitHub's notebook viewer
- [ ] The notebook filename uses kebab-case and describes the content: `react-agent-langchain.ipynb` not `notebook1.ipynb`

---

## Final Readiness Gate

A tutorial is ready to share when:

- [ ] The notebook runs from Cell 1 to the last cell without errors in a fresh venv on a machine with only the pinned packages installed
- [ ] The Prerequisites cell lists everything needed — a new reader needs no additional context to get started
- [ ] All saved outputs are from a clean run (not a partial or error run)
- [ ] The Cleanup cell runs without error
