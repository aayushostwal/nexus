# Exploring Anti-Patterns

Common mistakes that make exploration outputs unreliable, unhelpful, or dangerous. Each entry includes the failure mode and the correction.

---

## 1. Recommending Without Searching

**What it looks like:**
The output presents a recommendation and an options table, but no web searches were run. The data comes from training knowledge.

**Why it happens:**
Training data contains information about most major tools. It feels faster to skip searches when the answer seems obvious.

**Why it's harmful:**
- Training data has a knowledge cutoff — a tool that was the community standard 18 months ago may have been superseded
- Version numbers cited from training data are almost always out of date
- The user cannot verify the recommendation because no sources are provided
- In fast-moving ecosystems (LLM tooling, cloud services, JS frameworks), 12-month-old knowledge is actively misleading

**The rule:** Never recommend a technology without running at least 2 web searches. This is not a suggestion — it is a hard rule. If WebSearch is unavailable, state that clearly: "WebSearch is unavailable in this session — the following is based on training data as of [knowledge cutoff] and should be independently verified before committing to this choice."

---

## 2. Presenting 8+ Options (Analysis Paralysis)

**What it looks like:**
The options table has 8 rows: Celery, ARQ, RQ, Dramatiq, Huey, Taskiq, APScheduler, and FastAPI BackgroundTasks.

**Why it happens:**
Wanting to be thorough. Every option found in research is included to show comprehensive coverage.

**Why it's harmful:**
- Users presented with 8 similar-looking options reliably delay decisions
- A decision delayed is worse than a slightly suboptimal decision made today
- The "Avoid If" column becomes the most important column, but it requires deep context to apply — which the user often doesn't have
- More options = longer output, which means less attention per option

**The rule:** Present 2–4 options maximum. Filter the rest by: no release in 2 years, < 500 GitHub stars, community consensus against it for this use case. If two options are nearly identical in fit, include only the one with higher community adoption. Mention filtered-out options only if the user asks.

---

## 3. Not Tying Recommendation to User's Constraints

**What it looks like:**
```
Recommendation: Celery — battle-tested, widely adopted, and supports complex workflows.
```

**Why it's harmful:**
- "Battle-tested" and "widely adopted" are true of many tools and provide no decision signal
- The recommendation doesn't change regardless of the user's stack, scale, or team size
- The user cannot evaluate whether the recommendation fits their specific situation

**Correction:**
Every recommendation must name at least one user-specific constraint and explain how the recommended tool satisfies it better than the alternatives:

```
Recommendation: ARQ — async-native (matches your Python async stack), Redis backend
(which you already run), and your 500 jobs/day load puts you well within ARQ's
capabilities without needing Celery's multi-broker routing overhead.
```

The test: if you could copy-paste this recommendation into a different user's session and it would still be correct, it is too generic.

---

## 4. Citing 3-Year-Old Benchmark Data

**What it looks like:**
The trade-off matrix cites a 2021 benchmark showing Tool A handles 50k msg/sec — used to justify recommending Tool A for a user who needs 50k events/sec.

**Why it happens:**
Benchmark blog posts are among the most shared technical content online. Older posts often rank higher in search. The numbers look authoritative.

**Why it's harmful:**
- Tool performance changes significantly across major versions (Kafka 3.x vs 2.x throughput is very different)
- Infrastructure benchmarks assume specific hardware and cloud instance types that change over time
- A 2021 benchmark may have been run under conditions that don't reflect the user's setup
- Citing stale data while claiming to do research is worse than citing no data — it creates false confidence

**The rule:** Only cite benchmark data from within the past 2 years. If the only benchmark data available is older, note the date and add: "Verify this benchmark applies to the current version before committing to this choice."

**Correction:** Instead of citing a 3-year-old benchmark, search for current community experience: `"[tool] performance [year] production"` on Reddit/HN often surfaces recent real-world numbers with version context.

---

## 5. Implementing Before User Confirms

**What it looks like:**
The exploration output ends with "Recommendation: ARQ" and then immediately writes out the full `worker.py` implementation without waiting for the user to confirm.

**Why it happens:**
Wanting to be efficient. The recommendation feels obvious.

**Why it's harmful:**
- The user may have a constraint that changes the recommendation (e.g., "we actually already have Celery running in prod")
- Starting implementation locks in the approach before the user has reviewed the trade-offs
- If the user pushes back after code is written, unraveling the implementation is wasteful
- Asking for confirmation is a 5-second step that prevents potentially hours of rework

**The rule:** Always end the options+recommendation block with the confirmation question. Do not start implementation (or route to planning) until the user explicitly confirms.

---

## 6. Routing Both to Planning and Implementing

**What it looks like:**
"I'll hand this off to nexus:planning for the full plan, and in the meantime here's a quick implementation to get you started..."

**Why it's harmful:**
- The quick implementation creates technical debt that the planning output will have to work around
- The plan may recommend a different structure than the quick implementation used
- The user now has to reconcile two partially-done outputs
- Planning and implementation are sequential, not parallel — the plan defines the implementation approach

**The rule:** Pick exactly one path and follow it completely. If routing to planning, do not implement. If implementing directly, do not hand off to planning.
