/**
 * Idempotently create brand rows for houses the residue audit showed recurring
 * backlog demand for (2026-07-09). Provisional tier via tierForNewBrand — the
 * House Standing backfill re-tiers precisely once the brand has recorded prices.
 *
 *   npx tsx supabase/ingest/create-missing-brands.ts [--write]
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm } from "../../src/lib/image-import-core";
import { canonicalBrand } from "../../src/lib/ingest/model-normalize";
import { tierForNewBrand } from "./promote-discovered";

const WRITE = process.argv.includes("--write");

const NEW_BRANDS = [
  "Bulgari", "MCM", "Khaite", "Salvatore Ferragamo", "Christian Louboutin", "Loro Piana",
  // Round 2 (2026-07-09): houses with titled backlog rows + nameable models.
  "Versace", "Marc Jacobs", "Stella McCartney", "Jimmy Choo", "Moynat", "Alaïa",
  "Delvaux", "Alexander Wang", "Judith Leiber",
  // 2026-07-10 backlog demand (banked no_brand listings)
  "Tumi", "Proenza Schouler", "Mansur Gavriel", "Furla",
];

async function main() {
  const { data: brands, error } = await db.from("brand").select("brand_id,name");
  if (error) throw error;
  const existing = new Set((brands ?? []).map((b: { name: string }) => norm(canonicalBrand(b.name))));

  for (const name of NEW_BRANDS) {
    if (existing.has(norm(canonicalBrand(name)))) {
      console.log(`  = exists: ${name}`);
      continue;
    }
    const tier = tierForNewBrand(name);
    if (!WRITE) {
      console.log(`  + would create: ${name} (tier ${tier})`);
      continue;
    }
    const { data, error: insErr } = await db.from("brand").insert({ name, tier }).select("brand_id").single();
    if (insErr) console.error(`  ✗ ${name}: ${insErr.message}`);
    else console.log(`  ✓ created ${name} (brand ${data!.brand_id}, tier ${tier})`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
