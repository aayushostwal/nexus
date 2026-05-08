# Nexus Agent Kit

Nexus is a reusable operating layer for Codex and Claude Code. It gives every session a shared response contract, global TODOs, daily brief workflow, MCP safety rules, and installable templates.

Use it locally:

```bash
npx nexus-agent-kit install
```

Use it as a Codex and Claude Code plugin:

```bash
git clone https://github.com/aayushostwal/nexus.git
cd nexus
npx nexus-agent-kit install
```

During development from this repo:

```bash
node bin/nexus.js install
```

## What It Installs

Nexus creates and manages:

```text
nexus/
  .claude-plugin/plugin.json
  .claude-plugin/marketplace.json
  .codex-plugin/plugin.json
  commands/
  agents/
  skills/nexus/SKILL.md

~/.nexus/
  TODOS.md
  state.json
  templates/

~/.codex/nexus/
  AGENTS.md
  workflows/

~/.claude/
  CLAUDE.nexus.md
  commands/nexus/
  agents/nexus/
```

It does not overwrite your existing `~/.claude/CLAUDE.md`, `~/.codex/config.toml`, or repo files. Nexus installs namespaced files so you can opt in per tool or per repo.

## CLI

```bash
nexus install
nexus install --shell-hook
nexus update
nexus todos
nexus todos --limit 5
nexus add "Follow up on AWS cost anomaly"
nexus shell-hook
```

The global TODO file is:

```text
~/.nexus/TODOS.md
```

## TODO Workflow

When you add a task, Nexus classifies it into a label:

```bash
nexus add "Fix pytest failures in ingestion job"
```

Example output:

```text
Added [Python] Fix pytest failures in ingestion job
```

Labels currently supported:

- `Work`
- `Python`
- `Claude`
- `Codex`
- `AWS`
- `Jira`
- `Slack`
- `Outlook`
- `Personal`
- `General`

TODOs are stored as markdown:

```md
- [ ] <!-- nexus:2026-05-08T00:00:00.000Z label:Python --> Fix pytest failures in ingestion job
```

## Show TODOs When A New Shell Opens

Install the hook automatically:

```bash
nexus install --shell-hook
```

Or add this line manually to `~/.zshrc`:

```bash
command -v nexus >/dev/null 2>&1 && nexus todos --limit 8
```

The output uses ANSI colors unless `NO_COLOR` is set or `--no-color` is passed.

## Codex Usage

Nexus includes a Codex plugin manifest:

```text
.codex-plugin/plugin.json
```

It also exposes a Codex skill:

```text
skills/nexus/SKILL.md
```

Nexus installs Codex templates to:

```text
~/.codex/nexus/
```

Recommended repo setup:

```bash
cp ~/.codex/nexus/AGENTS.md ./AGENTS.md
mkdir -p .codex/workflows
cp ~/.codex/nexus/workflows/*.md .codex/workflows/
```

Use the workflows as short prompts:

```text
Run the Nexus daily brief workflow.
Add this to Nexus TODOs: follow up with the client about the Slack thread.
Review the current branch using Nexus review-branch.
```

Codex MCP servers are configured in `~/.codex/config.toml`. The OpenAI Codex config docs describe MCP server configuration, approval modes, and parallel tool-call settings:

- https://github.com/openai/codex/blob/main/docs/config.md

## Claude Code Usage

Nexus includes a Claude Code plugin manifest:

```text
.claude-plugin/plugin.json
```

It also includes a local Claude marketplace:

```text
.claude-plugin/marketplace.json
```

