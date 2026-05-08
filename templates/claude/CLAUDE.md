# Nexus Claude Instructions

Use Nexus as the operating layer for this machine.

Read or follow these files when relevant:

- `~/.nexus/templates/shared/response-format.md`
- `~/.nexus/templates/shared/cost-policy.md`
- `~/.nexus/templates/shared/mcp-policy.md`
- `~/.nexus/templates/shared/engineering-standards.md`
- `~/.nexus/templates/shared/todos.md`

Default behavior:

- Keep answers concise and structured.
- Use `/daily-brief` for daily planning.
- Use `/add-todo` when the user asks to remember a task.
- Prefer read-only MCP operations until the user explicitly approves a write.
- Do not send Slack messages, emails, Jira updates, or AWS changes without approval.
