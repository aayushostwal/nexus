---
name: nexus-infra-free-alternatives
description: >
  Use this skill when the user wants free, cheap, or open-source alternatives to paid cloud services.
  Trigger phrases include: "free alternative to Firebase", "I can't afford AWS RDS", "self-hosted
  option for Redis", "Supabase vs Firebase", "open source replacement for Datadog", "Render vs Heroku
  vs Railway", "how do I run this for under $20 a month", "free Postgres hosting", "OSS alternative
  to Auth0", "I want to self-host this", "cheap alternative to Vercel", "free S3 storage option",
  "free Heroku replacement", "what's a free tier option for my app", "PlanetScale alternative",
  "cheap monitoring tool instead of Datadog", "free Redis hosting", "self-hosted Stripe alternative".
  Also trigger when the user is designing infrastructure and explicitly asks for a budget-first,
  free-first, or self-hosted approach, or when they say they want to avoid a specific vendor.
  Expected output: service-by-service alternatives table with three tiers (Hobby/free, Startup
  $0–50/mo, Self-hosted production), rating per alternative on setup complexity and production
  readiness, and specific migration notes per service. When in doubt, use this skill.
---

# Free Infrastructure Alternatives

Map every paid service in the user's stack to the best free, cheap, or self-hosted replacement.

---

## Compatibility
- Required tools: WebSearch, WebFetch (to verify current free tier limits — they change frequently)
- Output: Alternatives table per service category + tier grouping + migration notes

---

## Workflow

### Step 1 — Identify the Paid Stack

Ask the user to list their current or intended paid services. If they share a codebase or existing infra, scan for:
- Cloud provider SDKs (`boto3`, `google-cloud-*`, `@azure/*`)
- SaaS service names in env vars, configs, or README (`FIREBASE_`, `DATADOG_API_KEY`, `HEROKU_`, `AUTH0_`)
- `package.json` or `requirements.txt` dependencies that imply paid services

Produce a "current stack" table before recommending alternatives:
```
| Category | Current Service | Est. Monthly Cost |
|----------|----------------|------------------|
| Hosting | Heroku Eco dynos | $7/mo |
| Database | Firebase Firestore | $25/mo (at current usage) |
| Auth | Auth0 Developer | $23/mo |
| Monitoring | Datadog | $15/mo |
```

If the user says "I haven't built yet, just want free options", skip to Step 3 and present the full catalog.

### Step 2 — Verify Free Tier Limits

Before recommending any service, do a quick WebSearch for `"{service name} free tier limits {current year}"` to confirm the current generous tier. Free tiers change frequently.

Key services to always verify:
- Supabase (free tier limits change quarterly)
- Neon (compute hours per month)
- Render (free tier spin-down behavior)
- Cloudflare Workers (requests/day limit)
- Railway (usage credit amount)

### Step 3 — Map to Alternatives

For each paid service, present alternatives using the full catalog below. Always show all three tiers.

---

#### HOSTING / PaaS (Heroku / Render paid / DigitalOcean App Platform)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Render** | Free | 750 hrs/mo, spins down after 15 min inactivity | $0 / $7 paid | Side projects, demos | Production (spin-down causes cold starts) |
| **Railway** | Hobby | $5 credit/mo (covers small apps) | ~$0–$5 | Fast deploys, great DX | Large persistent workloads |
| **Fly.io** | Free | 3 shared VMs, 160GB transfer | $0 / pay-as-you-go | Docker apps, global edge | Complex persistent volumes |
| **Coolify** | Self-hosted | Unlimited | Server cost only (~$6/mo on Hetzner) | Full control, multiple apps | Teams without DevOps basics |
| **Kamal** | Self-hosted | Unlimited | Server cost only | Rails / Docker apps, zero-downtime | Teams wanting managed infra |
| **Dokku** | Self-hosted | Unlimited | Server cost only | Heroku-like on your VPS | Teams wanting zero ops |

**Migration note from Heroku:** Procfile is compatible with Railway and Render. Buildpacks work on Heroku alternatives. For Coolify/Dokku, convert Procfile to a Dockerfile (1-day effort).

