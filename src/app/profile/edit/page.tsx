import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import { getMyGrails } from "@/lib/grails";
import SocialProfileForm from "./SocialProfileForm";
import GrailPicker from "./GrailPicker";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit profile · The Luxury Catalog" };

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile, closet, grails] = await Promise.all([
    getProfile(),
    getCloset(),
    getMyGrails(),
  ]);

  // De-dupe closet entries to one card per variant (a bag can appear once).
  const seen = new Set<number>();
  const candidates = closet.flatMap((c) => {
    if (seen.has(c.variantId)) return [];
    seen.add(c.variantId);
    return [
      {
        variantId: c.variantId,
        brandName: c.brandName,
        styleName: c.styleName,
        label: c.label,
      },
    ];
  });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Profile</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Public profile</h1>
        <p className="mt-2 text-muted">
          Set your handle, bio and links. {profile?.handle ? (
            <>
              This is how you show up at{" "}
              <Link href={`/u/${profile.handle}`} className="text-gold hover:underline">
                /u/{profile.handle}
              </Link>
            </>
          ) : (
            "Pick a handle and you get a public page."
          )}
        </p>
      </header>

      <SocialProfileForm
        initial={{
          handle: profile?.handle ?? null,
          bio: profile?.bio ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
          closetPublic: profile?.closetPublic ?? false,
          socialLinks: profile?.socialLinks ?? {},
        }}
      />

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div>
          <h2 className="font-serif text-2xl text-foreground">My Four Grails</h2>
          <p className="mt-1 text-sm text-muted">
            Pin four bags from your closet — your taste in one screenshot. You
            only get four, so make them count.
          </p>
        </div>
        <GrailPicker
          candidates={candidates}
          initial={grails.map((g) => g.variantId)}
        />
      </section>
    </main>
  );
}
