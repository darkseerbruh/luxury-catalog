/**
 * Re-triage The Luxury Closet price_history rows whose listing title no longer
 * resolves to the style they sit on. Root cause (2026-07-09): bare "timeless" in
 * the Chanel dictionary filed TLC's whole "Timeless" classic line (handcuff
 * clutches, shopping totes, pochette phone cases) under Classic Flap, so wrong
 * bags won the affiliate hero/card photo and polluted the comps.
 *
 * For each TLC row we rebuild the title from the source_url slug, recompute
 * canonicalModel with the FIXED dictionary, and compare to the row's style:
 *   match      -> keep
 *   mismatch   -> preserve as evidence in discovered_listing (style_guess = the
 *                 recomputed model, promotion pass re-places it), then delete the
 *                 price_history row.
 *
 *   npx tsx supabase/ingest/clean-timeless-mismap.ts                    # report only
 *   npx tsx supabase/ingest/clean-timeless-mismap.ts --write            # apply
 *   npx tsx supabase/ingest/clean-timeless-mismap.ts --brand Chanel     # scope to one brand
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { canonicalModel } from "../../src/lib/ingest/model-normalize";

const PLATFORM = "The Luxury Closet";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** ".../women/chanel-timeless-handcuff-...-clutch-p1320677" -> "chanel timeless handcuff ... clutch" */
function titleFromUrl(url: string | null): string | null {
  if (!url) return null;
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  const slug = seg.replace(/-p\d+$/i, "");
  if (!slug) return null;
  return slug.replace(/-/g, " ").trim() || null;
}

interface PhRow {
  price_id: number;
  variant_id: number;
  listing_ref: string | null;
  source_url: string | null;
  sale_price: number | null;
  currency: string | null;
  price_type: string | null;
  condition: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
  production_year: number | null;
  season: string | null;
  observed_on: string | null;
  listing_status: string | null;
}

