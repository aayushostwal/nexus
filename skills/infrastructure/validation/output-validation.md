# Output Validation

Checklists and confidence scoring for verifying that infrastructure planning outputs are complete, accurate, and actionable before delivering them to the user.

---

## How to Verify an HLD is Complete

Run this checklist on every HLD produced by `design.md` before presenting it. An HLD with ❌ items is not ready to deliver.

### Structural Completeness

| # | Check | Pass Condition | Failure Action |
|---|-------|---------------|---------------|
| 1 | System Overview present | 2-sentence description states what the system does and its primary traffic pattern | Write it |
| 2 | Mermaid architecture diagram included | `graph TB` block renders correctly; shows all major components | Generate diagram |
| 3 | All detected components are represented in the diagram | Every component from the codebase scan appears in the diagram or is explicitly excluded with reason | Add missing components |
| 4 | Component table present | Table lists every service with tier and reason for selection | Complete the table |
| 5 | Cost estimate table present | Table includes every component, its configuration, and a monthly cost | Add cost estimate |
| 6 | Total monthly cost is visible and prominently stated | `**Total: ~$XX/mo**` appears at the bottom of the cost table | Add total |
| 7 | Trade-off matrix present | At least 2–3 alternative architectures compared with the recommended option | Add matrix |
| 8 | Security architecture section present | Layer-by-layer security table covering edge, transport, auth, secrets, network, data at rest | Add section |
| 9 | Scaling strategy section present | Traffic tier table with at least 4 tiers (seed, early growth, scale, high traffic) | Add section |
| 10 | Deployment strategy section present | CI/CD pipeline described; rollback mechanism stated | Add section |
| 11 | Failure mode analysis section present | SPOF table with at least the primary compute, database, and cache covered | Add section |

### Content Accuracy

| # | Check | Pass Condition | Failure Action |
|---|-------|---------------|---------------|
| 12 | Services match user's cloud provider preference | No AWS services in a GCP-requested HLD; no legacy services (EC2 Classic) | Correct services |
| 13 | Services match user's budget ceiling | No EKS if budget < $200/mo; no Aurora Serverless v2 if budget < $100/mo without justification | Adjust to budget |
| 14 | Services match user's team maturity | No Kubernetes for teams < 5 without DevOps hire; no self-managed Redis if ops burden was mentioned | Adjust complexity |
| 15 | Compliance requirements reflected | HIPAA workloads include VPC Flow Logs, CloudTrail, GuardDuty, KMS CMK; cost impact noted | Add compliance layer |
| 16 | Cost estimates use current-generation instance types | No `m5`, `r5` when `m7g`, `r7g` (Graviton 3) exist; no Aurora MySQL v1 | Update to current gen |
| 17 | No placeholder cost figures | All costs are calculated or sourced from pricing tables; no `$XX` left unfilled | Fill in all estimates |
| 18 | Diagram has no more than 12 nodes | Abstract clusters of similar services into subgraphs if needed | Simplify diagram |

### Diagram Quality Check

Verify the Mermaid diagram is well-formed:

```
[ ] graph TB declared
[ ] All nodes have quoted labels
[ ] Arrows use --> for data flow
[ ] Dotted arrows (-.->) used for telemetry/async flows
[ ] subgraph blocks close with `end`
[ ] VPC subgraph includes public and private subnets
[ ] Database nodes use [(" ")] shape (cylinder)
[ ] External user node present ("Users / Clients")
[ ] No orphaned nodes (every node has at least one connection)
```

**Quick render test:** Paste the diagram into `mermaid.live` and confirm it renders without errors before including in the output.

---

## How to Verify an Audit is Complete

Run this checklist on every audit report produced by `evaluate.md` before presenting it.

### Input Completeness

| # | Check | Pass Condition | Failure Action |
|---|-------|---------------|---------------|
| 1 | All infra files read | Used Read tool on every `.tf`, `docker-compose.yml`, `.yml` in `k8s/`, `serverless.yml` found | Re-run discovery; read missing files |
| 2 | Files reviewed list is in the report | Audit Summary section lists every file that was read | Add file list |
| 3 | Cloud provider and region identified | Explicitly stated in report (e.g., "AWS us-east-1") | State it |
| 4 | Current stack inventory is complete | All compute, DB, network, storage, IAM, observability resources listed | Complete inventory |

