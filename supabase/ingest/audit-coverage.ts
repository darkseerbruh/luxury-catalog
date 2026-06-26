import { supabaseAdmin as db } from "../seed/lib/client";

async function main() {
  // status distribution
  const statuses: Record<string, number> = {};
  const ptypes: Record<string, number> = {};
  let from = 0;
  for (;;) {
    const { data, error } = await db.from("price_history").select("listing_status,price_type").range(from, from + 999);
    if (error) { console.log("ph err", error.message); break; }
    if (!data || data.length === 0) break;
    data.forEach((r: any) => {
      const s = r.listing_status ?? "(null)"; statuses[s] = (statuses[s] ?? 0) + 1;
      const p = r.price_type ?? "(null)"; ptypes[p] = (ptypes[p] ?? 0) + 1;
    });
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log("listing_status dist:", statuses);
  console.log("price_type dist:", ptypes);

  const { data: brands, error: berr } = await db.from("brand").select("brand_id,name").order("name");
  console.log("brand query err:", berr?.message, "count:", brands?.length);

  // Build variant_id -> brand map once by paginating variant+style+brand
  // styles
  const styleBrand: Record<string, string> = {};
  let f = 0;
  for (;;) {
    const { data } = await db.from("style").select("style_id,brand_id").range(f, f + 999);
    if (!data || data.length === 0) break;
    data.forEach((s: any) => { styleBrand[s.style_id] = s.brand_id; });
    if (data.length < 1000) break; f += 1000;
  }
  const brandName: Record<string, string> = {};
  (brands ?? []).forEach((b: any) => { brandName[b.brand_id] = b.name; });

  const variantBrand: Record<string, string> = {};
  f = 0;
  for (;;) {
    const { data } = await db.from("variant").select("variant_id,style_id").range(f, f + 999);
    if (!data || data.length === 0) break;
    data.forEach((v: any) => { const bid = styleBrand[v.style_id]; if (bid) variantBrand[v.variant_id] = brandName[bid] ?? "(unknown)"; });
    if (data.length < 1000) break; f += 1000;
  }
  console.log("total variants mapped:", Object.keys(variantBrand).length);

  // Now paginate price_history listed rows and tally by brand + priced variant set
  const brandRows: Record<string, number> = {};
  const brandVariants: Record<string, Set<string>> = {};
  f = 0;
  for (;;) {
    const { data } = await db.from("price_history").select("variant_id,price_type,listing_status").eq("price_type", "listed").range(f, f + 999);
    if (!data || data.length === 0) break;
    data.forEach((r: any) => {
      const bn = variantBrand[r.variant_id] ?? "(unmapped)";
      brandRows[bn] = (brandRows[bn] ?? 0) + 1;
      (brandVariants[bn] ??= new Set()).add(r.variant_id);
    });
    if (data.length < 1000) break; f += 1000;
  }
  console.log("\n=== LISTED rows per brand (curated price_history) ===");
  Object.entries(brandRows).sort((a, b) => b[1] - a[1]).forEach(([k, n]) =>
    console.log(`  ${k}: rows=${n} priced_variants=${brandVariants[k].size}`));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
