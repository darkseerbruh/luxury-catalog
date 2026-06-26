/**
 * Owner-greenlit promotion of discovered_listing clusters that need a NEW style
 * (2026-06-26). Companion to promote-safe.ts: that one only promoted clusters whose
 * style ALREADY existed. This one handles clusters where the BRAND exists but the
 * style does not, by CREATING the style (canonical model name from the normalizer),
 * then the size variant, then re-pointing the discovered asking rows into price_history
 * and stamping promoted_variant_id. Clusters whose brand does not exist are skipped
 * (would need a new brand row + tier decision; left out deliberately).
 *
 *   npx tsx supabase/ingest/promote-newstyle.ts [--min=N] [--write]
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

const sizeKey = (s: string | null) => norm(s || "").replace(/[()]/g, "").trim();

// Exclude non-handbag clusters the normalizer mis-grabbed (apparel, footwear,
// accessories) and descriptive non-model names. These must NOT become catalog styles.
const NOT_A_BAG = /\b(t-?shirt|shirt|tee|top|dress|sweatshirt|sweater|blazer|jacket|coat|blouson|cardigan|hoodie|knit|polo|jeans|pant|trouser|skirt|blouse|button-?up|sneaker|sneakers|shoe|boot|loafer|sandal|heel|mule|espadrille|flat|flats|pump|pumps|slingback|slide|slides|ballerina|ballet|belt|scarf|sunglass|sunglasses|glasses|hat|cap|wallet|cardholder|card holder|trousse|make ?up|cosmetic|agenda|cles|kit|wool|cashmere|denim)\b/i;
const DESCRIPTIVE_PREFIX = /^(graphic|vintage|reversible|virgin|leather classic|leather trapeze|leather (medium|large|small)|printed|striped|embroidered|monogram print)\b/i;
// Reject descriptive-soup names: >4 words, a duplicated word, or a colour/finish token
// the normalizer failed to strip (a clean model name does not carry "Black"/"Caviar"/etc.).
const COLOUR_FINISH = /\b(black|white|beige|brown|navy|grey|gray|tan|red|blue|pink|green|caviar|lambskin|quilted|supreme|crop|acero)\b/i;
function isPromotableBag(style: string): boolean {
  const s = style.trim();
  if (NOT_A_BAG.test(s) || DESCRIPTIVE_PREFIX.test(s)) return false;
  const words = s.split(/\s+/);
  if (words.length > 4) return false;                         // descriptive soup
  if (new Set(words.map((w) => w.toLowerCase())).size < words.length) return false; // duplicated word ("Diorissimo Diorissimo")
  if (COLOUR_FINISH.test(s)) return false;                    // unstripped colour/finish
  return true;
}

async function main() {
  console.log(`promote-newstyle: threshold ≥ ${MIN} ${WRITE ? "(WRITE)" : "(DRY RUN)"}`);
  const rows = await loadAllDiscovered();
  const clusters = promotableClusters(rows as DiscoveredRow[], MIN);
  console.log(`Loaded ${rows.length} unpromoted rows; ${clusters.length} promotable clusters (≥${MIN}).`);

  const { data: brands } = await db.from("brand").select("brand_id,name");
  const brandByNorm = new Map<string, number>();
  (brands ?? []).forEach((b: any) => brandByNorm.set(norm(normalizeDesigner(b.name)), b.brand_id));
  const { data: styles } = await db.from("style").select("style_id,brand_id,name");
  const styleByKey = new Map<string, number>();
  (styles ?? []).forEach((s: any) => styleByKey.set(`${s.brand_id}|${norm(s.name)}`, s.style_id));

  // group discovered rows by cluster key for re-pointing
  const byKey = new Map<string, any[]>();
  for (const r of rows as any[]) {
    const bId = brandByNorm.get(norm(normalizeDesigner(r.brand_guess)));
    const k = `${bId ?? "?"}|${norm(r.style_guess || "")}|${sizeKey(r.size_label)}`;
    (byKey.get(k) ?? byKey.set(k, []).get(k))!.push(r);
  }

  // keep only clusters whose brand exists but style does NOT
  type P = { brand: string; brandId: number; style: string; size: string; count: number; cluster: any };
  const plan: P[] = [];
  let noBrand = 0; const excluded: string[] = [];
  for (const c of clusters) {
    const bId = brandByNorm.get(norm(normalizeDesigner(c.brandGuess)));
    if (!bId) { noBrand++; continue; }
    if (styleByKey.has(`${bId}|${norm(c.styleGuess)}`)) continue; // already exists -> promote-safe handles it
    if (!isPromotableBag(c.styleGuess)) { excluded.push(`${c.brandGuess} ${c.styleGuess}`); continue; }
    plan.push({ brand: c.brandGuess, brandId: bId, style: c.styleGuess, size: c.sizeLabel || "Standard", count: c.count, cluster: c });
  }
  if (excluded.length) console.log(`\nExcluded (not a handbag / descriptive name): ${excluded.length}\n  ${excluded.join("\n  ")}`);
  const distinctStyles = new Set(plan.map((p) => `${p.brandId}|${norm(p.style)}`));
  console.log(`\nNEW-STYLE clusters to promote: ${plan.length} (across ${distinctStyles.size} new styles)`);
  console.log(`Skipped (brand does not exist, would need a new brand): ${noBrand}\n`);
  plan.sort((a, b) => b.count - a.count).forEach((p) =>
    console.log(`  ${p.brand} ${p.style} ${p.size}  → ${p.count} rows`));

  if (!WRITE) { console.log(`\nDRY RUN — re-run with --write to persist.`); return; }

  const today = new Date().toISOString().slice(0, 10);
  const styleCache = new Map<string, number>(); // brandId|normStyle -> styleId (created this run)
  let createdStyles = 0, createdVariants = 0, insertedRows = 0, markedPromoted = 0;

  for (const p of plan) {
    const skey = `${p.brandId}|${norm(p.style)}`;
    let styleId = styleCache.get(skey) ?? styleByKey.get(skey);
    if (!styleId) {
      const { data: ins, error } = await db.from("style").insert({ brand_id: p.brandId, name: p.style }).select("style_id").single();
      if (error) { console.error(`style create failed ${p.brand} ${p.style}:`, error.message); continue; }
      styleId = ins!.style_id; styleCache.set(skey, styleId); createdStyles++;
    }
    // find-or-create variant
    const { data: existingVars } = await db.from("variant").select("variant_id,size_label").eq("style_id", styleId);
    let variantId = (existingVars ?? []).find((v: any) => sizeKey(v.size_label) === sizeKey(p.size))?.variant_id;
    if (!variantId) {
      const { data: vi, error } = await db.from("variant").insert({ style_id: styleId, size_label: p.size, market_availability: "resale" }).select("variant_id").single();
      if (error) { console.error(`variant create failed ${p.brand} ${p.style} ${p.size}:`, error.message); continue; }
      variantId = vi!.variant_id; createdVariants++;
    }
    const members = byKey.get(`${p.brandId}|${norm(p.style)}|${sizeKey(p.cluster.sizeLabel)}`) ?? [];
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
    const ids = members.map((m) => m.discovered_id);
    for (let i = 0; i < ids.length; i += 500) {
      await db.from("discovered_listing").update({ promoted_variant_id: variantId, promoted_at: new Date().toISOString() }).in("discovered_id", ids.slice(i, i + 500));
    }
    markedPromoted += ids.length;
    console.log(`  ✓ ${p.brand} ${p.style} ${p.size} (style ${styleId}, v${variantId}): +${toInsert.length} prices, ${ids.length} marked`);
  }
  console.log(`\nDone. styles created: ${createdStyles}, variants created: ${createdVariants}, price rows inserted: ${insertedRows}, discovered marked: ${markedPromoted}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
