import { unstable_cache } from "next/cache";
import { getSupabase, fetchAllRows } from "./supabase";
import { CACHE_MARKET } from "./cache";

/**
 * "Fun facts" for the /data page: lore + playful price math, mined from bags we
 * already track. The namesakes are curated, well-documented facts (kept in code,
 * archivist-verifiable); the prices are pulled LIVE from variant_price_summary so
 * they stay current. Only bags actually in our catalog appear.
 */

export interface NamedBag {
  brand: string;
  style: string;
  namesake: string;
  lore: string;
  median: number | null;
}

export interface FunFacts {
  named: NamedBag[];
  /** Representative median resale by a simple slug, for the playful math section. */
  priceOf: Record<string, number | null>;
}

const EMPTY: FunFacts = { named: [], priceOf: {} };

// Curated namesakes (established facts). brand + exact style name must match a
// style we track, or the row is skipped.
const NAMED: Omit<NamedBag, "median">[] = [
  { brand: "Hermès", style: "Kelly", namesake: "Grace Kelly", lore: "The bag Grace Kelly used to shield her pregnancy from photographers in 1956." },
  { brand: "Dior", style: "Lady Dior", namesake: "Princess Diana", lore: "Gifted to Diana in 1995; she carried it so often it took her name." },
  { brand: "Gucci", style: "Jackie 1961", namesake: "Jackie Onassis", lore: "Jackie O was photographed with it so often that Gucci renamed it for her." },
  { brand: "Gucci", style: "Diana", namesake: "Princess Diana", lore: "Diana's favorite Gucci bamboo tote, reissued under her name." },
  { brand: "Chanel", style: "Boy", namesake: "Boy Capel", lore: "Named for Arthur 'Boy' Capel, the love of Coco Chanel's life." },
  { brand: "Chanel", style: "Gabrielle", namesake: "Coco Chanel", lore: "Gabrielle was Coco Chanel's real first name." },
  { brand: "Chanel", style: "Coco Handle", namesake: "Coco Chanel", lore: "A nod to the founder herself." },
  { brand: "Louis Vuitton", style: "Capucines", namesake: "Rue des Capucines", lore: "The Paris street where Louis Vuitton opened his first store in 1854." },
  { brand: "Louis Vuitton", style: "Alma", namesake: "Pont de l'Alma", lore: "Named for the Alma bridge in Paris." },
];

// Styles whose live median we want for the playful math (slug -> [brand, style]).
const MATH: Record<string, [string, string]> = {
  birkin: ["Hermès", "Birkin"],
  kelly: ["Hermès", "Kelly"],
  classicFlap: ["Chanel", "Classic Flap"],
  neverfull: ["Louis Vuitton", "Neverfull"],
  speedy: ["Louis Vuitton", "Speedy"],
  jetSet: ["Michael Kors", "Jet Set"],
};

type BrandRel = { name: string } | { name: string }[] | null;
type StyleRel = { name: string; brand: BrandRel } | { name: string; brand: BrandRel }[] | null;

function styleInfo(style: StyleRel): { brand: string; style: string } {
  const s = Array.isArray(style) ? style[0] : style;
  const b = s ? (Array.isArray(s.brand) ? s.brand[0] : s.brand) : null;
  return { brand: b?.name ?? "", style: s?.name ?? "" };
}

const keyOf = (brand: string, style: string) => `${brand.toLowerCase()}||${style.toLowerCase()}`;

async function loadFunFacts(): Promise<FunFacts> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;
  try {
    const sb = getSupabase();
    const [summaryRes, variants] = await Promise.all([
      sb.rpc("variant_price_summary"),
      fetchAllRows<{ variant_id: number; style: StyleRel }>(() =>
        sb.from("variant").select("variant_id, style:style_id(name, brand:brand_id(name))"),
      ),
    ]);
    if (summaryRes.error || !summaryRes.data) return EMPTY;

    const info = new Map<number, { brand: string; style: string }>();
    for (const v of variants) info.set(v.variant_id, styleInfo(v.style));

    // Representative median per style = the variant with the most observations.
    const best = new Map<string, { median: number; n: number }>();
    for (const s of summaryRes.data as { variant_id: number; resale_median: number | string | null; resale_n: number | null }[]) {
      const meta = info.get(s.variant_id);
      const median = s.resale_median != null ? Number(s.resale_median) : null;
      if (!meta || !meta.style || median == null || median <= 0) continue;
      const n = s.resale_n ?? 0;
      const k = keyOf(meta.brand, meta.style);
      const cur = best.get(k);
      if (!cur || n > cur.n) best.set(k, { median, n });
    }

    const named: NamedBag[] = NAMED.map((row) => ({
      ...row,
      median: best.get(keyOf(row.brand, row.style))?.median ?? null,
    })).filter((row) => row.median != null);

    const priceOf: Record<string, number | null> = {};
    for (const [slug, [brand, style]] of Object.entries(MATH)) {
      priceOf[slug] = best.get(keyOf(brand, style))?.median ?? null;
    }

    return { named, priceOf };
  } catch {
    return EMPTY;
  }
}

export const getFunFacts = unstable_cache(loadFunFacts, ["fun-facts"], {
  revalidate: CACHE_MARKET,
  tags: ["market"],
});
