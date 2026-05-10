# Cloud Architecture Heuristics

Practical rules of thumb for making fast, accurate architecture decisions. Each heuristic is a pattern distilled from real production systems. Apply them as defaults; override only with explicit evidence.

---

## Team Size → Complexity Level

The single most reliable predictor of the right infrastructure complexity is team size and operational maturity. Use this table as the starting constraint before any service selection.

| Team Size | Ops Maturity | Right Complexity Level | Compute | Database | Avoid |
|-----------|-------------|----------------------|---------|----------|-------|
| 1–3 devs | No DevOps | Managed PaaS | Railway / Render / Fly.io | Managed Postgres (Neon / Supabase / Railway) | Kubernetes, EKS, self-managed anything |
| 3–5 devs | Some Docker experience | Managed containers | ECS Fargate, App Runner, Cloud Run | RDS t4g, Aurora | EKS, complex service mesh |
| 5–10 devs | Docker + CI/CD experience | Managed containers with IaC | ECS Fargate + Terraform | RDS Aurora Multi-AZ | Self-managed Kubernetes |
| 10–20 devs | 1+ dedicated DevOps | ECS or EKS (if K8s expertise exists) | ECS Fargate or EKS with managed node groups | Aurora + read replicas | Self-managed etcd, bare-metal K8s |
| 20+ devs | Dedicated SRE team | EKS / GKE with full observability stack | EKS with Karpenter auto-scaling | Aurora / AlloyDB / custom sharding | On-Demand pricing for compute |

**The core rule:** Match operational complexity to operational capacity. A 3-person startup running Kubernetes is one PagerDuty alert away from a 2am incident nobody can debug. A team that never operated K8s in production should not be starting with it in production.

---

## When Managed Services Beat Self-Hosted

The decision to use a managed service vs. self-host is primarily an operational burden vs. cost trade-off. Use this framework:

### Managed Services Win When:

| Condition | Reason |
|-----------|--------|
| Team size < 10 and no dedicated ops | Ops burden of self-managed DB/Redis/queue = effectively a part-time engineering role |
| Uptime SLA > 99.9% required | Managed services handle hardware failure, OS patching, failover automatically |
| Compliance (HIPAA / SOC2 / PCI) required | Managed services provide compliance-ready configurations and audit trails |
| Database size < 100 GB | At small scale, managed service overhead is minimal relative to ops burden saved |
| Multiple services needed (DB + cache + queue) | Each self-hosted service multiplies the ops burden |
| Team has no on-call rotation | Managed services handle 3am hardware failures without waking anyone up |

### Self-Hosted Wins When:

| Condition | Reason |
|-----------|--------|
| Data volume > 10 TB | Managed service costs scale linearly with data; self-hosted on dedicated hardware wins |
| Very high IOPS requirements | Managed tiers cap IOPS; self-hosted with NVMe gets full hardware throughput |
| Need to run on non-standard hardware | GPUs, high-memory instances, custom CPU flags not available in managed offerings |
| Team has a dedicated DBA or SRE | Operational burden is already being paid for; cost savings from self-hosting are real |
| Budget is severely constrained and team has DevOps skills | A €5/mo Hetzner VPS with PostgreSQL outcompetes $20+/mo managed DB |
| Air-gapped or on-premise requirement | No managed cloud option exists for air-gapped environments |

**The break-even point for managed vs. self-hosted PostgreSQL:** At < 50 GB data and < 5 vCPU equivalent workload, Neon/Supabase/Railway Postgres at $10–25/mo beats self-hosting when team hourly rate is factored in. Self-hosting a €5/mo VPS costs the team ~4 hours/month in maintenance = $200–400 in real engineering time.

---

## Storage Tier Selection

Use this decision tree to select the right storage service for each use case.

### The Decision Rules

