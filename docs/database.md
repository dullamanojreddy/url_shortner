# Database Design

## Schema

### users

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | uuid_generate_v4() |
| name | VARCHAR(100) | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt cost 12 |
| role | VARCHAR(20) | 'user' or 'admin' |
| is_active | BOOLEAN | soft-disable accounts |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |

**Indexes**: `idx_users_email`

---

### urls

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | CASCADE DELETE |
| short_code | VARCHAR(20) UNIQUE | Base62 Snowflake or custom alias |
| original_url | TEXT | |
| title | VARCHAR(500) | optional label |
| expires_at | TIMESTAMPTZ | NULL = never |
| password_hash | VARCHAR(255) | NULL = public |
| is_active | BOOLEAN | soft-delete |
| click_count | BIGINT | denormalized counter |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Indexes**:
- `idx_urls_short_code` — primary redirect lookup (most-hit)
- `idx_urls_user_id` — list URLs by user
- `idx_urls_expires_at WHERE expires_at IS NOT NULL` — partial index for expiry scan

---

### clicks

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| url_id | UUID FK → urls | CASCADE DELETE |
| ip_address | INET | |
| country | VARCHAR(100) | from GeoIP (add later) |
| city | VARCHAR(100) | |
| browser | VARCHAR(100) | parsed from UA |
| os | VARCHAR(100) | |
| device | VARCHAR(50) | 'desktop' / 'mobile' |
| referer | TEXT | |
| user_agent | TEXT | |
| clicked_at | TIMESTAMPTZ | |

**Indexes**:
- `idx_clicks_url_id` — aggregate by URL
- `idx_clicks_clicked_at` — time-range analytics

---

### qr_codes

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| url_id | UUID FK UNIQUE | one QR per URL |
| file_path | TEXT | object-storage path or inline key |
| created_at | TIMESTAMPTZ | |

---

### api_keys

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| key_hash | VARCHAR(255) UNIQUE | bcrypt hash of raw key |
| name | VARCHAR(100) | |
| last_used_at | TIMESTAMPTZ | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

## Indexing Strategy

- The redirect path (`short_code` lookup) is the hottest query — `idx_urls_short_code` is a unique B-tree index that keeps this O(log n).
- `click_count` is a denormalized counter on `urls` for fast dashboard display without aggregating the `clicks` table.
- Analytics queries GROUP BY `browser/device/os` on `clicks` — add a partial index on `clicked_at` for time-range filters.

## Connection Pooling

Each service uses `pg.Pool` with `max: 10–20` depending on traffic profile. Total connections = services × pool_size; stay under `max_connections` (default 100) in PostgreSQL.
