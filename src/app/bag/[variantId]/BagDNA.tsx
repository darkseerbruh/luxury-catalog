import Link from "next/link";
import { slugify } from "@/lib/queries";

/**
 * Bag DNA — the Spotify "SongDNA" lesson for bags. Each catalogued attribute is a
 * tappable card that links to its own object page (leather / silhouette / hardware)
 * or the house page. Built only from real attributes; a card renders only when its
 * value exists, so it degrades gracefully on thin variants. Pure server-rendered
 * links (no client JS) so every edge is crawlable for GEO.
 *
 * Phase 1 nodes: House, Leather, Hardware, Shape. Era and Colour join in Phase 2
 * (their own object pages); the Designer node waits on creative-director data the
 * catalog does not hold yet. See docs/ux/object-oriented-ux.md.
 */
export default function BagDNA({
  brandId,
  brandName,
  brandTier,
  leather,
  hardware,
  silhouette,
}: {
  brandId: number;
  brandName: string;
  brandTier: string | null;
  leather: string | null;
  hardware: string | null;
  silhouette: string | null;
}) {
  const dnaCards: (DnaCardProps | null)[] = [
    {
      label: "House",
      value: brandName,
      meta: brandTier ? brandTier.replace("-", " ") : null,
      href: `/brand/${brandId}`,
      initial: brandName.trim().charAt(0).toUpperCase() || "·",
    },
    leather
      ? {
          label: "Leather",
          value: leather,
          meta: null,
          href: `/leather/${slugify(leather)}`,
          swatch: "radial-gradient(circle at 30% 30%, #3a3631, #15130f)",
        }
      : null,
    hardware
      ? {
          label: "Hardware",
          value: hardware,
          meta: null,
          href: `/hardware/${slugify(hardware)}`,
          swatch: hardwareSwatch(hardware),
        }
      : null,
    silhouette
      ? {
          label: "Shape",
          value: silhouette,
          meta: null,
          href: `/silhouette/${slugify(silhouette)}`,
          swatch: "#262019",
        }
      : null,
  ];
  const cards = dnaCards.filter((c): c is DnaCardProps => c !== null);

  // House alone is not worth a section; show DNA only when there's real composition.
  if (cards.length < 2) return null;

  return (
    <section id="dna" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="font-serif text-xl text-foreground">Bag DNA</h2>
      <p className="mt-1 text-sm text-muted">
        What this bag is made of. Tap any part to explore the rest of the catalog.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <DnaCard key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
}

interface DnaCardProps {
  label: string;
  value: string;
  meta: string | null;
  href: string;
  /** CSS background for the swatch circle. */
  swatch?: string;
  /** A monogram letter instead of a swatch (used for the house card). */
  initial?: string;
}

function DnaCard({ label, value, meta, href, swatch, initial }: DnaCardProps) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
    >
      {initial ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border font-serif text-lg text-gold-soft">
          {initial}
        </span>
      ) : (
        <span
          aria-hidden
          className="h-10 w-10 shrink-0 rounded-full border border-white/10"
          style={{ background: swatch }}
        />
      )}
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-muted">{label}</span>
        <span className="block truncate text-[15px] text-foreground">{value}</span>
        {meta && <span className="block truncate text-[11px] capitalize text-muted">{meta}</span>}
      </span>
      <span aria-hidden className="absolute bottom-3 right-3 text-gold">
        &rsaquo;
      </span>
    </Link>
  );
}

/** A metallic-ish swatch keyed to the hardware colour words we actually catalog. */
function hardwareSwatch(color: string): string {
  const k = color.toLowerCase();
  if (k.includes("gold") && k.includes("rose")) return "linear-gradient(135deg,#e3b7a0,#b07a62)";
  if (k.includes("gold")) return "linear-gradient(135deg,#d9b25a,#8a6d2e)";
  if (k.includes("rose")) return "linear-gradient(135deg,#e3b7a0,#b07a62)";
  if (/silver|palladium|ruthenium|nickel|chrome|steel/.test(k))
    return "linear-gradient(135deg,#d8d8de,#8b8b93)";
  if (k.includes("black")) return "linear-gradient(135deg,#2c2c2c,#0f0f0f)";
  return "linear-gradient(135deg,#3a342a,#242019)";
}
