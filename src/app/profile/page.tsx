import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getMyGrails } from "@/lib/grails";
import { signOut } from "@/lib/auth-actions";
import Recommendations from "@/components/Recommendations";
import FourGrails from "@/components/FourGrails";
import TasteMapSection from "@/components/TasteMapSection";
import ContributorCard from "@/components/ContributorCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile · The Luxury Catalog" };

const PERSONA_LABELS: Record<string, string> = {
  collector: "Collector / investor",
  flipper: "Resale flipper",
  "first-purchase": "First serious purchase",
  authentication: "Authentication-focused",
  "thrift-hunter": "Thrift / estate hunter",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile, grails] = await Promise.all([getProfile(), getMyGrails()]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Profile</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          {profile?.displayName || "Your account"}
        </h1>
      </header>

      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
        <Row label="Email" value={user.email ?? "—"} />
        <Row
          label="You are a"
          value={profile?.persona ? PERSONA_LABELS[profile.persona] ?? profile.persona : "Not set"}
        />
        <Row label="Handle" value={profile?.handle ? `@${profile.handle}` : "Not set"} />
        <Row label="Closet" value={profile?.closetPublic ? "Public" : "Private"} />
      </div>

      {profile?.handle && (
        <Link
          href={`/u/${profile.handle}`}
          className="rounded-2xl border border-gold/40 bg-gold/5 px-5 py-4 text-sm text-foreground transition-colors hover:border-gold"
        >
          View your public profile →
        </Link>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/closet"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          My closet
        </Link>
        <Link
          href="/watchlist"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          My watchlist
        </Link>
        <Link
          href="/profile/reviews"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          My reviews
        </Link>
        <Link
          href="/profile/edit"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Edit public profile
        </Link>
        {profile?.isExpert && (
          <Link
            href="/profile/posts"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            My articles
          </Link>
        )}
        <Link
          href="/settings"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Settings
        </Link>
        <Link
          href="/quiz"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Taste quiz
        </Link>
        <Link
          href="/recap"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Year in Bags
        </Link>
        <Link
          href="/closets"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Leaderboards
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Edit preferences
        </Link>
      </div>

      <ContributorCard userId={user.id} />

      <FourGrails grails={grails} isOwn />

      <TasteMapSection />

      <Recommendations source="profile" layout="grid" limit={6} />

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-red-400/50 hover:text-red-400"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-5 py-3 text-sm">
      <span className="w-28 shrink-0 text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
