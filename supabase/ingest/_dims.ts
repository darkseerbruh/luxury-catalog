/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin as db } from "../seed/lib/client";
import { visibleDims } from "../../src/lib/variant-dims";
import { cleanMaterialLabel } from "../../src/lib/variant-dims";
async function phc(vid:number){return (await db.from("price_history").select("*",{count:"exact",head:true}).eq("variant_id",vid)).count??0;}
async function dims(sid:number,name:string){
  const {data}=await db.from("variant").select("variant_id,size_label,exterior_colorway,exterior_material_id,construction_method,hardware_color,strap_type").eq("style_id",sid);
  const {data:mats}=await db.from("material").select("material_id,name"); const mn=new Map((mats??[]).map((m:any)=>[m.material_id,m.name]));
  // build StyleVariantOption-shaped objects (only fields DIMS reads) — filter to ph>0 variants
  const opts:any[]=[];
  for(const v of (data??[]) as any[]){ if((await phc(v.variant_id))===0) continue;
    opts.push({variantId:v.variant_id,sizeLabel:v.size_label,exteriorColorway:v.exterior_colorway,exteriorMaterial:v.exterior_material_id?mn.get(v.exterior_material_id):null,constructionMethod:v.construction_method,hardwareColor:v.hardware_color,strapType:v.strap_type,trimMaterial:null,hardwareType:null,strapAttachmentType:null,interiorColor:null,interiorMaterial:null,stitchingColor:null,rigidity:null});
  }
  const vd=visibleDims(opts as any);
  console.log(`${name}(${sid}) [${opts.length} live variants] -> dims: ${vd.map(d=>`${d.dim.label}(${d.values.length})`).join(", ")||"NONE"}`);
}
(async()=>{ for(const [s,n] of [[1,"ClassicFlap"],[5,"Kelly"],[433,"Speedy"],[208,"LadyDior"],[454,"BookTote"],[568,"City"],[448,"Ophidia"],[946,"Tabby"]] as any) await dims(s,n); })().then(()=>process.exit(0)).catch(e=>{console.error(String(e).slice(0,400));process.exit(1);});
