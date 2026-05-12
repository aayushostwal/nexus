# Exploring Execution Checklist

Use this checklist before presenting any exploration output. Every item must be checked before delivering a recommendation.

---

## Step 1 — Goal Extraction

- [ ] The goal is stated in one sentence using the format: "Build [X] that does [Y] given [Z] constraints."
- [ ] The existing stack is captured (language, framework, cloud provider, runtime version)
- [ ] Scale signals are captured (expected load, data volume, number of services)
- [ ] Team size is captured — it affects complexity routing (small team = avoid high-ops tools)
- [ ] If the goal was ambiguous, exactly one clarifying question was asked (not a list of questions)
- [ ] The one-sentence goal was not assumed — it reflects the user's actual intent

---

## Step 2 — Research Quality

- [ ] At least 2 distinct web searches were run (not just one)
- [ ] At least one search used a community source (`site:reddit.com` or `site:news.ycombinator.com`)
- [ ] At least one search included the current year (2025 or 2024) to bias toward recent results
- [ ] The primary URL for each of the top 2 options was fetched (not just search snippet text)
- [ ] Version numbers and release dates were confirmed from official docs or GitHub releases — not from a blog post
- [ ] No search result older than 2 years was used as primary evidence for a fast-moving tool

**Domain-specific search additions (check relevant rows):**

| Domain | Additional check |
|--------|-----------------|
| AI/ML tools | Checked Hugging Face forums or Papers With Code? |
| Infra/cloud | Checked official pricing page for cost comparison? |
| Frontend | Checked npmtrends.com for download trends? |
| Databases | Checked db-engines.com for category ranking context? |

---

## Step 3 — Options Table Completeness

- [ ] The table has exactly 2–4 options (not 1, not 5+)
- [ ] No option in the table has had no release in the past 2 years
- [ ] Every option has all columns populated: Stars, Last Release, Complexity, Best For, Avoid If
- [ ] The "Avoid If" column is specific to the user's context — not generic
- [ ] A "Community Consensus" line is included below the table
- [ ] The community consensus cites a specific community (subreddit name, HN, specific blog)
- [ ] At least one source URL is cited per recommended option

---

## Step 4 — Recommendation Quality

- [ ] Exactly one option is recommended (not "it depends" or "either A or B")
- [ ] The recommendation rationale is one sentence tied to the user's specific constraints (stack, scale, team)
- [ ] The rationale does not use generic language like "battle-tested" or "widely adopted" without context
- [ ] The recommendation is not the same tool every time regardless of constraints (check: is this actually the right fit here?)
- [ ] The confirmation question is asked: "Does this match your thinking, or want to explore another option?"
- [ ] **You have not proceeded to routing or implementation before the user confirms**

---

## Step 5 — Complexity Routing

- [ ] The complexity routing decision is stated explicitly (LOW or HIGH — not omitted)
- [ ] The routing decision is based on the actual signals, not a default:
  - LOW: single library addition, < 2 new files, reversible, isolated to one module
  - HIGH: multi-service, infra/migrations, team-visible contracts, performance-critical benchmarking needed
- [ ] If routing to `nexus:planning`, the confirmed approach (the recommended tool) is passed as context
- [ ] If implementing directly: the smallest working version is started (not a full production implementation)
- [ ] You did not route to planning AND start implementing — exactly one path is followed

---

## Freshness Check (run before every exploration)

- [ ] Are the search results recent enough? (< 2 years for fast-moving ecosystems like LLM tooling, JS, cloud services)
- [ ] Is the recommended tool still actively maintained? (check GitHub last commit date)
- [ ] Are the star counts and download numbers from today (not from a blog post from 2022)?
- [ ] If the tool had a major version release recently, does the recommendation reflect the new version's capabilities?
