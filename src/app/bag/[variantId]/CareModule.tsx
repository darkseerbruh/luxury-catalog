import Link from "next/link";
import { careItemsForMaterial, careMaterialsFor } from "@/lib/bag-care";
import CareOutboundLink from "@/components/care/CareOutboundLink";
import { careItemImageUrl } from "@/lib/affiliate";

/**
 * "Care for it" — the OWN-state module on the bag page. The rest of the page
 * serves want/buy/sell; this is the first surface for the bag once it's yours.
 * It reads the bag's exterior material and surfaces the two or three care items
 * that actually matter for that finish (suede gets a suede brush, patent gets the
 * no-solvents caution), then routes to the full /care shelf. Picks are framed as
 * our take, never a verdict; the material line is a gentle nudge, not a rule.
 */

/** A short, hedged lead line tuned to the bag's material family. */
function materialLead(materialName: string | null): string {
  const fams = careMaterialsFor(materialName);
  if (fams.includes("patent")) {
    return "Patent stays glossy with almost nothing: a soft wipe, and no solvents or conditioner.";
  }
  if (fams.includes("suede")) {
    return "Suede lives and dies by the nap. A brush revives it; oils and conditioners ruin it.";
  }
  if (fams.includes("exotic")) {
    return "Exotic skins are their own world. Keep them dry and dust-free, and leave real cleaning to a specialist.";
  }
  if (fams.includes("canvas")) {
    return "Coated canvas is the low-maintenance one. Wipe it down; save the leather care for the trim.";
  }
  if (fams.includes("grained-leather")) {
    return "Grained leather is forgiving, but it still likes a gentle clean and the odd condition.";
  }
  return "A little upkeep goes a long way. Shape it, keep it dry, and clean gently.";
}

export default function CareModule({
  materialName,
  materialLabel,
}: {
  /** The raw exterior material name used to pick items (may be null). */
  materialName: string | null;
  /** A display label for the material, if any. */
  materialLabel: string | null;
}) {
  const items = careItemsForMaterial(materialName);
  if (items.length === 0) return null;

  return (
    <section id="care" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="mb-2 flex items-center gap-2 font-serif text-xl text-foreground">
        <span aria-hidden>🧴</span> Care for it
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        {materialLabel ? (
          <>
            <span className="text-foreground">{materialLabel}:</span> {materialLead(materialName)}
          </>
        ) : (
          materialLead(materialName)
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => {
          // Real Amazon product photo once PA-API is live; null today (affiliate.ts).
          const imageUrl = careItemImageUrl(item.searchQuery);
          return (
          <div
            key={item.key}
            className="flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-gold"
          >
            {imageUrl && (
              <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-foreground/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-contain" />
              </div>
            )}
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{item.whatItDoes}</p>
            <CareOutboundLink
              query={item.searchQuery}
              item={item.key}
              source="bag_page"
              className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
            >
              Find on Amazon &rarr;
            </CareOutboundLink>
          </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted/70">
        Our picks are a starting point. Test anything new on a hidden spot first. Some Amazon links
        are affiliate links.
      </p>
      <Link
        href="/care"
        className="mt-3 inline-block text-sm text-gold-soft underline underline-offset-2 hover:text-gold"
      >
        See the full care shelf &rarr;
      </Link>
    </section>
  );
}
