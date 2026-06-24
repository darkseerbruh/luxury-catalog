import Link from "next/link";
import { FITS, CARRY_METHODS } from "@/lib/browse-taxonomy";

export const metadata = {
  title: "Browse bags · The Luxury Catalog",
  description:
    "Browse designer bags by how they're carried and what they fit — shoulder, crossbody, top handle, and more.",
};

export default function BrowsePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <h1 className="font-serif text-3xl text-foreground">Browse bags</h1>
      <p className="mt-2 max-w-xl text-muted">
        Find a bag by how you&rsquo;d carry it or what you need it to fit.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-foreground">
          By how they&rsquo;re carried
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARRY_METHODS.map((method) => (
            <Link
              key={method.slug}
              href={`/browse/carry/${method.slug}`}
              className="rounded-xl border border-border bg-surface px-4 py-4 text-foreground transition-colors hover:border-gold"
            >
              {method.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-foreground">By what they fit</h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FITS.map((fit) => (
            <Link
              key={fit.slug}
              href={`/browse/fits/${fit.slug}`}
              className="rounded-xl border border-border bg-surface px-4 py-4 text-foreground transition-colors hover:border-gold"
            >
              {fit.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
