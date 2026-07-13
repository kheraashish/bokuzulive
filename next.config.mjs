import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a slim, self-contained server bundle (.next/standalone) so the app runs with a much
  // smaller memory footprint. `next start` still works unchanged, so this is non-breaking on hosts
  // that keep using it; hosts that run the standalone server get the memory savings.
  output: "standalone",
  // Pin the tracing root to this project so the standalone server lands at .next/standalone/server.js
  // (not nested under a guessed parent workspace), which is the path runtimes expect.
  outputFileTracingRoot: __dirname,
  // Don't let the CDN serve a year-old copy of the HTML pages. Next's default for static pages is a
  // 1-year `s-maxage` that assumes the CDN purges on deploy — Hostinger's CDN honors the year but does
  // NOT purge, so it keeps serving stale HTML that points at deleted asset hashes (→ CSS/JS 404 →
  // broken page). Force the pages to revalidate; the hashed /_next/static assets keep their own
  // immutable long cache (excluded below).
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
  // The dashboard preview's chrome bar shows "bokuzu.com/demo" — make that a real address by
  // redirecting /demo (and anything under it) to the live example dashboard.
  async redirects() {
    return [
      { source: "/demo", destination: "/example", permanent: true },
      { source: "/demo/:path*", destination: "/example", permanent: true },
    ];
  },
};

export default nextConfig;
