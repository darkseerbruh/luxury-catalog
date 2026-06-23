/**
 * Promotion / normalization pass (catalog backbone §5 TODO).
 *
 * The two-tier `discovered_listing` table (migration 0026) captures every listing
 * the loader couldn't place on a curated variant — full parsed spec + raw title,
 * nothing dropped. Over time, the SAME model shows up there again and again
 * (e.g. a "Speedy" with no size in the title, or a brand/style we haven't curated
 * yet). This pass surfaces those RECURRING clusters so the operator can roll the
 * real ones up into the clean curated catalog.
 *
 * It groups unresolved rows by a normalized (brand_guess, style_guess, size_label)
 * key, counts occurrences, and flags clusters at/above a threshold (default 5) as
 * PROMOTABLE — a recurring model worth a curated style/variant. For each it prints
 * the find-or-create style → find-or-create variant → re-point plan it WOULD run.
 *
 * DRY-RUN by default. `--write` would persist (find-or-create + re-point) — guarded
 * so importing this module for tests never needs DB credentials (the Supabase
 * client is lazy-created only inside the --write branch).
 *
 *   npx tsx supabase/ingest/promote-discovered.ts [--min=N] [--write]
 *     --min=N   cluster size threshold to be "promotable" (default 5)
 *     --write   actually persist (find-or-create style/variant, re-point rows)
 *
 * The grouping/threshold core (groupDiscovered / promotableClusters) is a PURE
 * exported function, unit-tested against in-memory fixtures (no DB).
 */
import { norm, normalizeDesigner } from "../../src/lib/image-import-core";

/**
 * A row read from `discovered_listing` (subset we need for promotion). Mirrors the
 * migration 0026 column shape; extra columns on the real row are ignored.
 */
export interface DiscoveredRow {
  discovered_id?: number;
  brand_guess: string | null;
  style_guess: string | null;
  size_label: string | null;
  sale_price: number | null;
  currency?: string | null;
  matched_brand_id?: number | null;
  matched_style_id?: number | null;
  unresolved_reason?: string | null;
  /** Set once promoted — already-promoted rows are excluded from clustering. */
  promoted_variant_id?: number | null;
}

/** A recurring (brand, style, size) cluster of discovered listings. */
export interface DiscoveredCluster {
  /** Stable group key: norm(brand)|norm(style)|norm(size) (size "" when absent). */
  key: string;
  /** Representative display values (the first non-empty seen for the group). */
  brandGuess: string;
  styleGuess: string;
  sizeLabel: string | null;
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
  /** A best partial match carried over from the loader, if any row had one. */
  matchedBrandId: number | null;
  matchedStyleId: number | null;
}

/** Display key part: normalized, with a stable placeholder when the field is absent. */
function keyPart(s: string | null | undefined): string {
  return norm(s) || "";
}

/**
 * Group discovered rows into recurring (brand_guess, style_guess, size_label)
 * clusters, sorted by count desc (then brand/style/size for stable output).
 *
 * - Already-promoted rows (promoted_variant_id set) are excluded — they're done.
 * - Brand is normalized through normalizeDesigner first ("Hermes" → "Hermès") so
 *   accent variants don't split a cluster.
 * - Rows missing a brand AND a style guess are skipped (nothing to promote on).
 * - Price range ignores null/non-positive prices.
 */
export function groupDiscovered(rows: DiscoveredRow[]): DiscoveredCluster[] {
  const groups = new Map<string, DiscoveredCluster>();

  for (const row of rows) {
    if (row.promoted_variant_id != null) continue;
    const brand = (row.brand_guess ?? "").trim();
    const style = (row.style_guess ?? "").trim();
    if (!brand && !style) continue;

    const canonicalBrand = brand ? normalizeDesigner(brand) : "";
    const size = row.size_label?.trim() || null;
    const key = `${keyPart(canonicalBrand)}|${keyPart(style)}|${keyPart(size)}`;

    let cluster = groups.get(key);
    if (!cluster) {
      cluster = {
        key,
        brandGuess: canonicalBrand,
        styleGuess: style,
        sizeLabel: size,
        count: 0,
        minPrice: null,
        maxPrice: null,
        matchedBrandId: null,
        matchedStyleId: null,
      };
      groups.set(key, cluster);
    }

    cluster.count += 1;

    const price = typeof row.sale_price === "number" && Number.isFinite(row.sale_price) && row.sale_price > 0
      ? row.sale_price
      : null;
    if (price != null) {
      cluster.minPrice = cluster.minPrice == null ? price : Math.min(cluster.minPrice, price);
      cluster.maxPrice = cluster.maxPrice == null ? price : Math.max(cluster.maxPrice, price);
    }

    // Carry over the best partial match the loader recorded (first non-null wins).
    if (cluster.matchedBrandId == null && row.matched_brand_id != null) cluster.matchedBrandId = row.matched_brand_id;
    if (cluster.matchedStyleId == null && row.matched_style_id != null) cluster.matchedStyleId = row.matched_style_id;
  }

  return [...groups.values()].sort(
    (a, b) =>
      b.count - a.count ||
      a.brandGuess.localeCompare(b.brandGuess) ||
      a.styleGuess.localeCompare(b.styleGuess) ||
      (a.sizeLabel ?? "").localeCompare(b.sizeLabel ?? "")
  );
}

