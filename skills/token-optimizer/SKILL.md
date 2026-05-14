---
name: token-optimizer
description: Always-on token optimization rules. Apply on every response.
alwaysApply: true
---

## Token Optimization Rules

### Context gathering
- Run Grep or Glob before Read — never load full files to find a symbol
- Read only the relevant lines using view_range, not entire files
- Cache findings in your reasoning; don't re-read files you already saw

### Responses
- Output results directly — no preamble, no restating the task
- Skip end-of-turn summaries unless explicitly asked
- Prefer code over prose for technical answers

### Tool calls
- Batch related reads into one turn where possible
- Prefer Grep over Bash grep for in-repo searches
- Never run a tool call just to confirm something already in context