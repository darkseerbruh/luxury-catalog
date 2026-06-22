/**
 * LLM enrichment pass: read price_history rows that have condition_detail but no
 * enrichment yet, extract structured sub-signals (corner wear, tarnish, full set…)
 * with Claude Haiku, and write them to the enrichment JSONB (migration 0022).
 * Cheap model + strict "only what's stated" prompt. Dry-run by default; --write.
 *
 *   npx tsx supabase/ingest/enrich-conditions.ts [--write] [--limit=N]
 *
 * Needs .env.local with SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY, and the
 * detailed resale rows loaded (migration 0022 applied + a capture run).
 */
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../seed/lib/client";
import { buildEnrichmentPrompt, parseEnrichmentResponse } from "../../src/lib/ingest/enrich";

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

  const { data, error } = await supabaseAdmin
    .from("price_history")
    .select("price_id, condition_detail")
    .not("condition_detail", "is", null)
    .is("enrichment", null)
    .limit(limit);
  if (error) throw error;
  const rows = data ?? [];
  console.log(`Found ${rows.length} row(s) to enrich${write ? "" : " (DRY RUN)"}.`);
  if (rows.length === 0) return;

  const client = new Anthropic({ apiKey });
  let done = 0;
  for (const row of rows as { price_id: number; condition_detail: string }[]) {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: buildEnrichmentPrompt(row.condition_detail) }],
    });
    const text = resp.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const enrichment = parseEnrichmentResponse(text);
    if (!enrichment) {
      console.warn(`  price_id ${row.price_id}: unparseable response, skipping`);
      continue;
    }
    if (write) {
      const { error: upErr } = await supabaseAdmin
        .from("price_history")
        .update({ enrichment })
        .eq("price_id", row.price_id);
      if (upErr) throw upErr;
    } else {
      console.log(`  price_id ${row.price_id}:`, JSON.stringify(enrichment));
    }
    done++;
  }
  console.log(`${write ? "Enriched" : "Previewed"} ${done} row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
