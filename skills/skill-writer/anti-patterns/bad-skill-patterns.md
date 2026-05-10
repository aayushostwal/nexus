# Bad Skill Patterns (10 Anti-Patterns)

Each entry documents a named anti-pattern with: what it looks like, why it fails,
and what to do instead. These are the most common ways skills fail in production.

---

## Anti-Pattern 1 — The "Roleplay" Anti-Pattern

**What it looks like:**
```yaml
---
name: nexus-senior-engineer
description: Use when you want senior engineering advice.
---

# Senior Engineer

You are a senior software engineer with 15 years of experience. Respond to engineering
questions as a senior engineer would, drawing on deep expertise and best practices.
```

**Why it fails:**
This is not a skill — it is a persona prompt. It encodes no workflow, no context acquisition,
no output structure, and no failure modes. The model will produce plausible-sounding output
shaped entirely by its training, not by any encoded expertise. Every run is different.
The description does not specify what "senior engineering advice" means, so it triggers on
everything and is useful for nothing specific.

**Do instead:**
Define the specific engineering task this "senior engineer" should perform. If it is code review,
write a code review skill with specific review criteria, output structure, and severity taxonomy.
If it is architecture, write an architecture skill with specific trade-off frameworks.

---

## Anti-Pattern 2 — The "Generic Checklist" Anti-Pattern

**What it looks like:**
```markdown
## Checklist
- Review the code for quality
- Check for security issues
- Ensure good performance
- Verify the tests are adequate
- Make sure the documentation is complete
```

**Why it fails:**
None of these items are actionable. "Review for quality" does not specify what quality means,
which signals to look for, or what output to produce. A model executing this checklist will
produce wildly inconsistent output because "quality" means something different every time.
The checklist is a list of hopes, not a list of actions.

**Do instead:**
Write specific, executable checklist items: "Search for any function with cyclomatic complexity
> 10 (use: `grep -r 'def ' | wc -l` as a proxy, or read the diff line by line). Flag each
with: file, function name, complexity estimate, and reason it needs refactoring."

---

## Anti-Pattern 3 — The "Vague Step" Anti-Pattern

**What it looks like:**
```markdown
### Step 2 — Analyze the logs
Review the relevant logs and identify any issues. Pay attention to error patterns and
handle any anomalies appropriately.
```

**Why it fails:**
"Handle appropriately" is an instruction to use judgment without providing the judgment criteria.
The model will fill in "appropriately" with whatever pattern is most common in its training data,
which may not match the actual production context. "Any issues" is not a target — what kinds of
issues? What severity? What format should findings be reported in?

**Do instead:**
```markdown
### Step 2 — Analyze the logs
- **What to do**: Extract all ERROR and FATAL level log lines from the provided log snippet.
- **How to do it**: Search for lines containing "ERROR|FATAL|Exception|Traceback" patterns.
- **Output**: A table with columns: timestamp, level, message (truncated to 120 chars), count.
  Group identical messages and show count instead of repeating them.
- **Failure signal**: If no ERROR/FATAL lines exist but the user reports a problem, look for
  WARN lines with "timeout", "retry", or "degraded" — this is a soft-failure pattern.
```

---

## Anti-Pattern 4 — The "No Context Gathering" Anti-Pattern

**What it looks like:**
```markdown
## Workflow

### Step 1 — Diagnose the problem
Analyze the issue and identify the root cause.

### Step 2 — Recommend a fix
Provide recommendations to fix the identified problem.
```

**Why it fails:**
The skill jumps straight to diagnosis without specifying what information must exist before
diagnosis can begin. A model executing this against a vague user message ("my service is slow")
will hallucinate a diagnosis because it has no signal to work from. The output will sound
authoritative but will be untethered from reality.

**Do instead:**
Add a mandatory Context Acquisition section before Step 1:
```markdown
## Context Acquisition

Before diagnosing, collect:
1. **Error message or symptom**: Read verbatim from user input. If not provided, ask.
2. **Service name**: Required. Ask if not provided. Do not assume.
3. **Recent changes**: Ask "Was anything deployed or changed in the last 24 hours?"
4. **Current metrics**: If the user has them, ask for error rate, p99 latency, and RPS.

**Insufficient context rule**: If you have fewer than 2 of the above 4 signals, stop and ask
for the missing information. Do not proceed to Step 1 without at least items 1 and 2.
```

