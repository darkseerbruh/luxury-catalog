/**
 * Variant attribute roll-up (owner go 2026-07-14): fill a variant's missing
 * colour / material / hardware from the listing evidence we ALREADY hold on its
 * price_history rows. The capture pipelines record per-listing attributes
 * (133k colorway rows, 51k hardware rows); this is the missing aggregation step
 * up to the catalog variant record.
 *
 * Consensus rule (never invent): votes are DISTINCT LISTINGS (re-scrapes dedupe
 * to one data point). A field fills only with ≥2 distinct listings AND a dominant
 * share ≥90% for colour (identity-defining) / ≥80% for material+hardware. Mixed
 * evidence = the variant is a genuine multi-spec bucket → stays NULL (the
 * bag page's "Unknown" chip + recorded-shades module handle that honestly).
 *   - colour groups at the colour-FAMILY level (colorFamily) so "light blue" +
 *     "sky blue" agree; the family label is what variants already store.
 *   - material resolves to material_id (ilike match; created if missing).
 *   - hardware fills with the dominant raw value (lowercased).
 *
 * DRY-RUN default; --apply executes and writes a rollback file.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { colorFamily } from "@/lib/listings-taxonomy";

type P = {
  variant_id: number;
  platform: string | null;
  listing_ref: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
};

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");
const MIN_ROWS = 2; // distinct LISTINGS, never raw observations (re-scrapes inflate)
const MIN_SHARE_COLOUR = 0.9; // colour defines identity — near-unanimous or hold
const MIN_SHARE = 0.8; // material/hardware

async function page<T>(table: string, select: string, apply: (q: unknown) => unknown = (q) => q): Promise<T[]> {
  const out: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await (apply(db.from(table).select(select)) as ReturnType<ReturnType<typeof db.from>["select"]>).range(f, f + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

function consensus(values: string[], minShare = MIN_SHARE): { value: string; n: number; share: number } | null {
  if (values.length < MIN_ROWS) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [top, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const share = n / values.length;
  return share >= minShare ? { value: top, n: values.length, share } : null;
}

/**
 * Collapse observation rows to DISTINCT LISTINGS before any vote (the deals-rail
 * lesson: the same listing re-scraped daily is one data point, not seven). Key =
 * platform|listing_ref; a ref-less row stands alone. Each listing contributes its
 * modal value per field.
 */
