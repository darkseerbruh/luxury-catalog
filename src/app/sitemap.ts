import type { MetadataRoute } from "next";
import { getSitemapTargets } from "@/lib/queries";
import { getPublishedPostSitemapTargets } from "@/lib/posts";
import { SITE_URL } from "@/lib/geo";

// Programmatic SEO/GEO: one entry per bag variant + brand, so search engines and
// AI crawlers can discover the whole catalog (docs/marketing-plan.md, Tier 1).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/identify`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/quiz`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/closets`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/found`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/posts`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const { variantIds, brandIds } = await getSitemapTargets();
  const posts = await getPublishedPostSitemapTargets();

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/posts/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brandIds.map((id) => ({
    url: `${SITE_URL}/brand/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const variantRoutes: MetadataRoute.Sitemap = variantIds.map((id) => ({
    url: `${SITE_URL}/bag/${id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes, ...brandRoutes, ...variantRoutes];
}
