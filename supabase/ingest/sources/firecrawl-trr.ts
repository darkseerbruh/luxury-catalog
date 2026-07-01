/**
 * TheRealReal capture via Firecrawl (replaces the old semi-manual Claude-in-Chrome
 * flow — TRR is bot-blocked to plain fetch, but Firecrawl's headless browser defeats
 * that, verified 2026-06-28). Runs in CI (GitHub Actions). See docs/data-collection-handoff §0.
 *
 *   npx tsx supabase/ingest/sources/firecrawl-trr.ts <targetKey> [--limit=N] [--max-detail=N]
 *   # then: npm run load:prices -- therealreal --write && npm run summary:refresh
 *
 * Flow per target: (1) ONE json search scrape → candidate product URLs (≈5 credits);
 * (2) per product, a RAW scrape (1 credit) whose JSON-LD `Product` we parse ourselves
 * with parseTrrDescription → colour/material/hardware/year. So cost ≈ 5 + N credits.
 * Writes PriceObservations to the landing zone; load-prices resolves brand→style→variant.
 */
import { scrape, sleep } from "../lib/firecrawl";
import { writeObservations } from "../lib/landing";
import { parseTrrDescription } from "../../../src/lib/ingest/trr";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface TrrTarget {
  brand: string;
  style: string;
  query: string;
  /** Size tokens to look for in the product title, longest/most-specific first. */
  sizes: string[];
  /** A product URL must include ALL of these (lowercased) to be this style. */
  urlIncludes: string[];
  /** ...and NONE of these (drops adjacent SLGs / sub-styles). */
  urlExcludes: string[];
  minPrice: number;
  maxPrice: number;
}

// One entry per style we capture from TRR. Extend as styles are verified.
const TARGETS: Record<string, TrrTarget> = {
  "goyard-saint-louis": {
    brand: "Goyard", style: "Saint Louis", query: "goyard saint louis",
    sizes: ["PM", "GM"],
    urlIncludes: ["goyard"], // plus a louis check below
    urlExcludes: ["saint-pierre", "saint-sulpice", "saint-lambert", "card", "wallet", "coin", "pouch", "artois"],
    minPrice: 300, maxPrice: 8000,
  },
};

/** Pull the JSON-LD `Product` out of a TRR product page's raw HTML. TRR escapes the
 *  ld+json (it sits double-encoded inside the Next.js payload), so we decode twice. */
export function parseTrrProduct(html: string): { name: string; price: number; currency: string; condition: string | null; conditionDetail: string | null; desc: string | null } | null {
  const m = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  const raw = m[1].trim();
  let obj: Record<string, unknown> | null = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    try {
      obj = JSON.parse(JSON.parse(`"${raw}"`)); // unescape \" \\n then parse
    } catch {
      return null;
    }
  }
  const items = Array.isArray(obj) ? obj : [obj];
  const p = items.find((it) => it && (it as Record<string, unknown>)["@type"] === "Product") as Record<string, unknown> | undefined;
  if (!p) return null;
  let offers = p.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  if (Array.isArray(offers)) offers = offers[0];
  const price = Number((offers as Record<string, unknown> | undefined)?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const condRaw = String((offers as Record<string, unknown> | undefined)?.itemCondition ?? "");
  return {
    name: String(p.name ?? ""),
    price,
    currency: String((offers as Record<string, unknown> | undefined)?.priceCurrency ?? "USD"),
    condition: condRaw.includes("New") ? "new" : condRaw.includes("Used") ? null : null,
    conditionDetail: condRaw || null,
    desc: typeof p.description === "string" ? p.description : null,
  };
}

function sizeOf(title: string, sizes: string[]): string | null {
  const t = title.toLowerCase();
  for (const s of sizes) if (new RegExp(`\\b${s.toLowerCase()}\\b`).test(t)) return s;
  return null;
}

async function main() {
  const key = process.argv[2];
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 40);
  const target = key && TARGETS[key];
  if (!target) {
    console.error(`unknown targetKey "${key}". known: ${Object.keys(TARGETS).join(", ")}`);
    process.exit(1);
  }

  const searchUrl = `https://www.therealreal.com/products?keywords=${encodeURIComponent(target.query)}`;
  console.log(`search: ${searchUrl}`);
  // Scrape the search page for its LINKS (1 credit) — cheaper than json/LLM extract (5)
  // and gives us the product URLs we need. Specs come from each product's JSON-LD below.
  const search = await scrape(searchUrl, { formats: ["links"], waitFor: 5000 });
  let credits = search.creditsUsed;
  const links = (search.links ?? []).map((u) => u.split("?")[0].split("#")[0]);

  // Unique product URLs that are this style (not adjacent SLGs / sub-styles).
  const seen = new Set<string>();
  const candidates = links.filter((u0) => {
    const u = u0.toLowerCase();
    if (!u.startsWith("http") || !u.includes("/products/")) return false;
    if (!u.includes("louis")) return false;
    if (!target.urlIncludes.every((t) => u.includes(t))) return false;
    if (target.urlExcludes.some((t) => u.includes(t))) return false;
    if (seen.has(u0)) return false;
    seen.add(u0);
    return true;
  }).map((url) => ({ url })).slice(0, limit);
  console.log(`candidates: ${candidates.length} (of ${links.length} links)`);

  const today = new Date().toISOString().slice(0, 10);
  const obs: PriceObservation[] = [];
  let failed = 0;
  for (const c of candidates) {
    try {
      // TRR sometimes ERR_ABORTs the cheap "basic" proxy on product pages. Retry once
      // with the stealth proxy (pricier, but recovers the listing) before giving up.
      let page;
      try {
        page = await scrape(c.url, { formats: ["rawHtml"], includeTags: ["script"] });
      } catch {
        await sleep(1500);
        page = await scrape(c.url, { formats: ["rawHtml"], includeTags: ["script"], proxy: "stealth" });
      }
      credits += page.creditsUsed;
      const prod = page.rawHtml ? parseTrrProduct(page.rawHtml) : null;
      if (!prod) continue;
      if (prod.price < target.minPrice || prod.price > target.maxPrice) continue;
      const spec = parseTrrDescription(prod.desc);
      const size = sizeOf(prod.name || c.url, target.sizes);
      const slug = c.url.split("/").pop() ?? c.url;
      obs.push({
        brand: target.brand, style: target.style,
        attrs: {
          size_label: size,
          exterior_colorway: spec.color,
          exterior_material: spec.material,
          hardware_color: spec.hardwareColor,
          production_year: spec.productionYear,
          season: spec.season,
          inclusions: spec.includes,
          listing_ref: slug,
          condition_detail: prod.conditionDetail,
        },
        platform: "TheRealReal", price_type: "listed", sale_price: prod.price, currency: prod.currency,
        condition: prod.condition as PriceObservation["condition"],
        observed_on: today, source_url: c.url, confidence: "high",
        notes: `Firecrawl TRR capture ${today}`,
      });
    } catch (e) {
      failed++;
      console.warn(`  skip ${c.url}: ${(e as Error).message}`);
    }
    await sleep(1000);
  }

  const res = writeObservations("therealreal", obs);
  console.log(`landing: kept ${res.kept}, dropped ${res.dropped} (${failed} scrape failures) -> ${res.file}`);
  console.log(`Firecrawl credits used this run: ${credits}`);
}

// Run only when invoked as a script (so parseTrrProduct stays importable/testable).
if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
