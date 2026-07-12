/**
 * "How this bag relates to its cousins" data for the bag-page family module (owner
 * decision 2026-07-11). Chanel flaps confuse buyers: near-identical bags carry very
 * different prices because of STRUCTURE (single vs double flap) and STATUS (permanent vs
 * discontinued), not the silhouette. This resolves the family (styles sharing a
 * `style_family`) and pairs it with reviewed, sourced one-liners so a shopper on ANY flap
 * page can see the whole line and pick correctly.
 *
 * Copy is curated here (one reviewed file), never generated per-request. Facts trace to the
 * archivist's sourced research (Fashionphile + Rebag + Bragmybag, 2026-07-11): the Classic
 * Flap = the double-flap 11.12; the minis are single-flap; East-West retired 2010.
 */
import { getSupabase, fetchAllRows } from "./supabase";

export type FlapStructure = "double" | "single";

/** Reviewed per-style copy, keyed by canonical style name. `order` sets the family sort
 *  (anchor icon first, then the single-flap cousins, discontinued last). */
export const FLAP_FAMILY_COPY: Record<
  string,
  { structure: FlapStructure; order: number; pickThisIf: string; alsoCalled?: string }
> = {
  "Classic Flap": {
    structure: "double",
    order: 0,
    pickThisIf: "You want the icon: the structured double flap with the CC turnlock, in the classic sizes.",
    alsoCalled: "the 11.12",
  },
  "Mini Rectangular Flap": {
    structure: "single",
    order: 1,
    pickThisIf: "You want a small single-flap crossbody with a longer strap.",
    alsoCalled: "Chanel's bare “Mini Flap”",
  },
  "Mini Square Flap": {
    structure: "single",
    order: 2,
    pickThisIf: "You want the boxier mini that sits a little higher.",
  },
  "Micro Mini Flap": {
    structure: "single",
    order: 3,
    pickThisIf: "You want the smallest, going-out size.",
  },
  "East-West Flap": {
    structure: "single",
    order: 4,
    pickThisIf: "You love the elongated shape and don't mind that it's discontinued.",
  },
};

export interface FlapSibling {
  styleId: number;
  name: string;
  structure: FlapStructure | null;
  /** "Permanent" or "Retired 2010" etc. */
  status: string;
  discontinued: boolean;
  pickThisIf: string;
  alsoCalled?: string;
  /** Representative variant for the link + the shown median (the best-sampled one). */
  variantId: number | null;
  medianPrice: number | null;
  sampleSize: number;
  currency: string | null;
  isCurrent: boolean;
}

export interface FlapFamily {
  familyKey: string;
  current: FlapSibling | undefined;
  siblings: FlapSibling[];
}

interface StyleRow {
  style_id: number;
  name: string;
  brand_id: number;
  style_family: string | null;
  discontinued: boolean | null;
  year_discontinued: number | null;
  variant: { variant_id: number }[] | null;
}
interface SummaryRow {
  variant_id: number;
  resale_median: number | null;
  sample_size: number | null;
  currency: string | null;
}

/**
 * The flap family for a given style, or null when the style has no `style_family` (so the
 * module simply doesn't render). Resilient: any DB error yields null, never throws.
 */
export async function getStyleFamily(styleId: number): Promise<FlapFamily | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const sb = getSupabase();
    const { data: cur } = await sb
      .from("style")
      .select("style_id, brand_id, style_family")
      .eq("style_id", styleId)
      .limit(1);
    const c = cur?.[0] as { style_id: number; brand_id: number; style_family: string | null } | undefined;
    if (!c?.style_family) return null;

    const { data: sibData, error } = await sb
      .from("style")
      .select("style_id, name, brand_id, style_family, discontinued, year_discontinued, variant(variant_id)")
      .eq("brand_id", c.brand_id)
      .eq("style_family", c.style_family);
    if (error || !sibData || sibData.length < 2) return null;
    const sibs = sibData as unknown as StyleRow[];

    // Price summaries for every variant across the family, so each sibling can show a
    // representative median (its best-sampled variant).
    const allVariantIds = sibs.flatMap((s) => (s.variant ?? []).map((v) => v.variant_id));
    const summaries = new Map<number, SummaryRow>();
    if (allVariantIds.length) {
      const rows = await fetchAllRows<SummaryRow>(
        () =>
          sb
            .from("variant_price_summary")
            .select("variant_id, resale_median, sample_size, currency")
            .in("variant_id", allVariantIds) as unknown as {
            range: (from: number, to: number) => PromiseLike<{ data: SummaryRow[] | null; error: unknown }>;
          },
        5000,
      );
      for (const r of rows) summaries.set(r.variant_id, r);
    }

    const siblings: FlapSibling[] = sibs.map((s) => {
      // Representative variant = the one with the most recorded sales (best median basis).
      let best: SummaryRow | null = null;
      for (const v of s.variant ?? []) {
        const sum = summaries.get(v.variant_id);
        if (sum && (best == null || (sum.sample_size ?? 0) > (best.sample_size ?? 0))) best = sum;
      }
      const copy = FLAP_FAMILY_COPY[s.name];
      const discontinued = s.discontinued === true;
      return {
        styleId: s.style_id,
        name: s.name,
        structure: copy?.structure ?? null,
        status: discontinued ? (s.year_discontinued ? `Retired ${s.year_discontinued}` : "Discontinued") : "Permanent",
        discontinued,
        pickThisIf: copy?.pickThisIf ?? "",
        alsoCalled: copy?.alsoCalled,
        variantId: best?.variant_id ?? s.variant?.[0]?.variant_id ?? null,
        medianPrice: best?.resale_median ?? null,
        sampleSize: best?.sample_size ?? 0,
        currency: best?.currency ?? null,
        isCurrent: s.style_id === styleId,
      };
    });

    siblings.sort((a, b) => (FLAP_FAMILY_COPY[a.name]?.order ?? 99) - (FLAP_FAMILY_COPY[b.name]?.order ?? 99));

    return {
      familyKey: c.style_family,
      current: siblings.find((s) => s.isCurrent),
      siblings,
    };
  } catch {
    return null;
  }
}
