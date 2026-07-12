/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Seed the production_option table (migration 0054) from the archivist production matrix
 * (docs/research-drafts/classic-flap-production-matrix.md). One reviewed source of what each
 * style was PRODUCED in; the selector reads it so options reflect production, not our listings.
 *
 * Idempotent per style: deletes that style's rows, re-inserts the reviewed set. Run AFTER the
 * migration is applied (errors clearly otherwise).
 *   npx tsx supabase/ingest/load-production-options.ts            # dry run
 *   npx tsx supabase/ingest/load-production-options.ts --write    # apply
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

type Row = {
  axis: "size" | "color" | "material" | "construction" | "hardware";
  value: string;
  permanence?: "permanent" | "seasonal";
  season_code?: string;
  is_default?: boolean;
  note?: string;
  sort_order: number;
};

const SRC = "Archivist 2026-07-11/12; classic-flap-production-matrix.md";

// Chanel Classic Flap (11.12), style_id 1. Sourced axis values; NOT a combination matrix
// (Chanel makes most combos, and seasonal colours have no official names — those are captured
// per-listing as descriptor + season code, never seeded as fake named options here).
const CLASSIC_FLAP: Row[] = [
  // Sizes (all permanent; Maxi CONFIRMED current 2026-07-12, code A58601)
  { axis: "size", value: "Small", permanence: "permanent", sort_order: 1 },
  { axis: "size", value: "Medium (M/L)", permanence: "permanent", is_default: true, note: "most-produced size; ~25.5 cm", sort_order: 2 },
  { axis: "size", value: "Jumbo", permanence: "permanent", note: "boutique word is 'Large'", sort_order: 3 },
  { axis: "size", value: "Maxi", permanence: "permanent", note: "current size, code A58601", sort_order: 4 },
  // Materials
  { axis: "material", value: "Caviar", permanence: "permanent", is_default: true, note: "grained calfskin, holds shape", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", note: "smooth, more delicate", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Denim", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Jersey", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Velvet", permanence: "seasonal", sort_order: 7 },
  { axis: "material", value: "Iridescent", permanence: "seasonal", note: "iridescent/ombré calfskin", sort_order: 8 },
  // Construction / quilting
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "construction", value: "Chevron", permanence: "permanent", note: "genuine seasonal variation, same price", sort_order: 2 },
  // Permanent colour families (seasonal colours are captured per-listing, not seeded)
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black caviar + gold = most requested", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry→bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];

// Chanel Boy (style 424), archivist-sourced 2026-07-12 (Fashionphile/Baghunter/Rebag/SACLÀB).
// Old vs New Medium are two real sizes; XL discontinued; Mini seasonal. Hardware is a real Boy
// axis (ruthenium signature). Same "no official seasonal colour names" regime as the Flap.
const BOY: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~20 cm", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "'Old Medium', ~25 cm", sort_order: 2 },
  { axis: "size", value: "New Medium", permanence: "permanent", is_default: true, note: "~28 cm, most common on the market", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~30 cm, scarce", sort_order: 4 },
  { axis: "size", value: "XL", note: "discontinued, produced 2013-2014 only", sort_order: 5 },
  { axis: "size", value: "Mini", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Calfskin", permanence: "permanent", is_default: true, note: "launch leather, plain or glazed", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", sort_order: 2 },
  { axis: "material", value: "Caviar", permanence: "permanent", sort_order: 3 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Velvet", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Sequin", permanence: "seasonal", sort_order: 7 },
  { axis: "material", value: "Metallic", permanence: "seasonal", sort_order: 8 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / galuchat, historic", sort_order: 9 },
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "construction", value: "Chevron", permanence: "permanent", note: "standard Boy variant, same tier", sort_order: 2 },
  { axis: "construction", value: "Plain", permanence: "seasonal", note: "smooth / unquilted", sort_order: 3 },
  { axis: "hardware", value: "Ruthenium", permanence: "permanent", is_default: true, note: "the Boy's signature antiqued tone", sort_order: 1 },
  { axis: "hardware", value: "Aged gold", permanence: "permanent", sort_order: 2 },
  { axis: "hardware", value: "Gold", permanence: "permanent", sort_order: 3 },
  { axis: "hardware", value: "Silver", permanence: "permanent", sort_order: 4 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "black-on-black hardware, sought after", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor, with ruthenium or antique-gold", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", sort_order: 5 },
];

