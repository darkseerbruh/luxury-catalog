/**
 * Data-integrity detector: find listings that DON'T BELONG on the bag variant they're
 * attached to — the same "priced-well outlier" idea the deals rail uses, flipped into a
 * discrepancy finder (owner's insight, 2026-07-11). A row that is a wild low outlier
 * inside its variant is EITHER a genuine deal OR a mis-attached foreign object; this pass
 * separates the two using the shared model classifier, so the deals rail, the shop, the
 * ingest gate, and this cleanup all agree on what a "bag of this style" is.
 *
 * Three signals, two confidence tiers:
 *   TIER A (high confidence — auto re-pointed with --write):
 *     • accessory     — raw title is a non-bag SLG / tech case / trinket
 *                       (card holder, iPad case, locket…) → isNonBagAccessory()
 *     • wrong-model   — title resolves to a DIFFERENT known model than the attached
 *                       style (e.g. our dict says "Camera Bag", it sits under "Boy")
 *                       → titleNamesDifferentStyle()
 *   TIER B (review only — reported, NEVER auto-moved):
 *     • price-outlier — a listed/sold row priced far below its variant's CLEAN resale
 *                       median with a title that shares none of the style's own words.
 *                       Could be a real deal; a human decides. Surfaced so nothing hides.
 *
 * Re-point, not delete ([[feedback_historical_price_data]]): a Tier-A price row is first
 * preserved verbatim in discovered_listing (un-promoted, unresolved_reason 'non_bag' /
 * 'wrong_model') as raw evidence, THEN removed from price_history. Fully reversible — the
 * row still exists as a discovered listing and can be re-promoted to the right style.
 *
 *   npx tsx supabase/ingest/detect-listing-discrepancies.ts                 # DRY RUN (report only)
 *   npx tsx supabase/ingest/detect-listing-discrepancies.ts --write         # re-point accessory rows (reversible)
 *   npx tsx supabase/ingest/detect-listing-discrepancies.ts --tag           # persist item_class instead (needs migration 0053)
 *   npx tsx supabase/ingest/detect-listing-discrepancies.ts --include-wrong-model  # also move wrong-model in --write
 *   npx tsx supabase/ingest/detect-listing-discrepancies.ts --outlier=0.6   # Tier-B threshold (default 0.6 = 60% under)
 *   npx tsx supabase/ingest/detect-listing-discrepancies.ts --json=/path    # write full report JSON
 */
import { writeFileSync } from "node:fs";
import { supabaseAdmin as db } from "../seed/lib/client";
import { isNonBagAccessory, titleNamesDifferentStyle, canonicalModel } from "../../src/lib/ingest/model-normalize";

const WRITE = process.argv.includes("--write");
// wrong-model catches (title resolves to a different KNOWN model than the style) are
// mostly correct but can misfire on the dictionary's line-vs-model ordering
// ("Ava Triomphe" → Triomphe). Auto re-point ACCESSORY rows only by default; wrong-model
// goes to the review report unless explicitly opted in.
const INCLUDE_WM = process.argv.includes("--include-wrong-model");
// Non-destructive alternative to --write: stamp price_history.item_class (migration 0053)
// instead of re-pointing. Tags BOTH accessory + wrong-model so the column is a full audit
// record; readers still treat NULL as 'bag'. Requires 0053 to be applied.
const TAG = process.argv.includes("--tag");
const OUTLIER_PCT = Number(
  (process.argv.find((a) => a.startsWith("--outlier=")) ?? "--outlier=0.6").split("=")[1],
); // Tier-B: price <= median * (1 - OUTLIER_PCT). 0.6 => 60%+ under.
const MIN_SAMPLE = 5; // don't grade a variant's outliers on a handful of comps
const JSON_OUT = (process.argv.find((a) => a.startsWith("--json=")) ?? "").split("=")[1] || null;

