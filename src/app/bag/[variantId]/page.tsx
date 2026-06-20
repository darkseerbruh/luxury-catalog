import Link from "next/link";
import { notFound } from "next/navigation";
import { getVariantDetail, getUserBagFor } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import FeedbackWidget from "./FeedbackWidget";
import CollectionButton from "./CollectionButton";

export const dynamic = "force-dynamic";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "text-muted/60 border-border/50",
    medium: "text-muted border-border",
    high: "text-gold/80 border-gold/40",
    verified: "text-gold border-gold",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${colors[level] ?? colors.low}`}
    >
      {level}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 text-sm">
      <span className="w-36 shrink-0 text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export default async function BagDetailPage({
  params,
}: {
  params: Promise<{ variantId: string }>;
}) {
  const { variantId } = await params;
  const id = parseInt(variantId, 10);
  if (isNaN(id)) notFound();

  const v = await getVariantDetail(id);
  if (!v) notFound();

  const user = await getCurrentUser();
  const userBag = user ? await getUserBagFor(user.id, v.variantId) : null;

  const variantTitle = [v.sizeLabel, v.exteriorColorway, v.hardwareColor ? `${v.hardwareColor} HW` : null]
    .filter(Boolean)
    .join(" · ") || "Variant";

  const yearRange = v.yearStart
    ? v.yearEnd
      ? `${v.yearStart}–${v.yearEnd}`
      : v.yearStart.toString()
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/search?q=${encodeURIComponent(v.brand.name)}`}
          className="hover:text-foreground"
        >
          {v.brand.name}
        </Link>
        <span>/</span>
        <Link
          href={`/search?q=${encodeURIComponent(v.style.name)}`}
          className="hover:text-foreground"
        >
          {v.style.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{variantTitle}</span>
      </nav>

      {/* Hero header */}
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          {v.brand.name} · {v.brand.tier.replace("-", " ")}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
          {v.style.name}
        </h1>
        <p className="mt-1 text-lg text-muted">{variantTitle}</p>
        {v.style.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {v.style.description}
          </p>
        )}
      </header>

      {/* Core specs */}
      <Section title="Specifications">
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          <SpecRow label="Size" value={v.sizeLabel} />
          <SpecRow label="Size category" value={v.sizeCategory} />
          <SpecRow label="Exterior material" value={v.exteriorMaterial?.name ?? null} />
          <SpecRow label="Colorway" value={v.exteriorColorway} />
          <SpecRow label="Hardware color" value={v.hardwareColor} />
          <SpecRow label="Hardware type" value={v.hardwareType} />
          <SpecRow label="Strap type" value={v.strapType} />
          <SpecRow label="Strap attachment" value={v.strapAttachmentType} />
          <SpecRow label="Interior material" value={v.interiorMaterial?.name ?? null} />
          <SpecRow label="Interior color" value={v.interiorColor} />
          <SpecRow label="Stitching color" value={v.stitchingColor} />
          <SpecRow label="Construction" value={v.constructionMethod} />
          <SpecRow label="Rigidity" value={v.rigidity} />
          <SpecRow label="Silhouette" value={v.style.silhouette} />
          <SpecRow label="Closure" value={v.style.closureType} />
          <SpecRow label="Production years" value={yearRange} />
          <SpecRow label="Status" value={v.stillInProduction ? "In production" : "Discontinued"} />
          <SpecRow label="Market" value={v.marketAvailability} />
          {v.retailPriceOriginal != null && (
            <SpecRow
              label="Retail price"
              value={`${formatPrice(v.retailPriceOriginal, v.currency)} original retail`}
            />
          )}
        </div>
      </Section>

      {/* Authentication markers */}
      {v.authenticationMarkers && (
        <Section title="Authentication markers">
          <p className="rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground">
            {v.authenticationMarkers}
          </p>
        </Section>
      )}

      {/* Exterior material detail */}
      {v.exteriorMaterial && (
        <Section title={`About ${v.exteriorMaterial.name}`}>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            <SpecRow label="Type" value={v.exteriorMaterial.materialType} />
            <SpecRow label="Water resistance" value={v.exteriorMaterial.waterResistance} />
            <SpecRow label="Scratch resistance" value={v.exteriorMaterial.scratchResistance} />
            <SpecRow label="Weather" value={v.exteriorMaterial.weatherFriendliness} />
            <SpecRow label="Overall hardiness" value={v.exteriorMaterial.hardinessOverall} />
          </div>
          {v.exteriorMaterial.careNotes && (
            <p className="mt-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground">
              <span className="mr-2 font-medium text-muted">Care:</span>
              {v.exteriorMaterial.careNotes}
            </p>
          )}
          {v.exteriorMaterial.authenticationNotes && (
            <p className="mt-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground">
              <span className="mr-2 font-medium text-muted">Auth notes:</span>
              {v.exteriorMaterial.authenticationNotes}
            </p>
          )}
        </Section>
      )}

      {/* Production records */}
      {v.productionRecords.length > 0 && (
        <Section title="Production details">
          <div className="flex flex-col gap-4">
            {v.productionRecords.map((r) => (
              <div
                key={r.productionId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  {r.productionYear && (
                    <span className="font-serif text-lg text-foreground">
                      {r.productionYear}
                      {r.productionSeason ? ` ${r.productionSeason}` : ""}
                    </span>
                  )}
                  <ConfidenceBadge level={r.confidenceLevel} />
                </div>
                <div className="divide-y divide-border">
                  <SpecRow label="Country" value={r.countryOfManufacture} />
                  {(r.dimensionsHCm || r.dimensionsWCm || r.dimensionsDCm) && (
                    <SpecRow
                      label="Dimensions"
                      value={[
                        r.dimensionsHCm ? `H ${r.dimensionsHCm} cm` : null,
                        r.dimensionsWCm ? `W ${r.dimensionsWCm} cm` : null,
                        r.dimensionsDCm ? `D ${r.dimensionsDCm} cm` : null,
                      ]
                        .filter(Boolean)
                        .join(" × ")}
                    />
                  )}
                  <SpecRow label="Date code format" value={r.dateCodeFormat} />
                  <SpecRow label="Stamp placement" value={r.stampPlacement} />
                  <SpecRow label="Stamp font" value={r.stampFontNotes} />
                </div>
                {r.knownAuthenticationMarkers && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    <span className="mr-2 font-medium text-muted">Authentication:</span>
                    {r.knownAuthenticationMarkers}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Serial / authentication tags */}
      {v.serialTags.length > 0 && (
        <Section title="Serial & authentication tags">
          <div className="flex flex-col gap-3">
            {v.serialTags.map((t) => (
              <div
                key={t.tagId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-medium text-foreground">{t.tagType}</span>
                  <ConfidenceBadge level={t.confidenceLevel} />
                  {t.verified && (
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      verified
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border">
                  <SpecRow label="Format" value={t.format} />
                  <SpecRow label="Placement" value={t.placement} />
                  <SpecRow label="Year range" value={t.yearRange} />
                  <SpecRow label="How to read" value={t.howToRead} />
                </div>
                {t.authenticationNotes && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    <span className="mr-2 font-medium text-muted">Notes:</span>
                    {t.authenticationNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Lock & Key */}
      {v.lockAndKey.filter((l) => l.includesLock).length > 0 && (
        <Section title="Lock & key">
          {v.lockAndKey.map((l) => (
            <div
              key={l.lockId}
              className="divide-y divide-border rounded-xl border border-border bg-surface"
            >
              <SpecRow label="Lock type" value={l.lockType} />
              <SpecRow label="Lock material" value={l.lockMaterial} />
              <SpecRow label="Lock engraving" value={l.lockEngraving} />
              <SpecRow label="Engraving format" value={l.engravingFormat} />
              <SpecRow label="Number of keys" value={l.numberOfKeys?.toString() ?? null} />
              <SpecRow label="Key type" value={l.keyType} />
              <SpecRow label="Clochette included" value={l.clochettIncluded != null ? (l.clochettIncluded ? "Yes" : "No") : null} />
              <SpecRow label="Clochette material" value={l.clochetteMaterial} />
            </div>
          ))}
        </Section>
      )}

      {/* Interior storage */}
      {v.interiorStorage.length > 0 && (
        <Section title="Interior storage">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.interiorStorage.map((s) => (
              <li key={s.storageId} className="flex items-start gap-3 px-5 py-3 text-sm">
                <span className="w-6 shrink-0 text-center font-medium text-gold">
                  {s.quantity}×
                </span>
                <div>
                  <span className="text-foreground">{s.featureType}</span>
                  {s.placement && (
                    <span className="ml-2 text-muted">({s.placement})</span>
                  )}
                  {s.sizeNotes && (
                    <p className="mt-0.5 text-muted">{s.sizeNotes}</p>
                  )}
                </div>
                {s.verified && (
                  <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Carry methods */}
      {v.carryMethods.length > 0 && (
        <Section title="How to carry">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.carryMethods.map((c) => (
              <li key={c.carryId} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span
                  className={`font-medium ${c.possible === "yes" ? "text-foreground" : c.possible === "depends" ? "text-muted" : "text-muted/50 line-through"}`}
                >
                  {c.carryType}
                </span>
                {c.strapDropLengthCm && (
                  <span className="text-muted">{c.strapDropLengthCm} cm drop</span>
                )}
                {c.strapAdjustable && (
                  <span className="text-muted/70">adjustable</span>
                )}
                {c.notes && (
                  <span className="ml-auto shrink-0 text-muted">{c.notes}</span>
                )}
                {c.verified && (
                  <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Fits */}
      {v.fits.length > 0 && (
        <Section title="What fits inside">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.fits.map((f) => (
              <li key={f.fitsId} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span
                  className={`${f.fits === "yes" ? "text-foreground" : f.fits === "tight" ? "text-muted" : "text-muted/50 line-through"}`}
                >
                  {f.itemName}
                </span>
                <span className="text-muted">
                  {f.fits === "yes" ? "fits" : f.fits === "tight" ? "tight fit" : "doesn't fit"}
                </span>
                {f.notes && <span className="ml-auto text-muted">{f.notes}</span>}
                {f.verified && (
                  <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Known color combinations */}
      {v.knownColorCombinations.length > 0 && (
        <Section title="Known color combinations">
          <div className="flex flex-col gap-3">
            {v.knownColorCombinations.map((c) => (
              <div
                key={c.combinationId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${c.produced ? "text-foreground" : "text-muted/60"}`}
                  >
                    {c.produced ? "Confirmed produced" : "Not confirmed"}
                  </span>
                  {c.yearRange && (
                    <span className="text-sm text-muted">{c.yearRange}</span>
                  )}
                  <ConfidenceBadge level={c.confidenceLevel} />
                </div>
                <div className="divide-y divide-border">
                  <SpecRow label="Exterior" value={c.exteriorColor} />
                  <SpecRow label="Interior" value={c.interiorColor} />
                  <SpecRow label="Stitching" value={c.stitchingColor} />
                  <SpecRow label="Hardware" value={c.hardwareColor} />
                </div>
                {c.authenticationNotes && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {c.authenticationNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Provenance & packaging */}
      {v.provenance.length > 0 && (
        <Section title="Provenance & packaging">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.provenance.map((p) => (
              <li key={p.provenanceId} className="px-5 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground capitalize">
                    {p.itemType.replace(/_/g, " ")}
                  </span>
                  {p.includedNew != null && (
                    <span className="text-muted">
                      {p.includedNew ? "included new" : "not included new"}
                    </span>
                  )}
                  {p.verified && (
                    <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      verified
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-1 text-muted">{p.description}</p>
                )}
                {p.authenticationNotes && (
                  <p className="mt-1 text-muted/80">Auth: {p.authenticationNotes}</p>
                )}
                {p.valueImpactIfMissing && (
                  <p className="mt-1 italic text-muted/70">
                    Missing: {p.valueImpactIfMissing}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Price history */}
      {v.priceHistory.length > 0 && (
        <Section title="Price history">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.priceHistory
              .slice()
              .sort((a, b) => b.dateRecorded.localeCompare(a.dateRecorded))
              .map((h) => (
                <li
                  key={h.priceId}
                  className="flex items-center gap-3 px-5 py-3 text-sm"
                >
                  <span className="text-foreground">
                    {formatPrice(h.salePrice, h.currency)}
                  </span>
                  {h.condition && <span className="text-muted">{h.condition}</span>}
                  {h.provenanceCompleteness && (
                    <span className="text-muted">{h.provenanceCompleteness}</span>
                  )}
                  {h.platform && (
                    <span className="text-muted/70">{h.platform}</span>
                  )}
                  <span className="ml-auto shrink-0 text-muted/60">
                    {h.dateRecorded}
                  </span>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {/* Empty state if no deep data */}
      {v.productionRecords.length === 0 &&
        v.serialTags.length === 0 &&
        !v.authenticationMarkers && (
          <Section title="Research depth">
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
              Detailed authentication data for this variant hasn&rsquo;t been
              researched yet. Use the search feature to find bags by style — searches
              like this help us prioritize what to research next.
            </div>
          </Section>
        )}

      {/* Collection / wishlist */}
      <CollectionButton
        variantId={v.variantId}
        signedIn={!!user}
        initialStatus={
          userBag && userBag.status !== "considering" ? userBag.status : null
        }
        initialNotify={userBag?.notifyOnAvailability ?? false}
      />

      {/* User feedback */}
      <FeedbackWidget variantId={v.variantId} />
    </main>
  );
}
