import type { BagStory as Story, TidbitKind } from "@/lib/bag-stories";

/**
 * "The Story" module — the per-bag editorial layer (our honest analog of
 * Spotify's "About the song" + "SongDNA" card). Server component, no client JS.
 *
 * Layout: stacked sourced cards, each led by a per-category icon tile and a gold
 * left edge so the cards read as a set without feeling monotonous.
 *
 * Parts:
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

/** Per-category line icons (decorative; the text label carries the meaning). */
function KindIcon({ kind }: { kind: TidbitKind | "numbers" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    "aria-hidden": true as const,
  };
  switch (kind) {
    case "origin": // spark — where it began
      return (
        <svg {...common} fill="currentColor">
          <polygon points="12,2 14,9.5 21.5,12 14,14.5 12,22 10,14.5 2.5,12 10,9.5" />
        </svg>
      );
    case "design": // pen nib
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21 L7 20 L19 8 L16 5 L4 17 Z" />
          <path d="M14 7 L17 10" />
        </svg>
      );
    case "culture": // trophy
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4 h10 v3 a5 5 0 0 1 -10 0 Z" />
          <path d="M17 5 h3 v2 a3 3 0 0 1 -3 3" />
          <path d="M7 5 H4 v2 a3 3 0 0 0 3 3" />
          <path d="M12 12 v4" />
          <path d="M8.5 20 h7" />
          <path d="M10 16 h4 v4 h-4 Z" />
        </svg>
      );
    case "trivia": // lightbulb
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18 h6" />
          <path d="M10 21 h4" />
          <path d="M12 3 a6 6 0 0 0 -4 10.5 c0.8 0.8 1 1.5 1 2.5 h6 c0 -1 0.2 -1.7 1 -2.5 A6 6 0 0 0 12 3 Z" />
        </svg>
      );
    case "numbers": // bar chart
      return (
        <svg {...common} fill="currentColor">
          <rect x="4" y="13" width="3.5" height="7" rx="1" />
          <rect x="10.2" y="8" width="3.5" height="12" rx="1" />
          <rect x="16.4" y="4" width="3.5" height="16" rx="1" />
        </svg>
      );
  }
}

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

function initials(name: string): string {
  return name
    .replace(/["'].*?["']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** One sourced card with its category icon tile and gold left edge. */
function StoryCard({
  kind,
  eyebrow,
  title,
  children,
  highlight = false,
}: {
  kind: TidbitKind | "numbers";
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <article
      className={`relative flex gap-4 overflow-hidden rounded-2xl border p-5 pl-6 ${
        highlight ? "border-gold/30 bg-gold/5" : "border-border bg-surface"
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-gold to-gold/20"
      />
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
        <KindIcon kind={kind} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-gold/80">{eyebrow}</p>
        <h3 className="mt-1 font-serif text-lg text-foreground">{title}</h3>
        {children}
      </div>
    </article>
  );
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
          <StoryCard key={i} kind={t.kind} eyebrow={KIND_LABEL[t.kind]} title={t.title}>
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
          </StoryCard>
        ))}

        {/* Self-updating market fact (only when we hold recorded resale data). */}
        {marketFact && (
          <StoryCard kind="numbers" eyebrow="By the numbers" title="What the market says today" highlight>
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
          </StoryCard>
        )}
      </div>

      {/* The people behind the bag (designers + muses). Heading kept distinct
          from the page's separate "Bag DNA" attribute-objects module. */}
      {story.people.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-lg text-foreground">The people behind it</h3>
          <p className="mt-1 text-sm text-muted">Designers and muses.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {story.people.map((p) => (
              <li key={p.name} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-br from-gold/20 to-transparent font-serif text-sm text-gold"
                >
                  {initials(p.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-[11px] uppercase tracking-wide text-gold/80">{p.role}</p>
                  {p.note && <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.note}</p>}
                </div>
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
