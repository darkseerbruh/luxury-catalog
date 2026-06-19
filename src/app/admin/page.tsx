import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · The Luxury Catalog",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  {
    href: "/admin/searched-not-found",
    title: "Searched, not found",
    description:
      "Searches and camera identifications that returned no match — the data roadmap for what to research and add next.",
  },
  {
    href: "/admin/feedback",
    title: "User feedback",
    description:
      "Accuracy reports submitted from bag detail pages — which records users say are wrong or incomplete.",
  },
];

export default function AdminIndexPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Admin</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Catalog operations</h1>
        <p className="mt-2 text-muted">
          Internal dashboards that turn user signals into a research roadmap.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-gold/50"
          >
            <h2 className="font-serif text-xl text-foreground">{s.title}</h2>
            <p className="mt-2 text-sm text-muted">{s.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
