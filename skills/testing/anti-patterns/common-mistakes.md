# Flaky-test mistakes

- Retries and longer sleeps mask failures; identify ordering, timing, environment, resource, or concurrency causes.
- A single green run is weak evidence for an intermittent defect. Report repetitions and the original failure rate.
- Tests depending on real external services should be explicit integration tests with bounded timeouts and clear diagnostics.
- Skipping a test requires a tracked reason, owner, and expiry, not silent acceptance.
- Fix shared-state cleanup and synchronization at the owning boundary; avoid serializing the whole suite unless that is the intended contract.
