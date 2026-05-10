# Nexus Anti-Patterns

Common mistakes in Nexus operations that cause tasks to be lost, actions to be taken without consent, or secrets to be exposed.

---

## 1. Adding TODOs Without Labels

**What it looks like:**
```
nexus add "Follow up with Carlos"
```
No label assigned — the tool accepts the input without one, but the TODO is uncategorized.

**Why it happens:**
The classification step is skipped to be faster. The label seems obvious in the moment.

**Why it's harmful:**
- Unlabeled TODOs cannot be filtered by `nexus todos --label Work`
- When dozens of TODOs accumulate, unlabeled ones have no context for prioritization
- The daily brief groups TODOs by label — unlabeled items are invisible to routing logic

**Correction:**
Always classify before running `nexus add`. The classification takes one sentence of thought. If genuinely uncertain, use `General` — but that should be rare. The label is part of the command:
```
nexus add "Follow up with Carlos about auth latency" --label Work
```
Or confirm the label in the output: `Classified as: Work`.

---

## 2. Sending Messages Without Confirmation

**What it looks like:**
The daily brief identifies that Carlos needs a reply, so the agent composes and sends a Slack message to Carlos — without asking the user first.

**Why it happens:**
The agent infers intent: "the user wants this done." Sending the message feels like being helpful.

**Why it's harmful:**
- The user may not want to send the message yet (wrong tone, incomplete information, wrong timing)
- Once a message is sent, it cannot be unsent
- A message sent on the user's behalf without their knowledge damages trust
- One wrong message to a client or executive can have serious professional consequences

**The rule:** Ask before every external write. Not once per session — once per action. The question is short: "Should I send this message to Carlos? Here's the draft: [draft]."

Even if the user said "handle it" earlier, confirm the specific action before executing.

---

## 3. Using a Large Model for Simple Classification

**What it looks like:**
Every `nexus add` call routes to `claude-opus-4` or `gpt-4o` to determine whether a task should be labeled `Work` or `General`.

**Why it happens:**
The default model is the most capable one. It gets used for everything unless explicitly overridden.

**Why it's harmful:**
- TODO classification is a 10-token decision that does not require frontier model reasoning
- Using a large model for simple classification increases latency (300ms vs 50ms for a small model)
- Cost accumulates: if a developer adds 20 TODOs/day, that's 20 unnecessary large-model calls
- Large models are a finite resource — reserving them for tasks that genuinely need them is good practice

**Correction:**
Route classification, summarization, and simple formatting to the smallest available model. Reserve larger models for: synthesizing multi-source daily briefs, drafting communications, or reasoning about priority conflicts.

---

## 4. Claiming CLI Output Without Running the Command

**What it looks like:**
```
Outcome: TODO added under Work.
Actions: nexus add "Follow up with finance"
Evidence: ✓ Added to ~/.nexus/TODOS.md
```

...but `nexus add` was never actually run. The output was fabricated from the expected format.

**Why it happens:**
The CLI output is predictable. The agent fills in the expected output without running the command.

**Why it's harmful:**
- The TODO was never actually saved — it will not appear in `nexus todos`
- The user believes the task was tracked, but it wasn't
- If the user checks their TODOS.md manually, they find it's not there — trust is broken

**The rule:** Always run the command. If the CLI is unavailable (`nexus: command not found`), tell the user:
```
The nexus CLI is not available in this environment.
Please run: npx nexus-agent-kit todos
And manually add: "Follow up with finance" under Work.
```
Do not simulate a successful run.

---

## 5. Reading Secrets and Echoing Them in Output

**What it looks like:**
`state.json` contains `{"slack_token": "xoxb-1234-..."}`. The agent reads the file to check if Slack is configured, then includes the token value in its output summary.

**Why it happens:**
Quoting source material directly feels transparent and verifiable.

**Why it's harmful:**
- The token is now visible in the conversation history
- If the conversation is logged, shared, or screenshotted, the token is exposed
- An exposed Slack token can be used to read private channels or send messages as the user

**Correction:**
When reading `state.json`, summarize the presence of configurations — do not quote credential values:
```
# Bad
Slack token: xoxb-1234-567...

# Good
Slack: configured (MCP available)
```

The user already knows their own token. Confirming "configured" is all the evidence they need.
