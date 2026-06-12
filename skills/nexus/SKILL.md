---
name: nexus
description: >
  Use for persistent TODO capture, daily brief retrieval, and shared Codex/Claude operating rules.
  Trigger on remember/track/follow-up requests, "nexus add/show/brief", or policy/workflow questions
  across Slack, Outlook, and Jira contexts. When in doubt, use this skill.
---

# Nexus Agent Kit

Shared operating rules for Codex and Claude Code sessions.

---

## Compatibility
- The plugin ships its own dependency-free scripts: run them with `node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js"` (requires Node >= 18; no npm install)
- Required files: `~/.nexus/TODOS.md`, `~/.nexus/state.json`

---

## Workflow

### Step 1 — TODO Classification & Addition
When the user asks to remember, track, add, or follow up on something:
1. Classify into exactly one of: `Work`, `Python`, `Claude`, `Codex`, `AWS`, `Jira`, `Slack`, `Outlook`, `Personal`, `General`.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" add "<task>"`.
3. Confirm with the output format below.

If the script fails: check that Node >= 18 is installed (`node --version`).

### Step 2 — TODO Listing
Run `node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" todos --limit 8`. Output grouped by label, sorted by recency.

### Step 3 — Daily Brief
When the user asks for a daily brief or "what's on my plate":
1. Read `~/.nexus/TODOS.md`.
2. Read `~/.nexus/state.json`.
3. Use Slack, Outlook, and Jira MCPs **only if configured** in state.json.
4. Extract action items and add each with `node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" add "<task>"`.
5. Ask before sending Slack messages, email, updating Jira, or changing AWS.

---

## Output Format

For TODO operations:
```
Outcome: [what was done]
Actions: [commands run]
Evidence: [nexus script output or confirmation]
Next Step: [what the user should do next]
```

For daily briefs:
```
Outcome:
Urgent:
Today:
Waiting:
Added TODOs:
Risks:
Next Step:
```

---

## Anti-Patterns
- Never perform external writes (Slack, email, Jira, AWS changes) without explicit user confirmation first.
- Never expose API keys, tokens, or secrets in any output.
- Never skip classification — always assign a label before adding a TODO.
- Never use a large model for TODO classification or text summarization; use the smallest capable model.
- Never claim nexus script output without actually running the command.

---

## Examples

**Input:** "Remember to follow up with finance about the Outlook invoice."

**Output:**
```
Outcome: TODO added under Work.
Actions: node "${CLAUDE_PLUGIN_ROOT}/bin/nexus.js" add "Follow up with finance about Outlook invoice"
Evidence: ✓ Added to ~/.nexus/TODOS.md
Next Step: Review during tomorrow's daily brief.
```

**Input:** "What's on my plate today?"

**Output:**
```
Outcome: Daily brief generated from TODOS.md and state.json.
Urgent: Deploy hotfix for auth service (due today)
Today: Review PR #42, sync with design team
Waiting: Finance invoice reply
Added TODOs: none new
Risks: Auth deploy blocks two downstream services
Next Step: Start with the auth hotfix deploy.
```

---

## Safety Rules
- Prefer read-only MCP operations in all cases.
- Ask before any external write — once per action, not once per session.
- Verify command output before claiming a task is complete.
