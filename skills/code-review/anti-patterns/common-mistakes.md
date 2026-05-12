# Code Review Anti-Patterns

Eight failure modes observed repeatedly in real engineering teams.

---

## 1 — Approving Without Reading the Tests

**What it looks like:** Reviewer reads logic changes, sees new tests were added, skips reading the assertions.

**Why it fails:** Tests can assert the wrong thing, mock away what's being tested, or only cover the happy path. A test that always passes is not a test.

**Signal to check:** For every new test — "If I introduced the bug this test is supposed to catch, would this assertion fail?" If no, flag it.

---

## 2 — Missing the Blast Radius of a "Trivial" Config Change

**What it looks like:** One-line config change. Reviewer confirms the value looks reasonable. Approves in 30 seconds.

**Why it fails:** Config changes have multiplicative blast radius. A single value controls behavior across every request simultaneously. Line count ≠ blast radius.

**Example:** Reducing a connection pool size from 20 → 5 while production handles 50 concurrent requests queues 45 of them, exhausting the thread pool.

**Signal to check:** "What does this config control, and what happens if it's lower/higher?" Check git blame for why the previous value was set.

---

## 3 — Commenting on Style When Correctness Is Broken

**What it looks like:** Five comments on naming/formatting. Logic has a race condition or missing null check. Author fixes nits, reviewer approves ("already reviewed it").

**Why it fails:** Style comments are easy to give. Correctness findings require tracing execution paths. When reviewers comment on style but not correctness, they signal that style is what matters.

**What to do instead:** Automate style with a linter in CI. Spend all review time on correctness. Never let style comments displace correctness findings in your attention.

---

## 4 — Not Checking What Calls the Changed Function

**What it looks like:** A function's behavior, signature, or return value changes. Reviewer reads the function. No one checks callers.

**Why it fails:** A function is a contract between a provider and all callers. Changing the contract without updating callers breaks the callers, not the function.

**Example:** Changing a function from "returns value or throws" to "returns value or null" silently breaks every caller that doesn't null-check the result.

**What to do instead:** Grep for every changed function. Read the top callers. Verify each handles the new behavior. This is the single highest-value action in a code review.

---

## 5 — Treating "It Works in Staging" as Evidence

**What it looks like:** PR description says "tested in staging, looks good." Reviewer accepts this as validation.

**Why it fails:**

| Dimension | Staging | Production |
|-----------|---------|-----------|
| Data volume | Thousands of rows | Millions of rows |
| Concurrency | 1–5 requests | Hundreds to thousands |
| Edge-case data | Clean, crafted | Years of organic accumulation |
| Config | Often relaxed | Production-tuned |

N+1 queries invisible at staging volume can take down production. Race conditions don't manifest under manual traffic.

**What to do instead:** Staging proves the happy path works. For performance, concurrency, or data-volume-sensitive changes, ask: "What is the traffic and data size in production?" Flag the risk regardless of staging results.

---

## 6 — Approving a Security Change Without Tracing the Full Path

**What it looks like:** Auth-related PR modifies a middleware or permission check. Reviewer reads the changed code, confirms it looks correct. The end-to-end flow is never traced.

**Why it fails:** Auth vulnerabilities are almost never in the changed code in isolation — they're in the interaction:
- Middleware is correct, but not applied to a new route added elsewhere
- Permission check is correct, but runs after data is already fetched
- Token validation is correct, but error response leaks valid user IDs
- New auth mode introduces a `user = null` case that downstream code doesn't handle

**What to do instead:** For any auth change: trace the full path from entry point → middleware → permission check → data fetch → response. At each step: what is assumed about the caller? What happens if that assumption is wrong?

---

## 7 — Reviewing a Refactor as If It Has No Behavior Change

**What it looks like:** PR says "refactoring" or "cleanup." Reviewer does a lighter review ("no new features, just moving code").

**Why it fails:** Refactoring changes behavior more often than anyone realizes. The worst refactoring bugs are correct in most cases and wrong in a rare case — because the rare case was handled by some subtle aspect of the original code that the refactoring removed.

**Example:** Changing a function from "silently return on invalid input" to "throw on invalid input" is a behavior change. Callers that checked the return value now crash instead.

**What to do instead:** For every refactor: compare expected inputs and outputs before and after. A refactor that changes error-handling, return values, or statefulness needs a caller audit, not a lighter review.

---

## 8 — Reading Additions Without Reading Deletions

**What it looks like:** Reviewer reads the `+` lines. Deletions are skimmed as context. Reviewer approves.

**Why it fails:** Deleted code often contains behavior callers depended on:
- An error handler catching a specific exception
- A null check protecting downstream code
- A validation preventing invalid input
- A retry masking an unreliable dependency
- A default covering a missing case

The absence of code is a behavior change.

**Example:** Removing a timeout fallback in a cleaned-up function means any timeout now propagates as an unhandled exception. At 2am when an external API degrades, every dependent endpoint returns 500.

**What to do instead:** Read `-` lines with equal attention to `+` lines. For every deleted block: "What was this doing? Who depended on it? What happens to those callers now?"
