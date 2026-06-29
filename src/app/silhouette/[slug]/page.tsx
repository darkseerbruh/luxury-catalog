import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSilhouetteObject } from "@/lib/queries";
import { SITE_URL } from "@/lib/geo";
import AttributeObjectPage, { type AttributeObjectView } from "@/components/AttributeObjectPage";

export const dynamic = "force-dynamic";

const getSilhouette = cache(getSilhouetteObject);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sil = await getSilhouette(slug);
  if (!sil) return {};
  const title = `${sil.name} bags: the shape and the bags built on it`;
  const description = `The ${sil.name} silhouette and the ${sil.bagCount} bags in our catalog built on it.`;
  const url = `${SITE_URL}/silhouette/${sil.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function SilhouettePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sil = await getSilhouette(slug);
  if (!sil) notFound();

  const view: AttributeObjectView = {
    kindLabel: "Silhouette",
    name: sil.name,
    // Defines the trade term in plain words, in the body (not a heading parenthetical).
    subtitle: `Silhouette is the overall shape of a bag. These are the bags built on the ${sil.name} shape.`,
    facts: [],
    notes: [],
    bagCount: sil.bagCount,
    houses: sil.houses,
    bags: sil.bags,
    shopHref: `/search?q=${encodeURIComponent(sil.name)}`,
  };

  return <AttributeObjectPage view={view} />;
}
