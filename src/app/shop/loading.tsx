/**
 * Shop loading skeleton. The market grid is force-dynamic (prices + ranks per
 * request), so a tap into it isn't instant. A subtle dark-on-dark shimmer alone
 * read as "broken" to a real user (owner UX review 0714 #1), so we lead with an
 * explicit, moving "Searching the market…" indicator — words + a spinner — then
 * the shimmering tiles underneath.
 */
export default function ShopLoading() {
  return (
    <main className="flex flex-1 flex-col px-5 py-10" aria-busy="true">
      <div className="mx-auto w-full max-w-5xl">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-full border border-gold/30 bg-gold/5 px-5 py-3 text-sm text-gold"
        >
          <span
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gold/30 border-t-gold"
          />
          <span>Searching the market for your bag…</span>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="aspect-square w-full animate-pulse bg-border/40" />
              <div className="flex flex-col gap-2 px-3 py-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-border/40" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-border/40" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-border/40" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
