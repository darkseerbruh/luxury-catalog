import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  for (const y of [2005, 2014, 2021, 2022, 2026, 1980, 1994, 2008, 2017]) {
    const { data } = await db.from("price_history")
      .select("production_year,notes,variant:variant_id(style:style_id(name))")
      .eq("production_year", y).limit(4);
    console.log(`\n=== ${y} ===`);
    for (const r of data ?? []) console.log(`  ${(r.variant as any)?.style?.name} | ${(r.notes??"").slice(0,80)}`);
  }
  // total contamination scale
  for (const [y, phrase] of [[1961,"Jackie 1961"],[1974,"FF 1974"],[2005,"Re-Edition 2005"],[2000,"Re-Edition 2000"]] as [number,string][]) {
    const { count } = await db.from("price_history").select("*",{count:"exact",head:true}).eq("production_year",y).ilike("notes",`%${phrase}%`);
    console.log(`rows production_year=${y} with "${phrase}" in notes: ${count}`);
  }
})();
