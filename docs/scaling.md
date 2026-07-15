# Scaling Strategy

## Current: Single-node Docker Compose

Good for development and small production loads (<10k requests/day).

## Horizontal Scaling

All services are stateless — scale by running more instances:

```bash
docker-compose up --scale redirect-service=3 --scale url-service=2
```

Nginx load-balances across instances using upstream round-robin.

## Database Scaling

### Read Replicas

Add read replicas for SELECT-heavy workloads:

```
Primary (writes) → Replica 1 (reads)
                 → Replica 2 (reads)
```

The redirect service can be pointed at a replica for lookups.

### Connection Pooling

Use PgBouncer in front of PostgreSQL to pool connections efficiently:

```
Services → PgBouncer (transaction mode) → PostgreSQL
```

### Sharding (future)

When a single PostgreSQL instance can't handle the write volume:

1. Shard `urls` table by `short_code` consistent hash
2. Shard router determines which shard to query
3. Each shard has its own primary + replicas

## Redis Cluster

For cache scaling:

```
Shard 1: slots 0-5460
Shard 2: slots 5461-10922
Shard 3: slots 10923-16383
```

Each shard has 1 primary + 1 replica. Keys are distributed by hash slot.

## Kafka Scaling

- Increase topic partitions to match desired consumer parallelism
- Each analytics-service container handles one or more partitions
- Kafka brokers scale independently of consumers

## Auto-scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: redirect-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: redirect-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Capacity Estimates

| Component | Bottleneck | Scale trigger |
|---|---|---|
| redirect-service | CPU (JWT verify, Redis calls) | CPU >70% |
| url-service | DB write throughput | p95 latency >200ms |
| analytics-service | Kafka lag | Consumer lag >10k messages |
| PostgreSQL | Write IOPS | Disk I/O >80% |
| Redis | Memory | Used memory >80% of maxmemory |
