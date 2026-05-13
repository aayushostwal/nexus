# Nexus Agent Kit

<p align="center">
  <img src="apps/nexus-web/public/logos/nexus.svg" alt="Nexus Logo" width="260" />
</p>

Nexus Agent Kit is a plugin-first AI terminal workspace for Codex and Claude Code. It packages reusable skills, specialized agents, terminal commands, and MCP safety conventions so your AI sessions behave consistently across planning, CI/CD debugging, code review, TODO tracking, infrastructure design, tutorials, and tool-connected work.

Instead of re-explaining how you want the assistant to operate in every new repo or terminal, you install Nexus once and get a shared operating model for engineering work.

## Connect

<p align="center">
  <a href="https://nexus-ai.aayushostwal.com/"><img src="https://img.shields.io/badge/Website-000000?style=flat&logo=googlechrome&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://www.linkedin.com/in/aayush-ostwal/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://x.com/ostwal_aayush"><img src="https://img.shields.io/badge/X-000000?style=flat&logo=x&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://www.youtube.com/@AayushOstwal"><img src="https://img.shields.io/badge/YouTube-FF0000?style=flat&logo=youtube&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://github.com/aayushostwal"><img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://medium.com/@aayushostwal"><img src="https://img.shields.io/badge/Medium-12100E?style=flat&logo=medium&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://aayushostwal2.substack.com"><img src="https://img.shields.io/badge/Substack-FF6719?style=flat&logo=substack&logoColor=white" style="margin: 0 4px"/></a>
</p>

<div align="center">
<p>I regularly write about AI, DevOps, Cloud Infrastructure, and Software Engineering. Subscribe to get practical guides, deep dives, and updates.</p>
<a href="https://aayushostwal2.substack.com/subscribe?next=https%3A%2F%2Fsubstack.com%2F%40aayushostwal2&utm_source=profile-page&utm_medium=web&utm_campaign=substack_profile&just_signed_up=true">
<img src="https://img.shields.io/badge/Subscribe%20to%20Newsletter-4F7DF3?style=flat&logo=substack&logoColor=white" />
</a>
</div>

<div align="center">
<p>If this project is useful and you want to support more open-source AI engineering work, you can sponsor it on GitHub.</p>
<a href="https://github.com/sponsors/aayushostwal">
  <img src="https://img.shields.io/badge/GitHub%20Sponsors-EA4AAA?style=flat&logo=githubsponsors&logoColor=white" />
</a>
</div>

## Quick Start

### Install In Codex

Install directly from this GitHub repo:

```bash
npx codex-marketplace add aayushostwal/nexus --plugin --global
```

Project-scoped install:

```bash
npx codex-marketplace add aayushostwal/nexus --plugin --project
```

This is a direct repo install. Users need the repo slug `aayushostwal/nexus`; pushing this repo does not by itself make the plugin searchable in a central Codex marketplace index.

After install, Nexus automatically bootstraps global instruction files on first active plugin run:

- Claude runtime: updates `~/.claude/CLAUDE.md`
- Codex runtime: updates `~/.codex/AGENT.md`

If these files already exist, Nexus appends/updates only its managed block and preserves your existing content.

