# Daily Brief

Goal: produce a concise daily brief and update global TODOs.

Steps:

1. Read `~/.nexus/TODOS.md` and `~/.nexus/state.json`.
2. If Slack MCP is configured, read relevant messages since the previous `dailyBriefLastRun`.
3. If Outlook/Microsoft Graph MCP is configured, read relevant mail and calendar items since the previous run.
4. If Jira/Atlassian MCP is configured, read assigned or mentioned issues updated since the previous run.
5. Extract actionable tasks and add them with `nexus add "<task>"`.
6. Update `~/.nexus/state.json` only after the brief is generated.

Write actions require explicit approval:

- Sending Slack messages.
- Sending email.
- Creating or updating Jira issues.
- Changing AWS resources.

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
