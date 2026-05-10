# Production Flaky Test Scenarios

Three annotated real-world cases. Each includes the original broken test, the failure symptoms
observed in production CI, the root cause analysis, and the minimal fix applied.

---

## Scenario 1 — Shared Database State (Ordering Bug)

### Context

A Django application with a PostgreSQL test database. The test suite used `pytest-django` with
`@pytest.mark.django_db`. Two tests shared a `User` model fixture. This test suite ran cleanly
for months before a new test was added that created a `User` with `username="admin"`.

### Original Broken Test

```python
# tests/users/test_profile.py

import pytest
from django.contrib.auth.models import User


@pytest.mark.django_db
def test_get_user_profile_returns_correct_username():
    # This test assumes the only user in the DB is the one it creates
    user = User.objects.create_user(username="testuser", password="pass123")
    all_users = User.objects.all()
    assert all_users.count() == 1          # FAILS: 2 if test_admin_exists ran first
    assert all_users.first().username == "testuser"  # FAILS: returns "admin" alphabetically


# tests/admin/test_admin_panel.py  (added 3 weeks later)

@pytest.mark.django_db(transaction=True)   # NOTE: transaction=True bypasses rollback
def test_admin_user_exists_after_migration():
    User.objects.create_superuser(username="admin", password="adminpass", email="a@b.com")
    assert User.objects.filter(is_superuser=True).exists()
```

### Failure Symptoms

```
FAILED tests/users/test_profile.py::test_get_user_profile_returns_correct_username
AssertionError: assert 2 == 1

# Or on other runs:
AssertionError: assert 'admin' == 'testuser'

# The test passes when run alone:
pytest tests/users/test_profile.py::test_get_user_profile_returns_correct_username -xvs  # PASSES

# The test fails when run after the admin test:
pytest tests/admin/test_admin_panel.py tests/users/test_profile.py -x  # FAILS
```

CI failure rate: ~40% (triggered whenever pytest ran these two files in alphabetical order).

### Root Cause Analysis

`test_admin_user_exists_after_migration` uses `@pytest.mark.django_db(transaction=True)`. This
tells pytest-django to use real database transactions instead of the default savepoint-based
rollback. The consequence: any `User` rows created inside `transaction=True` tests are **committed
to the database** and not rolled back after the test. The next test then sees stale rows from the
previous test.

Root cause: `test_get_user_profile_returns_correct_username` assumes an empty database, but
`test_admin_user_exists_after_migration` commits a `User` row (username="admin") that persists
across tests because `transaction=True` disables the automatic rollback.

### Fix

```python
# tests/admin/test_admin_panel.py

@pytest.mark.django_db(transaction=True)
def test_admin_user_exists_after_migration():
    User.objects.create_superuser(username="admin", password="adminpass", email="a@b.com")
    assert User.objects.filter(is_superuser=True).exists()
    # FIX: explicit cleanup in the test body when transaction=True is required
    User.objects.filter(username="admin").delete()


# tests/users/test_profile.py — also harden the assertion to be order-independent:

@pytest.mark.django_db
def test_get_user_profile_returns_correct_username():
    user = User.objects.create_user(username="testuser", password="pass123")
    # FIX: query for the specific user we created, not "the first user in the table"
    fetched = User.objects.get(username="testuser")
    assert fetched.username == "testuser"
```

### Verification

```bash
# Run both tests in the order that triggered the failure — confirm both pass
pytest tests/admin/test_admin_panel.py tests/users/test_profile.py -v

# Run 20 times in random order — confirm 0 failures
for i in {1..20}; do
  pytest tests/admin/ tests/users/ --randomly-seed=random -q --tb=no
done | grep -c FAILED  # expected: 0
```

### Prevention

- Add a CI check: `pytest tests/ --randomly-seed=random` on every PR
- Audit all `@pytest.mark.django_db(transaction=True)` usages — each must include explicit cleanup
- Add to PR template: "Does this test use `transaction=True`? If yes, does it clean up after itself?"

---

## Scenario 2 — Hard-coded Sleep Breaks Under CI Load (Timing Bug)

### Context

A FastAPI application with an async background task that processes uploaded files. The test used
`time.sleep(2)` after triggering the upload endpoint, assuming the background task would complete
within 2 seconds. This passed on developer MacBooks (M1, fast SSD) but failed in GitHub Actions
on the shared Ubuntu runners under load.

### Original Broken Test

