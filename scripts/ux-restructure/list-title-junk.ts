import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const COLOR_RX = /\b(black|white|beige|brown|tan|red|blue|navy|green|pink|purple|grey|gray|gold|silver|burgundy|cream|ivory|orange|yellow|multicolor|charcoal|mango)\b/i;
const MATERIAL_RX = /\b(leather|caviar|lambskin|calfskin|suede|canvas|tweed|patent|quilted|smooth|grained|pebbled|shiny|matte|velvet|denim|nylon|satin|python|croc|ostrich|vernis)\b/i;
(async () => {
  const { data: brands } = await db.from("brand").select("brand_id,name");
  const bn = new Map((brands ?? []).map(b => [b.brand_id, b.name as string]));
  const styles: {style_id:number;name:string;brand_id:number}[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from("style").select("style_id,name,brand_id").range(f, f+999);
    styles.push(...(data ?? []) as never[]); if (!data || data.length < 1000) break;
  }
  // STRICT seller-title junk: 5+ words AND (colour OR material descriptor), or "w/ Tags"-style artifacts
  const junk = styles.filter(s => {
    const wc = s.name.trim().split(/\s+/).length;
    return (wc >= 5 && (COLOR_RX.test(s.name) || MATERIAL_RX.test(s.name))) || /w\/|NWT|\bBNIB\b/i.test(s.name);
  });
  console.log("STRICT listing-title styles:", junk.length);
  for (const s of junk) {
    const { count } = await db.from("variant").select("variant_id",{count:"exact",head:true}).eq("style_id", s.style_id);
    console.log(`  [${bn.get(s.brand_id)}] #${s.style_id} "${s.name}" (variants: ${count})`);
  }
})();
