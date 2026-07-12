/**
 * The specific shades we've RECORDED within a colour family (owner 2026-07-12: "let collectors
 * see specific colours by season"). Chanel publishes no official seasonal colour names, so this
 * is honestly the sellers' shade descriptions from real listings, not a house lexicon — framed
 * that way. Collapsed by default so it never walls the page.
 */
export default function SeasonalShades({
  colourFamily,
  shades,
}: {
  colourFamily: string;
  shades: { name: string; count: number }[];
}) {
  if (shades.length < 2) return null;
  return (
    <details className="rounded-2xl border border-border bg-surface/50 p-5">
      <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-gold">
        The {colourFamily.toLowerCase()} shades we&rsquo;ve recorded ({shades.length})
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {shades.map((s) => (
          <span key={s.name} className="rounded-full border border-border px-3 py-1 text-sm text-muted">
            {s.name}
            <span className="ml-1 text-xs text-muted/60">{s.count}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted/70">
        Shades recorded from resale listings, in the sellers&rsquo; own words. Chanel doesn&rsquo;t
        publish official seasonal colour names, so treat these as descriptions, not house names.
      </p>
    </details>
  );
}