---

#### DATABASE — PostgreSQL (RDS / Cloud SQL / PlanetScale paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Neon** | Free | 0.5 GB storage, 190 compute hrs/mo, autoscales to 0 | $0 / $19 paid | Serverless apps, low-traffic | High-frequency connections (connection pooling needed) |
| **Supabase** | Free | 500MB DB, 2 projects, paused after 1 week inactivity | $0 / $25 paid | Full-stack apps (auth + DB + storage) | Mission-critical production (free tier pauses) |
| **Aiven** | Free trial | 30-day trial only | $19+/mo after trial | Managed Postgres, Kafka, Redis combo | Long-term free use |
| **ElephantSQL** | Free (Tiny Turtle) | 20MB, 5 simultaneous connections | $0 | Tiny prototypes only | Anything serious |
| **Self-hosted on Hetzner** | VPS | Unlimited | €3.29–€5/mo (Hetzner CX11) | Full control, production scale | Teams without Postgres ops knowledge |

**Migration note from RDS:** `pg_dump` → `pg_restore` works for all Postgres hosts. Connection string format is identical. For Neon/Supabase, add connection pooling (Supabase Pooler or PgBouncer) if app uses many concurrent connections.

---

#### DATABASE — Firebase Firestore / Realtime Database

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Supabase** | Free | 500MB Postgres, Realtime, Storage 1GB | $0 / $25 | Full Firebase replacement (auth + DB + realtime + storage) | Direct Firestore SDK compatibility (requires code rewrite) |
| **Appwrite** | Free (self-hosted) | Unlimited (self-hosted) | Server cost only | Firebase-like API, self-hosted | Managed cloud preference |
| **PocketBase** | Self-hosted | Unlimited | Server cost only | Single binary, embedded SQLite + auth + realtime | Large multi-team projects |

**Migration note from Firebase:** Firebase SDK is not compatible with Supabase — rewrite data access layer (1–2 weeks for medium apps). Auth migration: export users from Firebase Auth, import to Supabase Auth (script provided in Supabase docs). Realtime: Firebase `onSnapshot` → Supabase `channel().on('postgres_changes', ...)`.

---

#### DATABASE — MySQL / PlanetScale

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **PlanetScale** | Free | 5GB storage, 1B row reads/mo (verify current limits) | $0 / $29 | Serverless MySQL, branching workflow | Foreign keys (PlanetScale disables them) |
| **Turso** | Free | 500 DBs, 9GB storage, SQLite-compatible | $0 / $29 | Edge-deployed apps, SQLite at scale | Complex joins across large datasets |
| **Self-hosted MySQL on VPS** | VPS | Unlimited | €3–5/mo | Full control | Teams without DB ops knowledge |

---

#### CACHE — Redis (ElastiCache / Redis Cloud paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Upstash Redis** | Free | 10k commands/day, 256MB | $0 / pay-per-use | Serverless apps, edge caching, low-command-rate use | High-frequency (>10k/day free) |
| **Momento Cache** | Free | 5GB transfer/mo, 50GB storage | $0 | Serverless cache, no connection management | Persistent pub/sub workflows |
| **Valkey (OSS)** | Self-hosted | Unlimited | Server cost only | Redis replacement, same protocol | Teams wanting managed infra |
| **Self-hosted Redis on VPS** | VPS | Unlimited | €3–5/mo | Full Redis compatibility | Teams wanting zero ops |

**Migration note from ElastiCache:** Upstash is fully Redis-compatible. Change only the connection string. For self-hosted, run `redis-server` via Docker — `ioredis` / `redis-py` connects identically.

---

