import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import SocialProfileForm from "./SocialProfileForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit profile · The Luxury Catalog" };

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();

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
    </main>
  );
}
