/**
 * probe-seller-title-grammar.ts — WHO is generating the unpromotable titles?
 *
 * The promotion backlog stalls because most discovered listings can't be matched to a
 * canonical style: the seller's title bakes material/colour/hardware into the name, so
 * "find-or-create style" would mint junk like
 *   "Aged Calfskin Quilted Mini Reissue Wallet On Chain WOC So Black".
 *
 * Before writing per-seller parse rules we need to know which sellers actually cause it,
 * and whether each seller's titles follow a CONSISTENT grammar (a rule only pays off if
 * the seller is predictable). Also reports how much of each seller's attribute data is
 * ALREADY parsed into the material/colorway/hardware_color columns, since a seller that
 * is already parsed needs a matcher fix, not a parser. Read-only.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

type Row = {
  id: number;
  platform: string | null;
  rawName: string | null;
  styleGuess: string | null;
  matchedStyle: number | null;
  material: string | null;
  colorway: string | null;
  hardware: string | null;
};

/** Keyset-paginate (never .range()) over unpromoted discovered listings. */
async function fetchUnpromoted(): Promise<Row[]> {
  const rows: Row[] = [];
  let cursor = 0;
  for (;;) {
    const { data, error } = await sb
      .from("discovered_listing")
      .select(
        "discovered_id, platform, raw_name, style_guess, matched_style_id, material, colorway, hardware_color",
      )
      .is("promoted_variant_id", null)
      .gt("discovered_id", cursor)
      .order("discovered_id", { ascending: true })
      .limit(1000);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const r of data as Array<Record<string, unknown>>) {
      rows.push({
        id: Number(r.discovered_id),
        platform: (r.platform as string) ?? null,
        rawName: (r.raw_name as string) ?? null,
        styleGuess: (r.style_guess as string) ?? null,
        matchedStyle: (r.matched_style_id as number) ?? null,
        material: (r.material as string) ?? null,
        colorway: (r.colorway as string) ?? null,
        hardware: (r.hardware_color as string) ?? null,
      });
    }
    cursor = rows[rows.length - 1].id;
    if (data.length < 1000) break;
  }
  return rows;
}

const ATTR =
  /\b(calfskin|lambskin|caviar|agneau|nappa|goatskin|canvas|denim|suede|satin|velvet|patent|epi|damier|monogram|saffiano|leather|tweed|shearling|python|ostrich|croc(odile)?|alligator|togo|clemence|epsom|swift|chevre|box calf|quilted|aged|grained|smooth|embossed)\b/i;
const COLOUR =
  /\b(black|white|beige|brown|tan|navy|blue|red|pink|green|grey|gray|ivory|cream|gold|silver|purple|yellow|orange|burgundy|taupe|nude|multicolou?r|optic|noir|blanc)\b/i;
const HARDWARE = /\b(ghw|shw|rhw|phw|gold hardware|silver hardware|ruthenium|palladium|so black)\b/i;

const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((100 * a) / b));

async function main() {
  const rows = await fetchUnpromoted();
  console.log(`unpromoted discovered_listing rows read: ${rows.length}\n`);

  type Stat = {
    n: number;
    attrInTitle: number;
    colourInTitle: number;
    hwInTitle: number;
    words: number;
    matched: number;
    hasMaterialCol: number;
    hasColourCol: number;
    ex: string[];
  };
  const by = new Map<string, Stat>();

  for (const r of rows) {
    const p = r.platform ?? "(null)";
    // style_guess is what promotion would turn into a style NAME, so grade that when
    // present; fall back to the raw title.
    const t = (r.styleGuess ?? r.rawName ?? "").trim();
    if (!t) continue;
    let s = by.get(p);
    if (!s) {
      s = { n: 0, attrInTitle: 0, colourInTitle: 0, hwInTitle: 0, words: 0, matched: 0, hasMaterialCol: 0, hasColourCol: 0, ex: [] };
      by.set(p, s);
    }
    s.n++;
    if (ATTR.test(t)) s.attrInTitle++;
    if (COLOUR.test(t)) s.colourInTitle++;
    if (HARDWARE.test(t)) s.hwInTitle++;
    s.words += t.split(/\s+/).length;
    if (r.matchedStyle != null) s.matched++;
    if (r.material) s.hasMaterialCol++;
    if (r.colorway) s.hasColourCol++;
    if (s.ex.length < 8 && ATTR.test(t)) s.ex.push(t);
  }

  const sorted = [...by.entries()].sort((a, b) => b[1].n - a[1].n);

  console.log("Grading style_guess (what promotion would mint as a style name).\n");
  console.log(
    "SELLER                       rows   %matl  %colr   %hw   avgW   %matched   %matl-col  %colr-col",
  );
  console.log("-".repeat(104));
  for (const [p, s] of sorted) {
    console.log(
      [
        p.padEnd(26),
        String(s.n).padStart(7),
        `${String(pct(s.attrInTitle, s.n)).padStart(5)}%`,
        `${String(pct(s.colourInTitle, s.n)).padStart(5)}%`,
        `${String(pct(s.hwInTitle, s.n)).padStart(4)}%`,
        (s.words / s.n).toFixed(1).padStart(6),
        `${String(pct(s.matched, s.n)).padStart(8)}%`,
        `${String(pct(s.hasMaterialCol, s.n)).padStart(9)}%`,
        `${String(pct(s.hasColourCol, s.n)).padStart(9)}%`,
      ].join("  "),
    );
  }

  console.log("\n\nSAMPLE style_guess VALUES CONTAINING MATERIAL WORDS\n" + "=".repeat(104));
  for (const [p, s] of sorted) {
    if (!s.ex.length) continue;
    console.log(`\n── ${p}  (n=${s.n}, ${pct(s.attrInTitle, s.n)}% carry a material word)`);
    for (const e of s.ex) console.log(`   ${e}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
