import type { Metadata } from "next";
import Link from "next/link";
import { listPublished } from "@/lib/posts";
import { classifyDepartment } from "@/lib/article-departments";
import { SITE_URL } from "@/lib/geo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authentication — spot the real thing yourself, or bring in a pro · Luxury Catalog",
  description:
    "Per-house authentication guides, a photo check, and a pro review in one place. The markers worth checking on the bags people fake most, in plain words. Markers to check, not a verdict.",
  alternates: { canonical: `${SITE_URL}/authentication` },
  openGraph: {
    title: "Authentication · Luxury Catalog",
    description: "Per-house guides, a photo check, and a pro review. Markers to check, not a verdict.",
    url: `${SITE_URL}/authentication`,
    type: "website",
  },
};

/** The Learn / Check / Verify ladder: read the markers, check a photo yourself,
 * or hand it to a professional. Each rung is a real surface we already have. */
const LADDER = [
  {
    step: "01",
    title: "Learn the markers",
    body: "Read the per-house guide for the bag you are checking. What a real one does, era by era, and the tells that warrant a second look.",
    href: "#guides",
    cta: "Browse the guides",
  },
  {
    step: "02",
    title: "Spot the fake",
    body: "Found one in the wild? Snap a photo and we tell you what it looks like, what it is worth if genuine, and the markers to check. A listing-link red-flag check is on the way.",
    href: "/identify",
    cta: "Spot the Fake",
  },
  {
    step: "03",
    title: "Bring in a pro",
    body: "For a costly buy, or before you sell or insure, hand it to a verified authenticator for a hands-on review.",
    href: "/authenticate",
    cta: "Get it authenticated",
  },
];

export default async function AuthenticationHub() {
  const posts = await listPublished();
  const guides = posts
    .filter((p) => classifyDepartment(p) === "authentication")
    .sort((a, b) => (a.topic.brandName ?? a.title).localeCompare(b.topic.brandName ?? b.title));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      {/* Hero */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Luxury Catalog</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">Authentication</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Spot the real thing yourself, or bring in a pro. Per-house guides on the bags people fake most,
          a photo check, and a hands-on review, in one place. These are{" "}
          <span className="text-gold-soft">markers to check, not a verdict</span>: no single marker proves a
          bag, and for anything costly we point you to a professional.
        </p>
      </div>

      {/* The ladder */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {LADDER.map((r) => (
          <Link
            key={r.step}
            href={r.href}
            className="group flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-gold"
          >
            <span className="font-serif text-lg font-bold text-gold">{r.step}</span>
            <h2 className="mt-1 font-serif text-xl text-foreground group-hover:text-gold-soft">{r.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{r.body}</p>
            <span className="mt-3 text-sm font-medium text-gold group-hover:text-gold-soft">{r.cta} &rarr;</span>
          </Link>
        ))}
      </div>

      {/* The guides */}
      <section id="guides" className="scroll-mt-24">
        <div className="border-b-2 border-gold pb-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">The guides</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">Authentication by house</h2>
          <p className="mt-1 text-sm italic text-muted">Markers to check, not a verdict.</p>
        </div>

        {guides.length === 0 ? (
          <p className="mt-6 text-muted">The guides are being written, check back soon.</p>
        ) : (
          <div className="mt-4 grid gap-x-10 sm:grid-cols-2">
            {guides.map((p) => (
              <Link
                key={p.postId}
                href={`/articles/${p.slug}`}
                className="group flex items-baseline gap-3 border-b border-border/60 py-2.5"
              >
                <span className="shrink-0 text-gold">&rarr;</span>
                <span>
                  <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
                    {p.title}
                  </span>
                  {p.topic.brandName && (
                    <span className="mt-0.5 block text-[11px] tracking-wide text-muted">{p.topic.brandName}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
