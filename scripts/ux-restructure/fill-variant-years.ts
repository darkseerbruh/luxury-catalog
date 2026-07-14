/**
 * Fill variant.year_start from listing evidence — the year leg of the 0714
 * attribute roll-up, gated tighter than colour/material because a variant's year
 * fields claim a production RANGE while a listing's production_year is one bag's
 * birth year:
 *
 *   - votes are DISTINCT LISTINGS (re-scrape dedupe), ≥2 required
 *   - fill ONLY on unanimity (every distinct listing states the SAME year — the
 *     seasonal-piece signature); any spread = a range we can't bound → stays null
 *     (the era lens renders spread evidence honestly already)
 *   - writes year_start only; year_end stays null (an end claim needs production
 *     research, not listings)
 *   - model-name years (Jackie 1961 …) were cleaned + guarded upstream first
 *
 * DRY-RUN default; --apply executes + writes a rollback file.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

async function page<T>(t: string, sel: string, ap: (q: unknown) => unknown = (q) => q): Promise<T[]> {
  const out: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await (ap(db.from(t).select(sel)) as ReturnType<ReturnType<typeof db.from>["select"]>).range(f, f + 999);
    if (error) throw new Error(`${t}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

(async () => {
  type P = { variant_id: number; production_year: number | null; platform: string | null; listing_ref: string | null };
  const ev = await page<P>(
    "price_history",
    "variant_id, production_year, platform, listing_ref",
    (q) => (q as ReturnType<ReturnType<typeof db.from>["select"]>).not("production_year", "is", null),
  );
  const vars = await page<{ variant_id: number; year_start: number | null }>("variant", "variant_id, year_start");
  const nullYear = new Set(vars.filter((v) => v.year_start == null).map((v) => v.variant_id));

  // Distinct listings per variant; each listing votes its year once.
  const byV = new Map<number, Map<string, number>>();
  let anon = 0;
  for (const e of ev) {
    if (!nullYear.has(e.variant_id) || e.production_year == null) continue;
    const key = e.listing_ref ? `${e.platform}|${e.listing_ref}` : `a${anon++}`;
    const m = byV.get(e.variant_id) ?? new Map<string, number>();
    m.set(key, e.production_year);
    byV.set(e.variant_id, m);
  }

  const rollback: { variantId: number }[] = [];
  let filled = 0, spread = 0, thin = 0;
  const hist = new Map<number, number>();
  for (const [variantId, m] of byV) {
    if (m.size < 2) { thin++; continue; }
    const years = [...new Set(m.values())];
    if (years.length !== 1) { spread++; continue; }
    const y = years[0];
    hist.set(y, (hist.get(y) ?? 0) + 1);
    filled++;
    if (APPLY) {
      rollback.push({ variantId });
      const { error } = await db.from("variant").update({ year_start: y }).eq("variant_id", variantId);
      if (error) console.warn(`  ! v${variantId}: ${error.message}`);
    }
  }
  console.log(`unanimous fills: ${filled} · spread (left null, era lens covers): ${spread} · too thin: ${thin}`);
  console.log("years:", [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([y, n]) => `${y}:${n}`).join(" "));
  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-variant-years.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`APPLIED. Rollback -> ${out}`);
  } else {
    console.log("DRY-RUN. Re-run with --apply.");
  }
})();
