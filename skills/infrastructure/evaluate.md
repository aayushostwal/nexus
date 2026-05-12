# Infrastructure Evaluation Playbook

## Goal
Audit existing infrastructure for reliability, security, performance, and cost efficiency.

## Workflow
1. Read current infra definitions/config and deployment topology.
2. Identify critical path services and single points of failure.
3. Evaluate four dimensions: reliability, security, performance, cost.
4. Rank issues by severity and business impact.
5. Propose prioritized remediation plan with effort estimates.

## Severity Levels
- High: outage/security/data-loss risk
- Medium: notable reliability/performance/cost risk
- Low: optimization or hygiene issue

## Output Shape
```text
Outcome:
Current State Summary:
Findings:
Recommended Remediations:
Verification Plan:
Next Step:
```

## Rules
- Cite concrete evidence from config or logs.
- Prefer reversible changes first.
- Include rollback guidance for high-risk remediations.
