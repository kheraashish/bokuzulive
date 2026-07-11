-- Bokuzu portal database schema (MySQL 8 / MariaDB, utf8mb4).
-- Applied automatically by lib/db/pool.ts::ensureSchema() on first use, and safe to re-run.
--
-- Design: one row per client, one row per connected ad account (with encrypted OAuth tokens),
-- and append-only metrics tables the daily sync writes into. The dashboard reads from these.

-- Clients (the brands you onboard). `slug` is the vanity URL: bokuzu.com/<slug>.
CREATE TABLE IF NOT EXISTS clients (
  id            VARCHAR(40)  NOT NULL,
  slug          VARCHAR(80)  NOT NULL,
  brand         VARCHAR(160) NOT NULL,
  currency      VARCHAR(8)   NOT NULL DEFAULT 'CAD',
  login_email   VARCHAR(200) NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',   -- active | paused
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_slug (slug),
  UNIQUE KEY uq_clients_email (login_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Connected ad accounts. Tokens are AES-256-GCM encrypted at rest (lib/crypto.ts).
CREATE TABLE IF NOT EXISTS connections (
  id                  VARCHAR(40)  NOT NULL,
  client_id           VARCHAR(40)  NOT NULL,
  platform            VARCHAR(16)  NOT NULL,           -- google | meta
  external_account_id VARCHAR(120) NULL,               -- Google customer id / Meta act_id
  account_name        VARCHAR(200) NULL,
  access_token_enc    TEXT         NULL,
  refresh_token_enc   TEXT         NULL,
  token_expires_at    DATETIME     NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | connected | error | revoked
  last_synced_at      DATETIME     NULL,
  last_error          TEXT         NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conn_client_platform (client_id, platform),
  KEY k_conn_client (client_id),
  CONSTRAINT fk_conn_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily campaign-grain metrics (the sync upserts these). Natural key keeps re-pulls idempotent.
CREATE TABLE IF NOT EXISTS perf_daily (
  client_id         VARCHAR(40)  NOT NULL,
  platform          VARCHAR(16)  NOT NULL,
  stat_date         DATE         NOT NULL,
  campaign_id       VARCHAR(120) NOT NULL DEFAULT '',
  campaign_name     VARCHAR(255) NULL,
  funnel_stage      VARCHAR(8)   NULL,                 -- TOP | MID | LOW
  spend             DECIMAL(14,2) NOT NULL DEFAULT 0,
  impressions       BIGINT       NOT NULL DEFAULT 0,
  clicks            BIGINT       NOT NULL DEFAULT 0,
  conversions       DECIMAL(14,2) NOT NULL DEFAULT 0,
  conversion_value  DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(8)   NULL,
  PRIMARY KEY (client_id, platform, stat_date, campaign_id),
  KEY k_perf_client_date (client_id, stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Live ad copy / text ads (replaced each sync).
CREATE TABLE IF NOT EXISTS ad_copy (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  client_id     VARCHAR(40)  NOT NULL,
  platform      VARCHAR(16)  NOT NULL,
  headline      VARCHAR(255) NULL,
  destination   VARCHAR(500) NULL,
  impressions   BIGINT       NOT NULL DEFAULT 0,
  ctr           DECIMAL(8,5) NOT NULL DEFAULT 0,
  spend         DECIMAL(14,2) NOT NULL DEFAULT 0,
  roas          DECIMAL(10,2) NULL,
  synced_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY k_adcopy_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optimization / change events (the "agency activity" feed).
CREATE TABLE IF NOT EXISTS activity_events (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  client_id     VARCHAR(40)  NOT NULL,
  platform      VARCHAR(16)  NOT NULL,
  event_type    VARCHAR(80)  NULL,
  title         VARCHAR(500) NULL,
  detail        VARCHAR(500) NULL,
  occurred_at   DATETIME     NULL,
  PRIMARY KEY (id),
  KEY k_activity_client_time (client_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-time email login codes (client OTP). Short-lived; the sign-in flow deletes on use.
CREATE TABLE IF NOT EXISTS login_codes (
  email       VARCHAR(200) NOT NULL,
  code_hash   VARCHAR(120) NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
