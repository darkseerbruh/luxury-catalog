/** Throwaway archivist probe: what does decoding HTML entities + mojibake actually
 *  recover for canonicalModel? Read-only, no writes. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { canonicalModel } from "../src/lib/ingest/model-normalize";
config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const PH = /^unmatched-model|captured for triage|\b(?:discovered|crawl|sweep)\s+\d{4}-\d{2}-\d{2}/i;

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", deg: "°",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", Eacute: "É", Egrave: "È", Ecirc: "Ê",
  agrave: "à", acirc: "â", aacute: "á", auml: "ä", Agrave: "À", Acirc: "Â", Aacute: "Á",
  ccedil: "ç", Ccedil: "Ç", iuml: "ï", icirc: "î", iacute: "í", Iuml: "Ï",
  ograve: "ò", ocirc: "ô", oacute: "ó", ouml: "ö", oslash: "ø", Ocirc: "Ô",
  ugrave: "ù", ucirc: "û", uacute: "ú", uuml: "ü", ntilde: "ñ", szlig: "ß",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
};
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]{1,9});/g, (m, n) => (n in NAMED ? NAMED[n] : m))
    .replace(/[​-‍﻿]/g, "");
}

async function main() {
  const rows: any[] = []; let c = 0;
  for (;;) {
    const { data, error } = await sb.from("discovered_listing")
      .select("discovered_id, platform, brand_guess, raw_name, style_guess").is("promoted_variant_id", null)
      .gt("discovered_id", c).order("discovered_id", { ascending: true }).limit(1000);
    if (error) throw error; if (!data?.length) break;
    rows.push(...data); c = data[data.length - 1].discovered_id; if (data.length < 1000) break;
  }
  const ent = /&(?:[a-zA-Z][a-zA-Z0-9]{1,9}|#\d{2,6}|#x[0-9a-fA-F]+);/;
  let n = 0, before = 0, after = 0;
  const gained = new Map<string, number>();
  const stillNull = new Map<string, number>();
  for (const r of rows) {
    const t = ((r.raw_name && !PH.test(r.raw_name)) ? r.raw_name : r.style_guess) ?? "";
    if (!ent.test(t)) continue;
    n++;
    const b = canonicalModel(r.brand_guess ?? "", t);
    const a = canonicalModel(r.brand_guess ?? "", decodeEntities(t));
    if (b) before++;
    if (a) after++;
    if (!b && a) gained.set(`${r.brand_guess} / ${a}`, (gained.get(`${r.brand_guess} / ${a}`) ?? 0) + 1);
    if (!a) stillNull.set(decodeEntities(t).slice(0, 70), (stillNull.get(decodeEntities(t).slice(0, 70)) ?? 0) + 1);
  }
  console.log(`entity-bearing titles: ${n}`);
  console.log(`  canonicalModel resolves BEFORE decode: ${before}`);
  console.log(`  canonicalModel resolves AFTER  decode: ${after}   (+${after - before})\n`);
  console.log("models recovered by decoding:");
  for (const [k, v] of [...gained].sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log("\nstill unresolved after decode (top):");
  for (const [k, v] of [...stillNull].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${String(v).padStart(4)}  ${k}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
