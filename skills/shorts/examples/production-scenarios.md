# Shorts — Production Scenarios

Two complete YouTube Short scripts in the exact output format, ready to record.

---

## Scenario 1 — Python `functools.cache` Tip (Tech/Educational)

**Input:** "Python has a built-in `functools.cache` decorator that memoizes function results automatically."

**Step 1:** Core message = "functools.cache makes memoization one line of code." Audience = Python developers. Tone = Tech/Educational.

**Hook scoring:**
- "90% of Python devs write memoization from scratch. You don't have to." → Score: 4/5 (knowledge gap ✓, under 12 words ✓, names audience ✓, no "in this video" ✓, audio-only works ✓)
- "This one decorator eliminates an entire class of bugs. Forever." → Score: 4/5
- "Are you still writing your own cache logic? Stop." → Score: 4/5

Lead with Hook 1 (highest on knowledge gap signal for a dev audience).

---

```
## YouTube Short Script — Python functools.cache
**Tone:** Tech/Educational
**Word Count:** 78 words (~30 seconds)

---

### Hook Options (pick one before recording)
1. "90% of Python devs write memoization from scratch. You don't have to."
2. "This one decorator eliminates an entire class of bugs. Forever."
3. "Are you still writing your own cache logic? Stop."

---

### Full Script (using Hook 1)

90% of Python devs write memoization from scratch. You don't have to.

Python's built-in **@cache** decorator from functools stores your function's results
automatically. Call it once with the same inputs — it returns instantly from cache.
No dict, no logic, no bugs. Add it above any pure function and you're done. It even
handles recursive Fibonacci with zero extra code.

Follow for one Python trick every day. You won't regret it.

---

### Production Notes
- Hook visual: face cam with surprised reaction, cut immediately to code editor
- Overlay: "@cache" in large text when first mentioned
- Cut at: "you're done" — quick zoom into the decorator in the editor before CTA
```

---

## Scenario 2 — DevOps Tip: `git bisect` to Find Regressions

**Input:** "git bisect can automatically find the commit that introduced a bug by doing a binary search through your git history."

**Step 1:** Core message = "git bisect finds the bug-introducing commit automatically — most devs don't know it exists." Audience = developers (any level). Tone = Tech/Educational.

**Hook scoring:**
- "Most developers spend hours finding which commit broke production. There's a 30-second fix." → Score: 5/5 (knowledge gap ✓, names universal pain ✓, under 12 words ✗ — trim to: "Most devs spend hours finding which commit broke prod. There's a fix.") → trimmed: 12 words ✓
- "You've been debugging the hard way. Git has a cheat code." → Score: 5/5 (knowledge gap ✓, under 12 words ✓, universal pain ✓, no "in this video" ✓, audio-only works ✓)
- "Stop manually checking commits. Git bisect finds the bug for you." → Score: 4/5

Lead with Hook 2 (strongest audio-only performance).

---

```
## YouTube Short Script — git bisect
**Tone:** Tech/Educational
**Word Count:** 76 words (~29 seconds)

---

### Hook Options (pick one before recording)
1. "Most devs spend hours finding which commit broke prod. There's a fix."
2. "You've been debugging the hard way. Git has a cheat code."
3. "Stop manually checking commits. Git bisect finds the bug for you."

---

### Full Script (using Hook 2)

You've been debugging the hard way. Git has a cheat code.

**git bisect** does a binary search through your commit history to find the exact
commit that introduced a bug. You tell it one good commit and one bad commit — it
checks out the middle one and asks you: good or bad? Ten commits become three checks.
A week of debugging becomes two minutes.

Drop a 🔥 in the comments if this just saved your day.

---

### Production Notes
- Hook visual: face cam close-up → cut to terminal showing a messy git log
- Overlay: "git bisect" in large text on first mention; "2 minutes" highlighted during CTA setup
- Cut at: "Two minutes" — hard cut to face cam for CTA delivery
```
