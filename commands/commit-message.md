---
description: Draft a Conventional Commit message from the staged git diff.
---

Draft a commit message for the currently staged changes.

Steps:

1. Run `git diff --staged`. If empty, run `git status --short` and tell the user nothing is staged — stop.
2. Summarize the diff into a Conventional Commit: `type(scope): summary`.
3. Use `type` from: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`.
4. Keep the summary line under 72 chars, imperative mood, no trailing period.
5. Add a short body only if the diff spans multiple concerns — bullet the key changes.
6. Never add a co-author line or attribute the commit to an AI tool.

Output:

```text
Outcome:
Message:
Next Step:
```
