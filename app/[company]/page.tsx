import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getClient } from "@/lib/demo/clients";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

// Vanity client portal: bokuzu.com/<company>. The company in the URL is only a label; access comes
// from the signed session (here a demo cookie), NEVER the slug. So a logged-out visitor is sent to
// login, and a signed-in client can only ever see their OWN portal, not another company's.
//
// Demo note: the session is a plain cookie set at login. In production this becomes the httpOnly,
// HMAC-signed session (email + OTP) and getClient() becomes a tenant-scoped BigQuery read.
//
// Next 15: `params` and `cookies()` are async and must be awaited.
export const dynamic = "force-dynamic";

export default async function CompanyPortal({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const slug = decodeURIComponent(company || "").toLowerCase();

  const cookieStore = await cookies();
  const session = cookieStore.get("bokuzu_portal")?.value;
  if (!session) redirect(`/login?next=${encodeURIComponent(slug)}`);

  // A signed-in client can only view their own portal.
  if (session !== slug) redirect(`/${session}`);

  const client = getClient(slug);
  if (!client) notFound();

  return <PortalDashboard client={client} />;
}