#### OBJECT STORAGE — S3 (AWS S3 / Google Cloud Storage paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Cloudflare R2** | Free | 10GB storage, 1M Class A ops/mo, **no egress fees** | $0 / $0.015/GB-mo | Large file storage, no egress cost | Requiring native S3 presigned URLs (R2 has own API) |
| **Backblaze B2** | Free | 10GB storage, 1GB/day download | $0 / $0.006/GB-mo | Cold storage, backups, large files | Low-latency CDN delivery |
| **MinIO** | Self-hosted | Unlimited | Server cost only | S3-compatible, on-prem, private cloud | Teams without infra ops |
| **Supabase Storage** | Free tier | 1GB on free plan | $0 / included in $25 plan | Tightly integrated with Supabase DB + auth | Standalone object storage at scale |

**Migration note from S3:** Cloudflare R2 is S3-compatible — change endpoint URL in `boto3` / `@aws-sdk/client-s3` config. `boto3` example: add `endpoint_url="https://<account_id>.r2.cloudflarestorage.com"`. MinIO: identical S3 API, run via Docker.

---

#### AUTH (Auth0 / Cognito / Firebase Auth paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Supabase Auth** | Free | 50k MAU, MFA, OAuth, magic link | $0 / $25 | Postgres-integrated auth, social login | Enterprise SSO / SAML (paid feature) |
| **Clerk** | Free | 10k MAU, all features | $0 / $25 | Next.js / React apps, pre-built UI components | Non-JS backends (SDK is JS-first) |
| **Lucia** (library) | Free | Unlimited (self-managed) | $0 | Full control, any framework, no vendor lock-in | Teams wanting managed service |
| **Auth.js / NextAuth** | Free | Unlimited (self-managed) | $0 | Next.js apps, 50+ OAuth providers | Non-Next.js apps (requires adapter work) |
| **Keycloak** | Self-hosted | Unlimited | Server cost only | Enterprise SSO, SAML, OIDC, LDAP | Teams wanting zero ops |
| **Zitadel** | Free (self-hosted) | Unlimited | $0 self-hosted / SaaS pricing | Modern Auth0 replacement, OIDC | Very small teams (complex setup) |

**Migration note from Auth0:** JWT tokens are compatible at the verification layer — change JWKS endpoint URL. User migration: export from Auth0 Management API, import to new provider. Social OAuth credentials (Google, GitHub) reuse the same app credentials.

---

#### OBSERVABILITY / MONITORING (Datadog / New Relic / CloudWatch paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Grafana Cloud** | Free | 10k metrics, 50GB logs, 50GB traces | $0 / pay-as-you-go | Full stack: metrics + logs + traces | Teams without Prometheus experience |
| **Better Stack (Logtail)** | Free | 1GB logs/mo, 3-day retention | $0 / $24 | Simple log aggregation, fast search | Large log volumes |
| **Axiom** | Free | 500GB/mo ingest, 30-day retention | $0 / $25 | High-volume structured logs | Real-time metrics (log-first tool) |
| **Signoz** | Self-hosted | Unlimited | Server cost only | OpenTelemetry-native, metrics + traces + logs | Teams wanting zero ops |
| **Self-hosted Grafana + Prometheus + Loki** | Self-hosted | Unlimited | Server cost only + setup time | Complete OSS observability stack | Teams with no Prometheus experience |
| **OpenObserve** | Self-hosted | Unlimited | Server cost only | 140× cheaper than Elasticsearch for logs | Complex query requirements |

**Migration note from Datadog:** Export dashboards as JSON, recreate in Grafana (most panel types map 1:1). Replace Datadog agent with OpenTelemetry collector — same metrics, cloud-agnostic. Alerts: migrate from Datadog monitors to Alertmanager or Grafana alerting.

---

#### CDN / EDGE (CloudFront / Fastly / Vercel paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Cloudflare** | Free | Unlimited bandwidth on CDN, WAF, 100k Worker req/day, R2 10GB | $0 / $20 Pro | Full edge stack: CDN + WAF + Workers + R2 + D1 | Custom certificates on free plan |
| **Vercel** | Free | 100GB bandwidth, 100k function invocations | $0 / $20 | Next.js, React, static sites | Non-frontend workloads |
| **Netlify** | Free | 100GB bandwidth, 125k function invocations | $0 / $19 | Jamstack, static + serverless functions | Full backend apps |
| **Bunny.net** | Pay-as-you-go | No free tier | $0.005/GB (very cheap) | High-volume video/file delivery | Serverless compute at edge |

