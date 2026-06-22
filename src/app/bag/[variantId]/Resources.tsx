"use client";

import { useState } from "react";
import type { CuratedResource } from "@/lib/queries";
import { youtubeId, youtubeThumb, youtubeEmbedUrl } from "@/lib/youtube";

function VideoCard({ r }: { r: CuratedResource }) {
  const [playing, setPlaying] = useState(false);
  const id = r.youtubeVideoId || youtubeId(r.url);
  if (!id) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-video w-full bg-bg">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(id)}
            title={r.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${r.title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumb(id)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg/70 text-2xl text-gold ring-1 ring-gold/40 transition-transform group-hover:scale-110">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium leading-snug text-foreground">{r.title}</p>
        {r.creatorName && (
          <p className="mt-1 text-xs text-muted">
            {r.creatorChannelUrl ? (
              <a
                href={r.creatorChannelUrl}
                target="_blank"
                rel="nofollow noopener"
                className="hover:text-gold"
              >
                {r.creatorName}
              </a>
            ) : (
              r.creatorName
            )}
            {r.creatorTrusted && (
              <span className="ml-2 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold">
                Trusted reviewer
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Resources({ resources }: { resources: CuratedResource[] }) {
  const videos = resources.filter(
    (r) => r.resourceType === "youtube" && (r.youtubeVideoId || youtubeId(r.url))
  );
  const links = resources.filter((r) => !videos.includes(r));

  if (videos.length === 0 && links.length === 0) return null;

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-1 font-serif text-xl text-foreground">Video reviews & resources</h2>
      <p className="mb-4 text-sm text-muted">
        Reviews from creators we trust — the next best thing to handling the bag
        yourself.
      </p>

      {videos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((r) => (
            <VideoCard key={r.resourceId} r={r} />
          ))}
        </div>
      )}

      {links.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {links.map((r) => (
            <li key={r.resourceId}>
              <a
                href={r.url}
                target="_blank"
                rel="nofollow noopener"
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                <span>{r.title}{r.creatorName ? ` — ${r.creatorName}` : ""}</span>
                <span aria-hidden>↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
