"use client";

import { useEffect } from "react";
import CompScale, { type Comp, type CompRow } from "./CompScale";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * ValueModule — the adaptive "what it's worth" element at the top of the bag
 * page. One skeleton (verdict line → CompScale gauge → scope + sourcing note),
 * reframed by the viewer's relationship to the bag:
 *
 *   buyer    (anonymous / "want")  → "is this a good price right now?"
 *   owner    ("have")              → "what is mine worth?" + retail retention
 *   collector ("had")             → "how has it held value?"
 *
 * Only the headline, verdict copy, and the contextual link change; the evidence
 * (gauge + comps) is identical, so the page reads consistently across states.
 *
 * It fires `value_module_viewed` with its framing + comp counts on mount. Paired
 * with the outbound buy/sell click that follows, that's the data that will tell
 * us which user type is most common and most monetizable — the call we can't
 * make from a guess today.
 *
 * HONESTY: every number is a real recorded price; copy is descriptive and dated,
 * never advice and never an appraisal. Degrades to an honest empty state when we
 * have no recorded resale data for the variant.
 */

export type ValueFraming = "buyer" | "owner" | "collector";

export interface ValueRange {
  low: number;
  median: number;
  high: number;
  currency: string | null;
  /** How many recorded resale prices the range is built from. */
  count: number;
}

export interface ValueModuleProps {
  variantId: number;
  framing: ValueFraming;
  range: ValueRange | null;
  /** Current asking listings (price_type = 'listed'); plotted on the gauge. */
  listed: Comp[];
  retailOriginal: number | null;
  retailCurrency: string | null;
  /** First→last % change across the recorded resale window, if computable. */
  trendPct: number | null;
  /** Latest date any shown price was true at source. */
  asOf: string | null;
  /** M1 timing inputs — demand (from wants/watchers) + retail-hike catalyst. */
  demandLevel?: "quiet" | "warm" | "hot";
  demandLabel?: string | null;
  /** MSRP change over time — resale floors tend to follow brand retail hikes. */
  retailTrendPct?: number | null;
  /** M2 — recorded resale grouped into condition tiers for the like-for-like ladder. */
  byCondition?: CompRow[];
  /**
   * Variant-level production era (the honest year signal we have today). Per-
   * listing era (the era×condition matrix) activates once date-code extraction
   * populates price_history.production_year.
   */
  era?: { productionYears: string | null; discontinued: boolean; vintage: boolean };
  /**
   * Era lens — recorded resale grouped by production-year decade (from
   * price_history.production_year, migration 0022 + LLM extraction pass).
   * Renders when ≥2 bands are populated; otherwise falls through to the
   * condition ladder or gauge, mirroring the condition-ladder's ≥2-tier rule.
   * Empty array when the column is absent (pre-0022) — page degrades gracefully.
   */
  byEra?: CompRow[];
  /** Currency for the era lens axis (may differ from the main range currency). */
  eraCurrency?: string | null;
}

/** A neutral, non-invented note on how the production era bears on value. */
function eraNote(era: { productionYears: string | null; discontinued: boolean; vintage: boolean }): string | null {
  const years = era.productionYears ? ` (${era.productionYears})` : "";
  if (era.vintage) {
    return `Vintage production${years} — no longer made, so condition and a complete set tend to matter more to value.`;
  }
  if (era.discontinued) {
    return `Discontinued${years} — no longer in production, so resale is the only way to buy it.`;
  }
  return null;
}

/**
 * M1 timing note: a descriptive, framing-aware read synthesized from demand +
 * how prices have moved. Never advice — states what's observed and lets the
 * reader draw the conclusion. Returns null when there's no real signal.
 */
