# Notion Tool Configuration

Use Notion MCP for agent access to Notion pages, databases, and workspace content. Prefer the hosted Notion MCP server and OAuth flow.

## Recommended Access Model

- Use Notion MCP OAuth when supported.
- Use internal integration tokens only for local/custom API workflows.
- Give the integration access only to pages or databases it needs.

## Claude Code Setup

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

Then run this inside Claude Code:

```text
/mcp
```

Follow the OAuth flow.

## Internal Integration Setup

1. Open Notion settings.
2. Go to `Integrations`.
3. Create a new internal integration.
4. Select the associated workspace.
5. Copy the internal integration token if your local MCP/API server requires it.
6. Share the relevant pages/databases with the integration.
7. Store the token outside git.

## Nexus Safety Policy

- Reading Notion pages/databases is allowed when configured.
- Creating or editing pages requires explicit approval.
- Updating task statuses requires explicit approval unless the user directly asks for it.

## Official Docs

- Notion MCP: https://developers.notion.com/guides/mcp/mcp
- Connect Notion MCP: https://developers.notion.com/guides/mcp/get-started-with-mcp
- Notion API integrations: https://www.notion.com/help/create-integrations-with-the-notion-api
