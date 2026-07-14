/**
 * Re-place the comps the 0714 Chanel comps-remap parked in discovered_listing
 * (rollback-chanel-comps.json movedToDiscovered keys) onto their REAL styles.
 *
 * Scoped companion to promote-safe.ts: same placement discipline (existing
 * styles only, sizeKey variant match, listing_ref dedupe, promoted stamp) but
 * ONLY for these rows, and stricter — never creates a style OR a variant.
 * A row places when:
 *   - style_guess resolves to an existing (brand, style) by normalized name, and
 *   - a variant matches the size token parsed from raw_name (or a null-size
 *     variant when the title carries no size).
 * Everything else stays banked for the regular promote pass (rows with
 * style_guess null are unresolved by design — future-style evidence).
 *
 *   npx tsx scripts/ux-restructure/replace-remapped-comps.ts          # dry-run
 *   npx tsx scripts/ux-restructure/replace-remapped-comps.ts --apply
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const norm = (s: string | null) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const SIZE_RX = /\b(nano|micro|mini|small|medium|large|jumbo|maxi)\b/i;

/** Rows held back from placement on purpose (they stay banked in discovered_listing):
 *  seasonal-on-icon = the Hollywood Boulevard precedent (owner-flagged): a seasonal
 *  runway flap that canon-maps onto the Classic Flap icon pollutes the icon's comps —
 *  those wait for a seasonal-aware pass, they don't ride the dictionary onto the icon. */
const HOLD: Record<number, string> = {
  245865: "seasonal-on-icon (Knock On Wood tweed single flap ≠ the Classic Flap icon)",
  245864: "seasonal-on-icon (Lavender/Pink/Silver seasonal tweed single flap)",
  245889: "accessory-ish (Vanity PHONE HOLDER — the accessory-surface lane owns it)",
};

interface DiscRow {
  discovered_id: number;
  platform: string | null;
  listing_ref: string | null;
  source_url: string | null;
  raw_name: string | null;
  brand_guess: string | null;
  style_guess: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
  production_year: number | null;
  season: string | null;
  condition: string | null;
  price_type: string | null;
  sale_price: number | null;
  currency: string | null;
  observed_on: string | null;
  promoted_variant_id: number | null;
}

