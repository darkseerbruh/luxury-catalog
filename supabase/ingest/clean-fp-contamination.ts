/**
 * Safety sweep: delete Fashionphile price_history rows that landed on the WRONG
 * brand's variant. Before the brand guard in sources/fashionphile.ts (mapRawRecord),
 * running `--raw` on one brand's collection dump could match another brand's TARGET
 * when a loose requireToken appeared as a substring (e.g. a Valentino
 * "rockstud-spike-shoulder-bag" matched a Celine target). This finds any row whose
 * source_url handle brand != the variant's brand and removes it.
 *
 *   npx tsx supabase/ingest/clean-fp-contamination.ts            # report only
 *   npx tsx supabase/ingest/clean-fp-contamination.ts --write    # delete
 *   npx tsx supabase/ingest/clean-fp-contamination.ts --since 2026-06-30 [--write]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// Inlined (do NOT import from sources/fashionphile — that module runs main() on import).
const FP_BRAND_SLUGS: [string, string][] = [
  ["louis-vuitton", "Louis Vuitton"], ["saint-laurent", "Saint Laurent"], ["yves-saint-laurent", "Saint Laurent"],
  ["christian-dior", "Dior"], ["bottega-veneta", "Bottega Veneta"], ["kate-spade", "Kate Spade"],
  ["the-row", "The Row"], ["valentino-garavani", "Valentino"], ["miu-miu", "Miu Miu"], ["off-white", "Off-White"],
  ["alexander-mcqueen", "Alexander McQueen"], ["alexander-wang", "Alexander Wang"], ["marc-jacobs", "Marc Jacobs"],
  ["chanel", "Chanel"], ["hermes", "Hermès"], ["gucci", "Gucci"], ["dior", "Dior"], ["celine", "Celine"],
  ["loewe", "Loewe"], ["fendi", "Fendi"], ["prada", "Prada"], ["coach", "Coach"], ["burberry", "Burberry"],
  ["goyard", "Goyard"], ["balenciaga", "Balenciaga"], ["chloe", "Chloe"], ["valentino", "Valentino"],
  ["givenchy", "Givenchy"], ["jacquemus", "Jacquemus"], ["mulberry", "Mulberry"], ["longchamp", "Longchamp"],
  ["michael-kors", "Michael Kors"],
];
function guessBrandFromHandle(handle: string): string {
  const h = (handle ?? "").toLowerCase();
  for (const [slug, name] of FP_BRAND_SLUGS) if (h.startsWith(slug)) return name;
  const first = h.split("-")[0];
  return first ? first[0].toUpperCase() + first.slice(1) : "Unknown";
}
function asciiBrandKey(s: string): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function handleFromUrl(url: string): string {
  return (url || "").toLowerCase().replace(/^https?:\/\/www\.fashionphile\.com\/products\//, "").replace(/\/?$/, "");
}

async function main() {
  const write = process.argv.includes("--write");
  const sinceIdx = process.argv.indexOf("--since");
  const since = sinceIdx >= 0 ? process.argv[sinceIdx + 1] : null;

  let q = sb.from("price_history").select("price_id, variant_id, source_url, observed_on").eq("platform", "Fashionphile").limit(50000);
  if (since) q = q.gte("observed_on", since);
  const { data: rows, error } = await q;
  if (error) throw error;
  console.log(`scanning ${rows?.length ?? 0} Fashionphile rows${since ? ` since ${since}` : ""}`);

  // variant -> brand
  const vids = [...new Set((rows ?? []).map((r) => r.variant_id))];
  const vBrand = new Map<number, string>();
  for (let i = 0; i < vids.length; i += 500) {
    const slice = vids.slice(i, i + 500);
    const { data: vs } = await sb.from("variant").select("variant_id, style_id").in("variant_id", slice);
    const sids = [...new Set((vs ?? []).map((v) => v.style_id))];
    const { data: st } = await sb.from("style").select("style_id, brand_id").in("style_id", sids);
    const { data: br } = await sb.from("brand").select("brand_id, name");
    const brandName = Object.fromEntries((br ?? []).map((b) => [b.brand_id, b.name]));
    const styleBrand = Object.fromEntries((st ?? []).map((s) => [s.style_id, brandName[s.brand_id]]));
    for (const v of vs ?? []) vBrand.set(v.variant_id, styleBrand[v.style_id]);
  }

  const bad: { price_id: number; vb: string; hb: string; handle: string }[] = [];
  for (const r of rows ?? []) {
    const vb = vBrand.get(r.variant_id);
    if (!vb || !r.source_url) continue;
    const handle = handleFromUrl(r.source_url);
    if (!handle) continue;
    const hb = guessBrandFromHandle(handle);
    if (asciiBrandKey(hb) !== asciiBrandKey(vb)) bad.push({ price_id: r.price_id, vb, hb, handle });
  }

  console.log(`MISMATCHED rows: ${bad.length}`);
  const byPair: Record<string, number> = {};
  for (const b of bad) byPair[`${b.hb} -> ${b.vb}`] = (byPair[`${b.hb} -> ${b.vb}`] || 0) + 1;
  for (const [k, v] of Object.entries(byPair).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);

  if (write && bad.length) {
    const ids = bad.map((b) => b.price_id);
    for (let i = 0; i < ids.length; i += 500) {
      const { error: delErr } = await sb.from("price_history").delete().in("price_id", ids.slice(i, i + 500));
      if (delErr) throw delErr;
    }
    console.log(`DELETED ${ids.length} mismatched row(s).`);
  } else if (bad.length) {
    console.log("(report only — pass --write to delete)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
