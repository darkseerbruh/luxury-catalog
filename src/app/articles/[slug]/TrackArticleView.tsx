"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Fires article_viewed on mount so editorial reads (a top entry channel) show up
 * in the journey funnels and connect to downstream bag views. Only mounted for
 * published posts, so author draft-previews don't inflate the metric.
 */
export default function TrackArticleView({
  slug,
  postId,
  title,
}: {
  slug: string;
  postId: number;
  title: string;
}) {
  useEffect(() => {
    track(EVENTS.articleViewed, { slug, post_id: postId, title });
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
