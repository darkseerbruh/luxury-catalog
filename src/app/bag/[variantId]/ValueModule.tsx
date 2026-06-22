"use client";

import { useEffect } from "react";
import CompScale, { type Comp } from "./CompScale";
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
}: ValueModuleProps) {
  useEffect(() => {
    track(EVENTS.valueModuleViewed, {
      variant_id: variantId,
      framing,
      listed_count: listed.length,
      recorded_count: range?.count ?? 0,
      has_listed: listed.length > 0,
      scope: "exact",
    });
  }, [variantId, framing, listed.length, range?.count]);

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

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-serif text-xl text-foreground">{HEADINGS[framing]}</h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted/80">
          This exact variant · {count} recorded {count === 1 ? "price" : "prices"}
          {count < 4 ? " · limited data" : ""}
        </span>
      </div>

      <p className="mt-2 text-base leading-relaxed text-foreground">{verdict}</p>

      <div className="mt-4">
        <CompScale low={low} median={median} high={high} currency={currency} comps={listed} />
      </div>

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