---

## Anti-Pattern 5 — The "No Output Contract" Anti-Pattern

**What it looks like:**
```markdown
## Output
Provide a helpful analysis and recommendations based on your findings.
```

**Why it fails:**
Without a defined output structure, every run of the skill produces a different format.
Users cannot build workflows on top of an inconsistent output. The model cannot self-check
its output for completeness. Support tickets accumulate because "sometimes it gives me a
table but sometimes it gives me a list and I don't know which to trust."

**Do instead:**
Define every field:
```markdown
## Output Contract

Every output from this skill must include these fields, in this order:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| severity | Yes | P0/P1/P2/P3 | Classification with the specific condition |
| affected_components | Yes | Bulleted list | Every system affected, with impact |
| root_cause_hypothesis | Yes | Ranked list | Top 3 hypotheses with evidence and confidence |
| recommended_actions | Yes | Ordered list | Immediate next steps, most impactful first |
| open_questions | Yes | Bulleted list | What is still unknown and needs investigation |

If any required field cannot be populated, write "[INSUFFICIENT CONTEXT — {what is missing}]"
in that field. Never omit a required field.
```

---

## Anti-Pattern 6 — The "Too Broad Description" Anti-Pattern

**What it looks like:**
```yaml
description: >
  Use this skill for engineering tasks. Triggers include: any engineering question,
  technical help requests, coding questions, architecture decisions, debugging.
  When in doubt, use this skill.
```

**Why it fails:**
This description triggers on literally everything engineering-related. When descriptions are
too broad, the model uses this skill for tasks it is not designed for and ignores more specific
skills that would do a better job. Broad descriptions also cause the skill to be activated for
queries that do not match its actual workflow, producing off-contract output.

**Do instead:**
Narrow the description to the specific use case. If the skill genuinely covers a broad domain,
split it into specific sub-skills. The description should name specific actions, not entire domains:
```yaml
description: >
  Use this skill when diagnosing a production failure in a backend service. Trigger phrases
  include: "service is down", "error rate spiked", "we have an incident", "got paged",
  "production alert fired", "p99 latency increased", "customers can't complete checkout".
  Also trigger when the user pastes an error log, alert body, or PagerDuty notification
  and asks what to do. When in doubt, use this skill.
```

---

## Anti-Pattern 7 — The "Single Sentence Trigger" Anti-Pattern

**What it looks like:**
```yaml
description: Use when writing SQL queries or working with databases.
```

**Why it fails:**
Single-sentence descriptions are too sparse for reliable probabilistic matching. When a user
types "help me query this table", the model has very little signal to match against. Denser
descriptions with multiple overlapping phrases create a stronger matching signal and trigger
more reliably across the varied ways users actually phrase their requests.

**Do instead:**
Write 4+ sentences with 5+ distinct trigger phrases:
```yaml
description: >
  Use this skill when writing, optimizing, or debugging SQL queries against any database.
  Trigger phrases include: "write a SQL query", "how do I query X", "this query is slow",
  "optimize my SQL", "help me join these tables", "write a migration", "explain this query",
  "my query is timing out", "how do I aggregate Y". Also trigger when the user pastes a SQL
  query and asks for a review, optimization, or explanation. Covers: PostgreSQL, MySQL,
  SQLite, BigQuery, Snowflake, and any ANSI SQL-compatible database.
  When in doubt, use this skill.
```

---

## Anti-Pattern 8 — The "Toy Example Only" Anti-Pattern

**What it looks like:**
```markdown
## Example

**Input**: "Sort a list of fruits alphabetically."
**Output**: "apple, banana, cherry"
```

**Why it fails:**
Toy examples do not stress the skill's decision-making. A skill that handles "sort a list of
fruits" correctly may fail completely on the real workload it was designed for. Toy examples
give false confidence. They also do not show the skill's reasoning — the model sees a simple
input-output pair and cannot learn how to handle the complex cases that make up 90% of real usage.

