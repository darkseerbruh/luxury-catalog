/**
 * Reconcile duplicate size-variants created by promote-safe.ts.
 *
 * promote-safe matched a discovered cluster's size by exact normalized string against
 * existing variants. Some hero/curated variants carry a VERBOSE size_label (e.g.
 * "Neverfull MM (Monogram)", "Birkin 30", "Medium (M/L)") so a clean token like "MM"
 * or "30" did not match, and a duplicate variant was created. This merges each clean
 * duplicate (exactly ONE older sibling sharing the same size token) back into the
 * original: re-point its price_history rows + discovered_listing pointers, then delete
 * the now-empty duplicate variant. Ambiguous cases (multiple siblings, e.g. MM across
 * canvases) are reported and LEFT for manual review.
 *
 *   npx tsx supabase/ingest/reconcile-promoted-dupes.ts [--write]
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm } from "../../src/lib/image-import-core";

const WRITE = process.argv.includes("--write");
const TOKENS = ["mini","small","medium","large","teen","maxi","jumbo","mm","pm","gm","bb","18","20","22","24","25","26","28","30","32","35","40","45","50","55","60"];
function tokenOf(s: string | null): string | null {
  const words = norm(s || "").split(/\s+/);
  for (const t of TOKENS) if (words.includes(t)) return t;
  return null;
}

async function main() {
  // variants created today (the promote-safe batch)
  const created: any[] = []; let from = 0;
  for (;;) {
    const { data } = await db.from("variant").select("variant_id,style_id,size_label,created_at").gte("created_at","2026-06-26").range(from, from+999);
    if (!data || data.length===0) break; created.push(...data); if (data.length<1000) break; from+=1000;
  }

  const merges: { dup: number; orig: number; style: number }[] = [];
  for (const v of created) {
    const { data: sibs } = await db.from("variant").select("variant_id,size_label,created_at").eq("style_id", v.style_id);
    const matches = (sibs||[]).filter((s:any)=> s.variant_id!==v.variant_id && tokenOf(s.size_label)===tokenOf(v.size_label) && tokenOf(v.size_label)!==null && new Date(s.created_at) < new Date("2026-06-26"));
    if (matches.length===1) merges.push({ dup: v.variant_id, orig: matches[0].variant_id, style: v.style_id });
    else if (matches.length>1) console.log(`SKIP ambiguous v${v.variant_id} ("${v.size_label}") style ${v.style_id}`);
  }
  console.log(`Clean duplicates to merge: ${merges.length}${WRITE?" (WRITE)":" (DRY RUN)"}`);

  let movedRows = 0, deletedRows = 0, deletedVariants = 0, repointed = 0;
  for (const m of merges) {
    const { data: dupRows } = await db.from("price_history").select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", m.dup);
    const { data: origRows } = await db.from("price_history").select("platform,listing_ref,price_type,observed_on").eq("variant_id", m.orig);
    const origKeys = new Set((origRows||[]).map((r:any)=>`${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`));
    const toMove: number[] = []; const toDelete: number[] = [];
    for (const r of dupRows||[]) {
      const k = `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;
      if (origKeys.has(k)) toDelete.push(r.price_id); else toMove.push(r.price_id);
    }
    if (!WRITE) { console.log(`  v${m.dup}->v${m.orig}: move ${toMove.length}, drop ${toDelete.length} dup-keys`); continue; }
    for (let i=0;i<toMove.length;i+=500){ const { error } = await db.from("price_history").update({ variant_id: m.orig }).in("price_id", toMove.slice(i,i+500)); if(error){console.error(`move err v${m.dup}:`,error.message);} }
    for (let i=0;i<toDelete.length;i+=500){ await db.from("price_history").delete().in("price_id", toDelete.slice(i,i+500)); }
    // repoint discovered_listing
    const { error: dErr, count } = await db.from("discovered_listing").update({ promoted_variant_id: m.orig }, { count: "estimated" }).eq("promoted_variant_id", m.dup);
    if (dErr) console.error(`repoint err v${m.dup}:`, dErr.message);
    // delete the now-empty duplicate variant
    const { error: vErr } = await db.from("variant").delete().eq("variant_id", m.dup);
    if (vErr) { console.error(`variant delete err v${m.dup}:`, vErr.message); }
    else deletedVariants++;
    movedRows += toMove.length; deletedRows += toDelete.length; repointed += count ?? 0;
    console.log(`  ✓ v${m.dup}->v${m.orig}: moved ${toMove.length}, dropped ${toDelete.length}, variant deleted`);
  }
  if (WRITE) console.log(`\nDone. rows moved ${movedRows}, dup rows dropped ${deletedRows}, variants deleted ${deletedVariants}.`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message||e);process.exit(1);});
