/**
 * IndexRankLink — Concept C. A quiet inline link to the LC Index, sitting next to
 * a bag name ("· #27 in the Index"). Deliberately low-prominence: a small gold
 * link, never a chip. See docs/ux/lc-index-spec.md.
 *
 * Presentational; renders nothing when the style is unranked. On a card whose
 * body is a stretched link, pass `pointer-events-auto` via className so this stays
 * independently clickable while the rest of the card routes to the bag page.
 */

import Link from "next/link";

export default function IndexRankLink({
  rank,
  className = "",
}: {
  rank: number | null | undefined;
  className?: string;
}) {
  if (rank == null) return null;
  return (
    <Link
      href="/rankings"
      className={`whitespace-nowrap text-gold-soft underline decoration-gold/40 underline-offset-2 ${className}`}
    >
      #{rank} in the Index
    </Link>
  );
}
