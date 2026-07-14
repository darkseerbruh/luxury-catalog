import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
async function page<T>(t: string, sel: string, ap: (q: unknown) => unknown = q=>q): Promise<T[]> {
  const out: T[] = [];
  for (let f=0;;f+=1000){ const { data } = await (ap(db.from(t).select(sel)) as any).range(f,f+999); out.push(...(data??[])); if(!data||data.length<1000) break; }
  return out;
}
(async () => {
  type P = { variant_id: number; production_year: number | null; platform: string | null; listing_ref: string | null };
  const ev = await page<P>("price_history","variant_id,production_year,platform,listing_ref",(q:any)=>q.not("production_year","is",null));
  console.log("rows with production_year:", ev.length);
  const vars = await page<{variant_id:number;year_start:number|null}>("variant","variant_id,year_start");
  const nullYear = new Set(vars.filter(v=>v.year_start==null).map(v=>v.variant_id));
  // distinct listings per variant
  const byV = new Map<number, Map<string, number>>();
  let anon=0;
  for (const e of ev) {
    if (!nullYear.has(e.variant_id)) continue;
    const key = e.listing_ref ? `${e.platform}|${e.listing_ref}` : `a${anon++}`;
    const m = byV.get(e.variant_id) ?? new Map(); m.set(key, e.production_year!); byV.set(e.variant_id, m);
  }
  let unanimous=0, spread=0, single=0;
  const yearsHist = new Map<number, number>();
  for (const [,m] of byV) {
    const ys = [...new Set(m.values())];
    const n = m.size;
    if (n < 2) { single++; continue; }
    if (ys.length === 1) { unanimous++; yearsHist.set(ys[0],(yearsHist.get(ys[0])??0)+1); }
    else spread++;
  }
  console.log(`null-year variants with evidence: ${byV.size}`);
  console.log(`  unanimous single year (>=2 distinct listings): ${unanimous}`);
  console.log(`  spread (a range; leave null, era lens covers): ${spread}`);
  console.log(`  only 1 listing (too thin): ${single}`);
  console.log("unanimous years histogram:", [...yearsHist.entries()].sort((a,b)=>a[0]-b[0]).map(([y,n])=>`${y}:${n}`).join(" "));
  // country evidence probe: enrichment JSON keys
  const { data: enr } = await db.from("price_history").select("enrichment").not("enrichment","is",null).limit(200);
  const keys = new Map<string, number>();
  let madeIn = 0;
  for (const r of enr ?? []) {
    const e = r.enrichment as Record<string, unknown>;
    for (const k of Object.keys(e ?? {})) keys.set(k,(keys.get(k)??0)+1);
    if (JSON.stringify(e).match(/made in|country|origin/i)) madeIn++;
  }
  console.log("\nenrichment keys (sample 200):", [...keys.entries()].map(([k,n])=>`${k}:${n}`).join(" "));
  console.log("rows mentioning made-in/country/origin:", madeIn);
})();
