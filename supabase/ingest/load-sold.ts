/**
 * Load captured SOLD (completed-sale) listings into price_history.
 *
 * Sold prices are the realized-comp signal the value engine prefers for fair value
 * (src/lib/listings.ts specComp: realized = price_type 'sold'). We write them as
 * `price_type='sold'` + `listing_status='sold'`, so:
 *   - they are EXCLUDED from current "offers" (isListed = price_type 'listed' AND
 *     listing_status != 'sold'), and from asking medians (deals.ts keys on 'listed'),
 *   - they ARE included as REALIZED comps for rating, which is the point.
 * This keeps the locked "prices are listing-for" asking displays clean while letting
 * the rating engine use what bags actually sold for.
 *
 * Source: browser sold-search captures (eBay LH_Sold / Poshmark availability=sold /
 * Vestiaire sold), transported via scripts/capture-sink.mjs → data/ingest/_raw/<key>.json.
 * Each record must already be matched to a known variant_id (hero bags); unmatched
 * rows are a separate discovered_listing path, never auto-stamped onto a curated variant.
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Usage: npx tsx supabase/ingest/load-sold.ts data/ingest/_raw/<file>.json [--write]
 *   (dry-run by default; --write actually inserts.)
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

interface SoldRecord {
  variantId: number;
  platform: string;
  salePrice: number;
  listingRef: string; // stable per-listing key for dedup (id or a hash of title+price)
  sourceUrl?: string | null;
  observedOn?: string | null; // ISO date the sale was observed; defaults to today
  colorway?: string | null;
  material?: string | null;
  hardwareColor?: string | null;
  productionYear?: number | null;
  condition?: string | null;
}

function isValid(r: SoldRecord): boolean {
  return (
    Number.isFinite(r.variantId) &&
    typeof r.platform === "string" &&
    r.platform.length > 0 &&
    Number.isFinite(r.salePrice) &&
    r.salePrice > 0 &&
    typeof r.listingRef === "string" &&
    r.listingRef.length > 0
  );
}

async function main() {
  const file = process.argv[2];
  const write = process.argv.includes("--write");
  if (!file) {
    console.error("Usage: tsx supabase/ingest/load-sold.ts <file.json> [--write]");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const raw = JSON.parse(readFileSync(file, "utf8")) as SoldRecord[];
  const records = raw.filter(isValid);
  // de-dup within the file by (platform, listingRef), keep the first
  const seen = new Set<string>();
  const unique = records.filter((r) => {
    const k = `${r.platform}|${r.listingRef}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`Read ${raw.length} rows, ${unique.length} valid + unique.`);

  // skip rows already loaded as sold (idempotent re-runs): match on (variant, platform, listing_ref)
  const today = new Date().toISOString().slice(0, 10);
  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const r of unique) {
    const { data: existing } = await sb
      .from("price_history")
      .select("price_id")
      .eq("variant_id", r.variantId)
      .eq("platform", r.platform)
      .eq("listing_ref", r.listingRef)
      .eq("price_type", "sold")
      .limit(1);
    if (existing && existing.length) {
      skipped++;
      continue;
    }
    toInsert.push({
      variant_id: r.variantId,
      platform: r.platform,
      sale_price: r.salePrice,
      currency: "USD",
      price_type: "sold",
      listing_status: "sold",
      listing_ref: r.listingRef,
      source_url: r.sourceUrl ?? null,
      observed_on: r.observedOn ?? today,
      delisted_on: r.observedOn ?? today,
      date_recorded: today,
      confidence_level: "high",
      colorway: r.colorway ?? null,
      material: r.material ?? null,
      hardware_color: r.hardwareColor ?? null,
      production_year: r.productionYear ?? null,
      condition: r.condition ?? null,
    });
  }

  console.log(`To insert: ${toInsert.length} | already loaded (skipped): ${skipped}`);
  if (!write) {
    console.log("DRY RUN. Re-run with --write to insert. Sample:", JSON.stringify(toInsert[0] ?? null));
    return;
  }
  if (!toInsert.length) {
    console.log("Nothing new to insert.");
    return;
  }
  // insert in chunks
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const { error } = await sb.from("price_history").insert(chunk);
    if (error) {
      console.error("Insert error:", error);
      process.exit(1);
    }
    console.log(`Inserted ${Math.min(i + 500, toInsert.length)}/${toInsert.length}`);
  }
  console.log("Done.");
}

main();
