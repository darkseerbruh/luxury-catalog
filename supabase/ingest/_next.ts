/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin as db } from "../seed/lib/client";
async function phc(vid:number){return (await db.from("price_history").select("*",{count:"exact",head:true}).eq("variant_id",vid)).count??0;}
(async()=>{
  // A) Birkin construction (Sellier/Retourne) recoverability
  const {data:bv}=await db.from("variant").select("variant_id").eq("style_id",4);
  const vids=(bv??[]).map((v:any)=>v.variant_id); let sel=0,ret=0,tot=0;
  for(let i=0;i<vids.length;i+=200){const {data:ph}=await db.from("price_history").select("notes,source_url").in("variant_id",vids.slice(i,i+200));
    for(const r of (ph??[]) as any[]){tot++;const h=`${r.notes??""} ${r.source_url??""}`.toLowerCase(); if(/sellier/.test(h))sel++; else if(/retourn/.test(h))ret++;}}
  console.log(`A) Birkin construction: sellier=${sel} retourne=${ret} of ${tot} (rest untagged)`);
  // B) top unfaceted styles by listing volume (styles whose variants are all null material+colour)
  const {data:styles}=await db.from("style").select("style_id,name,brand_id");
  const faceted=new Set<number>();
  const {data:fv}=await db.from("variant").select("style_id,exterior_material_id,exterior_colorway");
  const byStyle=new Map<number,{f:boolean}>();
  for(const v of (fv??[]) as any[]){const s=byStyle.get(v.style_id)??{f:false}; if(v.exterior_material_id||v.exterior_colorway)s.f=true; byStyle.set(v.style_id,s);}
  // listing counts per style via variant->ph is expensive; approximate with price_history variant grouping is hard. Use style comp counts from a summary if exists.
  // Instead: count listings for styles not yet faceted, top 15 by rough variant ph sum (sample: sum ph of each style's variants)
  const cand:{sid:number,name:string,n:number}[]=[];
  for(const s of (styles??[]) as any[]){ if(byStyle.get(s.style_id)?.f) continue;
    const {data:vs}=await db.from("variant").select("variant_id").eq("style_id",s.style_id);
    if(!vs||vs.length===0) continue;
    let n=0; for(const v of vs as any[]) n+=await phc(v.variant_id);
    if(n>=400) cand.push({sid:s.style_id,name:s.name,n});
  }
  cand.sort((a,b)=>b.n-a.n);
  console.log("B) top unfaceted styles (>=400 listings):");
  for(const c of cand.slice(0,16)) console.log(`   ${c.sid} "${c.name}": ${c.n}`);
})().then(()=>process.exit(0)).catch(e=>{console.error(String(e).slice(0,400));process.exit(1);});
