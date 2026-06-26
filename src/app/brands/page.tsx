import Link from "next/link";
import { BRAND_TIERS, getBrandsOverview } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All brands · The Luxury Catalog",
  description:
    "Every designer handbag brand we cover, grouped by tier — production history, authentication markers, and real resale prices for each.",
};

export default async function BrandsPage() {
  const brands = await getBrandsOverview();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <h1 className="font-serif text-3xl text-foreground">All brands</h1>
      <p className="mt-2 max-w-xl text-muted">
        Every house we cover, grouped by tier. Pick a brand for its full catalog,
        or jump straight to its most documented styles.
      </p>

      <div className="mt-10 flex flex-col gap-12">
        {BRAND_TIERS.map((tier) => {
          const group = brands.filter((b) => b.tier === tier.key);
          if (group.length === 0) return null;
          return (
            <section key={tier.key}>
              <p className="text-xs uppercase tracking-widest text-muted/70">
                {tier.label}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((brand) => (
                  <div key={brand.brandId}>
                    <Link
                      href={`/brand/${brand.brandId}`}
                      className="font-serif text-lg text-foreground transition-colors hover:text-gold"
                    >
                      {brand.name}
                    </Link>
                    {brand.isLive ? (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {brand.topStyles.map((s) => (
                          <li key={s.styleId}>
                            <Link
                              href={
                                s.variantId
                                  ? `/bag/${s.variantId}`
                                  : `/brand/${brand.brandId}`
                              }
                              className="text-sm text-muted transition-colors hover:text-gold"
                            >
                              {s.name}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href={`/brand/${brand.brandId}`}
                            className="text-sm text-gold transition-colors hover:text-gold-soft"
                          >
                            View all {brand.name} →
                          </Link>
                        </li>
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted/60">
                        Coming soon
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