```python
# tests/integration/test_file_processing.py

import time
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_uploaded_file_is_processed():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Upload a file — triggers a background task
        response = await client.post(
            "/upload",
            files={"file": ("test.csv", b"col1,col2\n1,2\n3,4", "text/csv")}
        )
        assert response.status_code == 202

        # Wait for background task to finish — PROBLEM: fixed sleep
        time.sleep(2)

        # Check the result
        result = await client.get(f"/files/{response.json()['file_id']}/status")
        assert result.json()["status"] == "processed"  # FAILS if task took > 2 seconds
```

### Failure Symptoms

```
FAILED tests/integration/test_file_processing.py::test_uploaded_file_is_processed
AssertionError: assert 'pending' == 'processed'

# Local run (fast machine): passes every time
# CI run (shared runner): fails 3 of 10 times, always at the same assertion
# CI under high load (multiple parallel jobs): fails 8 of 10 times
```

CI failure rate: 30–80% depending on runner load at test time.

### Root Cause Analysis

The background task processes the uploaded file asynchronously. On a developer machine under no
load, the task completes in ~400ms — well within the 2-second sleep. On a shared CI runner with
multiple jobs running concurrently, the Python interpreter may be preempted, the file I/O is
slower on the shared storage, and the 2-second window is frequently insufficient. The sleep does
not wait for a condition — it waits for a fixed wall-clock interval that is load-dependent.

Root cause: `test_uploaded_file_is_processed` fails intermittently because `time.sleep(2)` is
insufficient on loaded CI runners where the background file processing task takes more than
2 seconds to complete.

### Fix

```python
# tests/integration/test_file_processing.py

import asyncio
import pytest
from httpx import AsyncClient
from app.main import app


async def wait_for_status(client, file_id, target_status, timeout=30, poll_interval=0.5):
    """Poll until the file reaches target_status or timeout is exceeded."""
    elapsed = 0
    while elapsed < timeout:
        result = await client.get(f"/files/{file_id}/status")
        if result.json()["status"] == target_status:
            return result
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
    raise TimeoutError(
        f"File {file_id} did not reach status '{target_status}' within {timeout}s. "
        f"Last status: {result.json()['status']}"
    )


@pytest.mark.asyncio
async def test_uploaded_file_is_processed():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/upload",
            files={"file": ("test.csv", b"col1,col2\n1,2\n3,4", "text/csv")}
        )
        assert response.status_code == 202
        file_id = response.json()["file_id"]

        # FIX: poll for the condition with a generous timeout, not a fixed sleep
        result = await wait_for_status(client, file_id, "processed", timeout=30)
        assert result.json()["status"] == "processed"
```

### Verification

```bash
# Run 20 times on CI (or simulate with tight resource limits locally)
for i in {1..20}; do
  pytest tests/integration/test_file_processing.py::test_uploaded_file_is_processed -x --tb=short -q
done | grep -E "passed|failed"
# expected: 20 passed, 0 failed

# Confirm the test now fails with a clear message if the task never completes
# (manually break the background task and confirm TimeoutError is raised with a descriptive message)
```

### Prevention

- Add a shared `wait_for_condition(fn, timeout, poll_interval)` utility to `tests/conftest.py`
- Add a linting rule: grep for `time.sleep` in test files and flag for review on every PR
- Add `asyncio_mode = "auto"` to `pytest.ini` to enforce consistent async handling

---

## Scenario 3 — Port Conflict and External Service Dependency (Resource Contention Bug)

### Context

A Go microservice with integration tests that started a real HTTP server on port 8080 for each
test. When the test suite was run with `go test ./... -parallel 4`, multiple test packages started
servers on the same port simultaneously. The tests also made real calls to an external currency
exchange API during business hours (when the API was live) but failed at night (when the API
returned rate-limit errors on the free tier).

### Original Broken Test

```go
// tests/integration/payment_test.go

package integration

import (
    "net/http"
    "testing"
    "time"
    "github.com/myorg/myservice/internal/server"
)

func TestPaymentEndpointConvertsAmount(t *testing.T) {
    // Start a real server on a hardcoded port — PROBLEM 1
    srv := server.New(":8080")
    go srv.ListenAndServe()
    time.Sleep(100 * time.Millisecond) // wait for server to be ready — PROBLEM 2

    // Make a real HTTP call to an external exchange rate API — PROBLEM 3
    // The server internally calls https://api.exchangerate-api.com/v4/latest/USD
    resp, err := http.Post("http://localhost:8080/payment/convert",
        "application/json",
        strings.NewReader(`{"amount": 100, "from": "USD", "to": "EUR"}`))

    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        t.Fatalf("expected 200, got %d", resp.StatusCode)
    }
    // Server is never shut down — leaks across tests — PROBLEM 4
}
```

### Failure Symptoms

