import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Demand / liquidity signal for a variant, derived from data we already collect:
 * how many users want it (closet status 'want') and watch it (watchlist). This is
 * the "timing verdict" input — high demand + thin supply means waiting costs
 * money; a slow mover means lowball away (see docs viz requirements, Tier 3).
 *
 * Privacy: watchlist/closet are RLS-owned, so we aggregate with the service-role
 * client and expose ONLY counts — never who. Server-only.
 */

export interface VariantDemand {
  wants: number;
  watchers: number;
  score: number;
  level: "quiet" | "warm" | "hot";
  label: string | null;
}

/** Pure: turn raw counts into a level + honest label. 'want' weighs 2x a watch. */
export function demandLevel(wants: number, watchers: number): VariantDemand {
  const score = wants * 2 + watchers;
  const level: VariantDemand["level"] = score >= 20 ? "hot" : score >= 5 ? "warm" : "quiet";
  const parts: string[] = [];
  if (wants > 0) parts.push(`${wants} want${wants === 1 ? "s" : ""} it`);
  if (watchers > 0) parts.push(`${watchers} watching`);
  const label = parts.length ? parts.join(" · ") : null;
  return { wants, watchers, score, level, label };
}

/** Count wants + watchers for a variant (privacy-safe; counts only). */
export async function getVariantDemand(variantId: number): Promise<VariantDemand> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return demandLevel(0, 0);
  try {
    const admin = getSupabaseAdmin();
    const [wantsRes, watchRes] = await Promise.all([
      admin.from("closet_item").select("closet_id", { count: "exact", head: true }).eq("variant_id", variantId).eq("status", "want"),
      admin.from("watchlist").select("watch_id", { count: "exact", head: true }).eq("variant_id", variantId),
    ]);
    return demandLevel(wantsRes.count ?? 0, watchRes.count ?? 0);
  } catch {
    return demandLevel(0, 0); // degrade gracefully — demand is a nice-to-have
  }
}

/**
 * The full shelf: how many people want / have / had this bag.
 *
 * Shown to EVERYONE, signed in or not (docs/ux/bag-page-build-plan.md principle 3).
 * Fragrantica hides its equivalent from logged-out visitors, so a first-time reader
 * never learns that 41.5K people own the thing they are considering. That wastes the
 * strongest social proof on the page on the audience that needs it least. The COUNTS
 * are public; only setting your own state needs an account.
 *
 * Same privacy posture as getVariantDemand: aggregated with the service-role client
 * because closet rows are RLS-owned, and we expose only counts, never who.
 */
export interface ShelfCounts {
  want: number;
  have: number;
  had: number;
  /** Total people with any relationship to this bag. */
  total: number;
  /**
   * Wants per owner. A bag many covet and few own reads very differently from the
   * reverse. Null when nobody owns it (the ratio would be meaningless, not infinite).
   */
  covetRatio: number | null;
}

export function shelfCountsFrom(want: number, have: number, had: number): ShelfCounts {
  return {
    want,
    have,
    had,
    total: want + have + had,
    covetRatio: have > 0 ? +(want / have).toFixed(2) : null,
  };
}

export async function getShelfCounts(variantId: number): Promise<ShelfCounts> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return shelfCountsFrom(0, 0, 0);
  try {
    const admin = getSupabaseAdmin();
    const count = (status: string) =>
      admin
        .from("closet_item")
        .select("closet_id", { count: "exact", head: true })
        .eq("variant_id", variantId)
        .eq("status", status);
    const [want, have, had] = await Promise.all([count("want"), count("have"), count("had")]);
    return shelfCountsFrom(want.count ?? 0, have.count ?? 0, had.count ?? 0);
  } catch {
    return shelfCountsFrom(0, 0, 0); // degrade to silence, never to a wrong number
  }
}
