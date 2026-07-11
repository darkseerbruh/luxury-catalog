/**
 * Probe (read-only): bare/thin styles (description < 120 chars) joined to their
 * comp sample_size via variant_price_summary, ordered by comps desc (highest ROI).
 * Bulk + paged to respect the PostgREST 1000-row cap.
 */
import { supabaseAdmin as db } from "../seed/lib/client";

async function fetchAll<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await db.from(table).select(cols).range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < page) break;
    from += page;
  }
  return out;
}

async function main() {
  const styles = await fetchAll<{ style_id: number; name: string; description: string | null; year_introduced: number | null; brand_id: number }>(
    "style", "style_id, name, description, year_introduced, brand_id");
  const brands = await fetchAll<{ brand_id: number; name: string }>("brand", "brand_id, name");
  const variants = await fetchAll<{ variant_id: number; style_id: number }>("variant", "variant_id, style_id");
  const summ = await fetchAll<{ variant_id: number; sample_size: number | null }>("variant_price_summary", "variant_id, sample_size");

  const brandName = new Map(brands.map((b) => [b.brand_id, b.name]));
  const compByVariant = new Map(summ.map((s) => [s.variant_id, s.sample_size ?? 0]));
  const compByStyle = new Map<number, number>();
  const varsByStyle = new Map<number, number>();
  for (const v of variants) {
    compByStyle.set(v.style_id, (compByStyle.get(v.style_id) ?? 0) + (compByVariant.get(v.variant_id) ?? 0));
    varsByStyle.set(v.style_id, (varsByStyle.get(v.style_id) ?? 0) + 1);
  }

  const rows = styles
    .map((s) => ({
      style_id: s.style_id,
      name: s.name,
      brand: brandName.get(s.brand_id) ?? "?",
      desc_len: (s.description ?? "").trim().length,
      year: s.year_introduced,
      comps: compByStyle.get(s.style_id) ?? 0,
      vars: varsByStyle.get(s.style_id) ?? 0,
    }))
    .filter((r) => r.desc_len < 120)
    .sort((a, b) => b.comps - a.comps);

  console.log(`bare/thin styles (desc<120 chars): ${rows.length} of ${styles.length} total`);
  console.log(`with >=10 comps: ${rows.filter((r) => r.comps >= 10).length}; >=20: ${rows.filter((r) => r.comps >= 20).length}`);
  console.log("style_id\tcomps\tvars\tyear\tdlen\tbrand — name");
  for (const r of rows.filter((r) => r.comps >= 10)) console.log(`${r.style_id}\t${r.comps}\t${r.vars}\t${r.year ?? "-"}\t${r.desc_len}\t${r.brand} — ${r.name}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
