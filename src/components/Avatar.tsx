"use client";

import { useState } from "react";

const SIZES = {
  sm: "h-9 w-9 text-base",
  md: "h-14 w-14 text-xl",
  lg: "h-16 w-16 text-2xl",
} as const;

/**
 * A person's little round avatar. When a `src` is set (a sourced/UGC image, never
 * AI-generated), it renders the photo; otherwise — or if the photo fails to load
 * (404 / dead link) — it falls back to a branded gold initial, and to a neutral
 * person glyph when there's no name at all. Mirrors `BagImage`: it never shows the
 * browser's broken-image icon. The fallback is always a text/shape signal, not
 * colour alone, so it reads for everyone.
 */
export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: {
  src?: string | null;
  /** Display name or handle — used for the initial and the accessible label. */
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const clean = (name ?? "").replace(/^@/, "").trim();
  const initial = clean.charAt(0).toUpperCase();
  const label = clean || "Member";

  const base = `${SIZES[size]} shrink-0 overflow-hidden rounded-full ${className}`;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${base} border border-border object-cover`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`${base} flex items-center justify-center border border-gold/40 bg-gold/10 font-serif text-gold`}
    >
      {initial || <PersonGlyph className="h-1/2 w-1/2" />}
    </div>
  );
}

function PersonGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
