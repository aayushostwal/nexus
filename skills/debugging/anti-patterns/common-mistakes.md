# Common Debugging Anti-Patterns

Patterns that slow down or derail debugging. Each entry describes the mistake, why it is
harmful, and what to do instead.

---

## 1. Adding Print Statements Instead of Using a Debugger

**What it looks like:**
```python
print("HERE 1")
print(f"value: {x}")
print("HERE 2")
```

**Why it is harmful:**
- Print statements cannot be reproduced in CI — the test that catches the bug in the future
  will not have them.
- They pollute logs and diffs, making code review harder.
- They require multiple edit-run-edit cycles to get context, whereas a debugger gives you the
  entire stack frame in one step.
- They are frequently committed accidentally.

**What to do instead:**
Use `pdb` / `ipdb` (Python), `debugger` (JavaScript/Node), or your IDE's debugger.
Set a breakpoint at the first user-code frame, inspect locals, and step through.
For CI failures, add structured logging (`logging.debug(...)`) that is toggled by log level,
not removed after debugging.

---

## 2. Fixing the Symptom Without the Root Cause

**What it looks like:**
```python
# "Fix": catch the KeyError and return an empty dict
try:
    return data['user']['profile']
except KeyError:
    return {}
```

**Why it is harmful:**
The actual bug — missing key in the data structure — is still there. The next caller assumes
a non-empty dict. The failure now appears silently downstream in a more confusing form.
Symptom fixes create technical debt that compounds.

**What to do instead:**
Ask: "Why is `data['user']['profile']` missing?" Trace back to where `data` is constructed
and fix the source. Only add a catch-and-default if the absent key is legitimately expected
(and document why).

---

## 3. Changing Multiple Things at Once

**What it looks like:**
A developer suspects three possible causes and changes all three in the same commit to "save
time". The bug goes away. Now they do not know which change fixed it — or whether the
combination of changes introduced a new bug that has not surfaced yet.

**Why it is harmful:**
- Cannot isolate the root cause → cannot write a targeted regression test.
- Cannot roll back safely if the fix introduces a new failure.
- Cannot explain to a colleague (or future self) what actually happened.

**What to do instead:**
Change one variable at a time. Test after each change. Record what was changed and the result
(passes / still fails). This takes longer per attempt but produces a known root cause.

---

## 4. Not Reading the Full Stack Trace

**What it looks like:**
Developer reads only the last line of the stack trace:
```
KeyError: 'user_id'
```
And searches for `KeyError user_id` without reading the frames above it.

**Why it is harmful:**
The last line is the failure point, not the root cause. The root cause is often several frames
up — usually the first frame in user code, not in library code. Fixing the wrong frame adds
error handling to the wrong layer.

**What to do instead:**
Read every frame. Identify the first user-code frame (not library code). That is the entry
point where the investigation starts. Work backward from there.

---

## 5. Guessing Instead of Measuring (Performance Issues)

**What it looks like:**
Developer sees slow response time, guesses "it's probably the JSON serialization", and
optimizes the serializer. Performance does not improve. The real bottleneck was N+1 queries.

**Why it is harmful:**
Premature optimization of the wrong component wastes time and introduces unnecessary complexity
without improving the system.

**What to do instead:**
Measure first. For Python: `cProfile`, `py-spy`. For Django: Django Debug Toolbar (query count
and time). For Node: `--prof`. For any HTTP service: trace the request with distributed tracing
(Datadog, Jaeger, OpenTelemetry). Fix the measured bottleneck, not the guessed one.

---

## 6. Not Writing a Regression Test After Fixing the Bug

**What it looks like:**
Bug is fixed. Developer ships the fix without adding a test. The same bug is reintroduced
three months later by a different developer who did not know about it.

**Why it is harmful:**
Without a test, the fix exists in code but not in the test suite's memory. Any future change
to the affected code path can silently reintroduce the bug.

**What to do instead:**
Every bug fix must be accompanied by a test that would have caught the bug before the fix.
Name the test after the behavior, not the issue number:
`test_filter_skips_null_entries` not `test_bug_fix_1234`.
If a test is genuinely not needed (e.g., config-only change), state why explicitly in the PR.

---

