"use client";

/**
 * One bag's identify result — extracted from the identify page so the single
 * snap, video, live camera, and haul flows all render the same card.
 *
 * Calibration rules live in the copy: markers to check, never a verdict; a
 * value only "if genuine"; the origin-stamp dealbreaker is the one place the
 * tool speaks firmly, and it stays conditioned on the photo being right.
 */

import { useState } from "react";
import Link from "next/link";
import {
  buildConsignmentLinks,
  buildEbaySoldCompsLink,
  buildResaleLinks,
} from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";
import type { IdentifyResponse } from "@/lib/identify/types";

function formatPrice(amount: number, currency: string) {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "High confidence",
  medium: "Moderate confidence",
  low: "Low confidence",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-gold border-gold/40 bg-gold/10",
  medium: "text-muted border-border",
  low: "text-muted border-border/50",
};

export default function ScanResult({
  result,
  liveReadText,
}: {
  result: IdentifyResponse;
  /** Brand text the live camera check read while filming, if any. */
  liveReadText?: string | null;
}) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const id = result.identification;
  const match = result.catalogMatch;
  if (!id) return null;

  const matchUrl = match?.variantId
    ? `/bag/${match.variantId}`
    : match?.brandName
      ? `/search?q=${encodeURIComponent([match.brandName, match.styleName].filter(Boolean).join(" "))}`
      : null;

  // Best brand/style strings for resale/consign deep-links and the share card.
  // Prefer the AI identification, fall back to the catalog match.
  const shareBrand = (id.brand || match?.brandName || "").trim();
  const shareStyle = (id.style || match?.styleName || "").trim();
  const resaleLinks =
    shareBrand || shareStyle ? buildResaleLinks(shareBrand, shareStyle) : [];
  const consignLinks =
    shareBrand || shareStyle ? buildConsignmentLinks(shareBrand, shareStyle) : [];
  const ebaySold =
    shareBrand || shareStyle
      ? buildEbaySoldCompsLink(shareBrand, shareStyle, "identify-offcatalog")
      : null;

  // Link to the bag page's above-the-fold value summary when we have a match.
  const valueUrl = match?.variantId ? `/bag/${match.variantId}#price` : null;

  const shareLabel = [shareBrand, shareStyle].filter(Boolean).join(" ") || "this bag";

  // Everything the tool actually READ off the bag (stamps, labels, tags), so
  // the user sees the evidence behind the name. Deduped, live read first.
  const readTexts = Array.from(
    new Set(
      [
        liveReadText,
        ...(result.logoHints ?? [])
          .filter((h) => h.legible && h.text)
          .map((h) => h.text!),
        id.priceTagText,
      ].filter((t): t is string => Boolean(t && t.trim()))
    )
  );

  // In the catalog = a real style row (styleId > 0). A brand-only match still
  // deserves the off-catalog treatment: no comps of ours to show.
  const inCatalog = Boolean(match && match.styleId);
  // The sourced net-payout estimator: pre-loaded with the matched bag when we have
  // it, else the hub where they can search it themselves.
  const sellEstimatorHref = inCatalog ? `/where-to-sell?bag=${match!.styleId}` : "/where-to-sell";

  async function handleShare() {
    const text = `I found a ${shareLabel} — identified with Luxury Catalog.`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Luxury Catalog", text, url });
      } catch {
        // user cancelled or share failed — no-op
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`.trim());
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2000);
      } catch {
        // clipboard unavailable — no-op
      }
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Confidence + catalog match banner */}
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
            CONFIDENCE_COLOR[id.confidence] ?? CONFIDENCE_COLOR.low
          }`}
        >
          {CONFIDENCE_LABEL[id.confidence] ?? id.confidence}
        </span>
        {matchUrl && match && (
          <Link
            href={matchUrl}
            className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            View in catalog →
          </Link>
        )}
      </div>

      {/* Hard, house-confirmed dealbreaker (origin stamp). The only place the
          tool speaks firmly, and still conditioned on the photo being accurate. */}
      {result.hardFlag && (
        <div className="rounded-2xl border border-[#cf7d59]/50 bg-[#cf7d59]/10 p-6">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cf7d59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2 className="font-serif text-lg text-foreground">A dealbreaker, if the photo is right</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{result.hardFlag.reason}</p>
          <p className="mt-2 text-sm text-muted">
            We would walk away. Confirm it in person before you spend a dollar. We are reading a
            photo, so check the label yourself, but a wrong country of origin is one of the clearest tells there is.
          </p>
        </div>
      )}

      {/* Identification card */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        {id.brand || id.style ? (
          <>
            <p className="text-sm uppercase tracking-widest text-muted">
              {id.brand ?? "Unknown brand"}
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground">
              {id.style ?? "Unknown style"}
            </p>
          </>
        ) : (
          <p className="font-serif text-xl text-foreground">
            Couldn&rsquo;t place this one
          </p>
        )}

        <div className="mt-4 divide-y divide-border">
          {id.sizeLabel && <SpecRow label="Size" value={id.sizeLabel} />}
          {id.colorway && <SpecRow label="Colorway" value={id.colorway} />}
          {id.hardwareColor && <SpecRow label="Hardware" value={id.hardwareColor} />}
          {id.hardwareType && <SpecRow label="Closure" value={id.hardwareType} />}
          {id.materialType && <SpecRow label="Material" value={id.materialType} />}
          {id.priceTagText && <SpecRow label="Sticker" value={id.priceTagText} />}
        </div>

        {/* The evidence trail: text we actually read off the bag. */}
        {readTexts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">We read:</span>
            {readTexts.map((t) => (
              <span
                key={t}
                className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs text-gold"
              >
                &ldquo;{t}&rdquo;
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Shareable result card — screenshot-ready for the thrift-reveal loop */}
      {(id.brand || id.style) && (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-2xl border border-gold/40 bg-gradient-to-br from-surface-raised to-surface p-6 text-center"
            aria-label="Shareable result card"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-gold/80">
              I found a
            </p>
            <p className="mt-2 font-serif text-2xl text-foreground">
              {shareBrand || "designer bag"}
            </p>
            {shareStyle && (
              <p className="font-serif text-xl text-gold">{shareStyle}</p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs text-muted">
              {[id.sizeLabel, id.colorway, id.materialType]
                .filter(Boolean)
                .map((spec) => (
                  <span
                    key={spec as string}
                    className="rounded-full border border-border px-2.5 py-0.5"
                  >
                    {spec}
                  </span>
                ))}
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest text-muted">
              Luxury Catalog
            </p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            <ShareIcon />
            {shareState === "copied" ? "Copied to clipboard" : "Share this find"}
          </button>
        </div>
      )}

      {/* What it's worth — never fabricate a price; link to the value summary. */}
      {valueUrl ? (
        <Link
          href={valueUrl}
          className="flex items-center justify-between rounded-2xl border border-gold/40 bg-gold/5 px-5 py-4 transition-colors hover:border-gold"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              See what it actually sells for
            </span>
            <span className="block text-xs text-muted">
              A resale range built from recorded sales, on the catalog page
            </span>
          </span>
          <span className="shrink-0 text-gold">→</span>
        </Link>
      ) : (
        inCatalog &&
        (id.brand || id.style) && (
          <Link
            href={`/search?q=${encodeURIComponent(shareLabel)}`}
            className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-4 transition-colors hover:border-gold/50"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">
                Look it up in the catalog
              </span>
              <span className="block text-xs text-muted">
                The only resale ranges we show are built from recorded sales
              </span>
            </span>
            <span className="shrink-0 text-gold">→</span>
          </Link>
        )
      )}

      {/* Off-catalog fallback: we can name it but hold no comps of our own, so
          hand over the honest next step — realized eBay sales — in one tap. */}
      {!inCatalog && (id.brand || id.style) && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-sm">
          <p className="text-muted">
            This one isn&rsquo;t in our catalog yet, so we have no recorded sales
            to price it from. It could be a bag we haven&rsquo;t covered, or a
            print on a shape the house never made, which is a common fake tell.
            We logged it so coverage grows where you shop. For a read on price,
            sold listings are the honest comp:
          </p>
          {ebaySold && (
            <a
              href={ebaySold.url}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              onClick={() =>
                track(EVENTS.outboundResaleClicked, {
                  platform: "ebay-sold",
                  brand: shareBrand,
                  style: shareStyle,
                  source: "identify_offcatalog",
                })
              }
              className="mt-3 block rounded-full border border-gold/50 px-4 py-2 text-center text-sm font-medium text-gold transition-colors hover:bg-gold/10"
            >
              See what {shareLabel} actually sold for on eBay →
            </a>
          )}
        </div>
      )}

      {/* Where to buy / sell — monetize the highest-intent moment. */}
      {(resaleLinks.length > 0 || consignLinks.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {resaleLinks.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold">
              <h2 className="font-serif text-lg text-foreground">Where to buy</h2>
              <p className="mt-1 text-xs text-muted">
                Pre-filled searches on the major resale platforms.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {resaleLinks.map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    onClick={() =>
                      track(EVENTS.outboundResaleClicked, {
                        platform: l.key,
                        brand: shareBrand,
                        style: shareStyle,
                        source: "identify",
                      })
                    }
                    className="rounded-full border border-border px-4 py-2 text-center text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    Search on {l.name} →
                  </a>
                ))}
              </div>
            </div>
          )}
          {consignLinks.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold">
              <h2 className="font-serif text-lg text-foreground">Where to sell</h2>
              <Link
                href={sellEstimatorHref}
                className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-gold/40 px-3 py-2 text-xs text-foreground transition-colors hover:border-gold"
              >
                <span>See what you&apos;d keep at each venue, from real published fees</span>
                <span aria-hidden className="shrink-0 text-gold-soft">&rarr;</span>
              </Link>
              <p className="mt-3 text-[11px] uppercase tracking-wide text-muted/80">Or start a sale now</p>
              <div className="mt-2 flex flex-col gap-2">
                {consignLinks.map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    onClick={() =>
                      track(EVENTS.outboundConsignClicked, {
                        platform: l.key,
                        mode: l.mode,
                        brand: shareBrand,
                        style: shareStyle,
                        source: "identify",
                      })
                    }
                    className="rounded-full border border-border px-4 py-2 text-center text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    {l.mode === "buyout"
                      ? `Get a quote on ${l.name}`
                      : `Consign with ${l.name}`}{" "}
                    →
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auth markers */}
      {id.visibleAuthMarkers && id.visibleAuthMarkers.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
            Visible authentication markers
          </h2>
          <ul className="flex flex-col gap-1.5">
            {id.visibleAuthMarkers.map((marker, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-gold">·</span>
                <span className="text-foreground">{marker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Catalog match detail */}
      {match && match.brandName && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
            Catalog match
          </h2>
          <p className="text-sm text-muted">{match.brandName}</p>
          {match.styleName && (
            <p className="mt-0.5 font-serif text-lg text-foreground">
              {match.styleName}
            </p>
          )}
          {(match.sizeLabel || match.exteriorColorway) && (
            <p className="mt-1 text-sm text-muted">
              {[match.sizeLabel, match.exteriorColorway].filter(Boolean).join(" · ")}
            </p>
          )}
          {matchUrl && (
            <Link
              href={matchUrl}
              className="mt-4 block text-sm text-gold hover:underline"
            >
              See full authentication details →
            </Link>
          )}
        </div>
      )}

      {/* What it's worth, IF genuine. Gated on a catalog match + not-low
          confidence; never a flat value on the unverified bag. */}
      {match && result.resale && id.confidence !== "low" && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted">
            If it&rsquo;s genuine
          </h2>
          <p className="font-serif text-2xl text-foreground">
            {result.resale.low != null && result.resale.low < result.resale.median ? (
              <>
                from {formatPrice(result.resale.low, result.resale.currency)}{" "}
                <span className="text-base text-muted">
                  live · typically {formatPrice(result.resale.median, result.resale.currency)}
                </span>
              </>
            ) : (
              <>
                {formatPrice(result.resale.median, result.resale.currency)}{" "}
                <span className="text-base text-muted">typical resale</span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Median of {result.resale.count} listings
            {result.resale.asOf ? `, as of ${result.resale.asOf}` : ""}. An estimate, not
            an appraisal, and only if the bag is authentic.
          </p>
          {id.priceTagText && (
            <p className="mt-2 text-sm text-foreground/90">
              The sticker reads {id.priceTagText}. Weigh it against the range
              above, and remember condition does the deciding.
            </p>
          )}
          {matchUrl && (
            <Link href={matchUrl} className="mt-3 inline-block text-sm font-medium text-gold hover:text-gold-soft">
              Check the markers before you trust it &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Notes */}
      {id.notes && (
        <p className="rounded-xl border border-border bg-surface/50 px-5 py-4 text-sm italic text-muted">
          {id.notes}
        </p>
      )}

      {/* Escalation — never a verdict, always a next rung. */}
      <div className="rounded-2xl border border-border bg-surface/50 p-5 text-sm">
        <p className="text-muted">
          These are the markers we can see in a photo, not proof. We don&rsquo;t
          guarantee authenticity, and a good fake can pass a photo check, so confirm
          anything high-stakes with a person.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-medium text-gold">
          <Link href="/authenticate" className="transition-colors hover:text-gold-soft">
            Get it checked by a pro &rarr;
          </Link>
          <Link href="/authentication" className="transition-colors hover:text-gold-soft">
            Read the authentication guides &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 text-sm">
      <span className="w-24 shrink-0 text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
