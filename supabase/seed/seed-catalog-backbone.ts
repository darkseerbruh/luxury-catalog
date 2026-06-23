/**
 * Seed the permanent-collection BACKBONE (supabase/seed/research/catalog-backbone.json):
 * the canonical, perennial styles each house makes every season. Top-down spine for the
 * catalog — find-or-creates clean `style` rows (and the Saint Laurent brand if missing),
 * skipping anything that already exists. Idempotent. Dry run by default; --write to persist.
 *
 *   npx tsx supabase/seed/seed-catalog-backbone.ts            # dry run (reports only)
 *   npx tsx supabase/seed/seed-catalog-backbone.ts --write    # persist
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./lib/client";

const WRITE = process.argv.includes("--write");

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

interface Backbone { brands: Record<string, Record<string, string[]>>; }

async function main() {
  const bb: Backbone = JSON.parse(fs.readFileSync(path.resolve(__dirname, "research/catalog-backbone.json"), "utf8"));

  const { data: brandRows } = await supabaseAdmin.from("brand").select("brand_id, name");
  const brandByNorm = new Map((brandRows ?? []).map((b) => [norm(b.name), b]));

  let stylesExist = 0, stylesToCreate = 0, brandsToCreate = 0;
  const toCreate: { brand: string; name: string; tier: string }[] = [];
  const newBrands: string[] = [];

  for (const [brandName, tiers] of Object.entries(bb.brands)) {
    let brand = brandByNorm.get(norm(brandName));
    if (!brand) {
      brandsToCreate++; newBrands.push(brandName);
      if (WRITE) {
        // `tier` is a NOT-NULL enum (thrift|mid|ultra-luxury). New backbone brands
        // (currently only Saint Laurent) are peer luxury houses → "mid", matching
        // Dior/Celine/Bottega/Fendi/Prada.
        const { data, error } = await supabaseAdmin.from("brand")
          .insert({ name: brandName, country_of_origin: "France", tier: "mid" }).select("brand_id, name").single();
        if (error) throw new Error(`brand ${brandName}: ${error.message}`);
        brand = data!; brandByNorm.set(norm(brandName), brand);
      } else {
        brand = { brand_id: -1, name: brandName } as { brand_id: number; name: string };
      }
    }

    // existing styles for this brand (exact-normalized match only — verbose per-item
    // seed styles like "...Birkin 30 Bag" do NOT count as the canonical "Birkin").
    const { data: existing } = await supabaseAdmin.from("style").select("name").eq("brand_id", brand.brand_id);
    const existingNorm = new Set((existing ?? []).map((s) => norm(s.name)));

    for (const [tier, styles] of Object.entries(tiers)) {
      for (const styleName of styles) {
        if (existingNorm.has(norm(styleName))) { stylesExist++; continue; }
        stylesToCreate++; toCreate.push({ brand: brandName, name: styleName, tier });
        if (WRITE && brand.brand_id > 0) {
          const { error } = await supabaseAdmin.from("style").insert({
            brand_id: brand.brand_id, name: styleName, style_family: styleName,
            description: `Permanent collection (tier ${tier}) — catalog backbone.`,
          });
          if (error) throw new Error(`style ${brandName}/${styleName}: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n${WRITE ? "WROTE" : "DRY RUN"} — backbone seed`);
  console.log(`brands: ${brandsToCreate} to create ${newBrands.length ? "(" + newBrands.join(", ") + ")" : ""}`);
  console.log(`styles: ${stylesExist} already exist, ${stylesToCreate} ${WRITE ? "created" : "to create"}`);
  console.log("\nto create, by brand:");
  const byBrand: Record<string, string[]> = {};
  for (const t of toCreate) (byBrand[t.brand] = byBrand[t.brand] || []).push(`${t.name}[T${t.tier}]`);
  for (const [b, ss] of Object.entries(byBrand)) console.log(`  ${b.padEnd(16)} ${ss.join(", ")}`);
  if (!WRITE) console.log("\n(dry run — pass --write to persist)");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
