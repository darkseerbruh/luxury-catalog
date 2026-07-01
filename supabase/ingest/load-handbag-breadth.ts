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

// Canonical handbag models per house (archivist-authoritative, 2026-06-30). Matched in
// CURATED ORDER (specific-first; motif/fallback lines last), accent-insensitive. `name` =
// clean catalog style; `match` = accent-free lowercase tokens to test against the title.
type Model = { name: string; match: string[] };
const CONFIG: { brand: string; slug: string; models: Model[] }[] = [
  { brand: "The Row", slug: "the-row", models: [
    { name: "Soft Margaux", match: ["soft margaux"] }, { name: "Margaux", match: ["margaux"] },
    { name: "Marlo", match: ["marlo"] }, { name: "Slouchy Banana", match: ["slouchy banana", "banana"] },
    { name: "90's", match: ["90's", "90s"] }, { name: "Half Moon", match: ["half moon"] },
    { name: "Sofia", match: ["sofia"] }, { name: "Peggy", match: ["peggy"] }, { name: "Bindle", match: ["bindle"] },
    { name: "Allie", match: ["allie"] }, { name: "Polly", match: ["polly"] }, { name: "India", match: ["india"] },
    { name: "Idaho", match: ["idaho"] }, { name: "Camden", match: ["camden", "camdem"] },
    { name: "Terrasse", match: ["terrasse"] }, { name: "Hunting Bag", match: ["hunting"] },
    { name: "Everyday Tote", match: ["everyday"] }, { name: "Park Tote", match: ["park"] },
    { name: "Hook Tote", match: ["hook"] }, { name: "Mail Bag", match: ["mail bag"] }, { name: "Alger", match: ["alger"] },
    { name: "Emilie", match: ["emilie"] }, { name: "Astra", match: ["astra"] }, { name: "Logan", match: ["logan"] },
    { name: "Devon", match: ["devon"] }, { name: "Isa", match: ["isa "] }, { name: "Marcel", match: ["marcel"] },
    { name: "Ledger", match: ["ledger"] }, { name: "Duplex", match: ["duplex"] }, { name: "Nu Twin", match: ["nu twin"] },
    { name: "Portfolio", match: ["portfolio"] },
  ] },
  { brand: "Goyard", slug: "goyard", models: [
    { name: "Saint Louis", match: ["saint louis", "st louis"] }, { name: "Anjou", match: ["anjou"] },
    { name: "Artois", match: ["artois"] }, { name: "Rouette", match: ["rouette"] }, { name: "Belvedere", match: ["belvedere"] },
    { name: "Sac Hardy", match: ["hardy"] }, { name: "Boheme", match: ["boheme"] },
    { name: "Vendôme", match: ["vendome"] }, { name: "Croisière", match: ["croisiere"] },
    { name: "Bellechasse", match: ["bellechasse"] }, { name: "Fidji", match: ["fidji"] },
    { name: "Petit Flot", match: ["petit flot", "flot"] }, { name: "Alpin", match: ["alpin"] },
    { name: "Grenelle", match: ["grenelle"] }, { name: "Cap-Vert", match: ["cap-vert", "cap vert"] },
    { name: "Plumet", match: ["plumet"] }, { name: "Saigon", match: ["saigon"] }, { name: "Villette", match: ["villette"] },
    { name: "Marquises", match: ["marquises"] }, { name: "Voltaire", match: ["voltaire"] }, { name: "Belharra", match: ["belharra"] },
    { name: "Poitiers", match: ["poitiers"] }, { name: "Aligre", match: ["aligre"] }, { name: "Bourget", match: ["bourget"] },
  ] },
  { brand: "Miu Miu", slug: "miu-miu", models: [
    { name: "Arcadie", match: ["arcadie"] }, { name: "Wander", match: ["wander"] },
    { name: "Aventure", match: ["aventure", "aviator"] }, { name: "Ivy", match: ["ivy"] }, { name: "Beau", match: ["beau"] },
    { name: "Coffer", match: ["coffer"] }, { name: "Utilitaire", match: ["utilitaire"] }, { name: "Caprice", match: ["caprice"] },
    { name: "Solitaire", match: ["solitaire"] }, { name: "Confidential", match: ["confidential"] },
    { name: "Softy", match: ["softy"] }, { name: "Bucket", match: ["bucket"] }, { name: "Matelassé", match: ["matelasse"] },
  ] },
  { brand: "Off-White", slug: "off-white", models: [
    { name: "Binder Clip", match: ["binder"] }, { name: "Jitney", match: ["jitney"] }, { name: "Burrow", match: ["burrow"] },
    { name: "Camera Bag", match: ["camera"] }, { name: "Box Bag", match: ["box bag"] }, { name: "Flap", match: ["flap"] },
  ] },
  { brand: "Alexander McQueen", slug: "alexander-mcqueen", models: [
    { name: "Jewelled Satchel", match: ["jewelled"] }, { name: "The Story", match: ["the story"] },
    { name: "The Bow", match: ["the bow"] }, { name: "The Curve", match: ["the curve"] }, { name: "The Grip", match: ["the grip"] },
    { name: "Knuckle", match: ["knuckle", "four ring", "four-ring"] }, { name: "Skull Box Clutch", match: ["box clutch"] },
    { name: "De Manta", match: ["de manta", "manta"] }, { name: "Heroine", match: ["heroine"] },
    { name: "Padlock", match: ["padlock"] }, { name: "Legend", match: ["legend"] }, { name: "Peak", match: ["peak"] },
    { name: "T Bar", match: ["t bar"] }, { name: "Skull Chain", match: ["skull chain", "skull"] },
  ] },
  { brand: "Valentino", slug: "valentino-garavani", models: [
    { name: "Rockstud Spike", match: ["rockstud spike", "spike"] }, { name: "Roman Stud", match: ["roman stud"] },
    { name: "Rockstud", match: ["rockstud"] }, { name: "Locò", match: ["loco"] }, { name: "One Stud", match: ["one stud"] },
    { name: "VSling", match: ["vsling", "v sling"] }, { name: "SuperVee", match: ["supervee", "super vee"] },
    { name: "Escape", match: ["escape"] }, { name: "Divina", match: ["divina"] }, { name: "VLogo", match: ["vlogo", "v logo"] },
  ] },
  { brand: "Jacquemus", slug: "jacquemus", models: [
    { name: "Le Bambimou", match: ["bambimou"] }, { name: "Le Chiquito", match: ["chiquito"] },
    { name: "Le Bambino", match: ["bambino"] }, { name: "Le Chouchou", match: ["chouchou"] },
    { name: "Le Sac Rond", match: ["rond"] }, { name: "La Spiaggia", match: ["spiaggia"] },
    { name: "Le Bisou", match: ["bisou"] }, { name: "Le Petit Sac", match: ["petit sac"] },
    { name: "Le Bambidou", match: ["bambidou"] }, { name: "Le Carinu", match: ["carinu"] },
    { name: "Le Petit Filet", match: ["petit filet"] }, { name: "Le Grand Panier", match: ["grand panier", "panier"] },
    { name: "Le Turismo", match: ["turismo"] }, { name: "La Ligne", match: ["la ligne"] },
  ] },
  { brand: "Telfar", slug: "telfar", models: [
    { name: "Shopping Bag", match: ["shopping"] }, { name: "Circle Bag", match: ["circle"] }, { name: "Duffle", match: ["duffle"] },
  ] },
];
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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
    const bags = all.filter((p) => (p as any).product_type === "Bags" && !isAccessory(p.title ?? ""));
    const groups = new Map<string, ShopifyProduct[]>();
    const unmatched: string[] = [];
    for (const p of bags) {
      const title = p.title ?? "";
      const nt = norm(title);
      const hit = cfg.models.find((m) => m.match.some((tok) => nt.includes(norm(tok))));
      if (!hit) { unmatched.push(title); continue; }
      (groups.get(hit.name) ?? groups.set(hit.name, []).get(hit.name)!).push(p);
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