// Chanel 2.55 Reissue (style 423). Facts from the prior flap-decoder archivist runs
// (Mademoiselle rectangular lock, aged all-metal chain, 2005 reissue of the Feb 1955 original,
// numeric size codes) + Chanel's house-wide permanent palette (archivist-confirmed same as the
// Flap/Boy). Reissue's signature exterior is aged/distressed calfskin; it is diamond-quilted.
const REISSUE: Row[] = [
  { axis: "size", value: "224", permanence: "permanent", note: "small", sort_order: 1 },
  { axis: "size", value: "225", permanence: "permanent", note: "~24 cm", sort_order: 2 },
  { axis: "size", value: "226", permanence: "permanent", is_default: true, note: "~28 cm, most common", sort_order: 3 },
  { axis: "size", value: "227", permanence: "permanent", note: "~28 cm, larger", sort_order: 4 },
  { axis: "size", value: "228", permanence: "permanent", note: "maxi", sort_order: 5 },
  { axis: "size", value: "Mini", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Aged Calfskin", permanence: "permanent", is_default: true, note: "the Reissue's signature distressed leather", sort_order: 1 },
  { axis: "material", value: "Caviar", permanence: "permanent", sort_order: 2 },
  { axis: "material", value: "Lambskin", permanence: "permanent", sort_order: 3 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Metallic", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python etc., historic", sort_order: 6 },
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "hardware", value: "Aged gold", permanence: "permanent", is_default: true, note: "antiqued, with the Mademoiselle lock + aged all-metal chain", sort_order: 1 },
  { axis: "hardware", value: "Aged ruthenium", permanence: "permanent", sort_order: 2 },
  { axis: "hardware", value: "Gold", permanence: "permanent", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", sort_order: 5 },
];

// LV Speedy (style 433), archivist-sourced 2026-07-12 (LV.com / PurseBlog / Yoogi's). LV's
// PRIMARY axis is the CANVAS/material (Monogram default, Damier Ebene/Azur, Empreinte leather);
// colour only varies inside the leather lines (Empreinte/Epi) and LV names are OFFICIAL. Strap
// (Bandoulière) is a construction flag, not a size. Hardware is fixed per line, not an axis.
const LV_SPEEDY: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~16 cm, with strap", sort_order: 1 },
  { axis: "size", value: "20", permanence: "permanent", note: "~20 cm", sort_order: 2 },
  { axis: "size", value: "25", permanence: "permanent", note: "~25 cm, added 1959", sort_order: 3 },
  { axis: "size", value: "30", permanence: "permanent", is_default: true, note: "the original 1930 size, most popular", sort_order: 4 },
  { axis: "size", value: "35", permanence: "permanent", note: "reduced availability", sort_order: 5 },
  { axis: "size", value: "40", permanence: "permanent", note: "travel size, mostly Monogram", sort_order: 6 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated canvas, natural vachetta trim", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin, the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Epi", permanence: "seasonal", note: "textured leather, intermittent runs", sort_order: 5 },
  { axis: "material", value: "Vernis", permanence: "seasonal", note: "patent leather", sort_order: 6 },
  { axis: "material", value: "Denim", permanence: "seasonal", sort_order: 7 },
  { axis: "construction", value: "Standard", permanence: "permanent", is_default: true, note: "handheld", sort_order: 1 },
  { axis: "construction", value: "Bandoulière", permanence: "permanent", note: "adds a detachable strap + two-way zip (since 2011)", sort_order: 2 },
  // Colour applies only to the leather lines (Empreinte/Epi); LV names are official. Noir is the anchor.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte/Epi 'Noir'; canvas lines take no colour choice", sort_order: 1 },
];

// LV Neverfull (style 218). Same LV canvas-primary model as the Speedy: the core canvases
// (Monogram default, Damier Ebene/Azur, Empreinte leather) are the well-established Neverfull
// lines; sizes PM/MM/GM are universal (MM most popular). Colour applies to Empreinte only.
const LV_NEVERFULL: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", note: "~29 cm", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "~32 cm, the most popular", sort_order: 2 },
  { axis: "size", value: "GM", permanence: "permanent", note: "~39 cm, the largest", sort_order: 3 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated canvas, vachetta trim", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin, the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Vernis", permanence: "seasonal", note: "patent, limited", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte anchor; canvas lines take no colour choice", sort_order: 1 },
];

const STYLES: { styleId: number; name: string; rows: Row[] }[] = [
  { styleId: 1, name: "Classic Flap", rows: CLASSIC_FLAP },
  { styleId: 424, name: "Boy", rows: BOY },
  { styleId: 423, name: "2.55 Reissue", rows: REISSUE },
  { styleId: 433, name: "Speedy", rows: LV_SPEEDY },
  { styleId: 218, name: "Neverfull", rows: LV_NEVERFULL },
];

async function main() {
  console.log(`\nload-production-options ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  // Guard: table must exist (migration 0054 applied).
  const probe = await db.from("production_option").select("id").limit(1);
  if (probe.error) {
    console.error(`  ABORT: production_option not reachable — apply migration 0054 first. (${probe.error.message})`);
    process.exit(1);
  }
  for (const s of STYLES) {
    console.log(`  ${s.name} (style ${s.styleId}): ${s.rows.length} options`);
    const byAxis = s.rows.reduce<Record<string, number>>((a, r) => ((a[r.axis] = (a[r.axis] || 0) + 1), a), {});
    console.log(`     ${JSON.stringify(byAxis)}`);
    if (!WRITE) continue;
    const { error: delErr } = await db.from("production_option").delete().eq("style_id", s.styleId);
    if (delErr) { console.error(`     delete failed: ${delErr.message}`); continue; }
    const payload = s.rows.map((r) => ({
      style_id: s.styleId,
      axis: r.axis,
      value: r.value,
      permanence: r.permanence ?? null,
      season_code: r.season_code ?? null,
      is_default: r.is_default ?? false,
      note: r.note ?? null,
      source: SRC,
      sort_order: r.sort_order,
    }));
    const { error: insErr } = await db.from("production_option").insert(payload);
    if (insErr) { console.error(`     insert failed: ${insErr.message}`); continue; }
    console.log(`     inserted ${payload.length}`);
  }
  console.log(WRITE ? "\ndone." : "\ndry run — re-run with --write after migration 0054 is applied.");
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
