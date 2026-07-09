/**
 * Merge redundant `style` rows that share a canonical model.
 *
 * The catalog carries ~220 redundant style rows across ~94 canonical clusters: several
 * `style` rows for the same (brand, canonical model). Two DISTINCT sub-types exist and
 * this script collapses ONLY the first:
 *
 *   TYPE 1 — VERBOSE ONE-OFF JUNK (MERGE). Full-sentence style names left by the older
 *   `load-handbag-breadth` pass, usually 1 variant each, e.g. Hermès "Hermes Black Togo
 *   Leather Gold Hardware Birkin 35 Bag" alongside the clean "Birkin"; LV "Louis Vuitton
 *   Monogram Canvas Looping GM Bag" alongside "Looping". These fold into the clean
 *   canonical sibling: re-point their variants + price_history to the canonical style's
 *   matching size-variant (find-or-create), dedup price_history on re-point, then delete
 *   the emptied junk style.
 *
 *   TYPE 2 — INTENTIONAL hand-managed silhouette buckets (DO NOT MERGE). Gucci Ophidia
 *   Shoulder/Crossbody/Tote/Vanity Case, Chanel "CC Filigree Vanity Case" / "Top Handle
 *   Vanity Case", Celine "Triomphe Oval/Boston/Shoulder", Valentino "Rockstud Spike/Tote",
 *   Coach "Pillow Tabby". Deliberate sub-model distinctions from the sweep-targets.
 *   Merging them repeats the 2026-06-30 collision lesson (AGENTS.md /
 *   docs/data-content-worklist.md), so they are protected two ways below.
 *
 * A junk style is merged ONLY when BOTH hold:
 *   (a) its cluster contains EXACTLY ONE clean canonical sibling (norm(name) === norm(canon)),
 *       giving an unambiguous merge target; AND
 *   (b) its own name looks like a verbose title — >= 4 words AND carrying a material,
 *       colour, 4-digit year, embedded brand name, or trailing "Bag" token.
 * Plus an explicit protected-name denylist for the known intentional buckets. Anything
 * that fails (a) or (b), or trips the denylist, is REPORTED and LEFT for manual review.
 *
 * Idempotent (re-running finds nothing left to merge). Dry-run by default — REVIEW the
 * printed plan, then re-run with --write.
 *
 *   npx tsx supabase/ingest/merge-style-dupes.ts            # dry run (review the plan)
 *   npx tsx supabase/ingest/merge-style-dupes.ts --write    # execute
 *   npx tsx supabase/ingest/merge-style-dupes.ts --verbose  # also list protected/ambiguous clusters
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm, normalizeDesigner } from "../../src/lib/image-import-core";
import { canonicalModel, canonicalBrand } from "../../src/lib/ingest/model-normalize";

const WRITE = process.argv.includes("--write");
const VERBOSE = process.argv.includes("--verbose");

type BrandRow = { brand_id: number; name: string };
type StyleRow = { style_id: number; brand_id: number; name: string };
type VariantRow = { variant_id: number; style_id: number; size_label: string | null };
type PhKeyRow = { price_id: number; platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null };

/** Same size-match key promote-safe/reconcile use: normalized, parens stripped. */
function sizeKey(s: string | null): string {
  return norm(s || "").replace(/[()]/g, "").trim();
}

/** Page past the PostgREST 1000-row cap. */
async function fetchAll<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).range(from, from + 999);
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

// ── verbose-junk detection ──────────────────────────────────────────────────
const MATERIAL_TOKENS = [
  "togo", "epsom", "clemence", "clémence", "swift", "chevre", "chèvre", "box calf",
  "barenia", "ostrich", "crocodile", "alligator", "lizard", "fjord", "evercolor",
  "monogram", "damier", "empreinte", "vernis", "epi", "taiga", "nomade", "canvas",
  "caviar", "lambskin", "calfskin", "goatskin", "leather", "suede", "nylon", "denim",
  "jacquard", "tweed", "raffia", "patent", "shearling", "python", "grained", "saffiano",
  "gg supreme", "supreme", "microguccissima", "guccissima", "coated",
];
const COLOR_TOKENS = [
  "black", "white", "cream", "ivory", "beige", "tan", "taupe", "grey", "gray", "brown",
  "chocolate", "camel", "red", "burgundy", "bordeaux", "pink", "rose", "fuchsia", "orange",
  "yellow", "gold", "green", "olive", "khaki", "blue", "navy", "teal", "purple", "lilac",
  "silver", "nude", "etoupe", "étoupe", "gris", "noir", "rouge", "bleu", "vert", "multicolor",
];
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordHit = (hay: string, tokens: string[]) =>
  tokens.some((t) => (t.includes(" ") ? hay.includes(t) : new RegExp(`\\b${esc(t)}\\b`).test(hay)));

