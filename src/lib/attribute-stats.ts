import { unstable_cache } from "next/cache";
import { getSupabase, fetchAllRows } from "./supabase";
import { CACHE_MARKET } from "./cache";

/**
 * Attribute "fun facts" for /data, aggregated from the per-listing attribute
 * columns on price_history (Fashionphile's structured feed fills these densely:
 * colorway ~88%, material ~90%, hardware ~54% as of 2026-06-30). No capture
 * needed; the data is already here. Values are normalized into clean buckets so
 * the tallies read honestly (gold vs silver, the colors, the leathers).
 */

export interface Slice {
  name: string;
  count: number;
}

export interface AttributeStats {
  hardware: { gold: number; silver: number; total: number };
  colors: Slice[];
  materials: Slice[];
}

const EMPTY: AttributeStats = { hardware: { gold: 0, silver: 0, total: 0 }, colors: [], materials: [] };

function hardwareBucket(v: string): "gold" | "silver" | null {
  const s = v.toLowerCase();
  if (/gold|gilt|brass/.test(s)) return "gold";
  if (/silver|palladium|ruthenium|gunmetal|nickel|chrome/.test(s)) return "silver";
  return null; // rose-gold, bronze etc. are too few to headline
}

// Canonical color buckets (merges French + shade variants into the headline color).
const COLOR_MAP: [RegExp, string][] = [
  [/black|noir/i, "Black"],
  [/brown|brun|chocolate|coffee|cognac|taupe/i, "Brown"],
  [/beige|tan|nude|sand|neutral/i, "Beige"],
  [/blue|bleu|navy/i, "Blue"],
  [/white|blanc|ivory|cream|creme/i, "White"],
  [/red|rouge|burgundy|bordeaux|wine/i, "Red"],
  [/pink|rose|fuchsia/i, "Pink"],
  [/green|vert|khaki|olive/i, "Green"],
  [/gr[ae]y|gris/i, "Gray"],
  [/gold|silver|metallic/i, "Metallic"],
  [/orange/i, "Orange"],
  [/purple|violet/i, "Purple"],
  [/yellow|jaune/i, "Yellow"],
];

function colorBucket(v: string): string | null {
  for (const [rx, label] of COLOR_MAP) if (rx.test(v)) return label;
  return null;
}

// Merge "X Leather" + "X" and drop the generic "Leather" noise word.
function materialBucket(v: string): string {
  const cleaned = v.replace(/\s*leather\s*/i, " ").trim();
  return cleaned || v.trim();
}

function topSlices(counts: Map<string, number>, n: number): Slice[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

async function loadAttributeStats(): Promise<AttributeStats> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;
  try {
    const sb = getSupabase();
    const rows = await fetchAllRows<{ colorway: string | null; hardware_color: string | null; material: string | null }>(() =>
      sb.from("price_history").select("colorway, hardware_color, material"),
    );

    let gold = 0;
    let silver = 0;
    const colors = new Map<string, number>();
    const materials = new Map<string, number>();

    for (const r of rows) {
      if (r.hardware_color) {
        const hb = hardwareBucket(r.hardware_color);
        if (hb === "gold") gold++;
        else if (hb === "silver") silver++;
      }
      if (r.colorway) {
        const cb = colorBucket(r.colorway);
        if (cb) colors.set(cb, (colors.get(cb) ?? 0) + 1);
      }
      if (r.material) {
        const mb = materialBucket(r.material);
        if (mb) materials.set(mb, (materials.get(mb) ?? 0) + 1);
      }
    }

    return {
      hardware: { gold, silver, total: gold + silver },
      colors: topSlices(colors, 9),
      materials: topSlices(materials, 8),
    };
  } catch {
    return EMPTY;
  }
}

export const getAttributeStats = unstable_cache(loadAttributeStats, ["attribute-stats"], {
  revalidate: CACHE_MARKET,
  tags: ["market"],
});
