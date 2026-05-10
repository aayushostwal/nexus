# Infrastructure Checklist

Use these checklists at each phase of infrastructure work. Mark each item: ✅ Done | ⚠️ Partial | ❌ Missing | N/A Not applicable.

---

## Pre-Design Checklist

Complete this before recommending any architecture. Missing answers to starred items (*) should block design work — wrong answers to these produce expensive mistakes.

| # | Question | Why It Matters | Answer Format |
|---|----------|---------------|---------------|
| 1* | What is the team size? | Determines ops complexity ceiling (no K8s for teams < 5 without a DevOps hire) | Number |
| 2* | Is there a dedicated DevOps / SRE engineer? | Determines managed vs self-managed tier | Yes / No |
| 3* | What is the hard budget ceiling per month? | Gates every service selection | $X/mo |
| 4* | What is the expected traffic at launch? (req/day or MAU) | Determines compute tier and database size | Number |
| 5* | What is the expected traffic at 12 months? | Prevents under-architecting for growth | Number or "unknown" |
| 6* | What cloud provider is preferred or required? | Narrows service catalog | AWS / GCP / Azure / None |
| 7* | Are there compliance requirements? (HIPAA / SOC2 / GDPR / PCI) | HIPAA alone adds ~$40–80/mo in required services and weeks of design work | List or None |
| 8* | What is the required uptime SLA? (99.9% / 99.95% / 99.99%) | 99.9% allows single-AZ; 99.99% requires multi-region active-active | Percentage |
| 9 | What is the expected data size at launch and at 12 months? | Determines database tier and storage class | GB / TB |
| 10 | Is the traffic pattern steady or spiky? | Spiky → serverless or strong auto-scaling; steady → reserved capacity |  Steady / Spiky / Unknown |
| 11 | Are there geographic requirements? (data residency, low latency for specific regions) | Drives region selection and CDN strategy | List of regions |
| 12 | What is the development lifecycle? (continuous deploy or scheduled releases) | Drives CI/CD complexity and blue/green vs rolling deploy strategy | Continuous / Scheduled |
| 13 | Does the app process payments? | PCI-DSS compliance scope, never store raw card data | Yes / No |
| 14 | Does the app process personal health information? | HIPAA scope — requires BAA with cloud provider | Yes / No |
| 15 | Does the app serve EU users? | GDPR — requires data residency controls, right-to-erasure support | Yes / No |
| 16 | Is there existing infrastructure? (IaC files, existing cloud accounts) | Determines greenfield vs migration design path | Yes / No + what |
| 17 | What is the primary database type? (relational, document, time-series, graph) | If uncertain, defaulting to PostgreSQL is nearly always correct | Type |
| 18 | Are there background jobs or async processing needs? | Determines whether a queue + worker service is required | Yes / No |
| 19 | Are there realtime features? (live updates, WebSockets, server-sent events) | Requires separate connection management tier or managed WebSocket service | Yes / No |
| 20 | What is the expected team's on-call availability? | No 24/7 on-call → managed services with auto-recovery are non-negotiable | 24/7 / Business hours / None |
| 21 | Are there existing vendor contracts or required services? | May constrain cloud provider choice or specific service tiers | List or None |
| 22 | What is the rollback requirement? (can you accept 5 min downtime on bad deploy?) | Determines blue/green vs rolling vs canary deployment strategy | Acceptable downtime |
| 23 | Is multi-tenancy required? | Drives database schema design and IAM isolation model | Yes / No |

**Minimum required before design:** Questions 1–8 must be answered. For Q7 compliance questions, if "yes" — read the compliance specialization section in `design.md` before proceeding.

---

## Security Checklist

Verify every item before declaring an architecture production-ready.

### Network Security

| # | Check | What to Verify | Pass Condition |
|---|-------|---------------|---------------|
| 1 | No database publicly accessible | Security group allows only app-tier SG on DB port | SG source is SG ID, not CIDR |
| 2 | No 0.0.0.0/0 ingress on any port except 80/443 | All SGs reviewed; no catch-all rules on non-HTTP ports | No wildcard CIDR on DB/Redis/admin ports |
| 3 | VPC with private subnets for databases and cache | RDS, ElastiCache in private subnets (no direct internet route) | Subnet has no internet gateway route |
| 4 | No public IPs on database or cache nodes | RDS `publicly_accessible = false`; ElastiCache no public endpoint | Confirmed in console or IaC |
| 5 | TLS enforced end-to-end | ALB redirects HTTP → HTTPS; RDS `require_ssl` enabled; Redis TLS-in-transit | No plain HTTP paths to sensitive endpoints |
| 6 | WAF in front of public endpoints | WAF association on ALB or CloudFront | WAF rules include OWASP Top 10 managed rule group |
| 7 | DDoS protection enabled | Shield Standard (free, automatic on ALB/CloudFront) or Shield Advanced | Confirmed |

