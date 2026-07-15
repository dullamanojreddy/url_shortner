# Security

## Authentication

- **JWT (HS256)**: stateless tokens, 7-day expiry by default
- **bcrypt cost 12**: password hashing (≈300ms intentional delay)
- **API Keys**: stored as bcrypt hashes, raw key shown once at creation

## Authorization

- Every API endpoint requires a valid JWT or API key
- Admin endpoints additionally check `role === "admin"`
- Users can only read/modify their own URLs (checked via `user_id`)

## Input Validation

- All request bodies validated with **Zod** schemas
- URL validation: `z.string().url()` — rejects javascript: and data: schemes
- Custom alias: regex `/^[a-zA-Z0-9_-]{2,30}$/` — prevents path-injection
- Request body limited to 10KB

## Rate Limiting

Nginx-level rate limiting:

| Endpoint group | Rate | Burst |
|---|---|---|
| API endpoints | 60 req/min per IP | 30 |
| Redirect | 200 req/min per IP | 50 |

## HTTP Security Headers (Helmet.js)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (enable when HTTPS configured)

## SQL Injection Prevention

All database queries use **parameterized queries** (`$1, $2` syntax with `pg` library). No string concatenation used in queries.

## Password-Protected Links

- Password stored as bcrypt hash per URL
- Verification happens at redirect time via `X-Link-Password` header
- Not cached: password check always hits bcrypt

## HTTPS

In production:
1. Enable TLS in Nginx with Let's Encrypt or ACM
2. Set `Strict-Transport-Security` header
3. Redirect HTTP → HTTPS at the Nginx level

## Secrets Management

- All secrets in environment variables (never committed to git)
- Use Docker secrets or Kubernetes Secrets in production
- Rotate `JWT_SECRET` periodically; existing sessions will be invalidated

## Audit Logging

All requests logged via Morgan with IP, path, status, and latency. In production, ship logs to ELK or CloudWatch for retention and alerting.
