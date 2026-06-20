/**
 * Trust + tier badges for public profiles and reviews. Trust flags are
 * admin-granted (0006); we only render what the data says — never invented.
 */

const TRUST: { key: "isAuthenticator" | "isExpert" | "isVerified"; label: string; title: string }[] = [
  { key: "isAuthenticator", label: "Authenticator", title: "Verified authenticator" },
  { key: "isExpert", label: "Expert", title: "Verified expert contributor" },
  { key: "isVerified", label: "Verified", title: "Verified account" },
];

export function TrustBadges({
  isVerified,
  isExpert,
  isAuthenticator,
  className = "",
}: {
  isVerified?: boolean;
  isExpert?: boolean;
  isAuthenticator?: boolean;
  className?: string;
}) {
  const flags = { isVerified, isExpert, isAuthenticator };
  const shown = TRUST.filter((t) => flags[t.key]);
  if (shown.length === 0) return null;
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((t) => (
        <span
          key={t.key}
          title={t.title}
          className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold"
        >
          {t.label}
        </span>
      ))}
    </span>
  );
}

/** "Verified owner" pill for reviews — derived from the reviewer's closet. */
export function VerifiedOwnerBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="This reviewer has or had this bag in their closet"
      className={`inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold ${className}`}
    >
      Verified owner
    </span>
  );
}
