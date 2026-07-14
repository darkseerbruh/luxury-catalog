/**
 * Class-2 cleanup (0714 audit): seller-title styles → their real style.
 *
 * For each junk row (a promoted listing title posing as a style name), find the
 * same-brand style whose name is contained in the title ("…Tweed 19 Large Flap
 * Bag" ⊃ "19"). Longest match wins. When a home exists: move the variant there,
 * parse colour (family) / material / size out of the title into the variant's
 * empty fields, delete the junk style. No home → REVIEW (printed, left alone —
 * naming a bag needs the archivist, not a heuristic).
 *
 * DRY-RUN default; --apply executes + writes a rollback file.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { findListingTitleStyles, foldName, type StyleLite } from "@/lib/catalog-structure";
import { colorFamily } from "@/lib/listings-taxonomy";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const SIZE_RX = /\b(pm|mm|gm|bb|mini|small|medium|large|jumbo|maxi|nano|micro|\d{2})\b/i;
const MATERIAL_RX =
  /\b(caviar|lambskin|calfskin|tweed|patent|denim|suede|velvet|satin|canvas|epi|monogram|vernis|suhali|leather)\b/gi;

const words = (s: string) => foldName(s).split(" ").filter(Boolean);
const containsPhrase = (name: string, base: string) => ` ${words(name).join(" ")} `.includes(` ${words(base).join(" ")} `);

(async () => {
  const styles: (StyleLite & { raw: { style_id: number; name: string; brand_id: number } })[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from("style").select("style_id,name,brand_id").range(f, f + 999);
    for (const s of (data ?? []) as { style_id: number; name: string; brand_id: number }[]) {
      styles.push({ styleId: s.style_id, name: s.name, brandId: s.brand_id, raw: s });
    }
    if (!data || data.length < 1000) break;
  }
  const { data: brands } = await db.from("brand").select("brand_id,name");
  const brandName = new Map((brands ?? []).map((b) => [b.brand_id, b.name as string]));

  const junk = findListingTitleStyles(styles);
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${junk.length} title-junk styles\n`);

  const rollback: { movedVariants: { variantId: number; oldStyleId: number; prev: Record<string, unknown> }[]; deletedStyles: Record<string, unknown>[] } = { movedVariants: [], deletedStyles: [] };
  let merged = 0, review = 0;

  for (const j of junk) {
    const brandStyles = styles.filter((s) => s.brandId === j.brandId && s.styleId !== j.styleId);
    const home = brandStyles
      .filter((b) => !junk.some((x) => x.styleId === b.styleId)) // never merge junk into junk
      .filter((b) => containsPhrase(j.name, b.name))
      .sort((a, b) => words(b.name).length - words(a.name).length)[0];

    const brand = brandName.get(j.brandId) ?? "?";
    if (!home) {
      review++;
      console.log(`REVIEW  [${brand}] #${j.styleId} "${j.name}" — no catalogued style contained in the title`);
      continue;
    }

    // Parse variant attributes out of the title (colour family, material word, size token).
    const colour = colorFamily(j.name);
    MATERIAL_RX.lastIndex = 0;
    const mats = j.name.match(MATERIAL_RX);
    const material = mats ? mats.filter((m) => m.toLowerCase() !== "leather")[0] ?? null : null;
    const homeWords = new Set(words(home.name));
    const sizeTok = words(j.name).filter((w) => !homeWords.has(w)).find((w) => SIZE_RX.test(w));

    console.log(
      `MERGE   [${brand}] #${j.styleId} "${j.name}" -> #${home.styleId} "${home.name}"` +
        ` | colour=${colour ?? "-"} material=${material ?? "-"} size=${sizeTok ?? "-"}`,
    );

    if (APPLY) {
      const { data: vars } = await db
        .from("variant")
        .select("variant_id, exterior_colorway, exterior_material_id, size_label")
        .eq("style_id", j.styleId);
      for (const v of vars ?? []) {
        const patch: Record<string, unknown> = { style_id: home.styleId };
        if (!v.exterior_colorway && colour) patch.exterior_colorway = colour;
        if (!v.size_label && sizeTok) patch.size_label = sizeTok.toUpperCase();
        if (v.exterior_material_id == null && material) {
          const name = material.replace(/\b\w/g, (c) => c.toUpperCase());
          const { data: found } = await db.from("material").select("material_id").ilike("name", name).maybeSingle();
          if (found) patch.exterior_material_id = found.material_id;
        }
        rollback.movedVariants.push({
          variantId: v.variant_id,
          oldStyleId: j.styleId,
          prev: { exterior_colorway: v.exterior_colorway, exterior_material_id: v.exterior_material_id, size_label: v.size_label },
        });
        const { error } = await db.from("variant").update(patch).eq("variant_id", v.variant_id);
        if (error) console.warn(`  ! v${v.variant_id}: ${error.message}`);
      }
      const { data: full } = await db.from("style").select("*").eq("style_id", j.styleId).single();
      const { error } = await db.from("style").delete().eq("style_id", j.styleId);
      if (error) console.warn(`  ! delete #${j.styleId}: ${error.message}`);
      else { rollback.deletedStyles.push(full as Record<string, unknown>); merged++; }
    }
  }

  console.log(`\n${APPLY ? "APPLIED" : "planned"}: ${APPLY ? merged : junk.length - review} merges · ${review} for archivist review`);
  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-title-junk.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`Rollback -> ${out}`);
  }
})();
