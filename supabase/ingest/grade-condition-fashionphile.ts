/**
 * DB-native Fashionphile condition grader. Reads price_history rows that are Fashionphile
 * and still have a NULL condition, fetches each listing's product page (server fetch — FP
 * product pages answer plain GET, 0 Firecrawl credits), reads the condition grade, and
 * UPDATEs the row. The DB is the state, so it's fully resumable + CI-durable (no dump
 * dependency, unlike the bulk fashionphile-condition.ts which is for initial capture).
 *
 *   npx tsx supabase/ingest/grade-condition-fashionphile.ts [--limit=N] [--write]
 *
 * Idempotent: only touches NULL-condition rows; run it in --limit chunks (e.g. daily CI)
 * and it chips through the backlog, then keeps new listings graded. Needs .env.local.
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { parseConditionGrade } from "./sources/fashionphile-condition";
import { mapFashionphileCondition } from "../../src/lib/ingest/fashionphile";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_DELAY_MS = 300;
const BACKOFFS = [4000, 12000, 30000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string): Promise<string | null> {
  for (let attempt = 0; attempt <= BACKOFFS.length; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) return await r.text();
      if ((r.status === 503 || r.status === 429) && attempt < BACKOFFS.length) { await sleep(BACKOFFS[attempt]); continue; }
      return null;
    } catch {
      if (attempt < BACKOFFS.length) { await sleep(BACKOFFS[attempt]); continue; }
      return null;
    }
  }
  return null;
}

interface Row { price_id: number; source_url: string | null }

async function main() {
  const write = process.argv.includes("--write");
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1]) || 300;

  console.log(`grade-condition-fashionphile: grading up to ${limit} null-condition rows${write ? "" : " (DRY RUN)"}.`);

  // Cursor-paginate by price_id (PostgREST caps a single fetch at 1000). Graded rows go
  // non-null and misses stay null, but the price_id cursor moves past both, so each row is
  // processed exactly once per run.
  let graded = 0, missed = 0, processed = 0, cursor = 0;
  while (processed < limit) {
    const { data, error } = await db
      .from("price_history")
      .select("price_id, source_url")
      .eq("platform", "Fashionphile")
      .is("condition", null)
      .eq("listing_status", "available") // only LIVE listings are gradeable (sold pages are gone)
      .not("source_url", "is", null)
      .like("source_url", "%/products/%")
      .gt("price_id", cursor)
      .order("price_id", { ascending: true })
      .limit(Math.min(1000, limit - processed));
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;

    for (const row of rows) {
      cursor = row.price_id;
      processed++;
      const html = await fetchHtml(row.source_url!);
      const condition = html ? mapFashionphileCondition(parseConditionGrade(html)) : null;
      if (condition) {
        if (write) {
          const { error: upErr } = await db.from("price_history").update({ condition }).eq("price_id", row.price_id);
          if (upErr) console.error(`  price_id ${row.price_id}: ${upErr.message}`);
        }
        graded++;
      } else missed++;
      await sleep(PAGE_DELAY_MS);
      if (processed % 50 === 0) console.log(`  …${processed} (graded ${graded}, missed ${missed})`);
    }
  }
  console.log(`${write ? "Graded" : "Would grade"} ${graded}, missed ${missed} (processed ${processed}).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