/**
 * Promotable clusters: recurring models at/above the threshold (default 5). These
 * look like a real style/size worth adding to the curated catalog.
 */
export function promotableClusters(rows: DiscoveredRow[], minCount = 5): DiscoveredCluster[] {
  return groupDiscovered(rows).filter((c) => c.count >= minCount);
}

interface Flags {
  minCount: number;
  write: boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { minCount: 5, write: false };
  for (const a of argv) {
    if (a === "--write") flags.write = true;
    else if (a.startsWith("--min=")) {
      const n = Number(a.slice("--min=".length));
      if (Number.isFinite(n) && n > 0) flags.minCount = n;
    }
  }
  return flags;
}

/** Human-readable price range for the dry-run table. */
function priceRange(c: DiscoveredCluster): string {
  if (c.minPrice == null) return "—";
  if (c.maxPrice == null || c.maxPrice === c.minPrice) return `$${c.minPrice}`;
  return `$${c.minPrice}–$${c.maxPrice}`;
}

/** The find-or-create / re-point plan we WOULD run for a cluster (printed in dry-run). */
function planFor(c: DiscoveredCluster): string[] {
  const size = c.sizeLabel ?? "(no size)";
  const lines = [
    `  • ${c.brandGuess || "(no brand)"} / ${c.styleGuess || "(no style)"} / ${size}  ×${c.count}  ${priceRange(c)}`,
  ];
  if (!c.brandGuess) {
    lines.push(`      ⚠ no brand_guess — cannot promote; triage manually`);
    return lines;
  }
  lines.push(`      1. find-or-create brand "${c.brandGuess}"${c.matchedBrandId != null ? ` (matched_brand_id=${c.matchedBrandId})` : ""}`);
  lines.push(`      2. find-or-create style "${c.styleGuess}"${c.matchedStyleId != null ? ` (matched_style_id=${c.matchedStyleId})` : ""}`);
  lines.push(`      3. find-or-create variant size_label="${size}"`);
  lines.push(`      4. re-point ${c.count} discovered_listing row(s) → that variant (set promoted_variant_id, promoted_at)`);
  return lines;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  // Lazy DB handle: created ONLY for --write, so importing this module for tests
  // never needs .env.local. Mirrors supabase/seed/lib/client.ts (override:true so
  // a local .env.local wins over ambient placeholder vars).
  async function loadRows(): Promise<DiscoveredRow[]> {
    const { createClient } = await import("@supabase/supabase-js");
    const dotenv = await import("dotenv");
    const path = await import("path");
    dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    }
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("discovered_listing")
      .select("discovered_id, brand_guess, style_guess, size_label, sale_price, currency, matched_brand_id, matched_style_id, unresolved_reason, promoted_variant_id")
      .is("promoted_variant_id", null);
    if (error) throw error;
    return (data ?? []) as DiscoveredRow[];
  }

  console.log(`promote-discovered: threshold ≥ ${flags.minCount}${flags.write ? " (WRITE)" : " (DRY RUN)"}`);

  // The DB read is itself deferred behind loadRows() (needs env). In dry-run we
  // still need the rows to report — but a missing-env / missing-table failure must
  // not pretend success, so surface it.
  let rows: DiscoveredRow[];
  try {
    rows = await loadRows();
  } catch (e) {
    console.error(`Could not read discovered_listing: ${(e as Error).message}`);
    console.error(`(This pass needs .env.local + an applied migration 0026. The grouping logic is unit-tested without a DB.)`);
    process.exit(1);
  }

  console.log(`Read ${rows.length} unpromoted discovered listing(s).`);
  const clusters = groupDiscovered(rows);
  const promotable = clusters.filter((c) => c.count >= flags.minCount);
  console.log(`${clusters.length} distinct model cluster(s); ${promotable.length} promotable (≥ ${flags.minCount}).`);

  if (promotable.length === 0) {
    console.log("Nothing to promote yet — keep capturing.");
    return;
  }

  console.table(
    promotable.map((c) => ({
      brand: c.brandGuess || "(none)",
      style: c.styleGuess || "(none)",
      size: c.sizeLabel ?? "(none)",
      count: c.count,
      price: priceRange(c),
    }))
  );

  console.log("\nPromotion plan:");
  for (const c of promotable) {
    for (const line of planFor(c)) console.log(line);
  }

  if (!flags.write) {
    console.log(`\nDRY RUN — re-run with --write to persist the above.`);
    return;
  }

  // --write path is intentionally a guarded stub: it cannot run in the authoring
  // worktree (no DB), and promoting a model into the CLEAN curated catalog is an
  // owner-gated decision (AGENTS.md: additive + idempotent, no unattended writes).
  // Wire the real find-or-create + re-point here once the owner approves a batch.
  console.error("\n--write is not yet wired to persist (owner-gated catalog change). Review the dry-run plan first.");
  process.exit(1);
}

// Run only as a CLI (keep importable for tests — no top-level DB/env access).
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
