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
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface-raised to-surface ${className}`}
    >
      <HandbagGlyph className="h-1/2 w-1/2 text-gold/25" />
      {invite && (
        <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/30 bg-bg/70 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-gold-soft/90">
          + Add a photo
        </span>
      )}
      {brand && (
        <span
          aria-hidden
          className="absolute bottom-2 left-0 right-0 truncate px-3 text-center font-serif text-xs uppercase tracking-widest text-muted/70"
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
