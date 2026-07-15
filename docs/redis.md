# Redis Cache Design

## Key Schema

| Key | Value | TTL |
|---|---|---|
| `url:<shortCode>` | `{"original":"https://...","expires":"2024-01-01","passwordHash":"$2b$..."}` | 86400s (24h) |

## Strategy

**Cache-Aside + Write-Through**:

- **Write-through**: When a URL is created, the service immediately writes to Redis. This ensures the first redirect is always a cache hit.
- **Read-through**: The redirect service reads Redis first. On a miss it queries PostgreSQL and warms the cache.
- **Invalidation**: On update or delete, the key is `DEL`'d immediately.

## Memory Management

- `maxmemory 512mb` with `allkeys-lru` eviction policy.
- LRU ensures the most actively redirected links stay hot.
- Cold URLs (infrequently clicked) naturally fall out of cache.

## Rate Limiting

Redis sliding window counters (optional enhancement):

```
Key: rate:<ip>:<minute>
Type: INCR with EXPIRE
```

- 60 requests/minute per IP for API endpoints
- 200 requests/minute per IP for redirects

## Cache Warming

On startup, the redirect service does **not** pre-warm the cache (too expensive at scale). Rely on the write-through strategy and natural LRU warming during the first hour of traffic.

## Persistence

Redis is configured with RDB snapshots (`save 900 1`) for durability. In production, enable AOF (`appendonly yes`) for stronger guarantees.
