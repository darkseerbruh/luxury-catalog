/**
 * Shop loading skeleton. The market grid is force-dynamic (prices + ranks per
 * request), so a tap into it isn't instant — this grid of shimmering tiles
 * acknowledges the click while the real listings load.
 */
export default function ShopLoading() {
  return (
    <main className="flex flex-1 flex-col px-5 py-10" aria-busy="true">
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-9 w-48 animate-pulse rounded bg-surface" />
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