After the repo is pushed to GitHub, add the marketplace inside Claude Code:

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
```

For local testing before pushing:

```text
/plugin marketplace add /Users/aayushostwal/Desktop/aayush/nexus
/plugin install nexus@nexus-marketplace
```

Nexus installs Claude Code files to:

```text
~/.claude/CLAUDE.nexus.md
~/.claude/commands/nexus/
~/.claude/agents/nexus/
```

To make Nexus global in Claude Code, merge or reference `~/.claude/CLAUDE.nexus.md` from your main Claude memory:

```bash
cat ~/.claude/CLAUDE.nexus.md >> ~/.claude/CLAUDE.md
```

Claude personal slash commands live under `~/.claude/commands/`, and user subagents live under `~/.claude/agents/`.

Useful commands after install:

```text
/daily-brief
/add-todo Follow up on the Outlook mail from finance
/review-branch
```

Official Claude Code docs:

- Settings and user/project subagents: https://docs.anthropic.com/en/docs/claude-code/settings
- Slash commands: https://docs.anthropic.com/en/docs/claude-code/slash-commands
- MCP setup: https://docs.anthropic.com/en/docs/claude-code/mcp
- Hooks: https://docs.anthropic.com/en/docs/claude-code/hooks

## Daily Brief Workflow

The daily brief workflow is designed to:

1. Read `~/.nexus/TODOS.md`.
2. Read `~/.nexus/state.json` for the previous run timestamp.
3. Pull Slack messages since the previous run when Slack MCP is configured.
4. Pull Outlook mail and calendar context since the previous run when Microsoft Graph or Outlook MCP is configured.
5. Pull Jira issues since the previous run when Atlassian MCP is configured.
6. Add extracted action items back into global TODOs.
7. Ask for approval before sending, posting, updating, deleting, or deploying anything.

Default output:

```text
Outcome:
Urgent:
Today:
Waiting:
Added TODOs:
Risks:
Next Step:
```

## MCP Configuration

Nexus does not ship credentials. Configure each MCP server with least privilege. Prefer OAuth where available. Treat Slack posts, emails, Jira writes, and AWS changes as approval-required.

### Slack MCP

Slack has an official Slack MCP server. Workspace admins can approve and manage MCP client integrations. Slack MCP can search workspace content and, depending on permissions, perform actions such as sending messages.

Official docs:

- Slack MCP overview: https://docs.slack.dev/ai/slack-mcp-server/
- Slack MCP help guide: https://slack.com/help/articles/48855576908307-Guide-to-the-Slack-MCP-server
- Slack token docs: https://docs.slack.dev/authentication/tokens

Credential path:

1. Use the official Slack MCP connection flow when your client supports it.
2. If using a custom/local Slack MCP server, create a Slack app from Slack API settings.
3. Add only required OAuth scopes.
4. Install the app to your workspace.
5. Store bot tokens outside repos. Bot token strings typically start with `xoxb-`.

### Jira / Atlassian MCP

Atlassian provides the Rovo MCP Server for Jira, Confluence, and Compass Cloud. The current Atlassian docs recommend the `/mcp` endpoint:

```text
https://mcp.atlassian.com/v1/mcp/authv2
```

Official docs:

- Getting started: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/
- Usage guide: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/use-atlassian-rovo-mcp-server/
- Atlassian API tokens: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

Credential path:

1. Prefer Atlassian Rovo MCP OAuth when your MCP client supports remote OAuth.
2. If API-token auth is allowed by your organization, create an Atlassian API token at `https://id.atlassian.com/manage-profile/security/api-tokens`.
3. Use scoped tokens where possible.
4. Store site URL, email, and token in your MCP client secret store or environment, never in git.

### Outlook / Microsoft Graph MCP

Outlook mail and calendar access usually goes through Microsoft Graph. For custom MCP servers, register an app in Microsoft Entra ID and grant the minimum Graph permissions required.

Official docs:

- Register a Microsoft Graph app: https://learn.microsoft.com/en-us/graph/auth-register-app-v2
- Add credentials to an app registration: https://learn.microsoft.com/entra/identity-platform/how-to-add-credentials
- Microsoft identity application model: https://learn.microsoft.com/en-us/entra/identity-platform/application-model

Credential path:

1. Go to Microsoft Entra admin center.
2. Create an app registration.
3. Record the Application client ID and Directory tenant ID.
4. Add only required Microsoft Graph permissions, such as mail or calendar read permissions.
5. Use certificates or federated credentials for production. Use client secrets only for local testing.
6. Store secrets outside repos.

### AWS MCP

