# Nexus TODO Workflow

Global TODOs live at `~/.nexus/TODOS.md`.

When the user asks to add an item:

1. Classify it into one label: `Work`, `Python`, `Claude`, `Codex`, `AWS`, `Jira`, `Slack`, `Outlook`, `Personal`, or `General`.
2. Add it with `nexus add "<task>"` when the CLI is available.
3. If the CLI is unavailable, append a markdown checkbox under `## Open` using this shape:

```md
- [ ] <!-- nexus:2026-05-08T00:00:00.000Z label:Work --> Follow up on the proposal
```

When generating a daily brief:

- Read Slack, Outlook, and Jira only if configured and approved.
- Read `~/.nexus/TODOS.md`.
- Compare against the previous run timestamp from `~/.nexus/state.json`.
- Add new action items to TODOs instead of burying them in the response.
- Keep the final brief short and grouped by urgency.
