/**
 * "Which Chanel flap line is this?" data for the bag-page cross-line module (owner decision
 * 2026-07-11, follow-on to the within-family flap module in `flap-family.ts`).
 *
 * The within-family module compares SIBLING MODELS inside one line (Classic Flap vs its
 * minis). This module sits one level up: it compares the confusable LINES a shopper weighs
 * against each other — the Classic Flap ("11.12"), the 2.55 Reissue, the Boy, and the
 * Wallet on Chain. They share the quilt-and-chain look but differ by CLOSURE and STRUCTURE,
 * which is what actually moves the price. This is the on-page version of the flap decoder
 * article's core thesis.
 *
 * Taxonomy rule (owner 2026-07-11): a WOC is a BAG and gets its own line here; a fold
 * wallet / coin purse is an SLG and stays out. Adding a future line (Boy WOC, 19, Gabrielle)
 * is a one-line copy addition below — no schema change.
 *
 * Copy is curated here (one reviewed file), never generated per-request. The identifying
 * tells + intro years trace to the archivist's sourced research 2026-07-11 (see the
 * `source` note per line). Medians are our read of recorded resale, never an appraisal.
 */
import { getSupabase, fetchAllRows } from "./supabase";

export type FlapStructure = "double" | "single";

/**
 * The curated Chanel flap lines, keyed by the `style_family` value each line uses in the DB.
 * `anchorName` is the canonical style whose page/link represents the line. Order sets the
 * display sort (the icon first, then Reissue, Boy, WOC smallest-last).
 */
export const CHANEL_FLAP_LINES: Record<
  string,
  {
    anchorName: string;
    order: number;
    structure: FlapStructure;
    /** The single fastest identifying tell (closure + flap structure). Archivist-sourced. */
    tell: string;
    /** Buyer orientation, one line. */
    pickThisIf: string;
    alsoCalled?: string;
    introYear: number | null;
    /** Provenance note for the tell + year (factuality bar). */
    source: string;
  }
> = {
  "Chanel Flap": {
    anchorName: "Classic Flap",
    order: 0,
    structure: "double",
    tell: "The CC turnlock on a structured double flap (a second flap tucked under the outer one), on a woven leather-and-chain strap.",
    pickThisIf: "You want the definitive icon: the CC turnlock and the most structured shape.",
    alsoCalled: "the 11.12",
    introYear: 1983,
    source: "Archivist 2026-07-11: Fashionphile Ultimate Chanel Flap Guide + Rebag 'Chanel 101' (1983 = current CC-turnlock form; earlier quilted-flap lineage predates it).",
  },
  "2.55 Reissue": {
    anchorName: "2.55 Reissue",
    order: 1,
    structure: "single",
    tell: "The rectangular Mademoiselle lock (no CC) and an aged all-metal chain, over a single flap.",
    pickThisIf: "You want the purist 1955 original, with no CC on the front.",
    alsoCalled: "the 2.55",
    introYear: 2005,
    source: "Archivist 2026-07-11: Yoogi's Closet '2.55' history (Feb 2005 Reissue, 50th anniversary of the Feb 1955 original; Mademoiselle lock).",
  },
  Boy: {
    anchorName: "Boy",
    order: 2,
    structure: "single",
    tell: "A rectangular push-button lock and a heavy chain on a boxy, structured shape.",
    pickThisIf: "You want the edgier, harder-structured Chanel with modern hardware.",
    alsoCalled: "Le Boy",
    introYear: 2011,
    source: "Archivist 2026-07-11: Fashionphile Boy guide + Christie's Boy history (2011, Lagerfeld, named after Arthur 'Boy' Capel; push-lock).",
  },
  "Wallet on Chain": {
    anchorName: "Wallet on Chain",
    order: 3,
    structure: "single",
    tell: "A single thin flap over a wallet body: card slots and a zip coin pocket inside, on a thin chain. The smallest of the four, and still a bag.",
    pickThisIf: "You want the lightest, smallest crossbody, the easiest one to carry every day.",
    alsoCalled: "the WOC",
    introYear: null,
    source: "Archivist 2026-07-11: Fashionphile WOC guide (card slots + zip coin pocket). Intro year held null (no clean single source).",
  },
};

