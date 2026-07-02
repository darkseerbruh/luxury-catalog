/**
 * Full-catalog sweep, step 1: mine a brand's live Fashionphile collection for
 * model-name candidates (2026-07-02 sweep, docs/data-collection-handoff.md §0).
 *
 * Fetches every page of /collections/<slug>/products.json (free, server-side),
 * MERGES the full product set into the raw dump (so the later map+load step
 * needs no refetch), and prints model-phrase clusters: count, price spread, and
 * sample handles, with [HAVE] marking phrases that already match a catalog
 * style. A curator turns the net-new clusters into
 * supabase/ingest/sweep-targets/<slug>.json, then:
 *   npx tsx supabase/seed/scaffold-from-spec.ts <slug> --write
 *   npx tsx supabase/ingest/sources/fashionphile.ts --raw
 *   npm run load:prices -- fashionphile --write && npm run summary:refresh
 *
 *   npx tsx supabase/ingest/sweep-mine.ts <brand-slug> <catalog-brand-name>
 *   e.g. npx tsx supabase/ingest/sweep-mine.ts louis-vuitton "Louis Vuitton"
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin as db } from "../seed/lib/client";

const RAW_DUMP = path.resolve(__dirname, "../../data/ingest/_raw/fashionphile.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Title words that are never part of a model name. */
const MATERIAL_COLOR = new Set(
  `monogram damier ebene azur canvas epi vernis empreinte leather calfskin lambskin caviar suede denim
   taurillon taiga taigarama macassar graphite eclipse mahina raffia straw tweed satin velvet patent
   python ostrich crocodile alligator lizard exotic shearling wool nylon vinyl pvc coated grained smooth
   quilted matelasse chevron embossed perforated metallic iridescent glitter sequin studded embroidered
   black white brown beige tan navy blue red green pink purple yellow orange grey gray gold silver rose
   ivory cream burgundy bordeaux natural multicolor multicolore ombre tricolor bicolor giant reverse
   vintage medium small large jumbo maxi micro nano mini east west double single new noir marine rouge
   vert rose blanc brun etoupe etain craie sesame biscuit tourterelle turtledove galet mauve lilac`
    .split(/\s+/)
    .filter(Boolean),
);
const SIZE_WORDS = new Set(["pm", "mm", "gm", "bb", "nm", "xs", "s", "m", "l", "xl"]);
/** Product classes outside the sweep scope (bags + carried pouches only). */
const NONBAG = new Set(
  `wallet card cardholder key cles multicles keychain charm bracelet necklace earring earrings ring
   brooch watch belt scarf silk twilly bandeau shawl stole sunglasses glasses hat cap beanie gloves
   shoe shoes sneaker sneakers sandal sandals pump pumps boot boots heel heels loafer loafers mule
   mules flats espadrille espadrilles slide slides agenda notebook passport phone airpods umbrella
   blanket towel poncho tie cufflink cufflinks pen coin compact organizer emilie sarah victorine
   zippy checkbook bookmark mirror tray dice vivienne doll ornament trunk-clock clock frame poster`
    .split(/\s+/)
    .filter(Boolean),
);

type Product = { title?: string; handle?: string; body_html?: string; tags?: string[]; variants?: Array<{ price?: string }> };
type RawDumpEntry = { product: Product; url?: string };

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pct(xs: number[], p: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

async function main() {
  const [slug, brandName] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!slug || !brandName) {
    console.error('Usage: tsx sweep-mine.ts <brand-slug> "<Catalog Brand Name>"');
    process.exit(1);
  }
  const brandWords = new Set(norm(brandName).split(" "));

  // Existing catalog styles for [HAVE] marking.
  const { data: brand } = await db.from("brand").select("brand_id, name").ilike("name", brandName).maybeSingle();
  const styleNeedles = new Set<string>();
  if (brand) {
    const { data: styles } = await db.from("style").select("name").eq("brand_id", brand.brand_id);
    for (const s of styles ?? []) {
      for (const w of norm(s.name).split(" ")) {
        if (w.length >= 4 && !MATERIAL_COLOR.has(w) && !brandWords.has(w) && !NONBAG.has(w)) styleNeedles.add(w);
      }
    }
  } else {
    console.warn(`brand "${brandName}" not in catalog — every cluster will show as net-new`);
  }

  // Fetch every page; keep everything for the dump merge, bags only for mining.
  const all: RawDumpEntry[] = [];
  for (let page = 1; page <= 60; page++) {
    const r = await fetch(`https://www.fashionphile.com/collections/${slug}/products.json?limit=250&page=${page}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!r.ok) {
      console.error(`  page ${page}: HTTP ${r.status} — retrying once`);
      await new Promise((res) => setTimeout(res, 3000));
      const r2 = await fetch(`https://www.fashionphile.com/collections/${slug}/products.json?limit=250&page=${page}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (!r2.ok) { console.error(`  page ${page}: HTTP ${r2.status} — stopping`); break; }
      const j2 = (await r2.json()) as { products?: Product[] };
      if (!j2.products?.length) break;
      for (const p of j2.products) all.push({ product: p, url: `https://www.fashionphile.com/products/${p.handle}` });
      continue;
    }
    const j = (await r.json()) as { products?: Product[] };
    if (!j.products?.length) break;
    for (const p of j.products) all.push({ product: p, url: `https://www.fashionphile.com/products/${p.handle}` });
    await new Promise((res) => setTimeout(res, 250));
  }
  console.log(`${slug}: ${all.length} live products fetched`);

  // Merge into the raw dump (dedup by url) so map+load reuses this fetch.
  let existing: RawDumpEntry[] = [];
  if (fs.existsSync(RAW_DUMP)) existing = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const seen = new Set(existing.map((e) => e.url));
  const merged = existing.concat(all.filter((e) => e.url && !seen.has(e.url)));
  fs.mkdirSync(path.dirname(RAW_DUMP), { recursive: true });
  fs.writeFileSync(RAW_DUMP, JSON.stringify(merged, null, 2));
  console.log(`raw dump: ${existing.length} existing + ${merged.length - existing.length} new = ${merged.length}`);

  // Mine model phrases from bag-class titles.
  type Cluster = { count: number; prices: number[]; samples: string[] };
  const clusters = new Map<string, Cluster>();
  for (const e of all) {
    const words = norm(e.product.title ?? "").split(" ");
    if (words.some((w) => NONBAG.has(w))) continue;
    const phrase = words
      .filter((w) => !brandWords.has(w) && !MATERIAL_COLOR.has(w) && !SIZE_WORDS.has(w) && !/^\d+$/.test(w))
      .join(" ")
      .trim();
    if (!phrase) continue;
    const price = Number(e.product.variants?.[0]?.price);
    const c = clusters.get(phrase) ?? { count: 0, prices: [], samples: [] };
    c.count++;
    if (Number.isFinite(price)) c.prices.push(price);
    if (c.samples.length < 3 && e.product.handle) c.samples.push(e.product.handle);
    clusters.set(phrase, c);
  }

  console.log(`\n=== model-phrase clusters (bag-class only), by count ===`);
  for (const [phrase, c] of [...clusters.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 120)) {
    const have = phrase.split(" ").some((w) => styleNeedles.has(w)) ? "[HAVE]" : "[NEW ]";
    console.log(
      `${have} ${String(c.count).padStart(4)}  ${phrase}  ($${pct(c.prices, 10)}-$${pct(c.prices, 90)})  e.g. ${c.samples[0] ?? ""}`,
    );
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
