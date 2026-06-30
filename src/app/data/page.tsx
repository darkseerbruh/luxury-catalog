import type { Metadata } from "next";
import { getMarketPulse } from "@/lib/market-pulse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The data behind every page",
  description:
    "The resale-price dataset under Luxury Catalog: how many prices we track, across how many bags and houses, and how far back it reaches.",
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-serif text-3xl text-foreground sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function DataPage() {
  const pulse = await getMarketPulse();
  const max = pulse.byHouse[0]?.observations ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-12">
      <p className="text-sm uppercase tracking-widest text-gold">The data behind every page</p>
      <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">What we track</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every price story, value read, and deal on this site comes from one place: a
        running record of real resale prices. Here is how much of it there is, kept
        current as new prices come in.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={pulse.totalPrices.toLocaleString()} label="resale prices on record" />
        <StatCard value={pulse.bags.toLocaleString()} label="bags tracked" />
        <StatCard value={pulse.houses.toLocaleString()} label="houses covered" />
        <StatCard value={pulse.earliestYear ? `${pulse.earliestYear}` : "—"} label="earliest price on record" />
      </div>

      {pulse.byHouse.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-foreground">Where our data runs deepest</h2>
          <p className="mt-1 text-sm text-muted">Resale prices we have logged, by house.</p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {pulse.byHouse.map((h) => (
              <li key={h.name} className="flex items-center gap-3">
                <span className="w-28 flex-shrink-0 truncate text-sm text-foreground sm:w-36">{h.name}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={{ width: `${max > 0 ? Math.max(2, Math.round((h.observations / max) * 100)) : 0}%` }}
                  />
                </span>
                <span className="w-16 flex-shrink-0 text-right text-sm text-muted">
                  {h.observations.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 max-w-2xl text-sm text-muted">
        These are observed prices, listings and sales we have recorded, not appraisals.
        Coverage is deeper for the houses that trade most.
      </p>
    </main>
  );
}