```
# Failure type 1: port conflict (parallel runs)
--- FAIL: TestPaymentEndpointConvertsAmount (0.10s)
    payment_test.go:24: listen tcp :8080: bind: address already in use

# Failure type 2: external API rate limit (nightly CI runs)
--- FAIL: TestPaymentEndpointConvertsAmount (5.03s)
    payment_test.go:35: expected 200, got 500
    # Server logs show: "exchange rate API returned 429 Too Many Requests"

# Failure type 3: server not ready (timing)
--- FAIL: TestPaymentEndpointConvertsAmount (0.15s)
    payment_test.go:30: Post "http://localhost:8080/payment/convert": dial tcp: connection refused
```

CI failure rate: 60% on parallel runs, 25% on nightly runs (API rate limit), near 0% on local
single-threaded runs.

### Root Cause Analysis

Three independent root causes compounded:

1. **Port conflict**: `":8080"` is hardcoded — parallel test packages each try to bind the same
   port, and all but the first fail with `address already in use`.
2. **External dependency**: the server makes a real HTTP call to a third-party API. The API has
   a free-tier rate limit of 100 requests/month — nightly CI burns through this quickly.
3. **Server leak**: the server started in the test is never shut down — it leaks across test
   functions and packages, consuming the port for the remainder of the test run.

Root cause: `TestPaymentEndpointConvertsAmount` fails intermittently because the server binds to
a hardcoded port (conflict in parallel), calls an external rate-limited API (fails nightly), and
is never shut down (leaks the port for subsequent tests).

### Fix

```go
// tests/integration/payment_test.go

package integration

import (
    "context"
    "encoding/json"
    "net"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
    "github.com/myorg/myservice/internal/server"
)

// mockExchangeRateServer returns a test server that simulates the external API
func mockExchangeRateServer(t *testing.T) *httptest.Server {
    t.Helper()
    mock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]interface{}{
            "rates": map[string]float64{"EUR": 0.92},
        })
    }))
    t.Cleanup(mock.Close) // automatically closed when test ends
    return mock
}

func TestPaymentEndpointConvertsAmount(t *testing.T) {
    // FIX 1: use port :0 — OS assigns a free port automatically
    listener, err := net.Listen("tcp", ":0")
    if err != nil {
        t.Fatal(err)
    }
    port := listener.Addr().(*net.TCPAddr).Port

    // FIX 2: mock the external exchange rate API
    mockAPI := mockExchangeRateServer(t)

    // Pass mock URL to the server so it doesn't call the real API
    srv := server.New(listener, server.WithExchangeRateURL(mockAPI.URL))
    go srv.Serve(listener)

    // FIX 3: register cleanup — server is always shut down when test ends
    ctx, cancel := context.WithCancel(context.Background())
    t.Cleanup(cancel)
    go func() {
        <-ctx.Done()
        srv.Shutdown(context.Background())
    }()

    // FIX 4: wait for server with a proper ready check, not a fixed sleep
    addr := fmt.Sprintf("http://localhost:%d", port)
    waitForServer(t, addr, 5*time.Second)

    resp, err := http.Post(addr+"/payment/convert",
        "application/json",
        strings.NewReader(`{"amount": 100, "from": "USD", "to": "EUR"}`))
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        t.Fatalf("expected 200, got %d", resp.StatusCode)
    }
}

func waitForServer(t *testing.T, addr string, timeout time.Duration) {
    t.Helper()
    deadline := time.Now().Add(timeout)
    for time.Now().Before(deadline) {
        resp, err := http.Get(addr + "/health")
        if err == nil && resp.StatusCode == 200 {
            return
        }
        time.Sleep(50 * time.Millisecond)
    }
    t.Fatalf("server at %s did not become ready within %s", addr, timeout)
}
```

### Verification

```bash
# Run in parallel to confirm no port conflicts
go test ./tests/integration/... -parallel 8 -count=5 -v 2>&1 | grep -E "PASS|FAIL"
# expected: all PASS

# Run 20 times to confirm rate limit issue is gone (mock eliminates external call)
go test ./tests/integration/... -run TestPaymentEndpointConvertsAmount -count=20 -v 2>&1 | grep -E "ok|FAIL"
# expected: 20 ok lines, 0 FAIL
```

### Prevention

- Add a `FreePort(t)` helper to `tests/testutil/ports.go` — all integration tests use it
- Add a CI rule: grep for hardcoded port numbers in test files (`:[0-9]{4,5}"`) and flag for review
- Separate integration tests with real external calls into `//go:build integration` build tag
  so they run only when `INTEGRATION=true` is set in CI, not on every PR
