import Link from "next/link";
import { getMostWantedPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Most wanted photos · The Luxury Catalog",
  description:
    "The bags collectors want most that have no photo yet. Have one in the wild? Add yours.",
};

export default async function MostWantedPhotosPage() {
  const wanted = await getMostWantedPhotos();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Help photograph these</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Most wanted photos</h1>
        <p className="mt-2 max-w-xl text-muted">
          The bags people want most that still have no photo. If you own one — or spot one
          in the wild — add a real, owned shot and yours could become the photo everyone
          sees. Every approved photo earns contributor points toward your next tier.
        </p>
      </header>

      {wanted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-foreground">No gaps to show right now.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Either every in-demand bag has a photo, or demand data isn&rsquo;t available yet.
            Browse the catalog and add a photo on any bag you own.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {wanted.map((w) => (
            <li key={w.variantId}>
              <Link
                href={`/bag/${w.variantId}#photos`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-raised/40"
              >
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-wide text-muted">{w.brandName ?? "—"}</p>
                  <p className="font-serif text-foreground">{w.styleName ?? `Variant #${w.variantId}`}</p>
                </div>
                <span className="shrink-0 text-sm text-gold">Add a photo →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
