import { NextResponse } from "next/server";
import { currentClient, currentDeviceId } from "@/lib/portalCurrent";
import { listDevices } from "@/lib/db/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Current client's profile + security state, for the settings panel.
export async function GET() {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const thisDevice = await currentDeviceId();
  const devices = (await listDevices(client.id)).map((d) => ({
    id: d.id,
    label: d.label,
    userAgent: d.user_agent,
    lastSeen: d.last_seen_at,
    current: d.device_id === thisDevice,
  }));
  return NextResponse.json({
    brand: client.brand,
    slug: client.slug,
    email: client.login_email,
    phone: client.phone,
    hasPassword: Boolean(client.password_hash),
    twofaEmail: client.twofa_email === 1,
    twofaSms: client.twofa_sms === 1,
    devices,
  });
}
