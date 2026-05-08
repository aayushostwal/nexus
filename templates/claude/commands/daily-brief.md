---
description: Build a daily brief from TODOs, Slack, Outlook, and Jira where configured.
---

Generate a Nexus daily brief.

Steps:

1. Read `~/.nexus/TODOS.md`.
2. Read `~/.nexus/state.json` for the previous `dailyBriefLastRun`.
3. Use Slack MCP only if connected and approved.
4. Use Outlook/Microsoft Graph MCP only if connected and approved.
5. Use Jira/Atlassian MCP only if connected and approved.
6. Add extracted action items with `nexus add "<task>"`.
7. Ask before sending, posting, creating, updating, or deleting anything externally.

Output:

```text
Outcome:
Urgent:
Today:
Waiting:
Added TODOs:
Risks:
Next Step:
```
