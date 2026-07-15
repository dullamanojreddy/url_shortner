# Kafka Event Pipeline

## Why Kafka?

The redirect path is latency-critical (<50ms target). Writing a click record synchronously to PostgreSQL would add 10-30ms per redirect. Instead:

1. Redirect service publishes a lightweight event to Kafka (<1ms).
2. Analytics service consumes events in the background and writes to the DB.

This decouples redirect speed from write throughput and allows analytics workers to scale independently.

## Topic

| Topic | Partitions | Replication |
|---|---|---|
| `url.clicks` | 3 | 1 (dev), 3 (prod) |

## Event Schema

```json
{
  "shortCode": "abc123",
  "urlId": "uuid",
  "ip": "1.2.3.4",
  "userAgent": "Mozilla/5.0 ...",
  "referer": "https://twitter.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Consumer Group

- **Group ID**: `analytics-workers`
- Each analytics-service instance joins the same consumer group.
- Kafka distributes partitions across instances automatically.
- Adding more analytics-service containers scales consumer throughput.

## Fault Tolerance

- If Kafka is unavailable, the redirect still works (click event silently dropped).
- On analytics-service restart, it picks up from the committed offset.
- Failed events are retried by the consumer (up to 3 retries) before being dropped.

## Scaling

- Increase partitions to `n` to allow `n` concurrent consumer instances.
- Use a Dead Letter Queue (DLQ) topic for permanently failed events.
