# Jira / Atlassian Tool Configuration

Use Atlassian Rovo MCP where possible for Jira, Confluence, and Compass Cloud. Prefer OAuth over API tokens.

## Recommended Access Model

- Use Atlassian Rovo MCP OAuth when supported.
- Use scoped API tokens only when OAuth is unavailable.
- Start with read-only issue and sprint access.
- Add write permissions only for issue creation, status changes, comments, or sprint updates.

## Atlassian Rovo MCP Endpoint

```text
https://mcp.atlassian.com/v1/mcp/authv2
```

## API Token Setup

1. Open Atlassian account security settings.
2. Create a scoped API token.
3. Store your site URL, account email, and token outside git.
4. Configure your MCP client or local MCP server with those values.

## Nexus Safety Policy

- Reading Jira issues, boards, and sprints is allowed when configured.
- Creating issues requires explicit approval.
- Updating issue status, assignee, sprint, priority, or comments requires explicit approval.
- Daily briefs may propose Jira updates, but must not apply them silently.

## Official Docs

- Rovo MCP getting started: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/
- Rovo MCP usage: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/use-atlassian-rovo-mcp-server/
- Atlassian API tokens: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
