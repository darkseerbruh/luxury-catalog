/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * READ-ONLY: classify every listing on Chanel flap-line styles and flag mislabels
 * (a Reissue/Coco Handle/Boy titled listing sitting on the Classic Flap, etc.).
 *   npx tsx supabase/ingest/audit-chanel-flap-mislabels.ts
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { flapMislabel, classifyChanelFlap } from "../../src/lib/ingest/chanel-flap-classify";

async function allPh(variantIds:number[]){
  const out:any[]=[]; const PAGE=1000;
  for(let from=0;;from+=PAGE){
    const { data } = await db.from("price_history").select("price_id,variant_id,notes").in("variant_id",variantIds).order("price_id").range(from,from+PAGE-1);
    const rows=(data??[]) as any[]; out.push(...rows); if(rows.length<PAGE) break;
  }
  return out;
}
async function main(){
  const { data: styles } = await db.from("style").select("style_id,name,variant(variant_id)").eq("brand_id",1)
    .or("name.ilike.%flap%,name.ilike.%reissue%,name.ilike.%coco handle%,name.ilike.%boy%");
  const flapStyles = (styles??[]).filter((s:any)=>/classic flap|2\.55 reissue|coco handle|^boy$/i.test(s.name));
  for(const s of flapStyles as any[]){
    const vids=(s.variant??[]).map((v:any)=>v.variant_id);
    if(!vids.length) continue;
    const rows = await allPh(vids);
    const titled = rows.filter(r=>r.notes && r.notes.trim());
    const mis:Record<string,number>={}; const samples:string[]=[];
    for(const r of titled){
      const m = flapMislabel(r.notes, null, s.name);
      if(m){ mis[m]=(mis[m]||0)+1; if(samples.length<4) samples.push(`[→${m}] ${String(r.notes).slice(0,60)}`); }
    }
    const misTotal=Object.values(mis).reduce((a,b)=>a+b,0);
    console.log(`\n"${s.name}" (${vids.length} variants, ${rows.length} listings, ${titled.length} titled): ${misTotal} mislabels`);
    if(misTotal) { console.log("   ", JSON.stringify(mis)); for(const x of samples) console.log("    "+x); }
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error(String(e).slice(0,300));process.exit(1);});
