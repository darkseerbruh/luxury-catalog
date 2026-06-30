import { matchHouseStory, intoSentences } from "@/lib/house-stories";
import { HeritageIcon, type HeritageIconName } from "@/components/HeritageIcon";

/**
 * The "house story" section of a brand page. Never a wall of text: a serif lead
 * line, a heritage strip built from real catalogue data, and either authored
 * icon beats (curated houses) or the brand's description reflowed into short
 * sentences (every other house). Renders nothing when there is no story at all.
 */
interface Props {
  name: string;
  description: string | null;
  foundedYear: number | null;
  countryOfOrigin: string | null;
  tier: string;
  stylesCount: number;
}

export function HouseStory({
  name,
  description,
  foundedYear,
  countryOfOrigin,
  tier,
  stylesCount,
}: Props) {
  const authored = matchHouseStory(name);
  const sentences = description ? intoSentences(description) : [];
  const lead = authored?.lead ?? sentences[0] ?? null;
  const bodySentences = authored ? [] : sentences.slice(1);

  if (!authored && !lead) return null;

  const chips: { icon: HeritageIconName; label: string }[] = [
    ...(foundedYear ? [{ icon: "calendar" as const, label: `Est. ${foundedYear}` }] : []),
    ...(countryOfOrigin ? [{ icon: "pin" as const, label: countryOfOrigin }] : []),
    { icon: "tier" as const, label: tier.replace("-", " ") },
    ...(stylesCount > 0
      ? [{ icon: "catalogue" as const, label: `${stylesCount} ${stylesCount === 1 ? "style" : "styles"}` }]
      : []),
  ];

  return (
    <section>
      <h2 className="font-serif text-2xl text-foreground">The {name} story</h2>

      {lead && (
        <p className="mt-3 max-w-md font-serif text-2xl leading-snug text-foreground">{lead}</p>
      )}

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs capitalize text-gold-soft"
            >
              <HeritageIcon name={c.icon} className="h-3.5 w-3.5 text-gold" />
              {c.label}
            </span>
          ))}
        </div>
      )}

      {authored ? (
        <div className="mt-5 flex flex-col gap-3.5">
          {authored.beats.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-gold">
                <HeritageIcon name={b.icon} className="h-4 w-4" />
              </span>
              <p className="pt-1.5 text-sm leading-relaxed text-muted">
                <span className="text-foreground">{b.lead}</span> {b.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        bodySentences.length > 0 && (
          <div className="mt-4 flex max-w-prose flex-col gap-2.5">
            {bodySentences.map((s, i) => (
              <p key={i} className="leading-relaxed text-muted">
                {s}
              </p>
            ))}
          </div>
        )
      )}
    </section>
  );
}
