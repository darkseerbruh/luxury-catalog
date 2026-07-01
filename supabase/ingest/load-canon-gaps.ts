/**
 * One-off loader for the "it bags of all time" canon gaps (2026-06-29):
 * Balenciaga City, Mulberry Bayswater, Telfar Shopping Bag — top-20 picks that had no
 * catalog presence, blocking the article's post→bag CTAs.
 *
 * Sources (captured 2026-06-29):
 *   - eBay completed-sales (sold) → data/ingest/_raw/ebay-canon-gaps.json
 *   - Fashionphile live (fixed-price = realized) → data/ingest/_raw/fashionphile.json
 *
 * Creates the brand (Mulberry, Telfar; Balenciaga already exists), the style, and one
 * base variant per style, then loads price_history rows. Idempotent: on --write it first
 * deletes its own prior eBay/Fashionphile rows for these variants, then re-inserts.
 *
 *   npx tsx supabase/ingest/load-canon-gaps.ts            # dry-run (default)
 *   npx tsx supabase/ingest/load-canon-gaps.ts --write    # execute
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local (tsx does not auto-load it).
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* env may already be set */ }

const WRITE = process.argv.includes("--write");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TODAY = new Date().toISOString().slice(0, 10);
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0;
};
const parseDate = (s: string | null): string => {
  if (!s) return TODAY;
  const d = new Date(s);
  return isNaN(+d) ? TODAY : d.toISOString().slice(0, 10);
};

type Target = {
  brand: string;
  brandSeed?: { tier: string; country_of_origin: string; founded_year: number };
  style: string;
  year_introduced: number;
  fpMatch: (title: string, body: string) => boolean;
};

const TARGETS: Target[] = [
  {
    brand: "Balenciaga",
    brandSeed: { tier: "mid", country_of_origin: "Spain", founded_year: 1919 },
    style: "City",
    year_introduced: 2001,
    fpMatch: (t) => /\bcity\b|motocross|motorcycle/i.test(t),
  },
  {
    brand: "Mulberry",
    brandSeed: { tier: "mid", country_of_origin: "United Kingdom", founded_year: 1971 },
    style: "Bayswater",
    year_introduced: 2003,
    fpMatch: (t) => /bayswater/i.test(t),
  },
  {
    brand: "Telfar",
    brandSeed: { tier: "thrift", country_of_origin: "United States", founded_year: 2005 },
    style: "Shopping Bag",
    year_introduced: 2014,
    fpMatch: (t, b) => /shopping bag/i.test(t) && /telfar/i.test(b + t),
  },
];

const ebay = JSON.parse(readFileSync("data/ingest/_raw/ebay-canon-gaps.json", "utf8")).captures as Array<{
  brand: string; style: string; platform: string; price_type: string; source_url: string;
  rows: { price: number; sold_on: string | null }[];
}>;
const fp = JSON.parse(readFileSync("data/ingest/_raw/fashionphile.json", "utf8")) as Array<{
  product: { title: string; body_html?: string; handle: string; variants?: { price: string }[] };
  url?: string;
}>;

async function ensureBrand(t: Target): Promise<number> {
  const { data: found } = await sb.from("brand").select("brand_id").ilike("name", t.brand).maybeSingle();
  if (found) return found.brand_id;
  console.log(`  brand "${t.brand}" missing → CREATE (tier ${t.brandSeed!.tier})`);
  if (!WRITE) return -1;
  const { data, error } = await sb.from("brand").insert({ name: t.brand, ...t.brandSeed }).select("brand_id").single();
  if (error) throw new Error(`brand insert ${t.brand}: ${error.message}`);
  return data.brand_id;
}
async function ensureStyle(t: Target, brandId: number): Promise<number> {
  if (brandId < 0) return -1;
  const { data: found } = await sb.from("style").select("style_id").eq("brand_id", brandId).ilike("name", t.style).maybeSingle();
  if (found) return found.style_id;
  console.log(`  style "${t.brand} ${t.style}" missing → CREATE`);
  if (!WRITE) return -1;
  const { data, error } = await sb.from("style").insert({ brand_id: brandId, name: t.style, year_introduced: t.year_introduced }).select("style_id").single();
  if (error) throw new Error(`style insert ${t.style}: ${error.message}`);
  return data.style_id;
}
async function ensureVariant(t: Target, styleId: number): Promise<number> {
  if (styleId < 0) return -1;
  const { data: found } = await sb.from("variant").select("variant_id").eq("style_id", styleId).order("variant_id").limit(1).maybeSingle();
  if (found) return found.variant_id;
  console.log(`  base variant for "${t.brand} ${t.style}" → CREATE`);
  if (!WRITE) return -1;
  const { data, error } = await sb.from("variant").insert({ style_id: styleId, still_in_production: true }).select("variant_id").single();
  if (error) throw new Error(`variant insert ${t.style}: ${error.message}`);
  return data.variant_id;
}

async function main() {
  console.log(`\n=== load-canon-gaps ${WRITE ? "(WRITE)" : "(DRY RUN)"} ===\n`);
  for (const t of TARGETS) {
    console.log(`• ${t.brand} ${t.style}`);
    const brandId = await ensureBrand(t);
    const styleId = await ensureStyle(t, brandId);
    const variantId = await ensureVariant(t, styleId);

    const ebRows = (ebay.find((c) => c.brand === t.brand && c.style === t.style)?.rows) ?? [];
    const ebSrc = ebay.find((c) => c.brand === t.brand && c.style === t.style)?.source_url ?? "";
    const brandRx = new RegExp(t.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const fpRows = fp
      .filter((r) => brandRx.test((r.product.body_html || "") + " " + (r.product.title || "")) && t.fpMatch(r.product.title || "", r.product.body_html || ""))
      .map((r) => ({ price: Number(r.product.variants?.[0]?.price), url: r.url || `https://www.fashionphile.com/p/${r.product.handle}` }))
      .filter((r) => Number.isFinite(r.price) && r.price > 0);

    const priceRows = [
      ...ebRows.map((r) => ({ variant_id: variantId, sale_price: r.price, currency: "USD", platform: "eBay", price_type: "sold", source_url: ebSrc, date_recorded: parseDate(r.sold_on) })),
      ...fpRows.map((r) => ({ variant_id: variantId, sale_price: r.price, currency: "USD", platform: "Fashionphile", price_type: "listed", source_url: r.url, date_recorded: TODAY })),
    ];
    const all = priceRows.map((r) => r.sale_price);
    console.log(`   eBay sold: ${ebRows.length} · Fashionphile listed: ${fpRows.length} · total ${priceRows.length}`);
    console.log(`   resale read → median $${Math.round(median(all)).toLocaleString()}  low $${Math.min(...all)}  high $${Math.max(...all)}`);

    if (WRITE && variantId > 0) {
      await sb.from("price_history").delete().eq("variant_id", variantId).in("platform", ["eBay", "Fashionphile"]);
      const { error } = await sb.from("price_history").insert(priceRows);
      if (error) throw new Error(`price insert ${t.style}: ${error.message}`);
      console.log(`   ✓ wrote ${priceRows.length} price rows to variant ${variantId}`);
    }
    console.log("");
  }
  console.log(WRITE ? "Done. Run refresh-summary next." : "Dry run only. Re-run with --write to apply.");
}
main().catch((e) => { console.error(e); process.exit(1); });
