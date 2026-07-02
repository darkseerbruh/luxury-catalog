/**
 * Full-catalog sweep, step 2: create the styles + size variants a sweep-target
 * spec needs (2026-07-02 sweep). Reads supabase/ingest/sweep-targets/<slug>.json
 * (the same file fashionphile.ts appends to TARGETS) and find-or-creates each
 * (brand, style) and (style, size_label) — idempotent, safe to re-run, never
 * touches existing variants (the 2026-06-30 collision lesson: sweeps ADD, they
 * do not reshape hand-managed size buckets).
 *
 *   npx tsx supabase/seed/scaffold-from-spec.ts <brand-slug> [--write]
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin as db } from "./lib/client";

const WRITE = process.argv.includes("--write");
const slug = process.argv.slice(2).filter((a) => !a.startsWith("--"))[0];
if (!slug) {
  console.error("Usage: tsx scaffold-from-spec.ts <brand-slug> [--write]");
  process.exit(1);
}
const SPEC = path.resolve(__dirname, "../ingest/sweep-targets", `${slug}.json`);

type Target = { brand: string; style: string; size_label: string };

async function main() {
  const targets = JSON.parse(fs.readFileSync(SPEC, "utf8")) as Target[];
  const byBrand = new Map<string, Map<string, Set<string>>>();
  for (const t of targets) {
    const styles = byBrand.get(t.brand) ?? new Map<string, Set<string>>();
    const sizes = styles.get(t.style) ?? new Set<string>();
    sizes.add(t.size_label);
    styles.set(t.style, sizes);
    byBrand.set(t.brand, styles);
  }

  for (const [brandName, styles] of byBrand) {
    const { data: brand } = await db.from("brand").select("brand_id, name").ilike("name", brandName).maybeSingle();
    if (!brand) {
      console.error(`brand not found in catalog: ${brandName} — skipping (brand adds are a separate, tiered decision)`);
      continue;
    }
    console.log(`${brand.name} #${brand.brand_id}${WRITE ? "" : "  (DRY RUN)"}`);
    for (const [styleName, sizes] of styles) {
      const { data: existing } = await db
        .from("style")
        .select("style_id, name")
        .eq("brand_id", brand.brand_id)
        .ilike("name", styleName)
        .maybeSingle();
      let styleId = existing?.style_id ?? null;
      if (styleId == null) {
        if (!WRITE) {
          console.log(`  would create style "${styleName}" + sizes ${[...sizes].join(", ")}`);
          continue;
        }
        const { data, error } = await db
          .from("style")
          .insert({ brand_id: brand.brand_id, name: styleName })
          .select("style_id")
          .single();
        if (error) throw new Error(`style ${styleName}: ${error.message}`);
        styleId = data.style_id;
        console.log(`  created style "${styleName}" #${styleId}`);
      } else {
        console.log(`  style "${styleName}" exists #${styleId} (${existing!.name})`);
      }
      const { data: vars } = await db.from("variant").select("size_label").eq("style_id", styleId);
      const have = new Set((vars ?? []).map((v) => (v.size_label ?? "").toLowerCase()));
      for (const size of sizes) {
        if (have.has(size.toLowerCase())) continue;
        if (!WRITE) {
          console.log(`    would create variant ${size}`);
          continue;
        }
        const { error } = await db.from("variant").insert({ style_id: styleId, size_label: size });
        if (error) throw new Error(`variant ${styleName}/${size}: ${error.message}`);
        console.log(`    created variant ${size}`);
      }
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
