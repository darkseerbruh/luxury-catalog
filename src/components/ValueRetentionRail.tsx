import Link from "next/link";
import { getValueRetentionLeaders } from "@/lib/leaderboards";

/**
 * "Bags that hold their value" — a homepage board powered purely by PRICE data
 * (resale median vs original retail), so it renders independently of the
 * review-gated "What the community knows" section. The numbers come from
 * variant_price_summary() over the whole price_history table; a bag only ranks
 * with a real sample (MIN_PRICE_OBSERVATIONS in leaderboards.ts), so this is an
 * honest "smart buys" read, not a thin-data fluke.
 *
 * Gated on its own data: hidden until at least MIN_TO_RENDER bags qualify, so it
 * never shows as a board of one. Value is framed as our read of the resale market,
 * never an appraisal.
 *
 * Metric: engagement + monetization. A credible value board steers attention to
 * specific bags (each row links to the bag page) and frames the resale upside.
 */

const MIN_TO_RENDER = 3;

export default async function ValueRetentionRail() {
  const entries = await getValueRetentionLeaders(6);
  if (entries.length < MIN_TO_RENDER) return null;

  return (
    <section className="border-b border-border px-5 py-12">
      <p className="text-sm uppercase tracking-widest text-gold">From the resale data</p>
      <h2 className="mt-1 font-serif text-2xl text-foreground">Bags that hold their value</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Resale price measured against original retail, from the prices we track.
        Our read of the market, not an appraisal.
      </p>

      <ol className="mt-6 flex flex-col gap-2.5">
        {entries.map((e, i) => (
          <li key={e.variantId}>
            <Link
              href={`/bag/${e.variantId}`}
              className="flex items-baseline gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-gold"
            >
              <span className="w-4 flex-shrink-0 font-serif text-gold">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">
                {e.brandName} {e.styleName}
              </span>
              <span className="flex-shrink-0 font-medium text-gold">{e.value}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
