/**
 * Seed the STYLE-level `has_protective_feet` attribute (migration 0044) for the
 * curated backbone hero styles — depth-first, documented only. We NEVER guess:
 * a style is set true/false only where a real source documents the base
 * construction; everything else is left null (unknown) for owners to crowd-fill
 * via reviews.
 *
 *   npx tsx supabase/seed/seed-protective-feet.ts            # dry run (reports only)
 *   npx tsx supabase/seed/seed-protective-feet.ts --write    # persist
 *
 * Idempotent + non-destructive: matches styles by brand + normalized name and
 * only writes where has_protective_feet IS NULL — a documented answer already in
 * the catalog (or an owner-reported one) is never overwritten. Needs .env.local
 * with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Requires migration 0044 applied (the column must exist). If it doesn't, every
 * update errors and the script reports the styles as skipped — apply 0044 first.
 */
import { supabaseAdmin } from "./lib/client";

const WRITE = process.argv.includes("--write");

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

/**
 * Documented feet facts. `feet`: true = has protective base feet as a design
 * trait, false = documented none. Every row carries a `source` so the assertion
 * is anchored (honest authorship). Styles NOT listed here stay null (unknown).
 */
interface FeetFact {
  brand: string;
  style: string;
  feet: boolean;
  note: string;
  source: string;
}

const FACTS: FeetFact[] = [
  // ---- Hermès: structured classics ride on metal corner feet ("clous") ----
  {
    brand: "Hermès",
    style: "Kelly",
    feet: true,
    note: "Four metal corner feet (clous) lift the base — a defining Kelly feature.",
    source: "https://laforma.club/anatomy-of-the-hermes-kelly-bag/",
  },
  {
    brand: "Hermès",
    style: "Birkin",
    feet: true,
    note: "Four metal base studs standard (six on 50/55cm) — hammered in.",
    source: "https://baghunter.com/blogs/insights/hermes-handbag-hardware",
  },
  {
    brand: "Hermès",
    style: "Bolide",
    feet: true,
    note: "Base finished with four protective metal feet as standard.",
    source: "https://saclab.com/us/the-hermes-bolide/",
  },
  {
    brand: "Hermès",
    style: "Constance",
    feet: false,
    note: "Flat bottom, no base feet (the 'two feet' online refer to the H-clasp).",
    source: "https://reinaluxe.co/how-to-spot-fake-bags/hermes-constance-authentication-guide/",
  },
  {
    brand: "Hermès",
    style: "Garden Party",
    feet: false,
    note: "Explicitly no feet or base studs — noted as a design drawback.",
    source: "https://www.charlenechronicles.com/hermes-garden-party-sizes-prices/",
  },

  // ---- Chanel: the quilted flaps have NO protective base feet ----
  {
    brand: "Chanel",
    style: "Classic Flap",
    feet: false,
    note: "Soft quilted flap, no base feet (base shapers sold aftermarket).",
    source: "https://www.rebag.com/thevault/chanel-101-classic-flap-bag/",
  },
  {
    brand: "Chanel",
    style: "2.55 Reissue",
    feet: false,
    note: "Same soft double-flap quilted base, no feet.",
    source: "https://www.fashionphile.com/blogs/academy/chanel-255-reissue-guide",
  },
  {
    brand: "Chanel",
    style: "Boy",
    feet: false,
    note: "The six studs sit on the SIDES (decorative), not protective base feet.",
    source: "https://www.bragmybag.com/chanel-boy-bag/",
  },

  // ---- Louis Vuitton ----
  {
    brand: "Louis Vuitton",
    style: "Alma",
    feet: true,
    note: "LV's own spec lists four protective metal feet on the base.",
    source: "https://us.louisvuitton.com/eng-us/products/alma-bb-monogram-nvprod5190086v/M46990",
  },
  {
    brand: "Louis Vuitton",
    style: "Neverfull",
    feet: false,
    note: "Flat canvas base, no feet (base shapers sold to fix the sag).",
    source: "https://www.cloversac.com/base-shaper-dimensions-for-all-louis-vuitton-handbags/",
  },
  // NOTE: LV Speedy is deliberately LEFT NULL (unknown) — feet vary by era/material
  // (none on canvas Monogram; some 2012–2015 / Empreinte had four), so it is not an
  // inherent style trait we can assert one way for the whole style. Never guess.

  // ---- Dior ----
  {
    brand: "Dior",
    style: "Lady Dior",
    feet: true,
    note: "Protective metal base feet — four on Mini/Small/Medium, five on Large.",
    source: "https://www.extrabux.com/en/guide/4949177",
  },

  // ---- Saint Laurent ----
  {
    brand: "Saint Laurent",
    style: "Sac de Jour",
    feet: true,
    note: "Rigid base with brass protective feet as a design feature.",
    source: "https://www.bragmybag.com/saint-laurent-sac-de-jour-bag/",
  },

  // ---- Gucci ----
  {
    brand: "Gucci",
    style: "Jackie 1961",
    feet: false,
    note: "Soft/slightly-structured hobo, no base feet documented.",
    source: "https://www.rebag.com/thevault/the-size-guide-gucci-jackie-1961/",
  },

  // ---- Bottega Veneta ----
  {
    brand: "Bottega Veneta",
    style: "Cassette",
    feet: false,
    note: "Soft padded intrecciato body, no base feet documented.",
    source: "https://saclab.com/us/bottega-veneta-cassette-bag/",
  },
];