async function fetchAllTlcRows(): Promise<PhRow[]> {
  // PostgREST caps every response at 1000 rows regardless of .limit() — page it.
  const out: PhRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("price_history")
      .select(
        "price_id, variant_id, listing_ref, source_url, sale_price, currency, price_type, condition, colorway, material, hardware_color, production_year, season, observed_on, listing_status",
      )
      .eq("platform", PLATFORM)
      .order("price_id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`price_history page failed: ${error.message}`);
    out.push(...((data ?? []) as PhRow[]));
    if (!data || data.length < PAGE) return out;
  }
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const brandIdx = process.argv.indexOf("--brand");
  const brandFilter = brandIdx >= 0 ? process.argv[brandIdx + 1] : null;

  const rows = await fetchAllTlcRows();
  console.log(`[timeless-mismap] scanning ${rows.length} "${PLATFORM}" price_history row(s)`);

  // variant -> (style name, brand name)
  const vids = [...new Set(rows.map((r) => r.variant_id))];
  const vMeta = new Map<number, { style: string; brand: string }>();
  for (let i = 0; i < vids.length; i += 500) {
    const { data: vs, error } = await sb
      .from("variant")
      .select("variant_id, style:style_id(name, brand:brand_id(name))")
      .in("variant_id", vids.slice(i, i + 500));
    if (error) throw new Error(`variant lookup failed: ${error.message}`);
    for (const v of (vs ?? []) as unknown as {
      variant_id: number;
      style: { name: string; brand: { name: string } | null } | null;
    }[]) {
      if (v.style) vMeta.set(v.variant_id, { style: v.style.name, brand: v.style.brand?.name ?? "" });
    }
  }

  // Accent/suffix-tolerant name equality ("Bride-à-Brac" == "Bride-a-Brac",
  // "Diana Flap Bag" ~ "Diana") so formatting drift between the dictionary and the
  // catalog style names never counts as a mis-map.
  const norm = (s: string | null) =>
    (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const sameModel = (styleName: string, recomputed: string | null) => {
    if (recomputed == null) return false;
    const a = norm(styleName);
    const b = norm(recomputed);
    return a === b || a.includes(b) || b.includes(a);
  };

  const mismapped: (PhRow & { title: string; styleName: string; brandName: string; recomputed: string | null })[] = [];
  let unparsable = 0;
  for (const r of rows) {
    const meta = vMeta.get(r.variant_id);
    if (!meta) continue;
    if (brandFilter && meta.brand !== brandFilter) continue;
    const title = titleFromUrl(r.source_url);
    if (!title) {
      unparsable++;
      continue;
    }
    // Scope = today's incident: rows that exist because bare "timeless" matched.
    // Slug reconstruction is lossy ("d-lite" -> "d lite"), so a general
    // recompute-everything sweep over-flags — keep this surgical.
    if (!title.includes("timeless")) continue;
    const recomputed = canonicalModel(meta.brand, title);
    if (!sameModel(meta.style, recomputed)) {
      mismapped.push({ ...r, title, styleName: meta.style, brandName: meta.brand, recomputed });
    }
  }

  // Report: what sits where it shouldn't, grouped by (style it's on -> what it really is).
  const byGroup = new Map<string, number>();
  for (const m of mismapped) {
    const k = `${m.brandName} ${m.styleName}  <-  ${m.recomputed ?? "(no model: SLG/unknown)"}`;
    byGroup.set(k, (byGroup.get(k) ?? 0) + 1);
  }
  console.log(`[timeless-mismap] ${mismapped.length} mis-mapped row(s), ${unparsable} unparsable URL(s) skipped`);
  for (const [k, n] of [...byGroup.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${k}`);
  if (mismapped.length > 0) {
    console.log("  examples:");
    for (const m of mismapped.slice(0, 8)) console.log(`    #${m.price_id} [${m.styleName}] "${m.title}"`);
  }

  if (!write) {
    console.log("[timeless-mismap] DRY RUN — pass --write to move these to discovered_listing.");
    return;
  }

  // Preserve as raw evidence first, then delete. Upsert dedupes on the
  // (platform, listing_ref, observed_on, sale_price) unique index.
  const discovered = mismapped
    .filter((m) => m.listing_ref && m.sale_price != null && m.observed_on)
    .map((m) => ({
      platform: PLATFORM,
      listing_ref: m.listing_ref as string,
      source_url: m.source_url,
      raw_name: m.title,
      brand_guess: m.brandName,
      style_guess: m.recomputed,
      colorway: m.colorway,
      material: m.material,
      hardware_color: m.hardware_color,
      production_year: m.production_year,
      season: m.season,
      price_type: m.price_type ?? "listed",
      sale_price: m.sale_price as number,
      currency: m.currency ?? "USD",
      condition: m.condition,
      unresolved_reason: "no_style",
      observed_on: m.observed_on as string,
    }));
  // Same composite key can repeat across mismapped rows (re-observations) — keep one.
  const seen = new Set<string>();
  const deduped = discovered.filter((d) => {
    const k = `${d.listing_ref}|${d.observed_on}|${d.sale_price}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  for (let i = 0; i < deduped.length; i += 500) {
    const { error } = await sb.from("discovered_listing").upsert(deduped.slice(i, i + 500), {
      onConflict: "platform,listing_ref,observed_on,sale_price",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(`discovered_listing upsert failed: ${error.message}`);
  }
  console.log(`[timeless-mismap] preserved ${deduped.length} row(s) in discovered_listing.`);

  const ids = mismapped.map((m) => m.price_id);
  for (let i = 0; i < ids.length; i += 500) {
    const { error } = await sb.from("price_history").delete().in("price_id", ids.slice(i, i + 500));
    if (error) throw new Error(`price_history delete failed: ${error.message}`);
  }
  console.log(`[timeless-mismap] deleted ${ids.length} mis-mapped price_history row(s).`);
}

main().catch((e) => {
  console.error("[timeless-mismap] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