**Do instead:**
Use production-scale examples with real complexity:
```markdown
## Example 1 — High-traffic API service with intermittent 503s

**Input**: Service: payments-api, 45k RPS, error rate: 0.3% (up from baseline 0.01%),
onset: 14 minutes ago, last deploy: 2 hours ago. Log sample: "[ERROR] upstream connect error
or disconnect/reset before headers. retried and the latest reset reason: connection failure,
transport failure reason: delayed connect error: 111: Connection refused; timeout: 5000ms"

**Skill reasoning**:
Step 1 (Severity): Error rate 30x baseline, payment-critical service → P1 minimum.
Step 2 (Blast radius): payments-api is upstream of checkout, billing, fraud-detection...
...

**Output**: [structured triage report with all required fields populated]
```

---

## Anti-Pattern 9 — The "No Failure Modes" Anti-Pattern

**What it looks like:**
A skill with a Workflow section but no documentation of what happens when the workflow cannot
execute correctly or produces unreliable output.

**Why it fails:**
Production systems fail. Logs are incomplete. Users provide vague symptoms. When the skill has
no documented failure modes, the model will silently hallucinate when it lacks sufficient input.
It will produce output that looks correct but is untethered from evidence. Without failure mode
documentation, the model has no instruction to stop, flag uncertainty, or ask for more information.

**Do instead:**
Document the failure modes explicitly:
```markdown
## Failure Modes

| Failure Mode | Trigger Condition | Mitigation |
|-------------|------------------|------------|
| Hallucinated root cause | User provides symptoms without logs or metrics | Ask for specific evidence before providing hypothesis. Mark all hypotheses [UNCONFIRMED] until evidence supports them. |
| Wrong severity classification | Blast radius is unknown | Default to one severity level higher than apparent. State: "Classified as P1 (defaulted up due to unknown blast radius)." |
| Stale runbook reference | Skill references a runbook that has changed | Never reference specific runbook versions. Tell the user to verify the runbook is current before following it. |
```

---

## Anti-Pattern 10 — The "Prompt Wrapper Masquerading as Skill" Anti-Pattern

**What it looks like:**
```yaml
---
name: nexus-code-reviewer
description: Use when reviewing code.
---

# Code Reviewer

Review the provided code carefully. Look for bugs, security issues, and opportunities to
improve readability and performance. Provide detailed, constructive feedback.
```

**Why it fails:**
This is what a model would do without a skill. There is no encoded expertise — no specific
review criteria, no severity taxonomy, no output structure, no anti-patterns to watch for,
no domain-specific heuristics. The word "carefully" is doing no work. "Detailed, constructive
feedback" is an output description so vague it could mean anything.

Every time this "skill" runs, the model produces a different kind of review, because there is
nothing constraining it beyond "review carefully." Experienced reviewers would catch different
bugs than junior reviewers because of judgment built from experience — and this skill encodes
none of that judgment.

**Do instead:**
Encode the expertise that separates a great code review from a mediocre one:
```markdown
## Execution Workflow

### Step 1 — Dependency and Import Analysis
Read all imports and dependencies. Flag: outdated packages (check major version against known
current), unused imports, packages imported but accessed through globals, security-sensitive
packages (crypto, auth, fs) used without validation.

### Step 2 — Control Flow Analysis
Trace all code paths through each function. Flag: unreachable code, missing null/undefined
checks on function return values, promise rejections with no catch handler, infinite loop
candidates (while loops without guaranteed exit condition).

### Step 3 — Security Pattern Analysis
Check for: SQL string interpolation (flag all, even "sanitized" ones), hardcoded secrets
(regex: `(api_key|password|secret|token)\s*=\s*['"][^'"]{8,}`), unvalidated user input passed
to: exec, eval, fs operations, or SQL queries.

## Output Contract

| Field | Required | Description |
|-------|----------|-------------|
| critical_findings | Yes | Severity: CRITICAL. Security holes, data loss risks, crashes. |
| major_findings | Yes | Severity: MAJOR. Logic errors, unhandled edge cases, perf issues. |
| minor_findings | Yes | Severity: MINOR. Style, readability, non-breaking improvements. |
| approval_recommendation | Yes | APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION + reason |
```