### Identity and Access Management

| # | Check | What to Verify | Pass Condition |
|---|-------|---------------|---------------|
| 8 | IAM least-privilege | No `"Action": "*"` or `"Resource": "*"` in any IAM policy | All policies reviewed; actions are explicit |
| 9 | No IAM access keys for EC2/ECS workloads | App uses IAM roles (instance profile / task role), not access keys | No `AWS_ACCESS_KEY_ID` in container env vars |
| 10 | MFA on all human IAM users | Root account MFA; all console users require MFA | Confirmed in IAM console |
| 11 | No root account used for daily operations | Root account locked down; all work done via IAM users/roles | Root has no access keys; no recent root login |
| 12 | Service accounts have per-service roles | Each microservice / ECS task has its own IAM task role | No shared task roles across services |
| 13 | S3 bucket policies restrict access to IAM roles only | No `"Principal": "*"` in bucket policies | Verified with `aws s3api get-bucket-policy` |

### Secrets Management

| # | Check | What to Verify | Pass Condition |
|---|-------|---------------|---------------|
| 14 | No secrets in environment variables committed to git | `.env` files in `.gitignore`; scan git history for secrets | `git log --all -S "password"` returns no sensitive values |
| 15 | Secrets in a secrets manager | DB passwords, API keys in AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault | No literal secret values in IaC or CI configs |
| 16 | Secret rotation configured for database credentials | Secrets Manager rotation lambda enabled for RDS credentials | Rotation schedule set (e.g., every 30 days) |
| 17 | No hardcoded credentials in container images | Docker image layers scanned; no secrets baked in | Image scanning (ECR or Trivy) shows no secrets |
| 18 | CI/CD secrets stored in secret store, not env vars in pipeline YAML | GitHub Actions Secrets / Vault integration; no plaintext in `.github/workflows/*.yml` | Pipeline YAML has no `password:` literal values |

### Data Protection

| # | Check | What to Verify | Pass Condition |
|---|-------|---------------|---------------|
| 19 | Encryption at rest on all databases | RDS `storage_encrypted = true`; S3 default encryption enabled; ElastiCache at-rest encryption | Confirmed in IaC and console |
| 20 | S3 buckets not publicly readable | `aws s3api get-bucket-acl` returns no public grants; bucket policy restricts access | No public access; Block Public Access enabled |
| 21 | S3 bucket versioning enabled on critical buckets | User uploads, backups, config buckets have versioning enabled | `aws s3api get-bucket-versioning` returns Enabled |
| 22 | Backups encrypted and stored in separate account or region | RDS snapshot KMS encryption; cross-account snapshot sharing | Backup destination has independent access controls |

---

## Cost Optimization Checklist

Run this checklist on any existing or proposed architecture before finalizing.

