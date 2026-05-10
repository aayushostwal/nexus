# Tutorial Anti-Patterns

Common mistakes that make tutorials fail to run, hard to follow, or unsafe to share. Each entry includes the failure mode and the correction.

---

## 1. Hardcoded API Keys

**What it looks like:**
```python
openai_api_key = "sk-proj-abc123..."
client = OpenAI(api_key="sk-proj-abc123...")
```

Or more subtly, in a print statement:
```python
print(f"Using key: {os.getenv('OPENAI_API_KEY')}")
```

**Why it happens:**
It's faster to hardcode during development. The key is right there. "I'll remove it before sharing."

**Why it's harmful:**
- GitHub scans for API key patterns and flags repositories — but it's too late once pushed
- Anyone who clones the repo can use (or revoke) the key
- Print statements that output the full key value expose it in saved notebook output

**Correction:**
Always use `python-dotenv` + Pydantic `BaseSettings`. The key is loaded once in the config cell, accessed via `settings.openai_api_key`, and never printed or logged. If you need to confirm a key is loaded, print only the first/last 4 characters:
```python
print(f"API key loaded: {settings.openai_api_key[:4]}...{settings.openai_api_key[-4:]}")
```

---

## 2. Missing Prerequisites

**What it looks like:**
```markdown
## Prerequisites
- Some Python knowledge
- Install the usual libraries
- An API key
```

**Why it happens:**
The author knows their own setup intimately and forgets what a fresh reader needs.

**Why it's harmful:**
- "The usual libraries" is meaningless — which ones? Which versions?
- "Some Python knowledge" doesn't tell the reader if they need to know async, typing, or OOP
- A reader who hits a missing prerequisite early abandons the tutorial — and blames the author
- "An API key" — for which service? Where do you get it? Is there a free tier?

**Correction:**
Every prerequisite must be specific and actionable:
```markdown
## Prerequisites
| Requirement | Details |
|-------------|---------|
| OpenAI API key | Free at platform.openai.com — ~$0.05 in credits needed to run all cells |
| Python 3.10+ | Check: `python --version` |
| `.env` file | Create one with: `OPENAI_API_KEY=sk-...` |
```

---

## 3. Cells That Run in Non-Sequential Order

**What it looks like:**
Cell 7 uses the variable `agent` which is defined in Cell 10. If the reader runs cells in order, they get a `NameError` on Cell 7.

**Why it happens:**
The tutorial was written while jumping around during development. Jupyter allows running cells out of order, so it worked during authoring.

**Why it's harmful:**
- The tutorial fails for any reader who runs cells sequentially (which is the documented workflow)
- It creates confusion: is the notebook broken, or is the reader doing something wrong?
- It's especially harmful for new readers who don't know to scroll ahead to find the variable definition

**Detection:**
Before saving: in the Kernel menu, click "Restart Kernel and Run All Cells." If any cell produces a `NameError` or `NameError`-like exception, fix the ordering before saving.

**Correction:**
Every variable must be defined before it is used. If a variable needs to be defined after the explanation (for narrative flow), use a forward reference note in Markdown: "We define `agent` in Step 3 — the cell below uses a placeholder until then."

---

## 4. Toy Examples That Don't Generalize

**What it looks like:**
A tutorial on "Building a RAG pipeline" uses a hardcoded list of 3 strings as the document corpus:
```python
documents = ["The sky is blue.", "Water is wet.", "Fire is hot."]
```

**Why it happens:**
Toy data makes the notebook run fast and avoids needing real data setup. It feels simpler.

**Why it's harmful:**
- Readers cannot apply the pattern to their real use case — they can't see where to plug in real data
- The example doesn't surface real problems (chunking, embedding failures, retrieval quality)
- Readers leave the tutorial without the confidence that the pattern works at real scale

**Correction:**
Use the simplest real-world data that is freely available and representative. For a RAG tutorial, use a small public-domain text file or a Wikipedia article fetched at runtime:
```python
import httpx
response = httpx.get("https://en.wikipedia.org/wiki/Python_(programming_language)")
# process real text — now the tutorial shows real chunking behavior
```

If real data requires setup that would distract from the tutorial, use a stub clearly labeled as such, and add a note: "Replace this stub with your real data source — see the comments for how to swap it in."

---

## 5. No Cleanup Cell

**What it looks like:**
The last cell of the notebook runs the main example and prints output. There is no cleanup.

**Why it happens:**
Cleanup feels like boilerplate — the tutorial is already done.

**Why it's harmful:**
- Open HTTP connections (httpx, aiohttp) are not closed, leaking resources
- Local model instances consume GPU/RAM until the kernel is restarted
- Temp files accumulate on the reader's machine
- Vector store connections remain open (some fail noisily, others silently leak)

**Correction:**
Always add a final Cleanup cell:
```python
## Cleanup
# Close all open connections and release resources.
await http_client.aclose()
vectorstore.close()
# Remove temp files created during this notebook
import os
if os.path.exists("temp_index.faiss"):
    os.remove("temp_index.faiss")
print("Cleanup complete.")
```

---

## 6. Vague "Expected Output" Descriptions

**What it looks like:**
```markdown
**Expected output:** The agent will respond with something.
```

**Why it's harmful:**
- The reader can't tell if the output they're seeing is correct or a bug
- For LLM calls with non-deterministic output, "something" is useless — describe the structure
- If the tutorial is used as a reference later, vague expected outputs prevent debugging

**Correction:**
Describe the structure of the output, even if the exact content varies:
```markdown
**Expected output (10–20 seconds):**
A block of `Thought:` / `Action:` / `Observation:` lines printed by the agent,
followed by a `Final Answer:` line. The answer will vary with model temperature —
as long as it contains a number, the agent reasoned correctly.

Example (your output may differ):
```
Thought: I need to find the square root of 38240.
Action: calculator
Action Input: sqrt(38240)
Observation: 195.55
Final Answer: The square root of 38240 is approximately 195.55.
```
