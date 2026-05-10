# Code Review Anti-Patterns

Eight failure modes observed repeatedly in real engineering teams, each with a concrete
example of how it manifests and what to do instead.

---

## Anti-Pattern 1 — Approving Without Reading the Test Changes

### What it looks like

The reviewer reads the logic changes, confirms they look correct, approves. The test file
is in the diff but the reviewer either skips it ("tests are the author's concern") or glances
at it and sees that new tests were added.

### Why it fails

A PR can add broken tests that never fail — tests that assert the wrong thing, tests that
mock away the thing being tested, tests that only check the happy path. Approving without
reading the tests is approving without knowing whether the correctness guarantee exists.

### Concrete example

```python
# Author adds this test
def test_charge_user():
    user = UserFactory.create()
    result = charge_user(user, amount=100)
    assert result is not None  # This asserts literally nothing useful

# The bug in the implementation
def charge_user(user, amount):
    if amount <= 0:
        return None  # Bug: should raise ValueError
    return stripe.charge(user.payment_method, amount)
```

The test passes. The bug is live. `charge_user(user, amount=-500)` silently does nothing.
If the reviewer had read the assertion (`assert result is not None`), they would have flagged it.

### What to do instead

For every new test: read the assertion. Ask: "If I introduced the bug this test is supposed
to catch, would the assertion fail?" If the answer is no (or you can't tell), flag the test.

---

## Anti-Pattern 2 — Missing the Blast Radius of a "Trivial" Config Change

### What it looks like

A one-line config change — updating a timeout value, changing a log level, modifying a
feature flag default. The reviewer sees one changed line, confirms the value looks reasonable,
approves in 30 seconds.

### Why it fails

Config changes have multiplicative blast radius. A single change to a config file can affect
every request in production simultaneously. The line count is not the blast radius.

### Concrete example

```yaml
# config/app.yaml — PR changes:
database:
  connection_timeout: 30000  # was 5000ms
  pool_size: 5               # was 20 — CHANGED
```

The pool_size reduction from 20 to 5 means that under the current traffic of 50 concurrent
requests, 45 requests will queue for a database connection. Each queued request holds an
HTTP connection. The thread pool exhausts. The app becomes unresponsive.

A reviewer who counted "one changed line" and confirmed `5` is a valid integer missed that
the previous value was selected for a reason: the production traffic pattern.

### What to do instead

For every config change: ask "what is this config controlling, and what happens if it is
lower/higher than expected?" Check git blame or git log for why the previous value was set.
If the reason is undocumented, ask the author.

---

## Anti-Pattern 3 — Focusing on Style When Correctness Is Broken

### What it looks like

The reviewer leaves five comments about variable naming, import ordering, and missing docstrings.
The logic has a race condition or missing null check. The author fixes the style comments and
re-requests review. The reviewer approves (they already spent time on it; the nits are fixed).

### Why it fails

Style comments are visible and easy to give. Correctness issues require constructing scenarios
and tracing code paths — it is harder. When a reviewer comments on style but not correctness,
they signal that style is what matters. The author learns to clean up formatting before requesting
review. The correctness debt accumulates.

### Concrete example

```python
# Reviewer comment: "Missing type annotations on return value"
# Reviewer comment: "Variable name `x` is not descriptive"
# Reviewer comment: "Import should be at top of file"
# Missed: the function below has a race condition

def transfer_funds(from_account, to_account, amount):
    x = Account.objects.get(id=from_account)  # reads balance: 1000
    y = Account.objects.get(id=to_account)
    if x.balance >= amount:
        x.balance -= amount    # concurrent request may have already subtracted
        x.save()
        y.balance += amount
        y.save()
```

The reviewer's three style comments will go on record. The race condition ships.

### What to do instead

Set up a linter and enforce it in CI. Reject PRs that fail linting at the CI level, not the
review level. Once linting is automated, spend all review time on correctness. If a PR cannot
be linted (legacy code), leave one comment pointing to the linting standard and move on.
Never let style comments displace correctness findings in your attention.

---

## Anti-Pattern 4 — Not Checking What Calls the Changed Function

### What it looks like

A function is modified — maybe its behavior changes, maybe a parameter is added, maybe its
return value changes. The reviewer reads the function, confirms the change is correct, approves.
No one checks the callers.

### Why it fails

A function is not a unit — it is a contract between a provider and all callers. Changing the
contract without updating all callers breaks the callers, not the function.

### Concrete example

```python
# Before
def get_user(user_id):
    return User.objects.get(id=user_id)  # raises DoesNotExist if not found

# After (PR changes this)
def get_user(user_id):
    return User.objects.filter(id=user_id).first()  # returns None if not found
```

The reviewer confirms `filter().first()` is correct Django ORM. It is. But every caller
that currently does `user = get_user(id); user.email` will now crash with `AttributeError:
'NoneType' object has no attribute 'email'` for any non-existent user_id.

Running `git grep "get_user("` would show 23 callers. None were updated in the PR.

### What to do instead

Run `git grep` for every changed function. Read the top callers (all of them for critical
functions, a representative sample for utility functions). Verify each one handles the new
behavior. This is the single highest-value action in a code review.

---

## Anti-Pattern 5 — Treating "It Works in Staging" as Evidence

### What it looks like

The author notes in the PR description: "Tested in staging, looks good." The reviewer
accepts this as validation and approves. The PR is merged.

### Why it fails

Staging environments are structurally different from production in ways that matter for
the most dangerous class of bugs:

