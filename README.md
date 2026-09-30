# Nexus Agent Kit

Engineering workflows for Claude Code and Codex: investigate a GitHub issue, make a focused fix, verify it, and open a pull request. Nexus also includes specialist debugging, review, reliability, and planning guidance.

[Website](https://nexus-ai.aayushostwal.com) · [Quickstart](https://nexus-ai.aayushostwal.com/docs/getting-started/quickstart) · [Migration notes](docs/migration.md)

## Quick start

In Claude Code:

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
/reload-plugins
```

Open a local repository, then invoke the workflow:

```text
/nexus:software-engineer fix issue #123 in the current repository and raise a PR
```

Or supply a repository directory and a bug in chat:

```text
Use software-engineer in /path/to/repo. Saving a profile with an empty display name crashes. Reproduce it, fix it, run the relevant checks, and raise a PR.
```

With only a directory, the workflow inspects GitHub issues and selects a bounded, actionable candidate using its documented selection rules. It checks for existing work, protects unrelated edits, implements and verifies the fix, and opens a focused PR when authentication and repository permissions permit. It reports blocked checks honestly and does not merge or deploy.

**Prerequisites:** Git, a local checkout, a supported AI host, and an authenticated GitHub connector or `gh` CLI with repository access for issue retrieval and PR creation. Use `gh auth status` to check CLI authentication. The workflow follows repository instructions and uses the project's own validation commands. Node.js 18+ is needed only for the bundled helper scripts; the website has its own npm dependencies.

### Codex installation and use

With a Codex CLI that supports `codex plugin` (local installation tested on 0.157.1):

```bash
codex plugin marketplace add aayushostwal/nexus
codex plugin add nexus@nexus-marketplace
codex plugin list --marketplace nexus-marketplace --json
```

You can use a local clone path as the marketplace source instead of the GitHub slug. The [recorded smoke checks](docs/host-smoke-checks.md) cover clean local-path installation and removal in temporary profiles; remote fetching, model-driven invocation, and upgrades remain separate checks.

Select `software-engineer` from the installed skill list or ask Codex to use it by name. Exact namespaced invocation and component routing depend on the host. If your version lacks native plugin support, upgrade or point your host at [the skill instructions](skills/software-engineer/SKILL.md) in a local clone. Third-party installers are separate tools with their own compatibility and trust requirements.

## Compatibility

| Capability | Claude Code | Codex |
| --- | --- | --- |
| Skills | Plugin skills under the `nexus:` namespace | Native plugin installation checked; skill routing and invocation require host verification |
| Commands | Plugin commands listed below | Claude command syntax is not guaranteed; use the underlying instructions |
| Specialist agents | Claude agent definitions, tool declarations, and memory configuration | No claim of identical agent registration or persistent memory behavior |
| Global guidance | Managed block in `~/.claude/CLAUDE.md` | Managed block in `~/.codex/AGENTS.md` |
| GitHub and other tools | Configure host tools and credentials separately | Configure host tools and credentials separately |

Tool permissions are enforced by the host. A workflow's instruction to stay read-only is not a security sandbox. Some agents inherit tools; others declare Bash access.

## Optional global guidance

Installing skill files does not prove a bootstrap hook ran. From a cloned or installed Nexus directory, explicitly preview the selected runtime's changes:

```bash
node scripts/bootstrap-agent-docs.js --runtime codex --dry-run
node scripts/bootstrap-agent-docs.js --runtime codex
```

Use `--runtime claude` for Claude Code. Existing user text outside Nexus-managed blocks is preserved. To remove only Nexus guidance:

```bash
node scripts/bootstrap-agent-docs.js --runtime codex --remove --dry-run
node scripts/bootstrap-agent-docs.js --runtime codex --remove
```

Removing guidance does not uninstall plugin files. Use your host or installer's uninstall mechanism for that. See [migration notes](docs/migration.md) for the old singular `AGENT.md` filename and renamed skills.

## Shipped catalog

This section and the website catalog are generated from manifests and source files. Examples below use Claude plugin invocation syntax; agents are selected by the host or requested by name.

<!-- catalog:start -->

Version **1.35.0** includes **11 skills**, **14 Claude agents**, and **2 commands**.

### Skills

| Claude invocation | Source |
| --- | --- |
| `/nexus:debugging` | [debugging](skills/debugging/SKILL.md) |
| `/nexus:nexus` | [nexus](skills/nexus/SKILL.md) |
| `/nexus:observability` | [observability](skills/observability/SKILL.md) |
| `/nexus:performance` | [performance](skills/performance/SKILL.md) |
| `/nexus:reliability` | [reliability](skills/reliability/SKILL.md) |
| `/nexus:shorts` | [shorts](skills/shorts/SKILL.md) |
| `/nexus:skill-writer` | [skill-writer](skills/skill-writer/SKILL.md) |
| `/nexus:software-engineer` | [software-engineer](skills/software-engineer/SKILL.md) |
| `/nexus:testing` | [testing](skills/testing/SKILL.md) |
| `/nexus:token-optimizer` | [token-optimizer](skills/token-optimizer/SKILL.md) |
| `/nexus:tutorial` | [tutorial](skills/tutorial/SKILL.md) |

### Agents

| Agent | Source |
| --- | --- |
| `ai-product-engineer` | [ai-product-engineer](agents/ai-product-engineer.md) |
| `cloud-cost-optimizer` | [cloud-cost-optimizer](agents/cloud-cost-optimizer.md) |
| `code-reviewer` | [code-reviewer](agents/code-reviewer.md) |
| `codebase-explorer` | [codebase-explorer](agents/codebase-explorer.md) |
| `database-architect` | [database-architect](agents/database-architect.md) |
| `docs-app-builder` | [docs-app-builder](agents/docs-app-builder.md) |
| `event-driven-designer` | [event-driven-designer](agents/event-driven-designer.md) |
| `iac-engineer` | [iac-engineer](agents/iac-engineer.md) |
| `mobile-ux-designer` | [mobile-ux-designer](agents/mobile-ux-designer.md) |
| `prd-writer-critic` | [prd-writer-critic](agents/prd-writer-critic.md) |
| `roadmap-planner` | [roadmap-planner](agents/roadmap-planner.md) |
| `scalability-planner` | [scalability-planner](agents/scalability-planner.md) |
| `system-architecture-reviewer` | [system-architecture-reviewer](agents/system-architecture-reviewer.md) |
| `uiux-reviewer` | [uiux-reviewer](agents/uiux-reviewer.md) |

### Commands

| Claude invocation | Source |
| --- | --- |
| `/nexus:commit-message` | [commit-message](commands/commit-message.md) |
| `/nexus:grind` | [grind](commands/grind.md) |

<!-- catalog:end -->

## Tool setup

Nexus does not bundle external accounts or credentials. Configure only the integrations your workflow needs:

- [Microsoft / Outlook](docs/tools/microsoft.md)
- [Slack](docs/tools/slack.md)
- [Notion](docs/tools/notion.md)
- [Jira / Atlassian](docs/tools/jira.md)
- [AWS](docs/tools/aws.md)

The software-engineer workflow can use GitHub CLI or an available authenticated GitHub connector; it does not require a particular MCP server.

## Development and verification

Run from the repository root:

```bash
node scripts/generate-catalog.js
node scripts/generate-catalog.js --check
node scripts/validate-content.js
node --test test/*.test.js
```

Build the website separately:

```bash
cd apps/nexus-web
npm ci
npm run build
```

Commit regenerated catalog and documentation alongside source changes. Structural validation checks packaging and references; it does not prove model behavior. The software-engineer skill includes evaluation scenarios for workflow review. For a release, perform the [manual host smoke checks](docs/host-smoke-checks.md) and record the host versions, installed revision, and results.

## Privacy

The repository's helper scripts operate locally; they do not provide an adoption analytics collector. Nexus guidance, local TODOs, host-managed memory, and session information may contain sensitive work context. Review the specific workflow and configured host before running it.

AI hosts and connected services process information according to their own configuration and policies. GitHub issue/PR operations transmit selected content to GitHub; other connectors can send data to their respective services. Do not put secrets into issues, PRs, logs, or committed fixtures. Bootstrap changes runtime instruction files; preview and removal commands are documented above. Removing a managed block does not delete host conversations, memory, or external service data.

## Contributing and support

Report a reproducible issue with the Nexus revision, host/version, expected behavior, actual behavior, and sanitized evidence. Never include tokens or private source without permission. Keep changes focused and include appropriate checks.

[GitHub](https://github.com/aayushostwal/nexus) · [Sponsor](https://github.com/sponsors/aayushostwal) · [Author](https://www.linkedin.com/in/aayush-ostwal/)

## License

Licensed under [MIT](LICENSE).