```
Data Access Pattern → Service
────────────────────────────────────────────────────────────────────────
Structured relational data, joins, ACID transactions?
  → PostgreSQL (RDS / Aurora / Neon / Supabase)
  → Never use DynamoDB for relational data with complex queries

Unstructured blobs, files, images, backups, static assets?
  → S3 / Cloudflare R2 / GCS
  → Never store binary files in PostgreSQL (BYTEA) unless < 100 KB

Low-latency key-value caching, session storage, pub/sub?
  → Redis / Valkey / ElastiCache / Upstash
  → Never use Redis as a primary database (no durability guarantees without AOF/RDB config)

Massive scale, single-key lookups, no complex queries, serverless traffic pattern?
  → DynamoDB / Cloud Spanner / Cassandra
  → Only if your access pattern truly never needs joins or complex WHERE clauses

Time-series data (metrics, events, sensor readings)?
  → InfluxDB / TimescaleDB (Postgres extension) / Amazon Timestream
  → Regular Postgres with a time-indexed table works fine for < 1M events/day

Full-text search?
  → Postgres FTS (fine for < 1M docs) → Typesense / Meilisearch → Elasticsearch/OpenSearch
  → Never add Elasticsearch for search until Postgres FTS is genuinely insufficient

Vector / embedding search (ML / RAG applications)?
  → pgvector on Postgres (fine for < 1M vectors) → Qdrant / Weaviate / Pinecone
  → Start with pgvector; migrate when recall quality or latency degrades under load
```

### Storage Tier Cost vs. Access Pattern

| S3 Storage Class | Best For | Access Latency | Cost (approx, us-east-1) |
|-----------------|---------|---------------|--------------------------|
| S3 Standard | Frequently accessed files | Milliseconds | $0.023/GB-mo |
| S3 Intelligent-Tiering | Unknown access pattern | Milliseconds | $0.023/GB-mo + monitoring fee |
| S3 Standard-IA | Infrequent access (< 1/mo) | Milliseconds | $0.0125/GB-mo |
| S3 Glacier Instant Retrieval | Archives, accessed occasionally | Milliseconds | $0.004/GB-mo |
| S3 Glacier Flexible Retrieval | Long-term backups | Minutes to hours | $0.0036/GB-mo |
| S3 Glacier Deep Archive | Compliance archives, 7+ yr retention | Hours | $0.00099/GB-mo |

**Default lifecycle rule for user upload buckets:**
- Day 0: S3 Standard
- Day 30: Transition to S3 Standard-IA
- Day 90: Transition to S3 Glacier Instant Retrieval
- Day 365: Transition to S3 Glacier Deep Archive

This alone reduces storage costs by ~85% for data older than 1 year.

---

## The Serverless Trap: When Lambda Costs More Than Reserved EC2

Lambda appears free at low volumes, but the cost model inverts at sustained high traffic.

### Lambda Cost Model
- $0.20 per 1 million requests
- $0.0000166667 per GB-second of compute time

### When Lambda Beats EC2/ECS

Lambda wins decisively when:
- Traffic is unpredictable or spiky (idle time with Lambda = $0; idle EC2 = full instance cost)
- Baseline requests/sec < 10 (EC2 t4g.small is $12/mo; Lambda at 10 req/s × 200ms × 128MB = ~$2/mo)
- Functions are short-lived (< 15 min) and stateless
- Cold starts are acceptable (< 1% of users see them, or traffic is non-interactive)

### When Lambda Becomes More Expensive Than EC2

**Example calculation:**

| Scenario | Lambda Cost | ECS Fargate (0.25 vCPU / 0.5 GB) | Winner |
|----------|------------|----------------------------------|--------|
| 100k req/day, 200ms avg, 256MB | ~$30/mo | ~$18/mo | ECS Fargate |
| 500k req/day, 300ms avg, 512MB | ~$220/mo | ~$30/mo (2 tasks) | ECS Fargate by 7× |
| 1M req/day, 100ms avg, 128MB | ~$120/mo | ~$18/mo | ECS Fargate by 6× |
| 10k req/day, 500ms avg, 512MB | ~$25/mo | ~$18/mo | ECS Fargate |
| 1k req/day, 200ms avg, 128MB | ~$1/mo | ~$18/mo | Lambda |

