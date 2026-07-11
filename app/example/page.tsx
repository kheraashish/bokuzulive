import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/demo/clients";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

// Public, un-gated preview of the client dashboard using sample Demo Client data. Lets visitors
// see exactly what a client sees, without an account. Rendered in `example` mode (ribbon + "back
// to site" instead of sign out). The real per-client portal stays behind login at /<company>.
export const metadata: Metadata = {
  title: { absolute: "Live Client Dashboard Example — Bokuzu by Lautzu" },
  description:
    "A sample Bokuzu client dashboard: Google and Meta spend, ROAS and CPA per platform, funnel breakdown, live ads, and a full log of agency optimizations — synced with every platform refresh, never fabricated.",
  alternates: { canonical: "/example" },
  openGraph: {
    title: "Live Client Dashboard Example — Bokuzu by Lautzu",
    description:
      "A sample Bokuzu client dashboard: Google and Meta spend, ROAS and CPA per platform, funnel breakdown, live ads, and a full log of agency optimizations — synced with every platform refresh, never fabricated.",
    url: "https://bokuzu.com/example",
    type: "website",
    siteName: "Bokuzu",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Client Dashboard Example — Bokuzu by Lautzu",
    description:
      "A sample Bokuzu client dashboard: Google and Meta spend, ROAS and CPA per platform, live ads, and a full log of agency optimizations — synced with every platform refresh.",
    images: ["/twitter-image.png"],
  },
};

export default function ExamplePage() {
  const client = getClient("healthyplanet");
  if (!client) notFound();
  return <PortalDashboard client={client} example />;
}
