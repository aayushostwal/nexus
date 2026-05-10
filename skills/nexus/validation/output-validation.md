# Nexus Output Validation

How to verify that Nexus operations completed correctly and safely.

---

## TODO Addition Validation

A TODO addition is complete and correct when all of the following are true:

- [ ] The label was classified and stated before `nexus add` was run
- [ ] The label is one of the 10 allowed values (Work, Python, Claude, Codex, AWS, Jira, Slack, Outlook, Personal, General)
- [ ] `nexus add` was actually run — CLI output was observed (not fabricated)
- [ ] The Evidence field contains the actual CLI confirmation output, not a templated string
- [ ] The task description in the Evidence matches what the user asked to track
- [ ] No secret values appear anywhere in the output
- [ ] The output uses the standard format: Outcome / Actions / Evidence / Next Step

**Validation test:** Run `nexus todos --limit 1` after adding. The most recent TODO must match the just-added task. If it doesn't, the add failed.

---

## TODO Listing Validation

A TODO listing is complete when:

- [ ] `nexus todos --limit 8` was run (not recalled from memory)
- [ ] Output is grouped by label
- [ ] Output is sorted by recency within each label group
- [ ] If no TODOs exist, the user is told the list is empty — not given a fabricated sample list
- [ ] The listing reflects the actual state of `~/.nexus/TODOS.md` at time of query

---

## Daily Brief Validation

A daily brief is complete and safe when:

- [ ] `~/.nexus/TODOS.md` was read (not recalled from a prior session)
- [ ] `~/.nexus/state.json` was read to confirm which MCPs are configured
- [ ] Only configured MCPs were queried (no Slack queries if Slack is not in state.json)
- [ ] All MCP operations were read-only — no writes occurred
- [ ] New action items were added via `nexus add` with correct labels
- [ ] The "Added TODOs" section lists every item that was added, with labels
- [ ] The output uses the standard format: Outcome / Urgent / Today / Waiting / Added TODOs / Risks / Next Step
- [ ] The Risks section is not empty if any Urgent items exist (every urgency has an implied risk)
- [ ] No secrets or token values appear in any section of the output

---

## External Write Validation

Before any write operation is confirmed as complete:

- [ ] The user was shown the exact content of the write before it was executed
- [ ] The user gave explicit confirmation in this session
- [ ] The write was executed and the result was confirmed (not just "I sent it")
- [ ] The confirmation was per-action (not carried over from a prior action in the session)

---

## Safety Validation (applies to all Nexus operations)

- [ ] No API key, token, or credential value appears in any output line
- [ ] No external system was modified without explicit user confirmation
- [ ] The CLI was actually invoked — output was not fabricated
- [ ] If the CLI was unavailable, the user was told clearly and given manual instructions
