import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Collection report · The Luxury Catalog" };

function symbolFor(currency: string | null): string {
  return currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
}
function fmt(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  return `${symbolFor(currency)}${amount.toLocaleString()}`;
}

/**
 * Collection report — an itemised, exportable valuation of the bags a user owns
 * ("have"), for insurance / estate / record-keeping. Distinct from /recap (the
 * shareable Year-in-Bags). Values are the catalogued original retail as an
 * estimate; cost-basis + gain/loss (for tax) need a purchase-price column
 * (migration-gated TODO in collections) and are intentionally not faked here.
 */
export default async function CollectionReportPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [closet, profile] = await Promise.all([getCloset(), getProfile()]);

  const owned = closet.filter((c) => c.status === "have");
  const priced = owned.filter((c) => c.retailPrice != null);

  // Dominant currency among priced items, for an honest total symbol.
  const currencyCounts = new Map<string, number>();
  for (const c of priced) currencyCounts.set(c.currency ?? "USD", (currencyCounts.get(c.currency ?? "USD") ?? 0) + 1);
  let currency: string | null = null;
  let best = -1;
  for (const [cur, n] of currencyCounts) if (n > best) { best = n; currency = cur; }

  const total = priced.reduce((sum, c) => sum + (c.retailPrice ?? 0), 0);
  const asOf = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const ownerName = profile?.displayName || (profile?.handle ? `@${profile.handle}` : "Your");

  const rows = owned.map((c) => ({
    brand: c.brandName,
    style: c.styleName,
    variant: c.label ?? "",
    value: c.retailPrice,
    currency: c.currency,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Collection report</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground">
            {ownerName === "Your" ? "Your collection" : `${ownerName}'s collection`}
          </h1>
          <p className="mt-1 text-sm text-muted">As of {asOf}</p>
        </div>
        <div className="print:hidden">
          <ReportActions rows={rows} total={total} currency={currency} asOf={asOf} owner={ownerName} />
        </div>
      </header>

      {owned.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">No owned bags to report yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Mark bags as <span className="text-gold">Have it</span> and they&rsquo;ll appear here with
            an estimated value.
          </p>
          <Link
            href="/closet"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Back to closet
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm uppercase tracking-widest text-muted">Total estimated value</p>
            <p className="mt-1 font-serif text-3xl text-foreground">{fmt(total, currency)}</p>
            <p className="mt-1 text-sm text-muted">
              Across {owned.length} owned {owned.length === 1 ? "bag" : "bags"}
              {priced.length < owned.length
                ? ` · ${owned.length - priced.length} without a catalogued price not counted`
                : ""}
              .
            </p>
          </section>

          <section>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted/70">
                  <th className="py-2 pr-3 font-normal">#</th>
                  <th className="py-2 pr-3 font-normal">Brand</th>
                  <th className="py-2 pr-3 font-normal">Style</th>
                  <th className="py-2 pr-3 font-normal">Variant</th>
                  <th className="py-2 pl-3 text-right font-normal">Est. value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2 pr-3 text-muted/70">{i + 1}</td>
                    <td className="py-2 pr-3 text-muted">{r.brand}</td>
                    <td className="py-2 pr-3 text-foreground">{r.style}</td>
                    <td className="py-2 pr-3 text-muted">{r.variant}</td>
                    <td className="py-2 pl-3 text-right text-foreground">{fmt(r.value, r.currency)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-3 pr-3" colSpan={4}>Total</td>
                  <td className="py-3 pl-3 text-right text-gold">{fmt(total, currency)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-border bg-surface/50 px-5 py-4 text-xs leading-relaxed text-muted">
            <p className="font-medium text-muted">About these values</p>
            <p className="mt-1">
              Estimated values are the bag&rsquo;s catalogued <em>original retail price</em>, provided as
              a record-keeping estimate — not a formal appraisal. Actual resale/replacement value varies
              by condition, year, market, and provenance. For insurance or tax filings, obtain a
              professional appraisal. <span className="text-muted/70">Cost basis and gain/loss (for
              capital-gains reporting) require entering what you paid per bag — a planned addition.</span>
            </p>
          </section>
        </>
      )}
    </main>
  );
}