## 7. Over-Engineering the Fix

**What it looks like:**
A one-line null check bug is "fixed" by introducing a new validation layer, a custom exception
hierarchy, a retry decorator, and a configuration flag — 50 lines of new code for a 1-line bug.

**Why it is harmful:**
- More code means more surface area for new bugs.
- Reviewers cannot easily verify that the fix is correct.
- The blast radius of the change grows far beyond the root cause.
- Rollback becomes risky.

**What to do instead:**
Apply the narrowest fix that addresses the root cause. If a broader architectural change is
warranted, create a separate task for it and do it in a separate PR with proper planning.
From `common.md`: *"Change only the lines that fix the root cause."*

---

## 8. Not Checking Git History Before Investigating

**What it looks like:**
Developer spends 2 hours tracing a bug through code, finds a suspicious conditional, fixes it.
A colleague points out that this exact conditional was added intentionally to fix a different
bug six months ago, and removing it reintroduces that bug.

**Why it is harmful:**
The full investigation was avoidable. Git history contains the why — the commit message, PR
description, and linked issue would have explained the intent of the code.

**What to do instead:**
Before changing any suspicious line, run:
```bash
git log -L <line_start>,<line_end>:<file_path>   # history of specific lines
git blame <file_path>                             # who wrote each line and when
git show <commit-hash>                            # full context of the commit
```
Read the commit message and PR description before concluding the code is wrong.

---

## 9. Applying the Fix in Production Without Testing in Staging

**What it looks like:**
Bug is urgent. Developer pushes a one-line fix directly to production to stop the bleeding.
The fix has a typo and breaks a different feature. Now there are two incidents.

**Why it is harmful:**
Even "trivial" one-line fixes can have unintended effects — especially under production data
patterns that are not present in tests. Staging exists precisely for this.

**What to do instead:**
Unless the production system is completely down and staging replication would take longer than
the outage (a rare case), always deploy to staging first, run the verification command, and
observe for at least 5 minutes before deploying to production.
If staging is bypassed due to urgency, document this explicitly in the incident report and
treat it as a process failure to be corrected.

---

## 10. Not Documenting What You Tried

**What it looks like:**
Developer investigates a bug for 4 hours, tries 7 hypotheses, rules out 6 of them, finds the
root cause, and ships the fix. The PR description says: "Fixed the login bug."

The next developer who sees a similar failure in a different service spends 4 hours ruling out
the same 6 hypotheses.

**Why it is harmful:**
Undocumented investigation is work that will be duplicated. Debugging is often the hardest
intellectual work in engineering — that knowledge should be captured.

**What to do instead:**
In the PR description or the linked issue, write:
- What you tried that did not work (and why you ruled it out)
- The root cause in one sentence
- Why the fix works
- What the regression test covers

The Debug Report format in `common.md` provides a template for this.

---

## 11. Treating a Flaky Test as a Passing Test

**What it looks like:**
A test fails in CI. Developer re-runs the job. It passes. Developer merges the PR and marks
the test as "just flaky, not a real failure."

**Why it is harmful:**
Flaky tests are symptoms of real bugs — usually race conditions, time dependencies, or
state-isolation failures. Ignoring them means the underlying bug stays in production.
Over time, the test suite loses credibility ("oh that test is always flaky") and real
failures are masked.

**What to do instead:**
Treat flakiness as a separate bug. File a task: "Investigate flaky test:
`test_order_created_at_timestamp`". Run the test 10 times in isolation. Identify the
failure rate and conditions. Debug as a concurrency or time-dependency issue.

---

## 12. Debugging in Production Instead of Reproducing Locally

**What it looks like:**
Developer adds temporary logging, deploys to production to gather data, analyzes logs,
deploys another change, repeats. The production system is used as a debugger.

**Why it is harmful:**
- Each deploy cycle takes minutes or hours.
- Debugging production may affect live users.
- Temporary logging may expose sensitive data.
- The feedback loop is 100x slower than a local debugger.

**What to do instead:**
Invest time in reproducing the failure locally or in a staging environment, even if it takes
30 minutes to set up the right data conditions. Once reproducible locally, the feedback loop
is seconds. Use production logs only for initial signal collection, not for iterative debugging.
