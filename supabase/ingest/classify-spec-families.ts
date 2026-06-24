/**
 * Auto-classify NEW color/material names into families — the self-healing layer for the
 * Shop filter taxonomy.
 *
 * The keyword classifier in src/lib/listings-taxonomy.ts handles the common names. Anything
 * it can't place lands in "Other". This script finds those unknowns in the live data, asks
 * Claude to assign each to one of the controlled families (or leave it "Other" if genuinely
 * ambiguous), and merges the result into src/lib/data/spec-families.json — a committed
 * overrides file the classifier reads first. So new Hermès/Chanel color names categorize
 * themselves: run this, commit the JSON, deploy.
 *
 *   npx tsx supabase/ingest/classify-spec-families.ts            # dry run (prints, no write)
 *   npx tsx supabase/ingest/classify-spec-families.ts --write    # persist into the JSON
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (to read the
 * distinct names) and ANTHROPIC_API_KEY (to classify). Reads prices; writes only the JSON.
 * Honest by design: the family set is a fixed vocabulary and "Other" is allowed, so it
 * never invents a category — it only sorts a name into an existing one.
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../seed/lib/client";
import {
  colorFamily,
  materialFamily,
  COLOR_FAMILY_NAMES,
  MATERIAL_FAMILY_NAMES,
} from "../../src/lib/listings-taxonomy";

const FILE = path.resolve(__dirname, "../../src/lib/data/spec-families.json");
const BATCH = 40;
const MODEL = "claude-haiku-4-5-20251001";

interface OverridesFile {
  _note?: string;
  colors: Record<string, string>;
  materials: Record<string, string>;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Distinct non-empty values of a price_history column, keyed normalized → original casing. */
async function distinctValues(column: "colorway" | "material"): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("price_history")
      .select(column)
      .not(column, "is", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as Record<string, string | null>[]) {
      const raw = r[column];
      if (!raw) continue;
      const k = norm(raw);
      if (k && !out.has(k)) out.set(k, raw.trim());
    }
    if (data.length < PAGE) break;
  }
  return out;
}

/** Ask Claude to map each name to one family (or "Other"). Returns normalized-key → family. */
async function classifyBatch(
  anthropic: Anthropic,
  kind: "color" | "material",
  names: string[],
  families: string[],
): Promise<Record<string, string>> {
  const noun = kind === "color" ? "designer handbag color names" : "designer handbag leather/material names";
  const prompt = `You sort ${noun} into broad families for a shopping filter.

Allowed families (choose EXACTLY one per name): ${families.join(", ")}, Other

Rules:
- Pick the single best family. Use "Other" only when the name truly doesn't fit any family (e.g. a pattern or a non-color word).
- These are luxury/French names too (e.g. "Étoupe" is a greige → Beige; "Rouge H" → Red; "Togo" is a calf leather → Leather).
- Respond with ONLY a JSON object mapping each input name EXACTLY as given to its family. No prose, no markdown.

Names:
${JSON.stringify(names)}`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text;
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(json) as Record<string, string>;
  const valid = new Set([...families, "Other"]);
  const result: Record<string, string> = {};
  for (const [name, family] of Object.entries(parsed)) {
    if (typeof family === "string" && valid.has(family) && family !== "Other") {
      result[norm(name)] = family;
    }
  }
  return result;
}

async function classifyUnknowns(
  anthropic: Anthropic,
  kind: "color" | "material",
  distinct: Map<string, string>,
  isKnown: (s: string) => string | null,
  families: string[],
): Promise<Record<string, string>> {
  const unknown = [...distinct.entries()].filter(([k]) => isKnown(k) === null);
  console.log(`${kind}: ${distinct.size} distinct, ${unknown.length} unclassified`);
  const learned: Record<string, string> = {};
  for (let i = 0; i < unknown.length; i += BATCH) {
    const slice = unknown.slice(i, i + BATCH);
    const names = slice.map(([, original]) => original);
    try {
      const got = await classifyBatch(anthropic, kind, names, families);
      Object.assign(learned, got);
      console.log(`  batch ${i / BATCH + 1}: classified ${Object.keys(got).length}/${slice.length}`);
    } catch (e) {
      console.error(`  batch ${i / BATCH + 1} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return learned;
}

async function main() {
  const write = process.argv.includes("--write");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing in .env.local");
  const anthropic = new Anthropic({ apiKey });

  const file = JSON.parse(fs.readFileSync(FILE, "utf8")) as OverridesFile;
  file.colors ??= {};
  file.materials ??= {};

  const [colors, materials] = await Promise.all([distinctValues("colorway"), distinctValues("material")]);

  const learnedColors = await classifyUnknowns(anthropic, "color", colors, colorFamily, COLOR_FAMILY_NAMES);
  const learnedMaterials = await classifyUnknowns(anthropic, "material", materials, materialFamily, MATERIAL_FAMILY_NAMES);

  // Merge (don't clobber existing hand-edits/learned entries).
  let added = 0;
  for (const [k, v] of Object.entries(learnedColors)) {
    if (!file.colors[k]) {
      file.colors[k] = v;
      added++;
    }
  }
  for (const [k, v] of Object.entries(learnedMaterials)) {
    if (!file.materials[k]) {
      file.materials[k] = v;
      added++;
    }
  }

  console.log(`\nNewly classified: ${added} (colors ${Object.keys(learnedColors).length}, materials ${Object.keys(learnedMaterials).length})`);
  const sample = [...Object.entries(learnedColors), ...Object.entries(learnedMaterials)].slice(0, 15);
  for (const [k, v] of sample) console.log(`  ${k} → ${v}`);

  if (!write) {
    console.log(`\nDry run — re-run with --write to persist into ${path.relative(process.cwd(), FILE)}.`);
    return;
  }
  // Keep keys sorted for stable diffs.
  file.colors = Object.fromEntries(Object.entries(file.colors).sort(([a], [b]) => a.localeCompare(b)));
  file.materials = Object.fromEntries(Object.entries(file.materials).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(FILE, JSON.stringify(file, null, 2) + "\n");
  console.log(`\nWrote ${path.relative(process.cwd(), FILE)} (${Object.keys(file.colors).length} colors, ${Object.keys(file.materials).length} materials). Commit it to deploy.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