AWS publishes MCP servers for AWS service workflows, including serverless and container services. For credentials, prefer temporary credentials, SSO, or IAM roles over long-term access keys.

Official docs:

- AWS MCP announcement: https://aws.amazon.com/about-aws/whats-new/2025/05/new-model-context-protocol-servers-aws-serverless-containers
- AWS access key guidance: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
- IAM admin access key steps: https://docs.aws.amazon.com/IAM/latest/UserGuide/access-keys-admin-managed.html

Credential path:

1. Prefer AWS IAM Identity Center, role assumption, or temporary credentials.
2. If a local MCP server requires AWS CLI credentials, configure AWS CLI profiles.
3. Avoid root access keys.
4. Grant read-only permissions first.
5. Require explicit approval before deployments, infrastructure changes, or cost-impacting actions.

## Updating Nexus

If installed through npm:

```bash
npx nexus-agent-kit@latest update
```

If installed as a local Codex plugin from GitHub:

```bash
cd path/to/nexus
git pull
npx nexus-agent-kit update
```

If working from a cloned repo:

```bash
git pull
node bin/nexus.js update
```

If you publish this package to npm, users can install globally:

```bash
npm install -g nexus-agent-kit
nexus install
```

## Publishing To npm

Before publishing:

```bash
npm test
npm pack --dry-run
npm login
npm publish --access public
```

If the package name is taken, rename `name` in `package.json` before publishing.

This repo also includes a guarded publish script:

```bash
npm run publish:dry-run
npm run publish:npm
```

The underlying Bash script is:

```bash
scripts/publish-npm.sh --dry-run
scripts/publish-npm.sh --publish
scripts/publish-npm.sh --publish --bump patch
```

The script checks that the git working tree is clean, optionally bumps the version, syncs plugin manifest versions, runs tests, validates the Claude plugin when `claude` is available, runs `npm pack --dry-run`, verifies npm authentication, checks whether the exact package version already exists, and only then publishes.

## Automatic npm Publishing

The GitHub Actions workflow at `.github/workflows/publish-npm.yml` publishes a new patch version on every push to `main`.

Setup required:

1. Create an npm automation token from your npm account.
2. Add it to the GitHub repo as `NPM_TOKEN` under Settings -> Secrets and variables -> Actions.
3. Push to `main`.

On each qualifying push to `main`, the workflow:

- Runs `scripts/publish-npm.sh --dry-run --bump patch --skip-git-check`.
- Updates `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json`.
- Commits the version bump locally.
- Publishes the new npm version.
- Pushes the version bump back to `main` with `[skip ci]` to prevent a release loop.

## Publishing As A Codex Plugin

The repo contains the required Codex plugin manifest:

```text
.codex-plugin/plugin.json
```

Before pushing:

```bash
npm test
npm pack --dry-run
git status --short
```

Push to GitHub:

```bash
gh auth login -h github.com
gh repo create nexus --public --source=. --remote=origin --push
```

If the repo already exists:

```bash
git remote add origin git@github.com:aayushostwal/nexus.git
git push -u origin main
```

After pushing, install from source wherever plugin discovery supports local or GitHub plugin sources.

## Publishing As A Claude Code Plugin

The repo contains the required Claude plugin files:

```text
.claude-plugin/plugin.json
.claude-plugin/marketplace.json
commands/
agents/
skills/
```

Validate locally if your Claude Code version supports plugin validation:

```bash
claude plugin validate .
```

Test locally inside Claude Code:

```text
/plugin marketplace add /Users/aayushostwal/Desktop/aayush/nexus
/plugin install nexus@nexus-marketplace
```

After pushing to GitHub:

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
```

Official Claude Code plugin docs:

- Plugins: https://code.claude.com/docs/en/plugins
- Plugin marketplaces: https://code.claude.com/docs/en/plugin-marketplaces

## GitHub Repo Setup

Create a GitHub repo after local validation:

```bash
git init
git add .
git commit -m "feat: create nexus agent kit"
gh repo create nexus --private --source=. --remote=origin --push
```

Use `--public` instead of `--private` if you want others to discover it immediately.
