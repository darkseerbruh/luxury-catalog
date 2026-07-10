import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Search is now the market. `/shop` is one surface where the text box, the filters, the
 * default grid, and the deals toggle compose (spec: docs/ux/unified-market-spec.md), so
 * `/search` redirects into it, preserving the query. Kept as a permanent alias so the many
 * `/search?q=…` links across the app (identify, bag pages, era, social) keep working.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  redirect(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
}
