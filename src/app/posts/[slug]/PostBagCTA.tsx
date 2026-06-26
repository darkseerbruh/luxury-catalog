import Link from "next/link";
import { buildResaleLinks, buildConsignmentLinks, buildRentalLinks, applyEbayAffiliate } from "@/lib/affiliate";

/**
 * The "money-moment" on an article: turns a topic-tagged post into a commissionable
 * hand-off. Sell/consign is surfaced FIRST (the consignor referral is the dominant
 * revenue lever vs a buyer click), then where to buy. Links are affiliate-attributed
 * via `affiliate.ts` (eBay is live; others flip on when their codes land) and carry
 * rel="sponsored nofollow" + an FTC disclosure. Renders nothing without a topic.
 */
const PILL =
  "rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold";

export function PostBagCTA({
  brandName,
  styleName,
  slug,
}: {
  brandName: string | null;
  styleName: string | null;
  slug: string;
}) {
  const brand = brandName ?? "";
  const style = styleName ?? "";
  if (!brand && !style) return null;
  const label = [brand, style].filter(Boolean).join(" ").trim();

  const sell = buildConsignmentLinks(brand, style);
  const buy = buildResaleLinks(brand, style);
  const rent = buildRentalLinks(brand, style);
  const ebayUrl = applyEbayAffiliate(
    `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(label)}&_sacat=169291`,
    `post-${slug}`,
  );

  return (
    <section className="rounded-2xl border border-gold/30 bg-gold/[0.03] p-5">
      <h2 className="font-serif text-lg text-foreground">Buying or selling a {label}?</h2>

      {sell.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Sell or consign yours</p>
          <p className="mt-0.5 text-xs text-muted">It holds its value, so list it where you&apos;ll get the most.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sell.map((l) => (
              <a key={l.key} href={l.url} target="_blank" rel="sponsored nofollow noopener" className={PILL}>
                {l.name}
                <span className="text-muted/70"> · {l.mode === "consign" ? "consign" : "instant offer"}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm font-medium text-foreground">Shop the resale market</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {buy.map((l) => (
            <a key={l.key} href={l.url} target="_blank" rel="sponsored nofollow noopener" className={PILL}>
              {l.name}
            </a>
          ))}
          <a href={ebayUrl} target="_blank" rel="sponsored nofollow noopener" className={PILL}>
            eBay
          </a>
        </div>
      </div>

      {rent.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Not ready to buy? Rent it first</p>
          <p className="mt-0.5 text-xs text-muted">Carry it for a trip or a season before you commit.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {rent.map((l) => (
              <a key={l.key} href={l.url} target="_blank" rel="sponsored nofollow noopener" className={PILL}>
                {l.name}
                <span className="text-muted/70"> · {l.note}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Some links above are affiliate links. If you buy or sell through them we may earn a commission, at no
        cost to you.{" "}
        <Link href="/disclosure" className="underline hover:text-gold">
          How this works
        </Link>
        .
      </p>
    </section>
  );
}
