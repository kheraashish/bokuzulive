import { NextResponse } from "next/server";
import { currentContext, currentDeviceId } from "@/lib/portalCurrent";
import { listUserDevices } from "@/lib/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in user's profile + security state, for the settings panel.
export async function GET() {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const thisDevice = await currentDeviceId();
  const devices = (await listUserDevices(ctx.user.id)).map((d) => ({
    id: d.id, label: d.label, userAgent: d.user_agent, lastSeen: d.last_seen_at, current: d.device_id === thisDevice,
  }));
  return NextResponse.json({
    email: ctx.user.email,
    name: ctx.user.name,
    phone: ctx.user.phone,
    role: ctx.user.role,
    smsCodes: ctx.user.twofa_sms === 1,
    brand: ctx.client?.brand ?? null,
    slug: ctx.client?.slug ?? null,
    linked: Boolean(ctx.client),
    live: ctx.live,
    devices,
  });
}
