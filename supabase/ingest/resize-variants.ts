/**
 * Re-point price rows to the correct-SIZE variant of their style.
 *
 * Owner report 2026-07-11: the ingest match dumped micro / mini / jumbo listings onto a
 * style's "main" size variant (e.g. every Classic Flap size landed on v199 "Medium (M/L)"),
 * so a size's own page + the Amazon-style Size selector went unpopulated and the deals rail
 * compared a micro-mini to a medium median. The size variants ALREADY EXIST (v2085 Micro,
 * v1653 Mini, v201 Jumbo…); the fix is to route each listing to its own-size sibling.
 *
 * Size is parsed from the listing's title + source-url slug (parseSizeBucket), the same
 * parser the deals rail uses. A row moves only when its size clearly differs from the
 * bucket of the variant it currently sits on AND exactly one sibling variant matches the
 * target size (ambiguous many-match cases — e.g. Mini Rectangular vs Square — are reported
 * for review, never guessed). Sizes with listings but no variant are reported as
 * create-candidates (this pass never creates pages).
 *
 * Reversible: an UPDATE of variant_id (nothing deleted), and the full old→new map is
 * written to JSON. Conflicts with the 0024 dedup key on the target variant are skipped
 * (that listing-observation already exists there).
 *
 *   npx tsx supabase/ingest/resize-variants.ts                 # DRY RUN (report + map JSON)
 *   npx tsx supabase/ingest/resize-variants.ts --write         # apply the unambiguous moves
 *   npx tsx supabase/ingest/resize-variants.ts --json=/path    # where to write the move map
 */
import { writeFileSync } from "node:fs";
import { supabaseAdmin as db } from "../seed/lib/client";
import { parseSizeBucket } from "../../src/lib/deal-descriptor";

const WRITE = process.argv.includes("--write");
const JSON_OUT =
  (process.argv.find((a) => a.startsWith("--json=")) ?? "").split("=")[1] || "resize-moves.json";

