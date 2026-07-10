/**
 * MovementPill — how an LC Index rank moved since last month. Renders nothing
 * until a prior-month snapshot exists, so it never invents motion. Direction is
 * carried by an arrow glyph AND the word (Up / Down / Steady), never colour alone.
 * See docs/ux/lc-index-spec.md.
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
