/**
 * Per-house authentication guides for the Journal's Authentication department.
 * One guide per high-search house, titled "{House} authentication: The markers
 * worth checking" (the high-volume search term the homepage auth link lands on).
 *
 * Idempotent by slug (upsert). Status stays 'draft' (the owner publishes). Bodies
 * use the post renderer tokens: `## ` / paragraphs / `> ` / `[diagram: <id>]`.
 *
 * NEVER-INVENT: every marker is sourced (authentication services + reseller guides,
 * cited per article and in docs/research-drafts/authentication-markers-brief.md).
 * Framed as "markers to check, not a verdict"; no date-code/serial decoders (a wrong
 * call causes real harm). Diagrams are original schematics, never a real bag or a
 * redrawn logo.
 *
 *   npx tsx supabase/seed/seed-authentication-articles.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const chanelBody = `Chanel is one of the most faked bags in the world, and the Classic Flap most of all, so "is it real" is usually the first question. No checklist turns you into an authenticator, but a handful of markers catch most fakes, and one thing changed in 2021 that trips a lot of buyers up.

## The serial sticker became a chip
For decades Chanel placed a numbered hologram serial sticker inside the bag, usually on the lining near the top of the flap, and paired it with an authenticity card carrying the same number. Around 2021 the brand replaced the sticker with an embedded microchip. So a recent bag with no sticker is normal, not a red flag, and an older bag having a sticker proves nothing on its own, because counterfeiters copy them. Treat the number as a detail to note, never a verdict.

[diagram: chanel-authentication]

## The card should match, but a card is not proof
Unlike some houses, Chanel does include an authenticity card, and on a genuine bag its number matches the serial sticker exactly, same digits, same font weight. A mismatch is a real warning sign. The catch: cards and stickers are both faked, and a card can be swapped between bags, so a matching card is reassuring, not a seal. Many genuine bags also turn up with no card at all, which is not damning by itself.

## The CC lock and the hardware
On the front turn-lock the two C's interlock cleanly and evenly, with the right C over the left on top and the left over the right on the bottom. Loose, off-center, or rough-cast hardware is the tell. Real Chanel hardware feels substantial, the plating is even, and engraving is crisp. Light, hollow, or shallow-stamped metal points the other way.

## Quilting and stitching
The diamond quilt should line up across the seams and over the flap rather than jumping or breaking at the edge. The stitching runs high and even along each diamond. The exact stitch count varies by model and leather, so read it as even and consistent, not a number to count to. Good fakes now match the quilt alignment, so it is necessary, not sufficient.

## When to call in a pro
Run through these and you will catch a lot of obvious fakes. But a good counterfeit passes a visual check, the microchip is a closed book to you, and the markers shift across eras and leathers. So for a costly purchase, or before you sell or insure a bag, send it to a professional authenticator who can examine it in person. These are markers to check, the start of the story, not the end of it.

## Sources
The markers here are drawn from authentication services and reseller guides, including Real Authentication, Fashionphile, and the Chanel community on PurseForum, checked June 2026. We describe where to look and what tends to differ; we do not publish a serial-number decoder, because the formats vary by era and a wrong call causes real harm.`;

const hermesBody = `Hermès is the highest-stakes check in the resale market, the Birkin and Kelly most of all, because the prices are large and the fakes have gotten good. Hermès uses no serial number and no online date lookup, so the bag has to tell its own story through the stamp and the stitching.

## The blind stamp, and what it dates
A small heat stamp, a letter inside a shape, sits hidden under the front flap, pressed without ink and deliberately hard to find. The shape around the letter places the era: no shape before 1971, a circle from 1971 to 1996, a square from 1997 to 2014, and no shape again from late 2014. It dates the bag and corroborates the rest, but it does not authenticate on its own, because the formats are known and copied.

[diagram: hermes-authentication]

## The craftsman's mark
One artisan builds and repairs an entire Hermès bag, and leaves a small separate maker's mark near the blind stamp. Fakes often skip it entirely, so its absence is a real warning sign.

## The stitching
The hallmark is the saddle stitch, sewn by hand with two needles passing through each hole. It leaves a slightly raised, even line that leans gently on the diagonal, in waxed linen thread. Perfectly straight, machine-uniform stitching is the opposite of what a hand-finished Hermès looks like.

## Hardware, zip, and lock
The HERMÈS PARIS engraving is crisp and evenly spaced, and the plating should not wear away to a different color underneath. A real zip pull rests parallel to the zip rather than flopping to a right angle, and the padlock is cleanly engraved with a number that matches both keys.

## When to call in a pro
With this much money on the line, the markers are where you start, not where you stop. A strong fake clears a visual check, the leathers and stamps shift across decades, and the difference can come down to a millimeter of stitch lean. For any Birkin or Kelly purchase, and before you sell or insure, have a professional authenticator handle it in person.

## Sources
Drawn from authentication services and reseller guides, including Retyche, and cross-checked against our own Hermès archive, in June 2026. The exotic blind-stamp symbols and leather dates are useful context, but we present them as markers to weigh, not as a verdict.`;

const diorBody = `Dior is among the most-faked houses, with the Lady Dior leading and the Saddle and Book Tote close behind. The interior tags changed a lot over the years, so the first job is matching what you see to when the bag was made.

## The tag and serial, by era
Early-1990s pieces often have a woven label and no date code. Through the 1990s and 2000s Dior added leather tabs, interior stampings, and serial stickers on authenticity cards. From 2019, many Lady Dior and Book Tote bags carry a microchip instead, so a newer bag with no visible serial sticker can still be genuine. Match the format to the production era rather than expecting one system.

[diagram: dior-authentication]

## The Oblique canvas
On the jacquard the D-I-O-R motif should run cleanly across seams and curves with a sharp, even repeat. Fakes most often break the pattern at the seam, and the Saddle's curved seam is where it shows up most.

## The charms and the quilting
On the Lady Dior the D.I.O.R. letter charms are heavy and substantial with sharp, uniform engraving, and the cannage quilting is deep and even across the whole bag. Hollow, light charms and shallow, uneven quilting are warning signs, though the best fakes now add weight to the charms, so read it alongside everything else.

## The heat stamp and the origin
The Christian Dior stamp is a crisp serif pressed into the leather, not printed on the surface, with consistent spacing. And authentic Dior is made in France or Italy. A Made in China label is a definitive red flag.

## When to call in a pro
These markers catch a lot, but counterfeiters reproduce fonts, holograms, and cards, and a microchip cannot be read at home. For a costly Lady Dior or Book Tote, or before selling or insuring, have a professional authenticator examine it in person.

## Sources
Drawn from authentication services and reseller guides, including Fashionica and codogirl, in June 2026. A correct-looking interior tag is one data point, not proof.`;

const pradaBody = `Prada is one of the most-checked houses, especially since the nylon re-edition bags came back. The triangle plaque is the most copied element on the bag, so the read comes from the details around it, not the logo alone.

## The triangle plaque
The enamel triangle reads PRADA with MILANO, never Milan, and DAL 1913, all evenly spaced and legible. The R on the plaque usually has a small notch in the leg, though some genuine vintage pieces lack it, so treat the notch as era context rather than a yes or no.

[diagram: prada-authentication]

## The inside tells more than the outside
On the woven interior logo the R does not carry the plaque notch, the A does not overhang, the font is sans serif, and the word prints upside-down on alternating rows. The lining itself is embossed jacquard nylon or Nappa leather, not a thin flat synthetic.

## Stitching and hardware
Prada uses a neat, even, angled topstitch. Plain horizontal stitching, uneven holes, or thin thread are common tells. Hardware stays one consistent tone, since Prada does not mix gold and silver on a single bag, and the zips come from Lampo, YKK, Riri, Opti, or Ipi.

## The QA tag
Most bags have a small white quality-assurance tag sewn into an interior pocket seam, carrying a black factory number. Cross-reference it with the card separately rather than trusting either on its own.

## When to call in a pro
A correct-looking plaque proves nothing by itself, and finishes vary by style and season. For a costly purchase, or before selling or insuring, have a professional authenticator examine the bag in person.

## Sources
Drawn from authentication services and reseller guides, including Bag Religion and Fashionica, in June 2026. We present markers to weigh, not a checklist that passes a bag.`;

const goyardBody = `Goyard is one of the most-counterfeited names in resale, and the Saint Louis tote most of all. There is no public serial lookup and no authenticity card, so the canvas and the stamp carry the read.

## The chevron pattern
On the hand-screened Goyardine the interlocking Y's meet, with the end-dots of each Y touching its neighbor. Visible gaps between the Y's are the fastest tell. The canvas itself is coated linen with a slightly raised, textured hand and a sense of depth from layered color, so a flat, plasticky, vinyl-like surface is a warning sign.

[diagram: goyard-authentication]

## The weight surprise
A genuine Saint Louis is surprisingly light, because it is coated linen rather than a heavy synthetic. A stiff, heavy tote suggests the vinyl or PVC that counterfeiters tend to use.

## The stamp and the serial
The GOYARD, PARIS, MADE IN FRANCE stamp is thin, even, and shallow, and easy to read. A stamp pressed too deep, too thick, or crowded is a tell. The serial is three letters and six digits in a thin, discreet sans serif, placed differently by model. It is one data point, not a date you can decode.

## The card that should not exist
Goyard issues no authenticity card at all. A seller offering one as proof is a red flag in itself, not a reassurance.

## When to call in a pro
With no serial lookup and no card, execution is everything, and a good fake gets close. For a costly purchase, or before selling or insuring, have a professional authenticator examine the bag in person.

## Sources
Drawn from authentication services and reseller guides, including Fashionica and Collectors Cage, in June 2026. We do not decode a Goyard serial to a date, because no such lookup exists.`;

const yslBody = `Saint Laurent is among the riskiest names in resale, with the Loulou and the Kate leading the fakes. The single biggest tell is also the simplest: the brand name has to match the bag's age.

## The name has to match the era
Bags made before 2012 read Yves Saint Laurent inside. The 2012 rebrand changed it to Saint Laurent Paris, and recent bags read SAINT LAURENT. A name that contradicts the bag's claimed age is the clearest warning sign there is. The rebrand itself is a production-era distinction, not by itself a sign of a fake.

[diagram: saint-laurent-authentication]

## The Cassandre hardware
The interlocking YSL on clasps and turn-locks is crisp, deep, symmetrical, and centered. Blurry, over-rounded, or off-center letters are a tell, and the brass-based hardware should feel substantial rather than hollow or rattling.

## Serial and quilting
The serial is pressed into the leather, not printed on the surface, and there is no public database to decode it. On the Loulou the diamond quilting has consistent depth, even alignment, and identical diamond sizes, so shallow or uneven quilting is a flag.

## The finishing
The leather edges are cleanly painted, and the zips come from Lampo, Riri, or Éclair with branded pulls. Rough, fraying edges and unbranded zips point the other way.

## When to call in a pro
These markers catch a lot, but some recent Saint Laurent bags carry NFC chips you cannot read, and a plausible serial with poor embossing is still suspect. For a costly purchase, or before selling or insuring, have a professional authenticator examine it in person.

## Sources
Drawn from authentication services and reseller guides, including Fashionica and Love that Bag, in June 2026. We do not decode serials to dates, because no public lookup exists.`;

const bottegaBody = `Bottega Veneta built its name on a quiet, logo-free luxury, which makes authentication a question of craft rather than a hunt for a monogram. The Cassette and the Pouch are the most-faked, with the Jodie rising.

## The weave is the test
On a genuine bag the woven Intrecciato strips are pressed and held by compression, with no thread running along the edges of the weave. Visible stitching holding the strips down is the single most common fake tell. The strips are even in width and the weave lies flat across corners and seams, so bubbling, lifting, gaps, or a puffy look are warning signs.

[diagram: bottega-authentication]

## The leather
Authentic Bottega leather is butter-soft calfskin or lambskin, supple with a slightly matte finish and a real leather scent. A plasticky shine, a board-stiff hand, or a chemical smell all point the wrong way.

## The stamp and the serial
The BOTTEGA VENETA and MADE IN ITALY mark is delicately debossed into the leather and almost blends in, so a sharp, printed-looking stamp is wrong, as is any loud external logo on a house that avoids them. A small sewn-in tag carries an era-specific code, and pre-2001 vintage often has no serial at all, which is normal rather than a flag.

## The origin
Bottega leather bags are made in Italy. A Made in China label on a leather bag is a strong fake indicator.

## When to call in a pro
With no monogram to lean on, the weave and the leather are everything, and a missing serial on a modern bag is a yellow flag to investigate rather than a verdict. For a costly purchase, or before selling or insuring, have a professional authenticator examine it in person.

## Sources
Drawn from authentication services and reseller guides, including Fashionica, in June 2026. Many genuine vintage pieces never carried a serial, so we treat its absence as a question, not an answer.`;

const celineBody = `Celine is a rising name in resale fakes, with the modern Triomphe and the Philo-era Luggage and Box all targeted. The brand changed its own look in 2018, and that change is the most useful dating tell you have.

## The accent over the E
Bags from the Phoebe Philo years read CÉLINE with the accent. Hedi Slimane's 2018 rebrand dropped it to CELINE. So a 2010s Luggage or Box should carry the accent, though pieces made just after the change may not. The accent dates the era, it does not prove the bag is real.

[diagram: celine-authentication]

## The date code and the stamp
Philo-era date codes follow an LV-style alphanumeric format, placed consistently within a style. The format is copyable, so it is one data point, never proof. The brand stamp is foil matched to the hardware color, or a blind deboss, in the correct sans serif and centered. An oversized logo, made to look obvious, is a fake tell.

## The lettering and the wording
On the Triomphe the lettering, including the accent and the letterforms, is exact and evenly weighted, and counterfeiters routinely miss the proportions. This one is lower confidence, so verify it on close photos. The exterior stamp reads CELINE PARIS and the interior carries the Made in Italy mark, so wording or placement that is swapped or off is a flag.

## When to call in a pro
The accent and the date code place the era, but neither authenticates a bag on its own. For a costly purchase, or before selling or insuring, have a professional authenticator examine it in person.

## Sources
Drawn from authentication services and reseller guides, including TheRealReal, in June 2026. The Triomphe lettering point rests partly on community consensus, so we flag it as the one to verify most carefully.`;

const balenciagaBody = `Balenciaga is openly one of the hardest houses to authenticate, with an exception to almost every rule, and the City and First are the classic fake battleground. The markers below are weigh-points, not a checklist, and the famous interior tag is among the most-copied tags in resale.

## The zip and the rivets
On the City and First the moto zips carry the Lampo logo on the back of each zip head, embossed in italics and underlined with a small lightning bolt. From 2014 the Lampo mark was replaced with an uppercase B, so match it to the era. The rivets, from 2005, are deeply notched, while earlier ones were rounded, and shallow, squarish, or half-moon notches are a common tell.

[diagram: balenciaga-authentication]

## The bale and the hardware
The metal bale at the strap end has a rounded, organic shape tapering to a smooth flat end, so abrupt, coat-hanger angles are a tell. Hardware feel and finish should be consistent across the bag.

## The tags
The interior tag uses a single letter for the season and year, and because the alphabet has reset once, the same letter can point to two different seasons. The style number on the front of the tag should match the back. The tag back also changed over time, moving to an uppercase MADE IN ITALY in 2011, adding the season letter in 2012, and adding FABRIQUÉ EN ITALIE in 2014, so the wording should fit the production era.

## When to call in a pro
Balenciaga has more exceptions than most, pre-2012 tag-only bags are especially hard to place, and the most-faked tag means a correct-looking one proves nothing on its own. For a costly purchase, or before selling or insuring, have a professional authenticator examine it in person.

## Sources
Drawn chiefly from the Love that Bag reseller guide, in June 2026. That guide is detailed but single-source and its letter-code table is older, so the most recent season codes are best confirmed with a second opinion before relying on them.`;

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  topic_brand_id: number | null;
  topic_style_id: number | null;
};

const POSTS: SeedPost[] = [
  {
    slug: "chanel-authentication",
    title: "Chanel authentication: The markers worth checking",
    excerpt:
      "What changed when Chanel swapped its serial sticker for a hidden microchip in 2021, why the authenticity card matters but is not proof, and the CC-lock and quilt tells that catch most fakes.",
    body: chanelBody,
    topic_brand_id: 1,
    topic_style_id: 1, // Classic Flap, the most-faked model
  },
  {
    slug: "hermes-authentication",
    title: "Hermès authentication: The markers worth checking",
    excerpt:
      "Hermès uses no serial number, so the blind stamp, the craftsman's mark, and the hand saddle-stitch carry the read. The era cutoffs and hardware tells that matter on a Birkin or Kelly, and why no marker is proof.",
    body: hermesBody,
    topic_brand_id: 4,
    topic_style_id: null,
  },
  {
    slug: "dior-authentication",
    title: "Dior authentication: The markers worth checking",
    excerpt:
      "How Dior's tags shifted from woven labels to serial stickers to a 2019 microchip, the Oblique-canvas and D.I.O.R.-charm tells on a Lady Dior, and why a clean interior tag is one data point, not a verdict.",
    body: diorBody,
    topic_brand_id: 203,
    topic_style_id: null,
  },
  {
    slug: "prada-authentication",
    title: "Prada authentication: The markers worth checking",
    excerpt:
      "The triangle plaque is the most-copied element, so the read lives in the details around it: the interior jacquard logo, the angled topstitch, the lining material, and the QA tag. Markers to weigh, not a checklist.",
    body: pradaBody,
    topic_brand_id: 200,
    topic_style_id: null,
  },
  {
    slug: "goyard-authentication",
    title: "Goyard authentication: The markers worth checking",
    excerpt:
      "Goyard runs no serial lookup and issues no authenticity card, so the chevron weave, the surprising lightness, and the shallow heat stamp carry the read on a Saint Louis. Why a seller's card is a red flag, not a reassurance.",
    body: goyardBody,
    topic_brand_id: 404,
    topic_style_id: null,
  },
  {
    slug: "saint-laurent-authentication",
    title: "Saint Laurent authentication: The markers worth checking",
    excerpt:
      "The 2012 rebrand from Yves Saint Laurent to Saint Laurent Paris is the master dating tell, plus the Cassandre hardware, embossed serial, and Loulou quilting that catch most fakes. Why the name has to match the age.",
    body: yslBody,
    topic_brand_id: 398,
    topic_style_id: null,
  },
  {
    slug: "bottega-authentication",
    title: "Bottega Veneta authentication: The markers worth checking",
    excerpt:
      "With no monogram, the woven Intrecciato carries the read: genuine strips are held by compression, not thread. The leather hand, the debossed stamp, and the era-by-era serial, and why a missing vintage serial is normal.",
    body: bottegaBody,
    topic_brand_id: 204,
    topic_style_id: null,
  },
  {
    slug: "celine-authentication",
    title: "Celine authentication: The markers worth checking",
    excerpt:
      "The 2018 rebrand dropped the accent, so CÉLINE versus CELINE dates the era, plus the date code, stamp finish, and Triomphe lettering. The accent dates the bag, it does not prove it.",
    body: celineBody,
    topic_brand_id: 202,
    topic_style_id: null,
  },
  {
    slug: "balenciaga-authentication",
    title: "Balenciaga authentication: The markers worth checking",
    excerpt:
      "One of the hardest houses to authenticate, with an exception to nearly every rule. The Lampo zip, notched rivets, bale shape, and tag-wording eras on a City or First, all weigh-points, never a standalone verdict.",
    body: balenciagaBody,
    topic_brand_id: 405,
    topic_style_id: null,
  },
];

async function main() {
  for (const p of POSTS) {
    const { data: existing } = await db.from("post").select("post_id").eq("slug", p.slug).maybeSingle();
    const row = {
      author_user_id: AUTHOR,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      status: "draft" as const,
      topic_brand_id: p.topic_brand_id,
      topic_style_id: p.topic_style_id,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error } = await db.from("post").update(row).eq("post_id", existing.post_id);
      console.log(error ? `UPDATE ${p.slug} ERR ${error.message}` : `updated #${existing.post_id} ${p.slug}`);
    } else {
      const { data, error } = await db.from("post").insert(row).select("post_id").single();
      console.log(error ? `INSERT ${p.slug} ERR ${error.message}` : `inserted #${data!.post_id} ${p.slug}`);
    }
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
