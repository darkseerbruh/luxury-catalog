/**
 * #178 rename per the archivist web pass (2026-07-14 night): NO consensus model
 * name exists for this seasonal piece (HIGH confidence) — resellers label it
 * descriptively "Caviar Quilted Mademoiselle Flap Bag" (FP 552502, Yoogi's,
 * TRR patterns). #185 already owns "Mademoiselle Lock Flap", so #178 takes the
 * objectively distinguishing hardware: the rotating TURNLOCK (vs #185's
 * push-lock). Year stays null (only a sister-piece anchor, FP dates it 2005 —
 * not this bag). Archivist also flags the flat leather strap as possibly
 * aftermarket, so strap-based identification is unreliable.
 *
 * DRY-RUN default; --apply executes + writes rollback-178-rename.json.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

(async () => {
  const { data: s } = await db.from("style").select("style_id,name").eq("style_id", 178).maybeSingle();
  if (!s || s.name !== "Quilted Flap Shoulder Bag") {
    console.log(`SKIP: #178 name is ${JSON.stringify(s?.name)}, expected "Quilted Flap Shoulder Bag"`);
    return;
  }
  console.log(`RENAME #178 "Quilted Flap Shoulder Bag" -> "Mademoiselle Turnlock Flap"`);
  if (APPLY) {
    await db.from("style").update({ name: "Mademoiselle Turnlock Flap" }).eq("style_id", 178);
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-178-rename.json");
    writeFileSync(out, JSON.stringify({ renamed: [{ styleId: 178, oldName: s.name }] }, null, 2));
    console.log(`APPLIED. Rollback -> ${out}`);
  } else console.log("DRY-RUN. Re-run with --apply.");
})();
