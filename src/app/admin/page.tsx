import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Luxury Catalog",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  {
    href: "/admin/searched-not-found",
    title: "Searched, not found",
    description:
      "Searches and camera identifications that returned no match. Shows what to research and add next.",
  },
  {
    href: "/admin/feedback",
    title: "User feedback",
    description:
      "Accuracy reports submitted from bag detail pages — which records users say are wrong or incomplete.",
  },
  {
    href: "/admin/requests",
    title: "Requests & finds",
    description:
      "Bag-addition requests and logged thrift finds — what people want added, and what they're paying in the wild.",
  },
  {
    href: "/admin/corrections",
    title: "Corrections",
    description:
      "User-submitted 'suggest an edit' corrections. Accept/reject triage; accepted edits are applied to the catalog manually.",
  },
  {
    href: "/admin/photos",
    title: "Photos",
    description:
      "User-submitted reference photos awaiting review. Approve to publish, feature to make it the hero, or reject. Trusted contributors auto-publish.",
  },
  {
    href: "/admin/authentication",
    title: "Authentication demand",
    description:
      "How many people raised their hand for the (coming-soon) pro authentication service — the fake-door signal and your warm launch list.",
  },
];

export default function AdminIndexPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Admin</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Catalog operations</h1>
        <p className="mt-2 text-muted">
          Internal dashboards. What users are asking for, flagging, and finding.
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
