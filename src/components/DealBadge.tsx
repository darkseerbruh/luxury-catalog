import { bandLabel, type DealBand } from "@/lib/listings-core";

/** Tailwind classes per deal band — green for value, muted for fair, amber for over. */
const BAND_CLASS: Record<DealBand, string> = {
  great: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  good: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
  fair: "border-border bg-surface text-muted",
  above: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

/** A pill showing the deal verdict, optionally with the percent under fair value. */
export function DealBadge({
  band,
  pctUnder,
  className = "",
}: {
  band: DealBand;
  pctUnder?: number;
  className?: string;
}) {
  const suffix =
    pctUnder == null
      ? ""
      : pctUnder > 0
        ? ` · ${pctUnder}% under`
        : pctUnder < 0
          ? ` · ${-pctUnder}% over`
          : "";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${BAND_CLASS[band]} ${className}`}
    >
      {bandLabel(band)}
      {suffix}
    </span>
  );
}
