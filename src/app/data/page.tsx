import type { Metadata } from "next";
import { getMarketPulse } from "@/lib/market-pulse";
import FunFacts from "@/components/FunFacts";
import AttributeFacts from "@/components/AttributeFacts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The data behind every page",
  description:
    "The luxury world keeps its resale numbers behind glass. This is the whole dataset the rest of the site runs on, real, sourced, and free to see.",
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
  const depthMax = pulse.byHouse[0]?.observations ?? 0;
  const priceMax = pulse.medianByHouse[0]?.median ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-12">
      <p className="text-sm uppercase tracking-widest text-gold">The data behind every page</p>
      <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">The numbers they keep behind glass</h1>
      <p className="mt-3 max-w-2xl text-muted">
        The luxury world keeps its numbers behind glass: what a bag really resells for,
        which houses hold their value, what the market actually pays. We think that
        should be open to everyone. So every figure here is real, sourced, and free to
        see, the whole dataset the rest of the site runs on.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={pulse.totalPrices.toLocaleString()} label="resale prices on record" />
        <StatCard value={pulse.bags.toLocaleString()} label="bags tracked" />
        <StatCard value={pulse.houses.toLocaleString()} label="houses covered" />
        <StatCard value={pulse.earliestYear ? `${pulse.earliestYear}` : "—"} label="earliest price on record" />
      </div>

      {/* The data — the serious modules */}
      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {pulse.medianByHouse.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-serif text-2xl text-foreground">Typical resale price by house</h2>
            <p className="mt-1 text-sm text-muted">
              The median of each house&rsquo;s styles, across the bags we track. Our read, not an appraisal.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {pulse.medianByHouse.map((h) => (
                <li key={h.name} className="flex items-center gap-3">
                  <span className="w-24 flex-shrink-0 truncate text-sm text-foreground">{h.name}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-gold"
                      style={{ width: `${priceMax > 0 ? Math.max(2, Math.round((h.median / priceMax) * 100)) : 0}%` }}
                    />
                  </span>
                  <span className="w-16 flex-shrink-0 text-right text-sm text-gold">${h.median.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pulse.byHouse.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-serif text-2xl text-foreground">Where our data runs deepest</h2>
            <p className="mt-1 text-sm text-muted">Resale prices we have logged, by house.</p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {pulse.byHouse.map((h) => (
                <li key={h.name} className="flex items-center gap-3">
                  <span className="w-24 flex-shrink-0 truncate text-sm text-foreground">{h.name}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-gold"
                      style={{ width: `${depthMax > 0 ? Math.max(2, Math.round((h.observations / depthMax) * 100)) : 0}%` }}
                    />
                  </span>
                  <span className="w-14 flex-shrink-0 text-right text-sm text-muted">
                    {h.observations.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Just for fun — the delight zone, warm-tinted to feel different from the data above */}
      <section className="mt-14">
        <p className="text-sm uppercase tracking-widest text-gold">Just for fun</p>
        <h2 className="mt-1 font-serif text-2xl text-foreground">The stuff we noticed</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Numbers with no agenda, just what falls out of a big dataset when you go looking.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FunFacts />
          <AttributeFacts />
        </div>
      </section>

      <p className="mt-12 max-w-2xl text-sm text-muted">
        These are observed prices, listings and sales we have recorded, not appraisals.
        Coverage is deeper for the houses that trade most.
      </p>
    </main>
  );
}
