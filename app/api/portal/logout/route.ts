import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConfigured } from "@/lib/db/pool";
import { removeUserDeviceByDeviceId } from "@/lib/db/users";
import { readSession, cookieOpts, SESSION_COOKIE, DEVICE_COOKIE } from "@/lib/clientAuth";

export const runtime = "nodejs";

// Sign out. forgetDevice = un-trust this device (a code is required next time and it leaves the
// device list). Otherwise the device stays remembered.
export async function POST(req: Request) {
  const { forgetDevice } = (await req.json().catch(() => ({}))) as { forgetDevice?: boolean };
  const store = await cookies();
  const session = readSession(store.get(SESSION_COOKIE)?.value);
  const deviceId = store.get(DEVICE_COOKIE)?.value;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });

  if (forgetDevice && session && deviceId && dbConfigured()) {
    await removeUserDeviceByDeviceId(session.clientId, deviceId).catch(() => {});
    res.cookies.set(DEVICE_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  }
  return res;
}
