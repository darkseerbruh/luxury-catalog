/**
 * Seed Reputation claims from a research pass.
 *
 * A research pass (the shape of docs/research-drafts/reputation-poc-chanel-19.md)
 * produces two things: a set of sources, and a set of claims each backed by some of
 * them. This turns that into `reputation_claim` rows.
 *
 * THE BARS (owner, 2026-07-26):
 *   * A BAG needs >= 5 distinct sources before ANY of its claims publish. That is the
 *     "did we actually research this" gate.
 *   * A CLAIM needs >= 2 sources. Corroboration, without demanding 5 per sentence —
 *     the Chanel 19 pass had 11 sources for the bag but individual claims sat at 2 to
 *     6, so a 5-per-claim rule would have left only the blandest statements.
 *   * A community source is NOT required (owner call). Paid reviewers do skew
 *     positive, so instead of excluding them the bag page DISCLOSES when a bag's
 *     sources lean commercial. Surface the bias, do not gate on it.
 *
 * Everything is validated before a single write, and the whole file is rejected if
 * any claim fails. A half-seeded bag is worse than an unseeded one.
 *
 *   npx tsx supabase/ingest/seed-reputation-claims.ts <file.json>           # dry run
 *   npx tsx supabase/ingest/seed-reputation-claims.ts <file.json> --write   # apply
 */
import { readFileSync } from "node:fs";
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const FILE = process.argv.find((a) => a.endsWith(".json"));

/** A bag needs this many distinct sources before any of its claims publish. */
export const MIN_SOURCES_PER_BAG = 5;
/** A single claim needs this many sources backing it. */
export const MIN_SOURCES_PER_CLAIM = 2;

export interface SeedSource {
  label: string;
  url: string;
  kind: "community" | "commercial";
}

export interface SeedClaim {
  body: string;
  stance: "pro" | "con" | "neutral";
  axisHint?: string | null;
  /** Indexes into the pass's `sources` array. */
  sourceIdx: number[];
}

export interface SeedPass {
  /** Exactly one of these. */
  variantId?: number;
  styleId?: number;
  /** Human label, for the dry-run report only. */
  bag: string;
  /** Date the sources were read. Reputation drifts, so every claim is stamped. */
  asOf: string;
  sources: SeedSource[];
  claims: SeedClaim[];
}

export interface Validation {
  ok: boolean;
  errors: string[];
}

/** Validate a pass against the bars. Pure, so it is unit-tested without a database. */
export function validatePass(p: SeedPass): Validation {
  const errors: string[] = [];

  const hasVariant = typeof p.variantId === "number";
  const hasStyle = typeof p.styleId === "number";
  if (hasVariant === hasStyle) {
    errors.push("Set exactly one of variantId or styleId.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.asOf ?? "")) {
    errors.push(`asOf must be YYYY-MM-DD, got ${JSON.stringify(p.asOf)}.`);
  }

  // Distinct by URL: five links to the same thread is one source.
  const distinct = new Set((p.sources ?? []).map((s) => s.url.trim().toLowerCase()));
  if (distinct.size < MIN_SOURCES_PER_BAG) {
    errors.push(
      `${p.bag}: ${distinct.size} distinct source(s), needs ${MIN_SOURCES_PER_BAG}.`,
    );
  }
  (p.sources ?? []).forEach((s, i) => {
    if (!s.url?.startsWith("http")) errors.push(`source[${i}] has no usable url.`);
    if (s.kind !== "community" && s.kind !== "commercial") {
      errors.push(`source[${i}] kind must be community or commercial.`);
    }
  });

  if (!p.claims?.length) errors.push(`${p.bag}: no claims.`);
  (p.claims ?? []).forEach((c, i) => {
    const n = new Set(c.sourceIdx ?? []).size;
    if (n < MIN_SOURCES_PER_CLAIM) {
      errors.push(`claim[${i}] has ${n} source(s), needs ${MIN_SOURCES_PER_CLAIM}: "${c.body.slice(0, 50)}…"`);
    }
    for (const idx of c.sourceIdx ?? []) {
      if (!p.sources?.[idx]) errors.push(`claim[${i}] references source ${idx}, which does not exist.`);
    }
    const len = c.body?.trim().length ?? 0;
    if (len < 10 || len > 240) {
      errors.push(`claim[${i}] body is ${len} chars, must be 10-240 (the DB check).`);
    }
    if (!["pro", "con", "neutral"].includes(c.stance)) {
      errors.push(`claim[${i}] stance must be pro, con or neutral.`);
    }
  });

  return { ok: errors.length === 0, errors };
}

/** Split a claim's sources into the community/commercial counts the row stores. */
export function sourceMix(p: SeedPass, c: SeedClaim): { community: number; commercial: number } {
  let community = 0;
  let commercial = 0;
  for (const idx of new Set(c.sourceIdx)) {
    const s = p.sources[idx];
    if (!s) continue;
    if (s.kind === "community") community += 1;
    else commercial += 1;
  }
  return { community, commercial };
}

async function main() {
  if (!FILE) {
    console.error("Pass a research-pass JSON file. See the SeedPass interface.");
    process.exit(1);
  }
  const pass = JSON.parse(readFileSync(FILE, "utf8")) as SeedPass;

  const v = validatePass(pass);
  console.log(`\n=== seed-reputation-claims (${WRITE ? "WRITE" : "DRY RUN"}) ===`);
  console.log(`bag        : ${pass.bag}`);
  console.log(`target     : ${pass.variantId ? `variant ${pass.variantId}` : `style ${pass.styleId}`}`);
  console.log(`as of      : ${pass.asOf}`);
  console.log(`sources    : ${pass.sources?.length ?? 0} (${new Set((pass.sources ?? []).map((s) => s.url)).size} distinct)`);
  console.log(`claims     : ${pass.claims?.length ?? 0}`);

  const comm = (pass.sources ?? []).filter((s) => s.kind === "commercial").length;
  if (comm > (pass.sources?.length ?? 0) / 2) {
    console.log(`⚠️  sources lean COMMERCIAL (${comm}/${pass.sources.length}). The bag page will say so.`);
  }

  if (!v.ok) {
    console.error(`\n❌ rejected, nothing written:`);
    for (const e of v.errors) console.error(`   ${e}`);
    process.exit(1);
  }
  console.log(`✅ passes the bars (>=${MIN_SOURCES_PER_BAG} per bag, >=${MIN_SOURCES_PER_CLAIM} per claim)`);

  const rows = pass.claims.map((c) => {
    const mix = sourceMix(pass, c);
    return {
      variant_id: pass.variantId ?? null,
      style_id: pass.styleId ?? null,
      body: c.body.trim(),
      stance: c.stance,
      axis_hint: c.axisHint ?? null,
      sources: [...new Set(c.sourceIdx)].map((i) => pass.sources[i]),
      community_sources: mix.community,
      commercial_sources: mix.commercial,
      as_of: pass.asOf,
    };
  });

  if (!WRITE) {
    console.log(`\nWould insert ${rows.length} claim(s):`);
    for (const r of rows) console.log(`  [${r.stance}] ${r.body.slice(0, 88)}…  (${r.community_sources}c/${r.commercial_sources}$)`);
    console.log(`\nDry run. Re-run with --write to apply.`);
    return;
  }

  const { error, count } = await db.from("reputation_claim").insert(rows, { count: "exact" });
  if (error) {
    console.error(`insert failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`\nwrote ${count ?? rows.length} claim(s).`);
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Boolean(process.argv[1]) &&
  import.meta.url === `file://${process.argv[1]}`;

if (invokedDirectly) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