export interface FlapLine {
  familyKey: string;
  name: string;
  structure: FlapStructure;
  tell: string;
  pickThisIf: string;
  alsoCalled?: string;
  introYear: number | null;
  /** Representative variant for the link + the shown median (the best-sampled one). */
  variantId: number | null;
  medianPrice: number | null;
  sampleSize: number;
  currency: string | null;
  isCurrent: boolean;
}

export interface FlapLines {
  current: FlapLine | undefined;
  lines: FlapLine[];
}

interface StyleRow {
  style_id: number;
  name: string;
  brand_id: number;
  style_family: string | null;
  variant: { variant_id: number }[] | null;
}
interface SummaryRow {
  variant_id: number;
  resale_median: number | null;
  sample_size: number | null;
  currency: string | null;
}

/**
 * The Chanel flap lines for a given style, or null when the style's `style_family` isn't one
 * of the curated lines (so the module simply doesn't render). Resilient: any DB error yields
 * null, never throws.
 */
export async function getFlapLines(styleId: number): Promise<FlapLines | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const sb = getSupabase();
    const { data: cur } = await sb
      .from("style")
      .select("style_id, brand_id, style_family")
      .eq("style_id", styleId)
      .limit(1);
    const c = cur?.[0] as { style_id: number; brand_id: number; style_family: string | null } | undefined;
    if (!c?.style_family || !CHANEL_FLAP_LINES[c.style_family]) return null;

    // Pull the anchor style for every curated line (one query, scoped to this brand).
    const anchorNames = Object.values(CHANEL_FLAP_LINES).map((l) => l.anchorName);
    const { data: styleData, error } = await sb
      .from("style")
      .select("style_id, name, brand_id, style_family, variant(variant_id)")
      .eq("brand_id", c.brand_id)
      .in("name", anchorNames);
    if (error || !styleData || styleData.length < 2) return null;
    const styles = styleData as unknown as StyleRow[];

    // Price summaries for every variant across the anchors, so each line shows a
    // representative median (its best-sampled variant).
    const allVariantIds = styles.flatMap((s) => (s.variant ?? []).map((v) => v.variant_id));
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

    // Build one line entry per curated family key, using its anchor style.
    const byFamily = new Map<string, StyleRow>();
    for (const s of styles) {
      const key = Object.keys(CHANEL_FLAP_LINES).find(
        (k) => CHANEL_FLAP_LINES[k].anchorName === s.name,
      );
      if (key && !byFamily.has(key)) byFamily.set(key, s);
    }

    const lines: FlapLine[] = [];
    for (const [key, meta] of Object.entries(CHANEL_FLAP_LINES)) {
      const s = byFamily.get(key);
      if (!s) continue; // line not in the catalog yet — skip silently
      // Representative variant = the one with the most recorded sales (best median basis).
      let best: SummaryRow | null = null;
      for (const v of s.variant ?? []) {
        const sum = summaries.get(v.variant_id);
        if (sum && (best == null || (sum.sample_size ?? 0) > (best.sample_size ?? 0))) best = sum;
      }
      lines.push({
        familyKey: key,
        name: s.name,
        structure: meta.structure,
        tell: meta.tell,
        pickThisIf: meta.pickThisIf,
        alsoCalled: meta.alsoCalled,
        introYear: meta.introYear,
        variantId: best?.variant_id ?? s.variant?.[0]?.variant_id ?? null,
        medianPrice: best?.resale_median ?? null,
        sampleSize: best?.sample_size ?? 0,
        currency: best?.currency ?? null,
        isCurrent: key === c.style_family,
      });
    }
    if (lines.length < 2) return null;

    lines.sort((a, b) => (CHANEL_FLAP_LINES[a.familyKey]?.order ?? 99) - (CHANEL_FLAP_LINES[b.familyKey]?.order ?? 99));

    return {
      current: lines.find((l) => l.isCurrent),
      lines,
    };
  } catch {
    return null;
  }
}
