/**
 * SAFE scoped promotion of discovered_listing -> curated catalog.
 *
 * Unlike the owner-gated mass promoter (promote-discovered.ts, which would mass-CREATE
 * brand-new style rows), this pass ONLY promotes clusters whose (brand, normalized style)
 * ALREADY EXISTS as a curated style. It then find-or-creates the SIZE VARIANT under that
 * clean existing style, re-points the cluster's discovered asking rows into price_history,
 * and stamps discovered_listing.promoted_variant_id. No new style rows = minimal catalog
 * pollution risk (the path the handoff recommended running first).
 *
 *   npx tsx supabase/ingest/promote-safe.ts [--min=N] [--write]
 *     --min=N   cluster-size threshold (default 20)
 *     --write   actually persist (else dry-run plan)
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm, normalizeDesigner } from "../../src/lib/image-import-core";
import { promotableClusters, type DiscoveredRow } from "./promote-discovered";

const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=20").split("=")[1]);
const WRITE = process.argv.includes("--write");

async function loadAllDiscovered(): Promise<(DiscoveredRow & Record<string, unknown>)[]> {
  const out: any[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("discovered_listing")
      .select("discovered_id,platform,listing_ref,source_url,brand_guess,style_guess,size_label,colorway,material,hardware_color,production_year,season,condition,price_type,sale_price,currency,observed_on,promoted_variant_id")
      .is("promoted_variant_id", null)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return out;
}

function sizeKey(s: string | null): string {
  return norm(s || "").replace(/[()]/g, "").trim();
}

async function main() {
  console.log(`promote-safe: threshold ≥ ${MIN} ${WRITE ? "(WRITE)" : "(DRY RUN)"}`);
  const rows = await loadAllDiscovered();
  console.log(`Loaded ${rows.length} unpromoted discovered rows.`);
  const clusters = promotableClusters(rows as DiscoveredRow[], MIN);
  console.log(`${clusters.length} promotable clusters (≥${MIN}).`);

  // index brands + styles
  const { data: brands } = await db.from("brand").select("brand_id,name");
  const brandByNorm = new Map<string, number>();
  (brands ?? []).forEach((b: any) => brandByNorm.set(norm(normalizeDesigner(b.name)), b.brand_id));
  const { data: styles } = await db.from("style").select("style_id,brand_id,name");
  const styleByKey = new Map<string, number>(); // `${brand_id}|${normStyle}` -> style_id
  (styles ?? []).forEach((s: any) => styleByKey.set(`${s.brand_id}|${norm(s.name)}`, s.style_id));

  // group discovered rows by cluster key for re-pointing
  const byKey = new Map<string, any[]>();
  for (const r of rows as any[]) {
    const bId = brandByNorm.get(norm(normalizeDesigner(r.brand_guess)));
    const k = `${bId ?? "?"}|${norm(r.style_guess || "")}|${sizeKey(r.size_label)}`;
    (byKey.get(k) ?? byKey.set(k, []).get(k))!.push(r);
  }

  let promotableExisting = 0, needNewStyle = 0, rowsToRepoint = 0;
  const plan: { brand: string; style: string; size: string; styleId: number; count: number; cluster: any }[] = [];
  for (const c of clusters) {
    const bId = brandByNorm.get(norm(normalizeDesigner(c.brandGuess)));
    if (!bId) { needNewStyle++; continue; }
    const styleId = styleByKey.get(`${bId}|${norm(c.styleGuess)}`);
    if (!styleId) { needNewStyle++; continue; }
    promotableExisting++;
    const k = `${bId}|${norm(c.styleGuess)}|${sizeKey(c.sizeLabel)}`;
    const members = byKey.get(k) ?? [];
    rowsToRepoint += members.length;
    plan.push({ brand: c.brandGuess, style: c.styleGuess, size: c.sizeLabel || "Standard", styleId, count: members.length, cluster: c });
  }

  console.log(`\nClusters mapping to EXISTING style (safe to promote): ${promotableExisting}`);
  console.log(`Clusters needing a NEW style (deferred to owner): ${needNewStyle}`);
  console.log(`Asking rows that would re-point into price_history: ${rowsToRepoint}\n`);
  plan.sort((a, b) => b.count - a.count).slice(0, 60).forEach((p) =>
    console.log(`  ${p.brand} ${p.style} ${p.size}  (style ${p.styleId})  → ${p.count} rows`));

  if (!WRITE) { console.log(`\nDRY RUN — re-run with --write to persist.`); return; }

  const today = new Date().toISOString().slice(0, 10);
  let createdVariants = 0, insertedRows = 0, markedPromoted = 0;
  for (const p of plan) {
    const sizeLabel = p.size;
    // find-or-create variant by (style_id, size_label)
    const { data: existingVars } = await db.from("variant").select("variant_id,size_label").eq("style_id", p.styleId);
    let variantId = (existingVars ?? []).find((v: any) => sizeKey(v.size_label) === sizeKey(sizeLabel))?.variant_id;
    if (!variantId) {
      const { data: ins, error } = await db.from("variant").insert({ style_id: p.styleId, size_label: sizeLabel, market_availability: "resale" }).select("variant_id").single();
      if (error) { console.error(`variant create failed for ${p.brand} ${p.style} ${sizeLabel}:`, error.message); continue; }
      variantId = ins!.variant_id; createdVariants++;
    }
    const members = byKey.get(`${brandByNorm.get(norm(normalizeDesigner(p.brand)))}|${norm(p.style)}|${sizeKey(p.cluster.sizeLabel)}`) ?? [];
    // existing price_history listing_refs for this variant to dedup
    const { data: existRefs } = await db.from("price_history").select("listing_ref").eq("variant_id", variantId);
    const seen = new Set((existRefs ?? []).map((r: any) => r.listing_ref));
    const toInsert = members.filter((m) => !seen.has(m.listing_ref)).map((m) => ({
      variant_id: variantId, platform: m.platform, price_type: m.price_type || "listed",
      sale_price: m.sale_price, currency: m.currency || "USD",
      listing_status: (m.price_type === "sold") ? "sold" : "available",
      listing_ref: m.listing_ref, source_url: m.source_url, observed_on: m.observed_on,
      date_recorded: today, confidence_level: "medium",
      colorway: m.colorway, material: m.material, hardware_color: m.hardware_color,
      production_year: m.production_year, season: m.season, condition: m.condition,
    }));
    for (let i = 0; i < toInsert.length; i += 500) {
      const { error } = await db.from("price_history").insert(toInsert.slice(i, i + 500));
      if (error) { console.error(`insert failed ${p.brand} ${p.style}:`, error.message); break; }
    }
    insertedRows += toInsert.length;
    // mark discovered rows promoted
    const ids = members.map((m) => m.discovered_id);
    for (let i = 0; i < ids.length; i += 500) {
      await db.from("discovered_listing").update({ promoted_variant_id: variantId, promoted_at: new Date().toISOString() }).in("discovered_id", ids.slice(i, i + 500));
    }
    markedPromoted += ids.length;
    console.log(`  ✓ ${p.brand} ${p.style} ${sizeLabel} (v${variantId}): +${toInsert.length} prices, ${ids.length} marked`);
  }
  console.log(`\nDone. variants created: ${createdVariants}, price rows inserted: ${insertedRows}, discovered marked: ${markedPromoted}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
