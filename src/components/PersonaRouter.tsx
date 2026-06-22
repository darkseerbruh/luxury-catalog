import Link from "next/link";

/**
 * Persona router — makes the five defined use cases "plain as day" on entry, so a
 * stranger arriving from search/GEO/TikTok is routed to the flow built for them.
 * Grounded in NN/g information-scent/discoverability and KBB's "lead with the use
 * case" model (see docs/ux/ux-evaluation.md F1/F2).
 */

type Persona = {
  label: string;
  blurb: string;
  href: string;
  cta: string;
};

const PERSONAS: Persona[] = [
  {
    label: "Collect & invest",
    blurb: "Production history, materials, and resale value for bags you keep.",
    href: "/#brands",
    cta: "Browse the catalog",
  },
  {
    label: "Buy & resell",
    blurb: "Price trends and where to buy — and where to sell — for a profit.",
    href: "/search",
    cta: "Check prices",
  },
  {
    label: "My first designer bag",
    blurb: "Find your taste, then research before you commit.",
    href: "/quiz",
    cta: "Find your taste",
  },
  {
    label: "Verify it's authentic",
    blurb: "Date codes, hardware, and authentication markers by year.",
    href: "/identify",
    cta: "Identify a bag",
  },
  {
    label: "I found one thrifting",
    blurb: "Snap a photo — is it real, and what's it worth?",
    href: "/identify",
    cta: "Scan a find",
  },
];

export default function PersonaRouter() {
  return (
    <section className="border-b border-border px-5 py-12">
      <h2 className="font-serif text-2xl text-foreground">What brings you in?</h2>
      <p className="mt-1 text-sm text-muted">
        Pick a goal — we&rsquo;ll take you to the right place.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold"
          >
            <p className="font-serif text-lg text-foreground">{p.label}</p>
            <p className="mt-1 flex-1 text-sm text-muted">{p.blurb}</p>
            <p className="mt-3 text-sm text-gold transition-colors group-hover:text-gold-soft">
              {p.cta} →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
