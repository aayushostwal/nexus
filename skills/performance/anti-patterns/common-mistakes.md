# Performance mistakes

- Increasing resource limits without identifying the growth or saturation mechanism only postpones failure.
- Comparing profiles from different workloads confounds the result; keep traffic, runtime, and test duration comparable.
- Profiling production without a bounded overhead and rollback plan can worsen an incident.
- Treating a dependency upgrade as a version-string edit ignores transitive, API, schema, and deployment compatibility.
- Declaring a leak from RSS alone overlooks caches, fragmentation, and native allocations.
