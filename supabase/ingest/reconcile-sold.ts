/**
 * Retire resale listings that have SOLD or been pulled at the source.
 *
 * The Shop aggregates live marketplace listings (price_type='listed'); it can't get a
 * "this sold" webhook from Fashionphile/TheRealReal/Vestiaire. The honest signal is the
 * crawl itself: re-crawl a platform, and any listing it no longer returns is gone. This
 * script diffs the platform's CURRENT live set (a fresh-crawl snapshot) against the
 * listings we currently show, and stamps the vanished ones listing_status='sold' (+
 * delisted_on) so getShopProducts stops showing them.
 *
 *   # after a full crawl + load:
 *   npx tsx supabase/ingest/sources/fashionphile-crawl.ts handbags
 *   npx tsx supabase/ingest/sources/fashionphile.ts --raw
 *   npm run load:prices -- --write
 *   npm run reconcile:sold -- --platform=fashionphile --snapshot=data/ingest/_raw/fashionphile-live.json          # dry run
 *   npm run reconcile:sold -- --platform=fashionphile --snapshot=data/ingest/_raw/fashionphile-live.json --write  # apply
 *
 * WHY a snapshot, not DB dates: the crawler's raw dump ACCUMULATES (it preserves old
 * captures), so a sold listing keeps getting re-loaded with a fresh date — "newest date"
 * can't distinguish live from sold. The crawler therefore also writes a current-run live
 * snapshot (overwrite, not merged); THAT is the authoritative "still for sale" set.
 *
 * The snapshot may be either the raw-dump entry shape ({product:{variants:[{sku}]}, url})
 * or a plain array of listing_ref strings. Each entry is reduced to a listing_ref the
 * same way the loader does — sku (Shopify variant sku) with a fallback to the product url
 * — so it matches price_history.listing_ref exactly.
 *
 * SAFETY — never let a broken/partial crawl mass-retire a live catalogue. A platform is
 * SKIPPED (unless --force) when the snapshot is empty, or when it would retire more than
 * --max-retire-frac of that platform's available listings (default 0.5). Mirrors the
 * project's integrity rule: a partial sweep must not stamp data it didn't actually check.
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../seed/lib/client";

interface Flags {
  write: boolean;
  platform: string | null;
  snapshot: string | null;
  maxRetireFrac: number;
  force: boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { write: false, platform: null, snapshot: null, maxRetireFrac: 0.5, force: false };
  for (const a of argv) {
    if (a === "--write") flags.write = true;
    else if (a === "--force") flags.force = true;
    else if (a.startsWith("--platform=")) flags.platform = a.slice("--platform=".length).trim() || null;
    else if (a.startsWith("--snapshot=")) flags.snapshot = a.slice("--snapshot=".length).trim() || null;
    else if (a.startsWith("--max-retire-frac=")) {
      const n = Number(a.slice("--max-retire-frac=".length));
      if (Number.isFinite(n) && n > 0 && n <= 1) flags.maxRetireFrac = n;
    }
  }
  return flags;
}

type SnapshotEntry =
  | string
  | { url?: string | null; product?: { variants?: Array<{ sku?: string | number | null }> | null } | null };

/** Reduce a snapshot entry to the listing_ref the loader would have stored (sku ?? url). */
function entryToRef(e: SnapshotEntry): string | null {
  if (typeof e === "string") return e.trim() || null;
  const sku = e.product?.variants?.[0]?.sku;
  const skuStr = sku != null ? String(sku).trim() : "";
  if (skuStr) return skuStr;
  return e.url?.trim() || null;
}

/** The set of listing_refs currently live, per the fresh-crawl snapshot file. */
function readLiveRefs(snapshotPath: string): Set<string> {
  const abs = path.resolve(process.cwd(), snapshotPath);
  if (!fs.existsSync(abs)) throw new Error(`Snapshot not found: ${abs}`);
  const parsed = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`Snapshot must be a JSON array: ${abs}`);
  const refs = new Set<string>();
  for (const e of parsed as SnapshotEntry[]) {
    const ref = entryToRef(e);
    if (ref) refs.add(ref);
  }
  return refs;
}

type AvailRow = { platform: string | null; listing_ref: string | null };

/** Page through every currently-available listed row for the target platform. */
async function fetchAvailableRows(platform: string): Promise<AvailRow[]> {
  const all: AvailRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("price_history")
      .select("platform, listing_ref")
      .eq("price_type", "listed")
      .eq("listing_status", "available")
      .ilike("platform", `%${platform}%`)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as AvailRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

/** Stamp a platform's vanished listings sold, in chunked IN() updates. */
async function retire(platform: string, refs: string[], delistedOn: string): Promise<number> {
  let updated = 0;
  const CHUNK = 200;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = refs.slice(i, i + CHUNK);
    const { data, error } = await supabaseAdmin
      .from("price_history")
      .update({ listing_status: "sold", delisted_on: delistedOn })
      .eq("platform", platform)
      .eq("listing_status", "available")
      .in("listing_ref", batch)
      .select("price_id");
    if (error) throw error;
    updated += (data ?? []).length;
  }
  return updated;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (!flags.platform || !flags.snapshot) {
    console.error("Usage: reconcile:sold -- --platform=<name> --snapshot=<path-to-live.json> [--write] [--force] [--max-retire-frac=0.5]");
    process.exit(2);
  }

  const liveRefs = readLiveRefs(flags.snapshot);
  const rows = await fetchAvailableRows(flags.platform);
  const today = new Date().toISOString().slice(0, 10);

  // Gone = currently available, keyed, but absent from the fresh live set.
  const goneRows = rows.filter((r) => r.listing_ref && !liveRefs.has(r.listing_ref));
  const goneRefs = [...new Set(goneRows.map((r) => r.listing_ref as string))];

  console.log(`\nReconcile resale listings — ${flags.write ? "WRITE" : "DRY RUN"}`);
  console.log(`  platform match: "${flags.platform}"`);
  console.log(`  live in snapshot: ${liveRefs.size}`);
  console.log(`  available in DB:  ${rows.length}`);
  console.log(`  would retire:     ${goneRefs.length}`);

  if (liveRefs.size === 0) {
    console.error("\nABORT: snapshot is empty — refusing to retire anything (looks like a failed crawl).");
    process.exit(1);
  }
  if (goneRefs.length === 0) {
    console.log("\nNothing to retire (every available listing is still in the live snapshot).");
    return;
  }
  if (!flags.force && rows.length > 0 && goneRefs.length / rows.length > flags.maxRetireFrac) {
    console.error(
      `\nABORT: would retire ${goneRefs.length}/${rows.length} (> ${Math.round(
        flags.maxRetireFrac * 100,
      )}%) — looks like a partial/broken crawl. Re-run with --force if this is intended.`,
    );
    process.exit(1);
  }

  if (!flags.write) {
    console.log(`\nDRY RUN: ${goneRefs.length} listing(s) would be marked sold. Re-run with --write to apply.`);
    return;
  }

  // Update against each ACTUAL platform string present (the ilike may span variants).
  const platforms = [...new Set(goneRows.map((r) => r.platform).filter((p): p is string => !!p))];
  let total = 0;
  for (const p of platforms) {
    const refsForP = [...new Set(goneRows.filter((r) => r.platform === p).map((r) => r.listing_ref as string))];
    const n = await retire(p, refsForP, today);
    console.log(`  ${p}: marked ${n} row(s) sold (delisted_on=${today}).`);
    total += n;
  }
  console.log(`\nDone. Retired ${total} listing row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
