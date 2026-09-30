# Incident and release mistakes

- Do not postpone authorized, reversible stabilization for a perfect root-cause report.
- Do not claim recovery from deployment completion alone; check the affected user operation and error metrics.
- Rollback can fail after irreversible schema changes; verify compatibility before choosing it.
- A green unit suite does not prove production readiness, dependency health, or available capacity.
- Distinguish observed facts, hypotheses, mitigation, and permanent repair; assign follow-up owners and dates.
