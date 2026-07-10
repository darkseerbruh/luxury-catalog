/**
 * One-time cleanup: purge already-banked NON-handbag TRR rows from discovered_listing.
 *
 * Before the ingest category filter (src/lib/ingest/trr.ts `isTrrHandbagListing`), the
 * TRR catch-all adapters banked every row a broad brand search returned — including that
 * house's apparel / shoes / jewelry / watches / accessories. Those can never promote to a
 * bag style (the SLG/apparel gate refuses them a model), so they sit unpromotable and
 * bloat the promotion scan. This removes the backlog the same way the filter now prevents
 * new ones: by the TRR product-URL department, keeping bags + carried pouches (WOC /
 * vanity / belt bag). Only UNPROMOTED rows (promoted_variant_id IS NULL) are ever deleted.
 *
 *   npx tsx supabase/ingest/cleanup-trr-nonbag.ts            # dry run (report only)
 *   npx tsx supabase/ingest/cleanup-trr-nonbag.ts --write    # delete the non-bag rows
 */
import { supabaseAdmin } from "../seed/lib/client";
import { isTrrHandbagListing } from "../../src/lib/ingest/trr";

interface Row {
  discovered_id: number;
  source_url: string;
  raw_name: string | null;
  promoted_variant_id: number | null;
}

const PAGE = 1000;

/** Department token from a TRR product URL, for the dropped-by-category report. */
function dept(url: string): string {
  try {
    const p = new URL(url).pathname.toLowerCase().split("/").filter(Boolean);
    const i = p.indexOf("products");
    if (i < 0) return "?";
    // Jewelry is gender-less (/products/jewelry/…); everything else is /products/<gender>/<dept>/.
    return ["women", "men", "kids"].includes(p[i + 1]) ? p[i + 2] ?? "?" : p[i + 1] ?? "?";
  } catch {
    return "?";
  }
}

async function main() {
  const write = process.argv.includes("--write");

  const drop: Row[] = [];
  let scanned = 0;
  let promotedNonBag = 0;
  const byDept: Record<string, number> = {};

  // Keyset pagination on discovered_id (not offset): the table is written concurrently
  // by other ingest sessions, and offset windows skip rows when the set shifts under you.
  // A monotonic id cursor visits every existing row exactly once regardless of inserts.
  for (let cursor = 0; ; ) {
    const { data, error } = await supabaseAdmin
      .from("discovered_listing")
      .select("discovered_id, source_url, raw_name, promoted_variant_id")
      .eq("platform", "The RealReal")
      .gt("discovered_id", cursor)
      .order("discovered_id", { ascending: true })
      .limit(PAGE);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].discovered_id;
    scanned += rows.length;
    for (const r of rows) {
      if (isTrrHandbagListing(r.source_url, r.raw_name)) continue;
      if (r.promoted_variant_id != null) {
        // A non-bag row that somehow already promoted — leave it, just flag it.
        promotedNonBag++;
        continue;
      }
      drop.push(r);
      const d = dept(r.source_url);
      byDept[d] = (byDept[d] ?? 0) + 1;
    }
    if (rows.length < PAGE) break;
  }

  console.log(`Scanned ${scanned} TRR discovered_listing row(s).`);
  console.log(`Non-handbag, unpromoted -> DROP: ${drop.length}`);
  console.log(`  by department:`, Object.entries(byDept).sort((a, b) => b[1] - a[1]));
  if (promotedNonBag) console.log(`  (${promotedNonBag} non-bag rows already promoted — left in place, review manually)`);
  console.log(`  sample:`);
  for (const r of drop.slice(0, 10)) console.log(`    ${r.raw_name ?? "(no name)"}  ::  ${r.source_url}`);

  if (!write) {
    console.log(`\nDRY RUN — pass --write to delete the ${drop.length} row(s).`);
    return;
  }
  if (drop.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  let deleted = 0;
  const ids = drop.map((r) => r.discovered_id);
  for (let i = 0; i < ids.length; i += PAGE) {
    const chunk = ids.slice(i, i + PAGE);
    const { error } = await supabaseAdmin.from("discovered_listing").delete().in("discovered_id", chunk);
    if (error) throw error;
    deleted += chunk.length;
    console.log(`  deleted ${deleted}/${ids.length}`);
  }
  console.log(`Done. Deleted ${deleted} non-handbag TRR row(s) from discovered_listing.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
