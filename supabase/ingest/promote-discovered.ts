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
import { canonicalModel, canonicalBrand } from "../../src/lib/ingest/model-normalize";

/**
 * Tier for a NEWLY created brand (existing brands keep their tier — we never
 * overwrite). The catalog is full-spectrum, so contemporary/accessible houses are
 * welcome; they default to 'mid'. The DB enum is coarse (thrift | mid |
 * ultra-luxury), so the luxury houses collapse to 'ultra-luxury' and everything
 * else new lands 'mid'. Most true-luxury houses already exist, so this mainly
 * tiers the contemporary newcomers (Michael Kors, Tory Burch, D&G) as 'mid'.
 */
const LUXURY_HOUSES = new Set(
  [
    "hermès", "hermes", "chanel", "louis vuitton", "dior", "christian dior", "gucci",
    "bottega veneta", "celine", "céline", "saint laurent", "prada", "fendi", "loewe",
    "goyard", "the row", "chloé", "chloe", "balenciaga", "valentino", "delvaux", "moynat",
  ].map((s) => norm(s)),
);
function tierForNewBrand(name: string): "thrift" | "mid" | "ultra-luxury" {
  return LUXURY_HOUSES.has(norm(name)) ? "ultra-luxury" : "mid";
}

/** A cluster is promotable to the catalog only if it names a real BAG model (the
 * dictionary resolves it). Guards against a recurring garment/shoe title ever
 * becoming a style — the catalogue is every BAG, not every fashion item. */
function bagModelName(c: { brandGuess: string; styleGuess: string }): string | null {
  return canonicalModel(c.brandGuess, c.styleGuess);
}

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

  // Lazy DB handle: created ONLY when we actually touch the DB, so importing this
  // module for tests never needs .env.local. Mirrors supabase/seed/lib/client.ts
  // (override:true so a local .env.local wins over ambient placeholder vars).
  async function connect() {
    const { createClient } = await import("@supabase/supabase-js");
    const dotenv = await import("dotenv");
    const path = await import("path");
    dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    }
    return createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  async function loadRows(supabase: Awaited<ReturnType<typeof connect>>): Promise<DiscoveredRow[]> {
    // Paginate: a plain select caps at 1000 rows, which would silently cluster on a
    // fraction of the table. Page through with .range() until exhausted.
    const out: DiscoveredRow[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("discovered_listing")
        .select("discovered_id, brand_guess, style_guess, size_label, sale_price, currency, matched_brand_id, matched_style_id, unresolved_reason, promoted_variant_id")
        .is("promoted_variant_id", null)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      out.push(...(data as DiscoveredRow[]));
      if (data.length < pageSize) break;
    }
    return out;
  }

  console.log(`promote-discovered: threshold ≥ ${flags.minCount}${flags.write ? " (WRITE)" : " (DRY RUN)"}`);

  // The DB read is itself deferred behind loadRows() (needs env). In dry-run we
  // still need the rows to report — but a missing-env / missing-table failure must
  // not pretend success, so surface it.
  let supabase: Awaited<ReturnType<typeof connect>>;
  let rows: DiscoveredRow[];
  try {
    supabase = await connect();
    rows = await loadRows(supabase);
  } catch (e) {
    console.error(`Could not read discovered_listing: ${(e as Error).message}`);
    console.error(`(This pass needs .env.local + an applied migration 0026. The grouping logic is unit-tested without a DB.)`);
    process.exit(1);
  }

  console.log(`Read ${rows.length} unpromoted discovered listing(s).`);
  const clusters = groupDiscovered(rows);
  const atThreshold = clusters.filter((c) => c.count >= flags.minCount);
  // BAG GATE: only promote clusters that name a real bag model. A recurring
  // garment/shoe title (from the FP/TRR catch-all capture) must never become a
  // catalog style. The clean canonical model name becomes the style name.
  const promotable = atThreshold.filter((c) => bagModelName(c) != null);
  const excludedNonBag = atThreshold.length - promotable.length;
  console.log(
    `${clusters.length} distinct cluster(s); ${atThreshold.length} ≥ ${flags.minCount}; ` +
      `${promotable.length} are bags (promotable), ${excludedNonBag} non-bag excluded.`,
  );

  if (promotable.length === 0) {
    console.log("No promotable bag clusters yet — keep capturing (run normalize:discovered first).");
    return;
  }

  console.table(
    promotable.map((c) => ({
      brand: c.brandGuess || "(none)",
      style: bagModelName(c) ?? c.styleGuess,
      size: c.sizeLabel ?? "(none)",
      count: c.count,
      price: priceRange(c),
    }))
  );

  if (!flags.write) {
    console.log("\nPromotion plan (dry run):");
    for (const c of promotable) for (const line of planFor(c)) console.log(line);
    console.log(`\nDRY RUN — re-run with --write to persist ${promotable.length} bag cluster(s).`);
    return;
  }

  // --- WRITE: find-or-create brand -> style -> variant, then re-point the cluster's
  // discovered rows. Additive + idempotent (AGENTS.md): existing rows are matched by
  // normalized name and reused, never duplicated or mutated; a re-run promotes only
  // what's still unpromoted. New brands get a tier; existing brands keep theirs.
  const created = await persistPromotions(supabase, rows, promotable);
  console.log(
    `\n✅ promoted ${promotable.length} cluster(s): ` +
      `+${created.brands} brand(s), +${created.styles} style(s), +${created.variants} variant(s); ` +
      `re-pointed ${created.repointed} discovered row(s).`,
  );
}

