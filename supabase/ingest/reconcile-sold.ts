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
  ageDays: number | null;
  maxRetireFrac: number;
  force: boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { write: false, platform: null, snapshot: null, ageDays: null, maxRetireFrac: 0.5, force: false };
  for (const a of argv) {
    if (a === "--write") flags.write = true;
    else if (a === "--force") flags.force = true;
    else if (a.startsWith("--platform=")) flags.platform = a.slice("--platform=".length).trim() || null;
    else if (a.startsWith("--snapshot=")) flags.snapshot = a.slice("--snapshot=".length).trim() || null;
    else if (a.startsWith("--age-days=")) {
      const n = Number(a.slice("--age-days=".length));
      if (Number.isFinite(n) && n > 0) flags.ageDays = Math.floor(n);
    }
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

// A listed row counts as "currently shown" unless we've already retired it: status
// 'available' OR null (legacy rows loaded before 0030 — the existing backlog we want
// to reconcile too). Only 'sold' is excluded.
const NOT_RETIRED = "listing_status.is.null,listing_status.eq.available";

// The EXACT platform strings stored in price_history, i.e. every loader's PLATFORM
// constant (supabase/ingest/sources/*.ts) plus eBay. Callers pass loose names
// ("fashionphile", "RealReal"); we resolve them to these so the paged reads can filter
// the indexed `platform` column by equality. Keep in sync when a new source loader lands
// (the DB fallback in resolvePlatforms covers anything missing here, just more slowly).
const KNOWN_PLATFORMS = [
  "Fashionphile",
  "The RealReal",
  "Vestiaire Collective",
  "eBay",
  "The Luxury Closet",
  "myGemma",
  "Redeluxe",
  "Couture USA",
  "Ann's Fabulous Finds",
] as const;

/**
 * Resolve a loose platform name (callers pass e.g. "fashionphile" -> "Fashionphile",
 * "RealReal" -> "The RealReal") to the EXACT platform string(s) stored in price_history.
 *
 * WHY: the heavy paged reads below must filter on the indexed `platform` column by
 * equality (price_history_status_platform_idx = platform, listing_status, listing_ref).
 * A leading-wildcard `ilike('%name%')` can't use that index, so it seq-scanned the whole
 * ~138k-row table and tipped over Supabase's statement timeout under the load right after
 * the price upserts: the 57014 failure on the myGemma refresh (2026-07-13).
 *
 * Fast path: match the loose name against KNOWN_PLATFORMS in memory (zero DB work, same
 * case-insensitive substring semantics). Fallback: the capped ilike lookup, only for a
 * platform not yet in KNOWN_PLATFORMS.
 */
async function resolvePlatforms(loose: string): Promise<string[]> {
  const needle = loose.toLowerCase();
  const known = KNOWN_PLATFORMS.filter((p) => p.toLowerCase().includes(needle));
  if (known.length > 0) return [...known];

  const { data, error } = await supabaseAdmin
    .from("price_history")
    .select("platform")
    .eq("price_type", "listed")
    .ilike("platform", `%${loose}%`)
    .limit(1000);
  if (error) throw error;
  return [
    ...new Set(
      (data ?? [])
        .map((r) => (r as { platform: string | null }).platform)
        .filter((p): p is string => !!p),
    ),
  ];
}

type DatedRow = { platform: string | null; listing_ref: string | null; observed_on: string | null };

/**
 * Page every still-shown listed row for the resolved platform(s), KEYSET-style.
 *
 * WHY NOT .range(): PostgREST turns .range(from, from+999) into OFFSET/LIMIT. Postgres
 * still has to walk and discard every row before the offset, so page N costs N times
 * page 1 — and with no ORDER BY the window isn't even stable between pages. Fashionphile
 * is our biggest platform (~20k+ listed rows = 20+ pages), so its deep offsets were the
 * first to blow past Supabase's ~8s statement_timeout: the 57014 failures on the
 * "Retire sold / pulled listings" step (11 of 39 market-refresh runs, 2026-07-12..19).
 *
 * Keyset paging seeks on the primary key instead (price_id > cursor, ordered, limit),
 * so every page is a constant-cost index range read no matter how deep it goes. The
 * ordering also makes the sweep stable, which the offset version never was.
 */
async function fetchRowsKeyset<T extends { price_id: number }>(
  platforms: string[],
  columns: string,
): Promise<T[]> {
  if (platforms.length === 0) return [];
  const all: T[] = [];
  const PAGE = 1000;
  let cursor = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from("price_history")
      .select(columns)
      .eq("price_type", "listed")
      .or(NOT_RETIRED)
      .in("platform", platforms)
      .gt("price_id", cursor)
      .order("price_id", { ascending: true })
      .limit(PAGE);
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    all.push(...rows);
    if (rows.length < PAGE) break;
    cursor = rows[rows.length - 1].price_id;
  }
  return all;
}

/** Page through every still-shown listed row for the resolved platform(s). */
async function fetchAvailableRows(platforms: string[]): Promise<AvailRow[]> {
  return fetchRowsKeyset<AvailRow & { price_id: number }>(platforms, "price_id, platform, listing_ref");
}

