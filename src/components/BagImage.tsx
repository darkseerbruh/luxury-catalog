/**
 * Bag visual. When a sourced `imageUrl` exists (licensed / UGC / first-party — we
 * never AI-generate or hotlink unlicensed photos, per the product brief), it
 * renders the photo. Otherwise it renders a deliberate, luxury-styled placeholder
 * (brand wordmark + a handbag silhouette on a dark/gold treatment) so the catalog
 * reads as intentional rather than broken — and real photos drop straight in once
 * sourced. Decorative by default (aria-hidden); pass a meaningful `alt` for real
 * photos.
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
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt ?? (brand ? `${brand} bag` : "bag")}
        loading="lazy"
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface-raised to-surface ${className}`}
    >
      <HandbagGlyph className="h-1/2 w-1/2 text-gold/25" />
      {brand && (
        <span className="absolute bottom-2 left-0 right-0 truncate px-3 text-center font-serif text-xs uppercase tracking-widest text-muted/70">
          {brand}
        </span>
      )}
    </div>
  );
}

function HandbagGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
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
