/**
 * Validate a post-auth redirect target. Internal paths only (must start with a
 * single "/", never "//" or a scheme), so an attacker can't smuggle an external
 * URL through ?next. Returns the path or null.
 */
export function safeNext(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}
