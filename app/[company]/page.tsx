import { redirect } from "next/navigation";
import { dbConfigured } from "@/lib/db/pool";
import { currentContext, currentDeviceId } from "@/lib/portalCurrent";
import { listUserDevices } from "@/lib/db/users";
import { ClientHub } from "./ClientHub";

// The client's portal hub at bokuzu.com/<company>: Dashboard / Support / Settings tabs. Access =
// signed-in user linked to this company (who has finished setup). Otherwise routed appropriately.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CompanyPortal({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const slug = decodeURIComponent(company || "").toLowerCase();

  if (!dbConfigured()) redirect("/login");
  const ctx = await currentContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(slug)}`);
  if (!ctx.client || !ctx.client.agency_onboarded) redirect("/portal"); // finish setup first
  if (ctx.client.slug !== slug) redirect(`/${ctx.client.slug}`);

  const thisDevice = await currentDeviceId();
  const devices = (await listUserDevices(ctx.user.id)).map((d) => ({
    id: d.id, label: d.label, lastSeen: String(d.last_seen_at), current: d.device_id === thisDevice,
  }));

  return (
    <ClientHub
      me={{
        email: ctx.user.email,
        name: ctx.user.name,
        phone: ctx.user.phone,
        smsCodes: ctx.user.twofa_sms === 1,
        authenticator: ctx.user.twofa_totp === 1,
        brand: ctx.client.brand,
        slug: ctx.client.slug,
        logoUrl: ctx.client.logo_url,
        live: ctx.live,
        agencyOnboarded: ctx.client.agency_onboarded,
      }}
      devices={devices}
    />
  );
}
