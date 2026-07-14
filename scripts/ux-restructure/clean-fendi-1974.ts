import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
(async () => {
  // Remaining production_year=1974 rows: every one sits on a modern Fendi style
  // (Fendigraphy 2022, Peekaboo 2008+, Origami 2022) — the FF 1974 collection name,
  // or blank-notes rows with no text evidence for ANY year. Unverifiable = null.
  const { data } = await db.from("price_history")
    .select("price_id, variant:variant_id(style:style_id(brand:brand_id(name)))")
    .eq("production_year", 1974).limit(1000);
  const fendi = (data ?? []).filter(r => ((r.variant as {style?:{brand?:{name?:string}}})?.style?.brand?.name) === "Fendi");
  console.log(`1974 rows: ${data?.length}, Fendi: ${fendi.length}`);
  if (APPLY) {
    const ids = fendi.map(r => r.price_id);
    for (let i = 0; i < ids.length; i += 100) {
      await db.from("price_history").update({ production_year: null }).in("price_id", ids.slice(i, i+100));
    }
    writeFileSync("scripts/ux-restructure/rollback-fendi-1974.json", JSON.stringify(ids));
    console.log(`nulled ${ids.length}. Rollback ids saved.`);
  }
})();
