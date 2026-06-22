"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { buildResaleLinks, buildConsignmentLinks } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

interface IdentificationResult {
  brand: string | null;
  style: string | null;
  sizeLabel: string | null;
  colorway: string | null;
  hardwareColor: string | null;
  hardwareType: string | null;
  materialType: string | null;
  visibleAuthMarkers: string[];
  confidence: "high" | "medium" | "low";
  notes: string | null;
}

interface CatalogMatch {
  styleId: number;
  styleName: string;
  brandName: string;
  variantId: number | null;
  sizeLabel: string | null;
  exteriorColorway: string | null;
  hardwareColor: string | null;
}

interface ApiResponse {
  identification?: IdentificationResult;
  catalogMatch?: CatalogMatch | null;
  error?: string;
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

export default function IdentifyPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/identify", { method: "POST", body });
      const data: ApiResponse = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error — please try again." });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setShareState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  const id = result?.identification;
  const match = result?.catalogMatch;

  const matchUrl =
    match?.variantId
      ? `/bag/${match.variantId}`
      : match?.brandName
        ? `/search?q=${encodeURIComponent(match.brandName)}`
        : null;

  // Best brand/style strings for resale/consign deep-links and the share card.
  // Prefer the AI identification, fall back to the catalog match.
  const shareBrand = (id?.brand || match?.brandName || "").trim();
  const shareStyle = (id?.style || match?.styleName || "").trim();
  const resaleLinks =
    shareBrand || shareStyle ? buildResaleLinks(shareBrand, shareStyle) : [];
  const consignLinks =
    shareBrand || shareStyle ? buildConsignmentLinks(shareBrand, shareStyle) : [];

  // Link to the bag page's above-the-fold value summary when we have a match.
  const valueUrl = match?.variantId ? `/bag/${match.variantId}#price` : null;

  const shareLabel = [shareBrand, shareStyle].filter(Boolean).join(" ") || "this bag";

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
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-10">
      <header>
        <h1 className="font-serif text-3xl text-foreground">Identify a bag</h1>
        <p className="mt-2 text-muted">
          Point your camera at any designer bag. We&rsquo;ll tell you what it
          is, what to check before you trust it, and where it sits in the
          catalog. We flag what we can see and hedge what we can&rsquo;t.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Photo picker */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`relative flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
            preview
              ? "border-gold/40 bg-transparent"
              : "border-border bg-surface hover:border-gold/60"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected bag"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <CameraIcon />
              <p className="text-foreground">Tap to shoot a photo or pick one from your library</p>
              <p className="text-sm text-muted">JPEG, PNG, WebP · max 5 MB</p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex gap-3">
          {preview && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border px-5 py-3 text-sm text-muted transition-colors hover:border-gold hover:text-foreground"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!file || loading}
            className="flex-1 rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Identifying…" : "Identify this bag"}
          </button>
        </div>
      </form>

      {/* Thrift-find logging CTA */}
      <Link
        href={
          id?.brand || id?.style
            ? `/found?brand=${encodeURIComponent(id.brand ?? "")}&style=${encodeURIComponent(id.style ?? "")}`
            : "/found"
        }
        className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-4 text-center text-sm text-muted transition-colors hover:border-gold/50 hover:text-foreground"
      >
        Already snagged it? <span className="text-gold">Log your find →</span>
      </Link>

      {/* Error */}
      {result?.error && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
          {result.error}
        </div>
      )}

      {/* Results */}
      {id && (
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
              {id.hardwareColor && (
                <SpecRow label="Hardware" value={id.hardwareColor} />
              )}
              {id.hardwareType && (
                <SpecRow label="Closure" value={id.hardwareType} />
              )}
              {id.materialType && (
                <SpecRow label="Material" value={id.materialType} />
              )}
            </div>
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
                  <p className="mt-1 text-xs text-muted">
                    Sell fast for cash or consign for more.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
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
                  {[match.sizeLabel, match.exteriorColorway]
                    .filter(Boolean)
                    .join(" · ")}
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

          {/* No catalog match */}
          {!match && (id.brand || id.style) && (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-sm text-muted">
              Not in the catalog yet. We&rsquo;ve noted it — that&rsquo;s how we
              decide what to research next.{" "}
              {id.style && (
                <Link
                  href={`/search?q=${encodeURIComponent(id.style)}`}
                  className="text-gold hover:underline"
                >
                  Search the catalog for &ldquo;{id.style}&rdquo;
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
        </section>
      )}
    </main>
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

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
