"use client";

import { useState } from "react";
import type { StoryVideo } from "@/lib/bag-stories";
import { youtubeThumb, youtubeEmbedUrl } from "@/lib/youtube";

/**
 * The "Watch" block inside The Story. Curated videos (real YouTube ids, seeded
 * only when attributable) render as click-to-play facades using the same
 * privacy-enhanced youtube-nocookie embed as the Reviews section. Below them, a
 * row of precise per-intent YouTube searches lets any bag point at interviews,
 * runway, and reviews without claiming a specific clip.
 */

function VideoFacade({ v }: { v: StoryVideo }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative aspect-video w-full bg-bg">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(v.youtubeId)}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${v.title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumb(v.youtubeId)}
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
        <p className="text-sm font-medium leading-snug text-foreground">{v.title}</p>
        <p className="mt-1 text-xs text-muted">{v.source}</p>
      </div>
    </div>
  );
}

function searchUrl(brand: string, style: string, intent: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${brand} ${style} ${intent}`,
  )}`;
}

export default function StoryVideos({
  brandName,
  styleName,
  videos,
}: {
  brandName: string;
  styleName: string;
  videos?: StoryVideo[];
}) {
  const intents = [
    { label: "Interviews", q: "designer interview" },
    { label: "Runway", q: "runway show" },
    { label: "Reviews", q: "review" },
  ];

  return (
    <div className="mt-6">
      <h3 className="font-serif text-lg text-foreground">Watch</h3>
      {videos && videos.length > 0 && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <VideoFacade key={v.youtubeId} v={v} />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted/70">Find more</span>
        {intents.map((it) => (
          <a
            key={it.label}
            href={searchUrl(brandName, styleName, it.q)}
            target="_blank"
            rel="nofollow noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            {it.label}
            <span aria-hidden>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
