/**
 * Breadth seeding: proves the catalog works across brands, not just the 5
 * deeply-researched hero styles.
 *
 * Source data (data/raw/) is two legacy reseller exports from 2022. They only
 * contain Chanel, Louis Vuitton and Hermès rows (confirmed — see
 * docs/session-log.md), so:
 *
 * - Chanel / Louis Vuitton / Hermès: real (if dated) attributes are mapped into
 *   style + variant + production_record + fits rows. Everything is
 *   confidence_level: low and sourced as a resale export — NOT verified
 *   production data. Hero style names (Classic Flap, Birkin, Kelly, Tabby,
 *   Swagger) are skipped so reseller rows never pollute the curated hero data.
 * - Coach / Kate Spade / Burberry / Gucci / Prada / Fendi / Celine / Dior /
 *   Bottega Veneta: the CSVs have zero rows, so each gets the brand record plus
 *   1-2 stub styles using well-known flagship names (public knowledge, not
 *   authentication-sensitive). No authentication/production detail is invented;
 *   these are flagged for a future browser-based research pass.
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { supabaseAdmin } from "./lib/client";
import { resolveMaterialId } from "./lib/material-resolver";

const DATA_DIR = path.resolve(__dirname, "../../data/raw");

const BRAND_TIERS: Record<string, { tier: "thrift" | "mid" | "premium" | "ultra-luxury"; country: string; founded: number | null }> = {
  Coach: { tier: "thrift", country: "USA", founded: 1941 },
  "Kate Spade": { tier: "thrift", country: "USA", founded: 1993 },
  Burberry: { tier: "thrift", country: "UK", founded: 1856 },
  Gucci: { tier: "premium", country: "Italy", founded: 1921 },
  Prada: { tier: "premium", country: "Italy", founded: 1913 },
  Fendi: { tier: "premium", country: "Italy", founded: 1925 },
  Celine: { tier: "mid", country: "France", founded: 1945 },
  Dior: { tier: "mid", country: "France", founded: 1946 },
  "Bottega Veneta": { tier: "mid", country: "Italy", founded: 1966 },
  Chanel: { tier: "ultra-luxury", country: "France", founded: 1910 },
  "Louis Vuitton": { tier: "ultra-luxury", country: "France", founded: 1854 },
  Hermès: { tier: "ultra-luxury", country: "France", founded: 1837 },
};

// Well-known flagship styles for brands absent from both CSVs — public
// knowledge (style existence), not authentication detail.
const STUB_STYLES: Record<string, string[]> = {
  "Kate Spade": ["Knott", "Sam"],
  Burberry: ["The Knight", "Lola"],
  Gucci: ["GG Marmont", "Dionysus"],
  Prada: ["Re-Edition 2005", "Galleria"],
  Fendi: ["Baguette", "Peekaboo"],
  Celine: ["Triomphe", "Luggage"],
  Dior: ["Lady Dior", "Saddle"],
  "Bottega Veneta": ["Jodie", "Cassette"],
};

// Curated hero styles seeded by seed-hero-styles.ts. Breadth skips any bag whose
// name contains one of these so reseller rows never dilute the hero records.
const HERO_STYLE_NEEDLES = ["classic flap", "birkin", "kelly", "tabby", "swagger"];

const SOURCE_NOTE = "Legacy 2022 reseller export (TheRealReal / TheLuxuryCloset). Treat as low confidence.";
const MAX_STYLES_PER_BRAND = 40;
const MAX_VARIANTS_PER_STYLE = 6;

async function upsertBrand(name: string) {
  const meta = BRAND_TIERS[name];
  const { data, error } = await supabaseAdmin
    .from("brand")
    .upsert(
      {
        name,
        country_of_origin: meta?.country ?? null,
        founded_year: meta?.founded ?? null,
        tier: meta?.tier ?? "mid",
      },
      { onConflict: "name" }
    )
    .select("brand_id")
    .single();
  if (error) throw new Error(`upsertBrand(${name}): ${error.message}`);
  return data.brand_id as number;
}

async function upsertStyle(
  brandId: number,
  name: string,
  fields: { description?: string | null; closure_type?: string | null } = {}
) {
  const { data, error } = await supabaseAdmin
    .from("style")
    .upsert(
      {
        brand_id: brandId,
        name,
        description: fields.description ?? null,
        closure_type: fields.closure_type ?? null,
      },
      { onConflict: "brand_id,name" }
    )
    .select("style_id")
    .single();
  if (error) throw new Error(`upsertStyle(${name}): ${error.message}`);
  return data.style_id as number;
}

function parseNum(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** First 4-digit year in a "Years in product" string, e.g. "2010 - present" -> 2010. */
function parseYearStart(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

function stillInProduction(s: string | undefined): boolean {
  return !!s && /present|current|ongoing/i.test(s);
}

/** Split a "Fits popular devices" cell into individual item names. */
function parseFits(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[,;/]| and /i)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 1 && x !== "none" && x !== "n/a")
    .slice(0, 6);
}