### Install In Claude Code

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
/reload-plugins
```

After plugin enablement, Nexus auto-runs the same bootstrap flow via plugin hooks and maintains the skills-first instruction block in `~/.claude/CLAUDE.md` without manual setup.

Model router is enabled by default. You can toggle it per repo:

```bash
nexus model-router status
nexus model-router disable
nexus model-router enable
```

## What Nexus Does In Your Terminal

- Coordinate a multi-agent implementation by identifying which tasks can run in parallel.
- Compare approaches for modifying an existing build, deployment, or architecture flow.
- Plan a production feature before implementation.
- Debug a failing CI pipeline after a dependency or config change.
- Investigate why a deploy works locally but fails in GitHub Actions.
- Review a branch for correctness and missing tests.
- Design a production AWS or GCP architecture from a codebase with a cost estimate and Mermaid HLD.
- Audit existing Terraform or Kubernetes setup for SPOFs, security gaps, and cost waste.
- Find free or self-hosted alternatives to Firebase, Heroku, Auth0, Datadog, and other paid services.
- Build a daily brief from TODOs and connected work systems.

## Agents

Nexus ships focused agent definitions that can be reused inside supported terminals.

| Agent | Category | Purpose |
| --- | --- | --- |
| [`nexus-coordinator`](agents/coordinator.md) | ![Coordination](https://img.shields.io/badge/Coordination-0F766E?style=flat) ![Parallelism](https://img.shields.io/badge/Parallelism-0891B2?style=flat) | Decomposes work into a dependency graph, identifies parallel tasks, and routes subtasks to specialist agents. |
| [`nexus-explorer`](agents/explorer.md) | ![Exploration](https://img.shields.io/badge/Exploration-7C3AED?style=flat) ![Research](https://img.shields.io/badge/Research-6D28D9?style=flat) | Compares viable approaches and recommends a path before detailed planning begins. |
| [`nexus-planner`](agents/planner.md) | ![Planning](https://img.shields.io/badge/Planning-1D4ED8?style=flat) ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Produces approval-first technical plans for production work. |
| [`nexus-debugger`](agents/debugger.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) ![CI/CD](https://img.shields.io/badge/CI%2FCD-EA580C?style=flat) | Investigates failures, identifies root cause, and verifies fixes. |
| [`nexus-reviewer`](agents/reviewer.md) | ![Review](https://img.shields.io/badge/Review-7C3AED?style=flat) ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Reviews code and workflows for bugs, regressions, and risk. |
| [`nexus-todo-manager`](agents/todo-manager.md) | ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) ![TODOs](https://img.shields.io/badge/TODOs-14B8A6?style=flat) | Maintains labeled global TODOs and keeps persistent follow-ups organized. |
| [`nexus-social-assistant`](agents/social-assistant.md) | ![Comms](https://img.shields.io/badge/Comms-DB2777?style=flat) ![Briefing](https://img.shields.io/badge/Briefing-EC4899?style=flat) | Builds daily briefs from Slack, Outlook, Jira, and Nexus TODO context. |
| [`nexus-tutorial-architect`](agents/tutorial.md) | ![Teaching](https://img.shields.io/badge/Teaching-059669?style=flat) ![Documentation](https://img.shields.io/badge/Documentation-0EA5E9?style=flat) | Creates executable tutorial notebooks and reproducible learning assets. |
| [`nexus:fast-editor`](agents/fast-editor.md) | ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Minimal, fast agent for small deterministic edits (1–10 lines). No plans, no explanations — just the change. |

## Skills

Skills are grouped below by role so it is easier to understand what the plugin actually adds to the terminal.

### Core Operations

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus`](skills/nexus/SKILL.md) | ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) | Shared operating rules, TODO workflows, daily briefs, and MCP safety behavior. |