| # | Check | Signal | Action |
|---|-------|--------|--------|
| 1 | Are instances right-sized? | CloudWatch CPU < 20% consistently for 2+ weeks | Downsize one tier; verify with load test |
| 2 | Are Reserved Instances or Savings Plans purchased for baseline load? | On-Demand pricing for steady workloads | Purchase 1-year RI/Savings Plan for 30–40% savings |
| 3 | Are there unattached EBS volumes? | EBS volumes with state "available" (not attached) | Delete or snapshot-then-delete |
| 4 | Are there idle Elastic IPs? | Elastic IPs not associated with a running instance | Release them ($3.60/mo each) |
| 5 | Are there stopped EC2 instances with attached storage? | EC2 stopped but EBS still billing | Snapshot + terminate, or start/resize/terminate |
| 6 | Are S3 lifecycle policies configured? | S3 buckets growing indefinitely with no tiering | Add lifecycle: Infrequent Access at 30d, Glacier at 90d |
| 7 | Is data transfer cost audited? | NAT Gateway or inter-AZ transfer is a top cost line | Route traffic within AZ; use VPC endpoints for S3/DynamoDB |
| 8 | Is auto-scaling ceiling set? | No `max_capacity` on ECS/ASG/Lambda | Set ceiling to prevent runaway cost on traffic spike |
| 9 | Is dev/staging environment right-sized? | Staging matches prod specs (5× cost for no reason) | Dev: single-AZ, burstable instances, no HA, auto-stop evenings |
| 10 | Is CloudWatch log retention set? | Log groups with "Never expire" retention | Set retention to 30–90 days; archive to S3 Glacier for compliance |
| 11 | Are ECR images cleaned up with lifecycle policies? | ECR repository grows with every deploy | Add lifecycle policy: keep last 10 images, delete untagged after 1 day |
| 12 | Is CloudFront used for static assets? | API serving static files directly; high data transfer cost | Route static assets through CloudFront (dramatically reduces transfer cost) |
| 13 | Are Spot Instances used for non-critical workloads? | On-Demand pricing for batch jobs, CI runners, dev workers | Spot saves 70–90% on interruptible workloads |
| 14 | Are Lambda functions over-provisioned? | Memory set to max without profiling | Use Lambda Power Tuning tool to find optimal memory/cost point |
| 15 | Is AWS Cost Anomaly Detection enabled? | No automated alerting on cost spikes | Enable Cost Anomaly Detection with alert threshold ~20% above baseline |

---

## Deployment Readiness Checklist

Complete this before the first production deployment or before declaring an app production-ready.

### Reliability

| # | Check | Pass Condition |
|---|-------|---------------|
| 1 | Minimum 2 compute instances / replicas in production | ECS min_count >= 2; K8s replicas >= 2; never single-instance prod |
| 2 | Health checks configured and working | ALB target group health check returns 200; K8s readinessProbe passes |
| 3 | Auto-scaling configured with tested ceiling | Scale-out policy triggers; max_capacity prevents runaway cost |
| 4 | Database multi-AZ or equivalent HA | `multi_az = true` on RDS; Aurora multi-AZ; or equivalent |
| 5 | Database backups verified | Backup enabled AND a restore has been tested in the last 30 days |
| 6 | Graceful shutdown handling in app | App responds to SIGTERM; drains connections; completes in-flight requests |
| 7 | Circuit breaker or retry logic for external services | App doesn't cascade-fail on a downstream timeout |

### Observability

| # | Check | Pass Condition |
|---|-------|---------------|
| 8 | Structured logging enabled (JSON format) | All app logs are JSON; no raw print/console.log for ops-relevant events |
| 9 | Metrics exported to monitoring system | CloudWatch / Datadog / Grafana receiving app-level metrics |
| 10 | Alerting configured for critical paths | Alert on: error rate > 1%, p99 latency > 2s, DB connections > 80%, disk > 80% |
| 11 | On-call runbook exists for each alert | Each alert links to a runbook with resolution steps |
| 12 | Distributed tracing enabled | X-Ray / Jaeger / Tempo traces showing full request path |
| 13 | Dashboard showing SLI/SLO exists | Real-time visibility into error rate, latency, throughput, saturation |

### Security

| # | Check | Pass Condition |
|---|-------|---------------|
| 14 | All items in the Security Checklist above are ✅ or N/A | No ❌ items in security checklist |
| 15 | Penetration test or security scan completed | OWASP ZAP / Semgrep / AWS Security Hub findings reviewed |
| 16 | Dependency vulnerability scan clean | `npm audit` / `pip-audit` / Snyk shows no critical CVEs |

### Operations

| # | Check | Pass Condition |
|---|-------|---------------|
| 17 | All infrastructure is in IaC | No resources created manually in console; all in Terraform / CDK / Pulumi |
| 18 | IaC state is remote and locked | Terraform state in S3 + DynamoDB lock; not local `.tfstate` file |
| 19 | CI/CD pipeline is fully automated | No manual steps between merge and deploy |
| 20 | Rollback procedure documented and tested | `terraform apply` with previous tag or ECS rollback tested |
| 21 | Disaster recovery tested | Restore from backup into staging; measured RTO and RPO |
| 22 | Cost estimate matches actual spend (within 20%) | First real invoice within expected range |
