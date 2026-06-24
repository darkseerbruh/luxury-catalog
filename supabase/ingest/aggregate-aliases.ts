/**
 * Reseller-alias aggregation (read-only, no DB).
 *
 * Every captured listing carries the NAME its marketplace uses. This groups all
 * captured listings by canonical (brand, model) and collects the distinct names each
 * platform applies — the emergent "also known as" set, free from data we already hold.
 * Output feeds the bag page's alias block + JSON-LD alternateName (GEO).
 *
 *   npx tsx supabase/ingest/aggregate-aliases.ts
 *   -> writes data/ingest/_raw/reseller-aliases.json + prints a sample
 */
import fs from "fs";
import path from "path";
import { canonicalBrand, canonicalModel, bagTier } from "../../src/lib/ingest/model-normalize";

const RAW = path.resolve(__dirname, "../../data/ingest/_raw");

interface Listing { platform: string; brand: string; name: string; }

function loadListings(): Listing[] {
  const out: Listing[] = [];
  // TheRealReal brand sweeps: {brand, name}
  for (const f of fs.readdirSync(RAW).filter((f) => /^trr-.*-all\.json$/.test(f))) {
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8")) as Array<{ name?: string; brand?: string; url?: string }>;
      for (const r of arr) {
        if (!r?.name) continue;
        if (!/\/handbags\/|\/men\/bags\//.test(r.url ?? "")) continue; // bags only (URL category)
        out.push({ platform: "TheRealReal", brand: r.brand ?? "", name: r.name });
      }
    } catch { /* skip */ }
  }
  // Fashionphile dump: brand lives in the handle, model name in the title
  const fp = path.join(RAW, "fashionphile.json");
  if (fs.existsSync(fp)) {
    try {
      const arr = JSON.parse(fs.readFileSync(fp, "utf8")) as Array<{ product?: { title?: string; handle?: string } }>;
      for (const e of arr) {
        const title = e?.product?.title, handle = e?.product?.handle;
        if (title && handle) out.push({ platform: "Fashionphile", brand: handle, name: title });
      }
    } catch { /* skip */ }
  }
  return out;
}

function main() {
  const listings = loadListings();
  // key = "Brand|Model" -> platform -> name -> count
  const groups = new Map<string, { brand: string; model: string; tier: string; byPlatform: Map<string, Map<string, number>> }>();
  let mapped = 0;
  for (const l of listings) {
    const brand = canonicalBrand(l.brand);
    const model = canonicalModel(brand, l.name);
    if (!model) continue; // only aggregate listings we can place on a canonical model
    mapped++;
    const key = `${brand}|${model}`;
    let g = groups.get(key);
    if (!g) { g = { brand, model, tier: bagTier(brand, model) ?? "named", byPlatform: new Map() }; groups.set(key, g); }
    if (!g.byPlatform.has(l.platform)) g.byPlatform.set(l.platform, new Map());
    const m = g.byPlatform.get(l.platform)!;
    m.set(l.name, (m.get(l.name) ?? 0) + 1);
  }

  // serialise: brand|model -> { tier, aliases: [{name, source_type:'reseller', source, count}] }
  type Alias = { name: string; source_type: "reseller"; source: string; count: number };
  const out: Record<string, { brand: string; model: string; tier: string; aliases: Alias[] }> = {};
  for (const [key, g] of groups) {
    const aliases: Alias[] = [];
    for (const [platform, names] of g.byPlatform) {
      for (const [name, count] of [...names.entries()].sort((a, b) => b[1] - a[1])) {
        aliases.push({ name, source_type: "reseller", source: platform, count });
      }
    }
    out[key] = { brand: g.brand, model: g.model, tier: g.tier, aliases };
  }
  const outFile = path.join(RAW, "reseller-aliases.json");
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`Listings: ${listings.length} | mapped to a canonical model: ${mapped} | distinct (brand,model) groups: ${groups.size}`);
  console.log(`-> ${outFile}\n`);

  // Sample: a few high-variety groups (most distinct reseller names) to show the payoff
  const ranked = [...groups.values()]
    .map((g) => ({ g, variety: [...g.byPlatform.values()].reduce((s, m) => s + m.size, 0) }))
    .sort((a, b) => b.variety - a.variety).slice(0, 8);
  for (const { g } of ranked) {
    console.log(`${g.brand} ${g.model}  [${g.tier}]`);
    for (const [platform, names] of g.byPlatform) {
      const top = [...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => `"${n}" ×${c}`);
      console.log(`   ${platform}: ${top.join("  ·  ")}`);
    }
  }
}

main();
