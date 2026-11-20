# Nexus

My personal collection of skills, agents, commands, and workflows for Claude Code and Codex. The kit itself is Markdown instructions and a few dependency-free Node scripts: no package, nothing published to npm. The only npm-based part is the landing page in `apps/nexus-web`, which Vercel builds and deploys.

## Install

Claude Code (git-based plugin marketplace):

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
/reload-plugins
```

Codex:

```bash
codex plugin marketplace add aayushostwal/nexus
codex plugin add nexus@nexus-marketplace
```

A local clone path works as the marketplace source in place of the GitHub slug. You can also skip the plugin and symlink single files, for example `ln -s "$PWD/agents/code-reviewer.md" ~/.claude/agents/`.

## Layout

```text
skills/     One folder per skill: SKILL.md plus checklists, references, and validation notes
agents/     Specialist agent definitions (one Markdown file each)
commands/   Slash commands
scripts/    Dependency-free Node helpers (catalog, validation, global guidance)
docs/tools/ Setup and safety notes for Slack, Outlook, Notion, Jira, and AWS
test/       node:test suites for the scripts
catalog/    generated.json, the catalog the landing page reads (generated, do not edit)
apps/nexus-web/  Next.js landing page and docs, deployed on Vercel
```

## Workflows

Workflows are skills that run a task from start to finish, so they live in `skills/` where hosts discover them.

- **software-engineer** (`/nexus:software-engineer`): takes a GitHub issue or a bug described in chat, reproduces it, makes a focused fix, runs the project's checks, and opens a PR. It never merges or deploys. Evaluation scenarios and a regression fixture live in `skills/software-engineer/evaluations/`.

```text
/nexus:software-engineer fix issue #123 in the current repository and raise a PR
```

## Catalog

The section between the markers is generated from the source files. Run `node scripts/generate-catalog.js` after adding, renaming, or removing a skill, agent, or command.

<!-- catalog:start -->

**11 skills**, **14 agents**, and **2 commands**.

### Skills

| Claude invocation | Description |
| --- | --- |
| [`/nexus:debugging`](skills/debugging/SKILL.md) | Use when something is failing, regressing, or behaving unexpectedly and the goal is root-cause analysis, narrowest fix, and verification. |
| [`/nexus:observability`](skills/observability/SKILL.md) | Use for correlated API failures, cascading errors, and distributed-system incident tracing. |
| [`/nexus:performance`](skills/performance/SKILL.md) | Use for memory, CPU, latency, and query-performance investigations, plus dependency-upgrade blast-radius analysis. |
| [`/nexus:prd`](skills/prd/SKILL.md) | Use to write, rewrite, or iterate on a PRD, design doc, technical proposal, or architecture write-up that other people will read and decide on. |
| [`/nexus:reliability`](skills/reliability/SKILL.md) | Use for production incidents, outages, and service degradations, plus release-readiness gate checks. |
| [`/nexus:shorts`](skills/shorts/SKILL.md) | Use to convert any input into a ready-to-record YouTube Shorts script. |
| [`/nexus:skill-writer`](skills/skill-writer/SKILL.md) | Use for creating, refactoring, or debugging skills and improving SKILL.md trigger quality. |
| [`/nexus:software-engineer`](skills/software-engineer/SKILL.md) | Resolve a GitHub issue or a concrete bug described in chat in a local repository, from reproduction through a verified fix and pull request. |
| [`/nexus:testing`](skills/testing/SKILL.md) | Use for flaky or nondeterministic tests, especially local-vs-CI inconsistencies. |
| [`/nexus:token-optimizer`](skills/token-optimizer/SKILL.md) | Always-on token optimization rules. |
| [`/nexus:tutorial`](skills/tutorial/SKILL.md) | Use for creating executable Jupyter tutorials and AI engineering walkthroughs with runnable cells. |

### Agents

| Agent | Description |
| --- | --- |
| [`ai-product-engineer`](agents/ai-product-engineer.md) | Use this agent to design, build, or review LLM-powered features and products end-to-end: model selection, RAG architecture, agent design, eval pipelines, token economics, and LLM observability. |
| [`cloud-cost-optimizer`](agents/cloud-cost-optimizer.md) | Use this agent for cloud cost audits, bill-spike investigations, cost monitoring setup, and "find me a cheaper alternative" requests. |
| [`code-reviewer`](agents/code-reviewer.md) | Use this agent for senior-level review of a PR, branch, or diff. |
| [`codebase-explorer`](agents/codebase-explorer.md) | Use this agent for token-efficient codebase exploration: mapping repo structure, finding where a feature lives, locating entry points and config files, or answering "where is the code for X". |
| [`database-architect`](agents/database-architect.md) | Use this agent for database design and change work: schema design, indexing strategy, query optimization, migration safety, and engine selection. |
| [`docs-app-builder`](agents/docs-app-builder.md) | Use this agent to build a documentation application as a React app — from a repo's README, docs folder, or code. |
| [`event-driven-designer`](agents/event-driven-designer.md) | Use this agent to design or review asynchronous, event-driven systems: queues, streams, pub/sub, sagas, outbox patterns, DLQs. |
| [`iac-engineer`](agents/iac-engineer.md) | Use this agent to design cloud architecture and write the Infrastructure-as-Code for it (Terraform, CDK in Python, CloudFormation), or to audit existing IaC for risk and waste. |
| [`mobile-ux-designer`](agents/mobile-ux-designer.md) | Use this agent to design or review mobile UX for iOS, Android, React Native, or Flutter apps. |
| [`prd-writer-critic`](agents/prd-writer-critic.md) | Use this agent to write or critique Product Requirements Documents. |
| [`roadmap-planner`](agents/roadmap-planner.md) | Use this agent when direction is known and the user needs an execution-ready roadmap: scope, sequencing, dependencies, risks, validation, rollout, and rollback. |
| [`scalability-planner`](agents/scalability-planner.md) | Use this agent to plan how a system scales from its current load to a growth target. |
| [`system-architecture-reviewer`](agents/system-architecture-reviewer.md) | Use this agent for codebase architecture mapping, coupling analysis, bounded-context discovery, monolith-split planning, and deployment-safety review. |
| [`uiux-reviewer`](agents/uiux-reviewer.md) | Use this agent for read-only UI/UX review of web apps — components, pages, flows, or screenshots. |

### Commands

| Claude invocation | Description |
| --- | --- |
| [`/nexus:commit-message`](commands/commit-message.md) | Draft a Conventional Commit message from the staged git diff. |
| [`/nexus:grind`](commands/grind.md) | Practice a technical or behavioral interview through targeted questions and evidence-based feedback. |

<!-- catalog:end -->

## Scripts

Everything runs with Node 18+ and nothing to install:

```bash
node scripts/generate-catalog.js          # refresh the catalog above, the site quickstart, and catalog/generated.json
node scripts/generate-catalog.js --check  # fail if the catalog is stale
node scripts/validate-content.js          # check skill/agent frontmatter, links, manifests
node --test test/*.test.js                # test the scripts
```

The optional global guidance script adds a short block to `~/.claude/CLAUDE.md` or `~/.codex/AGENTS.md` that points the host at these skills. Text outside that block is left alone:

```bash
node scripts/bootstrap-agent-docs.js --runtime claude --dry-run
node scripts/bootstrap-agent-docs.js --runtime claude
node scripts/bootstrap-agent-docs.js --runtime claude --remove
```

## Adding something

1. Skill: create `skills/<name>/SKILL.md` with `name` (matching the folder) and `description` frontmatter. The `skill-writer` skill covers the structure.
2. Agent: create `agents/<name>.md` with `name` (matching the file) and `description` frontmatter.
3. Command: create `commands/<name>.md` with a `description` frontmatter line.
4. Run `node scripts/generate-catalog.js && node scripts/validate-content.js`, then commit.

## Landing page

`apps/nexus-web` is a Next.js site deployed on Vercel. It reads `catalog/generated.json`, so rerun the catalog script before pushing skill or agent changes.

```bash
cd apps/nexus-web
npm ci
npm run dev           # local preview
npm run build         # what Vercel runs
npm run test:browser  # Playwright checks (Node 20+)
```

## Privacy

The scripts run locally and send nothing anywhere. The skills and agents only tell a host what to do. Whatever a host or connector (GitHub, Slack, Jira, and so on) does with your data follows that host's own settings. Keep secrets out of issues, PRs, logs, and committed fixtures.

## License

[MIT](LICENSE)
