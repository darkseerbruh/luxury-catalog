import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: "/Users/ariellecoambes/Documents/luxury-catalog-searchrel/.env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const ids = [50,69,76,136,138,145,150,153,158,167,178,185,189,191];
async function main() {
  const { data: variants, error } = await sb.from("variant").select("*").in("style_id", ids);
  if (error) throw error;
  for (const v of variants ?? []) console.log("VARIANT", JSON.stringify(v));
  const vids = (variants ?? []).map((v: any) => v.variant_id);
  const { data: ph, error: e2 } = await sb.from("price_history").select("*").in("variant_id", vids).limit(200);
  if (e2) throw e2;
  for (const p of ph ?? []) console.log("PH", JSON.stringify(p));
}
main().catch((e)=>{console.error(e);process.exit(1);});
