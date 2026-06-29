/**
 * Report condition coverage in price_history — the before/after for the condition
 * backfill. Prints, for each price_type and overall: total rows, rows with a graded
 * `condition` enum, rows with any `condition_detail` text, and the grade histogram;
 * plus a per-platform breakdown for listed rows (where the homepage rail reads).
 *
 * Read-only. Usage: npx tsx supabase/ingest/condition-coverage.ts
 */

import { supabaseAdmin as db } from "../seed/lib/client";

async function count(filter: (q: ReturnType<typeof base>) => ReturnType<typeof base>): Promise<number> {
  const { count: n, error } = await filter(base());
  if (error) throw new Error(error.message);
  return n ?? 0;
}

function base() {
  return db.from("price_history").select("*", { count: "exact", head: true });
}

const PRICE_TYPES = ["listed", "sold", "auction", "retail_msrp", "estimate"] as const;
const GRADES = ["new", "excellent", "very good", "good", "fair"] as const;

function pct(n: number, d: number): string {
  return d === 0 ? "0%" : `${((100 * n) / d).toFixed(2)}%`;
}

async function main() {
  console.log("=== price_history condition coverage ===\n");

  const total = await count((q) => q);
  console.log(`TOTAL rows: ${total}\n`);

  console.log("by price_type:  rows | graded(condition) | has condition_detail");
  for (const pt of PRICE_TYPES) {
    const rows = await count((q) => q.eq("price_type", pt));
    if (rows === 0) continue;
    const graded = await count((q) => q.eq("price_type", pt).not("condition", "is", null));
    const detail = await count((q) => q.eq("price_type", pt).not("condition_detail", "is", null));
    console.log(`  ${pt.padEnd(12)} ${String(rows).padStart(7)} | ${String(graded).padStart(7)} (${pct(graded, rows)}) | ${String(detail).padStart(6)} (${pct(detail, rows)})`);
  }

  console.log("\nlisted grade histogram:");
  for (const g of GRADES) {
    const n = await count((q) => q.eq("price_type", "listed").eq("condition", g));
    console.log(`  ${g.padEnd(12)} ${n}`);
  }

  console.log("\ntop platforms (listed): rows | graded");
  const { data: plats, error } = await db
    .from("price_history")
    .select("platform")
    .eq("price_type", "listed")
    .limit(1); // probe; real per-platform numbers below via count
  if (error) throw new Error(error.message);
  // Distinct platforms aren't cheap to fetch generically; report the known captures.
  for (const p of ["The RealReal", "TheRealReal", "Fashionphile", "Vestiaire", "eBay", "Poshmark"]) {
    const rows = await count((q) => q.eq("price_type", "listed").ilike("platform", p));
    if (rows === 0) continue;
    const graded = await count((q) => q.eq("price_type", "listed").ilike("platform", p).not("condition", "is", null));
    console.log(`  ${p.padEnd(14)} ${String(rows).padStart(7)} | ${String(graded).padStart(7)} (${pct(graded, rows)})`);
  }
  void plats;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
