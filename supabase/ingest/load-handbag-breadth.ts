/**
 * Handbag-breadth loader (2026-06-30): capture EVERY current Fashionphile handbag
 * listing for under-covered houses so per-brand median pricing is representative
 * (we previously tracked only the icons, which skewed medians high).
 *
 * Source: Fashionphile per-brand Shopify collection feed (free, no key):
 *   https://www.fashionphile.com/collections/<slug>/products.json?limit=250&page=N
 * Handbags only (product_type "Bags"; SLG/accessory titles dropped).
 *
 * One pass = price + colour + material + hardware + year + season + region, via the
 * shared parseFashionphileProduct extractor. Listings cluster to canonical MODELS
 * (authoritative per-house lists, longest-match-first so "Soft Margaux" beats "Margaux").
 * Each model → one style + one base variant; idempotent (deletes its own prior
 * Fashionphile rows per variant before re-inserting).
 *
 *   npx tsx supabase/ingest/load-handbag-breadth.ts            # dry-run (default)
 *   npx tsx supabase/ingest/load-handbag-breadth.ts --write    # execute
 *   npx tsx supabase/ingest/load-handbag-breadth.ts --brand="The Row"  # one house
 * After --write, run:  npm run summary:refresh
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { parseFashionphileProduct, type ShopifyProduct } from "../../src/lib/ingest/fashionphile";

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* env may already be set */ }

const WRITE = process.argv.includes("--write");
const ONLY = process.argv.find((a) => a.startsWith("--brand="))?.split("=")[1]?.toLowerCase();
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const TODAY = new Date().toISOString().slice(0, 10);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };

// Canonical handbag models per house (authoritative; longest/most-specific first).
// Filled from the archivist's lists. The Row seeded provisionally.
const CONFIG: { brand: string; slug: string; models: string[] }[] = [
  {
    brand: "The Row", slug: "the-row",
    models: ["Soft Margaux", "Margaux", "N/S Park Tote", "E/W Park Tote", "Park Tote", "N/S Hook Tote", "Hook Tote",
      "Half Moon", "Bindle", "Terrasse", "Marlo", "Polly", "Peggy", "Allie", "Alger", "90's", "Emilie", "Hunting Bag",
      "Astra", "Mail Bag", "Slouchy Banana", "Camden", "Logan", "Devon", "Sofia", "Isa", "Idaho", "India", "Marcel",
      "Ledger", "Everyday", "Portfolio"],
  },
];

const isAccessory = (t: string) => /wallet|card case|coin|charm|key ?(ring|chain|case)|pouch|cosmetic|strap$|bracelet|earring|belt$/i.test(t);

async function brandId(name: string): Promise<number | null> {
  const { data } = await sb.from("brand").select("brand_id").ilike("name", name).maybeSingle();
  return data?.brand_id ?? null;
}
async function ensureStyle(bId: number, name: string): Promise<number> {
  const { data: found } = await sb.from("style").select("style_id").eq("brand_id", bId).ilike("name", name).maybeSingle();
  if (found) return found.style_id;
  const { data, error } = await sb.from("style").insert({ brand_id: bId, name }).select("style_id").single();
  if (error) throw new Error(`style ${name}: ${error.message}`);
  return data.style_id;
}
async function ensureVariant(styleId: number): Promise<number> {
  const { data: found } = await sb.from("variant").select("variant_id").eq("style_id", styleId).order("variant_id").limit(1).maybeSingle();
  if (found) return found.variant_id;
  const { data, error } = await sb.from("variant").insert({ style_id: styleId, still_in_production: true }).select("variant_id").single();
  if (error) throw new Error(`variant ${styleId}: ${error.message}`);
  return data.variant_id;
}
async function fetchCollection(slug: string): Promise<ShopifyProduct[]> {
  const out: ShopifyProduct[] = [];
  for (let page = 1; page <= 6; page++) {
    const r = await fetch(`https://www.fashionphile.com/collections/${slug}/products.json?limit=250&page=${page}`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const j = await r.json();
    const p: ShopifyProduct[] = j.products ?? [];
    out.push(...p);
    if (p.length < 250) break;
  }
  return out;
}

async function main() {
  for (const cfg of CONFIG) {
    if (ONLY && cfg.brand.toLowerCase() !== ONLY) continue;
    const bId = await brandId(cfg.brand);
    if (!bId) { console.log(`SKIP ${cfg.brand}: brand not found`); continue; }
    const all = await fetchCollection(cfg.slug);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bags = all.filter((p) => (p as any).product_type === "Bags" && !isAccessory(p.title));
    const models = [...cfg.models].sort((a, b) => b.length - a.length); // longest-first
    const groups = new Map<string, ShopifyProduct[]>();
    const unmatched: string[] = [];
    for (const p of bags) {
      const model = models.find((m) => p.title.toLowerCase().includes(m.toLowerCase()));
      if (!model) { unmatched.push(p.title); continue; }
      (groups.get(model) ?? groups.set(model, []).get(model)!).push(p);
    }
    console.log(`\n===== ${cfg.brand}: ${bags.length} handbags, ${groups.size} styles, ${unmatched.length} unmatched =====`);
    let brandPrices: number[] = [];
    for (const [model, listings] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const specs = listings.map((p) => parseFashionphileProduct(p)).filter((s) => s.price && s.price > 0);
      const prices = specs.map((s) => s.price!) as number[];
      brandPrices = brandPrices.concat(prices);
      console.log(`  ${model}: ${prices.length} listings, median $${Math.round(median(prices)).toLocaleString()}`);
      if (!WRITE) continue;
      const styleId = await ensureStyle(bId, model);
      const variantId = await ensureVariant(styleId);
      const rows = specs.map((s, i) => ({
        variant_id: variantId, sale_price: s.price, currency: "USD", platform: "Fashionphile", price_type: "listed",
        source_url: `https://www.fashionphile.com/p/${listings[i].handle}`, colorway: s.color, material: s.material,
        hardware_color: s.hardwareColor, production_year: s.productionYear, season: s.season, region: s.region,
        listing_ref: listings[i].handle, listing_status: "active", confidence_level: "high", date_recorded: TODAY,
      }));
      await sb.from("price_history").delete().eq("variant_id", variantId).eq("platform", "Fashionphile");
      const { error } = await sb.from("price_history").insert(rows);
      if (error) throw new Error(`price insert ${cfg.brand}/${model}: ${error.message}`);
    }
    console.log(`  -> brand median across ${brandPrices.length} captured handbags: $${Math.round(median(brandPrices)).toLocaleString()}`);
    if (unmatched.length) console.log(`  unmatched (route to model list): ${[...new Set(unmatched)].slice(0, 8).map((t) => t.slice(0, 34)).join(" | ")}`);
  }
  console.log(WRITE ? "\nWROTE. Now run: npm run summary:refresh" : "\nDRY-RUN. Re-run with --write to execute.");
}
main().catch((e) => { console.error(e); process.exit(1); });
