# Planning Anti-Patterns

Common mistakes that make technical plans unactionable, incomplete, or dangerous. Each entry includes the failure mode, why it happens, and the correction.

---

## 1. Starting Implementation Before Scoping Is Approved

**What it looks like:**
The plan describes the scoping table and then immediately writes implementation steps in the same output — or worse, starts writing code — before the user has seen or confirmed the scope.

**Why it happens:**
Trying to be helpful by moving fast. Conflating "I know what to do" with "the user has agreed to this scope."

**Why it's harmful:**
- The user may have constraints you don't know about (budget cap, team bandwidth, freeze window)
- Implementation steps written before scope approval are often invalidated when the user adjusts scope
- Skipping approval creates a false sense of momentum — the plan is not actually approved

**Correction:**
Present the scoping table. Add a visible stop: `---` and `Waiting for your approval before proceeding.` Do not write a single implementation step until the user replies with explicit confirmation.

---

## 2. Vague Risk Levels ("Might Break Something")

**What it looks like:**
```
| Add Redis integration | redis_client.py | High — might break things | None | Proposed |
```

**Why it happens:**
Risk assessment requires actually thinking through failure modes, which takes time. Vague language is a shortcut.

**Why it's harmful:**
- The user cannot make an informed decision about whether to proceed
- "High" risk without specificity is meaningless — it could mean "app crashes on startup" or "one endpoint returns 500"
- No rollback plan can be written without knowing what specifically breaks

**Correction:**
Every risk entry must complete this sentence: "If this fails, [specific component] breaks because [specific reason], which means [specific user impact]."

Example: "High — if Redis is unreachable at startup, `slowapi` raises `ConnectionError` in the limiter middleware, causing all requests to return 500 until Redis is restored or the limiter is set to in-memory mode."

---

## 3. Missing Rollback Plans

**What it looks like:**
The plan has a Validation section but no rollback condition for any High-risk step. Or the rollback says: "Revert the changes."

**Why it happens:**
Rollback planning requires imagining failure — which feels pessimistic mid-plan. "Revert the changes" feels sufficient but is useless under production pressure at 2am.

**Why it's harmful:**
- The on-call engineer executing the rollback has no time to think — they need exact commands
- "Revert the changes" on a schema migration that has already run on production is not possible
- Missing rollback for irreversible steps (DB migrations, DNS changes, data backfills) means no recovery path

**Correction:**
For every task marked `High` risk, the plan must include:
```
Rollback: if [specific observable signal] → run [exact command or sequence]
```

Example:
```
Rollback: if CloudWatch alarm CDCLatencyTarget > 5000ms fires during cutover
→ revert DATABASE_URL to source PG in .env, run `systemctl restart app`, confirm writes flowing to source PG via pgbench
```

---

## 4. Underestimating Cross-Team Dependencies

**What it looks like:**
A plan for a schema migration lists no dependencies, but the table is read by a data warehouse pipeline owned by the analytics team.

**Why it happens:**
The planner only looks at the immediate codebase. Cross-team consumers are often in separate repos, separate environments, or undocumented.

**Why it's harmful:**
- The analytics pipeline breaks silently when the schema changes
- The other team finds out from a broken dashboard, not from a heads-up
- Reverting the schema change is now much harder because the analytics pipeline has been running against the new schema

**How to detect cross-team dependencies:**
- Check if the table/API is mentioned in a data dictionary, analytics config, or internal wiki
- Search for the table name or endpoint in all repos the organization owns (not just the current one)
- Check CloudWatch/Datadog for consumers of the service (who calls this endpoint?)
- Ask directly: "Are there any analytics pipelines, data exports, or other services that read this data?"

**Correction:**
Add a dependency row: `Notify analytics team + confirm their pipeline handles new schema | analytics team | Med — pipeline may silently drop rows on schema mismatch | Step 3 (migration run) | Proposed`

---

## 5. Planning Too Far Ahead (Over-Engineering the Plan)

**What it looks like:**
A plan to add a new API endpoint includes:
- A new microservice
- A new database
- A message queue for decoupling
- A new CDN layer
- A monitoring dashboard
- A disaster recovery runbook

...when the actual requirement is a single FastAPI route that calls an existing DB.

**Why it happens:**
Planning for future scale feels responsible. The planner imagines worst-case future requirements and builds a plan for those instead of the current requirement.

**Why it's harmful:**
- Overbuilt plans are never fully executed — the extra steps become technical debt
- The user loses trust in the plan because the scope is wildly disproportionate
- Implementation time and cost estimates are wrong by 5–10x
- Future requirements may never materialize, making the over-engineering permanently wasted effort

**The rule:**
Plan for the stated requirement at the stated scale. If future scale might change the architecture fundamentally, add a single note: "Note: if traffic grows beyond X, consider Y." Do not plan Y.

**Correction:**
Before finalizing a plan, ask: "Does every step in this plan directly contribute to the stated requirement?" Remove any step that doesn't. If a step might be needed in the future but not now, note it in a "Future Considerations" section — not in the implementation steps.

---

## 6. Steps That Name a Category Instead of a File

**What it looks like:**
```
3. Update the authentication layer to handle the new token format — Depends on: step 2 — Verify: tests pass
```

**Why it happens:**
The planner hasn't read the source code carefully enough to know the exact file.

**Why it's harmful:**
- The engineer executing the plan cannot start without additional research
- "Tests pass" is not a verify command — which tests? Run how?
- Another engineer picking up the plan mid-way has no idea what "authentication layer" refers to

**Correction:**
```
3. `app/auth/jwt_validator.py` — update `decode_token()` to accept both `v1` and `v2` JWT formats using `PyJWT>=2.8.0` — Depends on: step 2 — Verify: `pytest tests/test_jwt_validator.py -v` shows all 12 tests passing
```

---

## 7. Architecture Diagram for a Single-File Change

**What it looks like:**
A plan to add a `@property` method to a Python model class includes a full C4 container diagram showing the entire system.

**Why it happens:**
Copying the plan format mechanically without applying judgment about what adds value.

**Why it's harmful:**
- Irrelevant diagrams add noise and make the actual plan harder to read
- The user spends time interpreting a diagram that adds no information
- It signals the planner didn't think about what the change actually touches

**Correction:**
Include a diagram only if the change touches more than one service or module. For single-file, single-module changes: omit the diagram and note "Single-module change — no architecture diagram required."
