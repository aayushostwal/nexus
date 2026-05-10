# Planning Engineering Heuristics

Practical decision rules for producing high-quality, actionable technical plans.

---

## Diagram Type Selection

Use these rules to pick the right Mermaid diagram type without deliberating:

| Change type | Diagram to use | Why |
|-------------|---------------|-----|
| Request/response flow, async messaging, user journey | `sequenceDiagram` | Shows ordering and actors clearly |
| New database tables, schema changes, foreign keys | `erDiagram` | Makes relationships and cardinality explicit |
| New service, significant new module, system boundary change | C4 container diagram | Shows how components fit into the larger system |
| State machine or workflow with branches | `stateDiagram-v2` | Makes transitions and conditions visible |
| Deployment topology, network/VPC layout | `graph TD` or `graph LR` | Flexible for infra topologies |

**Rule:** If the change touches more than one service or module, a diagram is not optional — always include one.

**Rule:** Use `sequenceDiagram` as the default when unsure. It is the most universally readable.

---

## Identifying "Hidden" Dependencies

Surface these before writing the scoping table, not after:

**Shared libraries / internal packages**
- Search for the module being changed in `import` statements across the entire repo: `grep -r "from app.auth import" .`
- Check `pyproject.toml`, `package.json`, or `go.mod` for internal workspace references
- If the repo publishes a package (npm, PyPI, internal artifactory), treat downstream consumers as hard dependencies

**Shared infrastructure**
- Check if the DB, queue, or cache is used by more than one service (look for the same connection string across repos or `.env` templates)
- Check if the component being modified is in a shared VPC or security group referenced by other stacks
- For AWS: `aws resourcegroupstaggingapi get-resources` to find what shares a tag/resource

**Shared teams**
- Any route or schema change visible to other teams is a cross-team dependency
- Any change to an IAM role, SG, or VPC affects the platform/infra team
- Any change to a CI/CD pipeline step affects whoever owns the pipeline

**Event consumers**
- If the service emits events (Kafka, SQS, SNS, EventBridge), list every known consumer as a dependency
- Schema changes to events are breaking changes — treat as `High` risk regardless of apparent scope

---

## Estimating Task Complexity

Use this rubric to decide if a task should be split:

| Signal | Suggested action |
|--------|-----------------|
| Change touches > 3 files | Split into sub-tasks by file or concern |
| Change requires a schema migration | Always a separate task from the application code change |
| Change requires infra provisioning | Always a separate task (infra must be verified before app code depends on it) |
| Change involves > 1 team | Each team's required action is its own task |
| Change requires a backfill on > 1M rows | Backfill is its own task with its own rollback condition |
| Estimated lines changed > 200 | Reconsider — this is likely > 1 day of work and should be split |
| "And then we also…" appears in description | Split — the conjunction signals a second task |

**Rule:** If a single task cannot be verified with a single shell command or test, it is too large.

---

## Risk Classification Heuristics

Assign risk level based on the blast radius and reversibility, not the likelihood of failure:

**Low risk**
- Change is isolated to one file, one module, or one route
- Reversible with a one-command rollback (e.g., revert a config value, remove a package)
- No downstream consumers depend on the changed interface
- Failure is immediately visible (app fails to start or returns an explicit error)

**Medium risk**
- Change touches 2–3 files or modules
- Requires a deploy to take effect (no instant rollback)
- Downstream consumers exist but are known and can be notified
- Failure may not be immediately visible (silent data corruption risk, gradual latency increase)

**High risk**
- Irreversible or requires a manual rollback procedure (DB migration, data backfill, DNS change)
- Failure affects all users or all routes (not a subset)
- Multiple downstream consumers, not all known
- Involves production secrets, IAM permissions, or network security group changes
- Cannot be tested fully in staging (production-specific data, load, or integrations required)

**Rule:** When between Low and Med, round up to Med. When between Med and High, round up to High. Underestimating risk is always more costly than overestimating it.

---

## When to Split a Single Step Into Multiple Steps

Split when any of the following are true:

1. The step cannot be verified until a later step is also done — split so each is independently verifiable
2. The step involves provisioning infrastructure AND application code — always two steps (infra first)
3. The step involves a schema migration AND a code change that reads the new schema — always two steps
4. The step touches both the happy path AND error handling — consider splitting for clarity
5. The "Verify:" command for the step involves more than one distinct assertion
6. The step would take more than 2–3 hours to complete

**Rule:** A step should be completable by one engineer in one focused work block without needing to switch contexts.

---

## Ordering Implementation Steps

Apply these ordering rules in sequence:

1. **Infrastructure before application** — provision resources before the app code that depends on them
2. **Schema migrations before code** — never deploy code that reads a column that doesn't exist yet
3. **Reverse migrations before forward code** — if the migration is reversible, apply the reverse migration script first, then deploy the forward code (blue-green safety)
4. **No-op code before cutover** — deploy code that handles both old and new state before removing the old state
5. **Feature flags before rollout** — if using flags, add the flag check before enabling the feature
6. **Tests before implementation steps** (when using TDD) — write the failing test, then the implementation
7. **Cleanup after stability** — decommission old resources only after the new system has been stable for an agreed observation period (minimum 48h, recommend 2 weeks for irreversible changes)
