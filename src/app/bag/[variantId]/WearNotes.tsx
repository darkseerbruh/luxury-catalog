import { getWear, type Tally } from "@/lib/wear";
import WearTaps from "./WearTaps";

/**
 * "How it carries" — lived carry + weight-feel taps (contribution slots phase 2,
 * docs/ux/review-data-leaderboards.md). Renders nothing until the 0046 table
 * exists, so the page is unchanged pre-migration and the taps light up after.
 * Shows an honest leader line only once a row has enough taps to mean something.
 */
const MIN_FOR_LEADER = 3;

export default async function WearNotes({ variantId }: { variantId: number }) {
  const wear = await getWear(variantId);
  if (!wear.available) return null;

  return (
    <section id="how-you-carry" className="border-t border-border pt-8">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">How it carries</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        From owners, not the spec sheet. How it actually rides, and how heavy it feels in hand.
      </p>

      <div className="flex flex-col gap-2">
        <LeaderLine lead="Most carry this" tallies={wear.carry} total={wear.totalCarry} />
        <LeaderLine lead="Most say it feels" tallies={wear.weight} total={wear.totalWeight} />
      </div>

      {wear.fitsNotes.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">What owners fit inside</p>
          <ul className="flex flex-wrap gap-2">
            {wear.fitsNotes.map((note, i) => (
              <li
                key={i}
                className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!wear.signedIn ? (
        <p className="mt-4 text-sm text-muted">
          <a href="/login" className="text-gold hover:underline">
            Log in
          </a>{" "}
          to add how you carry it.
        </p>
      ) : (
        <WearTaps
          variantId={variantId}
          initialCarry={wear.myCarry}
          initialWeight={wear.myWeightFeel}
          initialFitsNote={wear.myFitsNote}
        />
      )}
    </section>
  );
}

/** One honest summary line, hidden until a row clears the MIN_FOR_LEADER floor. */
function LeaderLine({ lead, tallies, total }: { lead: string; tallies: Tally[]; total: number }) {
  if (total < MIN_FOR_LEADER) return null;
  const top = tallies.reduce((a, b) => (b.count > a.count ? b : a));
  if (top.count === 0) return null;
  return (
    <p className="text-sm text-foreground">
      {lead} <span className="font-medium">{top.label.toLowerCase()}</span>{" "}
      <span className="text-muted">
        ({top.count} of {total})
      </span>
    </p>
  );
}
