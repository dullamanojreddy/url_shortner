-- ──────────────────────────────────────────────────────────────────
-- Distributed URL Shortener — MySQL 8.0 Database Schema
-- ──────────────────────────────────────────────────────────────────

-- ── Users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'user',
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_role CHECK (role IN ('user', 'admin'))
);

CREATE INDEX idx_users_email ON users(email);

-- ── URLs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS urls (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36),
  short_code    VARCHAR(20)   NOT NULL UNIQUE,
  original_url  TEXT          NOT NULL,
  title         VARCHAR(500),
  expires_at    DATETIME,
  password_hash VARCHAR(255),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  click_count   BIGINT        NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_user_id    ON urls(user_id);
CREATE INDEX idx_urls_expires_at ON urls(expires_at);

-- ── Clicks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clicks (
  id          CHAR(36)    NOT NULL PRIMARY KEY,
  url_id      CHAR(36)    NOT NULL,
  ip_address  VARBINARY(16),
  country     VARCHAR(100),
  city        VARCHAR(100),
  browser     VARCHAR(100),
  os          VARCHAR(100),
  device      VARCHAR(50),
  referer     TEXT,
  user_agent  TEXT,
  clicked_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

CREATE INDEX idx_clicks_url_id     ON clicks(url_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);

-- ── QR Codes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_codes (
  id          CHAR(36)    NOT NULL PRIMARY KEY,
  url_id      CHAR(36)    NOT NULL UNIQUE,
  file_path   TEXT        NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

-- ── API Keys ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  user_id      CHAR(36)     NOT NULL,
  key_hash     VARCHAR(255) NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  last_used_at DATETIME,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user_id  ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
