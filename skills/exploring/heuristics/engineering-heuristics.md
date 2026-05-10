# Exploring Engineering Heuristics

Practical decision rules for conducting high-quality technology exploration and producing well-grounded recommendations.

---

## How Many Options to Present

**Rule: Always present 2–4 options. Never fewer, never more.**

| Situation | Options to present |
|-----------|-------------------|
| Only 1 viable option after research | Present 2: the viable option + the most common alternative with a clear "Avoid If" that matches the user's context |
| 5+ candidates found in research | Narrow to the top 3 by filtering out: no release in 2 years, < 500 GitHub stars, community consensus against it |
| User names 3 specific options | Evaluate exactly those 3 (add a 4th only if research reveals a clearly superior unlisted option) |
| Very niche problem space | 2 options is fine — "there are only 2 credible tools for this" is a valid and honest answer |

**Why more than 4 fails:** Analysis paralysis. When users see 6+ options with similar trade-offs, they delay decisions. A clear recommendation with 3 well-differentiated alternatives is more useful than an exhaustive survey.

---

## Source Credibility Ranking

Apply this ranking when deciding how much weight to give a source. Higher-ranked sources override lower-ranked ones when they conflict:

| Rank | Source type | Trust signal |
|------|-------------|-------------|
| 1 | Official documentation + changelog | Authoritative; always fetch for top 2 options |
| 2 | Engineering blogs from Stripe, Shopify, Airbnb, Uber, Netflix | Real-world scale and production experience |
| 3 | GitHub Issues/Discussions on the tool's own repo | Surface real bugs, known limitations, maintainer responsiveness |
| 4 | Hacker News threads | Community consensus from practitioners; check comment quality |
| 5 | Reddit (r/python, r/devops, r/MachineLearning, etc.) | Useful for "what do people actually reach for?" signal |
| 6 | Stack Overflow | Good for specific error/config questions; weak for tool selection |
| 7 | Generic blog posts / listicles | Use only to discover options; never to validate them |

**Red flags that disqualify a source:**
- SEO-optimized title with no author attribution
- No version number or date in a technical comparison
- Benchmark results without methodology described
- Sponsored content disguised as a neutral comparison

---

## When to Route to Planning vs Implement Directly

Apply this decision tree after the user confirms the recommendation:

```
Does the task touch > 2 services or files?
├── YES → nexus:planning
└── NO
    └── Does it require infra provisioning or schema changes?
        ├── YES → nexus:planning
        └── NO
            └── Does it require coordination with another team?
                ├── YES → nexus:planning
                └── NO
                    └── Is it reversible with a single command?
                        ├── YES → implement directly
                        └── NO → nexus:planning
```

**Shortcut signals for HIGH complexity (always route to planning):**
- Multi-service integration (queue + worker + monitoring + infra)
- Database schema migrations or infra changes (Terraform, CDK)
- API contract changes visible to other teams or external consumers
- Performance-critical paths that need benchmarking before commit
- Any change that requires a rollback plan more complex than "revert the file"

**Shortcut signals for LOW complexity (always implement directly):**
- Single library addition with < 2 new files
- Configuration or environment variable change
- Reversible prototype with no downstream consumers
- Change isolated to one module or route

---

## How to Detect When the User Is Overthinking

Sometimes a good-enough solution already exists and the user is exploring when they should be building. These signals indicate overthinking:

**Signal 1 — The constraint that matters is already satisfied by option A:**
If the user's top stated constraint (e.g., "must be async-native") is only met by one option in the table, there's no real decision to make. Recommend that option and implement directly.

**Signal 2 — The scale doesn't justify the complexity being considered:**
Example: a user with 500 background jobs/day is comparing Kafka vs SQS vs RabbitMQ. At that scale, SQS is vastly over-architected and the exploration itself is unnecessary. State this clearly: "At 500 jobs/day, this is a solved problem — [tool] handles this with zero tuning."

**Signal 3 — The user has already used option A in production:**
If the user mentions they already run Tool A in their stack, bias strongly toward Tool A unless there is a compelling reason not to. Recommending a new tool when the user already has a working one is scope creep.

**Signal 4 — Community consensus is unanimous:**
If every credible source says "use X for this use case," summarize the consensus and recommend X immediately. Don't create artificial balance by listing alternatives that have unanimous community skepticism.

---

## Technology Maturity Signals

Use these signals to assess whether a tool is production-ready:

| Signal | Healthy | Concerning |
|--------|---------|-----------|
| GitHub stars trajectory | Steady growth or stable high count | Plateau or decline after initial spike |
| Release cadence | Regular releases (monthly/quarterly) | Last release > 12 months ago |
| Issue response time | Maintainer responds within 1 week | Open issues with no maintainer response for > 3 months |
| Contributor count | > 10 contributors in last 6 months | 1–2 maintainers, no external contributors |
| Breaking changes | Semantic versioning followed; breaking changes documented | Frequent breaking changes with no migration guide |
| Community adoption | Named in job postings, conference talks, engineering blogs | Mentioned only in the creator's own blog |
| Security audit | CVEs addressed promptly | Open CVEs with no fix or comment from maintainers |

**Rule:** A tool that fails 3 or more of the "Concerning" checks should not be recommended for production use, regardless of how well it fits the technical requirements. Note the concerns in the "Avoid If" column.
