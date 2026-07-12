/**
 * Retire owner-confirmed SLG styles from the BAG catalog (2026-07-11 taxonomy review).
 *
 * WHY: a full scan of the `style` table with isNonBagAccessory() flagged 20 styles
 * catalogued as bags that read as small leather goods. The owner reviewed each and made
 * the taxonomy call (WOC/chain-carry = bag; fold wallet / flat pouch = SLG; BV "The Pouch"
 * precedent = a pouch CAN be a ranked bag). These 13 are the confirmed SLGs to retire:
 *   wallets           180 Insolite, 183 Sarah, 177 Sarah (LV)
 *   toiletry/cosmetic  694 Toiletry Pouch, 688 Cosmetic Pouch (LV), 744 Cosmetic Case (Chanel),
 *                      763 Vendôme, 764 Jouvence (Goyard)
 *   flat/bill pouches  905 Daily Pouch (LV), 929 Bill Pouch (SL)
 *   line pouches       888 Caro Pouch (Dior), 932 Uptown Pouch, 933 Gaby Pouch (SL)
 *
 * KEPT as bags (owner call, NOT retired): 47/46/536/690 Pochette Accessoires, 59 Multi
 * Pochette (rescued by the hyphen-override fix), 887 Saddle Chain Pouch (chain-carried),
 * 950 Loewe Scarf Bag (a real bag; `scarf` token false positive).
 *
 * SAFETY: identical reversible path to retire-nonbag-styles.ts — every price_history row
 * on these variants is PRESERVED verbatim into discovered_listing (un-promoted,
 * unresolved_reason='non_bag') before deletion, so no historical observation is lost and
 * each row stays re-promotable to the correct bag ([[feedback_historical_price_data]]).
 * brand_guess is looked up PER STYLE (this batch spans LV/Chanel/Goyard/Dior/SL), not
 * hardcoded. Then variants + styles are deleted (FKs are all cascade/set-null) and the
 * price summary MV refreshed.
 *
 * Idempotent: re-running after success is a no-op. DRY RUN by default; pass --write to
 * apply. Guards that EVERY target still fails isNonBagAccessory before touching anything.
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { isNonBagAccessory } from "../../src/lib/ingest/model-normalize";

const WRITE = process.argv.includes("--write");

// Owner-confirmed SLG style_ids to retire (2026-07-11).
const RETIRE_STYLE_IDS = [180, 183, 177, 694, 688, 744, 763, 764, 905, 929, 888, 932, 933];

const refFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop();
  return seg || null;
};

// Supabase types an embedded to-one relation as an object OR a single-element array
// depending on the schema view — normalize both to the brand name.
type BrandEmbed = { name: string } | { name: string }[] | null;
const brandName = (b: BrandEmbed): string | undefined =>
  (Array.isArray(b) ? b[0]?.name : b?.name) || undefined;

async function main() {
  // 0) Re-read styles + brand, confirm each still exists and still fails the bag test.
  const { data: styles } = await db
    .from("style")
    .select("style_id, brand_id, name, brand:brand_id(name)")
    .in("style_id", RETIRE_STYLE_IDS);
  if (!styles?.length) {
    console.log("Nothing to retire — target styles already gone (idempotent no-op).");
    return;
  }
  const brandByStyle = new Map<number, string>();
  console.log("Targets:");
  for (const s of styles) {
    const brand = brandName(s.brand as BrandEmbed) ?? `brand#${s.brand_id}`;
    brandByStyle.set(s.style_id, brand);
    const nonBag = isNonBagAccessory(s.name);
    console.log(`  style ${s.style_id}  [${brand}]  nonBag=${nonBag}  ${s.name}`);
    if (!nonBag) throw new Error(`ABORT: style ${s.style_id} no longer reads as a non-bag SLG ("${s.name}").`);
  }

  // 1) Derive ALL variants for these styles (styles can have >1 variant).
  const { data: variants } = await db
    .from("variant")
    .select("variant_id, style_id")
    .in("style_id", RETIRE_STYLE_IDS);
  const variantIds = (variants ?? []).map((v) => v.variant_id);
  const brandByVariant = new Map<number, string>();
  for (const v of variants ?? []) brandByVariant.set(v.variant_id, brandByStyle.get(v.style_id) ?? "unknown");
  console.log(`\nvariants on these styles: ${variantIds.length}`);

  // 2) Preserve every price_history row on these variants into discovered_listing.
  const { data: ph } = await db
    .from("price_history")
    .select(
      "price_id, variant_id, platform, price_type, sale_price, currency, source_url, listing_ref, condition, colorway, material, hardware_color, production_year, season, observed_on, notes",
    )
    .in("variant_id", variantIds.length ? variantIds : [-1]);
  console.log(`price_history rows on these variants: ${ph?.length ?? 0}`);

  const seen = new Set<string>();
  const preserve = (ph ?? [])
    .map((r) => ({
      platform: r.platform ?? "unknown",
      listing_ref: r.listing_ref ?? refFromUrl(r.source_url) ?? `ph-${r.price_id}`,
      source_url: r.source_url,
      raw_name: r.notes,
      brand_guess: brandByVariant.get(r.variant_id) ?? "unknown",
      price_type: r.price_type ?? "listed",
      sale_price: r.sale_price != null ? Number(r.sale_price) : null,
      currency: r.currency ?? "USD",
      condition: r.condition,
      colorway: r.colorway,
      material: r.material,
      hardware_color: r.hardware_color,
      production_year: r.production_year,
      season: r.season,
      unresolved_reason: "non_bag",
      observed_on: r.observed_on,
    }))
    .filter((d) => d.sale_price != null && d.observed_on)
    .filter((d) => {
      const k = `${d.platform}|${d.listing_ref}|${d.observed_on}|${d.sale_price}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  console.log(`preservable → discovered_listing (deduped): ${preserve.length}`);

  if (!WRITE) {
    console.log("\nDRY RUN — re-run with --write to preserve, delete, and refresh. Plan:");
    console.log(`  • upsert ${preserve.length} row(s) into discovered_listing (un-promoted)`);
    console.log(`  • delete ${ph?.length ?? 0} price_history row(s) on ${variantIds.length} variant(s)`);
    console.log(`  • delete ${variantIds.length} variant(s)`);
    console.log(`  • delete ${styles.length} style(s): ${styles.map((s) => s.style_id).join(", ")}`);
    console.log(`  • refresh variant_price_summary`);
    return;
  }

  // ---- WRITE ----
  if (preserve.length) {
    const { error } = await db
      .from("discovered_listing")
      .upsert(preserve, { onConflict: "platform,listing_ref,observed_on,sale_price", ignoreDuplicates: true });
    if (error) throw new Error(`preserve upsert failed: ${error.message}`);
    console.log(`\npreserved ${preserve.length} row(s) into discovered_listing.`);
  }

  if (variantIds.length) {
    const delPh = await db.from("price_history").delete().in("variant_id", variantIds);
    if (delPh.error) throw new Error(`price_history delete failed: ${delPh.error.message}`);
    console.log(`deleted price_history rows on ${variantIds.length} variant(s).`);

    const delVar = await db.from("variant").delete().in("variant_id", variantIds);
    if (delVar.error) throw new Error(`variant delete failed: ${delVar.error.message}`);
    console.log(`deleted ${variantIds.length} variant(s).`);
  }

  const delStyle = await db.from("style").delete().in("style_id", RETIRE_STYLE_IDS);
  if (delStyle.error) throw new Error(`style delete failed: ${delStyle.error.message}`);
  console.log(`deleted ${styles.length} style(s).`);

  const { error: rErr } = await db.rpc("refresh_variant_price_summary");
  if (rErr) console.warn(`WARN: refresh_variant_price_summary failed: ${rErr.message} (MV may lag).`);
  else console.log("refreshed variant_price_summary.");

  console.log(`\n✅ retired ${styles.length} SLG styles from the bag catalog (evidence preserved in discovered_listing).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
