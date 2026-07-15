# Monitoring

## Prometheus + Grafana

All services expose `/metrics` via `prom-client` with default Node.js metrics:

- `process_cpu_seconds_total`
- `process_resident_memory_bytes`
- `nodejs_eventloop_lag_seconds`
- `http_request_duration_seconds` (add via middleware)

The redirect-service additionally exposes:

- `redirect_latency_ms` — histogram of redirect durations
- `redirect_cache_hits_total` — counter
- `redirect_cache_misses_total` — counter

## Access Grafana

1. Open http://localhost:3000
2. Login: `admin` / `admin` (change on first login)
3. Datasource: Prometheus is auto-provisioned at http://prometheus:9090

## Key Dashboards to Build

### Redirect Service Dashboard

- Redirect p50 / p95 / p99 latency
- Cache hit ratio (`cache_hits / (cache_hits + cache_misses)`)
- Redirects/second

### System Overview

- CPU and memory per service
- PostgreSQL: active connections, query rate
- Redis: used memory, hit rate
- Kafka: consumer lag per partition

## Alerts

Configure Prometheus Alertmanager for:

| Alert | Condition |
|---|---|
| High redirect latency | p99 > 200ms for 5min |
| Low cache hit ratio | <90% for 10min |
| Service down | No scrape for 1min |
| High error rate | 5xx rate >1% for 5min |
| Kafka lag | Consumer lag >10k |

## Logging

Winston structured logging in all services.

In production, ship to:
- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Loki + Grafana**: lightweight alternative (log queries in same Grafana instance)

## Distributed Tracing (future)

Add OpenTelemetry SDK to each service, ship traces to Jaeger:

```bash
# Add to each service
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```
