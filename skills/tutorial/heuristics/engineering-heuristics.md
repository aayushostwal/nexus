# Tutorial Engineering Heuristics

Practical decision rules for producing high-quality, runnable Jupyter Notebook tutorials.

---

## When to Split a Tutorial Into Multiple Notebooks

Split when any of the following are true:

| Signal | Action |
|--------|--------|
| Tutorial covers more than 2 distinct concepts (e.g., agent setup AND vector store AND memory) | Split at concept boundaries |
| A single notebook would exceed ~20 meaningful code cells | Split into Part 1 / Part 2 |
| One section requires a different set of prerequisites (different API keys, GPU, etc.) | Split so readers can skip the section that doesn't apply |
| The notebook takes > 10 minutes to run end-to-end | Split at a natural checkpoint so readers can run one part, review output, and continue |
| Step N produces an artifact that Step N+1 consumes (e.g., a trained model, an index file) | Split and load the artifact at the start of Part 2 |

**Rule:** A single notebook should cover one thing well. Two focused notebooks are better than one unfocused one.

**Naming convention for multi-part tutorials:**
```
01-setup-and-tools.ipynb
02-agent-loop.ipynb
03-memory-and-persistence.ipynb
```

---

## Lines Per Code Cell

**Target: max ~30 lines per code cell.**

Apply this rule to decide when to split:

| Situation | Action |
|-----------|--------|
| Function body > 15 lines | Extract into a named helper function defined in the same cell or a prior cell |
| Cell imports + function definition + invocation all in one | Split imports into their own cell if there are > 5 imports |
| Cell defines more than one public function | Split — one concept per cell |
| Cell has both error handling and happy path logic interleaved | Consider splitting: one cell for the helper, one for the invocation with error handling |

**Why this matters:** On GitHub's notebook renderer, long cells force the reader to scroll horizontally or lose context. Short cells are easier to annotate, debug, and extend.

---

## When to Add `%%time` Magic

Add `%%time` to a cell when:

- The cell makes any LLM API call (even a fast one — latency varies and readers want to know)
- The cell loads a large model file (embedding model, local LLM, tokenizer)
- The cell runs a loop over a dataset with more than ~10 items
- The cell makes a network request to an external API
- The cell runs a vector similarity search over a large index
- You have noted in the Markdown cell "expected duration: X seconds" — always back this up with `%%time`

**Do not add** `%%time` to:
- Import cells
- Config cells
- Markdown cells (they don't run)
- Cells that define functions but don't call them

---

## How to Handle LLM Calls That Might Fail

Apply this pattern for every cell that calls an LLM:

**1. Document the failure mode before the cell runs:**
In the Markdown cell preceding the LLM call, always include:
```
**Common errors:**
- `RateLimitError` → add `time.sleep(1)` between calls or switch to a smaller model
- `AuthenticationError` → verify your API key in `.env`
- `Timeout` → the API may be under load; retry in 30 seconds
```

**2. Add a guard against infinite loops:**
For agent loops, always set a maximum iteration count:
```python
agent_executor = AgentExecutor(max_iterations=5, ...)
```

**3. Use `handle_parsing_errors=True` or equivalent:**
Many LLM frameworks have a setting to gracefully handle malformed model output. Always enable it.

**4. Wrap in try/except for demonstration cells:**
For cells that are expected to demonstrate error handling, wrap explicitly:
```python
try:
    result = client.call(...)
except RateLimitError as e:
    print(f"Rate limited: {e}. Sleeping 10s before retry.")
    time.sleep(10)
```

**5. Never leave an error cell in the saved notebook:**
If a cell fails during development, fix it before saving. The reader should never see a red traceback in a saved notebook unless it is a deliberate "this is how errors look" demonstration cell — and that cell must have an explanatory note.

---

## Tone and Comment Style

**Comments explain why, not what:**

| Bad (explains what) | Good (explains why) |
|---------------------|---------------------|
| `# create a list` | `# dedup before API call to avoid double-billing` |
| `# import httpx` | (no comment needed — import is self-evident) |
| `# call the API` | `# async call: releases the event loop while waiting, enabling concurrent requests` |
| `# set temperature to 0` | `# temperature=0 for deterministic output — reproducibility matters in tutorials` |

**f-string logging standard:**
Use f-strings for all print statements so readers can trace agent thought:
```python
# Good
print(f"[Step 2] Loaded {len(documents)} documents from {source_path}")
# Bad
print("Documents loaded.")
```
