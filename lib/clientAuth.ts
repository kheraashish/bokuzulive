import "server-only";
import crypto from "crypto";

// Client-side auth primitives: password hashing (scrypt), signed session cookies (HMAC), one-time
// codes, and device IDs for "remember this device". Keys are derived from TOKEN_ENC_KEY so there is
// no extra secret to manage.

export const SESSION_COOKIE = "bokuzu_session";
export const DEVICE_COOKIE = "bokuzu_device";
export const TWOFA_COOKIE = "bokuzu_2fa";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TWOFA_TTL_MS = 10 * 60 * 1000; // 10 min window to complete 2FA after the password step

export const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
export const deviceCookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 400 * 24 * 60 * 60 };

function hkey(purpose: string): Buffer {
  const base = process.env.TOKEN_ENC_KEY || "";
  if (!base) throw new Error("TOKEN_ENC_KEY not set.");
  return crypto.createHash("sha256").update(`${base}:${purpose}`).digest();
}

// ── passwords ────────────────────────────────────────────────────────────────
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(pw, salt, 32);
  return `s1.${salt.toString("base64url")}.${dk.toString("base64url")}`;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [v, saltB, hashB] = stored.split(".");
  if (v !== "s1" || !saltB || !hashB) return false;
  const dk = crypto.scryptSync(pw, Buffer.from(saltB, "base64url"), 32);
  const want = Buffer.from(hashB, "base64url");
  return dk.length === want.length && crypto.timingSafeEqual(dk, want);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Use upper, lower, and a number.";
  return null;
}

// ── sessions (signed cookie) ──────────────────────────────────────────────────
interface SessionClaim { c: string; exp: number }

export function makeSession(clientId: string): string {
  const claim: SessionClaim = { c: clientId, exp: Date.now() + SESSION_TTL_MS };
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const mac = crypto.createHmac("sha256", hkey("session")).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function readSession(value: string | undefined | null): { clientId: string } | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const mac = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(crypto.createHmac("sha256", hkey("session")).update(payload).digest("base64url"));
  if (mac.length !== expected.length || !crypto.timingSafeEqual(mac, expected)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaim;
    if (typeof claim.exp !== "number" || claim.exp < Date.now()) return null;
    return { clientId: claim.c };
  } catch {
    return null;
  }
}

// ── 2FA pending ticket (proves the password step passed) ──────────────────────
export function make2fa(clientId: string): string {
  const claim: SessionClaim = { c: clientId, exp: Date.now() + TWOFA_TTL_MS };
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const mac = crypto.createHmac("sha256", hkey("twofa")).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}
export function read2fa(value: string | undefined | null): { clientId: string } | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const mac = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(crypto.createHmac("sha256", hkey("twofa")).update(payload).digest("base64url"));
  if (mac.length !== expected.length || !crypto.timingSafeEqual(mac, expected)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaim;
    if (typeof claim.exp !== "number" || claim.exp < Date.now()) return null;
    return { clientId: claim.c };
  } catch {
    return null;
  }
}

// ── one-time codes + device ids ───────────────────────────────────────────────
export function newCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}
export function hashCode(code: string, email: string): string {
  return crypto.createHash("sha256").update(`${code}:${email.toLowerCase()}`).digest("base64url");
}
export function newDeviceId(): string {
  return crypto.randomBytes(24).toString("base64url");
}
