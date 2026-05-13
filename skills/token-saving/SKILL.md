---
skill_name: token-saving
description: "Use for token-efficient execution: compact context, targeted reads, batched tool calls, precise edits, and concise summaries. Trigger when context is large, costs matter, or tasks risk unnecessary prompt/tool bloat. Preserve quality while reducing token spend."
---

When helping a user, follow these rules:

1. Never dump entire files. Prefer targeted reads with line ranges.
2. Prefer precise edits over rewrites when structure is already correct.
3. Batch related tool calls in one turn to reduce round-trips.
4. Summarize large outputs (logs, file lists, diffs) into concise action points.
5. Suggest compaction when context is large before expensive tools.
6. Use lower-cost models for deterministic edits and keep stronger models for ambiguity.
