/**
 * READ-ONLY audit: where is a bag's SIZE baked into the style name instead of held as a
 * selectable size dimension? Clusters styles by their canonical base model (canonicalModel)
 * within a brand; a cluster with >1 style, or a single style whose name != its base, is a
 * normalization candidate (e.g. "Birkin 25/30/35/40" -> one "Birkin" + size variants), the
 * same shape as the reviewed Chanel flap split. Ranks by comp impact so the highest-traffic
 * families surface first. Writes docs/size-normalization-audit.md. Mutates NOTHING.
 *
 *   npx tsx supabase/ingest/audit-size-normalization.ts
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { canonicalModel } from "../../src/lib/ingest/model-normalize";
import * as fs from "fs";
import * as path from "path";

const SIZE_TOKEN = /\b(\d{2}|PM|MM|GM|BB|TPM|Nano|Micro|Mini|Small|Medium|Large|Maxi|Jumbo|East[- ]West)\b/i;

async function main() {
  const { data: styles } = await db
    .from("style")
    .select("style_id, name, brand:brand_id(name), variant(variant_id, size_label)");
  const rows = (styles ?? []) as any[];

  // comp counts per style (price_history rows)
  const compCount = new Map<number, number>();
  const allVarIds: number[] = [];
  for (const s of rows) for (const v of s.variant ?? []) allVarIds.push(v.variant_id);
  for (let i = 0; i < allVarIds.length; i += 500) {
    const chunk = allVarIds.slice(i, i + 500);
    const { data: ph } = await db.from("price_history").select("variant_id").in("variant_id", chunk);
    for (const p of (ph ?? []) as any[]) {
      // map variant -> style
      // (built below); accumulate later
      compCount.set(p.variant_id, (compCount.get(p.variant_id) ?? 0) + 1);
    }
  }
  const styleComps = (s: any) => (s.variant ?? []).reduce((n: number, v: any) => n + (compCount.get(v.variant_id) ?? 0), 0);

  // cluster by brand + canonical base model
  type Cl = { brand: string; base: string; styles: any[] };
  const clusters = new Map<string, Cl>();
  let nullSizeWithComps = 0;
  for (const s of rows) {
    const brand = s.brand?.name ?? "?";
    const base = canonicalModel(brand, s.name) ?? s.name;
    const key = `${brand}::${base.toLowerCase()}`;
    (clusters.get(key) ?? clusters.set(key, { brand, base, styles: [] }).get(key)!).styles.push(s);
    for (const v of s.variant ?? []) if (v.size_label == null && (compCount.get(v.variant_id) ?? 0) > 0) nullSizeWithComps++;
  }

  // candidate = cluster with >1 style, OR a style whose name carries a size token but base doesn't
  const cands = [...clusters.values()]
    .map((c) => ({ ...c, comps: c.styles.reduce((n, s) => n + styleComps(s), 0) }))
    .filter((c) => c.styles.length > 1 || c.styles.some((s) => SIZE_TOKEN.test(s.name) && !SIZE_TOKEN.test(c.base)))
    .sort((a, b) => b.comps - a.comps);

  const totalStyles = rows.length;
  const sizeInName = rows.filter((s) => SIZE_TOKEN.test(s.name)).length;

  const lines: string[] = [];
  lines.push(`# Size-normalization audit (generated ${'2026-07-11'}, READ-ONLY)`);
  lines.push("");
  lines.push(`Where a bag's **size is baked into the style name** instead of held as a selectable size dimension. The fix is the reviewed per-family split pattern (\`split-chanel-flaps.ts\`), NOT a blind null-fill. Ranked by comp impact.`);
  lines.push("");
  lines.push(`- Total styles: **${totalStyles}**`);
  lines.push(`- Styles with a size token in the name: **${sizeInName}**`);
  lines.push(`- Normalization-candidate clusters (>1 style sharing a base, or size-in-name): **${cands.length}**`);
  lines.push(`- Null-\`size_label\` variants that HAVE comps (surface in shop/deals): **${nullSizeWithComps}**`);
  lines.push("");
  lines.push(`## Top 40 candidate clusters by comp impact`);
  lines.push("");
  lines.push(`| Brand | Base model | # styles | comps | Styles (size-in-name) |`);
  lines.push(`|---|---|--:|--:|---|`);
  for (const c of cands.slice(0, 40)) {
    const names = c.styles.map((s: any) => `${s.name}${SIZE_TOKEN.test(s.name) ? "" : " ·(no size)"}`).join(" / ");
    lines.push(`| ${c.brand} | ${c.base} | ${c.styles.length} | ${c.comps} | ${names.replace(/\|/g, "/")} |`);
  }
  lines.push("");
  lines.push(`## Method + next step`);
  lines.push(`Each cluster = one house model whose sizes are currently separate style rows. Normalize by merging the size-bearing siblings into the base model and moving each to a \`size_label\` variant (dry-run-first, reversible), exactly as the Chanel flap split did. Do the highest-comp families first, archivist-verified so distinct sub-models (e.g. Hermès Birkin vs Birkin Touch vs Sellier) are NOT merged. Owner-gated per family.`);

  const out = path.resolve(__dirname, "../../docs/size-normalization-audit.md");
  fs.writeFileSync(out, lines.join("\n"));
  console.log(`wrote ${out}`);
  console.log(`clusters=${cands.length} sizeInName=${sizeInName}/${totalStyles} nullSizeWithComps=${nullSizeWithComps}`);
  console.log("top 12:");
  for (const c of cands.slice(0, 12)) console.log(`  ${c.brand} · ${c.base} — ${c.styles.length} styles, ${c.comps} comps`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(String(e).slice(0,400));process.exit(1);});