async function main() {
  const { data: brandRows, error: bErr } = await supabaseAdmin.from("brand").select("brand_id, name");
  if (bErr) throw new Error(`load brands: ${bErr.message}`);
  const brandByNorm = new Map((brandRows ?? []).map((b) => [norm(b.name), b]));

  let set = 0;
  let alreadyDocumented = 0;
  let missingStyle = 0;
  let missingBrand = 0;
  const report: string[] = [];

  for (const f of FACTS) {
    const brand = brandByNorm.get(norm(f.brand));
    if (!brand) {
      missingBrand++;
      report.push(`  [no brand] ${f.brand} / ${f.style}`);
      continue;
    }
    // Match the canonical style row (exact normalized name for this brand).
    const { data: styles, error: sErr } = await supabaseAdmin
      .from("style")
      .select("style_id, name, has_protective_feet")
      .eq("brand_id", brand.brand_id);
    if (sErr) {
      if (/has_protective_feet/.test(sErr.message)) {
        console.error(
          "\nMigration 0044 isn't applied yet — style.has_protective_feet doesn't exist.\n" +
            "Apply supabase/migrations/0044_style_protective_feet.sql first, then re-run this seed.",
        );
        process.exit(1);
      }
      throw new Error(`load styles for ${f.brand}: ${sErr.message}`);
    }
    const match = (styles ?? []).find((s) => norm(s.name) === norm(f.style));
    if (!match) {
      missingStyle++;
      report.push(`  [no style] ${f.brand} / ${f.style}`);
      continue;
    }
    if (match.has_protective_feet != null) {
      alreadyDocumented++;
      report.push(
        `  [keep]  ${f.brand} ${match.name}: already ${match.has_protective_feet} (leaving as-is)`,
      );
      continue;
    }
    report.push(`  [${WRITE ? "SET" : "would set"}] ${f.brand} ${match.name} → ${f.feet}  — ${f.note}`);
    if (WRITE) {
      const { error: uErr } = await supabaseAdmin
        .from("style")
        .update({ has_protective_feet: f.feet })
        .eq("style_id", match.style_id)
        .is("has_protective_feet", null);
      if (uErr) throw new Error(`update ${f.brand}/${match.name}: ${uErr.message}`);
    }
    set++;
  }

  console.log(`\n${WRITE ? "WROTE" : "DRY RUN"} — protective-feet seed (${FACTS.length} documented facts)`);
  console.log(report.join("\n"));
  console.log(
    `\nsummary: ${set} ${WRITE ? "set" : "to set"}, ${alreadyDocumented} already documented (kept), ` +
      `${missingStyle} style not found, ${missingBrand} brand not found`,
  );
  if (!WRITE) console.log(`\nRe-run with --write to persist. Requires migration 0044 applied.`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
