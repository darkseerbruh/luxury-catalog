/**
 * The production record for a style (migration 0054): what the house PRODUCED, per axis, with
 * permanence + provenance. The selector reads this so options reflect production, not our
 * listings — a produced option we lack a photo for is still selectable (hedged), and grey-out
 * means "never produced", sourced. Resilient: returns [] when the table is absent or empty
 * (pre-migration / unseeded style), so nothing renders until the record exists.
 */
import { getSupabase } from "./supabase";

export type ProductionAxisKey = "size" | "color" | "material" | "construction" | "hardware";

export interface ProductionOption {
  value: string;
  permanence: "permanent" | "seasonal" | null;
  seasonCode: string | null;
  isDefault: boolean;
  note: string | null;
}

export interface ProductionAxis {
  axis: ProductionAxisKey;
  /** Human label for the axis row. */
  label: string;
  options: ProductionOption[];
}

const AXIS_ORDER: ProductionAxisKey[] = ["size", "color", "material", "construction", "hardware"];
const AXIS_LABEL: Record<ProductionAxisKey, string> = {
  size: "Size",
  color: "Colour",
  material: "Material",
  construction: "Construction",
  hardware: "Hardware",
};

interface Row {
  axis: string;
  value: string;
  permanence: string | null;
  season_code: string | null;
  is_default: boolean | null;
  note: string | null;
  sort_order: number | null;
}

/** Group the flat production_option rows into ordered axes (size → colour → material → …). */
export function groupProductionOptions(rows: Row[]): ProductionAxis[] {
  const byAxis = new Map<ProductionAxisKey, ProductionOption[]>();
  for (const r of rows) {
    if (!(AXIS_ORDER as string[]).includes(r.axis)) continue;
    const axis = r.axis as ProductionAxisKey;
    const opt: ProductionOption = {
      value: r.value,
      permanence: r.permanence === "permanent" || r.permanence === "seasonal" ? r.permanence : null,
      seasonCode: r.season_code,
      isDefault: r.is_default === true,
      note: r.note,
    };
    (byAxis.get(axis) ?? byAxis.set(axis, []).get(axis)!).push(opt);
  }
  return AXIS_ORDER.filter((a) => (byAxis.get(a)?.length ?? 0) > 0).map((axis) => ({
    axis,
    label: AXIS_LABEL[axis],
    options: byAxis.get(axis)!,
  }));
}

export async function getProductionOptions(styleId: number): Promise<ProductionAxis[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("production_option")
      .select("axis, value, permanence, season_code, is_default, note, sort_order")
      .eq("style_id", styleId)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return groupProductionOptions(data as unknown as Row[]);
  } catch {
    return [];
  }
}
