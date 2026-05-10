# Common Infrastructure Anti-Patterns

12 real infrastructure mistakes that appear repeatedly across production systems. For each: what it looks like, why it happens, the actual risk, and the correct pattern.

---

## Anti-Pattern 1: Kubernetes for a 3-Person Team

**Also known as:** "Resume-driven architecture"

### What It Looks Like

A 3–5 person startup with a single monolith or a handful of microservices running on EKS or self-managed K8s. The team spends 30–40% of engineering time on cluster management, upgrade cycles, debugging `CrashLoopBackOff`, tuning resource requests/limits, and managing Helm releases.

### Why Teams Do It

- Engineer with K8s experience wants to use it
- Perceived as "what serious companies use"
- Job postings for the team list K8s as a requirement
- Fear of outgrowing simpler platforms ("we might need K8s later")

### The Real Risk

| Impact | Details |
|--------|---------|
| Ops tax | EKS control plane alone is $72/mo. Add managed node groups, Fargate profiles, VPC CNI issues, CoreDNS, kube-proxy updates, and the real cost is $200–500/mo plus 2–4 hrs/week engineering time |
| Incident risk | K8s adds 10+ new failure modes: pod scheduling failures, resource limits OOMKill, node NotReady, etcd quorum loss, RBAC misconfig. A 3-person team on call for these has no margin |
| Migration debt | Migrating a K8s-native codebase later is hard. Teams lock themselves in with K8s-specific patterns (PVCs, ConfigMaps, Helm charts) that don't port cleanly to ECS or PaaS |
| Velocity cost | Every new engineer needs K8s training before they're productive. This is real onboarding time at a small company |

### The Correct Pattern

Use the simplest platform that can serve your current scale:

| Team Size | Right Platform |
|-----------|---------------|
| 1–3 devs | Railway / Render / Fly.io (PaaS) |
| 3–8 devs | ECS Fargate + Terraform |
| 8–15 devs | ECS Fargate or EKS only if you already have K8s expertise in-house |
| 15+ devs, dedicated SRE | EKS / GKE with justified need |

**The migration path exists.** A Docker container running on Railway can be moved to ECS Fargate in one sprint. You do not need to pre-architect for K8s scale before you need K8s scale.

---

## Anti-Pattern 2: S3 for Everything

**Also known as:** Treating S3 as a database or a message bus

### What It Looks Like

- User profile data stored as individual JSON files in S3 (`users/{user_id}/profile.json`)
- App polling S3 for new files as a makeshift queue
- Application logs written directly to S3 with no aggregation layer
- Large binary ML model weights served directly from S3 on every inference request (no caching)

### Why Teams Do It

S3 is cheap, durable, and requires no provisioning. The SDK is simple. It feels like a safe default.

### The Real Risk

| Pattern | Risk |
|---------|------|
| S3 as database | No query capability; every "search" requires listing and downloading objects; no transactions; no consistency guarantees across concurrent writes |
| S3 as queue | No delivery guarantees; files don't disappear after processing; concurrent consumers read the same file; no retry or dead-letter semantics |
| Serving large binary models directly from S3 | $0.09/GB egress cost on every inference; 50 ms+ latency on every model load; no edge caching |

### The Correct Pattern

| Use Case | Right Service |
|----------|--------------|
| Structured / queryable data | PostgreSQL (RDS / Aurora / Neon) |
| Key-value lookups, session data, caching | Redis / ElastiCache |
| Async job queue | SQS (Standard or FIFO) / RabbitMQ / BullMQ |
| Large static files, user uploads, backups | S3 (this is what S3 is for) |
| ML model weights, served at inference | EFS mount on ECS / SageMaker model artifacts / cached locally per container |
| Application logs | CloudWatch Logs / Datadog / Grafana Loki (then archive to S3 after 30 days) |

**S3 is correct for:** large binary objects, static assets, backups, data lake files, artifacts. It is wrong for anything requiring queries, ordering, transactions, or low-latency lookups.

---

## Anti-Pattern 3: SSH Directly to Production Instances

### What It Looks Like

- Security group allows `0.0.0.0/0` on port 22
- Engineers have personal SSH keys distributed to production servers
- Common workflow: "SSH into the box to check logs" or "hotfix directly on the server"

### Why Teams Do It

It feels like the fastest path to production access. It's how servers have been managed for 20 years.

### The Real Risk

