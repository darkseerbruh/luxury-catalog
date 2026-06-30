import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getYearInBags, RECAP_MIN_ITEMS } from "@/lib/recap";
import RecapShare from "@/components/RecapShare";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your Year in Bags · Luxury Catalog" };

export default async function RecapPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const recap = await getYearInBags();

  const periodLabel = recap.activeYear ? `${recap.activeYear}` : "so far";

  // Honest one-line summary reused for the share text and the screenshot card.
  const summaryParts: string[] = [];
  if (recap.haveCount > 0)
    summaryParts.push(`${recap.haveCount} ${recap.haveCount === 1 ? "bag" : "bags"} in my collection`);
  if (recap.wantCount > 0) summaryParts.push(`${recap.wantCount} on my wishlist`);
  if (recap.reviewCount > 0)
    summaryParts.push(`${recap.reviewCount} ${recap.reviewCount === 1 ? "review" : "reviews"} written`);
  const shareSummary = `My Year in Bags${recap.activeYear ? ` (${recap.activeYear})` : ""}: ${
    summaryParts.join(", ") || "building my collection"
  } — on Luxury Catalog.`;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          Your Year in Bags · {periodLabel}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          A look back at your collection
        </h1>
      </header>

      {!recap.hasEnough ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">Log a few bags first.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Once you&rsquo;ve saved at least {RECAP_MIN_ITEMS} bags to your
            closet, we&rsquo;ll build your Year in Bags recap — your top
            brands, your taste, and what you&rsquo;ve been tracking.{" "}
            {recap.totalCloset > 0 && (
              <>You have {recap.totalCloset} so far.</>
            )}
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <>
          {/* Screenshot-ready recap card */}
          <section
            className="flex flex-col gap-5 rounded-2xl border border-gold/40 bg-gradient-to-br from-surface-raised to-surface p-6"
            aria-label="Year in Bags recap card"
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-gold/80">
                Luxury Catalog · Year in Bags{recap.activeYear ? ` ${recap.activeYear}` : ""}
              </p>
              {recap.tasteName && (
                <p className="mt-3 font-serif text-2xl text-foreground">
                  You&rsquo;re a {recap.tasteName}
                </p>
              )}
              {recap.tasteTagline && (
                <p className="mt-1 text-sm text-muted">{recap.tasteTagline}</p>
              )}
            </div>

            {/* Honest stat grid — only counts that exist */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {recap.haveCount > 0 && <Stat n={recap.haveCount} label="In collection" />}
              {recap.wantCount > 0 && <Stat n={recap.wantCount} label="On the wishlist" />}
              {recap.hadCount > 0 && <Stat n={recap.hadCount} label="Previously owned" />}
              {recap.reviewCount > 0 && <Stat n={recap.reviewCount} label="Reviews written" />}
            </div>

            {recap.topBrands.length > 0 && (
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-muted">
                  Your top {recap.topBrands.length === 1 ? "brand" : "brands"}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {recap.topBrands.map((b) => (
                    <span
                      key={b.brandName}
                      className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-sm text-foreground"
                    >
                      {b.brandName}
                      <span className="ml-1 text-xs text-muted">×{b.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs uppercase tracking-widest text-muted">
              theluxurycatalog.com
            </p>
          </section>

          <RecapShare summary={shareSummary} />

          <div className="flex flex-wrap gap-3">
            <Link
              href="/closet"
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Back to my closet
            </Link>
            <Link
              href="/profile/reviews"
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              My reviews
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <p className="font-serif text-2xl text-gold">{n}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
