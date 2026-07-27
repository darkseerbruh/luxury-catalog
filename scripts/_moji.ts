/** Throwaway archivist probe: mojibake + entity + placeholder scan on stored titles,
 *  broken out by platform. Read-only. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PH = /^unmatched-model|captured for triage|\b(?:discovered|crawl|sweep)\s+\d{4}-\d{2}-\d{2}/i;

const PATTERNS: [string, RegExp][] = [
  ["html-entity (&xxx;)", /&[a-zA-Z]{2,8};/],
  ["numeric entity (&#nnn;)", /&#\d{2,6};/],
  ["mojibake Ã/â/Â", /[ÃâÂ][-¿ -⁯]?/],
  ["literal 'â' run", /â[€™œ]/],
  ["replacement char", /�/],
  ["zero-width", /[​-‍﻿]/],
  ["scraper junk 'on sale from'", /on sale from/i],
];

async function main() {
  const rows: any[] = []; let c = 0;
  for (;;) {
    const { data, error } = await sb.from("discovered_listing")
      .select("discovered_id, platform, brand_guess, raw_name, style_guess").is("promoted_variant_id", null)
      .gt("discovered_id", c).order("discovered_id", { ascending: true }).limit(1000);
    if (error) throw error; if (!data?.length) break;
    rows.push(...data); c = data[data.length - 1].discovered_id; if (data.length < 1000) break;
  }
  const titles = rows.map((r) => ({
    p: r.platform ?? "?", b: r.brand_guess ?? "?",
    t: ((r.raw_name && !PH.test(r.raw_name)) ? r.raw_name : r.style_guess) ?? "",
  }));
  console.log(`scanned ${titles.length} unpromoted titles\n`);
  for (const [label, re] of PATTERNS) {
    const hits = titles.filter((x) => re.test(x.t));
    const byP = new Map<string, number>(), byB = new Map<string, number>();
    for (const h of hits) { byP.set(h.p, (byP.get(h.p) ?? 0) + 1); byB.set(h.b, (byB.get(h.b) ?? 0) + 1); }
    console.log(`## ${label}: ${hits.length}`);
    console.log("   platforms: " + [...byP].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(", "));
    console.log("   brands:    " + [...byB].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}=${v}`).join(", "));
    for (const h of hits.slice(0, 4)) console.log("   ex: " + h.t.slice(0, 95));
    console.log();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
