# Review Output Validation

How to verify that a review is complete, grounded, and worth acting on.
A review that misses something critical is worse than no review — it creates false confidence.

---

## Completeness Verification

Before finalizing any review output, verify all six of these. If any check fails, go back
and complete the missing step.

### Check 1 — Did you read the test changes?

**Test:** Can you name the specific behaviors that the new/modified tests assert?

If you can name them: pass.
If you are guessing from test names: fail. Read the assertions.

What to confirm:
- The test assertions cover the new behavior, not just the happy path
- No existing test assertions were weakened (conditions removed, edge cases dropped)
- The new tests would fail if the bug the PR is fixing were reintroduced

### Check 2 — Did you audit the callers of every changed function?

**Test:** For every function, method, or class with a changed signature: can you state the
exact shell command you ran to find callers, and the number of callers found?

Format: `git grep -n "function_name" -- "*.py"` → N results in M files, all verified.

If you cannot state this: you did not check. Run it now.

### Check 3 — For migrations: did you apply the full safety checklist?

**Test:** Can you answer all five of these questions for each migration in the diff?
1. Does the migration hold an exclusive lock? If yes: for how long?
2. Does old app code work against the new schema?
3. Does the migration have a correct `down` path?
4. Can the migration run while the app is serving traffic?
5. If there is a backfill: is it batched?

If any answer is "I don't know": that is an unresolved finding, not a pass.

### Check 4 — For auth changes: did you trace the full code path?

**Test:** Can you describe the full request lifecycle for the changed auth path, from the
HTTP request header to the data being served?

Format: "Request arrives → [middleware A] → [permission check B] → [data fetch C] → [response D]"

If you cannot trace it end-to-end: the review is incomplete for this surface.

### Check 5 — Did you read the deleted lines with the same attention as the added lines?

**Test:** For each deleted block: can you state what that code was doing and confirm its
removal does not break any caller?

If you did not read the `-` lines: you reviewed half the diff.

### Check 6 — Does the actual diff match the PR description?

**Test:** State what the PR description says the change does. State what the diff actually
does. Are they the same?

If they differ: the gap is itself a finding — the author may have misunderstood what they
changed, or the description is outdated from an earlier version of the PR.

---

## Confidence Scoring

Every finding must have a confidence level. The confidence level determines how the finding
is communicated to the author.

### HIGH confidence — state as a finding, not a question

Criteria (all four must be true):
1. You traced the full code path from trigger to failure mode
2. You identified the exact file and line that causes the problem
3. You constructed a concrete triggering scenario (specific input, state, or sequence)
4. You verified that no existing guard, middleware, or validator already handles this case

Example of a HIGH confidence finding:
> "BLOCK: `Profile.objects.get(user_id=user.id)` inside the loop at `views.py:47` issues
> one SQL query per user in the queryset. With 50 users per search result page and 2,000
> searches/minute, this is 100,000 additional queries/minute. The query log confirms no
> `select_related('profile')` hint on the queryset at `views.py:31`. No caching layer
> intercepts this path."

All four criteria met: code path traced, exact line found, triggering scenario constructed
(2k searches/min * 50 results), guard verified absent.

### MEDIUM confidence — state as a finding with a caveat

Criteria: you found the pattern and traced the code path, but cannot confirm the blast
radius without runtime data (traffic volume, data size, concurrency level).

How to phrase it:
> "REQUEST CHANGES: This pattern (read-modify-write without transaction at `service.py:82`)
> is a race condition under concurrent requests. Whether this materializes in production
> depends on the concurrency on this endpoint — confirm with the author."

### LOW confidence — state as a question, not a finding

Criteria: you recognized a known-dangerous pattern but cannot confirm it is a real issue
without context you do not have (config values, data in the DB, traffic patterns, other
files not in the diff).

How to phrase it:
> "Question for author: `get_config('timeout')` at `client.py:15` — is this value read at
> startup or at request time? If at startup, a change requires a restart to take effect.
> If at request time, it can be changed live but adds latency per call."

### UNVERIFIED — ask, do not assume

When you cannot even determine if a concern is real: ask the author as a question in the
review, flagged as needing clarification before approval.

Do not invent the answer. Do not downgrade a concern to a NITPICK because you cannot
confirm it. Ask.

---

## How to Know If You Missed Something Important

Run through this self-assessment before finalizing the review. Each question that you
cannot answer confidently is a gap.

### Self-assessment questions

**On scope:**
- Can you list every file in the diff and state what each one changes?
- Did you check if any file that should be in the diff is missing? (Test file, migration, config)

**On correctness:**
- Can you state the behavior of the changed code under: (a) happy path, (b) empty input, (c) null/missing input, (d) concurrent requests?
- Is there a scenario where the new code produces a different result than the old code for the same input?

**On callers:**
- Did you run `git grep` for every changed function signature?
- Do you know the full set of callers, and have you verified each one?

**On security:**
- If the change touches auth: is every new route protected?
- If the change exposes new data: is that data appropriate for all callers?
- If the change handles user input: is it validated before use?

**On reversibility:**
- If this change causes a production incident, can it be reverted in under 5 minutes?
- If there is a migration: is the rollback safe and tested?

**On tests:**
- Do the tests cover the new behavior?
- Would the tests catch a regression if someone changed the implementation back?

**On the PR description:**
- Does the diff do what the description says?
- If not: is the gap a bug, or is the description just outdated?

### Red flags that indicate you missed something

- You approved a PR in under 5 minutes for a change that touches more than 3 files. (Possible, but verify you did not skim.)
- The PR has no test changes but changes non-trivial logic. (Flag as REQUEST CHANGES unless behavior is trivially verifiable.)
- You are unsure what `git grep "function_name"` would return. (Run it.)
- The PR description uses the word "trivial," "minor," "low-risk," or "just." (These are self-assessments. Verify independently.)
- The author mentions "tested in staging" as the validation. (Staging proves the happy path. Ask about production-specific concerns.)
- The diff includes a migration and you did not apply the migration safety checklist. (Always apply it. No exceptions.)

---

## Verifying That a Review Finding Is Valid Before Submitting It

Before submitting a BLOCK or REQUEST CHANGES finding, verify:

**Is the code path actually reachable?**
- Is the code being reviewed on a live code path, or dead code, a deprecated function, or an unreachable branch?
- If you cannot confirm it is reachable: state "This code path appears reachable — confirm with the author."

**Is the finding already handled upstream?**
- Does a middleware, validator, or caller guard already prevent the scenario you are describing?
- Example: you flag a null dereference, but the calling router already validates the ID before calling this function.
- Check: read the calling code. Read any middleware on the route.

**Is your triggering scenario realistic?**
- Can the input or state you describe actually occur in production?
- Example: you flag a race condition that requires two requests for the same user within 1ms. Is that realistic? (Yes for high-traffic systems. Unlikely for an admin dashboard.)
- If not realistic: downgrade from BLOCK to COMMENT.

**Is the severity proportionate?**
- BLOCK = production incident if merged, non-trivial blast radius, non-immediate reversibility.
- Request changes for everything else that is a real correctness issue.
- Comment for genuine concerns below that threshold.
- Never BLOCK on style, preference, or "I would have done it differently."
