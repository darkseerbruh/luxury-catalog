import Link from "next/link";
import { getSearchedNotFound } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Searched, not found — Admin · Luxury Catalog",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function SearchedNotFoundPage() {
  const rows = await getSearchedNotFound();
  const totalSearches = rows.reduce((sum, r) => sum + r.count, 0);
  const unresolved = rows.filter((r) => !r.resolved).length;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">
            Admin
          </Link>{" "}
          / Searched, not found
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Searched, not found</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Every search and camera identification that returned no catalog match. The
          most-requested bags here are what to research and add next.
        </p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Distinct queries" value={rows.length.toString()} />
        <Stat label="Total misses" value={totalSearches.toString()} />
        <Stat label="Unresolved" value={unresolved.toString()} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No missed searches logged yet. Once people search for bags that aren&rsquo;t in
          the catalog, they&rsquo;ll show up here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Query</th>
                <th className="px-3 py-3 text-center font-medium">Source</th>
                <th className="px-3 py-3 text-right font-medium">Times</th>
                <th className="px-3 py-3 text-right font-medium">Last searched</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={`${r.source}:${r.query}`} className="transition-colors hover:bg-surface-raised/40">
                  <td className="px-5 py-3 text-foreground">
                    <Link
                      href={`/search?q=${encodeURIComponent(r.query)}`}
                      className="transition-colors hover:text-gold"
                    >
                      {r.query}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        r.source === "camera"
                          ? "border-gold/30 text-gold/90"
                          : "border-border text-muted"
                      }`}
                    >
                      {r.source}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-foreground">{r.count}</td>
                  <td className="px-3 py-3 text-right text-muted">{formatDate(r.lastSearched)}</td>
                  <td className="px-5 py-3 text-right">
                    {r.resolved ? (
                      <span className="text-gold/80">resolved</span>
                    ) : (
                      <span className="text-muted/70">open</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-serif text-3xl text-foreground">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