### Risk Category Coverage

Every audit must cover all six risk domains. Mark each as covered (✅) or explicitly noted as N/A:

| # | Risk Domain | What Must Be Checked | Minimum Evidence |
|---|-------------|---------------------|-----------------|
| 5 | Reliability | Multi-AZ, replicas, health checks, auto-scaling, graceful shutdown | At least one finding per subdomain |
| 6 | Security | Secrets, IAM, encryption at rest, encryption in transit, network segmentation, WAF | At least one finding per subdomain |
| 7 | Cost Efficiency | Instance sizing, Reserved Instances, unused resources, auto-scaling ceiling, lifecycle policies | At least one finding |
| 8 | Observability | Logging, metrics, tracing, alerting, dashboards, log retention | At least one finding |
| 9 | Scalability | Stateless compute, connection pooling, cache layer, CDN, queue | At least one finding |
| 10 | Operational | IaC coverage, remote state, runbooks, backup policy, DR plan | At least one finding |

**If a domain has no findings:** Explicitly state "Domain X: No issues found. [Evidence: X is configured at Y]" — do not silently skip it.

### Issue Classification Accuracy

| # | Check | Pass Condition |
|---|-------|---------------|
| 11 | Every Critical issue directly causes outage, data loss, or security breach | No "nice to have" or cost items classified as Critical |
| 12 | Short-term plan items require no app code changes | Pure infrastructure changes only; max 4 hours each |
| 13 | Long-term plan items are in quarters, not months | Q1/Q2/Q3/Q4 format |
| 14 | Both current state and target state diagrams are present | Two Mermaid diagrams in report |
| 15 | Current state diagram annotates problems | ❌ for Critical, ⚠️ for Major issues visible in diagram |
| 16 | Short-term plan has at most 10 items | Prioritization means cutting; never list everything |
| 17 | Each short-term item has a verification step | "How do you know this worked?" is answered for every P0 item |

---

## Confidence Scoring for Architecture Recommendations

Attach a confidence score to every architecture recommendation. State it explicitly so the user knows how much to trust the output.

### Confidence Score Definitions

| Score | Label | Meaning | When to Apply |
|-------|-------|---------|--------------|
| 90–100% | High confidence | Recommendation is based on concrete data: actual traffic numbers, confirmed budget, known team size and maturity, known compliance requirements | User answered all 6 clarifying questions; codebase was scanned; no conflicting signals |
| 70–89% | Moderate confidence | Recommendation is based on common patterns but one or more key inputs are assumed | Budget assumed from "startup" context; traffic estimated from app type; team maturity inferred |
| 50–69% | Low confidence | Key inputs are unknown; recommendation is a reasonable default but could be wrong for this specific case | User provided minimal context; multiple plausible architectures exist; no codebase access |
| < 50% | Speculative | Insufficient information to make a real recommendation | User described a novel workload with no analogues; very unusual compliance or scale requirements |

### How to State Confidence in Output

Include a confidence callout at the end of every HLD or audit:

```
---
**Confidence:** 82% (Moderate)

**Assumptions made:**
- Traffic: Assumed 10k–50k req/day based on "early startup" context (Q1 not answered)
- Budget: Assumed $100–200/mo based on "small team" signal
- Compliance: Assumed none based on no mention of HIPAA/SOC2/GDPR

**What would change this recommendation:**
- If traffic is > 100k req/day → upgrade to ECS Fargate + Aurora; Railway will hit vertical limits
- If HIPAA compliance is required → add VPC Flow Logs, CloudTrail, GuardDuty; estimate adds ~$60/mo
- If budget < $50/mo → replace ECS + RDS with Railway + Neon (see free-alternatives.md)
```

### When Confidence Drops Below 70%

If confidence is below 70%, do not present a single recommendation. Instead:

