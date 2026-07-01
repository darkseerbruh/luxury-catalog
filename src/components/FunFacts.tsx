import { getFunFacts } from "@/lib/fun-facts";

/**
 * Two delight sections for /data, mined from bags we already track:
 *  - "Named after icons" (lore: Grace Kelly, Princess Diana, Jackie O...)
 *  - "Bag math" (playful price-ratio equations from live medians)
 * Both self-hide if the data is missing, so the page degrades cleanly.
 */

function priceLabel(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export default async function FunFacts() {
  const { named, priceOf } = await getFunFacts();

  const equations = [
    { one: "Hermès Birkin", many: "Louis Vuitton Neverfulls", a: priceOf.birkin, b: priceOf.neverfull },
    { one: "Hermès Kelly", many: "Michael Kors Jet Sets", a: priceOf.kelly, b: priceOf.jetSet },
    { one: "Chanel Classic Flap", many: "Louis Vuitton Speedys", a: priceOf.classicFlap, b: priceOf.speedy },
  ]
    .map((e) => ({
      one: e.one,
      many: e.many,
      count: e.a != null && e.b != null && e.b > 0 ? Math.round(e.a / e.b) : null,
    }))
    .filter((e) => e.count != null && e.count > 1);

  if (named.length === 0 && equations.length === 0) return null;

  return (
    <>
      {named.length > 0 && (
        <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <p className="text-sm uppercase tracking-widest text-gold">From the database</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">Named after icons</h2>
          <p className="mt-1 text-sm text-muted">The muses hiding in plain sight across the bags we track.</p>
          <ul className="mt-6 flex flex-col">
            {named.map((b) => (
              <li
                key={`${b.brand}-${b.style}`}
                className="flex flex-col gap-1 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="text-foreground sm:w-48 sm:flex-shrink-0">
                  {b.brand} <span className="text-muted">{b.style}</span>
                </span>
                <span className="flex-1">
                  <span className="text-gold">{b.namesake}</span>
                  <span className="mt-0.5 block text-sm text-muted">{b.lore}</span>
                </span>
                {b.median != null && (
                  <span className="text-sm text-gold sm:flex-shrink-0">{priceLabel(b.median)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {equations.length > 0 && (
        <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <p className="text-sm uppercase tracking-widest text-gold">By the numbers</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">Bag math</h2>
          <p className="mt-1 text-sm text-muted">What one bag is worth, counted in other bags.</p>
          <ul className="mt-6 flex flex-col gap-3">
            {equations.map((e) => (
              <li
                key={e.one}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-2xl border border-border bg-surface px-5 py-4"
              >
                <span className="text-foreground">One {e.one}</span>
                <span className="text-muted">=</span>
                <span className="font-serif text-xl text-gold">{e.count?.toLocaleString()}</span>
                <span className="text-foreground">{e.many}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
