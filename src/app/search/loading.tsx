/**
 * Search loading skeleton. Shows the moment she submits a search (the page is
 * force-dynamic and hits the DB + hybrid-search, so the render isn't instant) —
 * the search bar stays put and the result area shimmers with "Searching…", so
 * the click reads as received instead of ignored.
 */
export default function SearchLoading() {
  return (
    <main className="flex flex-1 flex-col px-5 py-10" aria-busy="true">
      <div className="mx-auto flex w-full max-w-md items-center gap-2">
        <div className="h-[52px] min-w-0 flex-1 animate-pulse rounded-full border border-border bg-surface" />
        <div className="h-[52px] w-24 shrink-0 animate-pulse rounded-full bg-gold/40" />
      </div>
      <div className="mx-auto mt-10 w-full max-w-2xl">
        <p className="text-center text-sm text-muted" role="status" aria-live="polite">
          Searching…
        </p>
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