/** Mirror of deals.ts / the 0021 view: a row is retail (not resale) when it's an explicit
 *  retail_msrp, or a legacy null-type row on a retail platform. */
const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

/** Curated STRONG non-bag object nouns that gate the AUTO re-point. isNonBagAccessory()
 *  is broad on purpose (it also excludes a bag from the deals rail, where a false hit is
 *  harmless). Re-pointing DB rows must be surgical, so we only auto-move accessory rows
 *  whose title names an unambiguous SLG / shoe / jewelry OBJECT — never an apparel-texture
 *  or colour word ("Shirt Effect", "Ballerina") that merely tripped the broad gate. */
const STRONG_ACCESSORY_RX =
  /\b(pouch|wallet|card\s?holder|cardholder|card\s?case|coin\s?purse|key\s?pouch|key\s?case|cosmetic|toiletry|phone\s?(?:case|holder|pouch)|airpod|wristlet|necklace|earring|brooch|sunglass|twilly|sandal|boots?|loafer|mule|derby|espadrille|slingback|pump|heels|hat|scarf)\b/i;

interface PhRow {
  price_id: number;
  variant_id: number;
  platform: string | null;
  price_type: string | null;
  sale_price: number | string | null;
  currency: string | null;
  source_url: string | null;
  listing_ref: string | null;
  condition: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
  production_year: number | null;
  season: string | null;
  observed_on: string | null;
  notes: string | null;
  variant: {
    style: { name: string | null; brand: { name: string | null } | null } | null;
  } | null;
}
interface SummaryRow {
  variant_id: number;
  resale_low: number | null;
  resale_median: number | null;
  resale_high: number | null;
  sample_size: number | null;
  currency: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase builder chained in `apply`
type QueryBuilder = any;
async function pageAll<T>(table: string, cols: string, apply: (q: QueryBuilder) => QueryBuilder): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(db.from(table).select(cols).range(from, from + 999));
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

function refFromUrl(url: string | null): string | null {
  if (!url) return null;
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop();
  return seg || null;
}

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length ? (s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2) : 0;
}

