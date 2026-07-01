import Link from "next/link";
import { getInterestStats } from "@/lib/authentication";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Authentication demand — Admin · Luxury Catalog",
  robots: { index: false, follow: false },
};

export default async function AdminAuthenticationPage() {
  const stats = await getInterestStats();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">Admin</Link> / Authentication demand
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Authentication demand</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The fake-door signal: how many people raised their hand for professional authentication
          while it&rsquo;s still &ldquo;coming soon.&rdquo; These rows are also your warm launch list —
          once you flag a verified authenticator, the bag-page button turns into the real request
          form and these become their first queue.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Total interest" value={stats.total} />
        <Stat label="Unique people" value={stats.uniqueUsers} />
      </div>

      <section>
        <h2 className="mb-3 font-serif text-xl text-foreground">Most-wanted bags</h2>
        {stats.topBags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
            No interest captured yet. It appears when someone taps &ldquo;Notify me when it&rsquo;s
            live&rdquo; on a bag. (Needs <code>SUPABASE_SERVICE_ROLE_KEY</code>.)
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {stats.topBags.map((b) => (
              <li key={b.variantId} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link href={`/bag/${b.variantId}`} className="text-foreground hover:text-gold">
                  {[b.brandName, b.styleName].filter(Boolean).join(" · ") || `Variant #${b.variantId}`}
                </Link>
                <span className="shrink-0 text-sm text-gold">{b.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-center">
      <p className="font-serif text-3xl text-foreground">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
