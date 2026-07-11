import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConfigured } from "@/lib/db/pool";
import { removeDeviceByDeviceId } from "@/lib/db/auth";
import { readSession, cookieOpts, SESSION_COOKIE, DEVICE_COOKIE } from "@/lib/clientAuth";

export const runtime = "nodejs";

// Sign out. If forgetDevice is true, also un-trust this device so 2FA is asked next time and the
// device disappears from the client's device list. Otherwise the device stays trusted.
export async function POST(req: Request) {
  const { forgetDevice } = (await req.json().catch(() => ({}))) as { forgetDevice?: boolean };
  const store = await cookies();
  const session = readSession(store.get(SESSION_COOKIE)?.value);
  const deviceId = store.get(DEVICE_COOKIE)?.value;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });

  if (forgetDevice && session && deviceId && dbConfigured()) {
    await removeDeviceByDeviceId(session.clientId, deviceId).catch(() => {});
    res.cookies.set(DEVICE_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  }
  return res;
}
