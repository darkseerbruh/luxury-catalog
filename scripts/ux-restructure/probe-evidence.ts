import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  // what columns does price_history have? sample one row
  const { data: sample } = await db.from("price_history").select("*").not("colorway","is",null).limit(1);
  console.log("price_history columns:", Object.keys(sample?.[0] ?? {}).join(", "));
  // evidence coverage: how many price rows carry colorway / hardware / material-ish info
  const tot = async (f: (q:any)=>any) => { const { count } = await f(db.from("price_history").select("price_id",{count:"exact",head:true})); return count; };
  console.log("total price rows:", await tot(q=>q));
  console.log("rows with colorway:", await tot(q=>q.not("colorway","is",null)));
  console.log("rows with hardware_color:", await tot(q=>q.not("hardware_color","is",null)));
  for (const col of ["material","leather","size_label","listing_title","title"]) {
    const { error } = await db.from("price_history").select(col).limit(1);
    console.log(`has ${col}:`, error ? "NO" : "yes");
  }
})();
