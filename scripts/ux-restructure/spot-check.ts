import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  for (const id of [684, 625, 565]) {
    const { data: v } = await db.from("variant").select("variant_id,size_label,exterior_colorway,hardware_color,style:style_id(name,brand:brand_id(name))").eq("variant_id", id).single();
    const { data: ph } = await db.from("price_history").select("colorway,material,hardware_color,platform").eq("variant_id", id).limit(20);
    console.log(`\n=== v${id}:`, JSON.stringify(v));
    (ph ?? []).forEach(r => console.log("  ", r.colorway, "|", r.material, "|", r.hardware_color, "|", r.platform));
  }
})();
