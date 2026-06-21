"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track, EVENTS } from "@/lib/analytics/events";

export interface TasteRegion {
  dimension: string;
  label: string;
  /** Top values with their share 0..1, strongest first. */
  values: { value: string; share: number }[];
  filled: boolean;
}

/**
 * The visual "Taste Map" (build-order #5). Each region is a catalogued taste
 * dimension that lights up as the user interacts. A completeness meter + "answer
 * N more" prompt drives the Zeigarnik loop honestly: every answer visibly
 * sharpens recommendations. Mobile-first grid.
 */
export default function TasteMap({
  regions,
  completeness,
  displayCompleteness,
  remaining,
  name,
  tagline,
}: {
  regions: TasteRegion[];
  /** Real, honest completeness 0..100 (drives analytics + copy). */
  completeness: number;
  /** Presentation value, floored at `baseline` so the meter never reads 0%. */
  displayCompleteness: number;
  /** The endowed-progress floor (e.g. "account created" step). */
  baseline: number;
  remaining: number;
  name: string;
  tagline: string;
}) {
  useEffect(() => {
    track(EVENTS.tasteMapViewed, { completeness });
  }, [completeness]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Your Taste Map</h2>
          {name && <p className="mt-1 text-sm text-gold">{name}</p>}
          {tagline && <p className="text-sm text-muted">{tagline}</p>}
        </div>
        <Link
          href="/quiz"
          className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          {completeness > 0 ? "Sharpen it" : "Take the quiz"}
        </Link>
      </div>

      {/* Completeness meter — endowed progress: never renders 0%. */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{displayCompleteness}% mapped</span>
          {remaining > 0 && <span>Answer {remaining} more to sharpen recommendations</span>}
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${displayCompleteness}%` }}
          />
        </div>
        {completeness === 0 && (
          <p className="mt-1.5 text-xs text-muted">
            Your account is step one — take the quiz to map your taste and sharpen
            every recommendation.
          </p>
        )}
      </div>

      {/* Region grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {regions.map((region) => (
          <div
            key={region.dimension}
            className={
              region.filled
                ? "rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-surface p-4"
                : "rounded-2xl border border-dashed border-border bg-surface/40 p-4"
            }
          >
            <p className="text-xs uppercase tracking-wide text-muted">{region.label}</p>
            {region.filled ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {region.values.map((v) => (
                  <li key={v.value} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="capitalize text-foreground">{v.value}</span>
                    </div>
                    <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gold/70"
                        style={{ width: `${Math.max(8, Math.round(v.share * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Not mapped yet</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
