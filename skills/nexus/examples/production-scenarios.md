# Nexus — Production Scenarios

Two real workflow examples showing the full Nexus Agent Kit output for common operations.

---

## Scenario 1 — Adding and Reviewing TODOs Across a Work Session

**Context:** A developer is finishing a Slack conversation, a PR review, and a Jira ticket update in one work session. They want to capture follow-ups as they go.

---

### Step 1 — Adding TODOs as they arise

**User:** "Remember to reply to Carlos about the auth service latency spike."

```
Outcome: TODO added under Work.
Actions: nexus add "Reply to Carlos about auth service latency spike"
Evidence: ✓ Added to ~/.nexus/TODOS.md (label: Work)
Next Step: Review with nexus todos at end of session.
```

---

**User:** "Don't forget to update the CLAUDE.md after we merge the new agent pattern."

```
Outcome: TODO added under Claude.
Actions: nexus add "Update CLAUDE.md after merging new agent pattern"
Evidence: ✓ Added to ~/.nexus/TODOS.md (label: Claude)
Next Step: Review with nexus todos at end of session.
```

---

**User:** "Follow up with the AWS team about the us-east-1 quota increase request."

```
Outcome: TODO added under AWS.
Actions: nexus add "Follow up with AWS team re: us-east-1 quota increase request"
Evidence: ✓ Added to ~/.nexus/TODOS.md (label: AWS)
Next Step: Review with nexus todos at end of session.
```

---

### Step 2 — Reviewing TODOs at end of session

**User:** "Show my todos."

Command run: `nexus todos --limit 8`

```
Outcome: 8 most recent TODOs retrieved.
Actions: nexus todos --limit 8
Evidence:

  [Work]
  • Reply to Carlos about auth service latency spike (added 14:32)
  • Review PR #88 — streaming refactor (added 09:15)

  [Claude]
  • Update CLAUDE.md after merging new agent pattern (added 14:45)

  [AWS]
  • Follow up with AWS team re: us-east-1 quota increase request (added 14:51)
  • Investigate Lambda cold start regression in prod (added 11:02)

  [Jira]
  • Update PROJ-142 status to In Review (added 13:20)

  [Python]
  • Pin langchain version in requirements.txt (added 10:30)

  [General]
  • Book team offsite venue by Friday (added 08:00)

Next Step: Start with Work items — Carlos reply is time-sensitive.
```

---

## Scenario 2 — Daily Brief with Slack + Jira Integration

**Context:** It's Monday morning. The developer asks for a daily brief. `~/.nexus/state.json` has Slack and Jira MCPs configured.

**User:** "What's on my plate today?"

---

### Step 1 — Read local state

- Read `~/.nexus/TODOS.md` — 6 open TODOs across Work, AWS, Python labels
- Read `~/.nexus/state.json` — Slack MCP configured (workspace: qure-dev), Jira MCP configured (project: PROJ)

### Step 2 — Read Slack (read-only, no writes)

- Fetched unread messages in #backend-alerts — 2 Sentry alerts from Sunday night (auth service + data pipeline)
- Fetched DMs — 1 message from design team: "Can you review the new upload flow mockup today?"
- Extracted 2 action items and added via `nexus add`:
  - `nexus add "Investigate Sentry alert: auth service 500s Sunday 23:14"` → label: Work
  - `nexus add "Review upload flow mockup from design team"` → label: Work

### Step 3 — Read Jira (read-only)

- Fetched open tickets assigned to user in PROJ sprint 14
- 3 tickets: PROJ-142 (In Review), PROJ-156 (To Do, due today), PROJ-160 (Blocked — waiting on API contract)
- Extracted 1 action item: `nexus add "Unblock PROJ-160: get API contract from backend team"` → label: Jira

### Step 4 — Output

```
Outcome: Daily brief generated from TODOS.md, Slack (#backend-alerts, DMs), and Jira (sprint 14).

Urgent:
• Investigate Sentry alert: auth service 500s Sunday 23:14 (from #backend-alerts)
• PROJ-156 due today — not started

Today:
• Reply to Carlos about auth service latency spike
• Review upload flow mockup from design team
• Update PROJ-142 status to In Review
• Pin langchain version in requirements.txt

Waiting:
• PROJ-160 blocked — API contract needed from backend team
• AWS us-east-1 quota increase request — no reply yet

Added TODOs:
• "Investigate Sentry alert: auth service 500s Sunday 23:14" [Work]
• "Review upload flow mockup from design team" [Work]
• "Unblock PROJ-160: get API contract from backend team" [Jira]

Risks:
• Auth service 500s may still be ongoing — check Sentry before PROJ-156 to confirm safe to deploy

Next Step: Open Sentry, triage the auth alert. If resolved, proceed to PROJ-156.
```

**Note:** No Slack messages were sent, no Jira tickets were updated, no AWS changes were made. All actions above are read-only. To send a message or update a ticket, confirmation would be requested first.
