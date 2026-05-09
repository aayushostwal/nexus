# Nexus Agent Kit

Nexus Agent Kit is a plugin-first workflow layer for Codex and Claude Code. It packages reusable skills, specialized agents, terminal commands, and MCP safety conventions so your AI sessions behave consistently across planning, debugging, TODO tracking, tutorials, and tool-connected work.

Instead of re-explaining how you want the assistant to operate in every new repo or terminal, you install Nexus once and get a shared operating model for engineering work.

## Connect

<p align="center">
  <a href="https://www.linkedin.com/in/aayush-ostwal/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://x.com/ostwal_aayush"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://www.youtube.com/@AayushOstwal"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://github.com/aayush977"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://medium.com/@aayushostwal"><img src="https://img.shields.io/badge/Medium-12100E?style=for-the-badge&logo=medium&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://aayushostwal.substack.com"><img src="https://img.shields.io/badge/Substack-FF6719?style=for-the-badge&logo=substack&logoColor=white" style="margin: 0 4px"/></a>
</p>

<div align="center">
<p>I regularly write about AI, DevOps, Cloud Infrastructure, and Software Engineering. Subscribe to get practical guides, deep dives, and updates.</p>
<a href="https://aayushostwal2.substack.com/subscribe?next=https%3A%2F%2Fsubstack.com%2F%40aayushostwal2&utm_source=profile-page&utm_medium=web&utm_campaign=substack_profile&just_signed_up=true">
<img src="https://img.shields.io/badge/Subscribe%20to%20Newsletter-4F7DF3?style=for-the-badge&logo=substack&logoColor=white" />
</a>
</div>

<div align="center">
<p>If this project is useful and you want to support more open-source AI engineering work, you can sponsor it on GitHub.</p>
<a href="https://github.com/sponsors/aayushostwal">
  <img src="https://img.shields.io/badge/GitHub%20Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" />
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