| Dimension | Staging | Production |
|-----------|---------|-----------|
| Data volume | Thousands of rows | Millions of rows |
| Concurrency | 1-5 concurrent requests | Hundreds to thousands |
| Edge-case data | Clean, hand-crafted | Years of organic accumulation, every edge case present |
| Traffic patterns | Manual test traffic | Real usage patterns with spikes |
| Config | Often has debug settings, relaxed limits | Production-tuned |

N+1 queries that are invisible at staging volume can take down production databases.
Race conditions that require concurrency do not manifest with manual testing.
Performance issues at 10x data volume do not appear at staging scale.

### What to do instead

Staging validation proves the happy path works. It does not prove production safety. For
performance, concurrency, and data-volume-sensitive changes, ask: "What is the traffic volume
on this path in production? What is the data size in the affected tables?" If those numbers
make the change risky, flag it regardless of staging results.

---

## Anti-Pattern 6 — Approving a Security Change Without Tracing the Full Code Path

### What it looks like

An auth-related PR modifies a middleware or decorator. The reviewer reads the changed code,
confirms it looks correct, approves. The end-to-end flow — from HTTP request to data access —
is never traced.

### Why it fails

Security vulnerabilities in auth code are almost never in the changed code in isolation.
They are in the interaction between the changed code and the rest of the system:
- The middleware is correct, but it is not applied to a new route added elsewhere
- The permission check is correct, but it runs after the data is already fetched
- The token validation is correct, but the error response leaks information about valid user IDs
- The new auth mode is correct, but a shared object now has a `user_id = None` case that downstream code does not handle

### Concrete example

```python
# PR adds optional auth for a new endpoint
@app.route('/reports/<report_id>/export', methods=['GET'])
@optional_jwt   # NEW: allows unauthenticated access for public reports
def export_report(report_id):
    report = Report.objects.get(id=report_id)
    if report.is_public or g.user_id == report.owner_id:  # checks ownership
        return generate_export(report)
    return 403

# The bug: g.user_id is None for unauthenticated requests
# None == report.owner_id is False — correct
# But: what if owner_id is also None (reports with deleted owners)?
# Then: None == None is True → unauthenticated access to private report
```

The reviewer who reads only the route handler would miss that `owner_id` can be NULL
(from deleted users) and that `None == None` is True in Python.

### What to do instead

For any auth-related change: trace the full code path. Entry point → middleware → permission
check → data fetch → response. At each step: what is the state of the request? What is
assumed about the user? What would happen if that assumption is wrong?

---

## Anti-Pattern 7 — Reviewing a Refactor as If It Has No Behavior Change

### What it looks like

The PR description says "refactoring" or "cleanup." The reviewer treats this as lower risk
("no new features, just moving code") and does a lighter review.

### Why it fails

Refactoring changes behavior more often than anyone realizes. That is why the refactoring is
happening — to make the code more correct, more testable, or more maintainable. In changing
the structure, it is easy to inadvertently change the behavior.

The worst kind of refactoring bug is one that is correct in most cases and wrong in a rare
case — because the rare case was handled by some subtle aspect of the original code that
the refactoring removed.

### Concrete example

```python
# Before (original code)
def process_payment(amount, currency='USD'):
    if amount <= 0:
        return  # silently ignores; callers check the return value
    charge = stripe.charge(amount, currency)
    return charge

# After (refactored to raise)
def process_payment(amount, currency='USD'):
    if amount <= 0:
        raise ValueError("Amount must be positive")  # CHANGED BEHAVIOR
    charge = stripe.charge(amount, currency)
    return charge
```

The refactor "fixes" the silent return. But 3 callers of `process_payment` pass `amount=0`
intentionally for free orders and check `if result is None` to detect them. After the refactor,
those callers get a `ValueError` crash instead.

### What to do instead

For every refactor: compare expected inputs and outputs before and after. Check callers for
assumptions about the old behavior. A refactor that adds a raise where there was a return
is a behavior change. A refactor that changes a function from stateful to stateless is a
behavior change. These need caller audits, not lighter review.

---

## Anti-Pattern 8 — Reading the New Code Without Reading the Deleted Code

### What it looks like

The reviewer reads the additions in the diff (the `+` lines). The deletions (the `-` lines)
are read only as context to understand the additions. The reviewer approves.

### Why it fails

Deleted code often contains behavior that callers relied on. The deletion of:
- An error handler that caught a specific exception
- A null check that protected downstream code
- A validation that prevented invalid input
- A retry that masked an unreliable dependency
- A default value that covered a missing case

...is as dangerous as adding incorrect code. The absence of code is a behavior change.

### Concrete example

```python
# Before
def fetch_user_data(user_id):
    try:
        data = external_api.get_user(user_id)
        return data
    except TimeoutError:
        return cached_data.get(user_id)  # fallback to cache on timeout

# After (refactored — the except block was deleted)
def fetch_user_data(user_id):
    data = external_api.get_user(user_id)
    return data
```

The reviewer sees a clean, simplified function. The deleted `except TimeoutError` branch
was the only thing preventing a cascade failure when `external_api` is slow. With the
refactor, any timeout propagates as an unhandled exception. At 2am when the external API
degrades, every call to `fetch_user_data` raises, every endpoint that depends on it returns
500, and the incident is traced back to the PR that "just cleaned up the error handling."

### What to do instead

Read the `-` lines with equal attention to the `+` lines. For every deleted block of code,
ask: "What was this doing? Who was depending on it? What happens to those callers now that
it is gone?" The removal of a fallback, a null check, or an error handler is a correctness
finding, not a style preference.
