import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure — Luxury Catalog",
  description:
    "How Luxury Catalog earns affiliate and referral commissions, and what that means for the links and prices you see.",
};

export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">Affiliate disclosure</h1>
      <p className="mt-2 text-sm text-muted">Last updated June 22, 2026</p>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted">
        <p>
          Luxury Catalog is a free reference site. To support it, some of the outbound links on
          our pages — for example, the &ldquo;Where to buy&rdquo; search links to resale platforms
          such as Fashionphile, The RealReal, and Vestiaire Collective — are{" "}
          <span className="text-foreground">affiliate links</span>. If you click one and make a
          purchase, we may earn a commission, <span className="text-foreground">at no extra cost to
          you</span>.
        </p>
        <p>
          We may also earn a referral fee when we link you to a service that buys, consigns, insures,
          or appraises bags. Where that is the case, we say so on the page.
        </p>
        <p>
          These commissions may influence which retailers and services we link to. They do{" "}
          <span className="text-foreground">not</span> change the price you pay, and they do not
          change the factual catalog information — production history, authentication markers, and the
          like — which we research and present independently.
        </p>
        <p>
          Listings, availability, and prices on third-party platforms are set by those platforms, not
          by us, and can change at any time. Any prices we show are estimates for general information
          (see our{" "}
          <a href="/disclaimer" className="text-foreground underline hover:text-gold">
            disclaimer
          </a>
          ).
        </p>
        <p className="text-muted/70">
          This disclosure is provided in the spirit of the U.S. Federal Trade Commission&rsquo;s
          Endorsement Guides. Questions? Reach us at hello@luxurycatalog.com.
        </p>
      </div>
    </main>
  );
}
