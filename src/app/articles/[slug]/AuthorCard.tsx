import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TrustBadges } from "@/components/TrustBadges";
import { AUTHOR_ROLE } from "@/lib/geo";
import type { PostAuthor } from "@/lib/posts";

/**
 * End-of-article author card (Medium pattern): who wrote this, their honest role
 * and bio, any earned trust badge, and a link into the real profile. Establishes
 * E-E-A-T credibility without claiming expertise the content does not have.
 */
export function AuthorCard({ author }: { author: PostAuthor }) {
  const name = author.displayName || (author.handle ? `@${author.handle}` : "Luxury Catalog");
  const profileHref = author.handle ? `/u/${author.handle}` : null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-widest text-muted">Written by</p>
      <div className="mt-3 flex items-start gap-4">
        <Avatar src={author.avatarUrl} name={name} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-lg text-foreground">{name}</p>
            <TrustBadges
              isVerified={author.isVerified}
              isExpert={author.isExpert}
              isAuthenticator={author.isAuthenticator}
            />
          </div>
          <p className="mt-0.5 text-sm text-gold/90">{AUTHOR_ROLE}</p>
          {author.bio && <p className="mt-1.5 text-sm leading-relaxed text-muted">{author.bio}</p>}
          {profileHref && (
            <Link
              href={profileHref}
              className="mt-3 inline-block text-sm font-medium text-gold transition-colors hover:text-gold-soft"
            >
              View profile &rarr;
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