---

#### QUEUES / BACKGROUND JOBS (SQS paid / Celery + Redis)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Inngest** | Free | 50k function runs/mo | $0 / $50 | Event-driven jobs, retries, fan-out, TypeScript/Python | High-volume (50k/mo limit on free) |
| **Trigger.dev** | Free | 5k runs/mo, open source | $0 / $20 | Background jobs with observability, TypeScript-native | Non-TypeScript stacks |
| **BullMQ + Upstash Redis** | Free | Upstash free tier | $0 | Node.js job queues, Redis-backed | Python backends (BullMQ is Node-only) |
| **Celery + Redis (self-hosted)** | Self-hosted | Unlimited | Server cost only | Python apps, mature, battle-tested | Real-time job monitoring without Flower |

---

#### SEARCH (Algolia / Elasticsearch paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Typesense Cloud** | Free | 3 nodes, 100k docs | $0 / pay-as-you-go | Fast full-text search, easy ops | Complex aggregation queries |
| **Meilisearch** | Self-hosted | Unlimited | Server cost only | Developer-friendly, typo-tolerant, fast | Petabyte-scale (resource intensive) |
| **Typesense** | Self-hosted | Unlimited | Server cost only | Same as cloud but fully controlled | Teams wanting zero ops |

---

#### EMAIL (SendGrid / Mailgun / SES paid)

| Service | Tier | Free Limit | Monthly Cost | Best For | Avoid If |
|---------|------|-----------|-------------|----------|----------|
| **Resend** | Free | 3k emails/mo, 1 domain | $0 / $20 | Modern API, developer-friendly, React Email | High-volume transactional |
| **Brevo (ex-Sendinblue)** | Free | 300 emails/day | $0 / $25 | Marketing + transactional combo | Deliverability-critical at scale |
| **Mailpit** | Self-hosted | Unlimited (dev only) | $0 | Local dev email testing | Production sending |

---

### Step 4 — Group by Tier

After mapping, present a tier summary:

```
## Tier Summary

### 🆓 Hobby Stack (Free Forever, ~$0/mo)
Best for: side projects, MVPs, demos
- Hosting: Render free tier (accepts spin-down)
- Database: Neon free tier (0.5GB)
- Auth: Supabase Auth free tier
- Storage: Cloudflare R2 free tier
- Cache: Upstash Redis free tier
- Monitoring: Better Stack free tier
- CDN: Cloudflare free tier
⚠️ Limitations: spin-down cold starts, storage/compute caps, no SLA

### 💰 Startup Stack ($20–60/mo, production-viable)
Best for: small production apps, startups, solo devs
- Hosting: Render Starter ($7) or Railway ($5–20) or Fly.io (~$5)
- Database: Neon Launch ($19) or Supabase Pro ($25)
- Auth: Clerk free tier or Supabase Auth
- Storage: Cloudflare R2 ($0 at small scale)
- Cache: Upstash Redis pay-per-use (~$2–5)
- Monitoring: Grafana Cloud free tier
Total: ~$30–55/mo

### 🏗️ Self-Hosted Production Stack (Server cost only, ~$15–30/mo)
Best for: teams with DevOps basics wanting full control and no vendor limits
- Hosting: Coolify on Hetzner CX21 (€5.77/mo, unlimited apps)
- Database: PostgreSQL via Coolify on same or dedicated server
- Auth: Keycloak or Zitadel via Coolify
- Storage: MinIO on Hetzner Volume ($0.04/GB-mo)
- Cache: Valkey (Redis OSS fork) via Docker
- Monitoring: Grafana + Prometheus + Loki stack
- Queue: BullMQ + Valkey or Celery + Valkey
Total: ~$15–30/mo (server) with unlimited scale ceiling
```

### Step 5 — Migration Notes

For each service the user is migrating from, provide a specific migration note:

