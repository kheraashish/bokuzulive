import type { MetadataRoute } from "next";

// Robots: allow indexing of the public marketing pages; keep the app/auth/private areas out of
// search results. Points crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/portal", "/login"],
    },
    sitemap: "https://bokuzu.com/sitemap.xml",
    host: "https://bokuzu.com",
  };
}
