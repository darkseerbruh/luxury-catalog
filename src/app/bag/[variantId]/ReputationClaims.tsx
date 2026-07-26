import { getClaims, type ReputationClaim } from "@/lib/claims";
import ClaimVote from "./ClaimVote";

/**
 * "What people say about this one" — claims we synthesised from published reviews,
 * which owners here then confirm or push back on.
 *
 * Why this exists: a bag page is useless before anyone contributes, and writing a
 * review is a high bar. Agreeing with a sentence is not. So we draft from real
 * sources and the community ratifies (docs/ux/bag-page-build-plan.md §6).
 *
 * Disclosure is not fine print here. The block says plainly where the claims came
 * from and when, links out to the sources, and flags when the sources lean
 * commercial, because paid reviewers skew positive and readers deserve to know.
 */
export default async function ReputationClaims({
  variantId,
  styleId,
  path,
}: {
  variantId: number;
  styleId?: number;
  path: string;
}) {
  const view = await getClaims(variantId, styleId);
  if (view.pros.length === 0 && view.cons.length === 0) return null;

  return (
    <section id="what-people-say" className="border-t border-border pt-8">
      <h2 className="font-serif text-xl text-foreground">What people say about this one</h2>
      <p className="mt-1 text-sm text-muted">
        Drawn from published reviews and owner discussion. Tell us where your
        experience differs.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <ClaimColumn title="The case for" claims={view.pros} signedIn={view.signedIn} path={path} />
        <ClaimColumn title="The gripes" claims={view.cons} signedIn={view.signedIn} path={path} />
      </div>

      <div className="mt-5 rounded-xl border border-border/70 bg-surface/60 p-3">
        <p className="text-xs leading-relaxed text-muted">
          We write these in our own words from reviews published elsewhere, then let
          owners here vote them up or down.
          {view.asOf && <> Read as of {formatAsOf(view.asOf)}.</>} Reputation shifts, so
          if one of these has stopped being true, mark it out of date.
        </p>
        {view.commercialLean && (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Heads up: more of the sources behind this one earn money from the bag than
            not, so read the praise with that in mind.
          </p>
        )}
      </div>

      {!view.signedIn && (
        <p className="mt-3 text-sm text-muted">
          <a href="/login" className="text-gold hover:underline">
            Log in
          </a>{" "}
          to weigh in on any of these.
        </p>
      )}
    </section>
  );
}

function ClaimColumn({
  title,
  claims,
  signedIn,
  path,
}: {
  title: string;
  claims: ReputationClaim[];
  signedIn: boolean;
  path: string;
}) {
  if (claims.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      <ul className="flex flex-col gap-4">
        {claims.map((c) => (
          <li key={c.claimId}>
            <p className="text-sm leading-relaxed text-foreground">{c.body}</p>
            <ClaimVote
              claimId={c.claimId}
              agree={c.agree}
              disagree={c.disagree}
              myVote={c.myVote}
              signedIn={signedIn}
              path={path}
            />
            {c.sources.length > 0 && (
              <p className="mt-1.5 text-[0.7rem] text-muted/70">
                {c.sources.length} source{c.sources.length === 1 ? "" : "s"}
                {c.sources[0]?.url && (
                  <>
                    {" · "}
                    <a
                      href={c.sources[0].url}
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                      className="hover:text-gold hover:underline"
                    >
                      {c.sources[0].label || "read one"}
                    </a>
                  </>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatAsOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
