/** Throwaway archivist probe: dump sample raw titles for candidate model tokens,
 *  per brand, from unpromoted discovered_listing rows. Read-only. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PH = /^unmatched-model|captured for triage|\b(?:discovered|crawl|sweep)\s+\d{4}-\d{2}-\d{2}/i;

const WANT: Record<string, string[]> = {
  "Bottega Veneta": ["piazza", "patti", "beak", "shell", "drop", "mount", "ciao ciao"],
  Fendi: ["mama forever", "mamma", "demi jour", "o'lock", "olock", "monster", "f is fendi", "strap you", "zucca"],
  Balenciaga: ["crush", "crushed", "duty free", "mary kate", "cagol", "bazar", "sharp", "explorer", "money", "soft"],
  Burberry: ["buckle", "freya", "dryden", "orchard", "canterbury", "ashby", "lowry", "rocking horse", "note", "\\btb\\b"],
  Coach: ["bennett", "christie", "kelsey", "cora", "madison", "penelope", "klare", "prairie", "kristin", "ava", "signature"],
  "Michael Kors": ["mott", "fulton", "sandrine", "astrid", "savannah", "sutton", "ava", "tassel", "turnlock", "on sale from"],
  "Hermès": ["course", "arcon", "arçon", "cabasellier", "aline", "cinhetic", "clic", "vide", "mosaique", "zipengo"],
  "Louis Vuitton": ["michael", "\\bw tote\\b", "bergamo", "archy", "outdoor", "backup"],
  Dior: ["street chic", "rider", "gallop", "diorcamp", "detective", "roller", "mizza"],
  Gucci: ["\\bnice\\b"],
};

async function main() {
  const rows: any[] = []; let c = 0;
  for (;;) {
    const { data, error } = await sb.from("discovered_listing")
      .select("discovered_id, brand_guess, raw_name, style_guess").is("promoted_variant_id", null)
      .gt("discovered_id", c).order("discovered_id", { ascending: true }).limit(1000);
    if (error) throw error; if (!data?.length) break;
    rows.push(...data); c = data[data.length - 1].discovered_id; if (data.length < 1000) break;
  }
  console.error(`scanned ${rows.length}`);
  for (const [brand, toks] of Object.entries(WANT)) {
    const mine = rows.filter((r) => (r.brand_guess ?? "").toLowerCase().includes(brand.toLowerCase().slice(0, 7)));
    console.log(`\n===== ${brand} (${mine.length} rows) =====`);
    for (const t of toks) {
      const re = new RegExp(t.includes("\\b") ? t : `\\b${t}`, "i");
      const hits = mine.filter((r) => re.test(((r.raw_name && !PH.test(r.raw_name)) ? r.raw_name : r.style_guess) ?? ""));
      console.log(`\n-- "${t}"  n=${hits.length}`);
      const seen = new Set<string>();
      for (const h of hits) {
        const t2 = ((h.raw_name && !PH.test(h.raw_name)) ? h.raw_name : h.style_guess) ?? "";
        const k = t2.toLowerCase().slice(0, 60); if (seen.has(k)) continue; seen.add(k);
        console.log("   " + t2.slice(0, 105));
        if (seen.size >= 7) break;
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
