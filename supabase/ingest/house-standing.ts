/**
 * House Standing — data layer + report.
 *
 * Loads live per-brand resale signals, runs the PURE formula (src/lib/house-standing.ts),
 * and prints each house's placement. Read-only by default.
 *
 *   npx tsx supabase/ingest/house-standing.ts            # report (dry run)
 *   npx tsx supabase/ingest/house-standing.ts --write    # backfill brand.tier
 *
 * --write is OWNER-GATED: it sets brand.tier to the numbered band, which needs the
 * numeric enum values from migration 0052 applied first. Without them the update
 * errors and the script says so (it never half-writes). The on-page tier labels +
 * the "how we tier houses" page are a separate coordinated change (spec §Rollout).
 */
import { supabaseAdmin as sb } from "../seed/lib/client";
import {
  computeHouseStanding,
  TIER_DESCRIPTOR,
  type BrandSignals,
  type TierRank,
} from "../../src/lib/house-standing";

const WRITE = process.argv.includes("--write");
const PAGE = 1000;
const RETAIL = /retail|boutique|msrp|in[-\s]?store|flagship/i;

async function fetchAll<T>(t: string, c: string, apply?: (q: any) => any): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    let q = sb.from(t).select(c).range(from, from + PAGE - 1);
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) throw new Error(`${t}: ${error.message}`);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

function pctile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function loadSignals(): Promise<BrandSignals[]> {
  const brands = await fetchAll<any>("brand", "brand_id, name");
  const styles = await fetchAll<any>("style", "style_id, brand_id");
  const variants = await fetchAll<any>("variant", "variant_id, style_id");
  const styleBrand = new Map<number, number>(styles.map((s) => [s.style_id, s.brand_id]));
  const variantBrand = new Map<number, number>();
  for (const v of variants) {
    const b = styleBrand.get(v.style_id);
    if (b != null) variantBrand.set(v.variant_id, b);
  }
  const prices = await fetchAll<any>("price_history", "variant_id, sale_price, platform");
  const byBrand = new Map<number, number[]>();
  for (const r of prices) {
    if (r.platform && RETAIL.test(r.platform)) continue;
    const b = variantBrand.get(r.variant_id);
    if (b == null) continue;
    const p = Number(r.sale_price);
    if (!Number.isFinite(p) || p <= 0) continue;
    (byBrand.get(b) ?? byBrand.set(b, []).get(b)!).push(p);
  }
  return brands.map((br) => {
    const sorted = (byBrand.get(br.brand_id) ?? []).sort((a, b) => a - b);
    return {
      brandId: br.brand_id,
      name: br.name,
      resaleMedian: pctile(sorted, 50),
      ceiling: pctile(sorted, 90),
      tradeCount: sorted.length,
    };
  });
}

async function main() {
  const standings = computeHouseStanding(await loadSignals());
  const placed = standings.filter((s) => s.tier != null);
  console.log(`=== House Standing — ${new Date().toISOString().slice(0, 10)} — ${placed.length} placed, ${standings.length - placed.length} unplaced ===\n`);
  console.log("tier  score  house                 n       median   ceiling");
  for (const s of standings) {
    const tier = s.tier == null ? " -" : ` ${s.tier}`;
    console.log(
      `${tier}   ${String(s.score ?? "—").padStart(5)}  ${s.name.padEnd(20)} ${String(s.tradeCount).padStart(6)}   ${String(s.resaleMedian ?? "—").padStart(6)}   ${s.ceiling ?? "—"}`,
    );
  }
  console.log("\nbands:");
  for (const t of [1, 2, 3, 4, 5] as TierRank[]) {
    const names = placed.filter((s) => s.tier === t).map((s) => s.name);
    console.log(`  Tier ${t} — ${TIER_DESCRIPTOR[t]}: ${names.join(", ") || "(none)"}`);
  }

  if (!WRITE) {
    console.log("\nDRY RUN — re-run with --write to backfill brand.tier (needs migration 0052 applied).");
    return;
  }

  let updated = 0;
  for (const s of placed) {
    const { error } = await sb.from("brand").update({ tier: String(s.tier) }).eq("brand_id", s.brandId);
    if (error) {
      console.error(`  ⚠ could not set tier on ${s.name}: ${error.message}`);
      console.error(`    (Apply migration 0052 first — the numeric brand_tier values must exist.)`);
      process.exit(1);
    }
    updated++;
  }
  console.log(`\n✅ backfilled tier on ${updated} house(s).`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