/** Page every still-shown listed row for the resolved platform(s), WITH observed_on. */
async function fetchDatedRows(platforms: string[]): Promise<DatedRow[]> {
  return fetchRowsKeyset<DatedRow & { price_id: number }>(
    platforms,
    "price_id, platform, listing_ref, observed_on",
  );
}

/**
 * Age-based reconcile for CAPPED sources (TheRealReal: 120/category, so one sweep
 * never sees the whole live catalogue and snapshot-diff can't tell sold from
 * unseen). Retire listings whose LATEST observation is older than the cutoff; the
 * scheduled refresh keeps re-observing live listings, so only truly-gone ones age
 * out. SAFETY: abort if nothing was seen inside the window (the refresh isn't
 * running — don't retire the whole catalogue).
 */
async function ageReconcile(platform: string, ageDays: number, write: boolean, force: boolean): Promise<void> {
  const platforms = await resolvePlatforms(platform);
  if (platforms.length === 0) {
    console.error(`\nABORT: no listed rows match platform "${platform}" — nothing to reconcile.`);
    process.exit(1);
  }
  const rows = await fetchDatedRows(platforms);
  const today = new Date();
  const cutoff = new Date(today.getTime() - ageDays * 86_400_000).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  // Latest observed_on per listing_ref.
  const lastSeen = new Map<string, string>();
  const platformOf = new Map<string, string>();
  for (const r of rows) {
    if (!r.listing_ref || !r.observed_on) continue;
    const prev = lastSeen.get(r.listing_ref);
    if (!prev || r.observed_on > prev) lastSeen.set(r.listing_ref, r.observed_on);
    if (r.platform) platformOf.set(r.listing_ref, r.platform);
  }

  const refs = [...lastSeen.keys()];
  const seenRecently = refs.filter((ref) => (lastSeen.get(ref) as string) >= cutoff).length;
  const goneRefs = refs.filter((ref) => (lastSeen.get(ref) as string) < cutoff);

  console.log(`\nReconcile resale listings (AGE mode) — ${write ? "WRITE" : "DRY RUN"}`);
  console.log(`  platform match:  "${platform}" -> [${platforms.join(", ")}]`);
  console.log(`  age cutoff:      ${cutoff} (older than ${ageDays}d)`);
  console.log(`  distinct live:   ${refs.length}`);
  console.log(`  seen since cutoff: ${seenRecently}`);
  console.log(`  would retire:    ${goneRefs.length}`);

  if (seenRecently === 0 && !force) {
    console.error("\nABORT: no listings seen within the age window — the refresh isn't running. Refusing to retire the whole catalogue (--force to override).");
    process.exit(1);
  }
  if (goneRefs.length === 0) {
    console.log("\nNothing to retire (every live listing was seen within the window).");
    return;
  }
  if (!write) {
    console.log(`\nDRY RUN: ${goneRefs.length} listing(s) would be marked sold. Re-run with --write to apply.`);
    return;
  }

  const byPlatform = new Map<string, string[]>();
  for (const ref of goneRefs) {
    const p = platformOf.get(ref) ?? platform;
    (byPlatform.get(p) ?? byPlatform.set(p, []).get(p)!).push(ref);
  }
  let total = 0;
  for (const [p, refsForP] of byPlatform) {
    const n = await retire(p, refsForP, todayStr);
    console.log(`  ${p}: marked ${n} row(s) sold (delisted_on=${todayStr}).`);
    total += n;
  }
  console.log(`\nDone. Retired ${total} listing row(s).`);
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
      .eq("price_type", "listed")
      .or(NOT_RETIRED)
      .in("listing_ref", batch)
      .select("price_id");
    if (error) throw error;
    updated += (data ?? []).length;
  }
  return updated;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (!flags.platform || (!flags.snapshot && flags.ageDays == null)) {
    console.error("Usage: reconcile:sold -- --platform=<name> (--snapshot=<path> | --age-days=<N>) [--write] [--force] [--max-retire-frac=0.5]");
    process.exit(2);
  }

  // Age mode: for capped sources where one sweep can't see the whole live set.
  if (flags.ageDays != null) {
    await ageReconcile(flags.platform, flags.ageDays, flags.write, flags.force);
    return;
  }

  const liveRefs = readLiveRefs(flags.snapshot as string);
  const platforms = await resolvePlatforms(flags.platform);
  if (platforms.length === 0) {
    console.error(`\nABORT: no listed rows match platform "${flags.platform}" — nothing to reconcile.`);
    process.exit(1);
  }
  const rows = await fetchAvailableRows(platforms);
  const today = new Date().toISOString().slice(0, 10);

  // Gone = currently available, keyed, but absent from the fresh live set.
  const goneRows = rows.filter((r) => r.listing_ref && !liveRefs.has(r.listing_ref));
  const goneRefs = [...new Set(goneRows.map((r) => r.listing_ref as string))];

  console.log(`\nReconcile resale listings — ${flags.write ? "WRITE" : "DRY RUN"}`);
  console.log(`  platform match: "${flags.platform}" -> [${platforms.join(", ")}]`);
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

  // Update against each ACTUAL platform string present (resolved match may span variants).
  const gonePlatforms = [...new Set(goneRows.map((r) => r.platform).filter((p): p is string => !!p))];
  let total = 0;
  for (const p of gonePlatforms) {
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
