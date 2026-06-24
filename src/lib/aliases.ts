/**
 * Bag-alias read helpers for the bag page (alias block + JSON-LD alternateName).
 * Pure transformers + a dependency-injected query so this doesn't couple to a specific
 * Supabase client. Backed by the `bag_alias` table (migration 0031).
 */

export interface BagAlias {
  brand: string;
  canonical_model: string;
  tier: string | null;
  alias: string;
  source_type: "official" | "reseller" | "community";
  source: string | null;
  listing_count: number;
}

/**
 * Clean alternate names for JSON-LD `alternateName` (GEO): the canonical/official name +
 * community nicknames — NOT the verbose reseller titles. Deduped case-insensitively,
 * excluding the canonical model itself (that's the primary `name`).
 */
export function toAlternateNames(aliases: BagAlias[], canonicalModel: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>([canonicalModel.toLowerCase()]);
  for (const a of aliases) {
    if (a.source_type === "reseller") continue; // titles are noisy; not alternateName-worthy
    const key = a.alias.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a.alias);
  }
  return out;
}

/** Reseller "also seen as" names grouped by platform, for the human-facing alias block. */
export function resellerNamesByPlatform(aliases: BagAlias[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const a of aliases) {
    if (a.source_type !== "reseller" || !a.source) continue;
    (out[a.source] ??= []).push(a.alias);
  }
  return out;
}

/** Collector nicknames (community layer), deduped. */
export function communityNicknames(aliases: BagAlias[]): string[] {
  const seen = new Set<string>();
  return aliases
    .filter((a) => a.source_type === "community")
    .map((a) => a.alias)
    .filter((n) => { const k = n.toLowerCase(); return seen.has(k) ? false : (seen.add(k), true); });
}

/** Minimal client shape needed — satisfied by a Supabase client. */
interface QueryClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): { eq(col: string, val: string): Promise<{ data: BagAlias[] | null; error: unknown }> };
    };
  };
}

/** Fetch aliases for one canonical bag. Pass canonical brand + model. */
export async function getBagAliases(client: QueryClient, brand: string, canonicalModel: string): Promise<BagAlias[]> {
  const { data, error } = await client
    .from("bag_alias")
    .select("brand, canonical_model, tier, alias, source_type, source, listing_count")
    .eq("brand", brand)
    .eq("canonical_model", canonicalModel);
  if (error) throw error;
  return data ?? [];
}
