/**
 * Detect breadth-seed "pseudo-styles": style rows whose NAME bakes in a leather/size
 * qualifier ("Togo Birkin 35") instead of storing it as a variant attribute, when a
 * canonical base style ("Birkin") already exists in the same brand.
 *
 * DRY-RUN ONLY. Emits a review report + a machine-readable plan JSON. It mutates
 * nothing — merging is a separate, owner-gated step.
 *
 * Ambiguity is flagged, never auto-resolved: a residual that still carries a model
 * word ("Touch", "Sellier", "Cargo", "HAC") means it's a DISTINCT model, not a mere
 * leather variant, and must not be merged blindly.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { getSupabase } from "@/lib/supabase";

// Residual tokens that signal a SEPARATE model (never fold these into the base).
const MODEL_QUALIFIERS = /\b(touch|sellier|cargo|hac|haut|courroies|shadow|ghillies|club|verso|faubourg|in[- ]?the[- ]?loop|picnic|3in1|so black|casaque)\b/i;
// Size tokens (Hermès numeric, plus common word sizes) — stripped to size_label.
const SIZE_RX = /\b(15|18|20|25|28|29|30|31|32|35|40|45|50|nano|mini|pm|mm|gm|bb|small|medium|large)\b/gi;

// Material / canvas-line vocabulary. A pseudo-style is only AUTO-SAFE to merge when its
// residual (after removing the base name and any size) is made up ENTIRELY of these
// material words — i.e. the qualifier really is a leather/canvas, not a sub-model or a
// silhouette. Silhouette words (tote/hobo/pouch/bucket…) are deliberately EXCLUDED so
// "Neverfull Pouch" / "Willow Tote" stay flagged, not merged.
const MATERIAL_VOCAB = new Set<string>([
  // Hermès leathers
  "togo","clemence","clémence","epsom","swift","box","chevre","chèvre","barenia","fjord","evercolor",
  "evergrain","taurillon","ostrich","niloticus","novillo","tadelakt","guilloche","sombrero","chamonix",
  "ardennes","courchevel","vache","gulliver","doblis","mysore","veau","lizard","alligator","crocodile","porosus",
  // LV canvas / leather lines
  "monogram","damier","ebene","ebène","azur","epi","empreinte","vernis","taiga","mahina","escale","reverse",
  "multicolore","multicolor","idylle","eclipse","macassar","infrarouge","giant","antheia","graphite",
  // Chanel + general materials / finishes
  "caviar","lambskin","calfskin","tweed","patent","jersey","velvet","shearling","denim","raffia","canvas",
  "nylon","leather","suede","satin","python","snakeskin","grained","smooth","quilted","chevron","gomma",
  "saffiano","intrecciato","nappa","goatskin","sheepskin","coated","toile","wool","felt","tessuto","re",
  "exotic","metallic","perforated","embossed","woven","aged","calf","cowhide","pebbled","textured","edition",
]);
function residualIsMaterialOnly(tokens: string[]): boolean {
  return tokens.length > 0 && tokens.every((t) => MATERIAL_VOCAB.has(t));
}

type Row = { style_id: number; name: string; brand_id: number; brandName: string; variantCount: number };

function words(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
}
/** Is `base` a contiguous whole-word subsequence of `name`? */
function containsPhrase(name: string, base: string): boolean {
  const n = ` ${words(name).join(" ")} `;
  const b = ` ${words(base).join(" ")} `;
  return n.includes(b);
}

