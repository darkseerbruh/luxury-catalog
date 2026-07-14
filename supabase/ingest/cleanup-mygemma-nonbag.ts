/**
 * One-off + re-runnable: purge non-bag accessories (wallets, bag charms, hats, etc.) that
 * the pre-hardening myGemma adapter banked to discovered_listing before mygemma-awin.ts
 * started gating on the shared isNonBagAccessory classifier. Sibling of cleanup-trr-nonbag.ts.
 *
 *   npx tsx supabase/ingest/cleanup-mygemma-nonbag.ts            # dry run (counts + samples)
 *   npx tsx supabase/ingest/cleanup-mygemma-nonbag.ts --write    # delete
 *
 * SAFE: only UNPROMOTED rows (promoted_variant_id IS NULL) are ever deleted — anything already
 * promoted to a catalog page is left alone. Uses the SAME classifier the ingest now applies, so
 * it keeps the real edge-case bags (Wallet on Chain, Vanity Case, The Pouch). Needs .env.local.
 */
import { supabaseAdmin as sb } from "../seed/lib/client";
import { isNonBagAccessory } from "../../src/lib/ingest/model-normalize";

interface Row { discovered_id: number; raw_name: string | null; style_guess: string | null; promoted_variant_id: number | null }

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const doomed: number[] = [];
  const samples: string[] = [];
  let cursor = 0, scanned = 0;

  // Keyset pagination on discovered_id (table is written concurrently by the ingest).
  for (;;) {
    const { data, error } = await sb
      .from("discovered_listing")
      .select("discovered_id, raw_name, style_guess, promoted_variant_id")
      .eq("platform", "myGemma")
      .is("promoted_variant_id", null)
      .gt("discovered_id", cursor)
      .order("discovered_id", { ascending: true })
      .limit(1000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].discovered_id;
    for (const r of rows) {
      scanned++;
      const title = r.style_guess || r.raw_name || "";
      if (!isNonBagAccessory(title)) continue; // keeps real bags incl. WOC/Vanity/Pouch
      doomed.push(r.discovered_id);
      if (samples.length < 15) samples.push(title);
    }
  }

  console.log(`Scanned ${scanned} unpromoted myGemma discovered rows.`);
  console.log(`Non-bag accessories to remove: ${doomed.length}`);
  console.log("Samples:", samples);
  if (!write) { console.log("\nDRY RUN — pass --write to delete."); return; }
  if (doomed.length === 0) return;

  let deleted = 0;
  for (let i = 0; i < doomed.length; i += 500) {
    const { error } = await sb.from("discovered_listing").delete().in("discovered_id", doomed.slice(i, i + 500));
    if (error) throw new Error(`delete failed: ${error.message}`);
    deleted += Math.min(500, doomed.length - i);
  }
  console.log(`Deleted ${deleted} non-bag myGemma discovered row(s).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
