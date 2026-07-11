import type { MetadataRoute } from "next";

const SITE = "https://bokuzu.com";

// The public, indexable pages. Auth/private routes are intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/example`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
