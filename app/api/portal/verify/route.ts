import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { dbConfigured } from "@/lib/db/pool";
import { getClientById, verifyCode, addTrustedDevice } from "@/lib/db/auth";
import {
  read2fa, makeSession, newDeviceId, cookieOpts, deviceCookieOpts,
  SESSION_COOKIE, TWOFA_COOKIE, DEVICE_COOKIE,
} from "@/lib/clientAuth";

export const runtime = "nodejs";

// Step 2 of client login: verify the one-time code, then sign in. `remember` trusts this device so
// 2FA is skipped next time.
export async function POST(req: Request) {
  if (!dbConfigured()) return NextResponse.json({ error: "Portal not configured yet." }, { status: 503 });
  const { code, remember } = (await req.json().catch(() => ({}))) as { code?: string; remember?: boolean };

  const store = await cookies();
  const ticket = read2fa(store.get(TWOFA_COOKIE)?.value);
  if (!ticket) return NextResponse.json({ error: "Your login expired. Start again." }, { status: 401 });

  const client = await getClientById(ticket.clientId);
  if (!client || !client.login_email) return NextResponse.json({ error: "Account not found." }, { status: 401 });
  if (!code || !(await verifyCode(client.login_email, code))) return NextResponse.json({ error: "Wrong or expired code." }, { status: 401 });

  const res = NextResponse.json({ status: "ok", slug: client.slug });
  res.cookies.set(SESSION_COOKIE, makeSession(client.id), { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });
  res.cookies.set(TWOFA_COOKIE, "", { ...cookieOpts, maxAge: 0 });

  if (remember) {
    let deviceId = store.get(DEVICE_COOKIE)?.value;
    if (!deviceId) {
      deviceId = newDeviceId();
      res.cookies.set(DEVICE_COOKIE, deviceId, deviceCookieOpts);
    }
    const ua = (await headers()).get("user-agent") || "";
    await addTrustedDevice(client.id, deviceId, { label: deviceLabel(ua), ua });
  }
  return res;
}

function deviceLabel(ua: string): string {
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "device";
  const br = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "browser";
  return `${br} on ${os}`;
}
