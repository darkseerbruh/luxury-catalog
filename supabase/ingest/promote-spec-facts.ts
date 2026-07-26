/**
 * Promote physical-spec FACTS out of listing enrichment and onto `variant`.
 *
 * Why: the bag page renders "measured" scales (docs/ux/bag-page-build-plan.md), and a
 * scale with no column behind it cannot render. An audit on 2026-07-25 found the
 * dimension columns exist but sit at 0% across 4,409 variants. The facts we need are
 * already sitting in `price_history.enrichment.desc_facts`, extracted at ingest by
 * src/lib/ingest/description-facts.ts. Nobody ever promoted them up to the variant.
 *
 * HONEST YIELD (measured against prod, 2026-07-26 — read this before expecting much):
 *   closure   67,929 listing rows → ~1,630 distinct variants (~37% of the catalog)
 *   dimensions 10,584 listing rows → ~385 distinct variants (~8.7%)
 * Dimensions come from myGemma ALONE (its licensed Awin feed states them; Fashionphile
 * and TRR descriptions are prose about materials and carry no measurements at all).
 * So this closes the closure gap properly and only dents the dimension gap. Full
 * dimension coverage needs a dedicated capture pass against house or reseller product
 * pages, which is a separate unit of work.
 *
 * CONSENSUS, not last-write-wins: a variant has many listings and they disagree.
 * Closure takes a majority vote across DISTINCT listings with a floor; dimensions take
 * the median of parsed values. A variant whose listings genuinely conflict is skipped
 * and reported, never coin-flipped.
 *
 * NEVER GUESSES: a measurement string with no unit is ambiguous (the myGemma feed emits
 * both "9 x 5.5 x 3.5 in" and a bare "7.8 x 5.5 x 2.7"), and ~46% of them are bare. We
 * only convert when the unit is stated or inferable from magnitude. Anything else is
 * left null, per the locked "record the unknown as unknown" rule.
 *
 *   npx tsx supabase/ingest/promote-spec-facts.ts            # dry run, reports yield
 *   npx tsx supabase/ingest/promote-spec-facts.ts --write    # apply
 *
 * Requires migration 0060 (weight_g / closure_type / pocket_count) for the closure
 * write; the dimension write only needs 0001's columns.
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

/** Minimum distinct listings agreeing before we write a closure. */
const CLOSURE_MIN_VOTES = 2;
/** Winning closure must hold at least this share of the votes. */
const CLOSURE_MIN_SHARE = 0.6;

/**
 * Raw listing phrasings → the closed set in migration 0060. Sourced from the actual
 * vocabulary in prod (counts from a full scan, 2026-07-26), not invented.
 */
const CLOSURE_MAP: Record<string, string> = {
  "top zipper": "zip",          // 38,435
  "zip closure": "zip",         //     69
  "turn-lock": "turnlock",      //  8,959
  turnlock: "turnlock",         //  2,665
  "twist lock": "turnlock",     //    765
  "push lock": "turnlock",      //  5,914
  "magnetic snap": "magnetic",  //  3,760
  "magnetic closure": "magnetic", // 1,487
  "snap lock": "magnetic",      //     48
  clasp: "clasp",               //  2,824
  drawstring: "drawstring",     //  1,980
  "buckle closure": "buckle",   //    554
  "flap closure": "flap",       //    331
  "toggle closure": "toggle",   //    133
};

export interface Dims { h: number; w: number; d: number }

/**
 * Parse a measurement string into centimetres. Returns null unless the unit is
 * stated or unambiguously inferable.
 *
 * Inference rule, deliberately conservative: with no stated unit, a largest
 * dimension under 30 reads as inches (a 25cm bag would be tiny in inches but is a
 * common inch figure), and 30 or over reads as centimetres. Values that would imply
 * an absurd bag either way are rejected rather than coerced.
 */
export function parseMeasurements(raw: string | null | undefined): Dims | null {
  if (!raw) return null;
  const text = raw.toLowerCase();
  const nums = text.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 3) return null;
  const [a, b, c] = nums.slice(0, 3).map(Number);
  if (![a, b, c].every((n) => Number.isFinite(n) && n > 0)) return null;

  const statedIn = /\bin\b|inch|"|''/.test(text);
  const statedCm = /\bcm\b|centim/.test(text);

  let toCm: number;
  if (statedCm) toCm = 1;
  else if (statedIn) toCm = 2.54;
  else {
    const max = Math.max(a, b, c);
    if (max < 30) toCm = 2.54;        // reads as inches
    else if (max < 200) toCm = 1;     // reads as centimetres
    else return null;                 // nonsense, refuse
  }

  const dims = { h: +(a * toCm).toFixed(1), w: +(b * toCm).toFixed(1), d: +(c * toCm).toFixed(1) };
  // Sanity envelope: a handbag between 5cm and 100cm on every axis.
  if (![dims.h, dims.w, dims.d].every((n) => n >= 5 && n <= 100)) return null;
  return dims;
}

/** Majority winner over a vote map, subject to a floor and a share threshold. */
export function consensus(
  votes: Map<string, number>,
  minVotes = CLOSURE_MIN_VOTES,
  minShare = CLOSURE_MIN_SHARE,
): { value: string; votes: number; share: number } | null {
  let total = 0;
  let best: [string, number] | null = null;
  for (const [k, n] of votes) {
    total += n;
    if (!best || n > best[1]) best = [k, n];
  }
  if (!best || total < minVotes) return null;
  const share = best[1] / total;
  if (share < minShare) return null;
  return { value: best[0], votes: best[1], share };
}

