import type { BagStory as Story, TidbitKind } from "@/lib/bag-stories";

/**
 * "The Story" module — the per-bag editorial layer (our honest analog of
 * Spotify's "About the song" + "SongDNA" card). Server component, no client JS.
 *
 * Three parts:
 *  1. Cited tidbits (origin / design / culture / trivia), each with sources.
 *  2. "By the numbers" — a self-updating market fact computed from OUR recorded
 *     resale data (the one tidbit that writes itself; framed as an estimate).
 *  3. "Bag DNA" — the people behind the bag (designer, namesake, creative dir).
 *  4. A "Watch" link-out to interviews and runway footage.
 */

const KIND_LABEL: Record<TidbitKind, string> = {
  origin: "Origin",
  design: "Design",
  culture: "Culture",
  trivia: "Good to know",
};

export interface StoryMarketFact {
  medianResale: number;
  count: number;
  currency: string | null;
  /** Median resale as a share of original retail, when both exist. */
  retentionPct: number | null;
  asOf: string | null;
}

function money(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

export default function BagStory({
  story,
  brandName,
  styleName,
  marketFact,
}: {
  story: Story;
  brandName: string;
  styleName: string;
  marketFact?: StoryMarketFact | null;
}) {
  const watchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${brandName} ${styleName} ${story.watchQuery}`,
  )}`;

  return (
    <section id="the-story" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="font-serif text-2xl text-foreground">The Story</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{story.tagline}</p>

      {/* Cited tidbits */}
      <div className="mt-5 flex flex-col gap-4">
        {story.tidbits.map((t, i) => (
          <article key={i} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-widest text-gold/80">{KIND_LABEL[t.kind]}</p>
            <h3 className="mt-1 font-serif text-lg text-foreground">{t.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted/70">
              <span className="uppercase tracking-wide">Sources</span>
              {t.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="nofollow noopener"
                  className="underline decoration-border underline-offset-2 transition-colors hover:text-gold hover:decoration-gold"
                >
                  {s.name}
                </a>
              ))}
            </p>
          </article>
        ))}

        {/* Self-updating market fact (only when we hold recorded resale data). */}
        {marketFact && (
          <article className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <p className="text-[11px] uppercase tracking-widest text-gold/80">By the numbers</p>
            <h3 className="mt-1 font-serif text-lg text-foreground">What the market says today</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Across {marketFact.count} recorded resale{" "}
              {marketFact.count === 1 ? "listing" : "listings"}, the {styleName} sits around{" "}
              <span className="text-foreground">{money(marketFact.medianResale, marketFact.currency)}</span>
              {marketFact.retentionPct != null && (
                <>
                  , roughly{" "}
                  <span className="text-foreground">{marketFact.retentionPct}%</span> of its original
                  retail
                </>
              )}
              . This is our estimate from current data, not an appraisal
              {marketFact.asOf ? `, as of ${marketFact.asOf.slice(0, 10)}` : ""}.
            </p>
          </article>
        )}
      </div>

      {/* Bag DNA — the people */}
      {story.people.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-lg text-foreground">Bag DNA</h3>
          <p className="mt-1 text-sm text-muted">The people behind the bag.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {story.people.map((p) => (
              <li key={p.name} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs uppercase tracking-wide text-gold/80">{p.role}</p>
                {p.note && <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watch link-out (real curated embeds live in the video section below). */}
      <a
        href={watchUrl}
        target="_blank"
        rel="nofollow noopener"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
      >
        Watch interviews &amp; runway footage
        <span aria-hidden>↗</span>
      </a>
    </section>
  );
}
