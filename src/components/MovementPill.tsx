/**
 * MovementPill — how an LC Index rank moved since last month. Renders nothing
 * until a prior-month snapshot exists, so it never invents motion. Direction is
 * carried by an arrow glyph AND the word (Up / Down / Steady), never colour alone.
 * See docs/ux/lc-index-spec.md.
 *
 * THIS IS THE ONLY MOVEMENT SURFACE, on purpose. A separate "trend over time"
 * module was built on 2026-07-27 and deleted the same day: it read the same
 * lc_index_snapshot table and answered the same question, so it would have put two
 * readings of one number on one page. The owner caught it by asking how the new
 * module differed from the index.
 *
 * If a longer sparkline is ever wanted, it belongs INSIDE this pill's card rather
 * than beside it. Note also that it cannot say anything until at least two monthly
 * snapshots exist: the table is empty as of 2026-07-27, because the LC Index was
 * silently returning zero rows until it was repaired that day, so the 1 July cron
 * had nothing to capture.
 *
 * Naming caution learned the same day: do NOT label anything here "attention".
 * This reads the index, and the index is price 0.47 / trade 0.29 / scarcity 0.24.
 * That is market standing. Real attention data would need a different source
 * entirely (Wikipedia pageviews works and is free; Google Trends is hard-blocked).
 */

import { movementLabel } from "@/lib/lc-index";

const GLYPH: Record<string, string> = { up: "▲", down: "▼", flat: "•" };

export default function MovementPill({
  rank,
  previousRank,
  className = "",
}: {
  rank: number | null;
  previousRank: number | null | undefined;
  className?: string;
}) {
  if (rank == null) return null;
  const move = movementLabel(rank, previousRank);
  if (!move) return null;
  const tone =
    move.dir === "up"
      ? "border-[#7bb67b]/40 text-[#9cc79c]"
      : move.dir === "down"
        ? "border-[#d88a85]/40 text-[#d88a85]"
        : "border-border text-muted";
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10.5px] ${tone} ${className}`}
    >
      <span aria-hidden="true">{GLYPH[move.dir]}</span>
      {move.label}
    </span>
  );
}
