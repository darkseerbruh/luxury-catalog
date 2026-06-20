import Link from "next/link";
import type { CollectionItem } from "@/lib/queries";
import BagItemActions from "./BagItemActions";

function itemTitle(it: CollectionItem) {
  return (
    [it.sizeLabel, it.exteriorColorway, it.hardwareColor ? `${it.hardwareColor} HW` : null]
      .filter(Boolean)
      .join(" · ") || "Variant"
  );
}

export default function CollectionList({
  items,
  variant,
}: {
  items: CollectionItem[];
  variant: "collection" | "wishlist";
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
        {variant === "wishlist" ? (
          <>Nothing on your wishlist yet. Open any bag and choose <span className="text-foreground">“Want it”</span> to start tracking it.</>
        ) : (
          <>Your collection is empty. Open any bag and mark <span className="text-foreground">“I own it”</span> to add it here.</>
        )}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((it) => (
        <li
          key={it.userBagId}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted">
                {it.brandName}
              </p>
              <Link
                href={`/bag/${it.variantId}`}
                className="font-serif text-lg text-foreground hover:text-gold"
              >
                {it.styleName}
              </Link>
              <p className="text-sm text-muted">{itemTitle(it)}</p>

              {variant === "wishlist" && it.stillInProduction === false && (
                <p className="mt-1 text-xs text-gold/80">
                  Discontinued — resale only
                </p>
              )}
              {variant === "collection" && it.status === "own" && (
                <Link
                  href={`/bag/${it.variantId}`}
                  className="mt-1 inline-block text-xs text-gold/80 hover:text-gold"
                >
                  Write a review →
                </Link>
              )}
            </div>

            <BagItemActions
              variantId={it.variantId}
              variant={variant}
              initialNotify={it.notifyOnAvailability}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
