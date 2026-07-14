"use client";

import { amazonCareSearchUrl } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * A tracked outbound link to an Amazon care-product search. Wraps the affiliate
 * search builder (dormant until an Associates tag is set, plain search until then)
 * and fires outbound_care_clicked so the new channel has an engagement/revenue
 * proxy. rel="sponsored nofollow" per the FTC + Amazon Associates terms.
 */
export default function CareOutboundLink({
  query,
  item,
  source,
  className,
  children,
}: {
  query: string;
  item: string;
  source?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={amazonCareSearchUrl(query)}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      onClick={() => track(EVENTS.outboundCareClicked, { item, source: source ?? "care_hub" })}
      className={className}
    >
      {children}
    </a>
  );
}
