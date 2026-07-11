import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const SITE = "https://bokuzu.com";
const title = "Bokuzu — Client Transparency Portal & Honest Outreach Engine by Lautzu";
const description =
  "Bokuzu is the transparency portal behind Lautzu, a performance marketing agency. Clients see Google & Meta ad spend, ROAS and every optimization we make — analysis ready the moment the platforms refresh. Prospect audits on public data that never fabricate a metric.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: title,
    template: "%s · Bokuzu",
  },
  description,
  applicationName: "Bokuzu",
  keywords: [
    "Bokuzu",
    "bokuzu",
    "Bokuzu Lautzu",
    "Lautzu",
    "Lautzu agency",
    "client acquisition",
    "ad performance dashboard",
    "Google Ads reporting",
    "Meta Ads reporting",
    "agency client portal",
    "honest marketing metrics",
  ],
  authors: [{ name: "Lautzu", url: "https://lautzu.com" }],
  creator: "Lautzu",
  publisher: "Bokuzu",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    title,
    description,
    url: SITE,
    type: "website",
    siteName: "Bokuzu",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#16121A",
  colorScheme: "dark",
};

// Structured data: tells Google that Bokuzu is a product by Lautzu (helps the two associate in search).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#org`,
      name: "Bokuzu",
      url: SITE,
      logo: `${SITE}/icon.svg`,
      email: "support@bokuzu.com",
      description,
      sameAs: ["https://lautzu.com"],
      parentOrganization: { "@type": "Organization", name: "Lautzu", url: "https://lautzu.com" },
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@bokuzu.com",
        contactType: "customer support",
      },
      address: { "@type": "PostalAddress", addressCountry: "CA" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "Bokuzu",
      url: SITE,
      publisher: { "@id": `${SITE}/#org` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-plum-line/60 px-5 py-5 text-center">
          <a href="mailto:support@bokuzu.com" className="font-mono text-[11px] text-ash transition-colors hover:text-bone">
            support@bokuzu.com
          </a>
        </footer>
      </body>
    </html>
  );
}
