"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, publishPost } from "@/lib/post-actions";
import { track, EVENTS } from "@/lib/analytics/events";

export interface BrandOption {
  brandId: number;
  name: string;
}

export interface PostFormInitial {
  postId?: number;
  title: string;
  excerpt: string;
  body: string;
  topicBrandId: number | null;
  status?: "draft" | "published" | "archived";
}

export default function PostForm({
  brands,
  initial,
}: {
  brands: BrandOption[];
  initial?: PostFormInitial;
}) {
  const router = useRouter();
  const editing = Boolean(initial?.postId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData, intent: "draft" | "publish") {
    setError(null);
    formData.set("intent", intent);
    startTransition(async () => {
      let res;
      if (editing && initial?.postId) {
        res = await updatePost(initial.postId, formData);
        // updatePost never publishes; publishing an existing draft is a separate step.
        if (res.ok && intent === "publish" && initial.status !== "published") {
          const pub = await publishPost(initial.postId);
          if (pub.ok) {
            track(EVENTS.postPublished, {});
            res = pub;
          } else {
            res = pub;
          }
        }
      } else {
        res = await createPost(formData);
        if (res.ok && intent === "publish") track(EVENTS.postPublished, {});
      }

      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      if (intent === "publish" && res.slug) {
        router.push(`/posts/${res.slug}`);
      } else {
        router.push("/profile/posts");
      }
      router.refresh();
    });
  }

  return (
    <form className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Title</span>
        <input
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ""}
          placeholder="How to authenticate the Hermès Birkin blind stamp"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Excerpt (optional — shown in lists & search)</span>
        <textarea
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={initial?.excerpt ?? ""}
          placeholder="A line or two on what the reader walks away knowing."
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Body</span>
        <textarea
          name="body"
          rows={16}
          maxLength={50000}
          defaultValue={initial?.body ?? ""}
          placeholder="Write it the way you'd tell a friend who knows bags. Separate paragraphs with a blank line. Stick to what you can verify — never invent authentication details."
          className="rounded-xl border border-border bg-surface px-4 py-3 font-sans text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Topic brand (optional — adds a related-catalog link)</span>
        <select
          name="topic_brand_id"
          defaultValue={initial?.topicBrandId ?? ""}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground focus:border-gold focus:outline-none"
        >
          <option value="">No specific brand</option>
          {brands.map((b) => (
            <option key={b.brandId} value={b.brandId}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          formAction={(fd) => submit(fd, "draft")}
          disabled={pending}
          className="rounded-full border border-border px-5 py-3 font-medium text-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save draft"}
        </button>
        <button
          type="submit"
          formAction={(fd) => submit(fd, "publish")}
          disabled={pending}
          className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          {pending ? "Working…" : initial?.status === "published" ? "Save & keep live" : "Publish"}
        </button>
      </div>
    </form>
  );
}
