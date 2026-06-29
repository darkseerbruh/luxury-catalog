/**
 * LLM description-fact pass: read price_history rows that have a stored description
 * reference (`enrichment.source_description`) but haven't been LLM-mined yet, extract
 * the structured facts with Claude Haiku, and MERGE them into `enrichment.desc_facts`.
 *
 * Why: the deterministic extractDescriptionFacts() handles tidy reseller text; this is
 * the fallback for messy seller free-text (esp. eBay) that regex can't parse — pulling
 * measurements, date-code, closure, etc. the templated parser missed. Cheap model +
 * strict "only what's stated" prompt. Dry-run by default; --write.
 *
 *   npx tsx supabase/ingest/enrich-descriptions.ts [--write] [--limit=N] [--platform=eBay]
 *
 * Needs .env.local with SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY. The reference
 * text is written at capture time (PII-scrubbed) into enrichment.source_description.
 *
 * Merge rule: deterministic (regex) values WIN where non-null; the LLM only fills the
 * gaps + owns measurements/has_date_code. Each enriched row is stamped
 * `enrichment.desc_llm_on` so re-runs never re-spend on it.
 */
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../seed/lib/client";
import { buildDescriptionFactsPrompt, parseDescriptionFactsResponse } from "../../src/lib/ingest/enrich";
import { EMPTY_DESCRIPTION_FACTS, type DescriptionFacts } from "../../src/lib/ingest/description-facts";

const MODEL = "claude-haiku-4-5-20251001"; // cheap, high-volume extraction (mirrors enrich-conditions.ts)

const STRING_FIELDS = [
  "color", "pattern", "strap_type", "closure", "interior_material", "hardware_finish", "measurements",
] as const;

/** Deterministic non-null values win; LLM fills the gaps; either source can flag a date code. */
function mergeFacts(deterministic: Partial<DescriptionFacts> | null, llm: DescriptionFacts): DescriptionFacts {
  const det = deterministic ?? {};
  const out: DescriptionFacts = { ...EMPTY_DESCRIPTION_FACTS };
  for (const f of STRING_FIELDS) out[f] = (det[f] ?? llm[f]) ?? null;
  out.has_date_code = Boolean(det.has_date_code) || llm.has_date_code;
  return out;
}

interface Row {
  price_id: number;
  enrichment: Record<string, unknown> & { source_description?: string; desc_facts?: DescriptionFacts };
}

async function main() {
  const write = process.argv.includes("--write");
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1]) || 50;
  const platform = process.argv.find((a) => a.startsWith("--platform="))?.split("=")[1];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local.");
    process.exit(1);
  }

  let q = supabaseAdmin
    .from("price_history")
    .select("price_id, enrichment, platform")
    .not("enrichment->>source_description", "is", null)
    .is("enrichment->>desc_llm_on", null)
    .limit(limit);
  if (platform) q = q.eq("platform", platform);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  console.log(`Found ${rows.length} row(s) to LLM-enrich${platform ? ` (platform=${platform})` : ""}${write ? "" : " (DRY RUN)"}.`);
  if (rows.length === 0) return;

  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);
  let done = 0;
  for (const row of rows) {
    const text = row.enrichment?.source_description;
    if (!text) continue;
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: buildDescriptionFactsPrompt(text) }],
    });
    const out = resp.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const llm = parseDescriptionFactsResponse(out);
    if (!llm) {
      console.warn(`  price_id ${row.price_id}: unparseable response, skipping`);
      continue;
    }
    const merged = mergeFacts(row.enrichment?.desc_facts ?? null, llm);
    const enrichment = { ...row.enrichment, desc_facts: merged, desc_llm_on: today };
    if (write) {
      const { error: upErr } = await supabaseAdmin.from("price_history").update({ enrichment }).eq("price_id", row.price_id);
      if (upErr) throw upErr;
    } else {
      console.log(`  price_id ${row.price_id}:`, JSON.stringify(merged));
    }
    done++;
  }
  console.log(`${write ? "Enriched" : "Previewed"} ${done} row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
