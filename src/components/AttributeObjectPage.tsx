import Link from "next/link";
import { getVariantImages, type AttributeBag } from "@/lib/queries";
import { BagImage } from "@/components/BagImage";
import AttributeObjectTracker from "@/components/AttributeObjectTracker";

/** A labelled fact shown in the durability/identity card (leather only today). */
export interface AttrFact {
  label: string;
  value: string;
}

/** A prose note card (care, markers to check, resale read, house context). */
export interface AttrNote {
  /** Section heading. */
  label: string;
  body: string;
  /** Optional calibrated-hedge line shown under the body (e.g. "Markers to check, not a verdict."). */
  hedge?: string;
  /** Render in the gold "About" treatment rather than a plain card. */
  highlight?: boolean;
}

export interface AttributeObjectView {
  /** Plain-text kind for the breadcrumb, e.g. "Leather". */
  kindLabel: string;
  /** Display name, e.g. "Caviar". */
  name: string;
  /** One honest framing line under the title. */
  subtitle: string;
  facts: AttrFact[];
  notes: AttrNote[];
  bagCount: number;
  houses: string[];
  bags: AttributeBag[];
  /** Internal browse link for the shop hand-off, e.g. /search?q=Caviar. */
  shopHref: string;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="font-serif text-lg text-foreground">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

/**
 * The shared object (destination) page for a Bag DNA attribute. Identity, the real
 * catalogued detail, honest counts, and a grid of bags that share the attribute,
 * each routing to its own bag page (where the buy/sell hand-off lives). Built only
 * from real data; never fabricates a definition or a figure.
 */
export default async function AttributeObjectPage({ view }: { view: AttributeObjectView }) {
  const images = await getVariantImages(view.bags.map((b) => b.variantId));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <AttributeObjectTracker kind={view.kindLabel} name={view.name} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <span className="text-muted">{view.kindLabel}</span>
        <span>/</span>
        <span className="text-foreground">{view.name}</span>
      </nav>

      {/* Identity */}
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">{view.kindLabel}</p>
        <h1 className="mt-1 font-serif text-4xl text-foreground">{view.name}</h1>
        <p className="mt-3 max-w-prose text-muted">{view.subtitle}</p>
      </header>

      {/* At a glance */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={view.bagCount.toString()} label={view.bagCount === 1 ? "bag" : "bags"} />
        <Stat
          value={view.houses.length.toString()}
          label={view.houses.length === 1 ? "house" : "houses"}
        />
      </section>

      {/* Durability / identity facts (leather) */}
      {view.facts.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl text-foreground">How it wears</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {view.facts.map((f) => (
              <div key={f.label} className="flex gap-3 px-5 py-3 text-sm">
                <span className="w-40 shrink-0 text-muted">{f.label}</span>
                <span className="capitalize text-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prose notes (care, markers, resale read, house context) */}
      {view.notes.map((n) => (
        <section
          key={n.label}
          className={
            n.highlight
              ? "rounded-2xl border border-gold/30 bg-gold/5 p-5"
              : "rounded-2xl border border-border bg-surface p-5"
          }
        >
          <h2 className="font-serif text-xl text-foreground">{n.label}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{n.body}</p>
          {n.hedge && <p className="mt-2 text-xs text-muted/70">{n.hedge}</p>}
        </section>
      ))}

      {/* Explore rail: bags that share this attribute */}
      {view.bags.length > 0 ? (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-foreground">Bags with {view.name}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {view.bags.map((b) => (
              <Link
                key={b.variantId}
                href={`/bag/${b.variantId}`}
                className="flex flex-col rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-gold"
              >
                <BagImage
                  imageUrl={images[b.variantId]}
                  brand={b.brandName}
                  className="mb-3 aspect-square w-full rounded-xl"
                />
                <p className="text-xs uppercase tracking-wide text-muted">{b.brandName}</p>
                <p className="mt-0.5 line-clamp-2 font-serif text-base text-foreground">{b.styleName}</p>
                {(b.sizeLabel || b.exteriorColorway) && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {[b.sizeLabel, b.exteriorColorway].filter(Boolean).join(" · ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
          {view.bagCount > view.bags.length && (
            <p className="mt-4 text-sm text-muted">
              Showing {view.bags.length} of {view.bagCount}. {" "}
              <Link href={view.shopHref} className="text-gold hover:text-gold-soft">
                See them all &rarr;
              </Link>
            </p>
          )}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
          No bags catalogued with {view.name} yet. They&rsquo;re on the list.
        </div>
      )}

      {/* Shop hand-off — routes into bag pages, where the buy/sell links live */}
      <Link
        href={view.shopHref}
        className="block rounded-full border border-gold px-5 py-3 text-center text-sm font-medium text-gold-soft transition-colors hover:bg-gold/10"
      >
        Shop {view.name} bags &rarr;
      </Link>
    </main>
  );
}
