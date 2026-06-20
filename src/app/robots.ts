import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/geo";

// Crawlable everywhere except the unauthenticated admin dashboards. Points
// crawlers (incl. Bing, which powers ChatGPT search) at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
