import Link from "next/link";

/**
 * Persona router — leads with the value prop for each of the catalog's use cases
 * so a stranger arriving from search/GEO/social is hooked by *why* a feature is
 * for them, not just handed a list. Grounded in NN/g information-scent and the
 * "lead with the use case" model (see docs/ux/home-use-case-value-props.md).
 *
 * The two image-upload use cases — "is this authentic?" (the cautious buyer) and
 * "I found one thrifting" (the bargain hunter) — share one destination (`/identify`),
 * so they're shown ONCE as a single combined hook instead of two chips that go to
 * the same place.
 */

type UseCase = {
  label: string;
  blurb: string;
  href: string;
  cta: string;
};

// The combined image-upload hook. Its value prop has to land for BOTH the
// authentication-anxious buyer and the thrift/estate-sale hunter, because the
// same photo-scan flow serves both.
const SCAN: UseCase = {
  label: "Is it real — and what's it worth?",
  blurb:
    "Snap a photo of any bag — a thrift-store score or a resale listing you're about to trust — and match it against the catalog's authentication markers, date codes, and real resale prices. Whether it's a $20 estate-sale find or a five-figure buy, one scan tells you if it's genuine and what it actually sells for.",
  href: "/identify",
  cta: "Scan a bag",
};

const USE_CASES: UseCase[] = [
  {
    label: "Collect & invest",
    blurb:
      "Production history, materials, and what each piece actually resells for — the detail you need to buy and hold with confidence.",
    href: "/#brands",
    cta: "Browse the catalog",
  },
  {
    label: "Buy & resell",
    blurb:
      "Price trends and where to buy — and where to sell — so you know a fair number before you spend or list.",
    href: "/search",
    cta: "Check prices",
  },
  {
    label: "My first designer bag",
    blurb:
      "New to this? Find your taste in 60 seconds, then research the markers, sizes, and prices before you commit.",
    href: "/quiz",
    cta: "Find your taste",
  },
];

export default function PersonaRouter() {
  return (
    <section className="border-b border-border px-5 py-12">
      <h2 className="font-serif text-2xl text-foreground">What brings you in?</h2>
      <p className="mt-1 text-sm text-muted">
        Pick a goal — we&rsquo;ll take you straight to the part built for it.
      </p>

      {/* Featured combined hook: the photo-scan that serves both the
          "is it authentic?" buyer and the thrift hunter. */}
      <Link
        href={SCAN.href}
        className="group mt-6 flex flex-col rounded-2xl border border-gold/40 bg-gold/5 p-6 transition-colors hover:border-gold sm:p-7"
      >
        <p className="text-xs uppercase tracking-widest text-gold">
          Spotted one in the wild?
        </p>
        <p className="mt-2 font-serif text-xl text-foreground sm:text-2xl">
          {SCAN.label}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted">{SCAN.blurb}</p>
        <p className="mt-4 text-sm font-medium text-gold transition-colors group-hover:text-gold-soft">
          {SCAN.cta} &rarr;
        </p>
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {USE_CASES.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold"
          >
            <p className="font-serif text-lg text-foreground">{p.label}</p>
            <p className="mt-1 flex-1 text-sm text-muted">{p.blurb}</p>
            <p className="mt-3 text-sm text-gold transition-colors group-hover:text-gold-soft">
              {p.cta} &rarr;
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
