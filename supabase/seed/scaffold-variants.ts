/**
 * Scaffold bare size variants on a canonical backbone style.
 *
 * The price loader DROPS any observation whose style has zero variants (there is
 * nothing to attach the row to), so before loading an icon's resale data we must
 * create one bare `variant` row per real size. These are deliberately minimal —
 * just style_id + size_label — because the per-listing colour/leather/hardware/
 * year live on each price_history row (migration 0022), not on the variant. The
 * variant is the addressable size bucket the listings hang off (Amazon-PDP model:
 * the style is the page, size is a selector).
 *
 * Idempotent: find-or-create by (style_id, size_label) — re-runs create nothing.
 * Resolves the style by exact brand + style name against the catalog so we always
 * land on the clean canonical backbone row (never a verbose one-off duplicate).
 *
 *   npx tsx supabase/seed/scaffold-variants.ts "<Brand>" "<Style>" <size> [<size> ...] [--write]
 *
 * e.g. npx tsx supabase/seed/scaffold-variants.ts "Chanel" "Boy" Mini Small Medium Large --write
 */
import { supabaseAdmin } from "./lib/client";

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const positional = args.filter((a) => !a.startsWith("--"));
  const [brandName, styleName, ...sizes] = positional;
  if (!brandName || !styleName || sizes.length === 0) {
    console.error('Usage: tsx scaffold-variants.ts "<Brand>" "<Style>" <size> [<size> ...] [--write]');
    process.exit(1);
  }

  const { data: brands, error: bErr } = await supabaseAdmin.from("brand").select("brand_id, name");
  if (bErr) throw bErr;
  const brand = (brands ?? []).find((b) => norm(b.name) === norm(brandName));
  if (!brand) {
    console.error(`Brand not found: ${brandName}. Have: ${(brands ?? []).map((b) => b.name).join(", ")}`);
    process.exit(1);
  }

  const { data: styles, error: sErr } = await supabaseAdmin
    .from("style")
    .select("style_id, name")
    .eq("brand_id", brand.brand_id);
  if (sErr) throw sErr;
  // Exact-normalized match → the clean canonical backbone style, never a verbose one-off.
  const style = (styles ?? []).find((s) => norm(s.name) === norm(styleName));
  if (!style) {
    console.error(
      `Style "${styleName}" not found under ${brand.name}. Candidates: ` +
        (styles ?? [])
          .filter((s) => norm(s.name).includes(norm(styleName)))
          .map((s) => `${s.name} (#${s.style_id})`)
          .join(", ")
    );
    process.exit(1);
  }

  const { data: existing, error: vErr } = await supabaseAdmin
    .from("variant")
    .select("variant_id, size_label")
    .eq("style_id", style.style_id);
  if (vErr) throw vErr;
  const have = new Set((existing ?? []).map((v) => (v.size_label ?? "").toLowerCase()));

  const toCreate = sizes.filter((s) => !have.has(s.toLowerCase()));
  console.log(`${brand.name} / ${style.name} (#${style.style_id})`);
  console.log(`  existing sizes: ${[...have].join(", ") || "(none)"}`);
  console.log(`  would create: ${toCreate.join(", ") || "(none — all present)"}`);

  if (!write) {
    console.log("DRY RUN — pass --write to persist.");
    return;
  }
  if (toCreate.length === 0) {
    console.log("Nothing to create.");
    return;
  }
  const rows = toCreate.map((size_label) => ({ style_id: style.style_id, size_label, still_in_production: false }));
  const { data: ins, error: iErr } = await supabaseAdmin.from("variant").insert(rows).select("variant_id, size_label");
  if (iErr) throw iErr;
  console.log(`Created ${ins?.length ?? 0} variant(s): ${(ins ?? []).map((v) => `${v.size_label}#${v.variant_id}`).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
