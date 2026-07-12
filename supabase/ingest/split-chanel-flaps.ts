/**
 * Split the over-lumped Chanel "Classic Flap" into house-accurate styles (owner decision
 * 2026-07-11, archivist-sourced). The Classic Flap (the "11.12") is the structured DOUBLE
 * flap; only Small / Medium / Jumbo / Maxi belong to it. The single-flap minis and the
 * discontinued East-West are DIFFERENT bags that were confusingly nested under it.
 *
 * Plan:
 *   • Classic Flap (style 1): keep the four double sizes. Fold "Large" → "Jumbo" (same bag,
 *     Chanel's retail word vs resale's), and split the redundant plain "Mini" catch-all into
 *     the two real shapes by title.
 *   • New single-flap styles (their own pages): Mini Rectangular Flap, Mini Square Flap,
 *     Micro Mini Flap, East-West Flap (discontinued 2010). The existing variants move over.
 *   • style_family = 'Chanel Flap' on all of them, so the bag-page family module can query
 *     siblings; discontinued flags where they apply.
 *
 * Reversible: variant moves are `style_id` updates (rows follow their variant), the plain-
 * Mini + Large row moves update `variant_id`, and the full before→after map is printed.
 *
 *   npx tsx supabase/ingest/split-chanel-flaps.ts            # DRY RUN (plan only)
 *   npx tsx supabase/ingest/split-chanel-flaps.ts --write    # apply
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const CLASSIC_FLAP_STYLE_ID = 1;
const FAMILY = "Chanel Flap";

// Existing single-size Classic-Flap variants (by size_label) → the standalone style they move to.
const NEW_STYLES: { name: string; discontinued?: number; sizeLabels: string[]; note: string }[] = [
  { name: "Mini Rectangular Flap", sizeLabels: ["Mini (Rectangular)"], note: "single flap, permanent" },
  { name: "Mini Square Flap", sizeLabels: ["Mini (Square)"], note: "single flap, permanent" },
  { name: "Micro Mini Flap", sizeLabels: ["Micro"], note: "single flap, smallest" },
  { name: "East-West Flap", discontinued: 2010, sizeLabels: ["East-West"], note: "single flap, discontinued 2010" },
];

interface StyleRow { style_id: number; brand_id: number; name: string }
interface VariantRow { variant_id: number; size_label: string | null; style_id: number }

async function getChanelBrandId(): Promise<number> {
  const { data, error } = await db.from("brand").select("brand_id").eq("name", "Chanel").limit(1);
  if (error) throw new Error(`brand read: ${error.message}`);
  if (!data?.[0]) throw new Error("Chanel brand not found");
  return data[0].brand_id as number;
}

async function classicVariants(): Promise<VariantRow[]> {
  const { data, error } = await db.from("variant").select("variant_id, size_label, style_id").eq("style_id", CLASSIC_FLAP_STYLE_ID);
  if (error) throw new Error(`variant read: ${error.message}`);
  return (data ?? []) as VariantRow[];
}

async function findStyle(brandId: number, name: string): Promise<StyleRow | null> {
  const { data } = await db.from("style").select("style_id, brand_id, name").eq("brand_id", brandId).eq("name", name).limit(1);
  return (data?.[0] as StyleRow) ?? null;
}

/** Route plain-"Mini" price rows to the Rectangular vs Square variant by title/slug. */
function miniShape(notes: string | null, url: string | null): "rectangular" | "square" | "unspecified" {
  const t = `${notes ?? ""} ${url ?? ""}`.toLowerCase().replace(/[-_]/g, " ");
  if (t.includes("rectangular")) return "rectangular";
  if (t.includes("square")) return "square";
  return "unspecified"; // bare "Mini Flap" is the Rectangular in Chanel's own naming
}