function timingNote(
  framing: ValueFraming,
  demandLevel: "quiet" | "warm" | "hot",
  trendPct: number | null,
  retailTrendPct: number | null,
): string | null {
  const climbing = (trendPct != null && trendPct > 2) || (retailTrendPct != null && retailTrendPct > 0);
  const softening = trendPct != null && trendPct < -2;
  const hot = demandLevel === "hot";
  const quiet = demandLevel === "quiet";

  if (framing === "buyer") {
    if (hot && climbing) return "Demand is strong and prices have been climbing — waiting hasn't paid off lately.";
    if (quiet && softening) return "Demand is light and prices are soft — little pressure to move fast.";
    if (climbing) return "Prices have been trending up over the tracked window.";
    if (softening) return "Prices have been easing over the tracked window.";
    return null;
  }
  // owner / collector — the sell/hold read.
  if (hot && climbing) return "Demand is strong and prices are rising — a seller's window.";
  if (quiet && softening) return "Demand is light and prices are soft right now.";
  if (climbing) return "Prices have trended up — it's been holding or gaining.";
  if (softening) return "Prices have eased over the tracked window.";
  return null;
}

function fmt(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

const HEADINGS: Record<ValueFraming, string> = {
  buyer: "What it's worth",
  owner: "What yours is worth",
  collector: "How it's held value",
};

/** The contextual next step — reuses existing page sections, no new CTAs. */
const NUDGE: Record<ValueFraming, { href: string; label: string }> = {
  buyer: { href: "#where-to-buy", label: "Compare where to buy" },
  owner: { href: "#where-to-sell", label: "See where to sell" },
  collector: { href: "#price-history", label: "See full price history" },
};

export default function ValueModule({
  variantId,
  framing,
  range,
  listed,
  retailOriginal,
  retailCurrency,
  trendPct,
  asOf,
  demandLevel = "quiet",
  demandLabel = null,
  retailTrendPct = null,
  byCondition,
  era,
  byEra,
  eraCurrency,
}: ValueModuleProps) {
  const ladder = !!byCondition && byCondition.length >= 2;
  // Era lens shows when ≥2 decade bands are populated with real data.
  const eraLens = !!byEra && byEra.length >= 2;

  useEffect(() => {
    track(EVENTS.valueModuleViewed, {
      variant_id: variantId,
      framing,
      listed_count: listed.length,
      recorded_count: range?.count ?? 0,
      has_listed: listed.length > 0,
      has_ladder: ladder,
      has_era_lens: eraLens,
      demand_level: demandLevel,
      scope: "exact",
    });
  }, [variantId, framing, listed.length, range?.count, ladder, eraLens, demandLevel]);

  // Honest empty state — mirrors the catalog's "we only show real ranges" rule.
  if (!range) {
    return (
      <div>
        <h2 className="font-serif text-xl text-foreground">{HEADINGS[framing]}</h2>
        <p className="mt-2 text-sm text-muted">
          No recorded resale data yet for this exact variant — we only show
          ranges built from real prices.
        </p>
      </div>
    );
  }

  const { low, median, high, currency, count } = range;
  const best = listed.length ? Math.min(...listed.map((c) => c.price)) : null;
  const bestComp = best != null ? listed.find((c) => c.price === best) ?? null : null;
  const position =
    best == null ? null : best <= low * 1.04 ? "deal" : best >= high * 0.96 ? "rich" : "mid";
  const retention =
    retailOriginal && retailOriginal > 0 ? Math.round((median / retailOriginal) * 100) : null;

  // Framing-specific verdict line — descriptive, from the numbers above.
  let verdict: React.ReactNode;
  if (framing === "owner") {
    verdict = (
      <>
        Comparable resales run{" "}
        <span className="text-foreground">{fmt(low, currency)}</span>–
        <span className="text-foreground">{fmt(high, currency)}</span> (median{" "}
        <span className="text-gold">{fmt(median, currency)}</span>).
        {retention != null && (
          <>
            {" "}
            About <span className="text-foreground">{retention}%</span> of the{" "}
            {fmt(retailOriginal, retailCurrency)} original retail.
          </>
        )}
      </>
    );
  } else if (framing === "collector") {
    verdict = (
      <>
        {trendPct != null ? (
          <>
            Recorded prices are{" "}
            <span className={trendPct > 0 ? "text-gold" : trendPct < 0 ? "text-green-400" : "text-muted"}>
              {trendPct === 0 ? "flat" : `${trendPct > 0 ? "up" : "down"} ${Math.abs(trendPct)}%`}
            </span>{" "}
            across the tracked window
          </>
        ) : (
          <>
            Tracked resale range{" "}
            <span className="text-foreground">{fmt(low, currency)}</span>–
            <span className="text-foreground">{fmt(high, currency)}</span>
          </>
        )}
        {retention != null && (
          <>
            {" "}· holding ~<span className="text-foreground">{retention}%</span> of retail
          </>
        )}
        .
      </>
    );
  } else {
    // buyer
    verdict = best != null ? (
      <>
        Best listed right now:{" "}
        <span className="text-gold">{fmt(best, currency)}</span>
        {bestComp?.platform ? ` on ${bestComp.platform}` : ""} —{" "}
        {position === "deal" ? (
          <span className="text-green-400">near the floor of the typical range</span>
        ) : position === "rich" ? (
          <span className="text-muted">above the typical range</span>
        ) : (
          <span className="text-muted">around the middle of the typical range</span>
        )}
        .
      </>
    ) : (
      <>
        Typically trades{" "}
        <span className="text-foreground">{fmt(low, currency)}</span>–
        <span className="text-foreground">{fmt(high, currency)}</span>.
      </>
    );
  }

  const note = timingNote(framing, demandLevel, trendPct, retailTrendPct);
  const eraText = era ? eraNote(era) : null;

  // Era lens caption: total listing count + capture date, descriptive + dated,
  // never advice or "investment" framing — matches the catalog honesty rails.
  const eraLensCount = eraLens ? byEra!.reduce((s, r) => s + r.count, 0) : 0;
  const eraLensCaption = eraLens
    ? `Resale by production era — ${eraLensCount} ${eraLensCount === 1 ? "listing" : "listings"}, estimated from recorded prices.`
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-serif text-xl text-foreground">{HEADINGS[framing]}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {era?.vintage ? (
            <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs text-gold">
              Vintage
            </span>
          ) : era?.discontinued ? (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
              Discontinued
            </span>
          ) : null}
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted/80">
            This exact variant · {count} recorded {count === 1 ? "price" : "prices"}
            {count < 4 ? " · limited data" : ""}
          </span>
        </div>
      </div>

      <p className="mt-2 text-base leading-relaxed text-foreground">{verdict}</p>

      {note && (
        <p className="mt-1.5 text-sm text-muted">
          {note}
          {demandLabel ? <span className="text-muted/70"> · {demandLabel}</span> : null}
        </p>
      )}

      {eraText && <p className="mt-1.5 text-sm text-muted">{eraText}</p>}

      {/* Primary viz: condition ladder (≥2 tiers) › gauge (fallback).
          Era lens is stacked below when it qualifies (≥2 bands), separated
          by a labelled divider — no toggle, no JS, works at 375px. */}
      <div className="mt-4">
        {ladder ? (
          <>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted/70">
              By condition · compared like-for-like
            </p>
            <CompScale low={low} median={median} high={high} currency={currency} rows={byCondition} />
          </>
        ) : (
          <CompScale low={low} median={median} high={high} currency={currency} comps={listed} />
        )}
      </div>

      {/* Era lens — shown only when ≥2 decade bands have data. Stacked below
          the condition view (or gauge) so both stay legible. Labels are decade
          strings (e.g. "1990s", "2000s") — never invented or interpolated. */}
      {eraLens && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted/70">
            By production era · decade
          </p>
          <CompScale
            low={Math.min(...byEra!.map((r) => r.low))}
            median={Math.round(byEra!.reduce((s, r) => s + r.median * r.count, 0) / eraLensCount)}
            high={Math.max(...byEra!.map((r) => r.high))}
            currency={eraCurrency ?? currency}
            rows={byEra}
          />
          <p className="mt-1.5 text-xs text-muted/60">{eraLensCaption}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-xs text-muted/60">
          Estimated from recorded resale prices · not an appraisal.
          {asOf ? ` As of ${asOf.slice(0, 10)}.` : ""}
        </p>
        <a href={NUDGE[framing].href} className="text-xs text-gold hover:underline">
          {NUDGE[framing].label} →
        </a>
      </div>
    </div>
  );
}
