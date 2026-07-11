import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConfigured } from "@/lib/db/pool";
import { findUserByEmail, isUserDeviceTrusted, updateLastLogin, getClientPublic, clientIsLive } from "@/lib/db/users";
import { makeSession, cookieOpts, SESSION_COOKIE, DEVICE_COOKIE } from "@/lib/clientAuth";
import { issueCode } from "@/lib/otp";

export const runtime = "nodejs";

// Passwordless step 1. Enter email. If this device is already trusted (remembered), sign in
// straight away. Otherwise send a one-time code (valid 30 minutes).
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Portal not configured yet." }, { status: 503 });
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  const store = await cookies();
  const deviceId = store.get(DEVICE_COOKIE)?.value || "";
  const existing = await findUserByEmail(email);

  // Trusted device -> sign in without a code.
  if (existing && deviceId && (await isUserDeviceTrusted(existing.id, deviceId))) {
    await updateLastLogin(existing.id);
    const client = existing.client_id ? await getClientPublic(existing.client_id) : null;
    const live = client ? await clientIsLive(client.id) : false;
    const res = NextResponse.json({ status: "ok", slug: client?.slug ?? null, live, linked: Boolean(client) });
    res.cookies.set(SESSION_COOKIE, makeSession(existing.id), { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });
    return res;
  }

  // Authenticator-app user -> prompt for the app code (no email sent).
  if (existing && existing.twofa_totp === 1) {
    return NextResponse.json({ status: "totp" });
  }

  const dev = await issueCode(email);
  if (!dev.sent && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "We couldn't email your code right now. Please try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ status: "otp", devCode: dev.devCode });
}