| Risk | Impact |
|------|--------|
| Attack surface | Every IP on the internet can attempt SSH brute-force or exploit CVEs in OpenSSH |
| Credential sprawl | Multiple engineers' keys on servers with no central revocation; a former employee's key may still work |
| No audit trail | No record of who ran what command, when, and what changed |
| Snowflake servers | Changes made via SSH are not in IaC; the server diverges from what Terraform describes |
| Compliance failure | SOC2, HIPAA, and PCI all require auditable access logs; SSH to servers provides none |

### The Correct Pattern

**Eliminate SSH entirely.** Replace it with:

| Need | Solution |
|------|---------|
| Shell access to EC2 / ECS | AWS Systems Manager Session Manager (`aws ssm start-session`). No open ports needed. Full audit log in CloudTrail. |
| Viewing container logs | `aws ecs execute-command` (ECS Exec) or CloudWatch Logs |
| Running one-off commands | ECS Exec for containers; SSM Run Command for EC2 |
| Debugging a crashed container | `kubectl exec` for K8s (scoped via RBAC); ECS Exec for Fargate |
| Emergency prod access | SSM with MFA requirement; time-limited IAM role; full session recorded to S3 |

If SSH must exist for legacy reasons: restrict port 22 to a bastion host; restrict the bastion's SG to your office CIDR only; audit access quarterly; require MFA.

---

## Anti-Pattern 4: Secrets in Environment Variables Committed to Git

### What It Looks Like

```bash
# .env file committed to git
DATABASE_URL=postgresql://admin:SuperSecret123@prod-db.example.com/myapp
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Or secrets in GitHub Actions workflow files:
```yaml
env:
  DATABASE_PASSWORD: "MySuperSecretPassword"  # visible in git history
```

### Why Teams Do It

It's the simplest way to get an app running. Environment variables are the 12-factor app pattern — but the 12-factor pattern refers to injecting secrets at runtime, not committing them to git.

### The Real Risk

| Risk | Impact |
|------|--------|
| Git history is permanent | Even if you delete the file, the secret exists in git history forever (`git log --all`) |
| Public repo = immediate breach | GitHub scans for and reports common secret patterns; malicious bots scan new public commits for secrets in real-time |
| No rotation capability | Rotating a secret requires changing the codebase and redeploying |
| No audit trail | No record of who accessed the secret and when |

### The Correct Pattern

| Phase | Correct Approach |
|-------|----------------|
| Local development | `.env` file in `.gitignore`; shared via secure channel (1Password, Vault) |
| CI/CD | GitHub Actions Secrets / GitLab CI Variables / Vault Agent |
| Production runtime | AWS Secrets Manager (fetched at startup or via sidecar); AWS SSM Parameter Store (SecureString); HashiCorp Vault |

**Immediate remediation if secrets are committed:**
1. Rotate ALL credentials exposed in the commit immediately — assume breach
2. Run `git filter-branch` or BFG Repo Cleaner to remove from history
3. Force-push clean history (coordinate with team)
4. Enable git-secrets / detect-secrets pre-commit hook to prevent recurrence

---

## Anti-Pattern 5: No Database Backups, or Untested Backups

### What It Looks Like

- `backup_retention_period = 0` in Terraform (disables RDS automated backups)
- Backups enabled but never tested (restore has never been attempted)
- Backup job runs, but restores are tried for the first time during an actual incident
- Backups stored in the same account, region, and bucket as production (one accidental `terraform destroy` deletes both)

### Why Teams Do It

Backups are invisible when everything is working. The cost of negligence is zero until it's catastrophic.

### The Real Risk

Without tested backups:
- Database corruption (application bug, disk failure, ransomware) = permanent data loss
- Accidental `DROP TABLE` in production = unrecoverable
- Point-in-time recovery is unavailable

**True story pattern:** Many production systems have `backup_retention_period = 7` set, but the restore procedure has never been tested. When a restore is needed, the team discovers the backup exists but is from the wrong timezone, incompatible schema version, or restores to a different region than expected.

### The Correct Pattern

| Requirement | Implementation |
|-------------|---------------|
| Automated backups | `backup_retention_period = 7` minimum; 30 days for compliance workloads |
| Point-in-time recovery | Enabled by default when backup retention > 0 on RDS |
| Deletion protection | `deletion_protection = true` on all production RDS instances |
| Cross-account backup | Copy snapshots to a separate AWS account automatically via EventBridge + Lambda |
| Cross-region backup | Copy snapshots to a secondary region for DR |
| Tested restores | Restore drill every 90 days; document actual RTO measured |
| Backup monitoring | CloudWatch Alarm on `FreeStorageSpace < 10GB`; alert on backup job failure |

**Verification command:**
```bash
aws rds describe-db-instances \
  --query "DBInstances[*].{ID:DBInstanceIdentifier,BackupRetention:BackupRetentionPeriod,MultiAZ:MultiAZ,DeletionProtection:DeletionProtection}"
