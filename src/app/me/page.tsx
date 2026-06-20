import Link from "next/link";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    href: "/me/bags",
    title: "Collection",
    blurb: "The bags you own and have owned — and where you’ll review them.",
  },
  {
    href: "/me/wishlist",
    title: "Wishlist",
    blurb: "The bags you want, with email alerts when one becomes available.",
  },
];

export default function MeHubPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">My bags</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Your shelf</h1>
        <p className="mt-2 text-sm text-muted">
          Track what you own, save what you want.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-gold"
          >
            <h2 className="font-serif text-xl text-foreground">{c.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
