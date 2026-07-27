/**
 * dictionary-gap-report.ts — WHY don't discovered listings resolve to a style, and what
 * is the shortest path to unlocking the most rows?
 *
 * Promotion only attaches a listing to an EXISTING style when canonicalModel(brand, title)
 * hits the dictionary in src/lib/ingest/model-normalize.ts. On 2026-07-26 only ~6% of the
 * 326,857-row backlog resolved, so the rest can't be promoted without inventing a style
 * name from the seller's title (junk). This report says WHICH gap is responsible:
 *
 *   A. brand-missing  — canonicalBrand() maps to a brand with no MODELS entry at all
 *   B. model-missing  — brand IS in the dictionary, but no model token matched
 *   C. slg/accessory  — correctly excluded (card holder, wallet, tech case…)
 *   D. matched        — already resolvable
 *
 * For bucket B it also extracts the CANDIDATE MODEL NAME: the title with the brand,
 * the already-parsed material/colour/hardware, the size, and generic silhouette nouns
 * subtracted. What survives is almost always the model word the dictionary is missing.
 * Ranked by row count, that list is the dictionary worklist, highest-leverage first.
 *
 * Read-only. Writes nothing.
 *
 *   npx tsx scripts/dictionary-gap-report.ts [--top=N] [--platform="The Luxury Closet"]
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import {
  canonicalBrand,
  canonicalModel,
  isNonBagAccessory,
  NORMALIZED_BRANDS,
} from "../src/lib/ingest/model-normalize";

config({ path: ".env.local" });

const argv = process.argv.slice(2);
const TOP = Number(argv.find((a) => a.startsWith("--top="))?.slice(6) ?? 25);
const PLATFORM = argv.find((a) => a.startsWith("--platform="))?.slice(11) ?? null;
const BRAND = argv.find((a) => a.startsWith("--brand="))?.slice(8)?.toLowerCase() ?? null;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

type Row = {
  id: number;
  platform: string | null;
  brandGuess: string | null;
  rawName: string | null;
  styleGuess: string | null;
  material: string | null;
  colorway: string | null;
  hardware: string | null;
  size: string | null;
};

/** Keyset-paginate on the PK — never .range(), which degrades badly past ~100k rows. */
async function loadUnpromoted(): Promise<Row[]> {
  const rows: Row[] = [];
  let cursor = 0;
  for (;;) {
    let q = sb
      .from("discovered_listing")
      .select(
        "discovered_id, platform, brand_guess, raw_name, style_guess, material, colorway, hardware_color, size_label",
      )
      .is("promoted_variant_id", null)
      .gt("discovered_id", cursor)
      .order("discovered_id", { ascending: true })
      .limit(1000);
    if (PLATFORM) q = q.eq("platform", PLATFORM);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const r of data as Array<Record<string, unknown>>) {
      rows.push({
        id: Number(r.discovered_id),
        platform: (r.platform as string) ?? null,
        brandGuess: (r.brand_guess as string) ?? null,
        rawName: (r.raw_name as string) ?? null,
        styleGuess: (r.style_guess as string) ?? null,
        material: (r.material as string) ?? null,
        colorway: (r.colorway as string) ?? null,
        hardware: (r.hardware_color as string) ?? null,
        size: (r.size_label as string) ?? null,
      });
    }
    cursor = rows[rows.length - 1].id;
    if (data.length < 1000) break;
  }
  return rows;
}

/**
 * The REAL seller title. For The Luxury Closet (97% of its rows) and Rebag (99%), the
 * catch-all ingest parks a placeholder in raw_name and puts the actual title in
 * style_guess. Anything reading raw_name first is matching against literal boilerplate.
 */
const PLACEHOLDER_RX = /^unmatched-model|captured for triage|\b(?:discovered|crawl|sweep)\s+\d{4}-\d{2}-\d{2}/i;
function realTitle(r: Row): string | null {
  const raw = r.rawName;
  if (raw && !PLACEHOLDER_RX.test(raw)) return raw;
  return r.styleGuess ?? raw;
}

/** Generic silhouette / size / filler words that are never the distinguishing model name. */
const GENERIC = new Set(
  `bag bags handbag purse tote totes satchel crossbody cross body shoulder clutch hobo
   backpack bucket messenger shopper shopping boston duffle duffel bowling pouch flap
   chain top handle mini small medium large maxi jumbo micro nano petite grande gm pm bb mm
   new vintage authentic auth rare limited edition ltd genuine pre owned preowned used
   womens women mens men ladies unisex the a and with in for of by
   leather calfskin lambskin caviar agneau nappa goatskin canvas denim suede satin velvet
   patent epi damier monogram saffiano tweed shearling python ostrich crocodile croc
   alligator togo clemence epsom swift chevre box quilted aged grained smooth embossed
   coated shiny glazed pebbled textured printed print
   black white beige brown tan navy blue red pink green grey gray ivory cream gold silver
   purple yellow orange burgundy taupe nude multicolor multicolour optic noir blanc light
   dark tri color colour bicolor
   hardware ghw shw rhw phw ruthenium palladium plated metal
   size cm inch`
    .split(/\s+/)
    .filter(Boolean),
);