```

---

## Anti-Pattern 6: Single-AZ Database for Production

### What It Looks Like

```hcl
resource "aws_db_instance" "primary" {
  multi_az = false  # single AZ
}
```

Team reasoning: "Multi-AZ doubles the cost, and our uptime has been fine."

### Why Teams Do It

Multi-AZ doubles RDS instance cost. The cost increase feels concrete; the risk of an AZ failure feels abstract.

### The Real Risk

AWS has real AZ-level outages. When an AZ experiences a hardware failure or power event, a single-AZ RDS instance becomes unavailable with no automatic failover. Recovery time: 15 minutes to 2+ hours depending on the underlying failure.

For a startup, a 2-hour database outage at peak traffic is:
- Lost revenue
- Customer churn
- Support tickets
- Potential SLA breach

### The Correct Pattern

- **All production databases: `multi_az = true`**. The standby replica is in a different AZ; automatic failover occurs in < 60 seconds.
- Development / staging: `multi_az = false` is fine (save the cost)
- Aurora PostgreSQL: Multi-AZ is inherent to Aurora's architecture — no separate flag needed; always use Aurora for production where budget allows

**Cost justification:** For a db.t4g.medium at ~$68/mo, multi-AZ adds ~$68/mo. If your app generates $10k/mo in revenue, one averted 2-hour outage (2% of a month's revenue = $200 loss) justifies the entire year of multi-AZ cost.

---

## Anti-Pattern 7: 0.0.0.0/0 Security Groups

### What It Looks Like

```hcl
resource "aws_security_group_rule" "rds_ingress" {
  cidr_blocks = ["0.0.0.0/0"]  # the entire internet
  from_port   = 5432
  to_port     = 5432
  protocol    = "tcp"
}
```

Or the all-ports variant:
```hcl
ingress {
  from_port   = 0
  to_port     = 65535
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}
```

### Why Teams Do It

It eliminates debugging. "I don't know which IP to allow, so I'll allow all of them and figure it out later." Later never comes.

### The Real Risk

For databases: any IP on the internet can attempt authentication. Automated scanners continuously probe AWS IP ranges for open PostgreSQL (5432), MySQL (3306), Redis (6379), and MongoDB (27017) ports. If credentials are weak or a CVE exists in the database version, this is a direct breach path.

For EC2 instances with 0.0.0.0/0 on all ports: full remote exploit surface area.

### The Correct Pattern

| Resource | Correct Source for Ingress |
|----------|--------------------------|
| RDS / Aurora | App tier security group ID only (`source_security_group_id`) |
| ElastiCache | App tier security group ID only |
| EC2 / ECS tasks | ALB security group ID only (for HTTP/S); no direct internet access |
| Admin ports (22, 3389) | **Remove entirely**; use SSM Session Manager instead |
| ALB | 0.0.0.0/0 on 443 (HTTPS) and 80 (redirect to HTTPS) only |

**Audit command to find all 0.0.0.0/0 ingress rules:**
```bash
aws ec2 describe-security-groups \
  --query "SecurityGroups[?IpPermissions[?IpRanges[?CidrIp=='0.0.0.0/0']]].{GroupId:GroupId,GroupName:GroupName}"
