---
name: nexus
description: Use for global TODO tracking, concise response formatting, workflow setup, and daily brief operations across Codex and Claude.
---

# Nexus Operating Rules

## Workflow
1. For "remember/track/add" requests: classify and add via `nexus add`.
2. For listing: run `nexus todos --limit 8`.
3. For daily brief: read TODO/state and enrich from approved MCP sources only.

## Labels
Use exactly one label: `Work`, `AI`, `Claude`, `Codex`, `AWS`, `Jira`, `Slack`, `Outlook`, `Personal`, `General`.

## Guardrails
- Ask before external writes.
- Never expose secrets.
- Keep output concise and terminal-friendly.

## Output Shape
```text
Outcome:
Actions:
Evidence:
Next Step:
```
