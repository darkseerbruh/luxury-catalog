/**
 * Backfill `price_history.condition` (and `condition_detail`) for rows ingestion
 * left null. Two modes, both idempotent, dry-run by default (pass --write):
 *
 *   map     (default, free, no network) — re-derive the SaleCondition enum from a
 *           wear write-up we ALREADY captured (condition_detail, else notes) using
 *           the shared conservative mapper. Fills rows whose grade was stored as
 *           text but never mapped to the enum. Costs nothing; run it first.
 *
 *   refetch (network; TRR gated on FIRECRAWL_API_KEY) — for rows still null with a
 *           resolvable source_url, re-fetch the listing page and read condition
 *           from the source. Implemented for The RealReal via the proven
 *           parseTrrProduct (JSON-LD itemCondition → new/null + raw detail). Other
 *           platforms are skipped until their page-shape refetcher is added.
 *
 * Never invents a grade (docs/data-collection-handoff.md §1): anything the source
 * doesn't state stays null. Only `condition`/`condition_detail` are written —
 * price, identity, and provenance are never touched.
 *
 * Usage:
 *   npx tsx supabase/ingest/backfill-condition.ts [--mode=map|refetch|both]
 *       [--source=<platform substr>] [--price-type=listed] [--limit=N]
 *       [--max-credits=N] [--write]
 */

import { supabaseAdmin as db } from "../seed/lib/client";
import { mapConditionText } from "../../src/lib/ingest/condition";
import { parseTrrProduct } from "./sources/firecrawl-trr";
import { scrape, sleep } from "./lib/firecrawl";
import type { SaleCondition } from "../../src/lib/ingest/types";

interface Row {
  id: number;
  platform: string | null;
  source_url: string | null;
  condition: string | null;
  condition_detail: string | null;
  notes: string | null;
}

interface Args {
  mode: "map" | "refetch" | "both";
  source: string | null;
  priceType: string;
  limit: number;
  maxCredits: number;
  write: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (k: string) => {
    const hit = argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split("=").slice(1).join("=") : null;
  };
  const mode = (get("mode") ?? "map") as Args["mode"];
  if (!["map", "refetch", "both"].includes(mode)) throw new Error(`bad --mode: ${mode}`);
  return {
    mode,
    source: get("source"),
    priceType: get("price-type") ?? "listed",
    limit: Number(get("limit") ?? Infinity),
    maxCredits: Number(get("max-credits") ?? 2000),
    write: argv.includes("--write"),
  };
}

/** Page through every null-condition row matching the filters (Supabase caps at 1000/req). */
async function fetchNullRows(args: Args): Promise<Row[]> {
  const out: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; out.length < args.limit; from += PAGE) {
    let q = db
      .from("price_history")
      .select("id, platform, source_url, condition, condition_detail, notes")
      .is("condition", null)
      .eq("price_type", args.priceType)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (args.source) q = q.ilike("platform", `%${args.source}%`);
    const { data, error } = await q;
    if (error) throw new Error(`fetch null rows: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }
  return out.slice(0, args.limit === Infinity ? undefined : args.limit);
}

/** Apply condition (+ optional detail) updates in chunks; no-op in dry-run. */
async function applyUpdates(
  updates: Array<{ id: number; condition: SaleCondition; condition_detail?: string }>,
  write: boolean
): Promise<void> {
  if (!write || updates.length === 0) return;
  const CHUNK = 25;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    await Promise.all(
      slice.map((u) => {
        const patch: Record<string, unknown> = { condition: u.condition };
        if (u.condition_detail !== undefined) patch.condition_detail = u.condition_detail;
        return db.from("price_history").update(patch).eq("id", u.id);
      })
    );
  }
}

/** MAP mode: grade from already-captured text. Returns count graded. */
async function runMap(rows: Row[], write: boolean): Promise<number> {
  const updates: Array<{ id: number; condition: SaleCondition }> = [];
  const tally: Record<string, number> = {};
  for (const r of rows) {
    const grade = mapConditionText(r.condition_detail) ?? mapConditionText(r.notes);
    if (grade) {
      updates.push({ id: r.id, condition: grade });
      tally[grade] = (tally[grade] ?? 0) + 1;
    }
  }
  console.log(`  map: ${updates.length}/${rows.length} rows graded from stored text`, tally);
  await applyUpdates(updates, write);
  return updates.length;
}

/** REFETCH mode (The RealReal): re-read the listing page for condition. Returns count graded. */
async function runRefetchTrr(rows: Row[], args: Args): Promise<number> {
  const trr = rows.filter(
    (r) => r.source_url && /realreal/i.test(r.platform ?? "") && /realreal\.com/i.test(r.source_url)
  );
  if (trr.length === 0) {
    console.log("  refetch: no resolvable The RealReal rows in this batch");
    return 0;
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log(`  refetch: ${trr.length} TRR rows resolvable but FIRECRAWL_API_KEY unset — skipping (owner-gated spend).`);
    return 0;
  }
  const updates: Array<{ id: number; condition: SaleCondition; condition_detail?: string }> = [];
  let credits = 0;
  for (const r of trr) {
    if (credits >= args.maxCredits) {
      console.log(`  refetch: hit --max-credits=${args.maxCredits}, stopping (${updates.length} graded so far)`);
      break;
    }
    try {
      const page = await scrape(r.source_url!, { formats: ["rawHtml"], proxy: "auto" });
      credits += page.creditsUsed;
      const prod = page.rawHtml ? parseTrrProduct(page.rawHtml) : null;
      const grade = prod ? (prod.condition as SaleCondition | null) : null;
      if (grade) {
        updates.push({ id: r.id, condition: grade, condition_detail: prod!.conditionDetail ?? undefined });
      }
    } catch (e) {
      console.warn(`  refetch skip ${r.source_url}: ${(e as Error).message}`);
    }
    await sleep(1000);
  }
  console.log(`  refetch(TRR): ${updates.length}/${trr.length} graded · ${credits} Firecrawl credits used`);
  await applyUpdates(updates, args.write);
  return updates.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `backfill-condition: mode=${args.mode} source=${args.source ?? "*"} price_type=${args.priceType} ` +
      `limit=${args.limit} write=${args.write ? "YES" : "dry-run"}`
  );

  const rows = await fetchNullRows(args);
  console.log(`null-condition rows in scope: ${rows.length}`);

  let graded = 0;
  if (args.mode === "map" || args.mode === "both") graded += await runMap(rows, args.write);
  if (args.mode === "refetch" || args.mode === "both") {
    // Re-pull the still-null set for refetch when both modes run in one pass.
    const stillNull = args.mode === "both" ? await fetchNullRows(args) : rows;
    graded += await runRefetchTrr(stillNull, args);
  }

  console.log(`\nDONE — ${graded} rows graded ${args.write ? "(written)" : "(dry-run; pass --write to persist)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