**The crossover point:** At sustained > ~50k requests/day with > 200ms average execution, ECS Fargate with 1–2 tasks almost always wins on cost. The break-even is:

```
requests_per_day × avg_execution_ms × memory_GB × 0.0000000167 × 30
vs.
(fargate_vcpu_hrs × $0.04048) + (fargate_gb_hrs × $0.004445)
```

**The "serverless trap" in practice:** Teams build Lambda because it sounds simple and free. At 200k requests/day the AWS bill arrives and Lambda is $400+/mo. The same load on 2 ECS Fargate tasks (0.5 vCPU / 1 GB) costs $35/mo. Migration is painful because the Lambda code is coupled to the handler pattern.

**Rule:** If you can predict your request volume will exceed 50k/day within 6 months, design for ECS Fargate from day one. Use Lambda for event-driven async processing (S3 events, SQS triggers, scheduled jobs), not for your primary HTTP API.

---

## Compute Sizing: Start Smaller Than You Think

**The core heuristic:** Start at 50% of your estimated need. Scale up after you have real data.

Why this works:
- Load testing overestimates peak by 2–3× because it doesn't model cache hit rates or connection reuse
- Real production traffic has diurnal patterns — peak is usually 3–5× average, not sustained 24/7
- Scaling up a running ECS task / RDS instance takes 5–10 minutes; there is no irreversible penalty for starting small

### Sizing Rules by Component

| Component | Starting Point | Scale Signal | Scale Action |
|-----------|--------------|-------------|-------------|
| API compute (ECS) | 0.25 vCPU / 0.5 GB per task, 2 tasks | CPU avg > 60% sustained for 5 min | Double vCPU; add replicas via auto-scaling |
| Database (RDS) | db.t4g.micro for dev, db.t4g.medium for prod | CPU avg > 40% or disk > 60% | Upgrade instance class (10-min maintenance window) |
| Database connections | Connection pool = (vCPU count × 10) | Connection wait time > 5ms p95 | Add PgBouncer or RDS Proxy |
| Redis / cache | 256 MB to start | Memory usage > 70% | Upgrade cache node |
| Background workers | 1 worker with 0.25 vCPU / 0.5 GB | Queue depth > 1000 sustained | Add worker replicas |

**Anti-pattern:** Sizing to 10× expected load "just in case." A startup that sizes for 1M req/day from day one wastes $2,000+/mo for months. Scaling cloud infrastructure is fast — waste is permanent.

---

## Single Point of Failure Identification Rules

A single point of failure (SPOF) is any component whose failure causes full system outage. Identify SPOFs by walking through this checklist:

| Component | SPOF Condition | Mitigation |
|-----------|---------------|-----------|
| Compute | min_count = 1 for any service | Set min_count = 2; deploy across 2 AZs |
| Database | `multi_az = false` on RDS; no replica | Enable multi_az; Aurora has multi-AZ built in |
| Cache | Single cache node with no fallback | Add replica node; app must handle cache miss gracefully (fall through to DB) |
| Load balancer | Single ALB node | ALB is multi-AZ by default (AWS manages this); SPOF only if your VPC has one subnet |
| NAT Gateway | Single NAT Gateway for multiple AZs | One NAT Gateway per AZ (costs more but eliminates cross-AZ SPOF) |
| DNS | Single hosted zone with no health-check routing | Add Route53 health checks + failover routing policy |
| External API dependency | No circuit breaker | Implement timeout + retry + circuit breaker; degrade gracefully |
| Secrets Manager | App fails on cold start if Secrets Manager is down | Cache secrets in memory after first successful fetch; log warning on cache use |
| CI/CD | Manual deploy step | Automate fully; document manual deploy runbook for emergency |

**The SPOF audit question:** "If this exact component fails at 2am with no human available, does the system self-recover within 5 minutes?"