/** Subtract brand, already-parsed attributes, and generic words. What's left is the
 *  candidate model name the dictionary is missing. */
const foldAccents = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function candidateModel(r: Row): string {
  let t = ` ${foldAccents((realTitle(r) ?? "").toLowerCase())} `;
  // Subtract values we ALREADY parsed into columns (the per-seller ingest did this work).
  for (const v of [r.brandGuess, r.material, r.colorway, r.hardware, r.size]) {
    if (!v) continue;
    for (const word of foldAccents(v.toLowerCase()).split(/[\s/,()-]+/).filter((w) => w.length > 2)) {
      t = t.split(` ${word} `).join(" ");
    }
  }
  return t
    .replace(/[^a-z0-9\s'&.-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !GENERIC.has(w) && !/^\d+$/.test(w))
    .slice(0, 4)
    .join(" ")
    .trim();
}

const bar = (n: number, max: number, w = 28) =>
  "█".repeat(Math.max(0, Math.round((n / Math.max(max, 1)) * w)));

async function main() {
  const rows = await loadUnpromoted();
  const known = new Set(NORMALIZED_BRANDS.map((b) => b.toLowerCase()));
  console.log(
    `dictionary-gap-report: ${rows.length} unpromoted rows${PLATFORM ? ` (platform=${PLATFORM})` : ""}\n`,
  );

  const bucket = { matched: 0, slg: 0, brandMissing: 0, modelMissing: 0, noBrand: 0 };
  /** brand -> rows we would unlock by covering its missing models. */
  const brandGap = new Map<string, number>();
  /** "brand :: candidate" -> count. */
  const candidates = new Map<string, number>();
  /** brand -> which platforms feed its gap. */
  const brandPlatforms = new Map<string, Map<string, number>>();

  for (const r of rows) {
    const brand = canonicalBrand((r.brandGuess ?? "").trim());
    if (!brand) { bucket.noBrand++; continue; }
    if (BRAND && brand.toLowerCase() !== BRAND) continue;
    const title = realTitle(r);
    if (canonicalModel(brand, title)) { bucket.matched++; continue; }
    if (isNonBagAccessory(title)) { bucket.slg++; continue; }
    if (!known.has(brand.toLowerCase())) bucket.brandMissing++;
    else bucket.modelMissing++;
    brandGap.set(brand, (brandGap.get(brand) ?? 0) + 1);
    const cand = candidateModel(r);
    if (cand) {
      const k = `${brand} :: ${cand}`;
      candidates.set(k, (candidates.get(k) ?? 0) + 1);
    }
    const pm = brandPlatforms.get(brand) ?? new Map<string, number>();
    pm.set(r.platform ?? "(null)", (pm.get(r.platform ?? "(null)") ?? 0) + 1);
    brandPlatforms.set(brand, pm);
  }

  const tot = rows.length || 1;
  const p = (n: number) => `${((100 * n) / tot).toFixed(1)}%`.padStart(6);
  console.log("WHY ROWS DON'T RESOLVE");
  console.log("-".repeat(64));
  console.log(`  matched (promotable now)     ${String(bucket.matched).padStart(7)}  ${p(bucket.matched)}`);
  console.log(`  SLG / accessory (correct)    ${String(bucket.slg).padStart(7)}  ${p(bucket.slg)}`);
  console.log(`  brand NOT in dictionary      ${String(bucket.brandMissing).padStart(7)}  ${p(bucket.brandMissing)}`);
  console.log(`  brand known, MODEL missing   ${String(bucket.modelMissing).padStart(7)}  ${p(bucket.modelMissing)}`);
  console.log(`  no brand guess at all        ${String(bucket.noBrand).padStart(7)}  ${p(bucket.noBrand)}`);

  const topBrands = [...brandGap.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP);
  const maxB = topBrands[0]?.[1] ?? 1;
  console.log(`\n\nTOP ${TOP} BRANDS BY ROWS UNLOCKED (fix these dictionaries first)`);
  console.log("-".repeat(78));
  for (const [b, n] of topBrands) {
    const inDict = known.has(b.toLowerCase()) ? "model gap" : "NO BRAND ENTRY";
    console.log(`  ${b.padEnd(24)} ${String(n).padStart(7)}  ${bar(n, maxB)} ${inDict}`);
  }

  const topCands = [...candidates.entries()].sort((a, b) => b[1] - a[1]).slice(0, BRAND ? TOP * 3 : TOP * 2);
  console.log(`\n\nTOP CANDIDATE MODEL NAMES TO ADD (brand already in the dictionary)`);
  console.log("-".repeat(78));
  for (const [k, n] of topCands) console.log(`  ${String(n).padStart(6)}  ${k}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
