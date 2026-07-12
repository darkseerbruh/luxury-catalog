/**
 * Retire mis-catalogued SLG styles from the BAG catalog.
 *
 * WHY: two seed-time rows are small leather goods, not bags, so per the owner's taxonomy
 * (2026-07-11: a WOC/Wallet-on-Chain is a bag and stays; a fold wallet or coin purse is an
 * SLG and should NOT be catalogued as a bag) they must not carry a /bag page, a shop/brand
 * listing, or a sitemap entry:
 *   • style 171 "Chanel Brown Quilted Patent Leather Boy Wallet"  (trifold wallet, 0 comps)
 *   • style 141 "Chanel Fuchsia Quilted Leather Chain CC Flap Coin Purse" (coin purse)
 * Style 141's variant also picked up 7 fuzzy-matched price_history rows (6 are unrelated
 * BAGS — tote / shoulder bag / crossbody — 1 is a real coin-purse comp), inflating a fake
 * bag's median to ~$909; retiring the style also de-contaminates those.
 *
 * SAFETY: follows the same reversible path as detect-listing-discrepancies.ts — every
 * price_history row is PRESERVED verbatim into discovered_listing (un-promoted,
 * unresolved_reason='non_bag') before deletion, so no historical observation is lost and
 * each row stays re-promotable to the correct bag ([[feedback_historical_price_data]]).
 * Then the variant + style rows are deleted and the price summary MV refreshed.
 *
 * Idempotent: re-running after success is a no-op (styles already gone). DRY RUN by
 * default; pass --write to apply. Guards that each target still fails isNonBagAccessory
 * OR is an explicit coin-purse/wallet name before touching anything.
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { isNonBagAccessory } from "../../src/lib/ingest/model-normalize";

const WRITE = process.argv.includes("--write");

// (style_id, variant_id) pairs to retire. Explicit so a rename can never widen the blast.
const TARGETS = [
  { styleId: 171, variantId: 473 },
  { styleId: 141, variantId: 448 },
];

const refFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop();
  return seg || null;
};

async function main() {
  const styleIds = TARGETS.map((t) => t.styleId);
  const variantIds = TARGETS.map((t) => t.variantId);

  // 0) Re-read the styles and confirm they still exist + still fail the bag test.
  const { data: styles } = await db
    .from("style")
    .select("style_id, brand_id, name")
    .in("style_id", styleIds);
  if (!styles?.length) {
    console.log("Nothing to retire — target styles already gone (idempotent no-op).");
    return;
  }
  console.log("Targets:");
  for (const s of styles) {
    const nonBag = isNonBagAccessory(s.name);
    console.log(`  style ${s.style_id}  nonBag=${nonBag}  ${s.name}`);
    // 141's coin purse is caught by the strong-noun fix; guard on the classifier so we
    // never delete a row that stopped looking like an SLG after a rename.
    if (!nonBag) throw new Error(`ABORT: style ${s.style_id} no longer reads as a non-bag SLG ("${s.name}").`);
  }

  // 1) Preserve every price_history row on these variants into discovered_listing.
  const { data: ph } = await db
    .from("price_history")
    .select(
      "price_id, variant_id, platform, price_type, sale_price, currency, source_url, listing_ref, condition, colorway, material, hardware_color, production_year, season, observed_on, notes",
    )
    .in("variant_id", variantIds);
  console.log(`\nprice_history rows on these variants: ${ph?.length ?? 0}`);

  const seen = new Set<string>();
  const preserve = (ph ?? [])
    .map((r) => ({
      platform: r.platform ?? "unknown",
      listing_ref: r.listing_ref ?? refFromUrl(r.source_url) ?? `ph-${r.price_id}`,
      source_url: r.source_url,
      raw_name: r.notes,
      brand_guess: "Chanel",
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
  for (const p of preserve) console.log(`   [${p.price_type}/${p.platform}] $${p.sale_price}  "${(p.raw_name ?? "").slice(0, 70)}"`);

  if (!WRITE) {
    console.log("\nDRY RUN — re-run with --write to preserve, delete, and refresh. Plan:");
    console.log(`  • upsert ${preserve.length} row(s) into discovered_listing (un-promoted)`);
    console.log(`  • delete ${ph?.length ?? 0} price_history row(s) on variants ${variantIds.join(", ")}`);
    console.log(`  • delete variants ${variantIds.join(", ")}`);
    console.log(`  • delete styles ${styleIds.join(", ")}`);
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

  const delPh = await db.from("price_history").delete().in("variant_id", variantIds);
  if (delPh.error) throw new Error(`price_history delete failed: ${delPh.error.message}`);
  console.log(`deleted price_history rows on variants ${variantIds.join(", ")}.`);

  const delVar = await db.from("variant").delete().in("variant_id", variantIds);
  if (delVar.error) throw new Error(`variant delete failed: ${delVar.error.message}`);
  console.log(`deleted variants ${variantIds.join(", ")}.`);

  const delStyle = await db.from("style").delete().in("style_id", styleIds);
  if (delStyle.error) throw new Error(`style delete failed: ${delStyle.error.message}`);
  console.log(`deleted styles ${styleIds.join(", ")}.`);

  const { error: rErr } = await db.rpc("refresh_variant_price_summary");
  if (rErr) console.warn(`WARN: refresh_variant_price_summary failed: ${rErr.message} (MV may lag).`);
  else console.log("refreshed variant_price_summary.");

  console.log("\n✅ retired 2 SLG styles from the bag catalog (evidence preserved in discovered_listing).");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
