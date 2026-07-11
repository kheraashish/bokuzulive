import "server-only";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { q } from "./pool";
import { hashCode } from "@/lib/clientAuth";

// DB layer for the client-facing auth: login lookups, password, 2FA prefs, one-time codes,
// trusted devices, and support tickets.

export interface LoginClient extends RowDataPacket {
  id: string;
  slug: string;
  brand: string;
  login_email: string | null;
  password_hash: string | null;
  phone: string | null;
  twofa_email: number;
  twofa_sms: number;
  status: string;
}

const norm = (s: string) => s.trim().toLowerCase();

export async function getClientForLogin(email: string): Promise<LoginClient | null> {
  const rows = await q<LoginClient[]>(
    `SELECT id, slug, brand, login_email, password_hash, phone, twofa_email, twofa_sms, status
     FROM clients WHERE login_email = :e LIMIT 1`,
    { e: norm(email) }
  );
  return rows[0] ?? null;
}

export async function getClientById(id: string): Promise<LoginClient | null> {
  const rows = await q<LoginClient[]>(
    `SELECT id, slug, brand, login_email, password_hash, phone, twofa_email, twofa_sms, status
     FROM clients WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] ?? null;
}

export async function setPassword(clientId: string, passwordHash: string): Promise<void> {
  await q(`UPDATE clients SET password_hash = :h WHERE id = :id`, { h: passwordHash, id: clientId });
}
export async function setPhone(clientId: string, phone: string | null): Promise<void> {
  await q(`UPDATE clients SET phone = :p WHERE id = :id`, { p: phone, id: clientId });
}
export async function setEmail(clientId: string, email: string): Promise<void> {
  await q(`UPDATE clients SET login_email = :e WHERE id = :id`, { e: norm(email), id: clientId });
}
export async function set2fa(clientId: string, opts: { email?: boolean; sms?: boolean }): Promise<void> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: clientId };
  if (opts.email !== undefined) { sets.push("twofa_email = :te"); params.te = opts.email ? 1 : 0; }
  if (opts.sms !== undefined) { sets.push("twofa_sms = :ts"); params.ts = opts.sms ? 1 : 0; }
  if (!sets.length) return;
  await q(`UPDATE clients SET ${sets.join(", ")} WHERE id = :id`, params);
}

// ── one-time codes (email/sms OTP) ────────────────────────────────────────────
export async function saveCode(email: string, code: string, ttlMs = 10 * 60 * 1000): Promise<void> {
  const expires = new Date(Date.now() + ttlMs);
  await q(
    `INSERT INTO login_codes (email, code_hash, expires_at) VALUES (:e, :h, :x)
     ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), expires_at = VALUES(expires_at), created_at = CURRENT_TIMESTAMP`,
    { e: norm(email), h: hashCode(code, email), x: expires }
  );
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const rows = await q<RowDataPacket[]>(
    `SELECT code_hash, expires_at FROM login_codes WHERE email = :e LIMIT 1`,
    { e: norm(email) }
  );
  const row = rows[0];
  if (!row) return false;
  const ok = row.expires_at > new Date() && crypto.timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(hashCode(code, email)));
  if (ok) await q(`DELETE FROM login_codes WHERE email = :e`, { e: norm(email) });
  return ok;
}

// ── trusted devices ───────────────────────────────────────────────────────────
export interface DeviceRow extends RowDataPacket {
  id: string;
  device_id: string;
  label: string | null;
  user_agent: string | null;
  created_at: Date;
  last_seen_at: Date;
}

export async function addTrustedDevice(clientId: string, deviceId: string, meta: { label?: string; ua?: string; ip?: string }): Promise<void> {
  await q(
    `INSERT INTO trusted_devices (id, client_id, device_id, label, user_agent, ip)
     VALUES (:id, :c, :d, :l, :ua, :ip)
     ON DUPLICATE KEY UPDATE last_seen_at = CURRENT_TIMESTAMP, user_agent = VALUES(user_agent)`,
    { id: crypto.randomUUID(), c: clientId, d: deviceId, l: meta.label ?? null, ua: (meta.ua || "").slice(0, 300) || null, ip: meta.ip ?? null }
  );
}
export async function isTrustedDevice(clientId: string, deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  const rows = await q<RowDataPacket[]>(`SELECT 1 AS x FROM trusted_devices WHERE client_id = :c AND device_id = :d LIMIT 1`, { c: clientId, d: deviceId });
  return rows.length > 0;
}
export async function listDevices(clientId: string): Promise<DeviceRow[]> {
  return q<DeviceRow[]>(`SELECT id, device_id, label, user_agent, created_at, last_seen_at FROM trusted_devices WHERE client_id = :c ORDER BY last_seen_at DESC`, { c: clientId });
}
export async function removeDevice(clientId: string, id: string): Promise<void> {
  await q(`DELETE FROM trusted_devices WHERE client_id = :c AND id = :id`, { c: clientId, id });
}
export async function removeDeviceByDeviceId(clientId: string, deviceId: string): Promise<void> {
  await q(`DELETE FROM trusted_devices WHERE client_id = :c AND device_id = :d`, { c: clientId, d: deviceId });
}
export async function touchDevice(clientId: string, deviceId: string): Promise<void> {
  await q(`UPDATE trusted_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE client_id = :c AND device_id = :d`, { c: clientId, d: deviceId });
}

// ── support tickets ───────────────────────────────────────────────────────────
export async function createTicket(input: { clientId?: string | null; email: string; brand?: string | null; subject: string; message: string }): Promise<string> {
  const id = crypto.randomUUID();
  await q(
    `INSERT INTO support_tickets (id, client_id, email, brand, subject, message)
     VALUES (:id, :c, :e, :b, :s, :m)`,
    { id, c: input.clientId ?? null, e: norm(input.email), b: input.brand ?? null, s: input.subject.slice(0, 200), m: input.message }
  );
  return id;
}
