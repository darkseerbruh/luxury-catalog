import type { Metadata } from "next";
import Link from "next/link";
import { getMostWantedBags } from "@/lib/coveted-bags";
import { BagImage } from "@/components/BagImage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Most Wanted Bags · Luxury Catalog",
  description:
    "The bags collectors want most right now, ranked by how many people have each one on their want list. The board shifts as people add bags they're after.",
};

export default async function CovetedBagsPage() {
  const bags = await getMostWantedBags(50);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Leaderboard</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Most wanted bags</h1>
        <p className="mt-2 max-w-prose text-muted">
          The bags collectors want most right now, ranked by how many people have
          each one on their want list. Add a bag to your want list, and it climbs.
        </p>
      </header>

      {bags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-10 text-center text-muted">
          No bags have enough want signal yet. Add the bags you&rsquo;re after to
          your want list, and the board fills in.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {bags.map((bag, i) => (
            <li key={bag.variantId}>
              <Link href={`/bag/${bag.variantId}`}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-gold">
                  <span className="w-7 shrink-0 text-center font-serif text-lg text-gold">
                    {i + 1}
                  </span>
                  <BagImage
                    brand={bag.brandName}
                    className="h-14 w-14 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-foreground">
                      {[bag.brandName, bag.styleName].filter(Boolean).join(" ") ||
                        "A bag"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">{bag.label}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted">
                    <span className="block font-serif text-base text-foreground">
                      {bag.wantCount}
                    </span>
                    {bag.wantCount === 1 ? "want" : "wants"}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
