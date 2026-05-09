# Nexus Agent Kit

Nexus Agent Kit is a plugin-first workflow layer for Codex and Claude Code. It packages reusable skills, specialized agents, terminal commands, and MCP safety conventions so your AI sessions behave consistently across planning, debugging, TODO tracking, tutorials, and tool-connected work.

Instead of re-explaining how you want the assistant to operate in every new repo or terminal, you install Nexus once and get a shared operating model for engineering work.

## Connect

<p align="center">
  <a href="https://www.linkedin.com/in/aayush-ostwal/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://x.com/ostwal_aayush"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://www.youtube.com/@AayushOstwal"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" style="margin: 0 4px"/></a>
  <a href="https://github.com/aayushostwal"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" style="margin: 0 4px"/></a>
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

## What Nexus Does In Your Terminal

Nexus is most valuable when the work is ambiguous, technical, or operationally risky. It gives your terminal assistant stronger defaults for planning, debugging, review, and connected-tool workflows.

## In Your Terminal

| Workflow | What Nexus actually improves |
| --- | --- |
| Planning | Converts vague feature requests, infra changes, and architecture ideas into structured implementation plans with scope, risk, dependencies, validation, and rollback thinking before code changes begin. |
| Debugging | Routes failures into the right debugging track so the assistant investigates root cause instead of guessing. |
| CI/CD debugging | Helps diagnose broken GitHub Actions, deploy failures, missing dependencies, environment drift, version mismatches, and pipeline regressions with a verify-the-fix workflow. |
| Codebase debugging | Works through failing tests, runtime exceptions, regressions, and app-level bugs using an evidence-first approach. |
| Framework and tooling debugging | Handles issues in frameworks, package managers, build tools, and local dev tooling by separating tool failures from app-code failures. |
| Review | Pushes code review toward bugs, regressions, missing tests, and operational risk instead of surface-level summaries. |
| Daily execution | Maintains TODOs, builds daily briefs, and uses connected tools like Slack, Outlook, Jira, Notion, and AWS within approval-first safety rules. |

### Example Use Cases

- Plan a production feature before implementation.
- Debug a failing CI pipeline after a dependency or config change.
- Investigate why a deploy works locally but fails in GitHub Actions.
- Review a branch for correctness and missing tests.
- Build a daily brief from TODOs and connected work systems.

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

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus`](skills/nexus/SKILL.md) | ![Operations](https://img.shields.io/badge/Operations-0F766E?style=flat) | Shared operating rules, TODO workflows, daily briefs, and MCP safety behavior. |

### Planning And Research

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-planning`](skills/planning/SKILL.md) | ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) ![Planning](https://img.shields.io/badge/Planning-1D4ED8?style=flat) | Produces structured engineering plans before implementation begins. |
| [`nexus-exploring`](skills/exploring/SKILL.md) | ![Exploration](https://img.shields.io/badge/Exploration-7C3AED?style=flat) ![Research](https://img.shields.io/badge/Research-6D28D9?style=flat) | Researches technology options, compares trade-offs, and routes toward planning or implementation. |

### Debugging

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-debugging`](skills/debugging/SKILL.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Routes debugging work into CI/CD, codebase, or framework-specific flows. |
| [`debugging-common`](skills/debugging/common.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Shared debugging rules, output patterns, and checklists. |
| [`debugging-ci-cd`](skills/debugging/ci-cd.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) ![CI/CD](https://img.shields.io/badge/CI%2FCD-EA580C?style=flat) | CI/CD-focused debugging playbook. |
| [`debugging-codebase`](skills/debugging/codebase.md) | ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) | Application and code regression debugging playbook. |
| [`debugging-frameworks`](skills/debugging/frameworks.md) | ![Debugging](https://img.shields.io/badge/Debugging-DC2626?style=flat) ![Tooling](https://img.shields.io/badge/Tooling-4B5563?style=flat) | Framework and tooling-specific debugging playbook. |

### Education And Documentation

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-tutorial`](skills/tutorial/SKILL.md) | ![Teaching](https://img.shields.io/badge/Teaching-059669?style=flat) ![Documentation](https://img.shields.io/badge/Documentation-0EA5E9?style=flat) | Creates executable Jupyter-style tutorials with reproducible setup. |
| [`skill-writer`](skills/skill-writer.md/SKILL.md) | ![Documentation](https://img.shields.io/badge/Documentation-0EA5E9?style=flat) ![Coding](https://img.shields.io/badge/Coding-2563EB?style=flat) | Helps create or improve new `SKILL.md` workflows. |

### Content And Social

| Skill | Category | Purpose |
| --- | --- | --- |
| [`nexus-shorts`](skills/shorts/SKILL.md) | ![Socials](https://img.shields.io/badge/Socials-E11D48?style=flat) ![Content](https://img.shields.io/badge/Content-F59E0B?style=flat) | Converts ideas, notes, or technical content into YouTube Shorts scripts. |

## Commands

| Command | File | Purpose |
| --- | --- | --- |
| `/add-todo` | [commands/add-todo.md](commands/add-todo.md) | Add a classified item to the Nexus TODO system. |
| `/daily-brief` | [commands/daily-brief.md](commands/daily-brief.md) | Build a daily brief from TODOs and configured tools. |
| `/review-branch` | [commands/review-branch.md](commands/review-branch.md) | Review current branch changes with findings first. |

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