function distinctListingValues(rows: P[], field: "colorway" | "material" | "hardware_color", normalize: (s: string) => string | null): string[] {
  const byListing = new Map<string, Map<string, number>>();
  let anon = 0;
  for (const r of rows) {
    const raw = r[field];
    if (!raw) continue;
    const norm = normalize(raw);
    if (!norm) continue;
    const key = r.listing_ref ? `${r.platform}|${r.listing_ref}` : `anon:${anon++}`;
    const m = byListing.get(key) ?? new Map<string, number>();
    m.set(norm, (m.get(norm) ?? 0) + 1);
    byListing.set(key, m);
  }
  return [...byListing.values()].map((m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}

const matCache = new Map<string, number>();
async function resolveMaterialId(raw: string): Promise<number | null> {
  const name = raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  if (matCache.has(name)) return matCache.get(name)!;
  const { data: found } = await db.from("material").select("material_id").ilike("name", name).maybeSingle();
  if (found) { matCache.set(name, found.material_id); return found.material_id; }
  if (!APPLY) return -1;
  const type = /ostrich|croc|python|lizard|alligator|exotic|niloticus/i.test(name) ? "exotic"
    : /canvas|monogram|damier|toile/i.test(name) ? "coated canvas"
    : /tweed|denim|nylon|jersey|suede|fabric|wool|felt|raffia|satin|velvet/i.test(name) ? "fabric" : "leather";
  const { data: ins, error } = await db.from("material").insert({ name, material_type: type }).select("material_id").single();
  if (error) { console.warn(`  ! material create "${name}": ${error.message}`); return null; }
  matCache.set(name, ins.material_id);
  return ins.material_id;
}

(async () => {
  type V = { variant_id: number; exterior_colorway: string | null; exterior_material_id: number | null; hardware_color: string | null };
  

  const variants = await page<V>("variant", "variant_id, exterior_colorway, exterior_material_id, hardware_color");
  const needy = variants.filter((v) => !v.exterior_colorway || v.exterior_material_id == null || !v.hardware_color);
  console.log(`variants: ${variants.length}, with a missing field: ${needy.length}`);

  // One paged pull of all evidence rows that carry any attribute.
  const evidence = await page<P>(
    "price_history",
    "variant_id, platform, listing_ref, colorway, material, hardware_color",
    (q) => (q as ReturnType<ReturnType<typeof db.from>["select"]>).or("colorway.not.is.null,material.not.is.null,hardware_color.not.is.null"),
  );
  console.log(`evidence rows: ${evidence.length}`);
  const byVariant = new Map<number, P[]>();
  for (const e of evidence) (byVariant.get(e.variant_id) ?? byVariant.set(e.variant_id, []).get(e.variant_id)!).push(e);

  const rollback: { variantId: number; patch: Record<string, unknown>; prev: Record<string, unknown> }[] = [];
  let fillColour = 0, fillMat = 0, fillHw = 0, mixedColour = 0, thin = 0;
  const samples: string[] = [];

  for (const v of needy) {
    const rows = byVariant.get(v.variant_id) ?? [];
    const patch: Record<string, unknown> = {};
    const prev: Record<string, unknown> = {};

    if (!v.exterior_colorway) {
      const fams = distinctListingValues(rows, "colorway", (s) => colorFamily(s));
      const c = consensus(fams, MIN_SHARE_COLOUR);
      if (c) { patch.exterior_colorway = c.value; prev.exterior_colorway = null; fillColour++; }
      else if (fams.length >= MIN_ROWS) mixedColour++;
      else thin++;
    }
    if (v.exterior_material_id == null) {
      const mats = distinctListingValues(rows, "material", (s) => s.trim().toLowerCase() || null);
      const c = consensus(mats);
      if (c) {
        const id = await resolveMaterialId(c.value);
        if (id != null) { patch.exterior_material_id = id === -1 ? "NEW" : id; prev.exterior_material_id = null; fillMat++; }
      }
    }
    if (!v.hardware_color) {
      const hws = distinctListingValues(rows, "hardware_color", (s) => s.trim().toLowerCase() || null);
      const c = consensus(hws);
      if (c) { patch.hardware_color = c.value; prev.hardware_color = null; fillHw++; }
    }

    if (Object.keys(patch).length > 0) {
      if (samples.length < 15) samples.push(`v${v.variant_id}: ${JSON.stringify(patch)} (from ${rows.length} rows)`);
      if (APPLY) {
        // Resolve the NEW-material sentinel now that we're writing.
        if (patch.exterior_material_id === "NEW") {
          const mats = distinctListingValues(rows, "material", (s) => s.trim().toLowerCase() || null);
          const c = consensus(mats)!;
          patch.exterior_material_id = await resolveMaterialId(c.value);
          if (patch.exterior_material_id == null) delete patch.exterior_material_id;
        }
        if (Object.keys(patch).length > 0) {
          const { error } = await db.from("variant").update(patch).eq("variant_id", v.variant_id);
          if (error) console.warn(`  ! v${v.variant_id}: ${error.message}`);
          else rollback.push({ variantId: v.variant_id, patch, prev });
        }
      }
    }
  }

  console.log(`\nfills — colour: ${fillColour} · material: ${fillMat} · hardware: ${fillHw}`);
  console.log(`held back — mixed colour evidence (genuine buckets): ${mixedColour} · too little evidence: ${thin}`);
  console.log(`\nsample:\n  ${samples.join("\n  ")}`);

  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-attr-enrich.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED ${rollback.length} variant updates. Rollback -> ${out}`);
  } else {
    console.log(`\nDRY-RUN. Re-run with --apply.`);
  }
})();
