import type { ReactNode, SVGProps } from "react";

/**
 * The reusable heritage-icon set. Little non-logo marks (craft, materials, the
 * shape of a house's history) used to break up on-page narratives so nothing
 * reads as a wall of text. NEVER a redrawn brand logo — generic marks only.
 *
 * Reused house to house: a saddlery for an equestrian maison, a loom for a
 * weaving house, a trunk for a trunk-maker, and so on.
 */
export type HeritageIconName =
  | "saddlery"
  | "stitch"
  | "clasp"
  | "tag"
  | "calendar"
  | "pin"
  | "tier"
  | "family"
  | "catalogue"
  | "flag"
  | "scissors"
  | "atelier"
  | "loom"
  | "trunk";

const PATHS: Record<HeritageIconName, ReactNode> = {
  saddlery: (
    <>
      <path d="M7 4v7a5 5 0 0 0 10 0V4" />
      <circle cx="7" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
      <path d="M7 18.7V13M17 18.7V13" />
    </>
  ),
  stitch: (
    <>
      <path d="M3 21 14 10" />
      <path d="m13 7 4 4" />
      <circle cx="18.5" cy="5.5" r="2" />
      <path d="M16.5 7.5C20 11 15 14 18 17" />
    </>
  ),
  clasp: (
    <>
      <path d="M10 22V12l-2-2V3h8v7l-2 2v10" />
      <path d="M14 6h-4M14 9h-4" />
    </>
  ),
  tag: (
    <>
      <path d="M4 9.5 11 3l9 .8.8 9L14 19.5a2 2 0 0 1-2.8 0L4.2 12.3a2 2 0 0 1 0-2.8Z" />
      <circle cx="15.5" cy="8.5" r="1.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  tier: (
    <>
      <path d="M5 9 3 11l9 9 9-9-2-2" />
      <path d="M12 3 5 9l7 5 7-5-7-6Z" />
    </>
  ),
  family: <path d="m3 8 3 11h12l3-11-5 3-4-5-4 5-5-3Z" />,
  catalogue: (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5h11l-2 3 2 3H5" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M8 7.5 20 18M8 16.5 20 6M8 7.5 13 11" />
    </>
  ),
  atelier: (
    <>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M4 21h16M9 21v-5h6v5M9 11h2M13 11h2" />
    </>
  ),
  loom: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M9 4v16M14 4v16M4 9h16M4 14h16" />
    </>
  ),
  trunk: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="1" />
      <path d="M4 11h16M9 7V5h6v2M11 13h2" />
    </>
  ),
};

/**
 * One heritage mark. Inherits colour from the parent (`stroke="currentColor"`)
 * so callers set it with a text colour utility; size with `h-/w-` classes.
 */
export function HeritageIcon({
  name,
  className,
  ...props
}: { name: HeritageIconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