### Install In Claude Code

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
/reload-plugins
```

## What It Does

Once installed, Nexus changes how your terminal assistant works:

- Adds a shared operating style for Codex and Claude Code sessions.
- Maintains a global TODO file at `~/.nexus/TODOS.md`.
- Supports daily briefs built from TODOs and configured MCP tools.
- Provides specialized agents for planning, debugging, review, tutorials, and communications summaries.
- Routes common requests through reusable skills instead of relying on one-off prompting.
- Enforces approval-first safety rules for Slack, Outlook, Jira, AWS, and other connected systems.

### In Your Terminal

You can use Nexus in a few common ways:

| Workflow | What happens |
| --- | --- |
| TODO tracking | The assistant classifies work and stores it in `~/.nexus/TODOS.md`. |
| Daily brief | The assistant reads TODO state and optionally connected tools to summarize what needs attention. |
| Planning | Large or risky work gets scoped before implementation. |
| Debugging | Failures are routed into CI/CD, codebase, or framework debugging flows. |
| Review | Code review focuses on bugs, regressions, and missing tests. |
| Tutorials | The assistant can generate executable notebook-style technical walkthroughs. |
| Content | The repo includes a short-form content writing skill for YouTube Shorts. |

### Commands

| Command | File | Purpose |
| --- | --- | --- |
| `/add-todo` | [commands/add-todo.md](commands/add-todo.md) | Add a classified item to the Nexus TODO system. |
| `/daily-brief` | [commands/daily-brief.md](commands/daily-brief.md) | Build a daily brief from TODOs and configured tools. |
| `/review-branch` | [commands/review-branch.md](commands/review-branch.md) | Review current branch changes with findings first. |

## Agents

Nexus ships focused agent definitions that can be reused inside supported terminals.

| Agent | File | Purpose |
| --- | --- | --- |
| `nexus-planner` | [agents/planner.md](agents/planner.md) | Produces approval-first technical plans for production work. |
| `nexus-debugger` | [agents/debugger.md](agents/debugger.md) | Investigates failures, identifies root cause, and verifies fixes. |
| `nexus-reviewer` | [agents/reviewer.md](agents/reviewer.md) | Reviews code and workflows for bugs, regressions, and risk. |
| `nexus-todo-manager` | [agents/todo-manager.md](agents/todo-manager.md) | Maintains and classifies global Nexus TODOs. |
| `nexus-comms-briefing` | [agents/comms-briefing.md](agents/comms-briefing.md) | Summarizes Slack, Outlook, Jira, and TODO context into a daily brief. |
| `tutorial-architect` | [agents/tutorial.md](agents/tutorial.md) | Creates executable tutorial-style notebooks and learning flows. |

## Skills

Skills are grouped below by role so it is easier to understand what the plugin actually adds to the terminal.

### Core Operations

| Skill | File | Purpose |
| --- | --- | --- |
| `nexus` | [skills/nexus/SKILL.md](skills/nexus/SKILL.md) | Shared operating rules, TODO workflows, daily briefs, and MCP safety behavior. |

### Planning And Research

| Skill | File | Purpose |
| --- | --- | --- |
| `nexus-planning` | [skills/planning/SKILL.md](skills/planning/SKILL.md) | Produces structured engineering plans before implementation begins. |
| `nexus-exploring` | [skills/exploring/SKILL.md](skills/exploring/SKILL.md) | Researches technology options, compares trade-offs, and routes toward planning or implementation. |

### Debugging

| Skill | File | Purpose |
| --- | --- | --- |
| `nexus-debugging` | [skills/debugging/SKILL.md](skills/debugging/SKILL.md) | Routes debugging work into CI/CD, codebase, or framework-specific flows. |
| `debugging-common` | [skills/debugging/common.md](skills/debugging/common.md) | Shared debugging rules, output patterns, and checklists. |
| `debugging-ci-cd` | [skills/debugging/ci-cd.md](skills/debugging/ci-cd.md) | CI/CD-focused debugging playbook. |
| `debugging-codebase` | [skills/debugging/codebase.md](skills/debugging/codebase.md) | Application and code regression debugging playbook. |
| `debugging-frameworks` | [skills/debugging/frameworks.md](skills/debugging/frameworks.md) | Framework and tooling-specific debugging playbook. |

### Education And Documentation

| Skill | File | Purpose |
| --- | --- | --- |
| `nexus-tutorial` | [skills/tutorial/SKILL.md](skills/tutorial/SKILL.md) | Creates executable Jupyter-style tutorials with reproducible setup. |
| `skill-writer` | [skills/skill-writer.md/SKILL.md](skills/skill-writer.md/SKILL.md) | Helps create or improve new `SKILL.md` workflows. |

### Content And Social

| Skill | File | Purpose |
| --- | --- | --- |
| `nexus-shorts` | [skills/shorts/SKILL.md](skills/shorts/SKILL.md) | Converts ideas, notes, or technical content into YouTube Shorts scripts. |

## Tool Setup Guides

Nexus is designed to work well with MCP-connected tools, but it does not ship credentials or external accounts.

| Tool | Guide |
| --- | --- |
| Microsoft / Outlook | [docs/tools/microsoft.md](docs/tools/microsoft.md) |
| Slack | [docs/tools/slack.md](docs/tools/slack.md) |
| Notion | [docs/tools/notion.md](docs/tools/notion.md) |
| Jira / Atlassian | [docs/tools/jira.md](docs/tools/jira.md) |
| AWS | [docs/tools/aws.md](docs/tools/aws.md) |

Safety defaults used by the repo:

- Read-only by default.
- Ask before sending messages, email, Jira updates, or cloud changes.
- Keep secrets out of git.
- Prefer scoped credentials, OAuth, or temporary tokens.

## Add More Tools

You can expand the Nexus engine by connecting more MCP-backed tools. The docs in [docs/tools](docs/tools) describe the recommended setup model, access scope, and safety rules for each integration.

### How To Extend Nexus

1. Pick the tool you want to connect.
2. Open the matching setup guide in `docs/tools/`.
3. Configure the MCP connection or provider credentials outside git.
4. Start with read-only access.
5. Only add write permissions when your workflow actually needs them.
6. Keep Nexus approval-first for any external write, send, deploy, or update action.

### Available Tool Guides

| Tool | File | What it adds to Nexus |
| --- | --- | --- |
| Microsoft / Outlook | [docs/tools/microsoft.md](docs/tools/microsoft.md) | Mail and calendar context for daily briefs and workflow assistance. |
| Slack | [docs/tools/slack.md](docs/tools/slack.md) | Workspace search, channel context, thread retrieval, and approved messaging workflows. |
| Notion | [docs/tools/notion.md](docs/tools/notion.md) | Access to pages, databases, and workspace knowledge. |
| Jira / Atlassian | [docs/tools/jira.md](docs/tools/jira.md) | Issue, sprint, board, and project context for engineering workflows. |
| AWS | [docs/tools/aws.md](docs/tools/aws.md) | Cloud status, logs, metrics, and infrastructure context with approval gates for changes. |

### Recommended Integration Pattern

- Use OAuth, SSO, or temporary credentials where possible.
- Avoid storing secrets in this repository.
- Give each tool the minimum scope needed.
- Validate read access before enabling write capabilities.
- Keep write actions explicitly user-approved.

## Development

Run the local checks with:

```bash
npm run lint
npm test
npm pack --dry-run
```

Install the pre-commit hook with:

```bash
npm run hooks:install
```

Version sync keeps these files aligned with `package.json`:

- `.agents/plugins/marketplace.json`
- `.codex-plugin/plugin.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

If you need to re-sync manually:

```bash
node scripts/sync-versions.js
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.
