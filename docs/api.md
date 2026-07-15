# API Reference

Base URL: `http://localhost` (or your domain)

All authenticated endpoints require: `Authorization: Bearer <jwt_token>`

---

## Auth

### POST /api/v1/auth/register

Register a new user.

**Body**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Response 201**
```json
{
  "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "user" },
  "token": "eyJ..."
}
```

---

### POST /api/v1/auth/login

**Body**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Response 200**
```json
{ "user": { ... }, "token": "eyJ..." }
```

---

### GET /api/v1/auth/me 🔒

Returns the authenticated user's profile.

---

### POST /api/v1/auth/keys 🔒

Create an API key.

**Body** `{ "name": "My App" }`

**Response 201**
```json
{ "apiKey": "sk_abc123...", "name": "My App" }
```

> ⚠️ The raw key is returned ONCE. Store it securely.

---

### GET /api/v1/auth/keys 🔒

List API keys (metadata only, no raw keys).

---

### DELETE /api/v1/auth/keys/:id 🔒

Revoke an API key.

---

## URLs

### POST /api/v1/urls 🔒

Create a short URL.

**Body**
```json
{
  "originalUrl": "https://google.com",
  "customAlias": "google",       // optional, 2-30 chars
  "expiry": "7d",                // "7d" | "30d" | "365d" | "never"
  "password": "hunter2",        // optional
  "title": "Google homepage"    // optional
}
```

**Response 201**
```json
{
  "id": "...",
  "shortCode": "google",
  "originalUrl": "https://google.com",
  "shortUrl": "http://localhost/google",
  "expiresAt": "2024-01-22T00:00:00.000Z",
  "createdAt": "..."
}
```

**Errors**
- `409` — alias already taken
- `400` — validation error

---

### GET /api/v1/urls 🔒

List your short URLs (paginated).

**Query params**: `page`, `limit` (max 100)

---

### GET /api/v1/urls/:shortCode 🔒

Get metadata for one of your URLs.

---

### PUT /api/v1/urls/:shortCode 🔒

Update destination or expiry.

**Body**
```json
{ "originalUrl": "https://new-url.com", "expiry": "30d" }
```

---

### DELETE /api/v1/urls/:shortCode 🔒

Soft-delete a URL (deactivated, cache invalidated).

---

## Redirect

### GET /:shortCode

Redirects to the original URL (302).

For password-protected links, include:
```
X-Link-Password: hunter2
```

**Status codes**
- `302` — redirect
- `401` — password required / wrong
- `404` — not found
- `410` — expired

---

## Analytics

### GET /api/v1/analytics/:shortCode 🔒

**Response**
```json
{
  "shortCode": "google",
  "totalClicks": 1243,
  "browsers": [{"browser":"Chrome","count":"800"}, ...],
  "devices": [{"device":"desktop","count":"900"}, ...],
  "operatingSystems": [{"os":"Windows","count":"600"}, ...],
  "clicksLast30Days": [{"day":"2024-01-01T00:00:00.000Z","count":"42"}, ...]
}
```

---

### GET /api/v1/analytics/:shortCode/clicks 🔒

Paginated raw click records.

---

## QR Codes

### GET /api/v1/qr/:shortCode 🔒

Returns SVG QR code (`Content-Type: image/svg+xml`).

---

### GET /api/v1/qr/:shortCode/png 🔒

Returns PNG QR code download (`Content-Disposition: attachment`).

---

## Admin (admin role required)

### GET /api/v1/admin/users

List all users with URL counts.

### PUT /api/v1/admin/users/:id/activate

Activate a suspended user.

### PUT /api/v1/admin/users/:id/deactivate

Suspend a user.

### PUT /api/v1/admin/users/:id/role

**Body** `{ "role": "admin" | "user" }`

### DELETE /api/v1/admin/users/:id

Permanently delete a user and all their URLs.

### GET /api/v1/admin/health

System health: DB latency, Redis latency, key count, stats.

### GET /api/v1/admin/health/top-urls

Top 10 most-clicked URLs.
