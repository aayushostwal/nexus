# Output Validation

Checklists and confidence scoring for verifying infrastructure planning outputs before delivery.

---

## HLD Completeness Checklist (`design.md` outputs)

**Structure** — all required before delivery:
- [ ] 2-sentence system overview (what + primary traffic pattern)
- [ ] Mermaid `graph TB` diagram renders; ≤12 nodes; all detected components included or excluded with reason
- [ ] Component table: every service with tier + selection reason
- [ ] Cost table: every component with config + monthly cost; `**Total: ~$XX/mo**` at bottom
- [ ] Trade-off matrix: ≥2–3 alternatives vs. recommended
- [ ] Security: edge / transport / auth / secrets / network / data-at-rest
- [ ] Scaling: ≥4 traffic tiers (seed → early growth → scale → high traffic)
- [ ] Deployment: CI/CD pipeline + rollback mechanism
- [ ] SPOF / failure mode table: compute, DB, cache

**Content accuracy:**
- [ ] Services match cloud provider, budget, and team maturity
- [ ] No EKS < $200/mo; no Aurora Serverless v2 < $100/mo without justification
- [ ] No K8s for teams < 5 without DevOps; no self-managed Redis if ops burden flagged
- [ ] HIPAA triggers → VPC Flow Logs + CloudTrail + GuardDuty + KMS CMK + cost delta
- [ ] Graviton 3 (`m7g`/`r7g`) over `m5`/`r5`; Aurora v2 over v1; no placeholders (`$XX`, `[TBD]`)

**Mermaid quality:**
- [ ] `-->` data flow; `-.->` async/telemetry; `subgraph`...`end`; VPC with public + private subnets
- [ ] DB nodes `[(" ")]`; "Users / Clients" node present; no orphans; renders in `mermaid.live`

---

## Audit Completeness Checklist (`evaluate.md` outputs)

- [ ] All infra files read (`.tf`, `docker-compose.yml`, `k8s/*.yml`, `serverless.yml`)
- [ ] Files-reviewed list in Audit Summary; cloud provider + region stated
- [ ] Full inventory: compute, DB, network, storage, IAM, observability

**Six risk domains** (all required; N/A must include evidence):

| Domain | Must Check | Min Evidence |
|--------|-----------|-------------|
| Reliability | Multi-AZ, replicas, health checks, auto-scaling, graceful shutdown | 1 finding/subdomain |
| Security | Secrets, IAM, encryption at rest/transit, network segmentation, WAF | 1 finding/subdomain |
| Cost | Sizing, Reserved Instances, unused resources, scaling ceiling, lifecycle | 1 finding |
| Observability | Logging, metrics, tracing, alerting, dashboards, retention | 1 finding |
| Scalability | Stateless compute, connection pooling, cache, CDN, queue | 1 finding |
| Operational | IaC coverage, remote state, runbooks, backup, DR plan | 1 finding |

**Issue classification:**
- [ ] Critical = outage / data loss / breach only; short-term = pure infra, ≤4 hrs, no app code
- [ ] Long-term in Q1/Q2/Q3/Q4; ≤10 short-term items; every P0 has a verification step
- [ ] Current-state + target-state diagrams present; current-state annotates ❌/⚠️

---

## Confidence Scoring

| Score | Label | Apply When |
|-------|-------|-----------|
| 90–100% | High | All 6 clarifying questions answered; codebase scanned |
| 70–89% | Moderate | ≥1 key input assumed (budget, traffic, team) |
| 50–69% | Low | Multiple plausible architectures; minimal context |
| < 50% | Speculative | Novel workload; insufficient info |

End every HLD/audit with:
```
**Confidence:** XX% (Label)
**Assumptions:** [each assumed input + basis]
**What would change this:** [specific triggers]
```

If confidence < 70%: present 2–3 architectures with differing assumptions, ask the resolving question. If "just pick one" → lowest-cost/complexity labeled as starting point.

---

## Expert Escalation Triggers

Flag **"Expert Review Required"** for any of:
- HIPAA, PCI-DSS Level 1, SOC 2 Type II in progress, GDPR cross-border, FedRAMP
- >10k req/sec sustained, >100 TB/month, multi-region active-active, >1,000 microservices
- Custom silicon (Trainium/Inferentia/FPGA), <1ms latency, financial/trading regulatory, safety-critical systems

```
**Expert Review Required:** [specific trigger]
**Next step:** [concrete action + resource link]
**This output:** Starting framework only — expert must review before production.
```

---

## Final Delivery Checklist

- [ ] All required sections present; confidence + assumptions stated; cost total in one place
- [ ] No placeholders; Mermaid renders; compliance escalation flag if triggered
- [ ] Ends with: *"Want me to hand this off to nexus:planning for Terraform / CDK implementation steps?"*
