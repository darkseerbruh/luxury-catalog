import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { completeOnboarding } from "@/lib/profile-actions";
import { safeNext } from "@/lib/safe-next";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome · The Luxury Catalog" };

const PERSONAS: { value: string; label: string; description: string }[] = [
  { value: "collector", label: "Collector / investor", description: "Buying to keep, and to hold value over time." },
  { value: "flipper", label: "Resale flipper", description: "Buying to resell at a profit." },
  { value: "first-purchase", label: "First serious purchase", description: "Saving for your first designer bag." },
  { value: "authentication", label: "Authentication-focused", description: "Mostly here to tell real from fake." },
  { value: "thrift-hunter", label: "Thrift / estate hunter", description: "Finding the steal in the wild." },
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  const next = safeNext((await searchParams).next);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-5 py-16">
      <h1 className="font-serif text-3xl text-foreground">Welcome to the catalog</h1>
      <p className="mt-2 mb-8 text-muted">
        Two quick questions so what you see fits how you shop. Change them any
        time.
      </p>

      <form action={completeOnboarding} className="flex flex-col gap-6">
        {next && <input type="hidden" name="next" value={next} />}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">What should we call you?</span>
          <input
            name="display_name"
            type="text"
            defaultValue={profile?.displayName ?? ""}
            maxLength={80}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            placeholder="Your name"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Pick a username</span>
          <div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-gold">
            <span className="pl-4 text-muted">@</span>
            <input
              name="handle"
              type="text"
              defaultValue={profile?.handle ?? ""}
              maxLength={30}
              pattern="[A-Za-z0-9_]{3,30}"
              className="flex-1 rounded-xl bg-transparent px-2 py-3 text-foreground placeholder:text-muted focus:outline-none"
              placeholder="yourname"
            />
          </div>
          <span className="text-xs text-muted">
            3–30 letters, numbers or underscores. Your public profile lives at
            /u/yourname — you can change it later.
          </span>
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm text-muted">Which best describes you?</legend>
          {PERSONAS.map((p, i) => (
            <label
              key={p.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-gold/50 has-[:checked]:border-gold"
            >
              <input
                type="radio"
                name="persona"
                value={p.value}
                defaultChecked={profile?.persona ? profile.persona === p.value : i === 0}
                className="mt-1 accent-gold"
              />
              <span>
                <span className="block text-foreground">{p.label}</span>
                <span className="block text-sm text-muted">{p.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Enter the catalog
        </button>
      </form>
    </main>
  );
}
