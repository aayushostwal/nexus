# Performance investigation heuristics

- Compare equivalent workloads before and after the regression; capture runtime, dependency versions, traffic, and deployment revision.
- Separate resident memory, managed heap, cache growth, and allocator fragmentation before calling growth a leak.
- Collect a bounded profile with an agreed overhead budget. Correlate allocation sites or blocked time with application paths.
- For dependency upgrades, inspect direct and transitive consumers, release notes, API changes, and persisted-data compatibility.
- Verify the suspected mechanism with a controlled reproduction; quantify the change and retain rollback instructions.
