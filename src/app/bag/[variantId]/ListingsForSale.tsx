import { getListingsForVariant, type Offer } from "@/lib/listings";
import { affiliateListingUrl } from "@/lib/affiliate";
import { DealBadge } from "@/components/DealBadge";

function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

/** "listed today" / "listed 3 days ago" from an observed_on date, when we have one. */
function freshness(observedOn: string | null): string | null {
  if (!observedOn) return null;
  const then = new Date(observedOn);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "listed today";
  if (days === 1) return "listed yesterday";
  if (days < 30) return `listed ${days} days ago`;
  return null;
}

/** Honest, human description of the comps a listing was rated against. */
function basis(offer: Offer, sizeLabel: string | null): string {
  const r = offer.rating;
  if (!r) return "";
  const fv = r.fairValue;
  if (fv.variantLevel) {
    return `vs all ${fv.compCount} resale records for this bag (limited spec data)`;
  }
  const size = sizeLabel ? ` ${sizeLabel}` : "";
  const desc = [
    fv.dimsUsed.includes("color") ? offer.colorway : null,
    fv.dimsUsed.includes("material") ? offer.material : null,
  ]
    .filter(Boolean)
    .join(" ");
  const noun = `${desc}${size}`.trim() || "comparable";
  return fv.broadened
    ? `vs ${fv.compCount} ${noun} listings, broadened from this exact spec (limited data)`
    : `vs ${fv.compCount} ${noun} listings`;
}

function specChips(offer: Offer): string[] {
  return [offer.colorway, offer.material, offer.hardwareColor, offer.condition].filter(
    (s): s is string => !!s,
  );
}

/**
 * "For sale right now" — the bag-page rail of live listings for this exact variant, each
 * rated against the fair value for its spec and linking out to the seller. Renders
 * nothing when there are no live listings (the WhereToBuy search links below stay as the
 * fallback). Async server component; fully resilient via getListingsForVariant.
 */
export default async function ListingsForSale({ variantId }: { variantId: number }) {
  const data = await getListingsForVariant(variantId);
  if (!data || data.offers.length === 0) return null;

  return (
    <section id="for-sale" className="scroll-mt-4 border-t border-border pt-8">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">For sale right now</h2>
        <span className="text-sm text-muted">
          {data.offers.length} {data.offers.length === 1 ? "listing" : "listings"}
        </span>
      </div>
      <p className="mb-4 max-w-prose text-sm text-muted">
        Live listings for this bag across the marketplaces we track, each rated against
        the fair value for its spec. We don&rsquo;t sell these, we link you to the seller.
        Prices change and sell.
      </p>

      <ul className="flex flex-col gap-3">
        {data.offers.map((offer, i) => {
          const fresh = freshness(offer.observedOn);
          const sub = [offer.platformLabel, fresh].filter(Boolean).join(" · ");
          const href = offer.sourceUrl ? affiliateListingUrl(offer.sourceUrl, offer.platform) : null;
          const basisText = basis(data.offers[i], data.sizeLabel);
          return (
            <li
              key={i}
              className="rounded-2xl border border-border bg-surface px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {specChips(offer).map((c) => (
                      <span
                        key={c}
                        className="rounded-md bg-bg/40 px-2 py-0.5 text-xs text-muted"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-serif text-lg text-foreground">
                    {formatPrice(offer.price, offer.currency)}
                  </p>
                  {offer.rating && (
                    <DealBadge
                      band={offer.rating.band}
                      pctUnder={offer.rating.pctUnder}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span
                  className={`text-xs ${offer.rating?.fairValue.broadened ? "text-amber-400" : "text-muted"}`}
                >
                  {basisText}
                </span>
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    View on {offer.platformLabel}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 max-w-prose text-xs text-muted/70">
        Fair value is the median of recorded resale prices for that spec, broadened and
        labeled when a spec is thin. An estimate, not an appraisal. Affiliate links may
        earn us a commission.
      </p>
    </section>
  );
}
