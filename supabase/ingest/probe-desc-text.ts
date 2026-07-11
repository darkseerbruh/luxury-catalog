import { supabaseAdmin as db } from "../seed/lib/client";
async function main() {
  const ids = [424, 433, 412, 537, 520, 674, 690, 501, 498];
  const { data, error } = await db.from("style").select("style_id, name, description, year_introduced").in("style_id", ids);
  if (error) throw error;
  for (const s of data ?? []) console.log(`\n#${s.style_id} ${s.name} (year=${s.year_introduced ?? "-"}) [${(s.description??"").length} chars]\n  "${s.description ?? ""}"`);
}
main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});
