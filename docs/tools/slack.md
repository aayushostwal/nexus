# Slack Tool Configuration

Use Slack MCP to give Nexus access to workspace conversations, channels, threads, and search. Prefer Slack's official MCP connection flow when it is supported by your client. Start with read-only access and add write capability only if you actually need message posting or canvas creation.

## Recommended Access Model

- Prefer Slack's official MCP connection flow over custom tokens when available.
- Start with read and search access first.
- Add message posting only for workflows that truly need outbound communication.
- Use the minimum OAuth scopes required for the use case.
- Keep bot or user tokens outside git and outside this repository.

## Claude Code Setup

If your client supports adding Slack MCP directly, add the hosted Slack MCP endpoint and then authenticate from inside Claude Code.

Add Slack MCP to your Claude configuration:

```json
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://mcp.slack.com/mcp",
      "oauth": {
        "clientId": "YOUR_SLACK_CLIENT_ID",
        "callbackPort": 8787
      }
    }
  }
}
```

Then in Claude Code:

```text
/mcp
```

Authenticate Slack in the MCP panel and complete the browser OAuth flow.

## Slack App Setup

If your MCP flow requires your own Slack app:

1. Open https://api.slack.com/apps?new_app=1
2. Create a new Slack app for the target workspace.
3. Configure the app for the MCP or OAuth flow your client expects.
4. Copy the OAuth client ID if your MCP config requires it.
5. Add only the scopes required for your workflow.
6. Install the app into the workspace.
7. Store any bot or user token outside git.

## Common Capabilities

- Search messages and files.
- Read channels and threads.
- Retrieve member and workspace context.
- Post messages when explicitly approved.
- Create or read canvases when supported by the Slack MCP implementation.

## Verification

After authentication:

1. Open Claude Code.
2. Run `/mcp`.
3. Confirm Slack shows a connected status.
4. Ask a read-only question first, such as:

- "Search Slack for messages about the deploy."
- "What was discussed in #engineering today?"
- "Show my recent unread Slack activity."

## Nexus Safety Policy

- Reading and searching Slack is allowed when configured.
- Sending Slack messages requires explicit approval.
- Creating canvases requires explicit approval.
- Do not summarize private channels unless the user has access and explicitly asks for that scope.
- Never print Slack OAuth tokens, bot tokens, or secrets in terminal output.

## Official Docs

- Slack MCP overview: https://docs.slack.dev/ai/slack-mcp-server/
- Slack MCP help guide: https://slack.com/help/articles/48855576908307-Guide-to-the-Slack-MCP-server
- Slack token docs: https://docs.slack.dev/authentication/tokens
