import Link from "next/link";
import { getBagRequests, getThriftFinds } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Requests & finds — Admin · The Luxury Catalog",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export default async function RequestsPage() {
  const [requests, finds] = await Promise.all([getBagRequests(), getThriftFinds()]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">
            Admin
          </Link>{" "}
          / Requests &amp; finds
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Requests &amp; finds</h1>
        <p className="mt-2 max-w-2xl text-muted">
          User-submitted bag-addition requests and logged thrift finds — direct
          demand signal and real-world acquisition data.
        </p>
      </header>

      {/* Bag requests */}
      <section>
        <h2 className="mb-3 font-serif text-xl text-foreground">
          Bag-addition requests <span className="text-sm text-muted">({requests.length})</span>
        </h2>
        {requests.length === 0 ? (
          <EmptyState text="No bag requests yet. They appear when users hit a dead-end search and ask for a bag to be added." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Brand / style</th>
                  <th className="px-3 py-3 font-medium">From search</th>
                  <th className="px-3 py-3 font-medium">Details</th>
                  <th className="px-5 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r) => (
                  <tr key={r.requestId} className="align-top">
                    <td className="px-5 py-3 text-foreground">
                      {[r.brand, r.style].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-3 py-3 text-muted">{r.searchQuery ?? "—"}</td>
                    <td className="px-3 py-3 text-muted">{r.details ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-muted">{formatDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Thrift finds */}
      <section>
        <h2 className="mb-3 font-serif text-xl text-foreground">
          Thrift finds <span className="text-sm text-muted">({finds.length})</span>
        </h2>
        {finds.length === 0 ? (
          <EmptyState text="No finds logged yet. They appear when users log a thrift/estate find via the camera tool or /found." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Brand / style</th>
                  <th className="px-3 py-3 font-medium">Where</th>
                  <th className="px-3 py-3 text-right font-medium">Paid</th>
                  <th className="px-3 py-3 font-medium">Condition</th>
                  <th className="px-5 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {finds.map((f) => (
                  <tr key={f.findId} className="align-top">
                    <td className="px-5 py-3 text-foreground">
                      {[f.brand, f.style].filter(Boolean).join(" · ") || "—"}
                      {f.note && <p className="mt-1 text-xs text-muted">{f.note}</p>}
                    </td>
                    <td className="px-3 py-3 text-muted">{f.whereFound ?? "—"}</td>
                    <td className="px-3 py-3 text-right text-foreground">
                      {formatPrice(f.pricePaid, f.currency)}
                    </td>
                    <td className="px-3 py-3 capitalize text-muted">{f.condition ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-muted">{formatDate(f.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
      {text}
    </div>
  );
}
