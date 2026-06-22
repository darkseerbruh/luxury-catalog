/**
 * Bulk-populate `variant.image_url` (+ `variant.image_source` provenance) from a
 * CSV / reseller feed. This is the operator tool behind migration 0013's
 * launch-visuals pipeline (BagImage renders image_url, else a branded placeholder).
 *
 * ── LICENSING IS NON-NEGOTIABLE ────────────────────────────────────────────────
 * Per the product brief and docs/image-strategy-research.md, displayed photos must
 * be SOURCED: a licensed affiliate/reseller feed (display rights + link-back),
 * first-party, CC, or UGC. We never AI-generate or hot-link unlicensed images.
 * Reseller-listing photos are licensed only while tethered to a LIVE listing+link,
 * so this tool records the listing URL as image_source for auditable link-back, and
 * REFUSES to write unless you assert the feed is licensed (`--licensed`). Default is
 * a no-write dry run.
 *
 * ── TWO INPUT MODES (auto-detected from the header) ────────────────────────────
 *   1. Direct  — a curated CSV with a `variant_id` column:
 *        variant_id,image_url[,image_source]
 *      Unambiguous; the operator has already mapped photos to variants.
 *   2. Feed    — a reseller export (Designer, Bag name, Hardware, Colors, Size,
 *      Photos, Url …) like data/raw/therealreal_data-1.csv. Rows are resolved to a
 *      variant by brand → style → best attribute match, the first Photos URL is
 *      taken as the image, and the listing Url is recorded as image_source.
 *
 * ── USAGE ──────────────────────────────────────────────────────────────────────
 *   npx tsx supabase/seed/import-variant-images.ts <file.csv> [flags]
 *   # defaults to the two reseller exports in data/raw/ when no file is given
 *
 *   flags:
 *     --licensed     assert you have display rights for this feed; required to write
 *     --write        persist changes (without it, runs as a dry run / preview)
 *     --overwrite    replace existing image_url values (default: only fill blanks)
 *     --limit=N      stop after N successful matches (handy for a smoke test)
 *
 * Idempotent: re-running skips variants that already have an image unless
 * --overwrite. Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (same as the other seed scripts) — it reads the catalog to resolve variants and
 * writes via the service role.
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { supabaseAdmin } from "./lib/client";
import {
  normalizeDesigner,
  firstImageUrl,
  isHttpUrl,
  scoreStyleMatch,
  pickVariant,
  type VariantAttrs,
} from "../../src/lib/image-import-core";

const DATA_DIR = path.resolve(__dirname, "../../data/raw");
const DEFAULT_FEEDS = ["therealreal_data-1.csv", "theluxurycloset_data_partial.csv"];

interface Flags {
  files: string[];
  licensed: boolean;
  write: boolean;
  overwrite: boolean;
  limit: number | null;
}

function parseFlags(argv: string[]): Flags {
  const files: string[] = [];
  let licensed = false;
  let write = false;
  let overwrite = false;
  let limit: number | null = null;
  for (const arg of argv) {
    if (arg === "--licensed") licensed = true;
    else if (arg === "--write") write = true;
    else if (arg === "--overwrite") overwrite = true;
    else if (arg.startsWith("--limit=")) {
      const n = parseInt(arg.slice("--limit=".length), 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    } else if (arg.startsWith("--")) {
      console.warn(`Unknown flag ignored: ${arg}`);
    } else {
      files.push(arg);
    }
  }
  return { files, licensed, write, overwrite, limit };
}

// ── helpers ────────────────────────────────────────────────────────────────────

// Pure parsing/matching helpers live in src/lib/image-import-core.ts (unit-tested).

// Surface DB errors without spamming a per-row message for a systemic problem
// (e.g. a bad service-role key returns the same error on every lookup).
const warned = new Set<string>();
function warnOnce(msg: string): void {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`  ! ${msg}`);
}

interface VariantRow extends VariantAttrs {
  image_url: string | null;
}

// ── catalog lookups (cached so a big feed doesn't hammer the DB) ─────────────────

const brandCache = new Map<string, number | null>();
async function resolveBrandId(name: string): Promise<number | null> {
  const key = name.toLowerCase();
  if (brandCache.has(key)) return brandCache.get(key)!;
  const { data, error } = await supabaseAdmin.from("brand").select("brand_id").ilike("name", name).limit(1);
  if (error) warnOnce(`brand lookup failed: ${error.message}`);
  const id = data && data.length ? (data[0].brand_id as number) : null;
  brandCache.set(key, id);
  return id;
}

const styleCache = new Map<string, number | null>();
async function resolveStyleId(brandId: number, bagName: string): Promise<number | null> {
  const key = `${brandId}::${bagName.toLowerCase()}`;
  if (styleCache.has(key)) return styleCache.get(key)!;
  // Exact-ish first, then a contains match (reseller names are noisy, e.g.
  // "Classic Double Flap" vs the catalogued "Classic Flap").
  const { data, error } = await supabaseAdmin
    .from("style")
    .select("style_id, name")
    .eq("brand_id", brandId);
  if (error) warnOnce(`style lookup failed: ${error.message}`);
  let id: number | null = null;
  if (data && data.length) {
    let best: { id: number; score: number } | null = null;
    for (const s of data as { style_id: number; name: string }[]) {
      const score = scoreStyleMatch(s.name, bagName);
      if (score > 0 && (!best || score > best.score)) best = { id: s.style_id, score };
    }
    if (best) id = best.id;
  }
  styleCache.set(key, id);
  return id;
}

const variantCache = new Map<number, VariantRow[]>();
async function variantsForStyle(styleId: number): Promise<VariantRow[]> {
  if (variantCache.has(styleId)) return variantCache.get(styleId)!;
  const { data, error } = await supabaseAdmin
    .from("variant")
    .select("variant_id, size_label, exterior_colorway, hardware_color, hardware_type, image_url")
    .eq("style_id", styleId)
    .order("variant_id");
  if (error) warnOnce(`variant lookup failed: ${error.message}`);
  const rows = (data ?? []) as VariantRow[];
  variantCache.set(styleId, rows);
  return rows;
}

interface FeedRow {
  Designer?: string;
  "Bag name"?: string;
  Hardware?: string;
  Colors?: string;
  "Size (brand's name of size)"?: string;
  Photos?: string;
  Url?: string;
}

// ── resolution: a CSV row → { variantId, imageUrl, imageSource } ─────────────────

interface Resolved {
  variantId: number;
  imageUrl: string;
  imageSource: string;
}

async function resolveDirectRow(row: Record<string, string>): Promise<Resolved | string> {
  const variantId = parseInt(row.variant_id, 10);
  if (!Number.isFinite(variantId)) return `bad variant_id "${row.variant_id}"`;
  const imageUrl = (row.image_url ?? "").trim();
  if (!isHttpUrl(imageUrl)) return `variant ${variantId}: missing/invalid image_url`;
  const imageSource = (row.image_source ?? "").trim() || "operator-provided (direct CSV)";
  return { variantId, imageUrl, imageSource };
}

async function resolveFeedRow(row: FeedRow, feedName: string): Promise<Resolved | string> {
  const designer = row.Designer ? normalizeDesigner(row.Designer) : "";
  const bagName = row["Bag name"]?.trim();
  if (!designer || !bagName) return "row missing Designer/Bag name";

  const imageUrl = firstImageUrl(row.Photos);
  if (!isHttpUrl(imageUrl)) return `${designer} ${bagName}: no usable photo URL`;

  const brandId = await resolveBrandId(designer);
  if (!brandId) return `${designer}: brand not in catalog`;
  const styleId = await resolveStyleId(brandId, bagName);
  if (!styleId) return `${designer} ${bagName}: style not in catalog`;
  const variants = await variantsForStyle(styleId);
  const variant = pickVariant(variants, {
    size: row["Size (brand's name of size)"],
    colors: row.Colors,
    hardware: row.Hardware,
  });
  if (!variant) return `${designer} ${bagName}: no variants for style`;

  // Provenance/link-back: the live listing URL keeps the reseller-feed license
  // auditable. Fall back to the feed name if a row has no listing URL.
  const listing = isHttpUrl(row.Url) ? row.Url!.trim() : feedName;
  const imageSource = `Reseller feed (${feedName}); listing: ${listing}`;
  return { variantId: variant.variant_id, imageUrl, imageSource };
}

// ── per-file processing ──────────────────────────────────────────────────────────

interface Stats {
  rows: number;
  matched: number;
  written: number;
  skippedExisting: number;
  unmatched: number;
}

async function alreadyHasImage(variantId: number): Promise<boolean> {
  // Use the cached style variants where possible; otherwise a point read.
  for (const rows of variantCache.values()) {
    const hit = rows.find((r) => r.variant_id === variantId);
    if (hit) return isHttpUrl(hit.image_url);
  }
  const { data } = await supabaseAdmin
    .from("variant")
    .select("image_url")
    .eq("variant_id", variantId)
    .limit(1);
  return !!(data && data.length && isHttpUrl((data[0] as { image_url: string | null }).image_url));
}

async function processFile(fullPath: string, flags: Flags, stats: Stats): Promise<void> {
  const feedName = path.basename(fullPath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  const rows: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });
  if (rows.length === 0) {
    console.warn(`  ${feedName}: empty, skipping`);
    return;
  }
  const mode = "variant_id" in rows[0] ? "direct" : "feed";
  console.log(`  ${feedName}: ${rows.length} rows (${mode} mode)`);

  // Dedup writes per run: a feed often has many listings of the same variant —
  // first usable photo wins.
  const seen = new Set<number>();

  for (const row of rows) {
    if (flags.limit !== null && stats.written >= flags.limit) break;
    stats.rows++;
    const resolved =
      mode === "direct" ? await resolveDirectRow(row) : await resolveFeedRow(row as FeedRow, feedName);
    if (typeof resolved === "string") {
      stats.unmatched++;
      continue;
    }
    stats.matched++;
    if (seen.has(resolved.variantId)) continue;
    seen.add(resolved.variantId);

    if (!flags.overwrite && (await alreadyHasImage(resolved.variantId))) {
      stats.skippedExisting++;
      continue;
    }

    if (!flags.write) {
      console.log(
        `    [dry-run] variant ${resolved.variantId} ← ${resolved.imageUrl}  (${resolved.imageSource})`
      );
      stats.written++; // count as "would write" for the dry-run summary
      continue;
    }

    const { error } = await supabaseAdmin
      .from("variant")
      .update({ image_url: resolved.imageUrl, image_source: resolved.imageSource })
      .eq("variant_id", resolved.variantId);
    if (error) {
      console.error(`    variant ${resolved.variantId}: write failed — ${error.message}`);
      stats.unmatched++;
    } else {
      stats.written++;
    }
  }
}

// ── main ─────────────────────────────────────────────────────────────────────────

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const fileArgs = flags.files.length ? flags.files : DEFAULT_FEEDS;
  const paths = fileArgs.map((f) => (path.isAbsolute(f) ? f : path.resolve(DATA_DIR, f)));

  console.log("Variant image import");
  console.log("====================");

  // Enforce the licensing constraint at the tooling boundary.
  if (flags.write && !flags.licensed) {
    console.error(
      "\nRefusing to write without --licensed.\n" +
        "Displayed photos must be SOURCED (licensed feed with display+link-back, first-party,\n" +
        "CC, or UGC) — see docs/image-strategy-research.md and the product brief. Pass --licensed\n" +
        "to assert you have display rights for this feed, or omit --write to preview (dry run)."
    );
    process.exit(1);
  }
  if (!flags.write) {
    console.log("DRY RUN — no changes written. Add --write --licensed to persist.\n");
  } else {
    console.log("WRITE mode — operator asserts these images are licensed for display.\n");
  }

  // Preflight: a bad key or unreachable DB otherwise looks like "0 matched"
  // (every catalog read fails silently), which misleads the operator. Also
  // confirms migration 0013 added image_url before we try to write it.
  const pre = await supabaseAdmin.from("variant").select("variant_id, image_url").limit(1);
  if (pre.error) {
    const msg = pre.error.message;
    if (/image_url/.test(msg) && /column/i.test(msg)) {
      console.error(
        `\nThe variant.image_url column is missing — apply migration 0013_variant_image.sql first.`
      );
    } else {
      console.error(
        `\nCannot read the catalog (${msg}). Check NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.`
      );
    }
    process.exit(1);
  }

  const stats: Stats = { rows: 0, matched: 0, written: 0, skippedExisting: 0, unmatched: 0 };
  for (const p of paths) {
    if (!fs.existsSync(p)) {
      console.warn(`  ${p}: not found, skipping`);
      continue;
    }
    await processFile(p, flags, stats);
  }

  console.log("\nSummary");
  console.log("-------");
  console.log(`  rows read:        ${stats.rows}`);
  console.log(`  variants matched: ${stats.matched}`);
  console.log(`  ${flags.write ? "written" : "would write"}:      ${stats.written}`);
  console.log(`  skipped (had image): ${stats.skippedExisting}`);
  console.log(`  unmatched/invalid:   ${stats.unmatched}`);
  if (!flags.write) console.log("\nRe-run with --write --licensed once the feed's display rights are confirmed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