async function main() {
  console.log(`split-chanel-flaps: ${WRITE ? "WRITE" : "DRY RUN"}\n`);
  const brandId = await getChanelBrandId();
  const variants = await classicVariants();
  const bySize = new Map<string, VariantRow>();
  for (const v of variants) if (v.size_label) bySize.set(v.size_label, v);

  console.log(`Chanel brand ${brandId}; Classic Flap has ${variants.length} variants: ${variants.map((v) => `${v.size_label}(v${v.variant_id})`).join(", ")}\n`);

  // 1) New standalone styles + the variant that moves into each.
  console.log("── New styles (variant moves) ──");
  for (const s of NEW_STYLES) {
    const vs = s.sizeLabels.map((l) => bySize.get(l)).filter(Boolean) as VariantRow[];
    const existing = await findStyle(brandId, s.name);
    console.log(`  "${s.name}"${s.discontinued ? ` [disc ${s.discontinued}]` : ""} ${existing ? `(exists #${existing.style_id})` : "(CREATE)"} ← ${vs.map((v) => `${v.size_label} v${v.variant_id}`).join(", ") || "(no source variant!)"}`);
  }

  // 2) Fold Large → Jumbo (row move + delete variant).
  const large = bySize.get("Large");
  const jumbo = bySize.get("Jumbo");
  let largeRows = 0;
  if (large && jumbo) {
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", large.variant_id);
    largeRows = count ?? 0;
    console.log(`\n── Fold Large v${large.variant_id} → Jumbo v${jumbo.variant_id}: move ${largeRows} row(s), delete Large variant ──`);
  }

  // 3) Split plain "Mini" catch-all by title.
  const plainMini = bySize.get("Mini");
  const rect = bySize.get("Mini (Rectangular)");
  const square = bySize.get("Mini (Square)");
  const miniPlan = { rectangular: 0, square: 0, unspecified: 0 };
  const miniMoves: { price_id: number; to: number }[] = [];
  if (plainMini && rect && square) {
    const rows = await pageAll<{ price_id: number; notes: string | null; source_url: string | null }>(
      "price_history",
      "price_id, notes, source_url",
      (q) => q.eq("variant_id", plainMini.variant_id),
    );
    for (const r of rows) {
      const shape = miniShape(r.notes, r.source_url);
      miniPlan[shape]++;
      miniMoves.push({ price_id: r.price_id, to: shape === "square" ? square.variant_id : rect.variant_id });
    }
    console.log(`\n── Split plain "Mini" v${plainMini.variant_id} (${rows.length} rows) ──`);
    console.log(`     rectangular → v${rect.variant_id}: ${miniPlan.rectangular}   square → v${square.variant_id}: ${miniPlan.square}   unspecified → Rectangular v${rect.variant_id}: ${miniPlan.unspecified}`);
    console.log(`     then delete the empty plain-Mini variant`);
  }

  console.log(`\nClassic Flap KEEPS: ${["Small", "Medium (M/L)", "Jumbo", "Maxi"].filter((l) => bySize.get(l)).map((l) => `${l} v${bySize.get(l)!.variant_id}`).join(", ")}`);
  console.log(`(untouched catch-alls: ${variants.filter((v) => !v.size_label || v.size_label === "Standard").map((v) => `${v.size_label} v${v.variant_id}`).join(", ") || "none"})`);

  if (!WRITE) {
    console.log(`\nDRY RUN — re-run with --write to create ${NEW_STYLES.length} styles, move ${NEW_STYLES.reduce((n, s) => n + s.sizeLabels.length, 0)} variants, re-route ${miniMoves.length} plain-Mini + ${largeRows} Large rows, set style_family='${FAMILY}'.`);
    return;
  }

  // ── WRITE ──
  // Set the family on Classic Flap itself.
  await db.from("style").update({ style_family: FAMILY }).eq("style_id", CLASSIC_FLAP_STYLE_ID);

  // (a) Create/find each new style and move its variant(s) over.
  for (const s of NEW_STYLES) {
    let style = await findStyle(brandId, s.name);
    if (!style) {
      const { data, error } = await db
        .from("style")
        .insert({
          brand_id: brandId,
          name: s.name,
          style_family: FAMILY,
          closure_type: "CC turnlock",
          discontinued: s.discontinued != null,
          year_discontinued: s.discontinued ?? null,
        })
        .select("style_id, brand_id, name")
        .single();
      if (error) throw new Error(`create style ${s.name}: ${error.message}`);
      style = data as StyleRow;
      console.log(`created style "${s.name}" #${style.style_id}`);
    } else {
      await db.from("style").update({ style_family: FAMILY }).eq("style_id", style.style_id);
    }
    for (const label of s.sizeLabels) {
      const v = bySize.get(label);
      if (!v) continue;
      const { error } = await db.from("variant").update({ style_id: style.style_id }).eq("variant_id", v.variant_id);
      if (error) throw new Error(`move variant v${v.variant_id}: ${error.message}`);
      console.log(`  moved v${v.variant_id} (${label}) → "${s.name}"`);
    }
  }

  // (b) Split plain Mini rows, then delete the empty variant.
  if (plainMini && miniMoves.length) {
    const byTarget = new Map<number, number[]>();
    for (const m of miniMoves) (byTarget.get(m.to) ?? byTarget.set(m.to, []).get(m.to)!).push(m.price_id);
    for (const [to, ids] of byTarget) {
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await db.from("price_history").update({ variant_id: to }).in("price_id", ids.slice(i, i + 200));
        if (error) {
          if (error.code === "23505") { for (const pid of ids.slice(i, i + 200)) await db.from("price_history").update({ variant_id: to }).eq("price_id", pid).then(() => {}, () => {}); }
          else throw new Error(`plain-mini move: ${error.message}`);
        }
      }
    }
    await db.from("variant").delete().eq("variant_id", plainMini.variant_id);
    console.log(`split plain Mini (${miniMoves.length} rows) + deleted variant v${plainMini.variant_id}`);
  }

  // (c) Fold Large → Jumbo, delete Large variant.
  if (large && jumbo) {
    const ids = (await pageAll<{ price_id: number }>("price_history", "price_id", (q) => q.eq("variant_id", large.variant_id))).map((r) => r.price_id);
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await db.from("price_history").update({ variant_id: jumbo.variant_id }).in("price_id", ids.slice(i, i + 200));
      if (error && error.code !== "23505") throw new Error(`large fold: ${error.message}`);
    }
    await db.from("variant").delete().eq("variant_id", large.variant_id);
    console.log(`folded Large (${ids.length} rows) → Jumbo, deleted v${large.variant_id}`);
  }

  const { error: rErr } = await db.rpc("refresh_variant_price_summary");
  if (rErr) console.warn(`(warn) summary refresh: ${rErr.message}`);
  console.log("\n✅ done. Classic Flap is now doubles-only; minis + East-West are their own styles under family 'Chanel Flap'.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QB = any;
async function pageAll<T>(table: string, cols: string, apply: (q: QB) => QB): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(db.from(table).select(cols).range(from, from + 999));
    if (error) throw new Error(`${table} read: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("split-chanel-flaps failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
