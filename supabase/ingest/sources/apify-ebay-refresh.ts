/**
 * eBay MID-TIER live refresh via the Apify API (no browser, cron-safe).
 *
 * Sister of apify-trr-refresh.ts. Mid-tier houses (Coach / Kate Spade / Longchamp /
 * Michael Kors / Tory Burch) have ZERO authenticated-reseller inventory (Fashionphile
 * carries none), so eBay is their only live source and the ONLY way the /shop deals
 * surface can show a mid-tier "priced below our estimate" find. eBay live asks are
 * lower-trust than solds (the platform trust model tags eBay `authenticates: "varies"`),
 * so this keeps those live rows FRESH rather than letting stale listings linger as
 * "for sale".
 *
 * Runs `memo23/ebay-search-scraper-ppe` (mode=active) once per brand — eBay blocks
 * ACTIVE-listing scraping harder than sold, and this actor is the one that reliably
 * gets past it (the sold actor, automation-lab/ebay-sold-scraper, can't do active).
 * Normalizes each row to the shape ebay-sold-apify.ts --live reads (itemId/title/price/
 * url/condition) and writes data/ingest/_raw/ebay-live-midtier.json. The load stamps
 * today's observed_on on every live listing = the "last seen" signal reconcile:sold
 * --age-days uses to retire the ended ones.
 *
 * RETIREMENT IS AGE-BASED, not snapshot-diff — an eBay search sees only the newest ~N per
 * brand, so a diff would falsely retire live listings it didn't page to. Refuses to write
 * on an empty dataset (never nuke the surface).
 *
 * Needs APIFY_TOKEN (GitHub Actions secret). Pay-per-result (~$0.003/listing); ~250
 * listings ≈ ~$0.75/run.
 *
 *   APIFY_TOKEN=... npx tsx supabase/ingest/sources/apify-ebay-refresh.ts [--per=60]
 */
import fs from "fs";
import path from "path";

const ACTOR = "memo23~ebay-search-scraper-ppe";

/** Mid-tier houses whose live deals depend on eBay (no authenticated-reseller inventory). */
const BRANDS = ["Coach", "Kate Spade", "Longchamp", "Michael Kors", "Tory Burch"];

interface Memo23Item {
  itemId?: string | null; url?: string | null; title?: string | null;
  price?: string | null; priceValue?: number | null; condition?: string | null;
  availability?: string | null;
}
/** Normalized to the fields ebay-sold-apify.ts --live consumes. */
interface LiveRecord {
  itemId: string; title: string; price: number; url: string;
  condition: string | null; listingType: string; isSold: false;
}

async function runBrand(token: string, brand: string, per: number): Promise<Memo23Item[]> {
  // COST GUARD: the actor's own `maxResults` is NOT a hard cap (a CI run with
  // maxResults=60 still returned 1000/brand). Apify's PLATFORM-level `maxItems` query
  // param IS the enforced cap for pay-per-result actors — it aborts the run at N pushed
  // items, so we pay for at most `per` per brand. Keep BOTH (maxResults as a hint).
  const startRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}&maxItems=${per}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ searchQuery: `${brand} handbag`, mode: "active", maxResults: per, detailedItems: false }),
  });
  if (!startRes.ok) throw new Error(`Apify start failed (${brand}): ${startRes.status} ${await startRes.text()}`);
  const run = (await startRes.json()) as { data: { id: string; defaultDatasetId: string } };
  const { id: runId, defaultDatasetId: datasetId } = run.data;

  const started = Date.now();
  for (;;) {
    if (Date.now() - started > 8 * 60_000) throw new Error(`run ${runId} (${brand}) did not finish in 8 min`);
    await new Promise((r) => setTimeout(r, 6_000));
    const s = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    if (!s.ok) continue;
    const status = ((await s.json()) as { data: { status: string } }).data.status;
    if (status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) throw new Error(`run ${runId} (${brand}) ended ${status}`);
  }

  const items: Memo23Item[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&limit=1000&offset=${offset}`);
    if (!res.ok) throw new Error(`dataset fetch failed (${brand}): ${res.status}`);
    const page = (await res.json()) as Memo23Item[];
    if (page.length === 0) break;
    items.push(...page);
    if (page.length < 1000) break;
  }
  return items;
}

function normalize(raw: Memo23Item[]): LiveRecord[] {
  const out: LiveRecord[] = [];
  const seen = new Set<string>();
  for (const it of raw) {
    const id = it.itemId?.trim();
    const price = typeof it.priceValue === "number" ? it.priceValue : Number(String(it.price ?? "").replace(/[^\d.]/g, ""));
    if (!id || seen.has(id) || !it.title?.trim() || !Number.isFinite(price) || price <= 0) continue;
    seen.add(id);
    out.push({ itemId: id, title: it.title.trim(), price, url: it.url?.trim() || `https://www.ebay.com/itm/${id}`, condition: it.condition?.trim() || null, listingType: "active", isSold: false });
  }
  return out;
}

async function main() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set (GitHub Actions secret).");
  const perArg = process.argv.find((a) => a.startsWith("--per="));
  const per = perArg ? Number(perArg.slice("--per=".length)) || 60 : 60;

  const rawDir = path.join(process.cwd(), "data/ingest/_raw");
  fs.mkdirSync(rawDir, { recursive: true });

  const all: Memo23Item[] = [];
  for (const brand of BRANDS) {
    const items = await runBrand(token, brand, per);
    console.log(`  ${brand}: ${items.length} live records`);
    all.push(...items);
  }

  const records = normalize(all);
  console.log(`normalized ${records.length} distinct live listings from ${all.length} raw`);
  if (records.length === 0) throw new Error("empty result — refusing to write (would falsely retire everything)");

  const rawFile = path.join(rawDir, "ebay-live-midtier.json");
  fs.writeFileSync(rawFile, JSON.stringify(records, null, 2));
  fs.writeFileSync(path.join(rawDir, "ebay-live-refs.json"), JSON.stringify(records.map((r) => r.itemId), null, 2));
  console.log(`wrote ${records.length} records -> ${rawFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
