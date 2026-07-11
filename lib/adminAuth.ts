import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

// Operator gate for the /admin console. A single shared password (OPERATOR_KEY env var). On success
// we set an httpOnly cookie holding a hash of the key (never the raw key), and check it on each visit.

const COOKIE = "bokuzu_operator";

export function operatorConfigured(): boolean {
  return Boolean(process.env.OPERATOR_KEY);
}

function expectedToken(): string {
  return crypto.createHash("sha256").update(`op:${process.env.OPERATOR_KEY || ""}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkOperatorKey(key: string): boolean {
  const k = process.env.OPERATOR_KEY || "";
  return Boolean(k) && safeEqual(key, k);
}

export function operatorCookie() {
  return {
    name: COOKIE,
    value: expectedToken(),
    opts: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 },
  };
}

export function clearOperatorCookie() {
  return { name: COOKIE, value: "", opts: { path: "/", maxAge: 0 } };
}

export async function isOperator(): Promise<boolean> {
  if (!operatorConfigured()) return false;
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  return Boolean(v) && safeEqual(v as string, expectedToken());
}