function clip(s: string | undefined, max: number): string | null {
  if (!s) return null;
  const t = s.trim();
  return t ? t.slice(0, max) : null;
}

interface CsvRow {
  Designer?: string;
  "Bag name"?: string;
  Hardware?: string;
  "Material Types"?: string;
  Colors?: string;
  "Years in product"?: string;
  "Fits popular devices"?: string;
  "Size (brand's name of size)"?: string;
  "Interior material"?: string;
  "Exterior material"?: string;
  "Shoulder Strap"?: string;
  "Includes"?: string;
  "Product Description"?: string;
  "Suggested retail"?: string;
  "Height (cm)"?: string;
  "Width (cm)"?: string;
  "Length (cm)"?: string;
  "Depth (cm)"?: string;
  "Closure type"?: string;
  "Made in country"?: string;
}

function normalizeDesigner(raw: string): string {
  return raw === "Hermes" ? "Hermès" : raw;
}

function isHeroStyle(bagName: string): boolean {
  const n = bagName.toLowerCase();
  return HERO_STYLE_NEEDLES.some((needle) => n.includes(needle));
}

async function seedFromCsv(filename: string) {
  const fullPath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Skipping ${filename} — not found`);
    return new Set<string>();
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  // Accept any brand we know how to tier. The legacy exports in data/raw/ only
  // contain Chanel/LV/Hermès today, but the full TheLuxuryCloset export (in
  // Drive, too large to pull into a cloud session) carries the other brands —
  // dropping it into data/raw/ will populate them with no code change.
  const targetBrands = new Set([...Object.keys(BRAND_TIERS), "Hermes"]);

  // Group rows by brand + bag name so each bag becomes one style with N variants.
  const byStyle = new Map<string, { designer: string; bagName: string; rows: CsvRow[] }>();
  for (const row of rows) {
    const designerRaw = row.Designer?.trim();
    if (!designerRaw || !targetBrands.has(designerRaw)) continue;
    const bagName = row["Bag name"]?.trim();
    if (!bagName || isHeroStyle(bagName)) continue;
    const designer = normalizeDesigner(designerRaw);
    const key = `${designer}::${bagName}`;
    if (!byStyle.has(key)) byStyle.set(key, { designer, bagName, rows: [] });
    byStyle.get(key)!.rows.push(row);
  }

  const stylesPerBrand: Record<string, number> = {};
  let styleCount = 0;
  let variantCount = 0;

  for (const { designer, bagName, rows: styleRows } of byStyle.values()) {
    stylesPerBrand[designer] = stylesPerBrand[designer] ?? 0;
    if (stylesPerBrand[designer] >= MAX_STYLES_PER_BRAND) continue;
    stylesPerBrand[designer]++;

    const brandId = await upsertBrand(designer);
    const first = styleRows[0];
    const styleId = await upsertStyle(brandId, bagName, {
      description: clip(first["Product Description"], 600) ?? SOURCE_NOTE,
      closure_type: clip(first["Closure type"], 80),
    });

    // Idempotent: clear any prior breadth variants for this (non-hero) style.
    await supabaseAdmin.from("variant").delete().eq("style_id", styleId);

    for (const row of styleRows.slice(0, MAX_VARIANTS_PER_STYLE)) {
      const materialName = clip(row["Exterior material"], 120) ?? clip(row["Material Types"], 120);
      const exteriorMaterialId = await resolveMaterialId(materialName);
      const interiorMaterialId = await resolveMaterialId(clip(row["Interior material"], 120));

      const { data: variant, error: vErr } = await supabaseAdmin
        .from("variant")
        .insert({
          style_id: styleId,
          size_label: clip(row["Size (brand's name of size)"], 80),
          exterior_material_id: exteriorMaterialId,
          exterior_colorway: clip(row.Colors, 120),
          hardware_color: clip(row.Hardware, 80),
          interior_material_id: interiorMaterialId,
          strap_type: clip(row["Shoulder Strap"], 120),
          market_availability: "resale (2022 export)",
          year_start: parseYearStart(row["Years in product"]),
          still_in_production: stillInProduction(row["Years in product"]),
          retail_price_original: parseNum(row["Suggested retail"]),
          currency: "USD",
          authentication_markers: null,
        })
        .select("variant_id")
        .single();

      if (vErr || !variant) {
        console.warn(`  variant insert skipped for ${designer}::${bagName}: ${vErr?.message}`);
        continue;
      }
      variantCount++;
      const variantId = variant.variant_id as number;

      // Production record (dimensions + origin), low confidence.
      const h = parseNum(row["Height (cm)"]);
      const w = parseNum(row["Width (cm)"]);
      const d = parseNum(row["Depth (cm)"]);
      const country = clip(row["Made in country"], 80);
      if (h || w || d || country) {
        await supabaseAdmin.from("production_record").insert({
          variant_id: variantId,
          country_of_manufacture: country,
          production_year: parseYearStart(row["Years in product"]),
          dimensions_h_cm: h,
          dimensions_w_cm: w,
          dimensions_d_cm: d,
          sources: SOURCE_NOTE,
          confidence_level: "low",
        });
      }

      // Device fit, unverified.
      const fitsItems = parseFits(row["Fits popular devices"]);
      if (fitsItems.length) {
        await supabaseAdmin.from("fits").insert(
          fitsItems.map((item) => ({
            variant_id: variantId,
            item_name: item,
            fits: "yes" as const,
            verified: false,
            contributor: "reseller export",
          }))
        );
      }
    }

    styleCount++;
  }

  console.log(
    `${filename}: ${styleCount} styles / ${variantCount} variants across ${Object.keys(stylesPerBrand).length} brands`
  );
  return new Set(Object.keys(stylesPerBrand));
}

async function seedStubBrands(skip: Set<string>) {
  for (const [brandName, styles] of Object.entries(STUB_STYLES)) {
    if (skip.has(brandName)) {
      console.log(`${brandName}: skipping stubs — already seeded from CSV`);
      continue;
    }
    const brandId = await upsertBrand(brandName);
    for (const styleName of styles) {
      await upsertStyle(brandId, styleName, {
        description:
          "Stub record — flagship style name only, no production/authentication detail researched yet. Not present in either legacy CSV export; flagged for a future deep research pass.",
      });
    }
    console.log(`${brandName}: ${styles.length} stub styles (brand_id=${brandId})`);
  }
}

async function main() {
  // Ensure Coach exists at brand level even though its hero styles
  // (Tabby/Swagger) are seeded separately by seed-hero-styles.ts.
  await upsertBrand("Coach");

  const seeded = new Set<string>();
  for (const b of await seedFromCsv("therealreal_data-1.csv")) seeded.add(b);
  for (const b of await seedFromCsv("theluxurycloset_data_partial.csv")) seeded.add(b);
  await seedStubBrands(seeded);

  console.log("\nBreadth seeding complete.");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
