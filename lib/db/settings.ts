import "server-only";
import { q } from "./pool";
import { encrypt, decrypt } from "@/lib/crypto";
import type { RowDataPacket } from "mysql2";

// Agency-level settings, stored encrypted. These are the one-time "manager" credentials that read
// every client's ad data: the Google MCC refresh token and the Meta system-user token.

export type SettingKey = "google_refresh_token" | "meta_system_token";

interface Row extends RowDataPacket {
  v_enc: string | null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await q(
    `INSERT INTO settings (k, v_enc) VALUES (:k, :v)
     ON DUPLICATE KEY UPDATE v_enc = VALUES(v_enc)`,
    { k: key, v: value ? encrypt(value) : null }
  );
}

export async function getSetting(key: SettingKey): Promise<string | null> {
  const rows = await q<Row[]>(`SELECT v_enc FROM settings WHERE k = :k LIMIT 1`, { k: key });
  const enc = rows[0]?.v_enc;
  return enc ? decrypt(enc) : null;
}

export async function hasSetting(key: SettingKey): Promise<boolean> {
  const rows = await q<Row[]>(`SELECT 1 AS x FROM settings WHERE k = :k AND v_enc IS NOT NULL LIMIT 1`, { k: key });
  return rows.length > 0;
}

export async function clearSetting(key: SettingKey): Promise<void> {
  await q(`DELETE FROM settings WHERE k = :k`, { k: key });
}
