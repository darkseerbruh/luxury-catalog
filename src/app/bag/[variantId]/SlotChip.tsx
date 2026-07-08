"use client";

import { track, EVENTS } from "@/lib/analytics/events";

/**
 * One open contribution slot as a tappable card. A thin client wrapper so the
 * click fires the funnel-START event (contribution_slot_clicked) before the
 * in-page anchor scrolls to the control. Presentation matches the server-rendered
 * banner it lives in.
 */
export default function SlotChip({
  variantId,
  slotKey,
  label,
  hint,
  anchor,
  sub,
}: {
  variantId: number;
  slotKey: string;
  label: string;
  hint: string;
  anchor: string;
  sub?: { done: number; total: number };
}) {
  return (
    <a
      href={anchor}
      onClick={() => track(EVENTS.contributionSlotClicked, { slot: slotKey, variant_id: variantId })}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted group-hover:border-gold group-hover:text-gold"
      >
        +
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-foreground">{label}</span>
          {sub && sub.done > 0 && (
            <span className="text-xs text-muted">
              {sub.done} of {sub.total} so far
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{hint}</span>
      </span>
    </a>
  );
}
