---
name: nexus
description: Use when the user wants persistent global TODOs, concise response formatting, Codex/Claude workflow setup, daily briefs from Slack/Outlook/Jira context, or MCP safety/cost policies from Nexus Agent Kit.
---

# Nexus Agent Kit

Nexus provides shared operating rules for Codex and Claude Code sessions.

## Core Files

- Global TODOs: `~/.nexus/TODOS.md`
- Nexus state: `~/.nexus/state.json`
- Plugin agents: `agents/`
- Plugin commands: `commands/`
- Tool docs: `docs/tools/`

## Commands

Use these when the `nexus` CLI is available:

```bash
nexus todos --limit 8
nexus add "Follow up with finance about Outlook mail"
nexus install --shell-hook
```

## TODO Handling

When the user asks to remember, track, add, or follow up on something:

1. Classify it as one of: `Work`, `Python`, `Claude`, `Codex`, `AWS`, `Jira`, `Slack`, `Outlook`, `Personal`, `General`.
2. Run `nexus add "<task>"`.
3. Respond with `Outcome`, `Actions`, `Evidence`, and `Next Step`.

If the CLI is unavailable, tell the user to run:

```bash
npx nexus-agent-kit todos
```

## Daily Brief

When the user asks for a Nexus daily brief:

1. Read `~/.nexus/TODOS.md`.
2. Read `~/.nexus/state.json`.
3. Use Slack, Outlook, and Jira MCPs only if configured.
4. Add extracted action items with `nexus add "<task>"`.
5. Ask before sending Slack messages, sending email, updating Jira, or changing AWS.

Use this output shape:

```text
Outcome:
Urgent:
Today:
Waiting:
Added TODOs:
Risks:
Next Step:
```

## Safety Rules

- Prefer read-only MCP operations.
- Ask before external writes.
- Do not expose API keys, tokens, or secrets.
- Use the smallest capable model for summaries and classification.
- Verify before claiming a task is complete.