```

---

## Anti-Pattern 8: Manually Provisioned Infrastructure (No IaC)

### What It Looks Like

Infrastructure created by clicking through the AWS console. No Terraform, CDK, Pulumi, or any IaC. The production environment exists only in the cloud console; nobody can recreate it from code.

### Why Teams Do It

The console is faster to start with. IaC has a learning curve. "We'll add Terraform later."

### The Real Risk

| Risk | Consequence |
|------|-------------|
| Configuration drift | Console changes not tracked; after 6 months, nobody knows the authoritative state |
| No disaster recovery | If the account is compromised or a region has an outage, the environment cannot be recreated |
| No auditability | No history of who changed what and when |
| No review process | Console changes go live immediately with no code review or approval |
| Onboarding failure | New engineers cannot understand the infrastructure without clicking through every console screen |
| Scaling friction | Spinning up a new environment (staging, QA, new region) requires manually repeating every console step |

### The Correct Pattern

- All infrastructure in IaC from day one (Terraform is the standard choice; CDK if team is TypeScript-native)
- Terraform state in S3 + DynamoDB lock table (not local)
- Infrastructure changes via pull request with peer review
- CI plan (`terraform plan`) on PRs; CI apply on merge to main
- Import any console-created resources into Terraform immediately: `terraform import <resource_type>.<name> <cloud_id>`

**Minimum Terraform structure:**
```
terraform/
  main.tf          # provider config, backend config
  variables.tf     # all configurable inputs
  outputs.tf       # exported values (VPC ID, RDS endpoint, etc.)
  networking.tf    # VPC, subnets, security groups
  compute.tf       # ECS cluster, task definitions, services
  database.tf      # RDS instance, parameter group, subnet group
  storage.tf       # S3 buckets, ECR repos
