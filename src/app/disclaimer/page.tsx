import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer — The Luxury Catalog",
  description:
    "Prices and information on The Luxury Catalog are for general reference only — not appraisals, offers, or financial, tax, or insurance advice.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">Disclaimer</h1>
      <p className="mt-2 text-sm text-muted">Last updated June 22, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Prices are estimates, not appraisals</h2>
          <p>
            Any prices, price histories, or trends shown are{" "}
            <span className="text-foreground">estimates</span> compiled from recorded third-party
            resale data. They are for general information only. They are not offers to buy or sell, are
            not guarantees of any sale or resale price, may be out of date, and may differ from actual
            transaction prices. They are <span className="text-foreground">not appraisals</span> and
            should not be used as the appraised or insured value of any item. For insurance scheduling,
            tax, estate, or donation purposes, obtain a formal valuation from a qualified, credentialed
            appraiser.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Not financial, tax, or insurance advice</h2>
          <p>
            Nothing on this site is financial, investment, tax, legal, or insurance advice. Luxury
            handbags are collectible goods, not regulated securities; their value can go down as well
            as up. References to &ldquo;investment,&rdquo; &ldquo;value,&rdquo; or &ldquo;price
            trends&rdquo; are general commentary, not predictions or guarantees of future returns. The
            tax treatment of buying and selling collectibles is specific to your situation — consult a
            qualified tax professional before relying on any figure here.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Catalog accuracy</h2>
          <p>
            We research authentication markers, date codes, and production details carefully and leave
            details unstated when we cannot verify them. Even so, information is provided
            &ldquo;as is&rdquo; without warranty, and authentication ultimately requires a qualified
            expert examining the physical item. Do your own research before buying, selling, or
            insuring.
          </p>
        </section>

        <p className="text-muted/70">Questions? Reach us at hello@luxurycatalog.com.</p>
      </div>
    </main>
  );
}
