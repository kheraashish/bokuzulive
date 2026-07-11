import { redirect } from "next/navigation";
import { dbConfigured } from "@/lib/db/pool";
import { currentContext } from "@/lib/portalCurrent";
import { SetupFlow } from "./SetupFlow";

// /portal handles brand-new users: account setup + the agency question. Once they have a company
// and have answered, we send them to their hub at /<slug>.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PortalPage() {
  if (!dbConfigured()) redirect("/login");
  const ctx = await currentContext();
  if (!ctx) redirect("/login");

  if (ctx.client && ctx.client.agency_onboarded) redirect(`/${ctx.client.slug}`);

  return <SetupFlow needsCompany={!ctx.client} />;
}
