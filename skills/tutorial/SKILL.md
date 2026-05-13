---
name: nexus-tutorial
description: >
  Use for creating executable Jupyter tutorials and AI engineering walkthroughs with runnable cells.
  Trigger on requests for step-by-step guides, notebook-based teaching, or shareable code-first learning
  content. Prioritize reproducibility, clarity, and copy-paste-ready outputs.
  When in doubt, use this skill.
---

# Tutorial Generation Protocol

Produce complete, executable Jupyter Notebooks that work on the first run.

---

## Compatibility
- Language: Python 3.10+
- Output: `.ipynb` file + `Makefile`
- Style: PEP 8, GitHub-renderable Markdown, clean saved outputs

---

## Workflow

### Step 1 — Reproducibility Block
Begin every notebook with:
1. Shell commands cell: `python -m venv .venv && source .venv/bin/activate`
2. `pip install` cell with all required libraries (pin versions: `langchain==0.2.0`)
3. Kernel check instructions as a Markdown cell
4. `Makefile` with `make jupyter` target and Python version pin (e.g. `.python-version` file)

### Step 2 — Production-Ready Configuration
1. Create a Pydantic `BaseSettings` class to validate all environment variables on startup
2. Load secrets with `python-dotenv`; raise an explicit `ValueError` with a helpful message if a key is missing
3. Document every production failure mode: missing keys, rate limits, model errors, network timeouts

### Step 3 — Structural Outline
Create Markdown cells with headers H1–H3:
- **H1 — Title:** What the tutorial builds in one sentence
- **H2 — Objective:** One paragraph "what you will build and why"
- **H2 — Prerequisites:** List exact API keys, GPU requirements, or account setup steps
- **H2 — Architecture Diagram:** Mermaid diagram showing end-to-end system flow

### Step 4 — Code Implementation
Rules for every code cell:
- Self-contained or explicitly references previously defined variables
- Python type hints on all function signatures
- Comments explain *why* — not *what* (bad: `# create list`, good: `# dedup before sending to avoid API double-charge`)
- One concept per cell; max ~30 lines per cell — split into functions if longer
- Never hardcode credentials; always use `settings.api_key` from the Pydantic config

### Step 5 — Explanatory Narrative
Between every pair of code cells, add a Markdown cell that:
1. States the "why" behind the implementation choice (e.g., "We use a ReAct loop here because it lets the agent decide when to call tools vs. answer directly")
2. Describes the expected output when the cell runs
3. Lists one or two common errors with their fixes (e.g., "RateLimitError → add `time.sleep(1)` between calls")

### Step 6 — GitHub Optimization & Cleanup
1. Save notebook with clean, representative outputs (no error cells, no partial outputs)
2. Use bold text and tables in Markdown cells for key terms — they render on GitHub's notebook viewer
3. Add a final cleanup cell: close connections, delete temp files, spin down local model instances

---

## Output Format

A complete `.ipynb` file with this cell sequence:
```
[Setup: venv + pip install]
[Config: dotenv + Pydantic BaseSettings]
[H1: Title + one-sentence summary]
[H2: Objective]
[H2: Prerequisites]
[H2: Architecture Diagram (Mermaid)]
[H2: Step 1 — Name]
  [Markdown: why + expected output + common errors]
  [Code cell]
[H2: Step N — Name] × N steps
[H2: Cleanup]
```

Plus a `Makefile`:
```makefile
jupyter:
	source .venv/bin/activate && jupyter lab
```

---

## Anti-Patterns
- Never hardcode API keys, tokens, or credentials in any cell — use `python-dotenv` + Pydantic.
- Never write a code cell longer than ~30 lines — split into named functions.
- Never skip the reproducibility block — a notebook without setup instructions cannot be shared.
- Never omit expected output description before a long-running LLM call — readers don't know if it's working.
- Never use vague prerequisites like "install the usual libraries" — list every package with its version.
- Never leave error cells in a saved notebook — clear all outputs and re-run clean before saving.

---

## Examples

**Input:** "Write a tutorial on building a ReAct agent with LangChain and OpenAI."

**Output structure:**
```
[pip install langchain==0.2.0 openai==1.30.0 python-dotenv pydantic-settings]
[Pydantic: class Settings(BaseSettings): openai_api_key: str]
[H1: Build a ReAct Agent with LangChain]
[H2: Objective — build a tool-using agent that reasons before acting]
[H2: Prerequisites — OpenAI API key, Python 3.10+]
[H2: Architecture — Mermaid: User → Agent Loop → Tool Call / Direct Answer → User]
[H2: Step 1 — Define Tools]
  [Why: tools give the agent the ability to act in the world beyond text]
  [Code: @tool def search(query: str) -> str: ...]
[H2: Step 2 — Initialize Agent]
  [Why: ReAct = Reason + Act, enables multi-step problem solving]
  [Code: agent = create_react_agent(llm, tools, prompt)]
[H2: Step 3 — Run and Inspect Traces]
  [Why: tracing the chain of thought reveals whether the agent is reasoning correctly]
  [Code: result = agent.invoke({"input": "What is the capital of France?"})]
[H2: Cleanup — close any open clients]
```

---

## Tutorial Specialization
- Before writing any code, search for the latest stable version of all libraries used.
- For AI agent tutorials: always include a Mermaid sequence diagram showing the agent decision loop.
- For API tutorials: include an auth flow cell and a rate-limit retry example with exponential backoff.
- Use `f-strings` for all logging and print statements so readers can trace agent thought processes.
- For long-running cells: add a `%%time` magic and note typical expected duration.
