/**
 * Export the recurring discovered_listing clusters the dictionary can NOT yet place,
 * for model-assisted dictionary extension (docs/data-content-worklist.md).
 *
 * Reuses the exact promote-safe skip logic so the export matches what promotion skips:
 *   - cluster ≥ min occurrences
 *   - brand missing from catalog, OR brand present but canonicalModel() → null
 * Emits JSON: { brandInCatalog, brand, style, size, count, samples[] } per cluster.
 *
 *   npx tsx supabase/ingest/export-residue-clusters.ts [--min=5] > residue.json
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm } from "../../src/lib/image-import-core";
import { canonicalModel, canonicalBrand } from "../../src/lib/ingest/model-normalize";
import { promotableClusters, type DiscoveredRow } from "./promote-discovered";

const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=5").split("=")[1]);

type Row = DiscoveredRow & { raw_name: string | null; platform: string | null };

async function loadAll(): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("discovered_listing")
      .select("discovered_id,brand_guess,style_guess,size_label,sale_price,raw_name,platform,promoted_variant_id")
      .is("promoted_variant_id", null)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as unknown as Row[]));
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  const rows = await loadAll();
  const clusters = promotableClusters(rows as DiscoveredRow[], MIN);

  const { data: brands } = await db.from("brand").select("brand_id,name");
  const brandNorms = new Set((brands ?? []).map((b: { name: string }) => norm(canonicalBrand(b.name))));

  // sample titles per cluster key
  const samplesByKey = new Map<string, string[]>();
  for (const r of rows) {
    const b = (r.brand_guess ?? "").trim();
    const key = `${norm(b ? canonicalBrand(b) : "")}|${norm(r.style_guess || "")}|${norm((r.size_label || "").replace(/[()]/g, ""))}`;
    const arr = samplesByKey.get(key) ?? [];
    if (arr.length < 4 && r.raw_name) arr.push(r.raw_name);
    samplesByKey.set(key, arr);
  }

  const out = [];
  for (const c of clusters) {
    const brandKnown = brandNorms.has(norm(canonicalBrand(c.brandGuess)));
    const model = canonicalModel(c.brandGuess, c.styleGuess);
    if (brandKnown && model) continue; // promotable already — not residue
    out.push({
      brandInCatalog: brandKnown,
      brand: c.brandGuess,
      style: c.styleGuess,
      size: c.sizeLabel,
      count: c.count,
      samples: samplesByKey.get(c.key) ?? [],
    });
  }
  out.sort((a, b) => b.count - a.count);
  console.log(JSON.stringify(out, null, 1));
  console.error(`residue clusters ≥${MIN}: ${out.length} (brand in catalog: ${out.filter(o => o.brandInCatalog).length}, brand missing: ${out.filter(o => !o.brandInCatalog).length})`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
