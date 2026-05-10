# Exploring — Production Scenarios

Two complete exploration examples showing the full Nexus Exploring Protocol output for real technology decisions.

---

## Scenario 1 — Async Task Queue for FastAPI: Celery vs ARQ vs RQ

**Input:** "We're building a FastAPI app (Python, async, team of 3, ~500 background jobs/day) and need to add a task queue. Not sure whether to use Celery, ARQ, or RQ — or something else."

---

**Step 1 goal:** *"Add async background task processing to a FastAPI service (Python 3.11, async-first, small team, ~500 jobs/day, Redis already in stack)."*

**Searches run:**
- `"fastapi background job queue python 2024"`
- `"celery vs arq vs rq fastapi async comparison"`
- `"fastapi task queue site:reddit.com OR site:news.ycombinator.com"`

**Fetched:**
- https://arq-docs.helpmanual.io/ — confirmed ARQ v0.25.0, Jan 2024 release
- https://docs.celeryq.dev/en/stable/ — confirmed Celery 5.3.6, Feb 2024 release

---

### Output

```
## Exploring: Add async background task processing to FastAPI app

### Options

| Option | Stars | Last Release | Complexity | Best For | Avoid If |
|--------|-------|--------------|------------|----------|----------|
| Celery | 24k | 2024-02 (5.3.6) | High | Large teams, complex routing, multi-broker | Small async teams; adds broker config, beat scheduler overhead |
| ARQ | 1.8k | 2024-01 (0.25.0) | Low | FastAPI-native async apps, Redis-backed, simple job flows | Need Kafka/RabbitMQ backend or complex chaining |
| RQ | 9.5k | 2024-02 (1.16.1) | Low | Simple jobs, easy ops, Redis | Need async/await support (RQ workers are sync) |

**Community Consensus:** r/Python and multiple HN threads (2023–2024) consistently recommend ARQ
for async FastAPI apps. Celery is the go-to for large teams needing battle-tested production
routing at scale; RQ for teams that want simplicity and are OK with sync workers.

### Recommendation
**ARQ** — async-native, minimal boilerplate, Redis (which you already have) as the only
dependency, and your load of 500 jobs/day puts you far below the scale where Celery's
operational overhead provides any advantage.

Sources:
- ARQ docs: https://arq-docs.helpmanual.io/
- Celery 5.3.x release notes: https://docs.celeryq.dev/en/stable/changelog.html

### Next Step
Complexity: LOW (one library, one worker file, no infra changes — Redis already running)
→ implementing directly now.

Implementation: pip install arq==0.25.0, create worker.py with async job functions,
wire lifespan context manager in FastAPI app.
```

---

**Complexity routing decision:** Single library + one new `worker.py` + one change to `main.py` lifespan — no infra, no schema, no other teams. Routes to **direct implementation**.

---

## Scenario 2 — High-Throughput Event Pipeline: Kafka vs RabbitMQ vs SQS

**Input:** "We're planning a new event-driven architecture to replace synchronous REST calls between our 6 microservices. Peak load is 50k events/sec. We're on AWS. Team of 8. Considering Kafka, RabbitMQ, or SQS — not sure which to commit to."

---

**Step 1 goal:** *"Choose a message broker for an event-driven pipeline handling 50k events/sec across 6 AWS-hosted microservices, team of 8 engineers."*

**Searches run:**
- `"kafka vs rabbitmq vs sqs 50k events per second comparison 2024"`
- `"amazon msk vs sqs vs rabbitmq aws 2024"`
- `"kafka sqs comparison high throughput site:news.ycombinator.com"`

**Fetched:**
- https://aws.amazon.com/msk/pricing/ — confirmed MSK pricing tiers
- https://www.rabbitmq.com/docs/clustering — confirmed RabbitMQ 3.13.x cluster setup requirements

---

### Output

```
## Exploring: Event broker for 50k events/sec event-driven pipeline on AWS

### Options

| Option | Stars (client) | Last Release | Complexity | Best For | Avoid If |
|--------|---------------|--------------|------------|----------|----------|
| Kafka (AWS MSK) | 27k (confluent-kafka-python) | 2024-03 | High | Massive throughput, event log replay, stream processing | Small teams; steep ops learning curve; complex consumer group mgmt |
| RabbitMQ (self-managed or Amazon MQ) | 12k (pika) | 2024-02 | Med | Complex routing, per-message TTL/priority, < 10k msg/sec | Very high throughput; requires careful cluster tuning at 50k/sec |
| SQS (AWS managed) | N/A (boto3) | Always latest | Low | AWS-native, no ops burden, auto-scaling, standard queues | Need strict ordering (use FIFO, limited to 3k msg/sec per queue), no replay |

**Community Consensus:** HN and AWS re:Invent talks consistently position Kafka/MSK for
replay-critical, high-throughput pipelines at 10k+ events/sec. SQS wins for operational
simplicity on AWS when replay is not needed. RabbitMQ is preferred for complex routing
patterns at moderate scale.

### Recommendation
**Kafka via AWS MSK** — at 50k events/sec with replay requirements across 6 services,
MSK eliminates broker ops overhead while giving you Kafka's retention, consumer group
management, and exactly-once semantics; SQS FIFO cannot sustain this throughput,
and RabbitMQ clusters require significant tuning at this scale.

Sources:
- AWS MSK pricing: https://aws.amazon.com/msk/pricing/
- Kafka vs SQS benchmark (Confluent, 2023): https://www.confluent.io/blog/kafka-vs-sqs/

### Next Step
Complexity: HIGH (multi-service integration, infra provisioning, IAM policies, consumer
group design across 6 services, schema registry consideration)
→ handing off to nexus:planning with Kafka/MSK as the confirmed approach.
```

---

**Complexity routing decision:** 6-service integration, Terraform for MSK cluster, IAM roles per service, schema design, monitoring, and consumer group strategy — clearly routes to **nexus:planning**.
