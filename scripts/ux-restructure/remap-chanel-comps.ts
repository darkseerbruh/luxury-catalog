/**
 * Comps-remap for the 14 formerly seller-title Chanel styles (0714 audit §7).
 *
 * Those style rows were minted FROM single listing titles, so at ingest time the
 * long junk names attracted unrelated eBay/TRR listings ("Novelty Drawstring" on
 * the Chanel 19 row). The archivist rename/merge pass fixed the IDENTITIES
 * (apply-archivist-chanel.ts, map-title-junk.ts); this script cleans the COMPS
 * still sitting on their variants.
 *
 * Same discipline as clean-timeless-mismap.ts (the TRR mismap sweep):
 *  - judge each price_history row by its listing TITLE — notes first (the real
 *    title when the loader kept it), source_url slug as fallback (platform-aware
 *    parsing: TLC strips -p<digits>, TRR strips the random 5-char token)
 *  - recompute canonicalModel with the current dictionary; accent-blind
 *    substring-tolerant name equality so formatting drift never counts as a mismap
 *  - a row KEEPs when EITHER title resolves to the variant's style (second-chance
 *    keep-rule); it's a MOVE candidate only when a title clearly names a
 *    DIFFERENT known model; dictionary-blind titles (Chanel seasonal) go to
 *    REVIEW for a human verdict — never auto-moved
 *  - apply = preserve-then-delete: upsert into discovered_listing (style_guess =
 *    the recomputed model, promotion re-places it), then delete the
 *    price_history row. Full deleted rows go to the rollback file.
 *
 *   npx tsx scripts/ux-restructure/remap-chanel-comps.ts
 *       # dry-run: prints verdicts + writes chanel-comps-report.json
 *   npx tsx scripts/ux-restructure/remap-chanel-comps.ts --apply --decisions decisions.json
 *       # decisions.json = { "move": [price_id...], "keep": [price_id...] } —
 *       # EVERY flagged (non-KEEP) row must be listed one way or the other, so
 *       # nothing moves without a per-row human verdict.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { canonicalModel, isNonBagAccessory } from "@/lib/ingest/model-normalize";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");
const decisionsIdx = process.argv.indexOf("--decisions");
const DECISIONS = decisionsIdx >= 0
  ? (JSON.parse(readFileSync(process.argv[decisionsIdx + 1], "utf8")) as { move: number[]; keep: number[] })
  : null;

/** The 12 style rows still standing after the archivist pass (renamed in place). */
const TARGET_STYLES = [69, 145, 153, 185, 50, 76, 138, 158, 167, 178, 189, 191];
/** Variants whose junk style was merged away — they now sit on the real style. */
const EXTRA_VARIANTS = [
  443, // ex-#136 "Chanel Pink Tweed 19 Large Flap Bag" -> Chanel 19 (#425)
  455, // ex-#150 "…Mini Top Handle Flap Bag" -> Top Handle Rectangular Flap (#906)
  359, // ex-#77 "Mini Square Flap Bag w/ Tags" (map-title-junk merge)
  463, // ex-#160 "LV Monogram Canvas Neverfull Pochette Pouch" (now style 1288)
];
/** Pre-rename identities — a comp matching the OLD seller title is the SEED listing
 *  (or a re-observation of it) and belongs. Keyed by CURRENT anchor (style or variant). */
const OLD_NAMES: Record<string, string> = {
  "s69": "Large Leather Patchwork Brooklyn Cabas",
  "s145": "Chanel Charcoal Grey Quilted Patent Leather Golden Class Accordion Flap Bag",
  "s153": "Chanel Black Quilted Shiny Lambskin Leather Small Bowling Bag",
  "s185": "Chanel Beige Quilted Leather Mademoiselle Lock Shoulder Bag",
  "s50": "Printed Denim Large Flap Bag",
  "s76": "2021 Quilted Sponge Flap Bag",
  "s138": "Chanel Beige Quilted Leather Button Top Flap Bag",
  "s158": "Chanel Red Quilted Leather CC Waist Bag",
  "s167": "Chanel Black Leather Chevron Flap Bag",
  "s178": "Chanel Leather Beige Quilted Leather Flap Shoulder Bag",
  "s189": "Chanel Black Caviar Leather Tote Bag",
  "v443": "Chanel Pink Tweed 19 Large Flap Bag",
  "v455": "Chanel Light Blue Quilted Lambskin Leather Mini Top Handle Flap Bag",
  "v359": "Mini Square Flap Bag w/ Tags",
  "v463": "Louis Vuitton Monogram Canvas Neverfull Pochette Pouch",
};

const norm = (s: string | null) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const sameModel = (styleName: string, recomputed: string | null) => {
  if (recomputed == null) return false;
  const a = norm(styleName);
  const b = norm(recomputed);
  return a === b || a.includes(b) || b.includes(a);
};
const tokens = (s: string | null) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
const STOP = new Set([
  "chanel", "louis", "vuitton", "bag", "bags", "leather", "quilted", "the", "and", "with",
  "black", "beige", "red", "pink", "blue", "grey", "gray", "brown", "white", "gold",
  "small", "medium", "large", "mini", "vintage", "womens", "women", "new", "auth", "authentic",
]);

