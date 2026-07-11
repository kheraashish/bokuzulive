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
};

export default nextConfig;
