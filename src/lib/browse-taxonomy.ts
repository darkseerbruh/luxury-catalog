/**
 * Single source of truth for the "browse by …" taxonomy.
 *
 * The homepage, the `/browse` index, and the nav Shop dropdown all read from
 * here so the slugs can never drift apart. The dynamic browse pages
 * (`/browse/carry/[carryType]`, `/browse/fits/[item]`) keep their own label
 * maps because they also accept slugs that aren't surfaced here.
 */

export type BrowseEntry = { label: string; slug: string };

export const FITS: BrowseEntry[] = [
  { label: "Cell phone", slug: "cell-phone" },
  { label: "Tablet or book", slug: "tablet" },
  { label: "Laptop & more", slug: "laptop" },
];

export const CARRY_METHODS: BrowseEntry[] = [
  { label: "Shoulder", slug: "shoulder" },
  { label: "Top handle", slug: "top-handle" },
  { label: "Crossbody", slug: "crossbody" },
  { label: "Backpack", slug: "backpack" },
  { label: "Belt bag", slug: "belt-bag" },
  { label: "Wallets, pouches & clutches", slug: "clutch" },
  { label: "Rolling luggage", slug: "luggage" },
];
