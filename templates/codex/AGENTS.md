# Nexus Codex Instructions

Load these Nexus rules for every Codex session where available:

- Shared response format: `~/.nexus/templates/shared/response-format.md`
- Cost policy: `~/.nexus/templates/shared/cost-policy.md`
- MCP policy: `~/.nexus/templates/shared/mcp-policy.md`
- Engineering standards: `~/.nexus/templates/shared/engineering-standards.md`
- TODO workflow: `~/.nexus/templates/shared/todos.md`

Default behavior:

- Keep responses precise and evidence-backed.
- Use `nexus todos --limit 8` at session start when shell output is available.
- Use `nexus add "<task>"` when the user asks to remember or track work.
- Prefer read-only MCP operations until the user approves writes.
- Do not run deployment, email, Slack, Jira, or AWS write actions without explicit approval.
