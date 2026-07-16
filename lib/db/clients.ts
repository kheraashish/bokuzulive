import "server-only";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { q } from "./pool";
import { invalidateSlugCache } from "./users";
import { encrypt } from "@/lib/crypto";

// Data access for clients + their ad-account connections. All writes go through here.

export type Platform = "google" | "meta";

export interface ClientRow extends RowDataPacket {
  id: string;
  slug: string;
  brand: string;
  currency: string;
  login_email: string | null;
  status: string;
  created_at: Date;
}

export interface ConnectionRow extends RowDataPacket {
  id: string;
  client_id: string;
  platform: Platform;
  external_account_id: string | null;
  account_name: string | null;
  status: string;
  last_synced_at: Date | null;
  last_error: string | null;
}

const id = () => crypto.randomUUID();
const norm = (s: string) => s.trim().toLowerCase();

/** Create a client. `slug` is the vanity URL; must be unique and url-safe. */
export async function createClient(input: {
  slug: string;
  brand: string;
  currency?: string;
  loginEmail?: string | null;
}): Promise<string> {
  const clientId = id();
  await q(
    `INSERT INTO clients (id, slug, brand, currency, login_email)
     VALUES (:id, :slug, :brand, :currency, :email)`,
    {
      id: clientId,
      slug: norm(input.slug).replace(/[^a-z0-9-]/g, ""),
      brand: input.brand.trim(),
      currency: (input.currency || "CAD").toUpperCase(),
      email: input.loginEmail ? norm(input.loginEmail) : null,
    }
  );
  invalidateSlugCache(); // a brand-new company must resolve immediately, not after the TTL
  return clientId;
}

export async function listClients(): Promise<ClientRow[]> {
  return q<ClientRow[]>(`SELECT * FROM clients ORDER BY created_at DESC`);
}

export async function getClientBySlug(slug: string): Promise<ClientRow | null> {
  const rows = await q<ClientRow[]>(`SELECT * FROM clients WHERE slug = :slug LIMIT 1`, { slug: norm(slug) });
  return rows[0] ?? null;
}

export async function getClientByEmail(email: string): Promise<ClientRow | null> {
  const rows = await q<ClientRow[]>(`SELECT * FROM clients WHERE login_email = :email LIMIT 1`, { email: norm(email) });
  return rows[0] ?? null;
}

export async function updateClient(
  clientId: string,
  fields: { brand?: string; currency?: string; loginEmail?: string | null; status?: string }
): Promise<void> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id: clientId };
  if (fields.brand !== undefined) { sets.push("brand = :brand"); params.brand = fields.brand.trim(); }
  if (fields.currency !== undefined) { sets.push("currency = :currency"); params.currency = fields.currency.toUpperCase(); }
  if (fields.loginEmail !== undefined) { sets.push("login_email = :email"); params.email = fields.loginEmail ? norm(fields.loginEmail) : null; }
  if (fields.status !== undefined) { sets.push("status = :status"); params.status = fields.status; }
  if (!sets.length) return;
  await q(`UPDATE clients SET ${sets.join(", ")} WHERE id = :id`, params);
}

export async function getConnections(clientId: string): Promise<ConnectionRow[]> {
  return q<ConnectionRow[]>(
    `SELECT id, client_id, platform, external_account_id, account_name, status, last_synced_at, last_error
     FROM connections WHERE client_id = :id ORDER BY platform`,
    { id: clientId }
  );
}

/** Create or update a connection's tokens after a successful OAuth grant. Tokens are encrypted here. */
export async function saveConnection(input: {
  clientId: string;
  platform: Platform;
  externalAccountId?: string | null;
  accountName?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  status?: string;
}): Promise<void> {
  await q(
    `INSERT INTO connections
       (id, client_id, platform, external_account_id, account_name, access_token_enc, refresh_token_enc, token_expires_at, status)
     VALUES
       (:id, :client_id, :platform, :ext, :name, :atok, :rtok, :exp, :status)
     ON DUPLICATE KEY UPDATE
       external_account_id = VALUES(external_account_id),
       account_name        = VALUES(account_name),
       access_token_enc    = COALESCE(VALUES(access_token_enc), access_token_enc),
       refresh_token_enc   = COALESCE(VALUES(refresh_token_enc), refresh_token_enc),
       token_expires_at    = VALUES(token_expires_at),
       status              = VALUES(status),
       last_error          = NULL`,
    {
      id: id(),
      client_id: input.clientId,
      platform: input.platform,
      ext: input.externalAccountId ?? null,
      name: input.accountName ?? null,
      atok: input.accessToken ? encrypt(input.accessToken) : null,
      rtok: input.refreshToken ? encrypt(input.refreshToken) : null,
      exp: input.tokenExpiresAt ?? null,
      status: input.status ?? "connected",
    }
  );
}
