import { unstable_cache } from "next/cache";
import { getSupabase } from "./supabase";
import { HOMEPAGE_OCCASION_BOARDS, OCCASIONS, type Occasion } from "./occasions";
import { CACHE_MARKET } from "./cache";

const OCCASION_TITLE = new Map<Occasion, string>(OCCASIONS.map((o) => [o.value, o.board]));

/**
 * Review-powered leaderboards for the homepage "What the community knows" section
 * (docs/ux/review-data-leaderboards.md). Built only from OPINION signals owners
 * give in reviews: overall rating, durability, and worth-it. Market facts like
 * value retention are computed from price data elsewhere, never voted on.
 *
 * RESILIENT: every read degrades to empty on missing env / unapplied migration /
 * query error, so the homepage never breaks. Boards also hide until they clear a
 * minimum number of ratings, so we never show a ranking built on one opinion.
 */

const MIN_RATINGS = 2; // a board needs at least this many ratings to be honest

export interface LeaderboardEntry {
  variantId: number;
  brandName: string;
  styleName: string;
  /** The metric to display, already formatted (e.g. "4.8" or "92% worth it"). */
  value: string;
  /** How many reviews backed it, for an honest "from N reviews" label. */
  count: number;
}

export interface ReviewLeaderboards {
  mostDurable: LeaderboardEntry[];
  highestRated: LeaderboardEntry[];
  mostWorthIt: LeaderboardEntry[];
  /** "Best for {occasion}" boards keyed by occasion (only those with data appear). */
  byOccasion: { occasion: Occasion; title: string; entries: LeaderboardEntry[] }[];
}

const EMPTY: ReviewLeaderboards = {
  mostDurable: [],
  highestRated: [],
  mostWorthIt: [],
  byOccasion: [],
};

interface Agg {
  variantId: number;
  ratingSum: number;
  ratingCount: number;
  durabilitySum: number;
  durabilityCount: number;
  worthItYes: number;
  worthItCount: number;
  /** Per-occasion rating sums/counts → "best for evening/work/travel" boards. */
  occasion: Map<Occasion, { sum: number; count: number }>;
}