- Yes → not a meaningful SPOF
- No → it is a SPOF; mitigate it

---

## The Blast Radius Rule for Security Groups and IAM

**Principle:** The blast radius of a security breach or misconfiguration should be the smallest possible scope.

### Security Group Blast Radius Rules

| Rule | Good | Bad |
|------|------|-----|
| Source of DB ingress | App tier security group ID | 0.0.0.0/0 or /16 CIDR |
| SSH / admin access | SSM Session Manager (no SG rule needed) | 0.0.0.0/0 on port 22 |
| Lambda → RDS | VPC-attached Lambda SG → RDS SG | Lambda in public subnet with internet access to RDS |
| Service-to-service | Each service has its own SG; only peer SG as source | Shared security group across all services |
| Egress from DB | Restrict to no egress (databases don't initiate outbound connections) | 0.0.0.0/0 egress on DB SG |

### IAM Blast Radius Rules

| Rule | Good | Bad |
|------|------|-----|
| Per-service permissions | Each ECS task role has only its own S3 bucket + Secrets | One shared role with full S3 and Secrets Manager access |
| Action scope | `s3:GetObject` on `arn:aws:s3:::my-bucket/*` | `s3:*` on `*` |
| Cross-account access | Explicit external ID in assume-role; scoped to one account | No condition keys on cross-account trust |
| CI/CD deploy role | Deploy-only permissions (ECS UpdateService, ECR push) | Admin permissions |
| Developer access | Read-only in prod; write in dev/staging | Full Admin in production |

**Practical blast radius test:** For every IAM policy you write, ask "if these credentials leaked, what is the worst-case damage?" If the answer includes "delete all S3 data" or "create IAM users" — the policy is too permissive.

---

## Cost Hotspots: The Top AWS Cost Surprises

These are the services that appear on AWS bills and cause "I had no idea we were paying for this" moments. Check these first in any cost review.

| Cost Hotspot | Why It Surprises | Typical Overspend | Prevention |
|-------------|----------------|------------------|-----------|
| **NAT Gateway** | Charged per GB of traffic passing through; teams route all S3 / ECR / DynamoDB traffic through NAT | $50–500+/mo at scale | Use VPC Gateway Endpoints (free) for S3 and DynamoDB; VPC Interface Endpoints for ECR |
| **Data transfer** | Cross-AZ transfer is $0.01/GB; internet egress is $0.09/GB | $100–1000+/mo at scale | Keep compute and database in the same AZ where possible; use CloudFront to reduce origin egress |
| **Unattached EBS volumes** | EBS volumes persist after EC2 termination unless explicitly deleted | $0.08–0.10/GB-mo accumulates | Enable AWS Config rule `ec2-volume-inuse-check`; tag and audit monthly |
| **Idle Elastic IPs** | AWS charges $0.005/hr for any EIP not associated with a running instance | $3.60/IP/mo — adds up across dev/staging | Release EIPs when terminating instances; use automation (Lambda cleanup function) |
| **CloudWatch Log Groups** | Default retention is "Never expire"; every log line costs $0.50/GB ingested | $100+/mo for verbose apps | Set retention to 30–90 days on all log groups; filter verbose debug logs before shipping |
| **RDS storage auto-scaling** | RDS storage auto-scales up but never scales down | Storage cost permanently elevated | Monitor actual storage usage; provision conservatively; use Aurora for true auto-scaling |
| **ECR image storage** | Every Docker build layer stored indefinitely without lifecycle policy | $10–50/mo accumulates | Set ECR lifecycle policy: keep last 10 images, expire untagged after 1 day |
| **ALB idle cost** | ALB charges $0.018/hr even at zero traffic | $13/mo for a dev/staging ALB sitting idle overnight | Use Route53 direct-to-ECS or a single shared ALB with path-based routing for dev environments |
| **Lambda duration with large memory** | Lambda pricing is memory × time; 3 GB × 15 min timeout burns money fast | Runaway cost if function hangs | Set appropriate timeout; use Lambda Power Tuning to find optimal memory config |
| **KMS API calls** | Encrypting/decrypting in tight loops generates KMS API call costs | $0.03/10k API calls; can reach $50+/mo | Cache decrypted secrets; batch decrypt operations; use envelope encryption |

---

## When CDN is Required vs. Optional

| Condition | CDN Status | Reason |
|-----------|-----------|--------|
| Serving static assets (JS, CSS, images) to global users | **Required** | Without CDN, every request crosses the Atlantic / Pacific from your single-region origin; 500–2000ms latency for distant users |
| API responses that are not cacheable (user-specific, real-time) | Optional | CDN passthrough adds ~5–20ms latency; worth it only for DDoS protection / WAF, not caching |
| User uploads served directly to end users | **Required** | S3 origin egress costs $0.09/GB; CloudFront egress costs $0.009/GB (10× cheaper) |
| Single-region app, users all in same region | Optional | CloudFront still helps with DDoS/WAF and caching; evaluate $0 Cloudflare free tier |
| SLA requires 99.95%+ availability | **Required** | CDN provides edge-level availability independent of origin health; most CDNs are 99.99% SLA |
| App handles payment/auth flows | **Required** | WAF rules at CDN layer block credential stuffing, OWASP Top 10, before traffic reaches origin |

**Default recommendation:** Put Cloudflare in front of everything — even if just for the free WAF, DDoS protection, and DNS. The free tier provides genuine value with zero configuration overhead.

---

## Database Connection Pooling Rules

Unmanaged database connections are one of the top causes of PostgreSQL crashes under load.

### PostgreSQL Connection Limits by Instance

| RDS Instance | max_connections (default) | Recommended pool size | When to add PgBouncer |
|-------------|--------------------------|----------------------|-----------------------|
| db.t4g.micro (1 GB RAM) | ~87 | 10–20 | If > 3 app instances connecting |
| db.t4g.small (2 GB RAM) | ~190 | 25–40 | If > 5 app instances |
| db.t4g.medium (4 GB RAM) | ~415 | 50–80 | If > 10 app instances |
| db.t4g.large (8 GB RAM) | ~855 | 100–150 | If > 20 app instances |
| db.r6g.large (16 GB RAM) | ~1720 | 200–300 | If > 40 app instances |

**Rule: Add PgBouncer (or RDS Proxy) when the total number of connections across all app instances exceeds 50% of `max_connections`.**

Calculation:
```
total_connections = app_replicas × pool_size_per_replica
if total_connections > 0.5 × max_connections → add connection pooler
```

### PgBouncer Configuration Rules

| Parameter | Development | Production |
|-----------|------------|-----------|
| `pool_mode` | session | transaction (for stateless apps) |
| `max_client_conn` | 100 | 1000 |
| `default_pool_size` | 10 | 25 |
| `reserve_pool_size` | 5 | 10 |
| `server_idle_timeout` | 600s | 300s |

**Transaction pool mode caveat:** Some PostgreSQL features don't work in transaction mode — specifically: prepared statements, advisory locks, `SET` commands that persist across queries. Test thoroughly before switching to transaction mode in production.

### RDS Proxy vs. PgBouncer

| Factor | RDS Proxy | PgBouncer |
|--------|-----------|-----------|
| Setup | Zero (managed, one-click) | Requires dedicated instance or ECS sidecar |
| Cost | ~$0.015/vCPU-hr of protected DB + $0.015/GB proxy | Instance cost (~$10–15/mo for t4g.small) |
| Failover behavior | Preserves connections through RDS failover | Drops connections on failover |
| IAM auth support | Yes (native) | No |
| Best for | Lambda → RDS (no persistent connections); compliance requiring IAM auth | ECS / EC2 apps with stable connection pools |

**Use RDS Proxy for Lambda functions connecting to RDS.** Lambda creates a new connection on every cold start; without a proxy, 100 concurrent Lambda invocations = 100 new DB connections = instant `max_connections` exhaustion.
