import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getSupabase } from "@/lib/supabase";
(async () => {
  const sb = getSupabase();
  const { data: brand } = await sb.from("brand").select("brand_id,name").ilike("name","%herm%").limit(1).single();
  console.log("BRAND", brand);
  const { data: styles } = await sb.from("style").select("style_id,name").eq("brand_id", brand!.brand_id).order("name");
  console.log("HERMES STYLE COUNT:", styles?.length);
  const birkinish = (styles ?? []).filter(s => /birkin/i.test(s.name));
  console.log("BIRKIN-ish styles:", birkinish.length);
  birkinish.slice(0,50).forEach(s => console.log("  ", s.style_id, JSON.stringify(s.name)));
  const one = birkinish.find(s => /togo birkin 35/i.test(s.name)) ?? birkinish.find(s=>!/^birkin$/i.test(s.name));
  if (one) {
    const { data: vars } = await sb.from("variant").select("variant_id,size_label,exterior_colorway,hardware_color").eq("style_id", one.style_id);
    console.log("VARIANTS under", JSON.stringify(one.name), "=", vars?.length);
    (vars ?? []).slice(0,12).forEach(v => console.log("   ", v.variant_id, "size=",v.size_label, "color=",v.exterior_colorway, "hw=",v.hardware_color));
  }
  const bare = birkinish.find(s => /^birkin$/i.test(s.name));
  if (bare) {
    const { data: vars } = await sb.from("variant").select("variant_id,size_label,exterior_colorway,hardware_color").eq("style_id", bare.style_id);
    console.log("bare 'Birkin' style_id", bare.style_id, "VARIANTS =", vars?.length);
  }
})();