function titleFromUrl(url: string | null, platform: string | null): string | null {
  if (!url) return null;
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  let slug = seg.replace(/-p\d+$/i, "");
  if (platform === "The RealReal") slug = slug.replace(/-[a-z0-9]{5}$/i, "");
  if (!slug || /^\d+$/.test(slug)) return null; // eBay item ids are bare digits — no title in the URL
  return slug.replace(/-/g, " ").trim() || null;
}

interface PhRow {
  price_id: number;
  variant_id: number;
  platform: string | null;
  listing_ref: string | null;
  source_url: string | null;
  sale_price: number | null;
  currency: string | null;
  price_type: string | null;
  condition: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
  production_year: number | null;
  season: string | null;
  observed_on: string | null;
  listing_status: string | null;
  notes: string | null;
}

(async () => {
  // Resolve the target variant set live: every variant on the 12 standing styles
  // + the 4 merged-away variants (they carry the contamination into their new homes).
  const { data: styleVars, error: svErr } = await db
    .from("variant")
    .select("variant_id, style_id")
    .in("style_id", TARGET_STYLES);
  if (svErr) throw new Error(svErr.message);
  const variantIds = [...new Set([...(styleVars ?? []).map((v) => v.variant_id), ...EXTRA_VARIANTS])];

  const { data: vMetaRows, error: vmErr } = await db
    .from("variant")
    .select("variant_id, style_id, exterior_colorway, size_label, style:style_id(name, brand:brand_id(name))")
    .in("variant_id", variantIds);
  if (vmErr) throw new Error(vmErr.message);
  const vMeta = new Map(
    ((vMetaRows ?? []) as unknown as {
      variant_id: number;
      style_id: number;
      exterior_colorway: string | null;
      size_label: string | null;
      style: { name: string; brand: { name: string } | null } | null;
    }[]).map((v) => [
      v.variant_id,
      {
        styleId: v.style_id,
        style: v.style?.name ?? "?",
        brand: v.style?.brand?.name ?? "?",
        colorway: v.exterior_colorway,
        size: v.size_label,
        oldName: OLD_NAMES[`v${v.variant_id}`] ?? OLD_NAMES[`s${v.style_id}`] ?? null,
      },
    ]),
  );
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${variantIds.length} target variant(s)\n`);

  const rows: PhRow[] = [];
  for (let i = 0; i < variantIds.length; i += 50) {
    // PostgREST caps at 1000/page — page within each variant chunk too.
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from("price_history")
        .select(
          "price_id, variant_id, platform, listing_ref, source_url, sale_price, currency, price_type, condition, colorway, material, hardware_color, production_year, season, observed_on, listing_status, notes",
        )
        .in("variant_id", variantIds.slice(i, i + 50))
        .order("price_id", { ascending: true })
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...((data ?? []) as PhRow[]));
      if (!data || data.length < 1000) break;
    }
  }
  console.log(`${rows.length} price_history row(s) on the target variants`);

  type Verdict = "KEEP" | "MOVE" | "REVIEW";
  const judged = rows.map((r) => {
    const meta = vMeta.get(r.variant_id)!;
    const notesTitle = r.notes?.trim() || null;
    const slugTitle = titleFromUrl(r.source_url, r.platform);
    const recNotes = notesTitle ? canonicalModel(meta.brand, notesTitle) : null;
    const recSlug = slugTitle ? canonicalModel(meta.brand, slugTitle) : null;
    const title = notesTitle ?? slugTitle;

    // Identity-token overlap vs old seller-title + current name (triage signal for
    // dictionary-blind rows; the human verdict decides, this just sorts the queue).
    const idTokens = new Set([...tokens(meta.oldName), ...tokens(meta.style)]);
    const titleToks = tokens(title);
    const overlap = titleToks.filter((t) => idTokens.has(t));

    let verdict: Verdict;
    let reason: string;
    if ((recNotes && sameModel(meta.style, recNotes)) || (recSlug && sameModel(meta.style, recSlug))) {
      verdict = "KEEP";
      reason = "title resolves to this style";
    } else if (!title) {
      verdict = "REVIEW";
      reason = "no title evidence (no notes, unparsable URL)";
    } else if (recNotes || recSlug) {
      // A known model that isn't this style — but a strong identity-token overlap
      // (the seed listing wearing its old junk title) still needs a human look.
      verdict = overlap.length >= 2 ? "REVIEW" : "MOVE";
      reason = `title names "${recNotes ?? recSlug}"${overlap.length >= 2 ? ` BUT overlaps identity (${overlap.join(",")})` : ""}`;
    } else {
      verdict = "REVIEW";
      reason = overlap.length >= 2 ? `dictionary-blind, overlaps identity (${overlap.join(",")})` : "dictionary-blind title";
    }
    return {
      price_id: r.price_id,
      variant_id: r.variant_id,
      style: `#${meta.styleId} ${meta.style}`,
      old_name: meta.oldName,
      platform: r.platform,
      verdict,
      reason,
      recomputed: recNotes ?? recSlug ?? null,
      accessory: title ? isNonBagAccessory(title) : false,
      title,
      slug_title: slugTitle,
      row_colorway: r.colorway,
      variant_colorway: meta.colorway,
      row_material: r.material,
      price: r.sale_price,
      price_type: r.price_type,
      listing_ref: r.listing_ref,
      source_url: r.source_url,
      observed_on: r.observed_on,
    };
  });

  const counts = { KEEP: 0, MOVE: 0, REVIEW: 0 } as Record<string, number>;
  for (const j of judged) counts[j.verdict]++;
  console.log(`verdicts: KEEP ${counts.KEEP} · MOVE ${counts.MOVE} · REVIEW ${counts.REVIEW}\n`);
  for (const j of judged.filter((x) => x.verdict !== "KEEP")) {
    console.log(
      `${j.verdict}  #${j.price_id} v${j.variant_id} [${j.style}] ${j.platform ?? "?"} — "${j.title ?? "(no title)"}" — ${j.reason}`,
    );
  }

  const reportPath = path.resolve(process.cwd(), "scripts/ux-restructure/chanel-comps-report.json");
  if (!APPLY) {
    writeFileSync(reportPath, JSON.stringify(judged, null, 2));
    console.log(`\nDRY-RUN. Full report -> ${reportPath}. Re-run with --apply --decisions <file>.`);
    return;
  }

  if (!DECISIONS) throw new Error("--apply requires --decisions <file> ({ move: [], keep: [] }).");
  const moveSet = new Set(DECISIONS.move);
  const keepSet = new Set(DECISIONS.keep);
  const flagged = judged.filter((j) => j.verdict !== "KEEP");
  const unjudged = flagged.filter((j) => !moveSet.has(j.price_id) && !keepSet.has(j.price_id));
  if (unjudged.length) {
    throw new Error(`decisions file misses ${unjudged.length} flagged row(s): ${unjudged.map((j) => j.price_id).join(", ")}`);
  }
  const movers = judged.filter((j) => moveSet.has(j.price_id));

  // Preserve as evidence first (affiliate data is never throwaway), then delete.
  const { data: fullRows, error: frErr } = await db
    .from("price_history")
    .select("*")
    .in("price_id", movers.map((m) => m.price_id));
  if (frErr) throw new Error(frErr.message);

  const discovered = movers
    .filter((m) => m.listing_ref && m.price != null && m.observed_on)
    .map((m) => {
      const full = (fullRows ?? []).find((f: { price_id: number }) => f.price_id === m.price_id)! as Record<string, unknown>;
      return {
        platform: m.platform,
        listing_ref: m.listing_ref as string,
        source_url: m.source_url,
        raw_name: m.title,
        brand_guess: vMeta.get(m.variant_id)!.brand,
        style_guess: m.recomputed,
        colorway: full.colorway ?? null,
        material: full.material ?? null,
        hardware_color: full.hardware_color ?? null,
        production_year: full.production_year ?? null,
        season: full.season ?? null,
        price_type: m.price_type ?? "listed",
        sale_price: m.price as number,
        currency: (full.currency as string) ?? "USD",
        condition: full.condition ?? null,
        unresolved_reason: "no_style",
        observed_on: m.observed_on as string,
      };
    });
  const seen = new Set<string>();
  const deduped = discovered.filter((d) => {
    const k = `${d.listing_ref}|${d.observed_on}|${d.sale_price}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  for (let i = 0; i < deduped.length; i += 500) {
    const { error } = await db.from("discovered_listing").upsert(deduped.slice(i, i + 500), {
      onConflict: "platform,listing_ref,observed_on,sale_price",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(`discovered_listing upsert failed: ${error.message}`);
  }
  console.log(`preserved ${deduped.length} row(s) in discovered_listing`);

  const { error: delErr } = await db
    .from("price_history")
    .delete()
    .in("price_id", movers.map((m) => m.price_id));
  if (delErr) throw new Error(`price_history delete failed: ${delErr.message}`);
  console.log(`deleted ${movers.length} price_history row(s)`);

  const rollbackPath = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-chanel-comps.json");
  writeFileSync(
    rollbackPath,
    JSON.stringify({ deletedPriceHistory: fullRows, movedToDiscovered: deduped.map((d) => ({ platform: d.platform, listing_ref: d.listing_ref, observed_on: d.observed_on, sale_price: d.sale_price })) }, null, 2),
  );
  console.log(`APPLIED. Rollback -> ${rollbackPath}`);
})();
