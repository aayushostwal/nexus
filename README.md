# Nexus Agent Kit

Nexus is a plugin-first operating layer for Codex and Claude Code. It gives your agents a shared way to plan work, maintain global TODOs, run daily briefs, use specialized agents, and connect external tools through MCP with approval-first safety rules.

The goal is simple: stop re-explaining your operating style in every new shell or repo. Install Nexus once as a plugin, then use the same workflows across coding, planning, communication, and tool-connected work.

## Install

### Codex

```bash
npx codex-marketplace add aayushostwal/nexus --plugin --global
```

Project-scoped install:

```bash
npx codex-marketplace add aayushostwal/nexus --plugin --project
```

### Claude Code

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
/reload-plugins
```

## Features

### Planning

Nexus gives agents a structured planning workflow for turning vague requests into scoped execution.

What it standardizes:

- Clear goal, assumptions, risks, and next step.
- Separation between planning and execution.
- Approval gates before external writes, deployments, or high-cost work.
- Repeatable review flow for branches, tickets, and operational tasks.

Included workflows:

- `daily-brief`: build a daily plan from TODOs and configured tools.
- `review-branch`: review code changes with findings first.
- `add-todo`: add and classify work into global TODOs.

### TODO Manager

Nexus maintains one global markdown TODO file:

```text
~/.nexus/TODOS.md
```

TODOs are classified automatically into labels:

- `Work`
- `Python`
- `Claude`
- `Codex`
- `AWS`
- `Jira`
- `Slack`
- `Outlook`
- `Personal`
- `General`

Example TODO shape:

```md
- [ ] <!-- nexus:2026-05-08T00:00:00.000Z label:Python --> Fix pytest failures in ingestion job
```

The daily brief workflow reads global TODOs, checks configured tools since the previous run, extracts action items, and adds them back to the global TODO file.

### Tools

Nexus is designed around MCP-connected tools, but it does not ship credentials. Tool access should be configured with least privilege and read-only defaults.

Supported setup guides:

- [Microsoft / Outlook](docs/tools/microsoft.md)
- [Slack](docs/tools/slack.md)
- [Notion](docs/tools/notion.md)
- [Jira / Atlassian](docs/tools/jira.md)
- [AWS](docs/tools/aws.md)

Safety rules:

- Read-only by default.
- Ask before sending, posting, updating, deleting, deploying, or changing cloud resources.
- Keep secrets out of git.
- Prefer OAuth, SSO, temporary credentials, or automation tokens over long-lived keys.

### Skills

Nexus ships a reusable skill at:

```text
skills/nexus/SKILL.md
```

The skill teaches agents how to:

- Use the Nexus TODO workflow.
- Produce concise operational responses.
- Run daily briefs from configured tools.
- Apply MCP approval rules.
- Use cost-aware context loading.

### Agents

Nexus includes specialized Claude Code agents:

| Agent | Purpose |
| --- | --- |
| `nexus-planner` | Plans scoped engineering or operational work before execution. |
| `nexus-reviewer` | Reviews code and workflow changes for correctness, risk, and missing tests. |
| `nexus-todo-manager` | Maintains global Nexus TODOs and classifies tasks by label. |
| `nexus-comms-briefing` | Summarizes Slack, Outlook, Jira, and TODO context into a daily brief. |

### Commands

Nexus includes Claude Code slash commands:

| Command | Purpose |
| --- | --- |
| `/add-todo` | Add a classified global TODO. |
| `/daily-brief` | Build a daily brief from TODOs and configured tools. |
| `/review-branch` | Review the current branch for bugs, regressions, and missing tests. |

## Tool Configuration

Configure tools only when you need them:

- [Microsoft / Outlook](docs/tools/microsoft.md)
- [Slack](docs/tools/slack.md)
- [Notion](docs/tools/notion.md)
- [Jira / Atlassian](docs/tools/jira.md)
- [AWS](docs/tools/aws.md)

## Development

```bash
npm run lint
npm test
npm pack --dry-run
```

Install the local pre-commit hook:

```bash
npm run hooks:install
```

The hook runs:

```bash
npm run lint
npm test
npm pack --dry-run
```

## Release

Manual npm publish:

```bash
npm run publish:dry-run
npm run publish:npm
```

Automatic npm publishing is configured in:

```text
.github/workflows/publish-npm.yml
```

Required GitHub secret:

```text
NPM_TOKEN
```

Use an npm Automation token. Normal 2FA-bound tokens can fail in CI with `EOTP`.