1. State the 2–3 most plausible architectures with their different assumptions
2. Ask the specific clarifying question(s) that would resolve the uncertainty
3. If user says "just pick one" → pick the most conservative (lowest cost, lowest complexity) option and label it as a starting point

---

## When to Flag "This Needs a Human Expert"

Not all infrastructure decisions should be made by an AI agent alone. Escalate to a human expert when any of the following conditions apply.

### Compliance-Critical Workloads

| Trigger | Why It Needs a Human |
|---------|---------------------|
| HIPAA compliance required and team is not familiar with requirements | HIPAA violations carry $100–$50k penalties per violation. A BAA with AWS must be in place; specific services must be used; audit logs have specific retention requirements. A misconfiguration is a regulatory failure. |
| PCI-DSS Level 1 (> 6M transactions/year) | PCI Level 1 requires on-site audit by a Qualified Security Assessor (QSA). Architecture must be designed with the QSA involved. |
| SOC 2 Type II certification in progress | SOC 2 audit covers a 6–12 month period; infrastructure changes mid-audit can invalidate the audit. A compliance engineer must be involved before any architecture changes. |
| GDPR with cross-border data transfer | Data residency requirements and Standard Contractual Clauses (SCCs) are legal, not technical decisions. An EU legal counsel must be involved. |
| FedRAMP authorization required | US government workloads require formal FedRAMP authorization. This is a months-long process with specific control requirements that cannot be improvised. |

### Very Large Scale

| Trigger | Why It Needs a Human |
|---------|---------------------|
| > 10,000 requests/second sustained | At this scale, architecture is highly workload-specific. Generic guidance is likely wrong or suboptimal. Engage a solutions architect (AWS SA program is free for large customers). |
| > 100 TB data in motion per month | Data transfer costs, egress optimization, and storage tier selection at this scale require analysis of actual usage patterns. |
| Multi-region active-active deployment | Global traffic routing, data consistency across regions (CAP theorem), conflict resolution — these require experienced distributed systems engineers. |
| > 1,000 microservices | Service mesh, observability at scale, dependency management — beyond what generic heuristics cover reliably. |

### Unusual or Novel Requirements

| Trigger | Why It Needs a Human |
|---------|---------------------|
| Custom silicon (AWS Trainium, Inferentia, FPGA) | ML hardware optimization is highly specialized. Engage an AWS ML specialist SA. |
| Real-time systems with < 1ms latency requirements | Ultra-low latency requires kernel bypass, DPDK, dedicated hardware — not standard cloud services. |
| Financial / trading systems with regulatory requirements | MiFID II, Reg NMS, market data licensing — requires specialized compliance and trading technology expertise. |
| Nuclear, aviation, medical device software | Safety-critical systems require formal methods and regulatory certification processes that are outside the scope of cloud architecture guidance. |

### How to Flag Escalation

When any of the above triggers apply, include this in your output:

```
---
**Expert Review Required**

This workload has characteristics that exceed the reliable scope of automated infrastructure planning:

- [Specific trigger: e.g., "HIPAA compliance required"]

**Recommended next step:** [Specific action, e.g., "Engage an AWS Healthcare Competency Partner before finalizing this architecture. The AWS Partner Network (apn.aws.amazon.com) lists HIPAA-specialized partners."]

**What this output provides:** A starting framework and reasonable defaults. A compliance or domain expert should review and modify before production deployment.
```

---

## Final Delivery Checklist

Before sending any infrastructure output to the user, confirm:

| # | Check | Done? |
|---|-------|-------|
| 1 | All required sections are present (see HLD or Audit checklists above) | |
| 2 | Confidence score is stated | |
| 3 | All assumptions are listed explicitly | |
| 4 | Cost total is clearly stated in one place | |
| 5 | Mermaid diagram renders without errors | |
| 6 | No placeholder values remain ($XX, [TBD], [fill in]) | |
| 7 | If compliance triggers apply, escalation flag is included | |
| 8 | Output ends with offer to hand off to nexus:planning | |

**The handoff offer (always include at end of output):**

> "Want me to hand this off to nexus:planning to produce the Terraform / CDK / deployment implementation steps for this architecture?"
