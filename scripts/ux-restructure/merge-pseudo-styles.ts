/**
 * Merge the breadth-seed pseudo-styles into their canonical base style.
 *
 * Reads the SAFE set from pseudo-style-plan.json (produced by detect-pseudo-styles.ts —
 * only leather/canvas + size residuals, single-variant, canonical base). For each:
 *   1. resolve the parsed leather to a material_id (create if missing)
 *   2. re-parent the pseudo-style's variant(s) to the base style, filling size_label /
 *      exterior_material_id ONLY where the variant hasn't got them (never overwrite real data)
 *   3. re-point any style-linked children (resource, production_option) to the base
 *   4. delete the now-empty pseudo-style row
 *   5. record everything to a rollback file
 *
 * price_history follows the variant automatically (it links by variant_id).
 *
 * DRY-RUN by default — prints the plan and touches nothing. Pass `--apply` to execute.
 * `--only=hermes` restricts to one brand. Rollback with rollback-pseudo-styles.ts.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const APPLY = process.argv.includes("--apply");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.split("=")[1].toLowerCase() : null;

type Plan = {
  brand: string; pseudoId: number; pseudoName: string; pseudoVariants: number;
  baseId: number; baseName: string; baseVariants: number;
  residual: string; size: string | null; leather: string | null; flags: string[];
};

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const matCache = new Map<string, number>();
async function resolveMaterialId(raw: string | null): Promise<number | null> {
  if (!raw) return null;
  const name = titleCase(raw.trim());
  if (!name) return null;
  if (matCache.has(name)) return matCache.get(name)!;
  const { data: found } = await db.from("material").select("material_id").ilike("name", name).maybeSingle();
  if (found) { matCache.set(name, found.material_id); return found.material_id; }
  if (!APPLY) return -1; // sentinel: would create
  const type = /ostrich|croc|python|lizard|alligator|exotic|niloticus/i.test(name) ? "exotic"
    : /canvas|monogram|damier/i.test(name) ? "coated canvas"
    : /toile|tweed|denim|nylon|jersey|suede|fabric|wool|felt/i.test(name) ? "fabric" : "leather";
  const { data: ins, error } = await db.from("material").insert({ name, material_type: type }).select("material_id").single();
  if (error) { console.warn(`  ! material create failed "${name}": ${error.message}`); return null; }
  matCache.set(name, ins.material_id); return ins.material_id;
}

(async () => {
  const planFile = path.resolve(process.cwd(), "scripts/ux-restructure/pseudo-style-plan.json");
  const { safe } = JSON.parse(readFileSync(planFile, "utf8")) as { safe: Plan[] };
  const plans = safe.filter((p) => !only || p.brand.toLowerCase().includes(only));

  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${plans.length} pseudo-styles${only ? ` (brand~${only})` : ""}\n`);
  const rollback: { movedVariants: { variantId: number; oldStyleId: number; oldSize: string | null; oldMaterialId: number | null }[]; repointed: { table: string; id: number; oldStyleId: number }[]; deletedStyles: Record<string, unknown>[] } = { movedVariants: [], repointed: [], deletedStyles: [] };

  let moved = 0, deleted = 0;
  for (const p of plans) {
    const matId = await resolveMaterialId(p.leather);
    const { data: vars } = await db.from("variant").select("variant_id,size_label,exterior_material_id").eq("style_id", p.pseudoId);
    for (const v of vars ?? []) {
      const setSize = !v.size_label && p.size ? p.size.toUpperCase() : null;
      const setMat = v.exterior_material_id == null && matId && matId > 0 ? matId : null;
      console.log(`  ${p.brand}: v${v.variant_id} "${p.pseudoName}" -> style ${p.baseId} "${p.baseName}"` +
        `${setSize ? ` +size=${setSize}` : ""}${setMat ? ` +mat=${setMat}(${titleCase(p.leather ?? "")})` : matId === -1 ? ` +mat=NEW(${titleCase(p.leather ?? "")})` : ""}`);
      if (APPLY) {
        rollback.movedVariants.push({ variantId: v.variant_id, oldStyleId: p.pseudoId, oldSize: v.size_label, oldMaterialId: v.exterior_material_id });
        const patch: Record<string, unknown> = { style_id: p.baseId };
        if (setSize) patch.size_label = setSize;
        if (setMat) patch.exterior_material_id = setMat;
        const { error } = await db.from("variant").update(patch).eq("variant_id", v.variant_id);
        if (error) { console.warn(`  ! variant ${v.variant_id} update failed: ${error.message}`); continue; }
        moved++;
      }
    }
    // Re-point style-linked children so nothing orphans when we delete the pseudo-style.
    for (const table of ["resource", "production_option"]) {
      const { data: kids } = await db.from(table).select("*").eq("style_id", p.pseudoId);
      for (const k of kids ?? []) {
        const idKey = Object.keys(k).find((c) => c.endsWith("_id") && c !== "style_id") ?? "id";
        console.log(`    repoint ${table} #${k[idKey]} -> style ${p.baseId}`);
        if (APPLY) {
          rollback.repointed.push({ table, id: k[idKey] as number, oldStyleId: p.pseudoId });
          await db.from(table).update({ style_id: p.baseId }).eq(idKey, k[idKey]);
        }
      }
    }
    if (APPLY) {
      const { data: full } = await db.from("style").select("*").eq("style_id", p.pseudoId).single();
      const { data: left } = await db.from("variant").select("variant_id", { count: "exact", head: true }).eq("style_id", p.pseudoId);
      void left;
      const { error } = await db.from("style").delete().eq("style_id", p.pseudoId);
      if (error) { console.warn(`  ! style ${p.pseudoId} delete failed: ${error.message}`); }
      else { rollback.deletedStyles.push(full as Record<string, unknown>); deleted++; }
    }
  }

  if (APPLY) {
    const rbFile = path.resolve(process.cwd(), `scripts/ux-restructure/rollback-${only ?? "all"}-${plans.length}.json`);
    writeFileSync(rbFile, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED: moved ${moved} variants, deleted ${deleted} pseudo-styles. Rollback -> ${rbFile}`);
  } else {
    console.log(`\nDRY-RUN only. Re-run with --apply to execute (add --only=hermes to scope).`);
  }
})();
