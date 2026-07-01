/**
 * Loads docs/tiktok-trending-terms.csv into the `tiktok_trend` table
 * (migration 0041). This is the refresh step: after a new TikTok Creative Center
 * "Saved" list is screen-recorded and re-parsed into the CSV, run this to update
 * the living table the /admin/trends page reads.
 *
 * HUMAN-GATED: needs .env.local with NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY, and migration 0041 applied first.
 *
 *   npx tsx supabase/seed/seed-tiktok-trends.ts
 *
 * Idempotent: upserts on `term`. It writes ONLY the machine columns, so the
 * owner-edited columns (creators_saturation, content_status, notes) are
 * preserved on every re-run. This loader invents nothing; it serializes the CSV,
 * which traces back to the owner's screen-recording (popularity is TikTok's
 * signal; growth_pct is directional, verify in-app).
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./lib/client";

const CSV = path.resolve(__dirname, "../../docs/tiktok-trending-terms.csv");

// The CSV is machine-generated with no embedded commas/quotes, so a plain split
// is safe. Guard anyway: if a future CSV adds quoting, bail loudly.
function parseCsv(text: string): Record<string, string>[] {
  if (text.includes('"')) {
    throw new Error("CSV contains quotes; upgrade parseCsv to a real CSV reader.");
  }
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

async function main() {
  const rows = parseCsv(fs.readFileSync(CSV, "utf8"));
  const today = new Date().toISOString().slice(0, 10);

  // Machine columns only. Omitting the human columns means PostgREST leaves them
  // untouched on conflict (merge-duplicates), preserving owner edits.
  const payload = rows
    .filter((r) => r.term)
    .map((r) => ({
      term: r.term,
      popularity: r.popularity || null,
      pop_num: r.pop_num ? Number(r.pop_num) : null,
      growth_pct: r.growth_pct || null,
      brand: r.brand || null,
      suggested_content: r.suggested_content || null,
      our_page: r.our_page || null,
      sat_priority: r.sat_priority ? Number(r.sat_priority) : null,
      captured_on: today,
      updated_at: new Date().toISOString(),
    }));

  // Upsert in chunks to stay well under any payload limits.
  const CHUNK = 200;
  let done = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK);
    const { error } = await supabaseAdmin
      .from("tiktok_trend")
      .upsert(slice, { onConflict: "term", ignoreDuplicates: false });
    if (error) {
      console.error("upsert error:", error.message);
      process.exit(1);
    }
    done += slice.length;
  }

  const { count } = await supabaseAdmin
    .from("tiktok_trend")
    .select("*", { count: "exact", head: true });
  console.log(`Upserted ${done} rows. tiktok_trend now has ${count} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
