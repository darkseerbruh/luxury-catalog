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
