import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeatherObject } from "@/lib/queries";
import { SITE_URL } from "@/lib/geo";
import AttributeObjectPage, {
  type AttrFact,
  type AttrNote,
  type AttributeObjectView,
} from "@/components/AttributeObjectPage";

export const dynamic = "force-dynamic";

const getLeather = cache(getLeatherObject);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const leather = await getLeather(slug);
  if (!leather) return {};
  const title = `${leather.name}: care, durability, and the bags that use it`;
  const description =
    leather.brandContext?.slice(0, 155) ??
    `How ${leather.name} wears and the bags in our catalog that use it.`;
  const url = `${SITE_URL}/leather/${leather.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function LeatherPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const leather = await getLeather(slug);
  if (!leather) notFound();

  const rawFacts: (AttrFact | null)[] = [
    leather.materialType ? { label: "Type", value: leather.materialType } : null,
    leather.waterResistance ? { label: "Water resistance", value: leather.waterResistance } : null,
    leather.scratchResistance ? { label: "Scratch resistance", value: leather.scratchResistance } : null,
    leather.weatherFriendliness ? { label: "Weather", value: leather.weatherFriendliness } : null,
    leather.hardinessOverall ? { label: "Overall hardiness", value: leather.hardinessOverall } : null,
  ];
  const facts = rawFacts.filter((f): f is AttrFact => f !== null);

  const rawNotes: (AttrNote | null)[] = [
    leather.careNotes ? { label: "Caring for it", body: leather.careNotes } : null,
    leather.authenticationNotes
      ? {
          label: "Markers to check",
          body: leather.authenticationNotes,
          hedge: "Markers to check, not a verdict. Confirm anything that costs you money in person.",
        }
      : null,
    leather.resaleValueImpact
      ? {
          label: "On the resale market",
          body: leather.resaleValueImpact,
          hedge: "Our reading of the market, an estimate, not an appraisal.",
          highlight: true,
        }
      : null,
    leather.brandContext ? { label: "Where you will see it", body: leather.brandContext } : null,
  ];
  const notes = rawNotes.filter((n): n is AttrNote => n !== null);

  const subtitle =
    facts.length > 0 || notes.length > 0
      ? `How ${leather.name} wears, plus the bags that use it across the catalog.`
      : `Bags in the catalog that use ${leather.name}.`;

  const view: AttributeObjectView = {
    kindLabel: "Leather",
    name: leather.name,
    subtitle,
    facts,
    notes,
    bagCount: leather.bagCount,
    houses: leather.houses,
    bags: leather.bags,
    shopHref: `/search?q=${encodeURIComponent(leather.name)}`,
  };

  return <AttributeObjectPage view={view} />;
}
