"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ShopSort } from "@/lib/listings";

const SORTS: { value: ShopSort; label: string }[] = [
  { value: "best-deal", label: "Best deal first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const PRICE_CAPS: { value: string; label: string }[] = [
  { value: "", label: "Any price" },
  { value: "1500", label: "Under $1,500" },
  { value: "3000", label: "Under $3,000" },
  { value: "7000", label: "Under $7,000" },
  { value: "15000", label: "Under $15,000" },
];

const selectClass =
  "rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:border-gold focus:border-gold focus:outline-none";

/** Filter + sort controls for the Shop grid. Each change updates the URL (server reads it). */
export default function ShopControls({
  brands,
  current,
}: {
  brands: { name: string; count: number }[];
  current: { brand: string; sort: string; deals: boolean; max: string };
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="shop-brand">
        Brand
      </label>
      <select
        id="shop-brand"
        className={selectClass}
        value={current.brand}
        onChange={(e) => update({ brand: e.target.value })}
      >
        <option value="">All brands</option>
        {brands.map((b) => (
          <option key={b.name} value={b.name}>
            {b.name} ({b.count})
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="shop-price">
        Maximum price
      </label>
      <select
        id="shop-price"
        className={selectClass}
        value={current.max}
        onChange={(e) => update({ max: e.target.value })}
      >
        {PRICE_CAPS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="shop-sort">
        Sort
      </label>
      <select
        id="shop-sort"
        className={selectClass}
        value={current.sort}
        onChange={(e) => update({ sort: e.target.value })}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => update({ deals: current.deals ? null : "1" })}
        aria-pressed={current.deals}
        className={
          current.deals
            ? "rounded-full border border-gold bg-gold-soft/10 px-3 py-1.5 text-sm font-medium text-gold"
            : "rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        }
      >
        Deals only
      </button>
    </div>
  );
}
