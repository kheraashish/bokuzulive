import { redirect } from "next/navigation";
import { dbConfigured } from "@/lib/db/pool";
import { currentContext } from "@/lib/portalCurrent";
import { DashboardShell } from "./DashboardShell";

// The client's live dashboard at bokuzu.com/<company>. Access = signed-in user linked to this
// company, and the company is live (an ad account is connected). Otherwise back to /portal.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CompanyPortal({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const slug = decodeURIComponent(company || "").toLowerCase();

  if (!dbConfigured()) redirect("/login");
  const ctx = await currentContext();
  if (!ctx) redirect(`/login`);
  if (!ctx.client || ctx.client.slug !== slug) redirect("/portal");
  if (!ctx.live) redirect("/portal"); // not connected yet -> welcome/wait screen

  return <DashboardShell brand={ctx.client.brand} logoUrl={ctx.client.logo_url} email={ctx.user.email} />;
}
