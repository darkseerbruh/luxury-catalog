import { buyLinks, sellLinks } from "@/lib/affiliates";

/**
 * The decision-point monetization surface (marketing plan, Decision 3 + the
 * funnel "Decide/Monetize" stages). Shows both sides of the transaction:
 * "where to buy" for shoppers and "where to sell" for thrift finders/flippers.
 */
export default function AffiliateLinks({
  brand,
  style,
}: {
  brand: string;
  style: string;
}) {
  const buy = buyLinks(brand, style);
  const sell = sellLinks();

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Where to buy or sell</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-sm font-medium text-foreground">
            Shopping for one?
          </p>
          <ul className="flex flex-col gap-2">
            {buy.map((l) => (
              <li key={`buy-${l.reseller}`}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  <span>Search {l.reseller}</span>
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-sm font-medium text-foreground">
            Found one to flip?
          </p>
          <ul className="flex flex-col gap-2">
            {sell.map((l) => (
              <li key={`sell-${l.reseller}`}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  <span>Sell on {l.reseller}</span>
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted/60">
        Some links are affiliate or consignor-referral links — Luxury Catalog may
        earn a commission, at no cost to you. We link to multiple platforms so you
        can compare.
      </p>
    </section>
  );
}