### Planning And Research

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-planning`](skills/planning/SKILL.md) | ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) ![Planning](https://img.shields.io/badge/Planning-1D4ED8?style=flat) | Turns an intended technical change into scope, ordered steps, dependencies, risks, validation, and rollout. |
| [`nexus-exploring`](skills/exploring/SKILL.md) | ![Exploration](https://img.shields.io/badge/Exploration-7C3AED?style=flat) ![Research](https://img.shields.io/badge/Research-6D28D9?style=flat) | Determines the right approach when the goal is clear but the design or implementation strategy is still uncertain. |

### Architecture And Design

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-architecture`](skills/architecture/SKILL.md) | ![Architecture](https://img.shields.io/badge/Architecture-0369A1?style=flat) ![Design](https://img.shields.io/badge/Design-0891B2?style=flat) | Reads a codebase and produces a structured map of service boundaries, coupling points, and refactoring opportunities. |
| [`nexus-deployment-safety`](skills/architecture/deployment-safety.md) | ![Architecture](https://img.shields.io/badge/Architecture-0369A1?style=flat) ![Reliability](https://img.shields.io/badge/Reliability-DC2626?style=flat) | Checks a proposed change against deployment history, rollback readiness, and runtime risk factors before rollout. |

### Code Quality

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-code-review`](skills/code-review/SKILL.md) | ![Review](https://img.shields.io/badge/Review-7C3AED?style=flat) ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Reviews a branch for logic correctness, regression risk, test coverage gaps, and observable behavior changes. |

### Infrastructure Planning

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-infra`](skills/infrastructure/SKILL.md) | ![Infrastructure](https://img.shields.io/badge/Infrastructure-0369A1?style=flat) ![Cloud](https://img.shields.io/badge/Cloud-0EA5E9?style=flat) | Entry point for all infrastructure requests — routes to design, evaluate, or free-alternatives based on what the user needs. |
| [`nexus-infra-design`](skills/infrastructure/design.md) | ![Infrastructure](https://img.shields.io/badge/Infrastructure-0369A1?style=flat) ![Planning](https://img.shields.io/badge/Planning-1D4ED8?style=flat) | Scans a codebase and produces a professional HLD with Mermaid diagram, component table, cost estimate, and trade-off matrix. |
| [`nexus-infra-evaluate`](skills/infrastructure/evaluate.md) | ![Infrastructure](https://img.shields.io/badge/Infrastructure-0369A1?style=flat) ![Review](https://img.shields.io/badge/Review-DC2626?style=flat) | Reads existing Terraform, K8s, docker-compose, and CI/CD files to produce a full audit report with short-term and long-term improvement plans. |
| [`nexus-infra-free-alternatives`](skills/infrastructure/free-alternatives.md) | ![Infrastructure](https://img.shields.io/badge/Infrastructure-0369A1?style=flat) ![Cost](https://img.shields.io/badge/Cost-16A34A?style=flat) | Maps every paid cloud service to free, cheap, or self-hosted alternatives grouped by tier, with migration notes per service. |

### Debugging

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-debugging`](skills/debugging/SKILL.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Investigates failures and regressions with root-cause analysis, narrow fixes, verification, and prevention guidance. |
| [`debugging-common`](skills/debugging/common.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Shared debugging rules, output patterns, and checklists. |
| [`debugging-ci-cd`](skills/debugging/ci-cd.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) ![CI/CD](https://img.shields.io/badge/CI%2FCD-EA580C?style=flat) | CI/CD-focused debugging playbook. |
| [`debugging-codebase`](skills/debugging/codebase.md) | ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Application and code regression debugging playbook. |
| [`debugging-frameworks`](skills/debugging/frameworks.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) ![Tooling](https://img.shields.io/badge/Tooling-4B5563?style=flat) | Framework and tooling-specific debugging playbook. |

### Testing

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-testing`](skills/testing/SKILL.md) | ![Testing](https://img.shields.io/badge/Testing-059669?style=flat) ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Identifies why tests fail intermittently and produces targeted fixes rather than retry wrappers. |

### Reliability And Release

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-reliability`](skills/reliability/SKILL.md) | ![Reliability](https://img.shields.io/badge/Reliability-DC2626?style=flat) ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) | Works through an active incident with structured triage, blast radius assessment, and resolution guidance. |
| [`nexus-release-readiness`](skills/reliability/release-readiness.md) | ![Reliability](https://img.shields.io/badge/Reliability-DC2626?style=flat) ![Planning](https://img.shields.io/badge/Planning-1D4ED8?style=flat) | Checks a release candidate against rollback readiness, monitoring coverage, and known risk factors before shipping. |

### Observability

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-observability`](skills/observability/SKILL.md) | ![Observability](https://img.shields.io/badge/Observability-0891B2?style=flat) ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Correlates error spikes, latency anomalies, and log patterns across services to surface the most likely failure origin. |

### Performance

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-performance`](skills/performance/SKILL.md) | ![Performance](https://img.shields.io/badge/Performance-F59E0B?style=flat) | Entry point for all performance requests — routes to memory, dependency, or profiling tracks based on the symptom. |
| [`performance-memory-leak`](skills/performance/memory-leak.md) | ![Performance](https://img.shields.io/badge/Performance-F59E0B?style=flat) ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Instruments a running process, identifies allocation hot paths, and confirms the fix eliminated the leak. |
| [`performance-dependency-blast-radius`](skills/performance/dependency-blast-radius.md) | ![Performance](https://img.shields.io/badge/Performance-F59E0B?style=flat) ![Planning](https://img.shields.io/badge/Planning-1D4ED8?style=flat) | Maps which modules are affected by a dependency upgrade before the upgrade is applied. |

### Education And Documentation

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-tutorial`](skills/tutorial/SKILL.md) | ![Teaching](https://img.shields.io/badge/Teaching-059669?style=flat) ![Documentation](https://img.shields.io/badge/Documentation-0EA5E9?style=flat) | Creates executable Jupyter-style tutorials with reproducible setup. |
| [`skill-writer`](skills/skill-writer/SKILL.md) | ![Documentation](https://img.shields.io/badge/Documentation-0EA5E9?style=flat) ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Helps create or improve new `SKILL.md` workflows. |

### Content And Social

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-shorts`](skills/shorts/SKILL.md) | ![Socials](https://img.shields.io/badge/Socials-E11D48?style=flat) ![Content](https://img.shields.io/badge/Content-F59E0B?style=flat) | Converts ideas, notes, or technical content into YouTube Shorts scripts. |

### Token Efficiency

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-token-saving`](skills/token-saving/SKILL.md) | ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) | Best practices to minimize token usage while preserving output quality in Codex and Claude Code sessions. |

## Commands

| Command | Category | Purpose |
| --- | --- | --- |
| [`/add-todo`](commands/add-todo.md) | ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) ![TODOs](https://img.shields.io/badge/TODOs-14B8A6?style=flat) | Add a classified item to the Nexus TODO system. |
| [`/daily-brief`](commands/daily-brief.md) | ![Comms](https://img.shields.io/badge/Comms-DB2777?style=flat) ![Briefing](https://img.shields.io/badge/Briefing-EC4899?style=flat) | Build a daily brief from TODOs and configured tools. |
| [`/review-branch`](commands/review-branch.md) | ![Review](https://img.shields.io/badge/Review-7C3AED?style=flat) ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Review current branch changes with findings first. |
| [`/stats`](commands/stats.md) | ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) | Show token usage and estimated cost stats for Claude and Codex sessions. |

## Tool Setup Guides

Nexus is designed to work well with MCP-connected tools, but it does not ship credentials or external accounts.

| Tool | Guide | What it adds to Nexus |
| --- | --- | --- |
| [Microsoft / Outlook](docs/tools/microsoft.md) | Microsoft Graph setup and permission guidance. | Mail and calendar context for daily briefs and workflow assistance. |
| [Slack](docs/tools/slack.md) | Slack MCP connection and token scope guidance. | Workspace search, channel context, thread retrieval, and approved messaging workflows. |
| [Notion](docs/tools/notion.md) | Notion MCP and internal integration setup guidance. | Access to pages, databases, and workspace knowledge. |
| [Jira / Atlassian](docs/tools/jira.md) | Atlassian Rovo MCP and API token setup guidance. | Issue, sprint, board, and project context for engineering workflows. |
| [AWS](docs/tools/aws.md) | AWS profile, role, and least-privilege MCP guidance. | Cloud status, logs, metrics, and infrastructure context with approval gates for changes. |

Safety defaults used by the repo:

- Read-only by default.
- Ask before sending messages, email, Jira updates, or cloud changes.
- Keep secrets out of git.
- Prefer scoped credentials, OAuth, or temporary tokens.

### How To Extend Nexus

1. Pick the tool you want to connect.
2. Open the matching setup guide in `docs/tools/`.
3. Configure the MCP connection or provider credentials outside git.
4. Start with read-only access.
5. Only add write permissions when your workflow actually needs them.
6. Keep Nexus approval-first for any external write, send, deploy, or update action.

## Usage In Real Life

| Title | Labels | Screenshots |
| --- | --- | --- |
| Slack TODO Aggregator | ![Slack](https://img.shields.io/badge/Slack-4A154B?style=flat) ![TODOs](https://img.shields.io/badge/TODOs-14B8A6?style=flat) ![Productivity](https://img.shields.io/badge/Productivity-2563EB?style=flat) | ![Slack TODO Aggregator](assets/slack_todo.png) |
| Article to Instagram Short Script Conversion | ![Content](https://img.shields.io/badge/Content-F59E0B?style=flat) ![Instagram](https://img.shields.io/badge/Instagram-E1306C?style=flat) ![Shorts](https://img.shields.io/badge/Shorts-FF0000?style=flat) | ![Article to Instagram Short Script Conversion](assets/shorts.png) |

## Development

Run the local checks with:

```bash
npm test
```

Plugin packaging lives in:

- `.agents/plugins/marketplace.json`
- `.codex-plugin/plugin.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.

## SEO / GEO Tags

`codex plugin`, `claude code plugin`, `ai terminal workflow`, `developer ai assistant`, `ci cd debugging`, `github actions debugging`, `terminal agents`, `mcp tools`, `model context protocol`, `ai coding workflow`, `engineering planning`, `developer productivity`, `prompt engineering`, `tool-connected ai`, `slack mcp`, `notion mcp`, `jira mcp`, `aws mcp`, `ai todo manager`, `daily brief automation`, `cloud infrastructure planning`, `aws architecture design`, `gcp architecture`, `azure architecture`, `infrastructure as code review`, `terraform audit`, `kubernetes review`, `hld generator`, `cloud cost estimation`, `free firebase alternative`, `free heroku alternative`, `supabase`, `render railway flyio`, `self-hosted cloud`, `infrastructure skills`, `devops ai assistant`