Format:
```
### Migrating from [Paid Service] → [Free Alternative]
- API compatibility: [Compatible / Partial / Rewrite required]
- Effort: [hours/days]
- Data migration: [exact command or tool]
- Code changes: [specific files/lines to change]
- Risk: [what can go wrong]
```

---

## Output Format

```
## Free Alternatives: {Project Name}

### Current Paid Stack
| Category | Current Service | Est. Monthly Cost |
...
**Total current spend: ~$XX/mo**

### Alternatives Map
[Per-category alternative tables]

### Recommended Stack by Tier
**🆓 Hobby ($0/mo):** [service list]
**💰 Startup ($XX/mo):** [service list]
**🏗️ Self-Hosted ($XX/mo):** [service list]

### Migration Notes
[Per-service migration notes]

### Estimated Savings
Current: $XX/mo → Free tier: $0/mo | Startup stack: $XX/mo | Self-hosted: $XX/mo
```

---

## Anti-Patterns
- Never recommend a free tier without verifying its current limits via WebSearch — they change quarterly.
- Never recommend self-hosting to a team that has said they have no DevOps experience — ops burden is a real cost.
- Never present only one alternative per service — always show at least the free-tier, startup, and self-hosted options.
- Never ignore migration effort — a "free" tool that takes 3 weeks to migrate to is not free.
- Never recommend Render free tier for production — the 15-minute spin-down causes real user-facing latency.
- Never say "just use Supabase" for everything — match the tool to the actual workload pattern.

---

## Examples

**Input:** "I'm paying $150/mo for Heroku + Firebase + Auth0 + Datadog. Show me free alternatives."

**Step 1 stack:**
| Category | Current | Cost |
|----------|---------|------|
| Hosting | Heroku Standard-2X dyno | $50/mo |
| Database | Firebase Firestore | $25/mo |
| Auth | Auth0 Developer | $23/mo |
| Monitoring | Datadog | $15/mo |
| Storage | Firebase Storage | $5/mo |
| **Total** | | **$118/mo** |

**Step 4 recommendation:**

🆓 Free tier: Render + Supabase + Supabase Auth + Grafana Cloud + Cloudflare R2 = **$0/mo**
(Limitations: Render spin-down on free tier, Supabase project pauses after 1 week inactivity)

💰 Startup: Render Starter + Supabase Pro + Supabase Auth + Grafana Cloud + Cloudflare R2 = **$32/mo**
(No limitations, production-viable, saves $86/mo vs current)

🏗️ Self-hosted on Hetzner: Coolify + PostgreSQL + Keycloak + Grafana stack + MinIO = **~$18/mo**
(Full control, unlimited scale, requires 1 day setup)

**Migration notes:**
- Heroku → Render: `Procfile` compatible, add `render.yaml` (2 hrs)
- Firebase → Supabase: Auth export + data migration script (1–2 weeks)
- Auth0 → Supabase Auth: JWKS endpoint change + user export (3 days)
- Datadog → Grafana Cloud: Replace Datadog agent with OTEL collector (1 day)

---

## Free Alternatives Specialization

**For ML / AI apps:**
- Inference: Hugging Face Inference Endpoints (free tier), Groq (free tier, fast inference), Together AI (free $25 credit), Replicate (free tier)
- GPU compute: Vast.ai (spot GPUs ~$0.20/hr vs $3+/hr AWS), RunPod, Lambda Labs
- Vector DB: Qdrant (self-hosted free), Chroma (self-hosted free), Weaviate Cloud (free tier 1GB)

**For real-time / WebSocket apps:**
- Soketi: self-hosted Pusher-compatible server (drop-in replacement for Pusher/Ably)
- Supabase Realtime: free tier covers most small apps
- Liveblocks: free tier 100 MAU for collaborative apps

**For CI/CD:**
- GitHub Actions: 2,000 min/mo free on public repos (unlimited), 2,000 min/mo on private
- Woodpecker CI: self-hosted, Gitea/GitHub compatible, zero cost on own server
- Forgejo + Woodpecker: fully self-hosted GitHub + CI alternative
