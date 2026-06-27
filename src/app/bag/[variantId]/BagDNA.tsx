import Link from "next/link";
import { slugify } from "@/lib/queries";

/**
 * Bag DNA — the Spotify "SongDNA" lesson for bags. Each catalogued attribute is a
 * tappable card that links to its own object page (leather / silhouette / hardware)
 * or the house page. Built only from real attributes; a card renders only when its
 * value exists, so it degrades gracefully on thin variants. Pure server-rendered
 * links (no client JS) so every edge is crawlable for GEO.
 *
 * Nodes: House, Leather, Hardware, Shape, Colour, Era. The Designer node waits on
 * creative-director data the catalog does not hold yet. See docs/ux/object-oriented-ux.md.
 */
export default function BagDNA({
  brandId,
  brandName,
  brandTier,
  leather,
  hardware,
  silhouette,
  colorway,
  yearStart,
  yearEnd,
}: {
  brandId: number;
  brandName: string;
  brandTier: string | null;
  leather: string | null;
  hardware: string | null;
  silhouette: string | null;
  colorway: string | null;
  yearStart: number | null;
  yearEnd: number | null;
}) {
  const eraDecade = yearStart != null ? Math.floor(yearStart / 10) * 10 : null;
  const eraYears =
    yearStart != null ? (yearEnd != null ? `${yearStart}–${yearEnd}` : `${yearStart} to now`) : null;
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
    colorway
      ? {
          label: "Colour",
          value: colorway,
          meta: null,
          href: `/color/${slugify(colorway)}`,
          swatch: colorSwatch(colorway),
        }
      : null,
    eraDecade != null
      ? {
          label: "Era",
          value: `${eraDecade}s`,
          meta: eraYears,
          href: `/era/${eraDecade}s`,
          swatch: "conic-gradient(from 180deg,#2a2620,#3a342a,#2a2620)",
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

/** A swatch keyed to the colour word, so the card reads at a glance. Never claims a
 *  precise shade; it is a gentle visual cue over the real colourway label. */
function colorSwatch(colorway: string): string {
  const k = colorway.toLowerCase();
  const map: { test: RegExp; bg: string }[] = [
    { test: /black|noir|nero/, bg: "linear-gradient(135deg,#2c2c2c,#0d0d0d)" },
    { test: /white|blanc|chalk|ivory|cream|beige|tan|etoupe|trench/, bg: "linear-gradient(135deg,#efe7d6,#cdbfa3)" },
    { test: /brown|chocolate|coffee|cognac|caramel|camel|gold|tan/, bg: "linear-gradient(135deg,#9a6f43,#5e3f24)" },
    { test: /red|rouge|cherry|burgundy|bordeaux|wine/, bg: "linear-gradient(135deg,#a23b34,#5e1f1c)" },
    { test: /pink|rose|blush|fuchsia/, bg: "linear-gradient(135deg,#e3a9b8,#b9697f)" },
    { test: /blue|navy|denim|cobalt|teal/, bg: "linear-gradient(135deg,#4a6a8a,#26384d)" },
    { test: /green|olive|khaki|emerald|sage/, bg: "linear-gradient(135deg,#5d6f4a,#33402a)" },
    { test: /grey|gray|silver|charcoal|slate/, bg: "linear-gradient(135deg,#9a9a9f,#5b5b60)" },
    { test: /purple|violet|lilac|plum|mauve/, bg: "linear-gradient(135deg,#8a6fa3,#4f3a63)" },
    { test: /orange|rust|terracotta/, bg: "linear-gradient(135deg,#c47a3c,#7e4a22)" },
    { test: /yellow|mustard|canary/, bg: "linear-gradient(135deg,#d9be5a,#9a832e)" },
  ];
  return map.find((m) => m.test.test(k))?.bg ?? "linear-gradient(135deg,#3a342a,#242019)";
}
