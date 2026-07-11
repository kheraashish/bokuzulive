import { redirect } from "next/navigation";
import { dbConfigured } from "@/lib/db/pool";
import { currentContext, currentDeviceId } from "@/lib/portalCurrent";
import { listUserDevices } from "@/lib/db/users";
import { PortalHome } from "./PortalHome";

// The signed-in home: welcome, "Your Dashboard" button, settings, and support. Works for every
// signed-in user, whether or not their company is connected yet.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PortalPage() {
  if (!dbConfigured()) redirect("/login");
  const ctx = await currentContext();
  if (!ctx) redirect("/login");

  const thisDevice = await currentDeviceId();
  const devices = (await listUserDevices(ctx.user.id)).map((d) => ({
    id: d.id, label: d.label, lastSeen: String(d.last_seen_at), current: d.device_id === thisDevice,
  }));

  return (
    <PortalHome
      me={{
        email: ctx.user.email,
        name: ctx.user.name,
        phone: ctx.user.phone,
        smsCodes: ctx.user.twofa_sms === 1,
        brand: ctx.client?.brand ?? null,
        slug: ctx.client?.slug ?? null,
        logoUrl: ctx.client?.logo_url ?? null,
        linked: Boolean(ctx.client),
        live: ctx.live,
        agencyOnboarded: ctx.client?.agency_onboarded ?? null,
      }}
      devices={devices}
    />
  );
}
