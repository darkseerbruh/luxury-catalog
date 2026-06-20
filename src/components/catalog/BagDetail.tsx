"use client";

/**
 * Variant detail view. Fires the richest Tier-1 value events:
 *  - variant_viewed        on mount
 *  - auth_section_engaged  when an authentication section is expanded
 *  - price_history_viewed  when the price-history section is first opened
 *  - outbound_resale_clicked on a click out to a resale platform
 *
 * These are the candidate monetization signals the analytics plan optimizes for
 * while the business model is still being discovered.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { EVENTS, track } from "@/lib/analytics/events";
import { bagEventProps, type Bag } from "@/lib/catalog/sample-data";

export function BagDetail({ bag }: { bag: Bag }) {
  const props = bagEventProps(bag);

  // variant_viewed once per mount.
  useEffect(() => {
    track(EVENTS.variantViewed, { ...props, bag_id: bag.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bag.id]);

  return (
    <article className="w-full max-w-3xl">
      <Link
        href="/"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
      >
        ← Back to catalog
      </Link>

      <header className="mt-6">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          {bag.brand} · {bag.brand_tier}
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {bag.style}
        </h1>
        <p className="mt-2 text-zinc-500">{bag.colorway}</p>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-700 dark:text-zinc-300">
          {bag.summary}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Spec label="Silhouette" value={bag.silhouette} />
          <Spec label="Size" value={bag.size_category} />
          <Spec label="Material" value={bag.material_category} />
          <Spec
            label="Retail (orig.)"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: bag.currency,
              maximumFractionDigits: 0,
            }).format(bag.retail_price)}
          />
        </dl>
      </header>

      {/* Authentication markers — each expansion is an intent signal. */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Authentication markers
        </h2>
        <div className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {bag.authMarkers.map((marker) => (
            <AuthSection
              key={marker.title}
              title={marker.title}
              detail={marker.detail}
              eventProps={{ ...props, bag_id: bag.id, section: marker.title }}
            />
          ))}
        </div>
      </section>

      {/* Provenance & packaging. */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Provenance &amp; packaging
        </h2>
        <ul className="mt-3 space-y-2">
          {bag.provenance.map((p) => (
            <li key={p.item} className="text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                {p.item}
              </span>
              <span className="text-zinc-500"> — {p.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <PriceHistory bag={bag} eventProps={{ ...props, bag_id: bag.id }} />

      {/* Outbound resale links — affiliate-revenue proxy. */}
      <section className="mt-10 mb-16">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Find this on the resale market
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {bag.resaleLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track(EVENTS.outboundResaleClicked, {
                  ...props,
                  bag_id: bag.id,
                  platform: link.platform,
                })
              }
              className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
            >
              {link.platform} ↗
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-400">{label}</dt>
      <dd className="capitalize text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function AuthSection({
  title,
  detail,
  eventProps,
}: {
  title: string;
  detail: string;
  eventProps: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const fired = useRef(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    // Fire once, on first expand only.
    if (next && !fired.current) {
      fired.current = true;
      track(EVENTS.authSectionEngaged, eventProps);
    }
  }

  return (
    <div className="py-3">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-200">
          {title}
        </span>
        <span className="text-zinc-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {detail}
        </p>
      )}
    </div>
  );
}

function PriceHistory({
  bag,
  eventProps,
}: {
  bag: Bag;
  eventProps: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const fired = useRef(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !fired.current) {
      fired.current = true;
      track(EVENTS.priceHistoryViewed, {
        ...eventProps,
        data_points: bag.priceHistory.length,
      });
    }
  }

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Price history{" "}
          <span className="text-sm font-normal text-zinc-400">
            ({bag.priceHistory.length} recorded sales)
          </span>
        </h2>
        <span className="text-zinc-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400">
              <th className="py-1 font-normal">Date</th>
              <th className="py-1 font-normal">Platform</th>
              <th className="py-1 font-normal">Condition</th>
              <th className="py-1 text-right font-normal">Price</th>
            </tr>
          </thead>
          <tbody>
            {bag.priceHistory.map((p, i) => (
              <tr
                key={`${p.platform}-${i}`}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-2 text-zinc-500">{p.date}</td>
                <td className="py-2 text-zinc-900 dark:text-zinc-200">
                  {p.platform}
                </td>
                <td className="py-2 capitalize text-zinc-500">{p.condition}</td>
                <td className="py-2 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: bag.currency,
                    maximumFractionDigits: 0,
                  }).format(p.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
