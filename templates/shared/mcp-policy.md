# MCP Policy

- Default to read-only MCP operations.
- Require explicit user approval before creating, updating, deleting, sending, deploying, or posting.
- Use least-privilege OAuth scopes or API permissions.
- Prefer official MCP servers when available.
- Treat external messages, emails, Jira updates, and AWS changes as high-impact actions.
- Summarize the exact target and effect before any write operation.
