import type { MetadataRoute } from "next";
import { getSitemapTargets } from "@/lib/queries";
import { getPublishedPostSitemapTargets } from "@/lib/posts";
import { SITE_URL } from "@/lib/geo";
import { VENUES } from "@/lib/where-to-buy";

// Programmatic SEO/GEO: one entry per bag variant + brand, so search engines and
// AI crawlers can discover the whole catalog (docs/marketing-plan.md, Tier 1).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    // NOTE: /deals is deliberately absent — it's a redirect stub to /shop
    // (src/app/deals/page.tsx), and listing a redirecting URL here gets it
    // reported as "Page with redirect" in Search Console instead of indexed.
    { url: `${SITE_URL}/coveted`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/browse`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/identify`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/quiz`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/coveted-closets`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/found`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // The LC Index — a citable ranked asset; recomputed monthly (docs/ux/lc-index-spec.md).
    { url: `${SITE_URL}/rankings`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/rankings/how-we-rank`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    // Where to Buy — the venue trust hub (docs/ux/where-to-buy-spec.md).
    { url: `${SITE_URL}/where-to-buy`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  // One entry per venue profile — each is the direct answer to an "is X legit" query.
  const venueRoutes: MetadataRoute.Sitemap = VENUES.map((v) => ({
    url: `${SITE_URL}/where-to-buy/${v.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  staticRoutes.push(...venueRoutes);

  const { variantIds, brandIds } = await getSitemapTargets();
  const posts = await getPublishedPostSitemapTargets();

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/articles/${p.slug}`,
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
