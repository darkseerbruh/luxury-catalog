/**
 * Empty state for the "For sale right now" slot. Shown ONLY when the page has no
 * observed listing data (the same `!observedOffers` signal that omits the Product
 * JSON-LD), so it can never contradict an AggregateOffer. Hands the reader straight
 * to the WhereToBuy search links rendered directly below it.
 */
export default function EmptyListingsNote() {
  return (
    <section id="for-sale" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="font-serif text-xl text-foreground">None for sale right now</h2>
      <p className="mt-2 max-w-prose text-sm text-muted">
        We&rsquo;re not tracking a single live listing for this exact bag today. The links
        below search the resale sites directly, so you&rsquo;re one click from checking for
        yourself.
      </p>
    </section>
  );
}
