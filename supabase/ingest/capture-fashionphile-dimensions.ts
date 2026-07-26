/**
 * Capture LABELLED dimensions from Fashionphile product pages onto `variant`.
 *
 * This is the second attempt. The first (promote-spec-facts, 2026-07-26) parsed bare
 * "25 x 7 x 3.2" strings from a feed, wrote 285 rows, and had to revert all of them
 * because the axis order was unknowable. What changed: Fashionphile LABELS its axes,
 * so nothing has to be guessed.
 *
 * The trap this avoids, verified on a Speedy 25 against LV's published spec:
 * Fashionphile's "Width" is the front-to-back measurement, i.e. our DEPTH. Its
 * horizontal span is "Base length". Taking the label literally would put a depth in
 * every width column. See src/lib/ingest/labelled-dimensions.ts.
 *
 * DISCIPLINE, mirroring what already protects `closure_type`:
 *   * Only labelled rows parse; unlabelled or unrecognised labels drop out.
 *   * A variant needs >= 2 listings AGREEING before anything is written, because the
 *     same bag measures differently listing to listing (a Speedy 30 came back 8.25in
 *     on one site and 10.75in on another, one slumped and one stood up) and sources
 *     publish real garbage (a bucket bag at 0.25in deep, in the source's own data).
 *   * The measurement convention is stored with the figure. Fashionphile measures at
 *     the BASE, which is not an overall span, and mixing the two costs ~2.7cm on a
 *     Classic Flap Small.
 *
 * COST: zero credits. These are plain GETs that succeed without Firecrawl, and
 * grade-condition-fashionphile.ts already downloads the same HTML daily. Worth
 * folding the two into one pass later so each page is fetched once.
 *
 *   npx tsx supabase/ingest/capture-fashionphile-dimensions.ts                # dry run
 *   npx tsx supabase/ingest/capture-fashionphile-dimensions.ts --write        # apply
 *   npx tsx supabase/ingest/capture-fashionphile-dimensions.ts --limit 200    # cap pages
 *
 * Requires migrations 0065 (dimension columns) and 0068 (provenance).
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import {
  extractFashionphileRows,
  parseLabelledDimensions,
  agreeDimension,
} from "../../src/lib/ingest/labelled-dimensions";

const WRITE = process.argv.includes("--write");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? Number(process.argv[i + 1]) || 0 : 0;
})();

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const PAGE_DELAY_MS = 350;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) return await r.text();
    } catch {
      // fall through to the retry
    }
    await sleep(600);
  }
  return null;
}

interface Row {
  price_id: number;
  variant_id: number | null;
  source_url: string | null;
}

async function main() {
  console.log(`\n=== capture-fashionphile-dimensions (${WRITE ? "WRITE" : "DRY RUN"}) ===\n`);

  // Only variants that still lack dimensions, so a re-run costs nothing on rows we
  // already resolved. Keyset-paginated on price_id (never .range(), per the offset
  // pagination that caused the 07-19 timeout flood).
  // Keyset-paginated: a bare .select() silently caps at 1000 rows in PostgREST,
  // which quietly limited an earlier run to a quarter of the catalogue.
  const needyIds = new Set<number>();
  let vCursor = 0;
  for (;;) {
    const { data, error } = await db
      .from("variant")
      .select("variant_id")
      .is("dimensions_h_cm", null)
      .gt("variant_id", vCursor)
      .order("variant_id", { ascending: true })
      .limit(1000);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const v of data as { variant_id: number }[]) {
      needyIds.add(v.variant_id);
      vCursor = v.variant_id;
    }
  }
  console.log(`variants missing dimensions: ${needyIds.size}`);

  const listings: Row[] = [];
  let cursor = 0;
  for (;;) {
    const { data, error } = await db
      .from("price_history")
      .select("price_id, variant_id, source_url")
      .eq("platform", "Fashionphile")
      .not("source_url", "is", null)
      .not("variant_id", "is", null)
      .gt("price_id", cursor)
      .order("price_id", { ascending: true })
      .limit(1000);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const r of data as Row[]) {
      if (r.variant_id && needyIds.has(r.variant_id) && r.source_url?.includes("/products/")) {
        listings.push(r);
      }
      cursor = r.price_id;
    }
  }

  // One page per variant is useless (consensus needs two), and fetching every listing
  // of a 500-comp icon is wasteful. Cap the pages we pull per variant.
  const byVariant = new Map<number, Row[]>();
  for (const r of listings) {
    const arr = byVariant.get(r.variant_id!) ?? [];
    if (arr.length < 4) arr.push(r);
    byVariant.set(r.variant_id!, arr);
  }
  const candidates = [...byVariant.entries()].filter(([, rows]) => rows.length >= 2);
  const work = LIMIT ? candidates.slice(0, LIMIT) : candidates;

  console.log(`Fashionphile listings on those variants: ${listings.length}`);
  console.log(`variants with >=2 listings (consensus possible): ${candidates.length}`);
  console.log(`processing: ${work.length}\n`);

  let fetched = 0;
  let parsed = 0;
  let resolved = 0;
  let written = 0;

  async function flush(batch: typeof writes) {
    for (const x of batch) {
      const { variant_id, ...cols } = x;
      const { error } = await db
        .from("variant")
        .update({
          ...cols,
          // Provenance travels with the number, so a bad source can be retracted
          // wholesale and nothing is ever averaged across conventions.
          dimensions_convention: "base",
          dimensions_measured: true,
          dimensions_source: "fashionphile",
        })
        .eq("variant_id", variant_id);
      if (error) console.error(`  variant ${variant_id}: ${error.message}`);
      else written += 1;
    }
  }
  const writes: {
    variant_id: number;
    dimensions_w_cm: number;
    dimensions_h_cm: number;
    dimensions_d_cm: number | null;
    strap_drop_cm: number | null;
  }[] = [];

  for (const [variantId, rows] of work) {
    const w: number[] = [];
    const h: number[] = [];
    const d: number[] = [];
    const drop: number[] = [];

    for (const row of rows) {
      const html = await fetchHtml(row.source_url!);
      fetched += 1;
      await sleep(PAGE_DELAY_MS);
      if (!html) continue;
      const dims = parseLabelledDimensions("fashionphile", extractFashionphileRows(html));
      if (!dims) continue;
      parsed += 1;
      if (dims.widthCm) w.push(dims.widthCm);
      if (dims.heightCm) h.push(dims.heightCm);
      if (dims.depthCm) d.push(dims.depthCm);
      if (dims.strapDropCm) drop.push(dims.strapDropCm);
    }

    const width = agreeDimension(w);
    const height = agreeDimension(h);
    if (width === null || height === null) continue; // no agreement, write nothing
    resolved += 1;
    writes.push({
      variant_id: variantId,
      dimensions_w_cm: width,
      dimensions_h_cm: height,
      dimensions_d_cm: agreeDimension(d),
      strap_drop_cm: agreeDimension(drop),
    });

    // Flush incrementally. Collecting thousands of rows and writing once at the end
    // means a crash three hours in loses everything, and this run spans 4,600+
    // variants. Writing as we go also makes progress observable in the database.
    if (WRITE && writes.length >= 25) {
      await flush(writes.splice(0, writes.length));
    }
    if (resolved % 25 === 0) console.log(`  …${resolved} resolved (${fetched} pages fetched, ${written} written)`);
  }

  console.log(`\npages fetched   : ${fetched}`);
  console.log(`pages parsed    : ${parsed}`);
  console.log(`variants agreed : ${resolved}`);

  if (!WRITE) {
    console.log(`\nDry run. Sample:`);
    for (const x of writes.slice(0, 6)) {
      console.log(
        `  variant ${x.variant_id}: ${x.dimensions_w_cm} x ${x.dimensions_h_cm} x ${x.dimensions_d_cm ?? "?"} cm` +
          (x.strap_drop_cm ? `, drop ${x.strap_drop_cm}` : ""),
      );
    }
    console.log(`\nRe-run with --write to apply.`);
    return;
  }

  if (writes.length) await flush(writes);
  console.log(`\nwritten: ${written}`);
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Boolean(process.argv[1]) &&
  import.meta.url === `file://${process.argv[1]}`;

if (invokedDirectly) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
