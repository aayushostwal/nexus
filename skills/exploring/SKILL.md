---
name: nexus-exploring
description: >
  Use when the goal is clear but implementation direction is uncertain. Trigger for option comparison,
  trade-off analysis, constraint discovery, and recommendation before detailed planning.
  Applies to new builds and existing systems where approach selection is the primary uncertainty.
  When in doubt, use this skill.
---

# Nexus Exploring

Research real-world implementations, synthesize trade-offs, and route to implementation or planning.

---

## Compatibility
- Required tools: WebSearch, WebFetch
- Hands off to: `nexus:planning` (large/complex tasks) or implements directly (small tasks)

---

## Workflow

### Step 1 — Extract the Goal
If the goal is ambiguous, ask one clarifying question. Extract:
1. **What** the user wants to build or achieve (specific output or behavior)
2. **Context**: existing stack, language, cloud provider, team size
3. **Scale signals**: expected load, data volume, number of services touched

Do not proceed until you can state the goal in one sentence:
> *"Build [X] that does [Y] given [Z] constraints."*

### Step 2 — Search for Real-World Implementations
Run 2–3 targeted web searches using all of these query patterns:

| Query pattern | Example |
|---------------|---------|
| `"[goal] [language] best library [year]"` | `"job queue python best library 2024"` |
| `"[tool A] vs [tool B] [language] comparison"` | `"celery vs arq vs rq fastapi"` |
| `"[goal] [language] site:reddit.com OR site:news.ycombinator.com"` | `"job queue python site:reddit.com"` |

For each result:
- **Prefer:** official docs, GitHub repos (check stars + last commit date), engineering blogs from Stripe/Shopify/Airbnb/Uber, benchmark posts
- **Deprioritize:** SEO listicles, results older than 2 years (unless the tool is foundational like PostgreSQL)
- Fetch the primary URL for the top 2 options to get version numbers and release dates

### Step 3 — Synthesize Options Table
Build a comparison table with exactly these columns:

| Option | Stars | Last Release | Complexity | Best For | Avoid If |
|--------|-------|--------------|------------|----------|----------|
| Tool A | 24k | 2024-03 | High | [use case] | [anti-use-case] |
| Tool B | 1.8k | 2024-01 | Low | [use case] | [anti-use-case] |

Rules:
- Include 2–4 options only — no more.
- Exclude any option with no release in the past 2 years.
- Add a **Community Consensus** line: what does the community actually reach for most? (e.g., "r/Python and HN consistently recommend X for async FastAPI apps.")

### Step 4 — Make a Recommendation
State one recommendation with a one-sentence rationale tied to the user's specific constraints:
> **Recommendation: [Tool]** — [one sentence why it fits their stack/scale/team best].

Then ask: *"Does this match your thinking, or want to explore another option?"*
**Wait for confirmation before routing.**

### Step 5 — Complexity Routing
After the user confirms, apply this decision tree:

```
Is the task > 1 day of work OR touches > 2 services/files OR involves infra/migrations?
├── YES → invoke nexus:planning with the confirmed recommendation as the chosen approach
└── NO  → implement directly, starting with the smallest working version
```

**Signals of HIGH complexity → hand off to nexus:planning:**
- Multi-service integration (queue + worker + monitoring + infra provisioning)
- Database schema migrations or infra changes (Terraform, CDK)
- API contract changes visible to other teams
- Performance-critical paths needing benchmarking before commit

**Signals of LOW complexity → implement directly:**
- Single-library addition with < 2 new files
- Configuration or environment variable change
- Reversible prototype with no downstream consumers
- Change isolated to one module or route

---

## Output Format

```
## Exploring: [Goal in one sentence]

### Options
| Option | Stars | Last Release | Complexity | Best For | Avoid If |
|--------|-------|--------------|------------|----------|----------|
...

**Community Consensus:** [one sentence — what do practitioners actually reach for]

### Recommendation
**[Tool/Approach]** — [one sentence rationale tied to user's constraints]

### Next Step
[One of:]
- "Complexity: LOW → implementing directly now."
- "Complexity: HIGH → handing off to nexus:planning with [Tool] as the chosen approach."
```

---

## Anti-Patterns
- Never recommend a technology without running at least 2 web searches — gut feel is not research.
- Never present more than 4 options — analysis paralysis is a worse outcome than a suboptimal choice.
- Never implement before the user explicitly confirms the recommendation.
- Never hand off to planning for a single-file or single-library change — over-planning is waste.
- Never cite a search result older than 2 years as primary evidence for a fast-moving ecosystem.
- Never skip Step 1 — building the right thing wrongly is better than building the wrong thing perfectly.
- Never route to planning AND implement — pick one path and follow it.

---

## Examples

**Input:** "I want to add a background job queue to my FastAPI app. Not sure if I should use Celery, ARQ, or something else."

**Step 1 goal:** *"Add async background task processing to a FastAPI app (Python, async, team of 2, moderate load)."*

**Step 2 searches run:**
- `"fastapi background job queue python 2024"`
- `"celery vs arq vs rq fastapi comparison"`
- `"fastapi task queue site:reddit.com"`

**Output:**
```
## Exploring: Add background job queue to FastAPI app

### Options
| Option | Stars | Last Release | Complexity | Best For | Avoid If |
|--------|-------|--------------|------------|----------|----------|
| Celery | 24k | 2024-03 | High | Large teams, complex multi-queue workflows | Small teams, simple async jobs |
| ARQ | 1.8k | 2024-01 | Low | FastAPI-native async, Redis-backed | Need multi-broker or non-Redis backend |
| RQ | 9.5k | 2024-02 | Low | Simple jobs, easy ops, Redis | Need async/await support |

**Community Consensus:** FastAPI-focused threads consistently recommend ARQ for async apps;
Celery for teams needing battle-tested production routing at scale.

### Recommendation
**ARQ** — async-native, minimal boilerplate, and your load and team size don't justify
Celery's operational overhead.

### Next Step
Complexity: LOW (one library + one worker file, no infra changes) → implementing directly now.
```

→ Implements: `pip install arq`, creates `worker.py`, wires `lifespan` in FastAPI app — done in one session.

---

**Input:** "We want to migrate our monolith to microservices. Not sure if we should use Kafka, RabbitMQ, or just REST calls between services."

→ Complexity routing after research: HIGH (multi-service, infra, team-visible contracts) → hands off to `nexus:planning` with "event-driven via Kafka" as the confirmed approach.

---

## Research Specialization

**Source credibility rank** (highest to lowest):
1. Official documentation + changelogs
2. Engineering blogs: Stripe, Shopify, Airbnb, Uber, Netflix
3. GitHub Issues/Discussions on the tool's own repo
4. Hacker News threads (`site:news.ycombinator.com`)
5. Reddit (`r/python`, `r/devops`, `r/MachineLearning`, etc.)
6. Stack Overflow (for specific error/config questions)
7. Generic blog posts (use only to discover options, not to validate them)

**Domain-specific search additions:**
- AI/ML tools: also check Hugging Face forums and Papers With Code leaderboards
- Infra/cloud: check AWS/GCP/Azure pricing pages as part of the trade-off table
- Frontend: check npm download trends (npmtrends.com) alongside GitHub stars
- Databases: check db-engines.com ranking for category context

Always cite at least one URL per recommended option so the user can verify independently.
