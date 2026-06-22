/**
 * LLM item-spec pass: read price_history rows that have listing text (notes /
 * condition_detail) but no parsed production_year yet, extract the structured
 * spec (production_year, season, colorway, material, hardware_color) with Claude
 * Haiku, and write it to the migration-0022 columns. This is what populates the
 * era×condition matrix + attribute grading on the bag page. Cheap model + strict
 * "only what's stated" prompt. Dry-run by default; --write to persist.
 *
 *   npx tsx supabase/ingest/enrich-specs.ts [--write] [--limit=N]
 *
 * Needs .env.local with SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY, migrations
 * 0022 + 0023 applied, and resale rows captured (notes/condition_detail loaded).
 * Mirrors enrich-conditions.ts (the proven condition-enrichment runner).
 */
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../seed/lib/client";
import { buildSpecPrompt, parseSpecResponse, EMPTY_SPEC } from "../../src/lib/ingest/spec-extract";

const MODEL = "claude-haiku-4-5-20251001"; // cheap, high-volume extraction

async function main() {
  const write = process.argv.includes("--write");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) || 50 : 50;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local.");
    process.exit(1);
  }

  // Source text = listing title (notes) + condition write-up; target = rows not
  // yet spec-parsed (production_year still null).
  const { data, error } = await supabaseAdmin
    .from("price_history")
    .select("price_id, notes, condition_detail")
    .is("production_year", null)
    .or("notes.not.is.null,condition_detail.not.is.null")
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as { price_id: number; notes: string | null; condition_detail: string | null }[];
  console.log(`Found ${rows.length} row(s) to spec-parse${write ? "" : " (DRY RUN)"}.`);
  if (rows.length === 0) return;

  const client = new Anthropic({ apiKey });
  let done = 0;
  for (const row of rows) {
    const text = [row.notes, row.condition_detail].filter(Boolean).join(" — ");
    if (!text) continue;
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: buildSpecPrompt(text) }],
    });
    const out = resp.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const spec = parseSpecResponse(out);
    if (!spec) {
      console.warn(`  price_id ${row.price_id}: unparseable response, skipping`);
      continue;
    }
    // Skip rows where the model found nothing real — don't churn no-op updates.
    if (JSON.stringify(spec) === JSON.stringify(EMPTY_SPEC)) {
      console.log(`  price_id ${row.price_id}: nothing extractable`);
      continue;
    }
    if (write) {
      const { error: upErr } = await supabaseAdmin
        .from("price_history")
        .update(spec)
        .eq("price_id", row.price_id);
      if (upErr) throw upErr;
    } else {
      console.log(`  price_id ${row.price_id}:`, JSON.stringify(spec));
    }
    done++;
  }
  console.log(`${write ? "Spec-parsed" : "Previewed"} ${done} row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