(async () => {
  const rb = JSON.parse(
    readFileSync(path.resolve(process.cwd(), "scripts/ux-restructure/rollback-chanel-comps.json"), "utf8"),
  ) as { movedToDiscovered: { platform: string; listing_ref: string; observed_on: string; sale_price: number }[] };

  // Fetch our parked rows by their upsert keys (small set — query per platform batch).
  const rows: DiscRow[] = [];
  const refs = [...new Set(rb.movedToDiscovered.map((m) => m.listing_ref))];
  for (let i = 0; i < refs.length; i += 100) {
    const { data, error } = await db
      .from("discovered_listing")
      .select(
        "discovered_id, platform, listing_ref, source_url, raw_name, brand_guess, style_guess, colorway, material, hardware_color, production_year, season, condition, price_type, sale_price, currency, observed_on, promoted_variant_id",
      )
      .in("listing_ref", refs.slice(i, i + 100))
      .is("promoted_variant_id", null);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as DiscRow[]));
  }
  // Only OUR rows (a listing_ref can exist for unrelated observations).
  const keys = new Set(rb.movedToDiscovered.map((m) => `${m.platform}|${m.listing_ref}|${m.observed_on}|${m.sale_price}`));
  const mine = rows.filter((r) => keys.has(`${r.platform}|${r.listing_ref}|${r.observed_on}|${r.sale_price}`));
  console.log(`${APPLY ? "APPLY" : "DRY-RUN"} — ${mine.length} parked row(s) found (of ${rb.movedToDiscovered.length} parked)`);

  const { data: brands } = await db.from("brand").select("brand_id,name");
  const brandByNorm = new Map((brands ?? []).map((b) => [norm(b.name), b.brand_id as number]));
  const { data: styles } = await db.from("style").select("style_id,brand_id,name");
  const styleByKey = new Map(
    ((styles ?? []) as { style_id: number; brand_id: number; name: string }[]).map((s) => [
      `${s.brand_id}|${norm(s.name)}`,
      s.style_id,
    ]),
  );

  const today = new Date().toISOString().slice(0, 10);
  let placed = 0, banked = 0, deduped = 0;
  for (const r of mine) {
    const label = `#${r.discovered_id} [${r.brand_guess} → ${r.style_guess ?? "(no guess)"}] "${r.raw_name}"`;
    if (HOLD[r.discovered_id]) { banked++; console.log(`HOLD    ${label} — ${HOLD[r.discovered_id]}`); continue; }
    if (!r.style_guess) { banked++; console.log(`BANKED  ${label} — unresolved by design`); continue; }
    const bId = brandByNorm.get(norm(r.brand_guess));
    // Exact normalized name first, then the accent-blind containment the mismap sweep
    // uses ("Reissue" ⊂ "2.55 Reissue", "Diana" ⊂ "Diana Flap Bag") — but ONLY when
    // exactly one brand style matches; any ambiguity stays banked.
    let styleId = bId != null ? styleByKey.get(`${bId}|${norm(r.style_guess)}`) : undefined;
    if (styleId == null && bId != null) {
      const g = norm(r.style_guess);
      const cands = ((styles ?? []) as { style_id: number; brand_id: number; name: string }[]).filter(
        (s) => s.brand_id === bId && (norm(s.name).includes(g) || g.includes(norm(s.name))),
      );
      if (cands.length === 1) styleId = cands[0].style_id;
    }
    if (styleId == null) { banked++; console.log(`BANKED  ${label} — no existing style by that name`); continue; }

    const { data: vars } = await db
      .from("variant")
      .select("variant_id,size_label")
      .eq("style_id", styleId);
    const sizeTok = r.raw_name?.match(SIZE_RX)?.[1]?.toLowerCase() ?? null;
    // "Standard" is the catalog's explicit unknown-size bucket — same fallback as null.
    const variant =
      (sizeTok && (vars ?? []).find((v) => norm(v.size_label) === norm(sizeTok))) ||
      (!sizeTok && (vars ?? []).find((v) => v.size_label == null || norm(v.size_label) === "standard")) ||
      null;
    if (!variant) { banked++; console.log(`BANKED  ${label} — no ${sizeTok ?? "null-size"} variant on style ${styleId}`); continue; }

    // listing_ref dedupe against the target variant (promote-safe rule).
    const { data: existRefs } = await db
      .from("price_history")
      .select("listing_ref")
      .eq("variant_id", variant.variant_id)
      .eq("listing_ref", r.listing_ref!);
    if ((existRefs ?? []).length > 0) {
      deduped++;
      console.log(`DEDUPE  ${label} — listing already on v${variant.variant_id}`);
      if (APPLY)
        await db.from("discovered_listing").update({ promoted_variant_id: variant.variant_id, promoted_at: new Date().toISOString() }).eq("discovered_id", r.discovered_id);
      continue;
    }

    console.log(`PLACE   ${label} → style ${styleId} v${variant.variant_id} (${variant.size_label ?? "no size"})`);
    if (APPLY) {
      const { error: insErr } = await db.from("price_history").insert({
        variant_id: variant.variant_id,
        platform: r.platform,
        price_type: r.price_type || "listed",
        sale_price: r.sale_price,
        currency: r.currency || "USD",
        listing_status: r.price_type === "sold" ? "sold" : "available",
        listing_ref: r.listing_ref,
        source_url: r.source_url,
        observed_on: r.observed_on,
        date_recorded: today,
        confidence_level: "medium",
        colorway: r.colorway,
        material: r.material,
        hardware_color: r.hardware_color,
        production_year: r.production_year,
        season: r.season,
        condition: r.condition,
        notes: r.raw_name,
      });
      if (insErr) { console.warn(`  ! insert: ${insErr.message}`); continue; }
      await db.from("discovered_listing").update({ promoted_variant_id: variant.variant_id, promoted_at: new Date().toISOString() }).eq("discovered_id", r.discovered_id);
    }
    placed++;
  }
  console.log(`\n${APPLY ? "APPLIED" : "planned"}: ${placed} placed · ${deduped} already-present (marked) · ${banked} stay banked`);
  if (!APPLY) console.log("Re-run with --apply.");
})();
