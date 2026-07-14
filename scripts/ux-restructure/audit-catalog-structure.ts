/**
 * Catalog-wide structural audit (read-only). Answers: how healthy is the
 * style -> variant hierarchy across EVERY brand, not just the Birkin?
 *
 * Failure classes measured per brand:
 *   A. PSEUDO_STYLE   — style name embeds another existing style of the same brand
 *                       ("Togo Birkin 35" when "Birkin" exists). The class the merge fixes.
 *   B. LISTING_TITLE  — style name looks like a promoted seller title (very long, or
 *                       stuffed with colour+material+silhouette words, or repeats the
 *                       brand name). E.g. "Chanel Black Quilted Shiny Lambskin Leather
 *                       Small Bowling Bag".
 *   C. DUP_NAME       — two styles in one brand whose normalized names collide
 *                       (accent/spacing/case variants of the same name).
 *   D. ATTR_GAPS      — variant attribute completeness: % of variants missing
 *                       size_label / exterior_colorway / exterior_material_id.
 *   E. ONE_VARIANT    — styles with exactly one variant (breadth-seed smell; fine for
 *                       genuinely single-spec bags, a symptom in bulk).
 *
 * Output: console summary + scripts/ux-restructure/catalog-structure-audit.json
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

/** Page past the PostgREST 1000-row cap. */
async function all<T>(table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(select).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const COLOR_RX = /\b(black|white|beige|brown|tan|red|blue|navy|green|pink|purple|grey|gray|gold|silver|burgundy|cream|ivory|orange|yellow|multicolor|charcoal|light|dark)\b/i;
const MATERIAL_RX = /\b(leather|caviar|lambskin|calfskin|suede|canvas|tweed|patent|quilted|smooth|grained|pebbled|shiny|matte|velvet|denim|nylon|satin|python|croc|ostrich|epi|monogram|damier|togo|clemence|epsom|swift|tadelakt|toile)\b/i;
const SILHOUETTE_RX = /\b(tote|shoulder|crossbody|clutch|hobo|satchel|flap|bowling|bucket|backpack|camera|vanity|pouch|wallet|top handle|waist|belt)\b/i;

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function words(s: string): string[] { return norm(s).split(" ").filter(Boolean); }
function containsPhrase(name: string, base: string): boolean {
  return ` ${words(name).join(" ")} `.includes(` ${words(base).join(" ")} `);
}

type StyleRow = { style_id: number; name: string; brand_id: number };
type VariantRow = { variant_id: number; style_id: number; size_label: string | null; exterior_colorway: string | null; exterior_material_id: number | null };
type BrandRow = { brand_id: number; name: string };

(async () => {
  const [brands, styles, variants] = await Promise.all([
    all<BrandRow>("brand", "brand_id,name"),
    all<StyleRow>("style", "style_id,name,brand_id"),
    all<VariantRow>("variant", "variant_id,style_id,size_label,exterior_colorway,exterior_material_id"),
  ]);
  const brandName = new Map(brands.map((b) => [b.brand_id, b.name]));
  const variantsByStyle = new Map<number, VariantRow[]>();
  for (const v of variants) (variantsByStyle.get(v.style_id) ?? variantsByStyle.set(v.style_id, []).get(v.style_id)!).push(v);
  const stylesByBrand = new Map<number, StyleRow[]>();
  for (const s of styles) (stylesByBrand.get(s.brand_id) ?? stylesByBrand.set(s.brand_id, []).get(s.brand_id)!).push(s);

  type BrandReport = {
    brand: string; styles: number; variants: number;
    pseudoStyles: number; listingTitleStyles: number; dupNamePairs: number; oneVariantStyles: number;
    vMissingSize: number; vMissingColor: number; vMissingMaterial: number;
    examples: { pseudo: string[]; listing: string[]; dup: string[] };
  };
  const reports: BrandReport[] = [];

  for (const [brandId, brandStyles] of stylesByBrand) {
    const bName = brandName.get(brandId) ?? "?";
    const r: BrandReport = {
      brand: bName, styles: brandStyles.length, variants: 0,
      pseudoStyles: 0, listingTitleStyles: 0, dupNamePairs: 0, oneVariantStyles: 0,
      vMissingSize: 0, vMissingColor: 0, vMissingMaterial: 0,
      examples: { pseudo: [], listing: [], dup: [] },
    };

    // C: duplicate normalized names
    const seen = new Map<string, string>();
    for (const s of brandStyles) {
      const n = norm(s.name);
      if (seen.has(n)) { r.dupNamePairs++; if (r.examples.dup.length < 3) r.examples.dup.push(`"${seen.get(n)}" == "${s.name}"`); }
      else seen.set(n, s.name);
    }

    for (const s of brandStyles) {
      const vs = variantsByStyle.get(s.style_id) ?? [];
      r.variants += vs.length;
      if (vs.length === 1) r.oneVariantStyles++;
      for (const v of vs) {
        if (!v.size_label) r.vMissingSize++;
        if (!v.exterior_colorway) r.vMissingColor++;
        if (v.exterior_material_id == null) r.vMissingMaterial++;
      }

      // A: embeds another style of the same brand
      const isPseudo = brandStyles.some(
        (b) => b.style_id !== s.style_id && words(b.name).length < words(s.name).length && containsPhrase(s.name, b.name),
      );
      if (isPseudo) { r.pseudoStyles++; if (r.examples.pseudo.length < 3) r.examples.pseudo.push(s.name); }

      // B: promoted seller title — long AND descriptor-stuffed, or repeats the brand name
      const wc = words(s.name).length;
      const descriptorHits = [COLOR_RX.test(s.name), MATERIAL_RX.test(s.name), SILHOUETTE_RX.test(s.name)].filter(Boolean).length;
      const repeatsBrand = norm(s.name).startsWith(norm(bName)) || norm(s.name).includes(` ${norm(bName)} `);
      if ((wc >= 5 && descriptorHits >= 2) || repeatsBrand) {
        r.listingTitleStyles++;
        if (r.examples.listing.length < 3) r.examples.listing.push(s.name);
      }
    }
    reports.push(r);
  }

  reports.sort((a, b) => b.styles - a.styles);
  const tot = (k: keyof BrandReport) => reports.reduce((n, r) => n + (r[k] as number), 0);

  console.log("=== CATALOG STRUCTURE AUDIT ===");
  console.log(`brands: ${reports.length} · styles: ${tot("styles")} · variants: ${tot("variants")}`);
  console.log(`A pseudo-styles (name embeds another style): ${tot("pseudoStyles")}`);
  console.log(`B listing-title styles (seller-title junk):  ${tot("listingTitleStyles")}`);
  console.log(`C duplicate-name pairs:                      ${tot("dupNamePairs")}`);
  console.log(`E one-variant styles:                        ${tot("oneVariantStyles")}`);
  console.log(`D variants missing size / colour / material: ${tot("vMissingSize")} / ${tot("vMissingColor")} / ${tot("vMissingMaterial")}`);
  console.log("\nbrand                      styles  vars  A:pseudo  B:title  C:dup  E:1-var  miss size/col/mat");
  for (const r of reports) {
    console.log(
      `${r.brand.padEnd(26)} ${String(r.styles).padStart(5)} ${String(r.variants).padStart(5)}` +
      ` ${String(r.pseudoStyles).padStart(8)} ${String(r.listingTitleStyles).padStart(8)} ${String(r.dupNamePairs).padStart(6)}` +
      ` ${String(r.oneVariantStyles).padStart(8)}   ${r.vMissingSize}/${r.vMissingColor}/${r.vMissingMaterial}`,
    );
  }
  console.log("\n=== examples ===");
  for (const r of reports) {
    if (r.examples.pseudo.length || r.examples.listing.length || r.examples.dup.length) {
      console.log(`[${r.brand}]`);
      if (r.examples.pseudo.length) console.log(`  A: ${r.examples.pseudo.join(" | ")}`);
      if (r.examples.listing.length) console.log(`  B: ${r.examples.listing.join(" | ")}`);
      if (r.examples.dup.length) console.log(`  C: ${r.examples.dup.join(" | ")}`);
    }
  }

  const out = path.resolve(process.cwd(), "scripts/ux-restructure/catalog-structure-audit.json");
  writeFileSync(out, JSON.stringify(reports, null, 2));
  console.log(`\nFull report -> ${out}`);
})();
