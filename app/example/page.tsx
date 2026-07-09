import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/demo/clients";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

// Public, un-gated preview of the client dashboard using sample Demo Client data. Lets visitors
// see exactly what a client sees, without an account. Rendered in `example` mode (ribbon + "back
// to site" instead of sign out). The real per-client portal stays behind login at /<company>.
export const metadata: Metadata = {
  title: "Dashboard example · Bokuzu",
  description: "A live preview of the Bokuzu client dashboard, using sample Demo Client data.",
};

export default function ExamplePage() {
  const client = getClient("healthyplanet");
  if (!client) notFound();
  return <PortalDashboard client={client} example />;
}
