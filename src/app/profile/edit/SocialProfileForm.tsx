"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSocialProfile } from "@/lib/social-actions";
import type { SocialLinks } from "@/lib/auth";

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "username" },
  { key: "tiktok", label: "TikTok", placeholder: "username" },
  { key: "youtube", label: "YouTube", placeholder: "@channel" },
  { key: "poshmark", label: "Poshmark", placeholder: "closet name" },
  { key: "substack", label: "Substack", placeholder: "name or name.substack.com" },
  { key: "website", label: "Website", placeholder: "https://…" },
];

export default function SocialProfileForm({
  initial,
}: {
  initial: {
    handle: string | null;
    bio: string | null;
    avatarUrl: string | null;
    closetPublic: boolean;
    socialLinks: SocialLinks;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveSocialProfile(formData);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Handle (your public URL: /u/your-handle)</span>
        <input
          name="handle"
          type="text"
          defaultValue={initial.handle ?? ""}
          maxLength={30}
          placeholder="yourname"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <span className="text-xs text-muted/70">3–30 lowercase letters, numbers or underscores.</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Bio</span>
        <textarea
          name="bio"
          defaultValue={initial.bio ?? ""}
          maxLength={500}
          rows={3}
          placeholder="A line about your collecting taste."
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Avatar image URL</span>
        <input
          name="avatar_url"
          type="url"
          defaultValue={initial.avatarUrl ?? ""}
          maxLength={500}
          placeholder="https://…"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          name="closet_public"
          defaultChecked={initial.closetPublic}
          className="mt-1 accent-gold"
        />
        <span>
          <span className="block text-foreground">Make my closet public</span>
          <span className="block text-sm text-muted">
            Only bags you mark as <span className="text-gold">have</span> are shown. Want and
            previously-owned stay private.
          </span>
        </span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm text-muted">Linked socials (optional)</legend>
        {SOCIAL_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
            <span className="w-24 shrink-0 text-muted">{f.label}</span>
            <input
              name={`social_${f.key}`}
              type="text"
              defaultValue={initial.socialLinks[f.key] ?? ""}
              placeholder={f.placeholder}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </label>
        ))}
        <p className="text-xs text-muted/70">
          Links are display-only and tagged rel=&quot;nofollow ugc&quot;.
        </p>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-gold">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
