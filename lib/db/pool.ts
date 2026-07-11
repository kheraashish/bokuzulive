import "server-only";
import mysql from "mysql2/promise";

// MySQL connection for the Bokuzu portal. Everything reads credentials from environment variables,
// so nothing secret lives in the repo. When the DB env vars are absent (e.g. the marketing preview),
// dbConfigured() is false and the app falls back to demo data, so the live site never breaks.
//
// Local testing: put the values in site/.env.local (gitignored). Production: set them in Hostinger's
// Environment Variables panel. Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD. Optional: DB_PORT.

export function dbConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
}

let _pool: mysql.Pool | null = null;

export function pool(): mysql.Pool {
  if (!dbConfigured()) throw new Error("Database is not configured (DB_HOST/DB_NAME/DB_USER/DB_PASSWORD).");
  if (_pool) return _pool;
  _pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
    timezone: "Z",
    namedPlaceholders: true,
  });
  return _pool;
}

/** Run a query. Params use named placeholders, e.g. `WHERE id = :id`, { id }. */
export async function q<T = mysql.RowDataPacket[]>(sql: string, params: Record<string, unknown> = {}): Promise<T> {
  // mysql2 v3 typings don't model named-placeholder objects; cast is safe (pool has namedPlaceholders).
  const [rows] = await pool().execute(sql, params as unknown as never);
  return rows as T;
}

/** Quick connectivity check for the health route. */
export async function ping(): Promise<boolean> {
  const rows = await q<mysql.RowDataPacket[]>("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}

// Schema statements, kept in sync with lib/db/schema.sql (which you can also paste into phpMyAdmin).
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS clients (
     id VARCHAR(40) NOT NULL, slug VARCHAR(80) NOT NULL, brand VARCHAR(160) NOT NULL,
     currency VARCHAR(8) NOT NULL DEFAULT 'CAD', login_email VARCHAR(200) NULL,
     status VARCHAR(20) NOT NULL DEFAULT 'active',
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (id), UNIQUE KEY uq_clients_slug (slug), UNIQUE KEY uq_clients_email (login_email)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS connections (
     id VARCHAR(40) NOT NULL, client_id VARCHAR(40) NOT NULL, platform VARCHAR(16) NOT NULL,
     external_account_id VARCHAR(120) NULL, account_name VARCHAR(200) NULL,
     access_token_enc TEXT NULL, refresh_token_enc TEXT NULL, token_expires_at DATETIME NULL,
     status VARCHAR(20) NOT NULL DEFAULT 'pending', last_synced_at DATETIME NULL, last_error TEXT NULL,
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (id), UNIQUE KEY uq_conn_client_platform (client_id, platform), KEY k_conn_client (client_id),
     CONSTRAINT fk_conn_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS perf_daily (
     client_id VARCHAR(40) NOT NULL, platform VARCHAR(16) NOT NULL, stat_date DATE NOT NULL,
     campaign_id VARCHAR(120) NOT NULL DEFAULT '', campaign_name VARCHAR(255) NULL, funnel_stage VARCHAR(8) NULL,
     spend DECIMAL(14,2) NOT NULL DEFAULT 0, impressions BIGINT NOT NULL DEFAULT 0, clicks BIGINT NOT NULL DEFAULT 0,
     conversions DECIMAL(14,2) NOT NULL DEFAULT 0, conversion_value DECIMAL(14,2) NOT NULL DEFAULT 0, currency VARCHAR(8) NULL,
     PRIMARY KEY (client_id, platform, stat_date, campaign_id), KEY k_perf_client_date (client_id, stat_date)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS ad_copy (
     id BIGINT NOT NULL AUTO_INCREMENT, client_id VARCHAR(40) NOT NULL, platform VARCHAR(16) NOT NULL,
     headline VARCHAR(255) NULL, destination VARCHAR(500) NULL, impressions BIGINT NOT NULL DEFAULT 0,
     ctr DECIMAL(8,5) NOT NULL DEFAULT 0, spend DECIMAL(14,2) NOT NULL DEFAULT 0, roas DECIMAL(10,2) NULL,
     synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY k_adcopy_client (client_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS activity_events (
     id BIGINT NOT NULL AUTO_INCREMENT, client_id VARCHAR(40) NOT NULL, platform VARCHAR(16) NOT NULL,
     event_type VARCHAR(80) NULL, title VARCHAR(500) NULL, detail VARCHAR(500) NULL, occurred_at DATETIME NULL,
     PRIMARY KEY (id), KEY k_activity_client_time (client_id, occurred_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS login_codes (
     email VARCHAR(200) NOT NULL, code_hash VARCHAR(120) NOT NULL, expires_at DATETIME NOT NULL,
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (email)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS settings (
     k VARCHAR(80) NOT NULL, v_enc TEXT NULL,
     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (k)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

/** Create all tables if they do not exist. Idempotent; safe to call on every boot. */
export async function ensureSchema(): Promise<void> {
  const p = pool();
  for (const stmt of DDL) {
    await p.query(stmt);
  }
}
