import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { dbConfigured } from "@/lib/db/pool";
import { verifyCode } from "@/lib/db/auth";
import { findOrCreateUser, updateLastLogin, addUserDevice, getClientPublic, clientIsLive } from "@/lib/db/users";
import { makeSession, newDeviceId, cookieOpts, deviceCookieOpts, SESSION_COOKIE, DEVICE_COOKIE } from "@/lib/clientAuth";

export const runtime = "nodejs";

// Passwordless step 2. Verify the emailed code, create the account if new, and sign in. `remember`
// trusts this device for up to 30 days so no code is needed here next time.
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Portal not configured yet." }, { status: 503 });
  const { email, code, remember } = (await req.json().catch(() => ({}))) as { email?: string; code?: string; remember?: boolean };
  if (!email || !code) return NextResponse.json({ error: "Enter the code we emailed you." }, { status: 400 });
  if (!(await verifyCode(email, code))) return NextResponse.json({ error: "Wrong or expired code." }, { status: 401 });

  const user = await findOrCreateUser(email); // auto-creates the account on first sign-in
  await updateLastLogin(user.id);
  const client = user.client_id ? await getClientPublic(user.client_id) : null;
  const live = client ? await clientIsLive(client.id) : false;

  const res = NextResponse.json({ status: "ok", slug: client?.slug ?? null, live, linked: Boolean(client) });
  res.cookies.set(SESSION_COOKIE, makeSession(user.id), { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });

  if (remember) {
    const store = await cookies();
    let deviceId = store.get(DEVICE_COOKIE)?.value;
    if (!deviceId) {
      deviceId = newDeviceId();
      res.cookies.set(DEVICE_COOKIE, deviceId, deviceCookieOpts);
    }
    const ua = (await headers()).get("user-agent") || "";
    await addUserDevice(user.id, deviceId, { label: deviceLabel(ua), ua });
  }
  return res;
}

function deviceLabel(ua: string): string {
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "device";
  const br = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "browser";
  return `${br} on ${os}`;
}
