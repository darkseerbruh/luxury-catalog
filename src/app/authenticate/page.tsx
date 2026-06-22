import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getMyAuthRequests, getOpenAuthRequests, getMyClaims, type AuthRequest } from "@/lib/authentication";
import { ClaimButton, CloseButton } from "./AuthRequestActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get it authenticated · The Luxury Catalog",
  description:
    "Request a hands-on review from a verified authenticator. Lead matching only — pricing and the service are arranged directly with the authenticator.",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function bagLabel(r: AuthRequest): string {
  return [r.brandName, r.styleName].filter(Boolean).join(" · ") || (r.variantId ? `Variant #${r.variantId}` : "A bag");
}

const STATUS_TONE: Record<string, string> = {
  open: "text-gold",
  claimed: "text-foreground",
  closed: "text-muted",
};

export default async function AuthenticatePage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;
  const isAuthenticator = Boolean(profile?.isAuthenticator);

  const [mine, open, claims] = await Promise.all([
    user ? getMyAuthRequests(user.id) : Promise.resolve([]),
    isAuthenticator ? getOpenAuthRequests() : Promise.resolve([]),
    isAuthenticator && user ? getMyClaims(user.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Authentication</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Get a bag authenticated</h1>
        <p className="mt-2 max-w-xl text-muted">
          Want a real person to check a bag before you buy, sell, or insure it? Open any bag
          and use <span className="text-foreground">&ldquo;Want a pro to check it?&rdquo;</span> to
          send a request. A verified authenticator picks it up and reaches out — pricing and the
          review itself are arranged directly with them.
        </p>
      </header>

      {!user && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-foreground">Log in to request authentication and track your requests.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Log in
          </Link>
        </div>
      )}

      {user && (
        <section>
          <h2 className="mb-3 font-serif text-xl text-foreground">
            Your requests <span className="text-sm text-muted">({mine.length})</span>
          </h2>
          {mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center text-muted">
              No requests yet. Open a bag and ask a pro to check it.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {mine.map((r) => (
                <li key={r.requestId} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
                  <div className="min-w-0">
                    {r.variantId ? (
                      <Link href={`/bag/${r.variantId}`} className="font-serif text-foreground hover:text-gold">{bagLabel(r)}</Link>
                    ) : (
                      <span className="font-serif text-foreground">{bagLabel(r)}</span>
                    )}
                    {r.details && <p className="mt-1 text-sm text-muted">{r.details}</p>}
                    <p className="mt-2 text-xs text-muted">
                      <span className={`uppercase tracking-wide ${STATUS_TONE[r.status]}`}>{r.status}</span>
                      {r.claimedByHandle && r.status !== "open" && (
                        <> · taken by <Link href={`/u/${r.claimedByHandle}`} className="text-gold hover:underline">@{r.claimedByHandle}</Link></>
                      )}
                      {" · "}{formatDate(r.createdAt)}
                    </p>
                  </div>
                  {r.status !== "closed" && <CloseButton requestId={r.requestId} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isAuthenticator && (
        <>
          <section>
            <h2 className="mb-1 font-serif text-xl text-foreground">
              Open requests <span className="text-sm text-muted">({open.length})</span>
            </h2>
            <p className="mb-3 text-sm text-muted">
              Verified-authenticator queue. Claim one to get the requester&rsquo;s contact and
              arrange the review directly.
            </p>
            {open.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center text-muted">
                No open requests right now.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((r) => (
                  <li key={r.requestId} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
                    <div className="min-w-0">
                      {r.variantId ? (
                        <Link href={`/bag/${r.variantId}`} className="font-serif text-foreground hover:text-gold">{bagLabel(r)}</Link>
                      ) : (
                        <span className="font-serif text-foreground">{bagLabel(r)}</span>
                      )}
                      {r.details && <p className="mt-1 text-sm text-muted">{r.details}</p>}
                      <p className="mt-2 text-xs text-muted">{formatDate(r.createdAt)}</p>
                    </div>
                    <ClaimButton requestId={r.requestId} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {claims.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-xl text-foreground">
                Claimed by you <span className="text-sm text-muted">({claims.length})</span>
              </h2>
              <ul className="flex flex-col gap-3">
                {claims.map((r) => (
                  <li key={r.requestId} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
                    <div className="min-w-0">
                      {r.variantId ? (
                        <Link href={`/bag/${r.variantId}`} className="font-serif text-foreground hover:text-gold">{bagLabel(r)}</Link>
                      ) : (
                        <span className="font-serif text-foreground">{bagLabel(r)}</span>
                      )}
                      {r.details && <p className="mt-1 text-sm text-muted">{r.details}</p>}
                      {r.contactEmail && (
                        <p className="mt-2 text-sm text-foreground">
                          Contact: <a href={`mailto:${r.contactEmail}`} className="text-gold hover:underline">{r.contactEmail}</a>
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">
                        <span className={`uppercase tracking-wide ${STATUS_TONE[r.status]}`}>{r.status}</span>
                        {" · "}claimed {formatDate(r.claimedAt)}
                      </p>
                    </div>
                    {r.status !== "closed" && <CloseButton requestId={r.requestId} />}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