async function loadReviewLeaderboards(perBoard = 5): Promise<ReviewLeaderboards> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("review")
      .select("variant_id, rating, worth_it, durability_rating, occasion");
    if (error || !data || data.length === 0) return EMPTY;

    // Aggregate per variant in JS (the supabase-js client has no group-by),
    // mirroring getCovetedClosets / getMostWantedBags.
    const byVariant = new Map<number, Agg>();
    for (const r of data as {
      variant_id: number;
      rating: number | null;
      worth_it: boolean | null;
      durability_rating: number | null;
      occasion: string | null;
    }[]) {
      let a = byVariant.get(r.variant_id);
      if (!a) {
        a = {
          variantId: r.variant_id,
          ratingSum: 0,
          ratingCount: 0,
          durabilitySum: 0,
          durabilityCount: 0,
          worthItYes: 0,
          worthItCount: 0,
          occasion: new Map(),
        };
        byVariant.set(r.variant_id, a);
      }
      if (typeof r.rating === "number") {
        a.ratingSum += r.rating;
        a.ratingCount += 1;
        // An occasion board ranks bags by rating among reviews tagged that
        // occasion ("best night-out bag" = highest-rated by evening reviewers).
        if (r.occasion && HOMEPAGE_OCCASION_BOARDS.includes(r.occasion as Occasion)) {
          const occ = r.occasion as Occasion;
          const o = a.occasion.get(occ) ?? { sum: 0, count: 0 };
          o.sum += r.rating;
          o.count += 1;
          a.occasion.set(occ, o);
        }
      }
      if (typeof r.durability_rating === "number") {
        a.durabilitySum += r.durability_rating;
        a.durabilityCount += 1;
      }
      if (typeof r.worth_it === "boolean") {
        a.worthItCount += 1;
        if (r.worth_it) a.worthItYes += 1;
      }
    }

    const aggs = [...byVariant.values()];
    const durable = aggs
      .filter((a) => a.durabilityCount >= MIN_RATINGS)
      .sort((a, b) => b.durabilitySum / b.durabilityCount - a.durabilitySum / a.durabilityCount)
      .slice(0, perBoard);
    const rated = aggs
      .filter((a) => a.ratingCount >= MIN_RATINGS)
      .sort((a, b) => b.ratingSum / b.ratingCount - a.ratingSum / a.ratingCount)
      .slice(0, perBoard);
    const worthIt = aggs
      .filter((a) => a.worthItCount >= MIN_RATINGS)
      .sort((a, b) => b.worthItYes / b.worthItCount - a.worthItYes / a.worthItCount)
      .slice(0, perBoard);

    // Per-occasion: rank variants by their average rating among reviews tagged
    // that occasion, same MIN_RATINGS honesty gate as the other boards.
    const occasionAggs = new Map<Occasion, { agg: Agg; avg: number; count: number }[]>();
    for (const occ of HOMEPAGE_OCCASION_BOARDS) {
      const ranked = aggs
        .map((a) => {
          const o = a.occasion.get(occ);
          return o && o.count >= MIN_RATINGS ? { agg: a, avg: o.sum / o.count, count: o.count } : null;
        })
        .filter((x): x is { agg: Agg; avg: number; count: number } => x !== null)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, perBoard);
      if (ranked.length > 0) occasionAggs.set(occ, ranked);
    }

    // Resolve names for the union of variants that made any board.
    const occasionVariantIds = [...occasionAggs.values()].flat().map((r) => r.agg.variantId);
    const ids = [
      ...new Set([...durable, ...rated, ...worthIt].map((a) => a.variantId).concat(occasionVariantIds)),
    ];
    if (ids.length === 0) return EMPTY;
    const names = await resolveVariantNames(ids);

    const entry = (a: Agg, value: string, count: number): LeaderboardEntry | null => {
      const n = names.get(a.variantId);
      if (!n) return null;
      return { variantId: a.variantId, brandName: n.brandName, styleName: n.styleName, value, count };
    };
    const clean = (xs: (LeaderboardEntry | null)[]) => xs.filter((x): x is LeaderboardEntry => x !== null);

    return {
      mostDurable: clean(
        durable.map((a) => entry(a, (a.durabilitySum / a.durabilityCount).toFixed(1), a.durabilityCount))
      ),
      highestRated: clean(
        rated.map((a) => entry(a, (a.ratingSum / a.ratingCount).toFixed(1), a.ratingCount))
      ),
      mostWorthIt: clean(
        worthIt.map((a) =>
          entry(a, `${Math.round((a.worthItYes / a.worthItCount) * 100)}% worth it`, a.worthItCount)
        )
      ),
      byOccasion: HOMEPAGE_OCCASION_BOARDS.flatMap((occ) => {
        const ranked = occasionAggs.get(occ);
        if (!ranked) return [];
        const entries = clean(ranked.map((r) => entry(r.agg, r.avg.toFixed(1), r.count)));
        return entries.length > 0
          ? [{ occasion: occ, title: OCCASION_TITLE.get(occ) ?? "Best for this", entries }]
          : [];
      }),
    };
  } catch {
    return EMPTY;
  }
}

// ============ Data-derived board: value retention (price_history, not votes) ============
// Value retention is a market FACT (resale median ÷ original retail), never a crowd
// vote — see the "facts aren't votes" rule in docs/ux/review-data-leaderboards.md.

const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function embeddedStyleName(
  style:
    | { name: string; brand: { name: string } | { name: string }[] | null }
    | { name: string; brand: { name: string } | { name: string }[] | null }[]
    | null
): { brandName: string; styleName: string } {
  const s = Array.isArray(style) ? style[0] : style;
  if (!s) return { brandName: "", styleName: "" };
  const b = Array.isArray(s.brand) ? s.brand[0] : s.brand;
  return { brandName: b?.name ?? "", styleName: s.name ?? "" };
}

/**
 * Bags that hold their value best: resale median as a percent of original retail,
 * ranked high to low. Mirrors the deals.ts resale/retail split exactly. Resilient:
 * any missing env / pre-0021 column / query error yields [].
 */
