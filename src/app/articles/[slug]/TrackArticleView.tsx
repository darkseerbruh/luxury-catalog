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
  department = null,
}: {
  slug: string;
  postId: number;
  title: string;
  department?: string | null;
}) {
  useEffect(() => {
    track(EVENTS.articleViewed, { slug, post_id: postId, title });
    // The auth guides are where a reseller's marker-reading actually happens;
    // without this leg the flip funnel (auth_section_engaged ->
    // outbound_consign_clicked) could never fire on guide reads.
    if (department === "authentication") {
      track(EVENTS.authSectionEngaged, { section: "brand_guide", slug });
    }
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
