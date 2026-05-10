# Nexus Decision Heuristics

Practical rules for making correct decisions during Nexus operations.

---

## When to Add a TODO vs Handle Immediately

Use this decision tree when the user mentions something that might become a TODO:

```
Can this be completed in under 2 minutes right now?
├── YES → Do it now; do not add a TODO
└── NO
    └── Does it require input, a tool, or action from another person?
        ├── YES → Add TODO with the label matching the system it involves
        └── NO
            └── Is this something the user will need to remember across sessions?
                ├── YES → Add TODO
                └── NO → Note it in the current response; no TODO needed
```

**Examples of "do it now" (no TODO):**
- "What label should I use for a Python bug?" → answer immediately
- "What's the nexus CLI command to list todos?" → answer immediately

**Examples that need a TODO:**
- "Remember to ask the backend team about the API contract" → Work or Codex or Jira
- "Follow up on the AWS quota request next week" → AWS
- "Don't forget to update the CLAUDE.md" → Claude

---

## Label Selection Rules for Edge Cases

When the correct label is not obvious, apply these rules:

| Situation | Label to use | Reasoning |
|-----------|-------------|-----------|
| Task involves a Slack message to send or reply | `Slack` | Matches the tool/system where action will be taken |
| Task involves a Jira ticket update | `Jira` | Matches the system |
| Task involves AWS infrastructure | `AWS` | Matches the system |
| Task involves Python code in a project | `Python` | Use for code-level tasks; use `Work` for product/team tasks |
| Task involves Claude Code configuration | `Claude` | e.g., updating CLAUDE.md, hooks, settings.json |
| Task involves Codex/OpenAI API work | `Codex` | e.g., Codex workflow, OpenAI-specific integration |
| Task is general work but doesn't fit a system | `Work` | Default for professional tasks without a specific tool |
| Task is not work-related | `Personal` | Use only for personal life items |
| Task doesn't fit any category | `General` | Last resort; prefer a specific label |

**Rule:** If a task involves two systems (e.g., "Update Jira ticket and then Slack the team"), pick the label of the first action needed. The second action will become a new TODO after the first is done.

**Rule:** Never add a TODO without a label. An unlabeled TODO cannot be filtered, prioritized, or routed.

---

## When to Trigger a Daily Brief

Trigger a daily brief (read TODOS.md + state.json + configured MCPs) when:

- The user explicitly asks: "daily brief", "what's on my plate", "what do I have today", "nexus brief"
- The user starts a session with a question that implies they want orientation: "where did we leave off?", "what should I focus on?"
- The user has been away (last session > 8 hours) and asks a vague productivity question

Do NOT trigger a daily brief when:
- The user asks a specific technical question (they want an answer, not a to-do list)
- The user just added a TODO and is continuing the current task
- The user is mid-session with clear active context

---

## Model Selection for Nexus Operations

**Use the smallest capable model for:**
- TODO classification (label assignment) — a simple categorization task
- Summarizing a Slack message or Jira ticket to produce a TODO text
- Listing and formatting TODOs from a file

**Use a larger model only for:**
- Synthesizing a full daily brief from multiple sources (Slack + Jira + Outlook + TODOS.md)
- Generating a response that requires reasoning about priorities and risks
- Drafting a Slack message or email (quality matters here)

**Rule:** Don't burn large-model tokens on a classification task that could be done with a 4B-parameter model. The difference in quality for "which label does this get?" is negligible.
