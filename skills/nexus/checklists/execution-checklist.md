# Nexus Operation Checklist

Use this checklist to verify each Nexus operation is performed correctly and safely.

---

## TODO Addition

- [ ] The task was classified into exactly one label before running `nexus add`
- [ ] The label used is one of the allowed set: `Work`, `Python`, `Claude`, `Codex`, `AWS`, `Jira`, `Slack`, `Outlook`, `Personal`, `General`
- [ ] The task description is specific enough to act on (not "look into that thing")
- [ ] `nexus add "<task>"` was actually run — the CLI output was observed before confirming
- [ ] The output format was used: Outcome / Actions / Evidence / Next Step

---

## TODO Listing

- [ ] `nexus todos --limit 8` was run (not recalled from memory)
- [ ] Output was grouped by label and sorted by recency
- [ ] If the CLI is unavailable, the user was told to run `npx nexus-agent-kit todos` themselves

---

## Daily Brief

- [ ] `~/.nexus/TODOS.md` was read (actual file read, not recalled)
- [ ] `~/.nexus/state.json` was read to check which MCPs are configured
- [ ] Slack MCP was used **only if** configured in state.json — not assumed
- [ ] Jira MCP was used **only if** configured in state.json — not assumed
- [ ] Outlook MCP was used **only if** configured in state.json — not assumed
- [ ] All MCP reads were read-only — no Slack messages sent, no Jira tickets updated, no email sent
- [ ] Action items extracted from Slack/Jira were added via `nexus add` with correct labels
- [ ] The output format was used: Outcome / Urgent / Today / Waiting / Added TODOs / Risks / Next Step

---

## External Write Safety

Before performing any write operation (Slack message, email, Jira update, AWS change):

- [ ] The user was explicitly asked for confirmation ("Should I send this message?")
- [ ] The exact content of the write was shown to the user before execution
- [ ] Confirmation was received in this session (not assumed from a prior session)
- [ ] Confirmation is per-action — a blanket "go ahead" for one action does not cover subsequent actions
- [ ] No AWS change was made without explicit instruction naming the specific resource and action

---

## Secret Safety

- [ ] No API keys, tokens, or secrets appeared in any output
- [ ] No file containing secrets was read and then quoted verbatim in output
- [ ] `state.json` contents referencing credentials were summarized ("Slack configured") not printed in full
