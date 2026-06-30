import type { Metadata } from "next";
import Link from "next/link";
import { getCompareBags, type CompareBag } from "@/lib/compare";
import { BagImage } from "@/components/BagImage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare bags · Luxury Catalog",
  description: "Line up two or more bags side by side: identity, specs, retail and resale estimates.",
};

function symbol(currency: string | null): string {
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "$";
}

function money(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  return `${symbol(currency)}${Math.round(amount).toLocaleString()}`;
}

/**
 * Resale cell: the broad market range on record, framed as observed prices, not
 * a verdict. The view mixes listed + sold across conditions, so this is wider and
 * coarser than the bag page's spec-graded value — we say so and link there.
 */
function resaleCell(bag: CompareBag) {
  const r = bag.resale;
  if (!r || r.median == null || r.sampleSize < 1) {
    return <span className="text-muted">Not enough data on record</span>;
  }
  return (
    <span className="text-foreground">
      {money(r.median, r.currency)} mid
      <span className="block text-xs text-muted">
        {money(r.low, r.currency)}–{money(r.high, r.currency)} · across {r.sampleSize} prices on record
      </span>
    </span>
  );
}

const ROWS: { label: string; render: (b: CompareBag) => React.ReactNode }[] = [
  { label: "Brand", render: (b) => `${b.brandName}` },
  { label: "Style", render: (b) => b.styleName },
  { label: "Silhouette", render: (b) => b.silhouette ?? "—" },
  { label: "Size", render: (b) => b.sizeLabel ?? "—" },
  { label: "Material", render: (b) => b.material ?? "—" },
  { label: "Hardware", render: (b) => b.hardware ?? "—" },
  { label: "Years", render: (b) => b.years ?? "—" },
  { label: "Retail (orig.)", render: (b) => money(b.retailPrice, b.currency) },
  { label: "Resale on record", render: (b) => resaleCell(b) },
];

function parseIds(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const bags = await getCompareBags(parseIds(ids));

  if (bags.length < 2) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <h1 className="font-serif text-3xl text-foreground">Compare bags</h1>
        <p className="mt-3 text-muted">
          Put two or more bags next to each other to weigh the same decision: identity,
          specs, retail and a resale estimate. Open any bag and tap{" "}
          <span className="text-foreground">Add to compare</span>, then come back here.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Browse bags
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">Compare bags</h1>
      <p className="mt-2 mb-8 text-sm text-muted">
        Resale shows the broad range of recorded resale prices, not an appraisal. For the
        value graded to a bag&apos;s exact condition and spec, open the bag.
      </p>

      <div className="overflow-x-auto pb-24">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 p-3" />
              {bags.map((b) => (
                <th key={b.variantId} className="min-w-[160px] p-3 align-top">
                  <Link href={`/bag/${b.variantId}`} className="block group">
                    <span className="block aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface">
                      <BagImage imageUrl={b.imageUrl} alt={`${b.brandName} ${b.styleName}`} />
                    </span>
                    <span className="mt-2 block text-left font-medium text-foreground group-hover:text-gold">
                      {b.brandName} {b.styleName}
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="p-3 text-muted">{row.label}</td>
                {bags.map((b) => (
                  <td key={b.variantId} className="p-3 align-top text-foreground">
                    {row.render(b)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="p-3" />
              {bags.map((b) => (
                <td key={b.variantId} className="p-3">
                  <Link
                    href={`/bag/${b.variantId}`}
                    className="inline-block rounded-full border border-border px-4 py-2 text-xs text-foreground transition-colors hover:border-gold"
                  >
                    View bag
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
