# Slack Tool Configuration

Use Slack MCP when available. Slack workspace admins may need to approve MCP client integrations before agents can access workspace data.

## Recommended Access Model

- Use Slack's official MCP connection flow when supported by your AI client.
- Prefer read/search access first.
- Add message posting only when the workflow explicitly needs it.

## Setup

1. Confirm your Slack workspace allows MCP client integrations.
2. Connect Slack MCP through your AI client.
3. If using a custom/local Slack MCP server, create a Slack app.
4. Add only the required OAuth scopes.
5. Install the app to your workspace.
6. Store bot/user tokens outside git.

## Common Capabilities

- Search messages and files.
- Read channels and threads.
- Retrieve member information.
- Send messages when approved.
- Create or read canvases when supported.

## Nexus Safety Policy

- Reading/searching Slack is allowed when configured.
- Sending Slack messages requires explicit approval.
- Creating canvases requires explicit approval.
- Do not summarize private channels unless the user has access and asks for that scope.

## Official Docs

- Slack MCP overview: https://docs.slack.dev/ai/slack-mcp-server/
- Slack MCP help guide: https://slack.com/help/articles/48855576908307-Guide-to-the-Slack-MCP-server
- Slack token docs: https://docs.slack.dev/authentication/tokens