(async () => {
  const sb = getSupabase();
  const { data: brands } = await sb.from("brand").select("brand_id,name");
  const brandName = new Map((brands ?? []).map((b) => [b.brand_id, b.name as string]));

  // Pull styles + variant counts.
  const { data: styles } = await sb.from("style").select("style_id,name,brand_id");
  const rows: Row[] = [];
  for (const s of styles ?? []) {
    const { count } = await sb.from("variant").select("variant_id", { count: "exact", head: true }).eq("style_id", s.style_id);
    rows.push({ style_id: s.style_id, name: s.name, brand_id: s.brand_id, brandName: brandName.get(s.brand_id) ?? "?", variantCount: count ?? 0 });
  }

  const byBrand = new Map<number, Row[]>();
  for (const r of rows) (byBrand.get(r.brand_id) ?? byBrand.set(r.brand_id, []).get(r.brand_id)!).push(r);

  type Plan = {
    brand: string; pseudoId: number; pseudoName: string; pseudoVariants: number;
    baseId: number; baseName: string; baseVariants: number;
    residual: string; size: string | null; leather: string | null;
    flags: string[];
  };
  const plans: Plan[] = [];

  for (const [, brandRows] of byBrand) {
    for (const s of brandRows) {
      // Find the LONGEST other style in this brand whose name is embedded in s.name.
      const bases = brandRows
        .filter((b) => b.style_id !== s.style_id && words(b.name).length < words(s.name).length && containsPhrase(s.name, b.name))
        .sort((a, b) => words(b.name).length - words(a.name).length);
      if (bases.length === 0) continue;
      const base = bases[0];

      // Residual = s.name with the base phrase removed.
      const baseWords = new Set(words(base.name));
      const residualTokens = words(s.name).filter((w) => !baseWords.has(w));
      const residual = residualTokens.join(" ");
      const sizeMatch = s.name.match(SIZE_RX);
      const size = sizeMatch ? sizeMatch[sizeMatch.length - 1] : null;
      const leatherTokens = residualTokens.filter((w) => !SIZE_RX.test(` ${w} `));
      SIZE_RX.lastIndex = 0;
      const leather = leatherTokens.length ? leatherTokens.join(" ") : null;

      const flags: string[] = [];
      if (MODEL_QUALIFIERS.test(residual)) flags.push("DISTINCT_MODEL");
      if (s.variantCount > 1) flags.push("MULTI_VARIANT_PSEUDO");
      if (base.variantCount === 0) flags.push("BASE_HAS_NO_VARIANTS");
      if (!residual) flags.push("EMPTY_RESIDUAL");
      // The decisive gate: residual must be leather/canvas words only. Anything else
      // (a silhouette, a sub-model, an unknown token) means it is NOT a mere material
      // variant of the base — flag it for human review rather than merging.
      if (!residualIsMaterialOnly(leatherTokens)) flags.push("RESIDUAL_NOT_MATERIAL");

      plans.push({
        brand: s.brandName, pseudoId: s.style_id, pseudoName: s.name, pseudoVariants: s.variantCount,
        baseId: base.style_id, baseName: base.name, baseVariants: base.variantCount,
        residual, size, leather, flags,
      });
    }
  }

  const safe = plans.filter((p) => p.flags.length === 0);
  const flagged = plans.filter((p) => p.flags.length > 0);

  console.log(`TOTAL pseudo-style candidates: ${plans.length}`);
  console.log(`  SAFE (no flags, auto-mergeable): ${safe.length}`);
  console.log(`  FLAGGED (need human eyes): ${flagged.length}`);
  console.log(`\n=== SAFE sample (first 40) ===`);
  for (const p of safe.slice(0, 40)) {
    console.log(`  [${p.brand}] "${p.pseudoName}" (v${p.pseudoVariants}) -> base "${p.baseName}" (v${p.baseVariants}) | leather=${p.leather ?? "-"} size=${p.size ?? "-"}`);
  }
  console.log(`\n=== FLAGGED sample (first 30) ===`);
  for (const p of flagged.slice(0, 30)) {
    console.log(`  [${p.brand}] "${p.pseudoName}" -> "${p.baseName}" | ${p.flags.join(",")}`);
  }
  // Per-brand tally of safe merges.
  const tally = new Map<string, number>();
  for (const p of safe) tally.set(p.brand, (tally.get(p.brand) ?? 0) + 1);
  console.log(`\n=== SAFE merges per brand ===`);
  [...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([b, n]) => console.log(`  ${b}: ${n}`));

  const out = path.resolve(process.cwd(), "scripts/ux-restructure/pseudo-style-plan.json");
  writeFileSync(out, JSON.stringify({ safe, flagged }, null, 2));
  console.log(`\nPlan written to ${out}`);
})();
