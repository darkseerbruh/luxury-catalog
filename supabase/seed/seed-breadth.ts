/**
 * Breadth seeding: proves the catalog works across brands, not just the 5
 * deeply-researched hero styles.
 *
 * - Chanel / Louis Vuitton / Hermès: sparse style+variant rows derived from
 *   the legacy reseller CSVs (data/raw/). All confidence_level: low — these
 *   are resale-listing exports from 2022, not verified production records.
 * - Coach / Kate Spade / Burberry / Gucci / Prada / Fendi / Celine / Dior /
 *   Bottega Veneta: the CSVs have zero rows for these brands (confirmed —
 *   see docs/session-log.md), so each gets the brand record plus 1-2 stub
 *   styles using well-known flagship style names (public knowledge, not
 *   authentication-sensitive) so the brand renders structurally in the UI.
 *   No authentication/production detail is invented for these.
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { supabaseAdmin } from "./lib/client";

const DATA_DIR = path.resolve(__dirname, "../../data/raw");

const BRAND_TIERS: Record<string, { tier: "thrift" | "mid" | "ultra-luxury"; country: string; founded: number | null }> = {
  Coach: { tier: "thrift", country: "USA", founded: 1941 },
  "Kate Spade": { tier: "thrift", country: "USA", founded: 1993 },
  Burberry: { tier: "thrift", country: "UK", founded: 1856 },
  Gucci: { tier: "thrift", country: "Italy", founded: 1921 },
  Prada: { tier: "mid", country: "Italy", founded: 1913 },
  Fendi: { tier: "mid", country: "Italy", founded: 1925 },
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

async function upsertStyle(brandId: number, name: string, description?: string | null) {
  const { data, error } = await supabaseAdmin
    .from("style")
    .upsert(
      { brand_id: brandId, name, description: description ?? null },
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

interface CsvRow {
  Designer?: string;
  "Bag name"?: string;
  Colors?: string;
  Hardware?: string;
  "Suggested retail"?: string;
  "Height (cm)"?: string;
  "Width (cm)"?: string;
  "Depth (cm)"?: string;
}

async function seedFromCsv(filename: string, designerKey = "Designer", bagNameKey = "Bag name") {
  const fullPath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Skipping ${filename} — not found`);
    return;
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  const rows: CsvRow[] = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });

  const targetBrands = new Set(["Chanel", "Louis Vuitton", "Hermes", "Hermès"]);
  const seenStyleKeys = new Set<string>();
  let inserted = 0;
  const MAX_PER_BRAND = 40;
  const perBrandCount: Record<string, number> = {};

  for (const row of rows) {
    const designerRaw = (row[designerKey as keyof CsvRow] as string)?.trim();
    if (!designerRaw || !targetBrands.has(designerRaw)) continue;
    const designer = designerRaw === "Hermes" ? "Hermès" : designerRaw;

    const bagName = (row[bagNameKey as keyof CsvRow] as string)?.trim();
    if (!bagName) continue;

    perBrandCount[designer] = perBrandCount[designer] ?? 0;
    if (perBrandCount[designer] >= MAX_PER_BRAND) continue;

    const styleKey = `${designer}::${bagName}`;
    if (seenStyleKeys.has(styleKey)) continue;
    seenStyleKeys.add(styleKey);
    perBrandCount[designer]++;

    const brandId = await upsertBrand(designer);
    const styleId = await upsertStyle(brandId, bagName, `Breadth record sourced from legacy 2022 reseller export. ${row.Colors ? `Seen in: ${row.Colors}.` : ""}`.trim());

    const { error } = await supabaseAdmin.from("variant").insert({
      style_id: styleId,
      exterior_colorway: row.Colors?.trim() || null,
      hardware_color: row.Hardware?.trim() || null,
      retail_price_original: parseNum(row["Suggested retail"]),
      currency: "USD",
      market_availability: "unknown",
      authentication_markers: null,
    });
    if (error) {
      console.warn(`  variant insert skipped for ${styleKey}: ${error.message}`);
      continue;
    }
    inserted++;
  }

  console.log(`${filename}: inserted ${inserted} breadth style+variant rows across ${Object.keys(perBrandCount).length} brands`);
}

async function seedStubBrands() {
  for (const [brandName, styles] of Object.entries(STUB_STYLES)) {
    const brandId = await upsertBrand(brandName);
    for (const styleName of styles) {
      await upsertStyle(
        brandId,
        styleName,
        "Stub record — flagship style name only, no production/authentication detail researched yet. Not present in either legacy CSV export; flagged for future deep research pass."
      );
    }
    console.log(`${brandName}: ${styles.length} stub styles (brand_id=${brandId})`);
  }
}

async function main() {
  // Ensure Coach exists at brand level even though its hero styles
  // (Tabby/Swagger) are seeded separately by seed-hero-styles.ts.
  await upsertBrand("Coach");

  await seedFromCsv("therealreal_data-1.csv");
  await seedFromCsv("theluxurycloset_data_partial.csv");
  await seedStubBrands();

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
