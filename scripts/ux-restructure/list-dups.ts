import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
(async () => {
  const { data: brands } = await db.from("brand").select("brand_id,name");
  const bn = new Map((brands ?? []).map(b => [b.brand_id, b.name as string]));
  const styles: {style_id:number;name:string;brand_id:number}[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from("style").select("style_id,name,brand_id").range(f, f+999);
    styles.push(...(data ?? []) as never[]); if (!data || data.length < 1000) break;
  }
  const byKey = new Map<string, typeof styles>();
  for (const s of styles) {
    const k = `${s.brand_id}:${norm(s.name)}`;
    (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(s);
  }
  for (const [, group] of byKey) if (group.length > 1) {
    for (const s of group) {
      const { count: vc } = await db.from("variant").select("variant_id",{count:"exact",head:true}).eq("style_id", s.style_id);
      console.log(`[${bn.get(s.brand_id)}] #${s.style_id} "${s.name}" variants=${vc}`);
    }
    console.log("---");
  }
})();
