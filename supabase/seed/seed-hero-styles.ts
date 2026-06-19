/**
 * Loads the researched JSON files in supabase/seed/research/*.json into the
 * 15-table schema. Each JSON file is the output of a research pass per hero
 * style (Chanel Classic Flap, Hermès Birkin, Hermès Kelly, Coach Tabby,
 * Coach Swagger) — see docs/session-log.md for sourcing notes.
 *
 * Re-runnable: brand/style use upsert; variant and all child tables are
 * inserted fresh each run after deleting prior rows for the same style, so
 * re-running this script doesn't duplicate data.
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./lib/client";
import { resolveMaterialId } from "./lib/material-resolver";

const RESEARCH_DIR = path.resolve(__dirname, "research");

interface ResearchFile {
  brand: Record<string, any>;
  style: Record<string, any>;
  variants: Record<string, any>[];
  production_records: Record<string, any>[];
  known_color_combinations: Record<string, any>[];
  carry_methods: Record<string, any>[];
  fits: Record<string, any>[];
  interior_storage: Record<string, any>[];
  serial_tags: Record<string, any>[];
  locks_and_keys: Record<string, any>[];
  provenance_packaging: Record<string, any>[];
  price_history: Record<string, any>[];
  sources?: string[];
}

const CONFIDENCE_LEVELS = new Set(["low", "medium", "high", "verified"]);
function clampConfidence(level: unknown): "low" | "medium" | "high" | "verified" {
  return typeof level === "string" && CONFIDENCE_LEVELS.has(level) ? (level as any) : "low";
}

async function upsertBrand(brand: ResearchFile["brand"]) {
  const { data, error } = await supabaseAdmin
    .from("brand")
    .upsert(
      {
        name: brand.name,
        country_of_origin: brand.country_of_origin ?? null,
        founded_year: brand.founded_year ?? null,
        tier: brand.tier,
        description: brand.description ?? null,
      },
      { onConflict: "name" }
    )
    .select("brand_id")
    .single();
  if (error) throw new Error(`upsertBrand(${brand.name}): ${error.message}`);
  return data.brand_id as number;
}

async function upsertStyle(brandId: number, style: ResearchFile["style"]) {
  const { data, error } = await supabaseAdmin
    .from("style")
    .upsert(
      {
        brand_id: brandId,
        name: style.name,
        style_family: style.style_family ?? null,
        silhouette: style.silhouette ?? null,
        closure_type: style.closure_type ?? null,
        year_introduced: style.year_introduced ?? null,
        redesigned: style.redesigned ?? null,
        discontinued: style.discontinued ?? false,
        year_discontinued: style.year_discontinued ?? null,
        description: style.description ?? null,
      },
      { onConflict: "brand_id,name" }
    )
    .select("style_id")
    .single();
  if (error) throw new Error(`upsertStyle(${style.name}): ${error.message}`);
  return data.style_id as number;
}

async function clearExistingVariants(styleId: number) {
  // variant has on-delete-cascade to all child tables, so this clears
  // everything downstream too — safe to re-run.
  const { error } = await supabaseAdmin.from("variant").delete().eq("style_id", styleId);
  if (error) throw new Error(`clearExistingVariants(style_id=${styleId}): ${error.message}`);
}

async function loadResearchFile(filename: string) {
  const fullPath = path.join(RESEARCH_DIR, filename);
  const json: ResearchFile = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

  console.log(`\n--- ${filename} ---`);
  const brandId = await upsertBrand(json.brand);
  const styleId = await upsertStyle(brandId, json.style);
  await clearExistingVariants(styleId);

  const variantIdByIndex = new Map<number, number>();

  // Some research files have a null/missing variant_index on individual
  // variants; normalize to array position so child rows referencing that
  // variant_index don't silently get dropped.
  json.variants = json.variants.map((v, i) => ({ ...v, variant_index: v.variant_index ?? i }));
  const normalizeIndex = (raw: Record<string, any>[] | Record<string, any> | null | undefined) => {
    const rows = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
    return rows.length === json.variants.length && rows.every((r) => r.variant_index == null)
      ? rows.map((r, i) => ({ ...r, variant_index: i }))
      : rows.map((r) => ({ ...r, variant_index: r.variant_index ?? 0 }));
  };

  for (const key of [
    "production_records",
    "known_color_combinations",
    "carry_methods",
    "fits",
    "interior_storage",
    "serial_tags",
    "locks_and_keys",
    "provenance_packaging",
    "price_history",
  ] as const) {
    json[key] = normalizeIndex(json[key]);
  }

  for (const v of json.variants) {
    const exteriorMaterialId = await resolveMaterialId(v.exterior_material);
    const interiorMaterialId = await resolveMaterialId(v.interior_material);

    const { data, error } = await supabaseAdmin
      .from("variant")
      .insert({
        style_id: styleId,
        size_label: v.size_label ?? null,
        size_category: v.size_category ?? null,
        construction_method: v.construction_method ?? null,
        rigidity: v.rigidity ?? null,
        exterior_material_id: exteriorMaterialId,
        exterior_colorway: v.exterior_colorway ?? null,
        hardware_color: v.hardware_color ?? null,
        hardware_type: v.hardware_type ?? null,
        strap_type: v.strap_type ?? null,
        strap_attachment_type: v.strap_attachment_type ?? null,
        interior_material_id: interiorMaterialId,
        interior_color: v.interior_color ?? null,
        interior_matches_exterior: v.interior_matches_exterior ?? null,
        stitching_color: v.stitching_color ?? null,
        stitching_matches_exterior: v.stitching_matches_exterior ?? null,
        market_availability: v.market_availability ?? null,
        year_start: v.year_start ?? null,
        year_end: v.year_end ?? null,
        still_in_production: v.still_in_production ?? false,
        retail_price_original: v.retail_price_original ?? null,
        currency: v.currency ?? null,
        authentication_markers: v.authentication_markers ?? null,
      })
      .select("variant_id")
      .single();

    if (error) throw new Error(`insert variant (${json.style.name} idx ${v.variant_index}): ${error.message}`);
    variantIdByIndex.set(v.variant_index, data.variant_id);
  }

  console.log(`  variants: ${variantIdByIndex.size}`);

  const childInserts: { table: string; count: number }[] = [];

  async function insertChildRows(
    table: string,
    rows: Record<string, any>[],
    mapRow: (row: Record<string, any>, variantId: number) => Record<string, any>
  ) {
    if (!rows?.length) return;
    const payload = rows
      .filter((r) => variantIdByIndex.has(r.variant_index))
      .map((r) => mapRow(r, variantIdByIndex.get(r.variant_index)!));
    if (!payload.length) return;
    const { error } = await supabaseAdmin.from(table).insert(payload);
    if (error) throw new Error(`insert ${table} (${json.style.name}): ${error.message}`);
    childInserts.push({ table, count: payload.length });
  }

  await insertChildRows("production_record", json.production_records, (r, variantId) => ({
    variant_id: variantId,
    country_of_manufacture: r.country_of_manufacture ?? null,
    production_year: r.production_year ?? null,
    production_season: r.production_season ?? null,
    dimensions_h_cm: r.dimensions_h_cm ?? null,
    dimensions_w_cm: r.dimensions_w_cm ?? null,
    dimensions_d_cm: r.dimensions_d_cm ?? null,
    opening_width_cm: r.opening_width_cm ?? null,
    opening_height_cm: r.opening_height_cm ?? null,
    hardware_vendor_notes: r.hardware_vendor_notes ?? null,
    screw_type: r.screw_type ?? null,
    screw_engraving: r.screw_engraving ?? null,
    date_code_format: r.date_code_format ?? null,
    stamp_placement: r.stamp_placement ?? null,
    stamp_font_notes: r.stamp_font_notes ?? null,
    known_authentication_markers: r.known_authentication_markers ?? null,
    sources: typeof r.sources === "string" ? r.sources : Array.isArray(r.sources) ? r.sources.join("; ") : null,
    confidence_level: clampConfidence(r.confidence_level),
  }));

  await insertChildRows("known_color_combination", json.known_color_combinations, (r, variantId) => ({
    variant_id: variantId,
    exterior_color: r.exterior_color ?? null,
    interior_color: r.interior_color ?? null,
    stitching_color: r.stitching_color ?? null,
    hardware_color: r.hardware_color ?? null,
    produced: r.produced ?? false,
    market: r.market ?? null,
    year_range: r.year_range ?? null,
    authentication_notes: r.authentication_notes ?? null,
    confidence_level: clampConfidence(r.confidence_level),
  }));

  await insertChildRows("carry_method", json.carry_methods, (r, variantId) => ({
    variant_id: variantId,
    carry_type: r.carry_type,
    possible: r.possible,
    strap_drop_length_cm: r.strap_drop_length_cm ?? null,
    strap_adjustable: r.strap_adjustable ?? null,
    notes: r.notes ?? null,
    verified: r.verified ?? false,
  }));

  await insertChildRows("fits", json.fits.filter((r) => r.fits != null), (r, variantId) => ({
    variant_id: variantId,
    item_name: r.item_name,
    fits: r.fits,
    verified: r.verified ?? false,
    notes: r.notes ?? null,
    contributor: r.contributor ?? null,
  }));

  await insertChildRows("interior_storage", json.interior_storage.filter((r) => r.feature_type != null), (r, variantId) => ({
    variant_id: variantId,
    feature_type: r.feature_type,
    quantity: r.quantity ?? 1,
    placement: r.placement ?? null,
    size_notes: r.size_notes ?? null,
    material: r.material ?? null,
    color: r.color ?? null,
    authentication_notes: r.authentication_notes ?? null,
    verified: r.verified ?? false,
  }));

  await insertChildRows("serial_tag", json.serial_tags, (r, variantId) => ({
    variant_id: variantId,
    tag_type: r.tag_type,
    format: r.format ?? null,
    placement: r.placement ?? null,
    material: r.material ?? null,
    year_range: r.year_range ?? null,
    how_to_read: r.how_to_read ?? null,
    authentication_notes: r.authentication_notes ?? null,
    verified: r.verified ?? false,
    confidence_level: clampConfidence(r.confidence_level),
  }));

  await insertChildRows("lock_and_key", json.locks_and_keys, (r, variantId) => ({
    variant_id: variantId,
    includes_lock: r.includes_lock ?? false,
    lock_type: r.lock_type ?? null,
    lock_material: r.lock_material ?? null,
    lock_engraving: r.lock_engraving ?? null,
    engraving_format: r.engraving_format ?? null,
    number_of_keys: r.number_of_keys ?? null,
    key_type: r.key_type ?? null,
    key_engraving: r.key_engraving ?? null,
    clochette_included: r.clochette_included ?? null,
    clochette_material: r.clochette_material ?? null,
    missing_lock_value_impact: r.missing_lock_value_impact ?? null,
    authentication_notes: r.authentication_notes ?? null,
    verified: r.verified ?? false,
  }));

  await insertChildRows("provenance_packaging", json.provenance_packaging, (r, variantId) => ({
    variant_id: variantId,
    item_type: r.item_type,
    included_new: r.included_new ?? null,
    description: r.description ?? null,
    material: r.material ?? null,
    color: r.color ?? null,
    branding: r.branding ?? null,
    format_by_year: r.format_by_year ?? null,
    authentication_notes: r.authentication_notes ?? null,
    value_impact_if_missing: r.value_impact_if_missing ?? null,
    verified: r.verified ?? false,
  }));

  await insertChildRows("price_history", json.price_history, (r, variantId) => {
    // date_recorded is NOT NULL with a default; only set it when provided so the
    // default applies instead of inserting an explicit null (which would error).
    const row: Record<string, any> = {
      variant_id: variantId,
      platform: r.platform ?? null,
      condition: r.condition ?? null,
      provenance_completeness: r.provenance_completeness ?? null,
      sale_price: r.sale_price ?? null,
      currency: r.currency ?? null,
      notes: r.notes ?? null,
    };
    if (r.date_recorded) row.date_recorded = r.date_recorded;
    return row;
  });

  for (const { table, count } of childInserts) {
    console.log(`  ${table}: ${count}`);
  }
}

async function main() {
  const files = fs.readdirSync(RESEARCH_DIR).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.error(`No research JSON files found in ${RESEARCH_DIR}`);
    process.exit(1);
  }
  for (const file of files) {
    await loadResearchFile(file);
  }
  console.log(`\nDone — loaded ${files.length} hero style research files.`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
