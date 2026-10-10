# Nexus

A collection of skills and agents for Claude Code and Codex.

## Agents

| Agent | Purpose |
| --- | --- |
| [`system-design`](agents/system-design.md) | Lead solution architect for system-design and architecture requests. |

## Skills

| Skill | Purpose |
| --- | --- |
| [`system-design`](skills/system-design/SKILL.md) | Requirements discovery, architecture selection, low-level design, and operational planning. |
| [`testing`](skills/testing/SKILL.md) | Flaky or nondeterministic tests, local-vs-CI inconsistencies. |
| [`token-optimizer`](skills/token-optimizer/SKILL.md) | Always-on token optimization rules. |
| [`tutorial`](skills/tutorial/SKILL.md) | Executable Jupyter tutorials and AI engineering walkthroughs. |

## Install

```text
/plugin marketplace add aayushostwal/nexus
/plugin install nexus@nexus-marketplace
```

## License

MIT