async function loadValueRetentionLeaders(perBoard = 5): Promise<LeaderboardEntry[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("price_history")
      .select(
        "variant_id, sale_price, platform, price_type, variant:variant_id(retail_price_original, style:style_id(name, brand:brand_id(name)))"
      )
      .not("sale_price", "is", null)
      .limit(50000);
    if (error || !data) return [];

    type G = { variantId: number; resale: number[]; retail: number | null; brandName: string; styleName: string };
    const groups = new Map<number, G>();
    for (const row of data as {
      variant_id: number;
      sale_price: number | string | null;
      platform: string | null;
      price_type: string | null;
      variant:
        | { retail_price_original: number | string | null; style: Parameters<typeof embeddedStyleName>[0] }
        | { retail_price_original: number | string | null; style: Parameters<typeof embeddedStyleName>[0] }[]
        | null;
    }[]) {
      const price = row.sale_price != null ? Number(row.sale_price) : null;
      if (price == null || !Number.isFinite(price) || price <= 0) continue;

      let g = groups.get(row.variant_id);
      if (!g) {
        const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) ?? null;
        const retail = v?.retail_price_original != null ? Number(v.retail_price_original) : null;
        const { brandName, styleName } = embeddedStyleName(v?.style ?? null);
        g = { variantId: row.variant_id, resale: [], retail, brandName, styleName };
        groups.set(row.variant_id, g);
      }

      const isRetail =
        row.price_type === "retail_msrp" ||
        (row.price_type == null && row.platform != null && RETAIL_PLATFORM_RX.test(row.platform));
      if (isRetail) continue; // retail/MSRP is the denominator, not part of resale
      g.resale.push(price);
    }

    return [...groups.values()]
      .map((g) => {
        if (g.retail == null || g.retail <= 0 || g.resale.length < MIN_RATINGS) return null;
        const med = median(g.resale);
        if (med <= 0) return null;
        const pct = Math.round((med / g.retail) * 100);
        return { entry: { variantId: g.variantId, brandName: g.brandName, styleName: g.styleName, value: `${pct}% of retail`, count: g.resale.length }, pct };
      })
      .filter((x): x is { entry: LeaderboardEntry; pct: number } => x !== null)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, perBoard)
      .map((x) => x.entry)
      .filter((e) => e.brandName || e.styleName);
  } catch {
    return [];
  }
}

// ============ Catalog × opinion board: best laptop totes ============
// "Best for X" = a verified catalog attribute (fits a laptop) ranked by review
// rating. No extra review field needed — just data we already have.

async function loadBestLaptopTotes(perBoard = 5): Promise<LeaderboardEntry[]> {
  try {
    const sb = getSupabase();
    const { data: fitRows, error: fitErr } = await sb
      .from("fits")
      .select("variant_id")
      .ilike("item_name", "%laptop%")
      .neq("fits", "no")
      .limit(2000);
    if (fitErr || !fitRows || fitRows.length === 0) return [];
    const laptopIds = [...new Set((fitRows as { variant_id: number }[]).map((r) => r.variant_id))];

    const { data: reviews, error: revErr } = await sb
      .from("review")
      .select("variant_id, rating")
      .in("variant_id", laptopIds);
    if (revErr || !reviews) return [];

    const agg = new Map<number, { sum: number; count: number }>();
    for (const r of reviews as { variant_id: number; rating: number | null }[]) {
      if (typeof r.rating !== "number") continue;
      const a = agg.get(r.variant_id) ?? { sum: 0, count: 0 };
      a.sum += r.rating;
      a.count += 1;
      agg.set(r.variant_id, a);
    }

    const ranked = [...agg.entries()]
      .filter(([, a]) => a.count >= MIN_RATINGS)
      .sort(([, a], [, b]) => b.sum / b.count - a.sum / a.count)
      .slice(0, perBoard);
    if (ranked.length === 0) return [];

    const names = await resolveVariantNames(ranked.map(([id]) => id));
    return ranked
      .map(([id, a]) => {
        const n = names.get(id);
        return n
          ? { variantId: id, brandName: n.brandName, styleName: n.styleName, value: (a.sum / a.count).toFixed(1), count: a.count }
          : null;
      })
      .filter((x): x is LeaderboardEntry => x !== null);
  } catch {
    return [];
  }
}

async function resolveVariantNames(
  ids: number[]
): Promise<Map<number, { brandName: string; styleName: string }>> {
  const out = new Map<number, { brandName: string; styleName: string }>();
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("variant")
      .select("variant_id, style:style_id(name, brand:brand_id(name))")
      .in("variant_id", ids);
    if (error || !data) return out;
    for (const row of data as {
      variant_id: number;
      style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
    }[]) {
      const s = Array.isArray(row.style) ? row.style[0] : row.style;
      if (!s) continue;
      const b = Array.isArray(s.brand) ? s.brand[0] : s.brand;
      out.set(row.variant_id, { brandName: b?.name ?? "", styleName: s.name ?? "" });
    }
  } catch {
    /* resilient: names just won't resolve, entries get filtered out */
  }
  return out;
}

// Homepage "What the community knows" boards. All read-only, change only on
// review/ingest, and render together — cached so the section never re-scans the
// review + price tables on every load.
export const getReviewLeaderboards = unstable_cache(
  loadReviewLeaderboards,
  ["review-leaderboards"],
  { revalidate: CACHE_MARKET, tags: ["market"] },
);

export const getValueRetentionLeaders = unstable_cache(
  loadValueRetentionLeaders,
  ["value-retention-leaders"],
  { revalidate: CACHE_MARKET, tags: ["market"] },
);

export const getBestLaptopTotes = unstable_cache(
  loadBestLaptopTotes,
  ["best-laptop-totes"],
  { revalidate: CACHE_MARKET, tags: ["market"] },
);