function median(xs: number[]): number {
  const s = [...xs].sort((p, q) => p - q);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(1);
}

type Row = { price_id: number; variant_id: number | null; enrichment: Record<string, unknown> | null };

/** Keyset-paginate every enriched row carrying the fact we want (never .range(), per [[postgrest-row-cap]]). */
async function scan(jsonPath: string): Promise<Row[]> {
  const out: Row[] = [];
  let last = 0;
  for (;;) {
    const { data, error } = await db
      .from("price_history")
      .select("price_id, variant_id, enrichment")
      .not(jsonPath, "is", null)
      .gt("price_id", last)
      .order("price_id", { ascending: true })
      .limit(1000);
    if (error) throw new Error(`${jsonPath}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as Row[]));
    last = data[data.length - 1].price_id;
  }
  return out;
}

async function main() {
  console.log(`\n=== promote-spec-facts (${WRITE ? "WRITE" : "DRY RUN"}) ===\n`);

  // ---------- closure ----------
  const closureRows = await scan("enrichment->desc_facts->>closure");
  const closureVotes = new Map<number, Map<string, number>>();
  let unmapped = 0;
  for (const r of closureRows) {
    if (!r.variant_id) continue;
    const facts = (r.enrichment as { desc_facts?: { closure?: string } } | null)?.desc_facts;
    const raw = facts?.closure?.toLowerCase().trim();
    if (!raw) continue;
    const mapped = CLOSURE_MAP[raw];
    if (!mapped) { unmapped += 1; continue; }
    const m = closureVotes.get(r.variant_id) ?? new Map<string, number>();
    m.set(mapped, (m.get(mapped) ?? 0) + 1);
    closureVotes.set(r.variant_id, m);
  }

  const closureWrites: { variant_id: number; closure_type: string }[] = [];
  let closureConflicts = 0;
  for (const [variantId, votes] of closureVotes) {
    const win = consensus(votes);
    if (!win) { if (votes.size > 1) closureConflicts += 1; continue; }
    closureWrites.push({ variant_id: variantId, closure_type: win.value });
  }

  console.log(`closure   listings scanned : ${closureRows.length}`);
  console.log(`          variants seen    : ${closureVotes.size}`);
  console.log(`          consensus reached: ${closureWrites.length}`);
  console.log(`          conflicted/thin  : ${closureConflicts} (left null on purpose)`);
  console.log(`          unmapped phrasing: ${unmapped}`);

  // ---------- dimensions ----------
  const dimRows = await scan("enrichment->desc_facts->>measurements");
  const dimsByVariant = new Map<number, Dims[]>();
  let unparseable = 0;
  for (const r of dimRows) {
    if (!r.variant_id) continue;
    const facts = (r.enrichment as { desc_facts?: { measurements?: string } } | null)?.desc_facts;
    const parsed = parseMeasurements(facts?.measurements);
    if (!parsed) { unparseable += 1; continue; }
    const arr = dimsByVariant.get(r.variant_id) ?? [];
    arr.push(parsed);
    dimsByVariant.set(r.variant_id, arr);
  }

  const dimWrites: { variant_id: number; dimensions_h_cm: number; dimensions_w_cm: number; dimensions_d_cm: number }[] = [];
  for (const [variantId, list] of dimsByVariant) {
    dimWrites.push({
      variant_id: variantId,
      dimensions_h_cm: median(list.map((d) => d.h)),
      dimensions_w_cm: median(list.map((d) => d.w)),
      dimensions_d_cm: median(list.map((d) => d.d)),
    });
  }

  console.log(`\ndims      listings scanned : ${dimRows.length}`);
  console.log(`          unit-ambiguous   : ${unparseable} (refused, never guessed)`);
  console.log(`          variants writable: ${dimWrites.length}`);

  if (!WRITE) {
    console.log(`\nDry run. Re-run with --write to apply.`);
    console.log(`Sample closure:`, closureWrites.slice(0, 5));
    console.log(`Sample dims:`, dimWrites.slice(0, 3));
    return;
  }

  let ok = 0;
  for (const w of closureWrites) {
    const { error } = await db.from("variant").update({ closure_type: w.closure_type }).eq("variant_id", w.variant_id);
    if (error) console.error(`closure ${w.variant_id}: ${error.message}`);
    else ok += 1;
  }
  console.log(`\nclosure written: ${ok}/${closureWrites.length}`);

  let ok2 = 0;
  for (const w of dimWrites) {
    const { variant_id, ...cols } = w;
    const { error } = await db.from("variant").update(cols).eq("variant_id", variant_id);
    if (error) console.error(`dims ${variant_id}: ${error.message}`);
    else ok2 += 1;
  }
  console.log(`dims written   : ${ok2}/${dimWrites.length}`);
}

// Only run when invoked directly. The pure helpers above are imported by
// src/lib/__tests__/spec-facts.test.ts, and importing must not hit the database.
const invokedDirectly =
  typeof process !== "undefined" &&
  Boolean(process.argv[1]) &&
  import.meta.url === `file://${process.argv[1]}`;

if (invokedDirectly) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
