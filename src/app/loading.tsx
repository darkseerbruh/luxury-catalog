/**
 * Global route-transition fallback. App Router shows this the instant a
 * client-side navigation (a Link tap, the search form) targets a route whose
 * server render isn't instant, and clears it when the page is ready — so a tap
 * is always acknowledged and she never re-taps a "dead" click. Routes with
 * their own loading.tsx (search, shop) override this with a tailored skeleton.
 */
export default function Loading() {
  return (
    <div
      className="flex flex-1 items-center justify-center px-5 py-24"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-gold"
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
