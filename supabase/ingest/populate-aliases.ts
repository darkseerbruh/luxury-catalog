/**
 * Populate `bag_alias` (migration 0031) from three sources:
 *   official  — the canonical model name itself (from the reseller-aggregation keys)
 *   reseller  — top representative title each platform uses (from aggregate-aliases.ts output)
 *   community — collector nicknames (supabase/seed/research/community-bag-nicknames.json)
 *
 * Run aggregate-aliases.ts first (writes reseller-aliases.json). Dry-run by default.
 *   npx tsx supabase/ingest/populate-aliases.ts [--write]
 * Requires migration 0031 applied for --write.
 */
import fs from "fs";
import path from "path";

const RESELLER = path.resolve(__dirname, "../../data/ingest/_raw/reseller-aliases.json");
const COMMUNITY = path.resolve(__dirname, "../seed/research/community-bag-nicknames.json");
const TOP_RESELLER_PER_PLATFORM = 3;

interface Row { brand: string; canonical_model: string; tier: string | null; alias: string; source_type: "official" | "reseller" | "community"; source: string | null; listing_count: number; }

function build(): Row[] {
  const rows: Row[] = [];
  const seen = new Set<string>();
  const add = (r: Row) => {
    const k = `${r.brand}|${r.canonical_model}|${r.alias.toLowerCase()}|${r.source ?? ""}`;
    if (seen.has(k)) return; seen.add(k); rows.push(r);
  };

  // reseller + official, from the aggregation
  if (fs.existsSync(RESELLER)) {
    const agg = JSON.parse(fs.readFileSync(RESELLER, "utf8")) as Record<string, { brand: string; model: string; tier: string; aliases: { name: string; source: string; count: number }[] }>;
    for (const g of Object.values(agg)) {
      add({ brand: g.brand, canonical_model: g.model, tier: g.tier, alias: g.model, source_type: "official", source: "canonical", listing_count: g.aliases.reduce((s, a) => s + a.count, 0) });
      const byPlatform = new Map<string, { name: string; count: number }[]>();
      for (const a of g.aliases) { if (!byPlatform.has(a.source)) byPlatform.set(a.source, []); byPlatform.get(a.source)!.push(a); }
      for (const [platform, list] of byPlatform) {
        for (const a of list.sort((x, y) => y.count - x.count).slice(0, TOP_RESELLER_PER_PLATFORM)) {
          add({ brand: g.brand, canonical_model: g.model, tier: g.tier, alias: a.name, source_type: "reseller", source: platform, listing_count: a.count });
        }
      }
    }
  }

  // community nicknames
  if (fs.existsSync(COMMUNITY)) {
    const c = JSON.parse(fs.readFileSync(COMMUNITY, "utf8"));
    for (const e of c.named ?? []) for (const nick of e.community ?? [])
      add({ brand: e.brand, canonical_model: e.model, tier: null, alias: nick, source_type: "community", source: "collector", listing_count: 0 });
    // seasonal/runway pieces with no official name: the community name IS the canonical
    for (const e of c.seasonal_community_named ?? []) {
      add({ brand: e.brand, canonical_model: e.name, tier: "seasonal", alias: e.name, source_type: "official", source: "community-coined", listing_count: 0 });
      for (const nick of e.community ?? [])
        add({ brand: e.brand, canonical_model: e.name, tier: "seasonal", alias: nick, source_type: "community", source: "collector", listing_count: 0 });
    }
  }
  return rows;
}

async function main() {
  const rows = build();
  const write = process.argv.includes("--write");
  const byType = rows.reduce<Record<string, number>>((m, r) => ((m[r.source_type] = (m[r.source_type] ?? 0) + 1), m), {});
  console.log(`Built ${rows.length} alias rows:`, byType);
  console.log("sample:", rows.slice(0, 6).map((r) => `${r.brand}/${r.canonical_model} = "${r.alias}" [${r.source_type}:${r.source}]`));
  if (!write) { console.log("\nDRY RUN — pass --write to upsert into bag_alias (needs migration 0031)."); return; }
  const { supabaseAdmin: db } = await import("../seed/lib/client");
  let n = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("bag_alias").upsert(rows.slice(i, i + 500), { onConflict: "brand,canonical_model,alias,source", ignoreDuplicates: true });
    if (error) throw error; n += Math.min(500, rows.length - i);
  }
  console.log(`Upserted ${n} alias rows into bag_alias.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
