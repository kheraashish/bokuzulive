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
      <body className="flex min-h-screen flex-col">
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
