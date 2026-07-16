import "server-only";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { q } from "./pool";
import { encrypt, decrypt } from "@/lib/crypto";

// Passwordless portal users. A user is an email that may be linked to a client (company). Multiple
// users can belong to one client (owner + members). Login is email + one-time code; no passwords.

export interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  client_id: string | null;
  role: string;
  name: string | null;
  phone: string | null;
  twofa_sms: number;
  twofa_totp: number;
}

export interface ClientPublic extends RowDataPacket {
  id: string;
  slug: string;
  brand: string;
  logo_url: string | null;
  currency: string;
  agency_onboarded: string | null; // 'yes' | 'no' | null (not answered yet)
}

const norm = (s: string) => s.trim().toLowerCase();

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await q<UserRow[]>(
    `SELECT id, email, client_id, role, name, phone, twofa_sms, twofa_totp FROM portal_users WHERE email = :e LIMIT 1`,
    { e: norm(email) }
  );
  return rows[0] ?? null;
}

/** Passwordless sign-in: return the existing user for this email, or create a new (unlinked) one. */
export async function findOrCreateUser(email: string): Promise<UserRow> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await q(`INSERT INTO portal_users (id, email) VALUES (:id, :e)`, { id, e: norm(email) });
  return (await findUserByEmail(email)) as UserRow;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const rows = await q<UserRow[]>(
    `SELECT id, email, client_id, role, name, phone, twofa_sms, twofa_totp FROM portal_users WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] ?? null;
}

export async function updateLastLogin(id: string): Promise<void> {
  await q(`UPDATE portal_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id`, { id });
}
export async function setUserPhone(id: string, phone: string | null): Promise<void> {
  await q(`UPDATE portal_users SET phone = :p WHERE id = :id`, { p: phone, id });
}
export async function setUser2faSms(id: string, on: boolean): Promise<void> {
  await q(`UPDATE portal_users SET twofa_sms = :v WHERE id = :id`, { v: on ? 1 : 0, id });
}

// ── authenticator app (TOTP) ──────────────────────────────────────────────────
export async function enableTotp(userId: string, secret: string): Promise<void> {
  await q(`UPDATE portal_users SET totp_secret_enc = :s, twofa_totp = 1 WHERE id = :id`, { s: encrypt(secret), id: userId });
}
export async function disableTotp(userId: string): Promise<void> {
  await q(`UPDATE portal_users SET totp_secret_enc = NULL, twofa_totp = 0 WHERE id = :id`, { id: userId });
}
export async function getTotpSecret(userId: string): Promise<string | null> {
  const rows = await q<RowDataPacket[]>(`SELECT totp_secret_enc FROM portal_users WHERE id = :id LIMIT 1`, { id: userId });
  const enc = rows[0]?.totp_secret_enc as string | null | undefined;
  return enc ? decrypt(enc) : null;
}

/** Operator: attach an email to a client as owner/member (creates the user if new, or re-links). */
export async function addUserToClient(clientId: string, email: string, role: "owner" | "member"): Promise<void> {
  const e = norm(email);
  await q(
    `INSERT INTO portal_users (id, email, client_id, role) VALUES (:id, :e, :c, :r)
     ON DUPLICATE KEY UPDATE client_id = VALUES(client_id), role = VALUES(role)`,
    { id: crypto.randomUUID(), e, c: clientId, r: role }
  );
}
export async function listUsersForClient(clientId: string): Promise<UserRow[]> {
  return q<UserRow[]>(
    `SELECT id, email, client_id, role, name, phone, twofa_sms, twofa_totp FROM portal_users WHERE client_id = :c ORDER BY role DESC, created_at ASC`,
    { c: clientId }
  );
}
export async function removeUser(id: string): Promise<void> {
  await q(`DELETE FROM portal_users WHERE id = :id`, { id });
}

// ── self-serve account setup (first sign-in) ──────────────────────────────────
const RESERVED_SLUGS = ["login", "example", "admin", "api", "top", "portal"];

function slugify(s: string): string {
  const base = s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return base || "client";
}
async function slugExists(slug: string): Promise<boolean> {
  const r = await q<RowDataPacket[]>(`SELECT 1 AS x FROM clients WHERE slug = :s LIMIT 1`, { s: slug });
  return r.length > 0;
}
async function uniqueSlug(base: string): Promise<string> {
  let s = RESERVED_SLUGS.includes(base) ? `${base}-co` : base;
  let n = 1;
  while (await slugExists(s)) { n += 1; s = `${base}-${n}`.slice(0, 40); }
  return s;
}
function currencyFor(country: string): string {
  const c = country.toLowerCase();
  if (/canada/.test(c)) return "CAD";
  if (/united states|usa|america/.test(c)) return "USD";
  if (/united kingdom|uk|britain|england/.test(c)) return "GBP";
  if (/australia/.test(c)) return "AUD";
  if (/india/.test(c)) return "INR";
  if (/euro|germany|france|spain|italy|netherlands|ireland/.test(c)) return "EUR";
  return "USD";
}

/** New user completes setup: create a pending company from their details and link them as owner. */
export async function completeSetup(userId: string, input: { companyName: string; website?: string; country: string; phone?: string }): Promise<string> {
  const user = await getUserById(userId);
  if (!user) throw new Error("user not found");
  if (user.client_id) return user.client_id; // already set up

  const slug = await uniqueSlug(slugify(input.companyName));
  const clientId = crypto.randomUUID();
  await q(
    `INSERT INTO clients (id, slug, brand, currency, status, website, country)
     VALUES (:id, :slug, :brand, :cur, 'pending', :web, :country)`,
    {
      id: clientId,
      slug,
      brand: input.companyName.trim().slice(0, 160),
      cur: currencyFor(input.country),
      web: (input.website || "").trim().slice(0, 300) || null,
      country: input.country.trim().slice(0, 80),
    }
  );
  invalidateSlugCache(); // a brand-new company must resolve immediately, not after the TTL
  await q(`UPDATE portal_users SET client_id = :cid, role = 'owner', phone = :p WHERE id = :uid`, {
    cid: clientId, p: (input.phone || "").trim() || null, uid: userId,
  });
  return clientId;
}

// ── client (company) ──────────────────────────────────────────────────────────
// Every single-segment URL asks this question, so every crawler guess used to run its own query to
// discover it was fake. Two costs: a DB blip turned junk URLs into 500s, which Google reads as "retry
// later" instead of "this doesn't exist", so the junk stays in the crawl queue; and that traffic
// competed with real clients for a pool capped at 5 connections.
//
// The slug list is tiny and near-static (insert-only — nothing renames or deletes a slug), so cache
// the whole set instead of asking per URL. On a blip we answer from the last known set: slightly
// stale beats an outage.
//
// Note what this deliberately does NOT do: catch the error and call notFound(). That would tell a
// paying client, mid-blip, that their own portal doesn't exist — matrix film and all. This site
// cannot ship that lie. A cold start with the DB down still throws, because then the site really is
// broken, and a comfortable guess would be worse than an honest error.
let _slugCache: { at: number; slugs: Set<string> } | null = null;
const SLUG_TTL_MS = 60_000;

// A sick DB should not be probed by every single request: that piles up connection attempts on a
// pool of 5 exactly when it is least able to take them. So back off after a failure and keep serving
// the stale set. Tracked on its own clock rather than by ageing `_slugCache.at`, because that would
// mean a recovered DB went unnoticed for the full TTL. 5s is short enough that recovery is near
// immediate, and long enough that an outage costs ~1 connection attempt per 5s instead of one per hit.
let _lastFailAt = 0;
const FAIL_BACKOFF_MS = 5_000;

/** Drop the cached slug set. Must be called wherever a client row is created. */
export function invalidateSlugCache(): void {
  _slugCache = null;
}

/** Does a company with this slug exist? Lets the /<company> route tell a real client
 *  URL (gate to login) from a typo / bad URL (show the friendly not-found page). */
export async function clientSlugExists(slug: string): Promise<boolean> {
  const s = norm(slug);
  const now = Date.now();
  if (_slugCache && now - _slugCache.at < SLUG_TTL_MS) return _slugCache.slugs.has(s);
  if (_slugCache && now - _lastFailAt < FAIL_BACKOFF_MS) return _slugCache.slugs.has(s); // still sick; don't pile on
  try {
    const rows = await q<RowDataPacket[]>(`SELECT slug FROM clients`);
    _slugCache = { at: now, slugs: new Set(rows.map((r) => norm(String(r.slug)))) };
    _lastFailAt = 0;
    return _slugCache.slugs.has(s);
  } catch (err) {
    _lastFailAt = now;
    if (_slugCache) return _slugCache.slugs.has(s); // serve stale rather than 500
    throw err; // cold start + DB down: nothing to serve, and guessing would be a lie
  }
}
export async function getClientPublic(clientId: string): Promise<ClientPublic | null> {
  const rows = await q<ClientPublic[]>(
    `SELECT id, slug, brand, logo_url, currency, agency_onboarded FROM clients WHERE id = :id LIMIT 1`,
    { id: clientId }
  );
  return rows[0] ?? null;
}
export async function setClientLogo(clientId: string, url: string | null): Promise<void> {
  await q(`UPDATE clients SET logo_url = :u WHERE id = :id`, { u: url, id: clientId });
}
export async function setAgencyOnboarded(clientId: string, value: "yes" | "no"): Promise<void> {
  await q(`UPDATE clients SET agency_onboarded = :v WHERE id = :id`, { v: value, id: clientId });
}

/** "Portal live" = the client has at least one ad account linked (an account ID set). */
export async function clientIsLive(clientId: string): Promise<boolean> {
  const rows = await q<RowDataPacket[]>(
    `SELECT 1 AS x FROM connections WHERE client_id = :c AND external_account_id IS NOT NULL AND external_account_id <> '' LIMIT 1`,
    { c: clientId }
  );
  return rows.length > 0;
}

// ── per-user trusted devices (30-day) ─────────────────────────────────────────
export interface UserDeviceRow extends RowDataPacket {
  id: string;
  device_id: string;
  label: string | null;
  user_agent: string | null;
  created_at: Date;
  last_seen_at: Date;
}

export async function addUserDevice(userId: string, deviceId: string, meta: { label?: string; ua?: string }): Promise<void> {
  await q(
    `INSERT INTO user_devices (id, user_id, device_id, label, user_agent)
     VALUES (:id, :u, :d, :l, :ua)
     ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP, user_agent = VALUES(user_agent)`,
    { id: crypto.randomUUID(), u: userId, d: deviceId, l: meta.label ?? null, ua: (meta.ua || "").slice(0, 300) || null }
  );
}
export async function isUserDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  const rows = await q<RowDataPacket[]>(
    `SELECT 1 AS x FROM user_devices WHERE user_id = :u AND device_id = :d AND created_at > (NOW() - INTERVAL 30 DAY) LIMIT 1`,
    { u: userId, d: deviceId }
  );
  return rows.length > 0;
}
export async function listUserDevices(userId: string): Promise<UserDeviceRow[]> {
  return q<UserDeviceRow[]>(
    `SELECT id, device_id, label, user_agent, created_at, last_seen_at FROM user_devices WHERE user_id = :u ORDER BY last_seen_at DESC`,
    { u: userId }
  );
}
export async function removeUserDevice(userId: string, id: string): Promise<void> {
  await q(`DELETE FROM user_devices WHERE user_id = :u AND id = :id`, { u: userId, id });
}
export async function renameUserDevice(userId: string, id: string, label: string): Promise<void> {
  await q(`UPDATE user_devices SET label = :l WHERE user_id = :u AND id = :id`, { l: label.slice(0, 120) || null, u: userId, id });
}
export async function removeUserDeviceByDeviceId(userId: string, deviceId: string): Promise<void> {
  await q(`DELETE FROM user_devices WHERE user_id = :u AND device_id = :d`, { u: userId, d: deviceId });
}
