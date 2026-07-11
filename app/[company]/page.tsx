import { redirect } from "next/navigation";
import { dbConfigured } from "@/lib/db/pool";
import { currentClient, currentDeviceId } from "@/lib/portalCurrent";
import { listDevices } from "@/lib/db/auth";
import { getConnections } from "@/lib/db/clients";
import { ClientPortal } from "./ClientPortal";

// Real client portal at bokuzu.com/<company>. Access comes from the signed session, never the slug.
// Logged out -> login. Logged in as another company -> your own portal.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CompanyPortal({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const slug = decodeURIComponent(company || "").toLowerCase();

  if (!dbConfigured()) redirect("/login");
  const client = await currentClient();
  if (!client) redirect(`/login?next=${encodeURIComponent(slug)}`);
  if (client.slug !== slug) redirect(`/${client.slug}`);

  const thisDevice = await currentDeviceId();
  const devices = (await listDevices(client.id)).map((d) => ({
    id: d.id, label: d.label, userAgent: d.user_agent, lastSeen: String(d.last_seen_at), current: d.device_id === thisDevice,
  }));
  const connections = (await getConnections(client.id)).map((c) => ({
    platform: c.platform, status: c.status, accountId: c.external_account_id,
  }));

  return (
    <ClientPortal
      profile={{
        brand: client.brand,
        slug: client.slug,
        email: client.login_email,
        phone: client.phone,
        twofaEmail: client.twofa_email === 1,
        twofaSms: client.twofa_sms === 1,
      }}
      devices={devices}
      connections={connections}
    />
  );
}
