# Distributed URL Shortener

A production-grade, scalable distributed URL shortening service capable of handling millions of redirects with low latency (<50ms). Demonstrates system design, microservices, caching, message queues, and DevOps best practices — a strong portfolio and interview project.

---

## Features

- **URL Shortening** — Generate unique short codes via Base62 encoding of Snowflake IDs
- **Custom Aliases** — e.g. `tiny.ly/chatgpt`
- **URL Expiration** — 7 days, 30 days, or never
- **Password-Protected Links** — Bcrypt-hashed per-link passwords
- **QR Code Generation** — On-demand QR codes stored in object storage
- **Analytics Dashboard** — Click counts, country, browser, device breakdown
- **Async Analytics** — Kafka-powered event streaming; never slows redirects
- **REST API + API Keys** — Programmatic access with per-key rate limiting
- **Admin Panel API** — User management, abuse detection, system health
- **Rate Limiting** — Per-IP and per-user via Redis sliding window
- **JWT Authentication** — Stateless, RS256-signed tokens

---

## Architecture

```
Internet
   │
Nginx (API Gateway)
   │
   ├── /api/v1/auth    → auth-service      (port 3001)
   ├── /api/v1/urls    → url-service       (port 3002)
   ├── /api/v1/analytics → analytics-service (port 3003)
   ├── /api/v1/qr      → qr-service        (port 3004)
   ├── /api/v1/admin   → admin-service     (port 3005)
   └── /:shortCode     → redirect-service  (port 3006)
         │
    Redis Cluster (cache + rate limiting)
         │
    PostgreSQL (persistent store)
         │
    Kafka → Analytics Workers → Click DB
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 5 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Message Queue | Apache Kafka 3 + Zookeeper |
| API Gateway | Nginx |
| QR Codes | qrcode library |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Monitoring | Prometheus + Grafana |
| Logging | Winston + Morgan |
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (manifests in `/k8s`) |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Docker 24+
- Docker Compose 2+
- Node.js 20+ (for local development)

### 1. Clone and configure

```bash
git clone https://github.com/yourname/distributed-url-shortener.git
cd distributed-url-shortener
cp .env.example .env
# Edit .env and set strong secrets
```

### 2. Start everything

```bash
docker-compose up --build
```

Services will be available at:

| Service | URL |
|---|---|
| API Gateway | http://localhost:80 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin/admin) |

### 3. Create your first short URL

```bash
# Register
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
# → Copy the token

# Shorten a URL
curl -X POST http://localhost/api/v1/urls \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://google.com","customAlias":"google","expiry":"30d"}'
# → {"shortUrl":"http://localhost/google"}

# Redirect
curl -L http://localhost/google
```

---

## API Reference

See [`docs/api.md`](docs/api.md) for full documentation.

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login, get JWT |
| POST | `/api/v1/urls` | Create short URL |
| GET | `/:shortCode` | Redirect |
| GET | `/api/v1/urls/:shortCode` | Get URL metadata |
| PUT | `/api/v1/urls/:shortCode` | Update destination |
| DELETE | `/api/v1/urls/:shortCode` | Delete URL |
| GET | `/api/v1/urls/:shortCode/analytics` | Click analytics |
| GET | `/api/v1/qr/:shortCode` | Generate QR code |

---

## Performance Goals

- Redirect latency: **<50 ms** (cache hit)
- Cache hit ratio: **>95%**
- Availability: **99.99%**

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — System design deep dive
- [`docs/api.md`](docs/api.md) — Full API reference
- [`docs/database.md`](docs/database.md) — Schema and indexing strategy
- [`docs/redis.md`](docs/redis.md) — Cache design and TTL strategy
- [`docs/kafka.md`](docs/kafka.md) — Event streaming and analytics pipeline
- [`docs/scaling.md`](docs/scaling.md) — Horizontal scaling approach
- [`docs/security.md`](docs/security.md) — Security measures
- [`docs/deployment.md`](docs/deployment.md) — Docker + Kubernetes deployment
- [`docs/monitoring.md`](docs/monitoring.md) — Prometheus + Grafana setup

---

## License

MIT