interface PhRow {
  price_id: number;
  variant_id: number;
  notes: string | null;
  source_url: string | null;
  platform: string | null;
  price_type: string | null;
  observed_on: string | null;
  sale_price: number | string | null;
  listing_ref: string | null;
}
interface VariantRow {
  variant_id: number;
  style_id: number | null;
  size_label: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- chained builder
type QB = any;
async function pageAll<T>(table: string, cols: string, apply: (q: QB) => QB): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(db.from(table).select(cols).range(from, from + 999));
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** A distinctive size token in the row text, to break a same-bucket tie (Mini Rectangular
 *  vs Mini Square, Medium vs Medium Large). Returns the variant whose size_label uniquely
 *  contains one of the row's shape words, or null when it stays ambiguous. */
function disambiguate(rowText: string, candidates: VariantRow[]): VariantRow | null {
  const hay = rowText.toLowerCase();
  const shapeWords = ["rectangular", "square", "medium large", "m/l", "east west", "east-west"];
  const present = shapeWords.filter((w) => hay.includes(w));
  const hits = candidates.filter((c) => present.some((w) => (c.size_label ?? "").toLowerCase().includes(w)));
  return hits.length === 1 ? hits[0] : null;
}

async function main() {
  console.log(`resize-variants: ${WRITE ? "WRITE" : "DRY RUN"}\n`);

  const variants = await pageAll<VariantRow>("variant", "variant_id, style_id, size_label", (q) => q);
  // Per style: bucket -> variants of that size (size-parseable variants only, so we never
  // route a listing ONTO a "Standard"/null catch-all variant).
  const byStyle = new Map<number, Map<string, VariantRow[]>>();
  const variantById = new Map<number, VariantRow>();
  for (const v of variants) {
    variantById.set(v.variant_id, v);
    if (v.style_id == null) continue;
    const bucket = parseSizeBucket(v.size_label, null);
    if (!bucket) continue;
    const m = byStyle.get(v.style_id) ?? new Map<string, VariantRow[]>();
    (m.get(bucket) ?? m.set(bucket, []).get(bucket)!).push(v);
    byStyle.set(v.style_id, m);
  }

  const rows = await pageAll<PhRow>(
    "price_history",
    "price_id, variant_id, notes, source_url, platform, price_type, observed_on, sale_price, listing_ref",
    (q) => q.not("sale_price", "is", null),
  );

  const moves: { price_id: number; from: number; to: number }[] = [];
  let ambiguous = 0;
  let missingTarget = 0;
  const missingByStyleSize = new Map<string, number>();

  for (const r of rows) {
    const cur = variantById.get(r.variant_id);
    if (!cur || cur.style_id == null) continue;
    const rowBucket = parseSizeBucket(r.notes, r.source_url);
    if (!rowBucket) continue; // listing states no size — leave it
    const curBucket = parseSizeBucket(cur.size_label, null);
    if (rowBucket === curBucket) continue; // already on a correct-size variant

    const targets = (byStyle.get(cur.style_id)?.get(rowBucket) ?? []).filter((v) => v.variant_id !== r.variant_id);
    if (targets.length === 0) {
      missingTarget++;
      const key = `${cur.style_id}|${rowBucket}`;
      missingByStyleSize.set(key, (missingByStyleSize.get(key) ?? 0) + 1);
      continue;
    }
    let target = targets[0];
    if (targets.length > 1) {
      const picked = disambiguate(`${r.notes ?? ""} ${r.source_url ?? ""}`, targets);
      if (!picked) {
        ambiguous++;
        continue;
      }
      target = picked;
    }
    moves.push({ price_id: r.price_id, from: r.variant_id, to: target.variant_id });
  }

  // ---- REPORT ----
  const movedVariants = new Set(moves.map((m) => m.from));
  console.log(`rows scanned: ${rows.length}`);
  console.log(`re-point moves (unambiguous): ${moves.length} off ${movedVariants.size} variant(s)`);
  console.log(`ambiguous same-bucket (skipped, need review): ${ambiguous}`);
  console.log(`missing target size variant (create-candidates): ${missingTarget}`);
  if (missingByStyleSize.size) {
    const styleName = new Map<number, string>();
    const sids = [...new Set([...missingByStyleSize.keys()].map((k) => Number(k.split("|")[0])))];
    for (let i = 0; i < sids.length; i += 200) {
      const { data } = await db.from("style").select("style_id, name").in("style_id", sids.slice(i, i + 200));
      for (const s of (data ?? []) as { style_id: number; name: string }[]) styleName.set(s.style_id, s.name);
    }
    console.log(`\nTop missing size-variant needs (style · size · rows):`);
    for (const [k, n] of [...missingByStyleSize.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      const [sid, bucket] = k.split("|");
      console.log(`  ${(styleName.get(Number(sid)) ?? sid).padEnd(28)} ${bucket.padEnd(8)} ${n}`);
    }
  }

  writeFileSync(JSON_OUT, JSON.stringify(moves, null, 2));
  console.log(`\nwrote move map (${moves.length}) → ${JSON_OUT}`);

  if (!WRITE) {
    console.log(`\nDRY RUN — re-run with --write to apply ${moves.length} size re-point(s).`);
    return;
  }
  if (moves.length === 0) {
    console.log("\nNothing to move.");
    return;
  }

  // ---- WRITE: UPDATE variant_id, batched by target, per-row fallback on 0024 conflicts ----
  const affected = new Set<number>();
  let done = 0;
  let skipped = 0;
  const byTarget = new Map<number, number[]>();
  for (const m of moves) {
    (byTarget.get(m.to) ?? byTarget.set(m.to, []).get(m.to)!).push(m.price_id);
    affected.add(m.from);
    affected.add(m.to);
  }
  for (const [to, ids] of byTarget) {
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { error } = await db.from("price_history").update({ variant_id: to }).in("price_id", chunk);
      if (!error) {
        done += chunk.length;
        continue;
      }
      if (error.code !== "23505") throw new Error(`batch update to v${to} failed: ${error.message}`);
      // A dedup-key collision somewhere in the chunk — retry per row, skipping the dupes.
      for (const pid of chunk) {
        const { error: e2 } = await db.from("price_history").update({ variant_id: to }).eq("price_id", pid);
        if (!e2) done++;
        else if (e2.code === "23505") skipped++;
        else throw new Error(`update price_id ${pid} failed: ${e2.message}`);
      }
    }
  }
  console.log(`\nre-pointed ${done} row(s); skipped ${skipped} duplicate-on-target.`);

  const { error: rErr } = await db.rpc("refresh_variant_price_summary");
  if (rErr) console.warn(`(warn) refresh_variant_price_summary failed: ${rErr.message}`);
  console.log(`refreshed price summary across ${affected.size} affected variant(s).`);
  console.log("\n✅ done. Old→new map saved for reversal.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("resize-variants failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
