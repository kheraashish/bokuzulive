import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const title = "Bokuzu: honest client acquisition at machine speed";
const description =
  "Bokuzu audits prospects on public data, scores creative craft against a rubric it will not fake, drafts sample concepts, and proposes every outward move for your approval. No invented metrics. Nothing sent without you.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bokuzu.com"),
  title,
  description,
  applicationName: "Bokuzu",
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Bokuzu",
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
