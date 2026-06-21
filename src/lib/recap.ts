import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { getUserTaste } from "./taste-data";
import { nameTaste } from "./taste";

/**
 * "Year in Bags" recap — a Letterboxd-style, screenshot-ready summary computed
 * ONLY from existing data: closet adds, reviews written, top brands in the
 * closet, and the user's named taste profile. Every stat is honest — a field is
 * only populated when the underlying data exists; nothing is invented.
 *
 * We don't gate strictly on calendar year because the dataset is young; instead
 * the "year" is the most recent rolling window the user has been active in. We
 * surface the period label so the copy stays truthful.
 */

export interface BrandTally {
  brandName: string;
  count: number;
}

export interface YearInBags {
  /** Whether the user has enough logged data to show a real recap. */
  hasEnough: boolean;
  /** How many closet items exist (the gating signal). */
  totalCloset: number;
  haveCount: number;
  wantCount: number;
  hadCount: number;
  reviewCount: number;
  topBrands: BrandTally[];
  tasteName: string | null;
  tasteTagline: string | null;
  /** The most recent year the user added a closet item, e.g. 2026. */
  activeYear: number | null;
}

/** Minimum closet items required before we show a recap rather than an empty state. */
export const RECAP_MIN_ITEMS = 3;

const EMPTY: YearInBags = {
  hasEnough: false,
  totalCloset: 0,
  haveCount: 0,
  wantCount: 0,
  hadCount: 0,
  reviewCount: 0,
  topBrands: [],
  tasteName: null,
  tasteTagline: null,
  activeYear: null,
};

type ClosetRow = {
  status: string;
  created_at: string | null;
  variant:
    | { style: { brand: { name: string } | { name: string }[] | null } | { name?: string; brand?: unknown }[] | null }
    | { style: unknown }[]
    | null;
};

function brandNameFrom(row: ClosetRow): string | null {
  const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) as
    | { style: { brand: { name: string } | { name: string }[] | null } | { brand: unknown }[] | null }
    | null;
  if (!v) return null;
  const s = (Array.isArray(v.style) ? v.style[0] : v.style) as
    | { brand: { name: string } | { name: string }[] | null }
    | null;
  if (!s) return null;
  const brand = Array.isArray(s.brand) ? s.brand[0] : s.brand;
  return brand?.name ?? null;
}

/** The current user's Year in Bags recap. Empty (hasEnough=false) when signed out / sparse. */
export async function getYearInBags(): Promise<YearInBags> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;
  const user = await getCurrentUser();
  if (!user) return EMPTY;

  const supabase = await createServerSupabase();

  const [closetRes, reviewRes, taste] = await Promise.all([
    supabase
      .from("closet_item")
      .select(
        "status, created_at, variant:variant_id(style:style_id(brand:brand_id(name)))"
      )
      .eq("user_id", user.id)
      .limit(500),
    supabase
      .from("review")
      .select("review_id", { count: "exact", head: true })
      .eq("user_id", user.id),
    getUserTaste(),
  ]);

  const rows = (closetRes.data ?? []) as ClosetRow[];
  if (rows.length === 0) return EMPTY;

  let haveCount = 0;
  let wantCount = 0;
  let hadCount = 0;
  const brandCounts = new Map<string, number>();
  let activeYear: number | null = null;

  for (const row of rows) {
    if (row.status === "have") haveCount++;
    else if (row.status === "want") wantCount++;
    else if (row.status === "had") hadCount++;

    const brand = brandNameFrom(row);
    if (brand) brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);

    if (row.created_at) {
      const y = new Date(row.created_at).getFullYear();
      if (!Number.isNaN(y) && (activeYear == null || y > activeYear)) activeYear = y;
    }
  }

  const topBrands: BrandTally[] = [...brandCounts.entries()]
    .map(([brandName, count]) => ({ brandName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Taste name only if there's real signal in the vector.
  let tasteName: string | null = null;
  let tasteTagline: string | null = null;
  if (taste.completeness > 0) {
    const named = nameTaste(taste.vector);
    tasteName = named.name;
    tasteTagline = named.tagline;
  }

  const reviewCount = reviewRes.count ?? 0;
  const totalCloset = rows.length;

  return {
    hasEnough: totalCloset >= RECAP_MIN_ITEMS,
    totalCloset,
    haveCount,
    wantCount,
    hadCount,
    reviewCount,
    topBrands,
    tasteName,
    tasteTagline,
    activeYear,
  };
}
