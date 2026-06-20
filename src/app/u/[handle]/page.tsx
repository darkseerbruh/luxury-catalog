import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile, isFavoritingCloset } from "@/lib/social";
import { getCurrentUser } from "@/lib/auth";
import { TrustBadges } from "@/components/TrustBadges";
import FollowClosetButton from "./FollowClosetButton";

export const dynamic = "force-dynamic";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  poshmark: "Poshmark",
  substack: "Substack",
  website: "Website",
};

function socialHref(key: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  switch (key) {
    case "instagram":
      return `https://instagram.com/${value}`;
    case "tiktok":
      return `https://tiktok.com/@${value}`;
    case "youtube":
      return `https://youtube.com/@${value}`;
    case "poshmark":
      return `https://poshmark.com/closet/${value}`;
    case "substack":
      return value.includes(".") ? `https://${value}` : `https://${value}.substack.com`;
    default:
      return `https://${value}`;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) return { title: "Profile · The Luxury Catalog" };
  const name = profile.displayName || `@${profile.handle}`;
  return {
    title: `${name} · The Luxury Catalog`,
    description: profile.bio || `${name}'s curated handbag closet on The Luxury Catalog.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) notFound();

  const [user, following] = await Promise.all([
    getCurrentUser(),
    isFavoritingCloset(profile.userId),
  ]);
  const isOwn = user?.id === profile.userId;
  const socials = Object.entries(profile.socialLinks).filter(([, v]) => v);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-2xl font-serif text-gold">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile.displayName || profile.handle).charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl text-foreground sm:text-3xl">
              {profile.displayName || `@${profile.handle}`}
            </h1>
            <p className="text-sm text-muted">@{profile.handle}</p>
            <TrustBadges
              isVerified={profile.isVerified}
              isExpert={profile.isExpert}
              isAuthenticator={profile.isAuthenticator}
              className="mt-2"
            />
          </div>
        </div>
        {!isOwn && (
          <FollowClosetButton
            ownerUserId={profile.userId}
            initialFollowing={following}
            signedIn={Boolean(user)}
          />
        )}
        {isOwn && (
          <Link
            href="/profile/edit"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Edit profile
          </Link>
        )}
      </header>

      {profile.bio && <p className="max-w-prose text-foreground">{profile.bio}</p>}

      <div className="flex flex-wrap gap-6 text-sm">
        <Stat label="In closet" value={profile.ownedCount} />
        <Stat label="Followers" value={profile.favoriteCount} />
        <Stat label="Reviews" value={profile.reviewCount} />
      </div>

      {socials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {socials.map(([key, value]) => (
            <a
              key={key}
              href={socialHref(key, value as string)}
              target="_blank"
              rel="nofollow ugc noopener"
              className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {SOCIAL_LABELS[key] ?? key}
            </a>
          ))}
        </div>
      )}

      <section>
        <h2 className="font-serif text-xl text-foreground">The closet</h2>
        {!profile.closetPublic ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-6 text-sm text-muted">
            This closet is private.
          </p>
        ) : profile.closet.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-6 text-sm text-muted">
            No bags marked as owned yet.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.closet.map((bag) => (
              <Link
                key={bag.variantId}
                href={`/bag/${bag.variantId}`}
                className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
              >
                <p className="text-xs uppercase tracking-wide text-muted">{bag.brandName}</p>
                <p className="mt-1 font-serif text-foreground">{bag.styleName}</p>
                <p className="mt-1 text-xs text-muted">{bag.label}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="font-serif text-xl text-foreground">{value}</span>{" "}
      <span className="text-muted">{label}</span>
    </div>
  );
}
