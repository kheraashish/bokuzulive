import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConfigured } from "@/lib/db/pool";
import { getClientForLogin, isTrustedDevice, touchDevice } from "@/lib/db/auth";
import { verifyPassword, makeSession, make2fa, cookieOpts, SESSION_COOKIE, TWOFA_COOKIE, DEVICE_COOKIE } from "@/lib/clientAuth";
import { issueCode } from "@/lib/otp";

export const runtime = "nodejs";

// Step 1 of client login. Verify email + password, then either sign in or require 2FA.
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Portal not configured yet." }, { status: 503 });
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const client = await getClientForLogin(email);
  if (!client) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  if (!client.password_hash) return NextResponse.json({ status: "setup" }); // first time: set a password
  if (!verifyPassword(password, client.password_hash)) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const store = await cookies();
  const deviceId = store.get(DEVICE_COOKIE)?.value || "";
  const twoFaOn = client.twofa_email === 1 || client.twofa_sms === 1;
  const trusted = deviceId ? await isTrustedDevice(client.id, deviceId) : false;

  if (twoFaOn && !trusted) {
    const dev = await issueCode(client.login_email as string, { sms: client.twofa_sms === 1, phone: client.phone });
    const res = NextResponse.json({ status: "2fa", method: client.twofa_sms === 1 ? "sms" : "email", devCode: dev.devCode });
    res.cookies.set(TWOFA_COOKIE, make2fa(client.id), { ...cookieOpts, maxAge: 600 });
    return res;
  }

  if (trusted) await touchDevice(client.id, deviceId);
  const res = NextResponse.json({ status: "ok", slug: client.slug });
  res.cookies.set(SESSION_COOKIE, makeSession(client.id), { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });
  return res;
}
