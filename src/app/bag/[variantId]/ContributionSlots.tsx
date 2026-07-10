import { getContributionSlots } from "@/lib/contribution-slots";
import SlotChip from "./SlotChip";

/**
 * "Have this in hand?" — the contribution entry surface (locked copy 2026-07-07,
 * docs/ux/review-data-leaderboards.md). Gap-aware: shows only what is still open
 * for THIS bag, so nobody is asked for what they (or others) already gave. The
 * minimum unit is one slot, so the ask never feels like a form.
 *
 * Server-rendered and dependency-free: each open slot is an anchor to the
 * existing control lower on the page (#photos, #reviews, #owner-ratings).
 */
export default async function ContributionSlots({ variantId }: { variantId: number }) {
  const state = await getContributionSlots(variantId);

  // Signed-out: keep the invitation, gate the action behind login.
  if (!state.signedIn) {
    return (
      <section id="contribute" className="scroll-mt-4 border-t border-border pt-8">
        <Header />
        <p className="mt-4 text-sm text-muted">
          <a href="/login" className="text-gold hover:underline">
            Log in
          </a>{" "}
          to add yours. It takes a second.
        </p>
      </section>
    );
  }

  // Everything filled: thank them and step back, don't keep asking.
  if (state.complete) {
    return (
      <section id="contribute" className="scroll-mt-4 border-t border-border pt-8">
        <h2 className="font-serif text-xl text-foreground">Thank you</h2>
        <p className="mt-2 text-sm text-muted">
          You have added everything we ask for this bag. You are why the next person gets the real
          picture.
        </p>
      </section>
    );
  }

  const open = state.slots.filter((s) => !s.filled);
  const done = state.slots.filter((s) => s.filled);

  return (
    <section id="contribute" className="scroll-mt-4 border-t border-border pt-8">
      <Header />

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        You have added <span className="font-medium text-foreground">{state.filled}</span> of{" "}
        {state.total}.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {open.map((slot) => (
          <li key={slot.key}>
            <SlotChip
              variantId={variantId}
              slotKey={slot.key}
              label={slot.label}
              hint={slot.hint}
              anchor={slot.anchor}
              sub={slot.sub}
            />
          </li>
        ))}
      </ul>

      {done.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {done.map((slot) => (
            <li
              key={slot.key}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted"
            >
              <span aria-hidden className="text-gold">
                ✓
              </span>
              {slot.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Header() {
  return (
    <>
      <h2 className="font-serif text-xl text-foreground">
        Have this in hand? Show us how it really carries.
      </h2>
      <p className="mt-1 text-sm text-muted">Takes a second. Add what you&apos;ve got. Skip the rest.</p>
    </>
  );
}
