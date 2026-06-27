"use client";

import { useState } from "react";

/**
 * Bag visual. When a sourced `imageUrl` exists (licensed / UGC / first-party — we
 * never AI-generate or hotlink unlicensed photos, per the product brief), it
 * renders the photo. Otherwise — or if the photo fails to load (404 / dead link)
 * — it renders a deliberate, luxury-styled placeholder so the catalog reads as
 * intentional rather than broken, and never shows the browser's broken-image icon.
 *
 * The placeholder is a "boutique plate": a large serif brand monogram framed by
 * hairline gold rules and the wordmark, over a per-brand-tinted gradient with a
 * faint quilted texture and a hash-varied bag silhouette watermark. It is
 * deterministic per brand, so a grid of placeholders reads as a varied set of
 * house cards rather than one box repeated. It uses only `brand` (no extra data)
 * and scales from a 64px thumbnail to the hero via container-query units.
 *
 * Decorative by default (aria-hidden on the placeholder); pass a meaningful `alt`
 * for real photos.
 */
export function BagImage({
  imageUrl,
  brand,
  alt,
  className = "",
}: {
  imageUrl?: string | null;
  brand?: string | null;
  alt?: string;
  className?: string;
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

  return <BagPlaceholder brand={brand} className={className} />;
}

/**
 * The branded fallback. Exported so non-photo surfaces can render the same plate
 * directly. Pure presentation, no client state — safe in server components too.
 */
export function BagPlaceholder({
  brand,
  className = "",
}: {
  brand?: string | null;
  className?: string;
}) {
  const seed = hash(brand ?? "");
  const accent = ACCENTS[seed % ACCENTS.length];
  const Silhouette = SILHOUETTES[seed % SILHOUETTES.length];
  // Nudge the watermark off-center, deterministically, so neighbouring cards
  // don't line their silhouettes up into a visible grid.
  const shiftX = ((seed >> 2) % 7) - 3; // -3..3 (%)
  const shiftY = ((seed >> 5) % 7) - 3;

  const monogram = initials(brand);

  return (
    <div
      aria-hidden
      className={`@container relative flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--color-surface)",
        backgroundImage: `radial-gradient(120% 100% at 28% 0%, ${accent}1f 0%, transparent 55%), linear-gradient(150deg, var(--color-surface-raised) 0%, var(--color-bg) 100%)`,
      }}
    >
      {/* Quilted texture — two faint diagonal lattices. Very low opacity so it
          reads as a treatment, not a pattern. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-gold) 0, var(--color-gold) 1px, transparent 1px, transparent 13px), repeating-linear-gradient(-45deg, var(--color-gold) 0, var(--color-gold) 1px, transparent 1px, transparent 13px)",
        }}
      />

      {/* Bag silhouette watermark, hash-varied + nudged off-centre. */}
      <Silhouette
        className="pointer-events-none absolute h-[62%] w-[62%]"
        style={{
          color: accent,
          opacity: 0.1,
          transform: `translate(${shiftX}%, ${shiftY}%)`,
        }}
      />

      {/* The plate: rules + monogram + wordmark, in one vertical stack. Sizing
          uses container-query inline units so it scales with the card. */}
      <div className="relative z-10 flex flex-col items-center px-[8%]">
        <span
          className="hidden @[7rem]:block h-px w-[clamp(1.5rem,22cqi,4rem)]"
          style={{ backgroundColor: accent, opacity: 0.5 }}
        />
        <span
          className="font-serif leading-none"
          style={{
            color: "var(--color-gold-soft)",
            fontSize: "clamp(1.5rem, 34cqi, 5.5rem)",
            letterSpacing: monogram.length > 1 ? "0.04em" : "0",
            margin: "0.18em 0",
          }}
        >
          {monogram}
        </span>
        <span
          className="hidden @[7rem]:block h-px w-[clamp(1.5rem,22cqi,4rem)]"
          style={{ backgroundColor: accent, opacity: 0.5 }}
        />
        {brand && (
          <span
            className="mt-[0.7em] hidden @[6rem]:block max-w-full truncate font-sans text-center uppercase"
            style={{
              color: "var(--color-muted)",
              fontSize: "clamp(0.5rem, 6.5cqi, 0.8rem)",
              letterSpacing: "0.28em",
            }}
          >
            {brand}
          </span>
        )}
      </div>
    </div>
  );
}

/** Deterministic, stable string hash (djb2-ish). No Math.random — same brand
 * always yields the same plate. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Monogram from a brand name: up to two leading initials, uppercased.
 * "Louis Vuitton" → "LV", "Saint Laurent" → "SL", "Chanel" → "C". */
function initials(brand?: string | null): string {
  if (!brand) return "·";
  const words = brand
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w));
  if (words.length === 0) return "·";
  if (words.length === 1) {
    // Single word → first letter (a clean house initial reads more luxe than a
    // truncated wordmark).
    return words[0]![0]!.toUpperCase();
  }
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

// Warm, on-palette accents derived from the catalog's gold. Subtle spread
// (champagne → gold → rose-warm → cool-gold) so brands differ without going
// off-brand.
const ACCENTS = ["#c9a24c", "#e3c785", "#c98f5c", "#b8a36a", "#d4b06a"];

type GlyphProps = { className?: string; style?: React.CSSProperties };

// A few distinct bag silhouettes so neighbouring cards don't share one shape.
// Clearly icons, not photos.
const SILHOUETTES: Array<(p: GlyphProps) => React.JSX.Element> = [
  FlapBag,
  ToteBag,
  TopHandleBag,
];

function FlapBag({ className, style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16" />
      <path d="M7.5 9V7a4.5 4.5 0 0 1 9 0v2" />
      <path d="M10.5 13.5h3" />
    </svg>
  );
}

function ToteBag({ className, style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 8h14l-1 11.2a1 1 0 0 1-1 .8H7a1 1 0 0 1-1-.8L5 8z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
      <path d="M8 5.5c1-1.2 7-1.2 8 0" />
    </svg>
  );
}

function TopHandleBag({ className, style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5.5 10h13l-.7 9a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9l-.7-9z" />
      <path d="M9 10V8.5a3 3 0 0 1 6 0V10" />
      <path d="M11 6.2a3.4 3.4 0 0 1 2 0" />
      <path d="M10.5 14.5h3" />
    </svg>
  );
}
