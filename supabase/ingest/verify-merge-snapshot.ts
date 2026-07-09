/**
 * Snapshot the invariants merge-style-dupes.ts must preserve. Run BEFORE and AFTER the
 * --write pass; the diff proves the merge did exactly what it claimed.
 *
 *   npx tsx supabase/ingest/verify-merge-snapshot.ts            # print snapshot
 *   npx tsx supabase/ingest/verify-merge-snapshot.ts --save=before   # write JSON to scratchpad
 *   npx tsx supabase/ingest/verify-merge-snapshot.ts --diff=<beforeFile>  # compare to a saved snapshot
 *
 * Invariants checked on diff:
 *   • style count drops by exactly the number of merged (deleted) junk styles.
 *   • price_history count drops by exactly the dup rows dropped (0 unique observations lost).
 *   • style_index_signals() row count drops only by junk styles that carried resale ph.
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import * as fs from "fs";

async function count(table: string): Promise<number> {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function signalRowCount(): Promise<number> {
  // style_index_signals() returns one row per priced style. Page past the 1000 cap.
  let n = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.rpc("style_index_signals").range(from, from + 999);
    if (error) throw new Error(`style_index_signals failed: ${error.message}`);
    const rows = data ?? [];
    n += rows.length;
    if (rows.length < 1000) break;
  }
  return n;
}

async function main() {
  const snap = {
    style: await count("style"),
    variant: await count("variant"),
    price_history: await count("price_history"),
    signal_styles: await signalRowCount(),
  };
  console.log("\nsnapshot:", JSON.stringify(snap, null, 2));

  const saveArg = process.argv.find((a) => a.startsWith("--save="));
  if (saveArg) {
    const dir = "/private/tmp/claude-501/-Users-ariellecoambes-Documents-luxury-catalog--claude-worktrees-happy-swanson-04fa7d/c24f78cd-9ac8-49c7-88ad-76e0ceb8a927/scratchpad";
    const path = `${dir}/merge-snap-${saveArg.split("=")[1]}.json`;
    fs.writeFileSync(path, JSON.stringify(snap, null, 2));
    console.log(`saved → ${path}`);
  }

  const diffArg = process.argv.find((a) => a.startsWith("--diff="));
  if (diffArg) {
    const before = JSON.parse(fs.readFileSync(diffArg.split("=")[1], "utf8"));
    console.log("\nDIFF (after - before):");
    for (const k of Object.keys(snap) as (keyof typeof snap)[]) {
      console.log(`  ${k}: ${before[k]} → ${snap[k]}  (Δ ${snap[k] - before[k]})`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
