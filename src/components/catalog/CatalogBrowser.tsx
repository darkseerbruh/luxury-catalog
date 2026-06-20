"use client";

/**
 * Catalog browse grid with tier + silhouette filters. Applying a filter fires
 * `catalog_filtered` (a Tier-1 demand signal); each card links to the variant
 * detail page, where `variant_viewed` fires.
 */
import { useMemo, useState } from "react";
import Link from "next/link";

import { EVENTS, track } from "@/lib/analytics/events";
import type { Bag, BrandTier } from "@/lib/catalog/sample-data";

const TIERS: (BrandTier | "all")[] = ["all", "ultra-luxury", "mid", "thrift"];

function priceLabel(bag: Bag): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: bag.currency,
    maximumFractionDigits: 0,
  }).format(bag.retail_price);
}

export function CatalogBrowser({ bags }: { bags: Bag[] }) {
  const [tier, setTier] = useState<BrandTier | "all">("all");
  const [silhouette, setSilhouette] = useState<string>("all");

  const silhouettes = useMemo(
    () => ["all", ...Array.from(new Set(bags.map((b) => b.silhouette)))],
    [bags],
  );

  const visible = useMemo(
    () =>
      bags.filter(
        (b) =>
          (tier === "all" || b.brand_tier === tier) &&
          (silhouette === "all" || b.silhouette === silhouette),
      ),
    [bags, tier, silhouette],
  );

  function applyTier(next: BrandTier | "all") {
    setTier(next);
    track(EVENTS.catalogFiltered, {
      filter_type: "brand_tier",
      filter_value: next,
      result_count: bags.filter(
        (b) =>
          (next === "all" || b.brand_tier === next) &&
          (silhouette === "all" || b.silhouette === silhouette),
      ).length,
    });
  }

  function applySilhouette(next: string) {
    setSilhouette(next);
    track(EVENTS.catalogFiltered, {
      filter_type: "silhouette",
      filter_value: next,
      result_count: bags.filter(
        (b) =>
          (tier === "all" || b.brand_tier === tier) &&
          (next === "all" || b.silhouette === next),
      ).length,
    });
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-4">
        <FilterRow label="Tier">
          {TIERS.map((t) => (
            <FilterChip key={t} active={tier === t} onClick={() => applyTier(t)}>
              {t}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Silhouette">
          {silhouettes.map((s) => (
            <FilterChip
              key={s}
              active={silhouette === s}
              onClick={() => applySilhouette(s)}
            >
              {s}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        {visible.length} {visible.length === 1 ? "piece" : "pieces"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((bag) => (
          <Link
            key={bag.id}
            href={`/bags/${bag.id}`}
            className="group flex flex-col rounded-2xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {bag.brand}
              </span>
              <ConfidenceBadge level={bag.confidence_level} />
            </div>
            <h3 className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {bag.style}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{bag.colorway}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-zinc-400 capitalize">
                {bag.silhouette} · {bag.size_category}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {priceLabel(bag)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 w-20 text-sm font-medium text-zinc-500">{label}</span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function ConfidenceBadge({ level }: { level: Bag["confidence_level"] }) {
  const styles: Record<Bag["confidence_level"], string> = {
    verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    high: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${styles[level]}`}>
      {level}
    </span>
  );
}