```

---

## Anti-Pattern 9: No Monitoring or Alerting Before Launch

### What It Looks Like

App launches to production with no CloudWatch alarms, no error rate monitoring, no latency tracking, no on-call alerting. Engineers discover outages when users complain on Twitter.

### Why Teams Do It

Monitoring feels like "nice to have" before launch. There's always more feature work to do. Setting up Grafana/Datadog/CloudWatch feels like a 2-day project.

### The Real Risk

- Mean time to detect (MTTD) for incidents is hours instead of minutes
- Silent data corruption (app writes bad data with no errors, no alerts, discovered weeks later)
- Performance degradation discovered only by users, not by the team
- No baseline to compare against after changes ("is this deployment slower than before?")

### The Correct Pattern

**Minimum viable monitoring before first production deploy:**

| Signal | Minimum Alert | Tool |
|--------|--------------|------|
| Error rate | Alert if HTTP 5xx rate > 1% for 5 min | CloudWatch + ALB metrics (free) |
| Latency | Alert if p99 latency > 2× baseline for 5 min | CloudWatch + ALB metrics |
| Database connections | Alert if connections > 80% of `max_connections` | CloudWatch RDS metric |
| Database disk | Alert if free storage < 20% | CloudWatch RDS metric |
| CPU | Alert if avg CPU > 80% for 10 min | CloudWatch ECS/EC2 metric |
| Memory | Alert if memory usage > 85% | CloudWatch ECS metric |

All of the above are achievable in 2–3 hours using CloudWatch Alarms + SNS email notifications — no paid tool required.

**The "launch gate" rule:** No production launch without at least error rate + latency + disk alerting configured. These three alone will catch 80% of real incidents.

---

## Anti-Pattern 10: Over-Provisioning Dev/Staging to Match Prod

### What It Looks Like

Production runs `db.r6g.large` (multi-AZ, 2 read replicas). Staging runs the same configuration. Dev runs the same. Three identical environments = 3× the cost.

### Why Teams Do It

"We want staging to match prod exactly so we catch issues." This sounds reasonable; the implementation is wrong.

### The Real Risk

Not a risk of outage — a risk of wasted engineering budget. Dev/staging at prod specs costs 5–10× what it needs to cost. A $500/mo prod environment running at dev/staging parity costs $1,500/mo total when $300/mo would suffice.

### The Correct Pattern

| Environment | Right Spec | What to Match from Prod |
|-------------|-----------|------------------------|
| Development | Single-AZ, burstable instances (t4g.micro/small), no HA, auto-stop evenings/weekends | OS, framework version, same Postgres major version |
| Staging | Single-AZ, one tier below prod instance class, no read replicas, no multi-AZ | Same Docker image, same environment variable names, same RDS version |
| Production | Multi-AZ, right-sized, multi-replica compute, full observability | The full configuration |

**Concrete savings example:**
- Prod: RDS `db.r6g.large` multi-AZ ($300/mo) + ECS 4 tasks ($150/mo) = $450/mo
- Staging (correctly sized): RDS `db.t4g.medium` single-AZ ($68/mo) + ECS 1 task ($18/mo) = $86/mo
- Dev: RDS `db.t4g.micro` ($14/mo) + ECS 1 task ($9/mo) = $23/mo
- **Total with correct sizing: $559/mo vs $1,350/mo matched. Save $791/mo = $9,492/yr.**

**Auto-stop for dev:** Use AWS Instance Scheduler or a simple Lambda to stop dev/staging RDS and ECS services outside business hours. Saves ~70% on non-production environment compute.

---

## Anti-Pattern 11: Ignoring Data Transfer Costs in Architecture Decisions

### What It Looks Like

Architecture designed purely around compute and storage pricing. Data transfer costs are discovered when the AWS bill arrives.

Common high-cost patterns:
- Cross-AZ traffic between ECS tasks and RDS in different AZs ($0.01/GB each direction)
- Lambda in us-east-1 downloading model weights from S3 in us-west-2 on every cold start ($0.09/GB)
- NAT Gateway routing all S3 and ECR traffic from private subnets ($0.045/GB)
- Application logs shipped from ECS to CloudWatch in a different region
- API serving large responses (images, files) directly from EC2/ECS without CloudFront

### Why Teams Do It

Transfer costs are invisible during design. AWS pricing pages list compute and storage prominently; transfer costs are buried in footnotes.

### The Real Impact (Example)

A service processing 1 TB/day of cross-AZ traffic between two ECS services:
- 1 TB/day × 2 (bidirectional) × $0.01/GB = $20/day = **$600/mo in data transfer alone**
- This is pure waste; placing both services in the same AZ eliminates it

A Lambda function that downloads a 500 MB ML model from a cross-region S3 bucket on every cold start:
- 100 cold starts/day × 500 MB × $0.09/GB = $4.50/day = **$135/mo in egress costs**
- Solution: same-region S3 + EFS mount or container-baked model weights

### The Correct Pattern

| Scenario | Fix | Savings |
|----------|-----|---------|
| ECS and RDS in different AZs | Place ECS tasks in same AZ as primary RDS using AZ affinity | $0.01/GB × all DB traffic |
| S3 traffic through NAT Gateway | Add S3 VPC Gateway Endpoint (free) | $0.045/GB for all S3 traffic |
| ECR image pulls through NAT Gateway | Add ECR VPC Interface Endpoint (~$7/mo) | $0.045/GB for all image pulls |
| Large static file serving from ECS | Put CloudFront in front; serve from S3 | $0.09 → $0.009/GB (10× cheaper egress) |
| Cross-region data sync | Same region as primary app | Eliminate $0.09/GB cross-region transfer |

**Architecture rule:** Always ask "does this data flow cross an AZ boundary?" and "does this traffic flow through NAT Gateway?" before finalizing any component placement.

---

## Anti-Pattern 12: Not Enabling Versioning on Critical S3 Buckets

### What It Looks Like

```hcl
resource "aws_s3_bucket" "user_uploads" {
  bucket = "myapp-user-uploads"
  # No versioning block
}
```

### Why Teams Do It

Versioning is off by default and "the bucket works without it." The cost implication (versioning stores every version of every object) feels scary without understanding the actual storage overhead.

### The Real Risk

Without versioning:
- Accidental `DELETE` on any object = permanent, unrecoverable loss
- Application bug that overwrites objects with bad data = original data gone
- Ransomware that overwrites files = no clean version to restore
- Developer mistake in a data migration script = irreversible data loss

### The Correct Pattern

**Enable versioning on every bucket that contains data you did not intentionally generate:**

| Bucket Type | Enable Versioning? | Reason |
|------------|-------------------|--------|
| User uploads (images, documents) | **Yes** | User-generated content is irreplaceable |
| Application backups | **Yes** | Backup overwritten with corrupted file becomes the only backup |
| Configuration files | **Yes** | Accidental config overwrite should be reversible |
| Terraform state (S3 backend) | **Yes** | State corruption recovery requires previous state versions |
| Build artifacts / deployment packages | Optional | Reproducible from source; version is less critical |
| CDN static assets (versioned by filename) | Optional | Assets are versioned in filename convention (e.g., `app.v2.js`) |
| Log archives | No | Logs are append-only; versioning adds cost with no benefit |

**Cost management with versioning:**
Versioning can inflate storage costs if objects are frequently overwritten. Add a lifecycle rule to expire non-current versions:

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.user_uploads.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30  # delete previous versions after 30 days
    }

    noncurrent_version_transition {
      noncurrent_days = 7
      storage_class   = "GLACIER"  # move old versions to Glacier after 7 days
    }
  }
}
```

This gives you 30 days to recover from accidental deletes/overwrites while keeping storage costs minimal.
