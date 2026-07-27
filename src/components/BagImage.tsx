"use client";

import { useState } from "react";

/**
 * Bag visual. When a sourced `imageUrl` exists (licensed / UGC / first-party — we
 * never AI-generate or hotlink unlicensed photos, per the product brief), it
 * renders the photo. Otherwise — or if the photo fails to load (404 / dead link)
 * — it renders a deliberate, luxury-styled placeholder (brand wordmark + a handbag
 * silhouette on a dark/gold treatment) so the catalog reads as intentional rather
 * than broken, and never shows the browser's broken-image icon. Decorative by
 * default (aria-hidden on the placeholder); pass a meaningful `alt` for real photos.
 */
export function BagImage({
  imageUrl,
  brand,
  alt,
  className = "",
  invite = true,
  fit = "contain",
}: {
  imageUrl?: string | null;
  brand?: string | null;
  alt?: string;
  className?: string;
  /**
   * When the placeholder shows, advertise that a real photo is wanted ("Add a
   * photo") — the catalog runs on what owners contribute. A non-interactive label
   * (pointer-events-none) so it never blocks the parent card's link; the card
   * itself routes to the bag page, where the upload lives. Turn off where the
   * empty state would be noise (taste quiz, admin review queue).
   */
  invite?: boolean;
  /**
   * "contain" (the default, everywhere) shows the WHOLE bag — a fixed-ratio crop
   * was lopping studio shots off at the handles and the base. The photo sits on a
   * white backdrop so the letterbox reads as studio white, not a hole. "cover"
   * crops to fill and is opt-in only, for a surface where the frame matters more
   * than the object.
   */
  fit?: "cover" | "contain";
}) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt ?? (brand ? `${brand} bag` : "bag")}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${fit === "contain" ? "bg-white object-contain" : "object-cover"} ${className}`}
      />
    );
  }

  return (
    <div
      className={`@container relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-surface-raised to-surface ${className}`}
    >
      <HandbagGlyph className="h-2/5 w-2/5 text-gold/25" />
      {/* The invite sits BELOW the glyph (centered), not in a top corner, so it never
          collides with the tile's top-right Compare control. Container-query-gated to the
          tile's own rendered width, since it crams + clips on small thumbnails. */}
      {invite && (
        <span className="pointer-events-none hidden whitespace-nowrap rounded-full border border-gold/30 bg-bg/70 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-gold-soft/90 @[9rem]:inline-block">
          + Add a photo
        </span>
      )}
      {brand && (
        <span
          aria-hidden
          className="absolute bottom-2 left-0 right-0 hidden truncate px-3 text-center font-serif text-xs uppercase tracking-widest text-muted/70 @[7rem]:block"
        >
          {brand}
        </span>
      )}
    </div>
  );
}

function HandbagGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* simple handbag silhouette — clearly an icon, not a photo */}
      <path d="M4 8h16l-1.2 11.2a1 1 0 0 1-1 .8H6.2a1 1 0 0 1-1-.8L4 8z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
    </svg>
  );
}
