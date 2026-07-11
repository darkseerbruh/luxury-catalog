"use client";

import { useRouter } from "next/navigation";
import { BagFinder } from "@/components/BagFinder";

/**
 * The bag picker for the /where-to-sell estimator. Reuses the site-wide BagFinder;
 * on selecting a bag it hands the style to the page, which resolves a typical resale
 * value server-side and re-renders the net table. The manual dollar input lives
 * beside this, so a seller who knows their number can skip the lookup.
 */
export function BagValuePicker() {
  const router = useRouter();
  return (
    <BagFinder
      mode="closet"
      allowRequest={false}
      collapsedUntilFocus
      maxModels={6}
      placeholder="Search your bag, e.g. Chanel Classic Flap   (start typing →)"
      onSelect={(sel) => {
        router.push(`/where-to-sell?bag=${sel.styleId}`, { scroll: false });
      }}
    />
  );
}
