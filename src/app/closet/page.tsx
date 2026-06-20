import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCloset } from "@/lib/collections";

export const dynamic = "force-dynamic";

export const metadata = { title: "My closet · The Luxury Catalog" };

const STATUS_LABELS: Record<string, string> = {
  want: "Want",
  have: "Have",
  had: "Had",
};

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function ClosetPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const closet = await getCloset();

  const groups: { key: string; label: string }[] = [
    { key: "have", label: "Have" },
    { key: "want", label: "Want" },
    { key: "had", label: "Had" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Your closet</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Saved bags</h1>
        <p className="mt-2 text-muted">
          Bags you want, have, or have owned — all in one place.
        </p>
      </header>

      {closet.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">Your closet is empty.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Browse the catalog and use <span className="text-gold">Save this bag</span> on
            any bag to add it here.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        groups.map((g) => {
          const items = closet.filter((c) => c.status === g.key);
          if (items.length === 0) return null;
          return (
            <section key={g.key}>
              <h2 className="mb-3 font-serif text-xl text-foreground">
                {g.label}{" "}
                <span className="text-sm text-muted">({items.length})</span>
              </h2>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
                {items.map((c) => (
                  <li key={c.variantId}>
                    <Link
                      href={`/bag/${c.variantId}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-raised/40"
                    >
                      <div>
                        <p className="text-sm uppercase tracking-wide text-muted">
                          {c.brandName}
                        </p>
                        <p className="font-serif text-foreground">{c.styleName}</p>
                        <p className="text-sm text-muted">{c.label}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {formatPrice(c.retailPrice, c.currency) && (
                          <p className="text-sm text-gold">
                            {formatPrice(c.retailPrice, c.currency)}
                          </p>
                        )}
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
                          {STATUS_LABELS[c.status] ?? c.status}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}
