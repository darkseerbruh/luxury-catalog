import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data: v83 } = await db.from("variant").select("variant_id,style_id,size_label,exterior_material_id,style:style_id(name)").eq("variant_id", 83).single();
  console.log("v83 (was 'Togo Birkin 35'):", JSON.stringify(v83));
  const { data: ph } = await db.from("price_history").select("price_id", { count: "exact", head: true }).eq("variant_id", 83);
  const { count } = await db.from("price_history").select("price_id", { count: "exact", head: true }).eq("variant_id", 83);
  console.log("price rows still on v83:", count);
  const { data: birkins } = await db.from("style").select("style_id,name").eq("brand_id", 4).ilike("name", "%birkin%");
  console.log("Birkin styles left:", (birkins ?? []).map(b => `${b.style_id}:${b.name}`).join(", "));
})();
