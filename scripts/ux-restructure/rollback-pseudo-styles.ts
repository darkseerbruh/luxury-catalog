/**
 * Undo a merge-pseudo-styles run. Reads a rollback-*.json (written by --apply) and
 * restores: deleted pseudo-style rows, each moved variant's original style_id /
 * size_label / exterior_material_id, and any re-pointed children.
 *
 *   npx tsx scripts/ux-restructure/rollback-pseudo-styles.ts scripts/ux-restructure/rollback-all-28.json --apply
 *
 * DRY-RUN by default.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");
const file = process.argv.find((a) => a.endsWith(".json"));
if (!file) { console.error("Pass the rollback-*.json path."); process.exit(1); }

(async () => {
  const rb = JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8"));
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} rollback of ${file}`);
  // 1. Recreate deleted pseudo-style rows first (so variants can point back).
  for (const s of rb.deletedStyles ?? []) {
    console.log(`  restore style ${s.style_id} "${s.name}"`);
    if (APPLY) await db.from("style").insert(s);
  }
  // 2. Restore each moved variant.
  for (const m of rb.movedVariants ?? []) {
    console.log(`  variant ${m.variantId} -> style ${m.oldStyleId} (size=${m.oldSize}, mat=${m.oldMaterialId})`);
    if (APPLY) await db.from("variant").update({ style_id: m.oldStyleId, size_label: m.oldSize, exterior_material_id: m.oldMaterialId }).eq("variant_id", m.variantId);
  }
  // 3. Restore re-pointed children.
  for (const r of rb.repointed ?? []) {
    const idKey = Object.keys(r).includes("id") ? "id" : "id";
    console.log(`  ${r.table} #${r.id} -> style ${r.oldStyleId}`);
    if (APPLY) await db.from(r.table).update({ style_id: r.oldStyleId }).eq(idKey, r.id);
  }
  console.log(APPLY ? "\nRolled back." : "\nDRY-RUN only. Add --apply.");
})();