/** Re-derive each unpromoted row's cluster key (mirrors groupDiscovered) so we can
 * re-point a cluster's member rows after it's promoted. */
function rowsByClusterKey(rows: DiscoveredRow[]): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const r of rows) {
    if (r.promoted_variant_id != null) continue;
    const brand = (r.brand_guess ?? "").trim();
    const style = (r.style_guess ?? "").trim();
    if (!brand && !style) continue;
    const key = `${keyPart(brand ? normalizeDesigner(brand) : "")}|${keyPart(style)}|${keyPart(r.size_label?.trim() || null)}`;
    if (r.discovered_id == null) continue;
    (out.get(key) ?? out.set(key, []).get(key)!).push(r.discovered_id);
  }
  return out;
}

async function persistPromotions(
  supabase: { from: (t: string) => any },
  rows: DiscoveredRow[],
  clusters: DiscoveredCluster[],
): Promise<{ brands: number; styles: number; variants: number; repointed: number }> {
  const tally = { brands: 0, styles: 0, variants: 0, repointed: 0 };
  const byKey = rowsByClusterKey(rows);

  // Preload brands once; find-or-create keeps the cache warm across clusters.
  const { data: brandRows } = await supabase.from("brand").select("brand_id, name");
  const brandByNorm = new Map<string, number>(
    ((brandRows ?? []) as { brand_id: number; name: string }[]).map((b) => [norm(normalizeDesigner(b.name)), b.brand_id]),
  );

  for (const c of clusters) {
    const styleName = bagModelName(c) ?? c.styleGuess; // clean canonical model name
    const brandName = canonicalBrand(c.brandGuess) || c.brandGuess;
    const brandKey = norm(normalizeDesigner(brandName));

    // 1) brand (find-or-create; new brands get a tier, existing keep theirs)
    let brandId = c.matchedBrandId ?? brandByNorm.get(brandKey) ?? null;
    if (brandId == null) {
      const ins = await supabase.from("brand").insert({ name: brandName, tier: tierForNewBrand(brandName) }).select("brand_id").single();
      if (ins.error) {
        const ref = await supabase.from("brand").select("brand_id").eq("name", brandName).maybeSingle();
        brandId = ref.data?.brand_id ?? null;
      } else {
        brandId = ins.data.brand_id;
        tally.brands++;
      }
      if (brandId != null) brandByNorm.set(brandKey, brandId);
    }
    if (brandId == null) {
      console.warn(`  ⚠ skip: could not resolve/create brand "${brandName}"`);
      continue;
    }

    // 2) style (find by normalized name within brand, else create)
    let styleId = c.matchedStyleId ?? null;
    if (styleId == null) {
      const { data: styleRows } = await supabase.from("style").select("style_id, name").eq("brand_id", brandId);
      styleId = ((styleRows ?? []) as { style_id: number; name: string }[]).find((s) => norm(s.name) === norm(styleName))?.style_id ?? null;
    }
    if (styleId == null) {
      const ins = await supabase.from("style").insert({ brand_id: brandId, name: styleName }).select("style_id").single();
      if (ins.error) {
        const ref = await supabase.from("style").select("style_id").eq("brand_id", brandId).eq("name", styleName).maybeSingle();
        styleId = ref.data?.style_id ?? null;
      } else {
        styleId = ins.data.style_id;
        tally.styles++;
      }
    }
    if (styleId == null) {
      console.warn(`  ⚠ skip: could not resolve/create style "${brandName} / ${styleName}"`);
      continue;
    }

    // 3) variant (find by normalized size within style, else create)
    const size = c.sizeLabel;
    const { data: variantRows } = await supabase.from("variant").select("variant_id, size_label").eq("style_id", styleId);
    let variantId =
      ((variantRows ?? []) as { variant_id: number; size_label: string | null }[]).find((v) => norm(v.size_label) === norm(size ?? ""))?.variant_id ?? null;
    if (variantId == null) {
      const ins = await supabase.from("variant").insert({ style_id: styleId, size_label: size }).select("variant_id").single();
      if (ins.error) {
        console.warn(`  ⚠ skip variant for "${brandName} / ${styleName} / ${size ?? "(no size)"}": ${ins.error.message}`);
        continue;
      }
      variantId = ins.data.variant_id;
      tally.variants++;
    }

    // 4) re-point this cluster's discovered rows to the resolved variant
    const ids = byKey.get(c.key) ?? [];
    if (ids.length) {
      const { error } = await supabase
        .from("discovered_listing")
        .update({ promoted_variant_id: variantId, promoted_at: new Date().toISOString() })
        .in("discovered_id", ids);
      if (!error) tally.repointed += ids.length;
    }
  }
  return tally;
}

// Run only as a CLI (keep importable for tests — no top-level DB/env access).
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