const one = <T>(rel: T | T[] | null | undefined): T | null => (Array.isArray(rel) ? rel[0] : rel) ?? null;
const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Significant (≥3-char) words of a style name, for the Tier-B name-share check. */
function styleWords(styleName: string | null): Set<string> {
  return new Set(norm(styleName).split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
}

type Tier = "accessory" | "wrong-model" | "price-outlier";
interface Flag {
  tier: Tier;
  confidence: "A" | "B";
  price_id: number;
  variant_id: number;
  brand: string;
  style: string;
  title: string;
  price: number;
  median: number;
  pctUnder: number;
  row: PhRow;
}

async function main() {
  console.log(`detect-listing-discrepancies: ${WRITE ? "WRITE (Tier-A re-point)" : "DRY RUN"}  outlier>=${Math.round(OUTLIER_PCT * 100)}%\n`);

  const rows = await pageAll<PhRow>(
    "price_history",
    "price_id, variant_id, platform, price_type, sale_price, currency, source_url, listing_ref, condition, colorway, material, hardware_color, production_year, season, observed_on, notes, variant:variant_id(style:style_id(name, brand:brand_id(name)))",
    (q) => q.not("sale_price", "is", null),
  );
  console.log(`scanned ${rows.length} price_history rows.\n`);

  // Group by variant; split clean-bag resale prices (for the median) from foreign rows.
  interface Grp {
    variant_id: number;
    brand: string;
    style: string;
    styleIsAccessory: boolean;
    cleanResale: number[];
    rows: { row: PhRow; price: number; foreign: Tier | null }[];
  }
  const groups = new Map<number, Grp>();

  for (const r of rows) {
    const price = r.sale_price != null ? Number(r.sale_price) : NaN;
    if (!Number.isFinite(price) || price <= 0) continue;
    const isRetail =
      r.price_type === "retail_msrp" ||
      (r.price_type == null && r.platform != null && RETAIL_PLATFORM_RX.test(r.platform));
    if (isRetail) continue;

    const style = r.variant ? one(r.variant.style) : null;
    const styleName = style?.name ?? "";
    const brand = style?.brand ? one(style.brand)?.name ?? "" : "";

    let g = groups.get(r.variant_id);
    if (!g) {
      // A style that is ITSELF an accessory (LV Pochette Accessoires, Dior Caro Pouch,
      // Goyard Toiletry Pouch…) is not a bag we're de-contaminating — its accessory
      // listings correctly belong. Skip the whole group so we never re-point them.
      const styleIsAccessory =
        isNonBagAccessory(styleName) ||
        /(pochette|clutch|wallet|pouch|toiletry|cosmetic|card\s?holder|coin|key\s?pouch|bride.?a.?brac)/i.test(norm(styleName));
      g = { variant_id: r.variant_id, brand, style: styleName, styleIsAccessory, cleanResale: [], rows: [] };
      groups.set(r.variant_id, g);
    }

    // Same-model rescue: if the title resolves to the SAME canonical model as the style,
    // it IS the correct bag — a colour/type word merely tripped a token ("Faye Bracelet
    // Bag", "Shopping Bag Ballerina"). Never flag those.
    const titleModel = canonicalModel(brand, r.notes);
    const styleModel = canonicalModel(brand, styleName);
    const sameModel = titleModel != null && styleModel != null && titleModel === styleModel;

    let foreign: Tier | null = null;
    if (!g.styleIsAccessory && !sameModel) {
      if (isNonBagAccessory(r.notes)) foreign = "accessory";
      else if (titleNamesDifferentStyle(brand, styleName, r.notes)) foreign = "wrong-model";
    }
    g.rows.push({ row: r, price, foreign });
    if (!foreign) g.cleanResale.push(price); // median is the CLEAN bag population only
  }

  const flags: Flag[] = [];
  for (const g of groups.values()) {
    const med = median(g.cleanResale);
    const words = styleWords(g.style);
    for (const { row, price, foreign } of g.rows) {
      const pctUnder = med > 0 ? Math.round(((med - price) / med) * 100) : 0;
      if (foreign) {
        flags.push({
          tier: foreign,
          confidence: "A",
          price_id: row.price_id,
          variant_id: g.variant_id,
          brand: g.brand,
          style: g.style,
          title: row.notes ?? "",
          price: Math.round(price),
          median: Math.round(med),
          pctUnder,
          row,
        });
        continue;
      }
      // TIER B: a steep low outlier whose title shares NONE of the style's words.
      const isListedish = row.price_type === "listed" || row.price_type === "sold" || row.price_type == null;
      const titleWords = styleWords(row.notes);
      const sharesWord = [...words].some((w) => titleWords.has(w));
      if (
        isListedish &&
        med > 0 &&
        g.cleanResale.length >= MIN_SAMPLE &&
        price <= med * (1 - OUTLIER_PCT) &&
        row.notes &&
        words.size > 0 &&
        !sharesWord
      ) {
        flags.push({
          tier: "price-outlier",
          confidence: "B",
          price_id: row.price_id,
          variant_id: g.variant_id,
          brand: g.brand,
          style: g.style,
          title: row.notes ?? "",
          price: Math.round(price),
          median: Math.round(med),
          pctUnder,
          row,
        });
      }
    }
  }

  const tierA = flags.filter((f) => f.confidence === "A");
  const tierB = flags.filter((f) => f.confidence === "B");
  const byTier = (t: Tier) => flags.filter((f) => f.tier === t);

  // ---- REPORT ----
  console.log("=== TIER A (high confidence — foreign objects on a bag variant) ===");
  console.log(`  accessory:   ${byTier("accessory").length}`);
  console.log(`  wrong-model: ${byTier("wrong-model").length}`);
  console.log(`  TOTAL Tier-A rows: ${tierA.length} across ${new Set(tierA.map((f) => f.variant_id)).size} variant(s)\n`);
  for (const f of tierA.slice(0, 60)) {
    console.log(`  [${f.tier}] v${f.variant_id} ${f.brand} / ${f.style}  $${f.price} (med $${f.median}, ${f.pctUnder}% under)`);
    console.log(`        "${f.title.slice(0, 80)}"`);
  }
  if (tierA.length > 60) console.log(`  … +${tierA.length - 60} more (see --json for the full list)`);

  console.log(`\n=== TIER B (review only — steep outliers, title shares no style word) ===`);
  console.log(`  price-outlier: ${tierB.length}  (>=${Math.round(OUTLIER_PCT * 100)}% under, n>=${MIN_SAMPLE})\n`);
  for (const f of tierB.slice(0, 40)) {
    console.log(`  v${f.variant_id} ${f.brand} / ${f.style}  $${f.price} (med $${f.median}, ${f.pctUnder}% under)  "${f.title.slice(0, 70)}"`);
  }
  if (tierB.length > 40) console.log(`  … +${tierB.length - 40} more`);

  if (JSON_OUT) {
    writeFileSync(
      JSON_OUT,
      JSON.stringify(
        flags.map(({ row, ...f }) => f), // eslint-disable-line @typescript-eslint/no-unused-vars
        null,
        2,
      ),
    );
    console.log(`\nwrote full report → ${JSON_OUT}`);
  }

  // Auto-movable subset: accessory always; wrong-model only with --include-wrong-model.
  const autoRows = tierA.filter(
    (f) =>
      (f.tier === "accessory" && STRONG_ACCESSORY_RX.test(f.title)) ||
      (INCLUDE_WM && f.tier === "wrong-model"),
  );
  const reviewOnly = tierA.filter((f) => !autoRows.includes(f));
  console.log(
    `\nAuto-re-point set: ${autoRows.length} row(s) [accessory${INCLUDE_WM ? " + wrong-model" : ""}].` +
      (reviewOnly.length ? `  Held for review: ${reviewOnly.length} wrong-model row(s) (pass --include-wrong-model to move them).` : ""),
  );

  // ---- TAG mode: persist item_class instead of deleting (needs migration 0053) ----
  if (TAG) {
    const probe = await db.from("price_history").select("item_class").limit(1);
    if (probe.error) {
      console.error(`\n--tag needs price_history.item_class — apply migration 0053 first (${probe.error.message}).`);
      return;
    }
    const groupsOf = (t: Tier) => tierA.filter((f) => f.tier === t).map((f) => f.price_id);
    for (const [cls, ids] of [
      ["accessory", groupsOf("accessory")],
      ["wrong_model", groupsOf("wrong-model")],
    ] as const) {
      for (let i = 0; i < ids.length; i += 500) {
        const { error } = await db.from("price_history").update({ item_class: cls }).in("price_id", ids.slice(i, i + 500));
        if (error) throw new Error(`item_class tag failed: ${error.message}`);
      }
      console.log(`tagged ${ids.length} row(s) item_class='${cls}'.`);
    }
    console.log("\n✅ tagged (non-destructive). Reads still treat untagged rows as 'bag'.");
    return;
  }

  if (!WRITE) {
    console.log(`\nDRY RUN — re-run with --write to re-point the ${autoRows.length}-row auto set to discovered_listing (reversible), or --tag to persist item_class non-destructively (needs migration 0053). Tier-B + held wrong-model are never auto-moved.`);
    return;
  }

  if (autoRows.length === 0) {
    console.log("\nNothing to re-point.");
    return;
  }

  // ---- WRITE: re-point the auto set (preserve to discovered_listing, then delete) ----
  const affectedVariants = [...new Set(autoRows.map((f) => f.variant_id))].sort((a, b) => a - b);
  const before = await summaries(affectedVariants);

  // 1) Which Tier-A rows lack a discovered_listing backup? Preserve those first.
  const platforms = [...new Set(autoRows.map((f) => f.row.platform).filter(Boolean))] as string[];
  const backupUrls = new Set(
    (
      await Promise.all(
        platforms.map((p) =>
          pageAll<{ source_url: string | null }>("discovered_listing", "source_url", (q) => q.eq("platform", p)),
        ),
      )
    )
      .flat()
      .map((r) => r.source_url),
  );
  const seen = new Set<string>();
  const preserve = autoRows
    .filter((f) => !backupUrls.has(f.row.source_url))
    .map((f) => ({
      platform: f.row.platform ?? "unknown",
      listing_ref: f.row.listing_ref ?? refFromUrl(f.row.source_url) ?? `ph-${f.price_id}`,
      source_url: f.row.source_url,
      raw_name: f.row.notes,
      brand_guess: f.brand || null,
      price_type: f.row.price_type ?? "listed",
      sale_price: f.row.sale_price != null ? Number(f.row.sale_price) : null,
      currency: f.row.currency ?? "USD",
      condition: f.row.condition,
      colorway: f.row.colorway,
      material: f.row.material,
      hardware_color: f.row.hardware_color,
      production_year: f.row.production_year,
      season: f.row.season,
      unresolved_reason: f.tier === "accessory" ? "non_bag" : "wrong_model",
      observed_on: f.row.observed_on,
    }))
    .filter((d) => d.sale_price != null && d.observed_on)
    .filter((d) => {
      const k = `${d.platform}|${d.listing_ref}|${d.observed_on}|${d.sale_price}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  if (preserve.length) {
    const { error } = await db
      .from("discovered_listing")
      .upsert(preserve, { onConflict: "platform,listing_ref,observed_on,sale_price", ignoreDuplicates: true });
    if (error) throw new Error(`preserve upsert failed: ${error.message}`);
    console.log(`\npreserved ${preserve.length} row(s) with no backup into discovered_listing (un-promoted).`);
  }

  // 2) Delete the Tier-A price_history rows (their evidence now lives in discovered_listing).
  const ids = autoRows.map((f) => f.price_id);
  for (let i = 0; i < ids.length; i += 500) {
    const { error } = await db.from("price_history").delete().in("price_id", ids.slice(i, i + 500));
    if (error) throw new Error(`price_history delete failed: ${error.message}`);
  }
  console.log(`re-pointed ${ids.length} accessory price row(s) off their bag variants.`);

  // 3) Refresh the summary MV and show affected variants before/after.
  const { error: rErr } = await db.rpc("refresh_variant_price_summary");
  if (rErr) console.warn(`(warn) refresh_variant_price_summary failed: ${rErr.message}`);
  const after = await summaries(affectedVariants);
  console.log("\nAffected variant price summaries (before → after):");
  for (const v of affectedVariants.slice(0, 40)) {
    const fmt = (s: SummaryRow | undefined) =>
      s ? `n=${s.sample_size} med=${s.resale_median ?? "-"} [${s.resale_low ?? "-"}–${s.resale_high ?? "-"}]` : "(no summary)";
    console.log(`   v${v}  before: ${fmt(before.get(v))}   after: ${fmt(after.get(v))}`);
  }
  console.log("\n✅ done.");
}

async function summaries(variantIds: number[]): Promise<Map<number, SummaryRow>> {
  const map = new Map<number, SummaryRow>();
  for (let i = 0; i < variantIds.length; i += 500) {
    const { data } = await db
      .from("variant_price_summary")
      .select("variant_id, resale_low, resale_median, resale_high, sample_size, currency")
      .in("variant_id", variantIds.slice(i, i + 500));
    for (const r of (data ?? []) as SummaryRow[]) map.set(r.variant_id, r);
  }
  return map;
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("detect-listing-discrepancies failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
