/**
 * "The Story" content model — the per-bag editorial layer (our honest analog of
 * Spotify's "About the song" + "SongDNA" card).
 *
 * v1 is a code-defined content source (this directory), keyed by style name, so
 * the module renders live with no migration. Every tidbit carries real cited
 * sources (never-invent rule). The scale-up path is a `style_story` table that
 * feeds the same component, exactly as `creators.json` feeds the `resource`
 * table for embedded videos.
 */

/** A cited source behind a tidbit. URL is always a real, verifiable link. */
export interface StorySource {
  name: string;
  url: string;
}

/**
 * One "did you know" tidbit. `kind` only governs the small eyebrow label, not
 * the truth of the claim — every tidbit is sourced regardless of kind.
 */
export type TidbitKind = "origin" | "design" | "culture" | "trivia";

export interface StoryTidbit {
  kind: TidbitKind;
  title: string;
  body: string;
  sources: StorySource[];
}

/** A person in the bag's "DNA" strip: designer, namesake/muse, creative director. */
export interface StoryPerson {
  name: string;
  role: string;
  /** One short line of context. Optional. */
  note?: string;
}

export interface BagStory {
  /**
   * Lowercased style-name fragments this story applies to. Matched against the
   * variant's style name (case-insensitive `includes`) so the same numeric
   * style id is not required across environments.
   */
  match: string[];
  /** One-line hook shown under the heading. */
  tagline: string;
  tidbits: StoryTidbit[];
  /** The "Bag DNA" people strip (designer / namesake / creative director). */
  people: StoryPerson[];
  /**
   * Seeds a "Watch interviews & runway" link-out to YouTube search. We link to
   * a search (not a specific video id) so nothing is invented; real curated
   * embeds live in the existing "Video reviews & resources" section below.
   */
  watchQuery: string;
}
