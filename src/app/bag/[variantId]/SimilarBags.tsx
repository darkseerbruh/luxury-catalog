import { getSimilarBags } from "@/lib/recommendations";
import { RecommendationCard } from "@/components/RecommendationCard";

/**
 * "Similar bags" on the bag detail page — content-based over this bag's own
 * catalogued attributes, so it works for logged-out visitors too. Renders
 * nothing when there are no scored matches.
 */
export default async function SimilarBags({ variantId }: { variantId: number }) {
  const similar = await getSimilarBags(variantId, 6);
  if (similar.length === 0) return null;

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Similar bags</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {similar.map((rec) => (
          <RecommendationCard key={rec.variantId} rec={rec} source="bag" />
        ))}
      </div>
    </section>
  );
}