/**
 * True when a style name reads like a verbose reseller title, NOT a clean model name.
 * Requires multi-word AND at least one "junk signal": material, colour, 4-digit year,
 * embedded brand name, or trailing "bag".
 */
function isVerboseJunk(brandName: string, name: string): boolean {
  const hay = name.toLowerCase();
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;
  const nName = norm(name);
  const nBrand = norm(normalizeDesigner(brandName));
  const hasBrandPrefix = nBrand.length > 0 && (nName.startsWith(nBrand) || nName.includes(` ${nBrand} `));
  const endsWithBag = /\bbag\s*$/i.test(name.trim());
  const hasYear = /\b(19|20)\d{2}\b/.test(name);
  return (
    wordHit(hay, MATERIAL_TOKENS) ||
    wordHit(hay, COLOR_TOKENS) ||
    hasYear ||
    hasBrandPrefix ||
    endsWithBag
  );
}

/**
 * Explicit protected buckets (belt-and-suspenders on top of the heuristic). Keyed by
 * `${canonicalBrand}|${norm(styleName)}`. These are the intentional sub-model silhouette
 * distinctions named in the task — never merge them even if a heuristic mis-fires.
 */
const PROTECTED = new Set<string>([
  // Gucci Ophidia silhouettes
  "Gucci|ophidia shoulder", "Gucci|ophidia crossbody", "Gucci|ophidia tote",
  "Gucci|ophidia vanity case", "Gucci|ophidia mini",
  // Chanel vanity buckets
  "Chanel|cc filigree vanity case", "Chanel|top handle vanity case",
  // Celine Triomphe silhouettes
  "Celine|triomphe oval", "Celine|triomphe boston", "Celine|triomphe shoulder",
  // Valentino Rockstud silhouettes
  "Valentino|rockstud spike", "Valentino|rockstud tote",
  // Coach Pillow Tabby
  "Coach|pillow tabby",
]);
/** Silhouette qualifier words that mark an intentional sub-model bucket, not junk. */
const SILHOUETTE_QUALIFIERS = [
  "shoulder", "crossbody", "cross body", "tote", "vanity", "oval", "boston", "spike",
  "pillow", "filigree", "top handle", "hobo", "bucket", "belt", "backpack", "clutch",
  "camera", "flap", "chain", "wallet on chain", "woc",
];
function isProtected(canonBrand: string, name: string): boolean {
  const key = `${canonBrand}|${norm(name)}`;
  if (PROTECTED.has(key)) return true;
  // A short name (<= 3 words) that is a model + silhouette qualifier is a hand-managed
  // bucket, not verbose junk (e.g. "Ophidia Shoulder", "Triomphe Oval", "Pillow Tabby").
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3 && wordHit(name.toLowerCase(), SILHOUETTE_QUALIFIERS)) return true;
  return false;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nmerge-style-dupes ${WRITE ? "(WRITE)" : "(DRY RUN — review, then --write)"}\n`);

  const brands = await fetchAll<BrandRow>("brand", "brand_id,name");
  const styles = await fetchAll<StyleRow>("style", "style_id,brand_id,name");
  const variants = await fetchAll<VariantRow>("variant", "variant_id,style_id,size_label");
  const brandById = new Map<number, string>(brands.map((b) => [b.brand_id, b.name]));
  const variantsByStyle = new Map<number, VariantRow[]>();
  for (const v of variants) {
    if (!variantsByStyle.has(v.style_id)) variantsByStyle.set(v.style_id, []);
    variantsByStyle.get(v.style_id)!.push(v);
  }
  console.log(`Loaded ${brands.length} brands, ${styles.length} styles, ${variants.length} variants.`);

  // Cluster styles by (brand_id, canonicalModel). Skip styles with no canonical match.
  type Cluster = { brandId: number; brandName: string; canon: string; members: StyleRow[] };
  const clusters = new Map<string, Cluster>();
  for (const s of styles) {
    const brandName = brandById.get(s.brand_id) ?? "";
    const canon = canonicalModel(brandName, s.name);
    if (!canon) continue;
    const key = `${s.brand_id}|${canon}`;
    if (!clusters.has(key)) clusters.set(key, { brandId: s.brand_id, brandName, canon, members: [] });
    clusters.get(key)!.members.push(s);
  }
  const multi = [...clusters.values()].filter((c) => c.members.length > 1);
  console.log(`Canonical clusters with >1 style row: ${multi.length}\n`);

  // Build the merge plan. Each entry: one junk style -> one clean canonical target style.
  type Plan = { junk: StyleRow; target: StyleRow; brandName: string; canon: string };
  const plan: Plan[] = [];
  const skipped: { canon: string; brand: string; reason: string; members: string[] }[] = [];

  for (const c of multi) {
    const canonBrand = canonicalBrand(c.brandName);
    const clean = c.members.filter((m) => norm(m.name) === norm(c.canon));
    const others = c.members.filter((m) => norm(m.name) !== norm(c.canon));

    if (clean.length !== 1) {
      skipped.push({
        canon: c.canon, brand: c.brandName,
        reason: clean.length === 0 ? "no clean canonical sibling" : `${clean.length} clean canonical siblings (ambiguous target)`,
        members: c.members.map((m) => `#${m.style_id} "${m.name}"`),
      });
      continue;
    }
    const target = clean[0];
    const mergeable: StyleRow[] = [];
    const held: string[] = [];
    for (const m of others) {
      if (isProtected(canonBrand, m.name)) { held.push(`#${m.style_id} "${m.name}" [protected bucket]`); continue; }
      if (!isVerboseJunk(c.brandName, m.name)) { held.push(`#${m.style_id} "${m.name}" [not verbose junk]`); continue; }
      mergeable.push(m);
    }
    for (const m of mergeable) plan.push({ junk: m, target, brandName: c.brandName, canon: c.canon });
    if (held.length) skipped.push({ canon: c.canon, brand: c.brandName, reason: "held members (kept distinct)", members: held });
  }

  // Per-style price_history counts (only for styles in the plan — keeps the read small).
  const planStyleIds = new Set<number>();
  for (const p of plan) { planStyleIds.add(p.junk.style_id); planStyleIds.add(p.target.style_id); }
  async function phCountForStyle(styleId: number): Promise<number> {
    const vids = (variantsByStyle.get(styleId) ?? []).map((v) => v.variant_id);
    if (!vids.length) return 0;
    const { count, error } = await db.from("price_history").select("price_id", { count: "exact", head: true }).in("variant_id", vids);
    if (error) throw new Error(`ph count failed for style ${styleId}: ${error.message}`);
    return count ?? 0;
  }
  const phCount = new Map<number, number>();
  for (const sid of planStyleIds) phCount.set(sid, await phCountForStyle(sid));

  // ── Print the plan ──
  console.log(`── MERGE PLAN: ${plan.length} junk style(s) → clean canonical siblings ──\n`);
  const byTarget = new Map<number, Plan[]>();
  for (const p of plan) {
    if (!byTarget.has(p.target.style_id)) byTarget.set(p.target.style_id, []);
    byTarget.get(p.target.style_id)!.push(p);
  }
  for (const [targetId, ps] of [...byTarget.entries()].sort((a, b) => a[1][0].brandName.localeCompare(b[1][0].brandName))) {
    const t = ps[0].target;
    console.log(`  ${ps[0].brandName} / "${t.name}"  →  target style #${targetId} (${variantsByStyle.get(targetId)?.length ?? 0} variants, ${phCount.get(targetId) ?? 0} ph)`);
    for (const p of ps) {
      const jv = variantsByStyle.get(p.junk.style_id) ?? [];
      console.log(`      merge #${p.junk.style_id} "${p.junk.name}"  (${jv.length} variants: [${jv.map((v) => v.size_label ?? "∅").join(", ")}], ${phCount.get(p.junk.style_id) ?? 0} ph)`);
    }
  }
  const totalJunkPh = plan.reduce((n, p) => n + (phCount.get(p.junk.style_id) ?? 0), 0);
  console.log(`\n  ${plan.length} styles to delete · ${totalJunkPh} price_history rows to re-point/dedup\n`);

  if (VERBOSE || !WRITE) {
    console.log(`── HELD / SKIPPED clusters: ${skipped.length} (NOT merged) ──`);
    for (const s of skipped) {
      console.log(`  ${s.brand} / ${s.canon} — ${s.reason}`);
      for (const m of s.members) console.log(`      ${m}`);
    }
    console.log();
  }

  if (!WRITE) {
    console.log("DRY RUN complete. Re-run with --write to execute.\n");
    return;
  }

  // ── Execute ──
  let movedRows = 0, droppedRows = 0, deletedVariants = 0, deletedStyles = 0;
  for (const p of plan) {
    const targetVars = variantsByStyle.get(p.target.style_id) ?? [];
    for (const jv of variantsByStyle.get(p.junk.style_id) ?? []) {
      // find-or-create the matching size-variant on the target style
      let tv = targetVars.find((v) => sizeKey(v.size_label) === sizeKey(jv.size_label));
      if (!tv) {
        const { data: ins, error } = await db.from("variant")
          .insert({ style_id: p.target.style_id, size_label: jv.size_label, market_availability: "resale" })
          .select("variant_id,style_id,size_label").single();
        if (error || !ins) { console.error(`  variant create failed (style ${p.target.style_id}, size ${jv.size_label}):`, error?.message); continue; }
        tv = ins as VariantRow; targetVars.push(tv);
      }
      if (tv.variant_id === jv.variant_id) continue; // safety: never re-point onto self

      // reconcile price_history: re-point new keys, drop dup keys already on the target
      const { data: jpRows } = await db.from("price_history")
        .select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", jv.variant_id);
      const { data: tpRows } = await db.from("price_history")
        .select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", tv.variant_id);
      const key = (r: PhKeyRow) => `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;
      const targetKeys = new Set(((tpRows as PhKeyRow[] | null) ?? []).map(key));
      const toMove: number[] = [], toDrop: number[] = [];
      for (const r of (jpRows as PhKeyRow[] | null) ?? []) (targetKeys.has(key(r)) ? toDrop : toMove).push(r.price_id);

      for (let i = 0; i < toMove.length; i += 500) {
        const { error } = await db.from("price_history").update({ variant_id: tv.variant_id }).in("price_id", toMove.slice(i, i + 500));
        if (error) { console.error(`  ph move err v${jv.variant_id}->v${tv.variant_id}:`, error.message); }
      }
      for (let i = 0; i < toDrop.length; i += 500) {
        const { error } = await db.from("price_history").delete().in("price_id", toDrop.slice(i, i + 500));
        if (error) { console.error(`  ph drop err v${jv.variant_id}:`, error.message); }
      }
      // re-point any discovered_listing pointers, then delete the emptied junk variant
      const { error: dErr } = await db.from("discovered_listing").update({ promoted_variant_id: tv.variant_id }).eq("promoted_variant_id", jv.variant_id);
      if (dErr) console.error(`  discovered repoint err v${jv.variant_id}:`, dErr.message);
      const { error: vErr } = await db.from("variant").delete().eq("variant_id", jv.variant_id);
      if (vErr) { console.error(`  variant delete err v${jv.variant_id}:`, vErr.message); }
      else deletedVariants++;
      movedRows += toMove.length; droppedRows += toDrop.length;
    }
    // delete the now-empty junk style (variants cascade, but they're already gone)
    const { data: leftover } = await db.from("variant").select("variant_id").eq("style_id", p.junk.style_id).limit(1);
    if (leftover && leftover.length) { console.error(`  SKIP style delete #${p.junk.style_id}: still has variants`); continue; }
    const { error: sErr } = await db.from("style").delete().eq("style_id", p.junk.style_id);
    if (sErr) { console.error(`  style delete err #${p.junk.style_id}:`, sErr.message); }
    else { deletedStyles++; console.log(`  ✓ merged #${p.junk.style_id} "${p.junk.name}" → #${p.target.style_id} "${p.target.name}"`); }
  }
  console.log(`\nDone. styles deleted ${deletedStyles}, variants deleted ${deletedVariants}, ph rows moved ${movedRows}, ph dup rows dropped ${droppedRows}.\n`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
