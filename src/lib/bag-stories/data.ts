import type { BagStory } from "./types";

/**
 * Seeded hero stories. Each tidbit is research-sourced (see the `sources` on
 * every entry). Keep copy voice-compliant: no em dashes, no empty superlatives,
 * define any insider term in plain words.
 *
 * Sourcing note (date: 2026-06): facts below were pulled from the cited pages.
 * Re-verify on a refresh pass; figures (e.g. the auction record) carry their
 * year so they are never read as "current" once stale.
 */
export const BAG_STORIES: BagStory[] = [
  {
    match: ["birkin"],
    tagline: "It began as a doodle on an airplane sick bag, and became the most expensive handbag ever sold.",
    people: [
      {
        name: "Jane Birkin",
        role: "Namesake and co-designer",
        note: "The British-French actress and singer who sketched the original and lent it her name.",
      },
      {
        name: "Jean-Louis Dumas",
        role: "Hermès chairman who designed it",
        note: "Turned Jane's in-flight sketch into the bag, on the condition he could use her name.",
      },
    ],
    watchQuery: "Hermès Birkin bag history Jane Birkin interview",
    tidbits: [
      {
        kind: "origin",
        title: "A doodle on an airplane sick bag",
        body:
          "In 1981 Jane Birkin was seated next to Hermès chairman Jean-Louis Dumas on an Air France flight and spilled her bag across the floor. He told her she should carry one with pockets. She sketched the roomy bag she actually wanted on an airplane sickness bag, and he agreed to make it if he could name it after her.",
        sources: [
          {
            name: "Sotheby's",
            url: "https://www.sothebys.com/en/articles/7-secret-details-about-jane-birkins-original-birkin-revealed",
          },
          {
            name: "WWD",
            url: "https://wwd.com/pop-culture/culture-news/did-jane-birkin-design-the-birkin-bag-1235745565/",
          },
        ],
      },
      {
        kind: "design",
        title: "Designed to be used, not worshipped",
        body:
          "The brief was practical: a bag big enough to hold a young mother's whole day. Jane treated her own that way too, covering it in stickers and charms and carrying it until it wore out. The polished status object came later; the design started as a tool.",
        sources: [
          {
            name: "Sotheby's",
            url: "https://www.sothebys.com/en/articles/7-secret-details-about-jane-birkins-original-birkin-revealed",
          },
        ],
      },
      {
        kind: "culture",
        title: "A world record at auction",
        body:
          "Jane donated her original Birkin to an AIDS charity auction in 1994. In July 2025 that same prototype sold at Sotheby's Paris for 8.6 million euros, about 10.1 million US dollars with fees, the highest price ever paid for a handbag.",
        sources: [
          {
            name: "Sotheby's",
            url: "https://www.sothebys.com/en/articles/world-record-hermes-birkin-sale",
          },
          {
            name: "Artnews",
            url: "https://www.artnews.com/art-news/news/birkin-bag-sale-record-sothebys-paris-1234747227/",
          },
        ],
      },
    ],
  },
  {
    match: ["classic flap", "2.55", "timeless classic"],
    tagline: "Coco Chanel named it after its own birthday, and gave women back their hands.",
    people: [
      {
        name: "Gabrielle \"Coco\" Chanel",
        role: "Designer",
        note: "Created the 2.55 in February 1955 and added the strap so women could stop carrying bags by hand.",
      },
      {
        name: "Karl Lagerfeld",
        role: "Creative director who reshaped it",
        note: "His 1983 update added the interlocking CC turn-lock and the leather-laced chain of today's Classic Flap.",
      },
    ],
    watchQuery: "Chanel 2.55 flap bag history Coco Chanel documentary",
    tidbits: [
      {
        kind: "origin",
        title: "Named for the month it was born",
        body:
          "Chanel released the bag in February 1955 and called it the 2.55 after that date. Its real innovation was the shoulder strap. In her words, she was tired of carrying bags by hand and losing them, so she slipped a strap over her shoulder and freed her hands.",
        sources: [
          {
            name: "Sotheby's",
            url: "https://www.sothebys.com/en/articles/the-chanel-flap-bag-iconic-since-1955",
          },
          {
            name: "WWD",
            url: "https://wwd.com/fashion-news/fashion-scoops/feature/chanel-2-55-bag-history-1238015511/",
          },
        ],
      },
      {
        kind: "design",
        title: "Every detail is a memory",
        body:
          "The burgundy lining echoes the uniforms of the Aubazine convent where Chanel was raised. The diamond quilting borrows from the jackets worn by racetrack jockeys. The rectangular clasp, known as the Mademoiselle lock, nods to the fact that she never married.",
        sources: [
          {
            name: "WWD",
            url: "https://wwd.com/fashion-news/fashion-scoops/feature/chanel-2-55-bag-history-1238015511/",
          },
          {
            name: "Sotheby's",
            url: "https://www.sothebys.com/en/articles/the-chanel-flap-bag-iconic-since-1955",
          },
        ],
      },
      {
        kind: "trivia",
        title: "Two bags, one silhouette",
        body:
          "When Karl Lagerfeld took over Chanel in 1983 he reworked the bag with the now-famous interlocking double-C turn-lock and a chain laced with leather. That version is the Classic Flap. The original clasp lives on in the bag Chanel still sells as the 2.55 Reissue.",
        sources: [
          {
            name: "Sotheby's",
            url: "https://www.sothebys.com/en/articles/the-chanel-flap-bag-iconic-since-1955",
          },
          {
            name: "WWD",
            url: "https://wwd.com/fashion-news/fashion-scoops/feature/chanel-2-55-bag-history-1238015511/",
          },
        ],
      },
    ],
  },
  {
    match: ["kelly"],
    tagline:
      "A 1930s bag for carrying saddles became the first It bag the day a princess used it to hide a pregnancy.",
    people: [
      {
        name: "Grace Kelly",
        role: "The princess who named it",
        note: "The Hollywood star turned Princess of Monaco whose photographs made the bag a global phenomenon.",
      },
      {
        name: "Robert Dumas",
        role: "Hermès designer",
        note: "Reworked an equestrian bag into the structured Sac à dépêches that would become the Kelly.",
      },
    ],
    watchQuery: "Hermès Kelly bag history Grace Kelly documentary",
    tidbits: [
      {
        kind: "origin",
        title: "From the stable to the salon",
        body:
          "The Kelly began in the 1930s when Hermès shrank a bag built to hold saddles into a structured handbag for women, the Sac à dépêches, launched in 1935. Simple, solid and roomy, it was made to carry a lot in a refined shape.",
        sources: [{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kelly_bag" }],
      },
      {
        kind: "culture",
        title: "The photograph that changed everything",
        body:
          "Grace Kelly fell for the bag while filming To Catch a Thief in 1954. In 1956, newly the Princess of Monaco, she was photographed using it to shield her pregnant belly from the cameras. Sales jumped overnight and the bag became the first true luxury It bag.",
        sources: [
          { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kelly_bag" },
          { name: "Baghunter", url: "https://baghunter.com/blogs/news/princess-grace-kelly-history-of-hermes-kelly-bag" },
        ],
      },
      {
        kind: "trivia",
        title: "Twenty years to make it official",
        body:
          "Everyone called it the Kelly long before Hermès did. The house only changed the name from Sac à dépêches to Kelly officially in 1977, more than twenty years after that famous photo.",
        sources: [{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kelly_bag" }],
      },
    ],
  },
  {
    match: ["constance"],
    tagline: "Named for a baby born the very day it left the workshop, and closed with a single bold H.",
    people: [
      {
        name: "Catherine Chaillet",
        role: "Hermès designer",
        note: "Designed the bag while pregnant and named it for the daughter she delivered the day it shipped.",
      },
      {
        name: "Jackie Kennedy Onassis",
        role: "The icon who popularized it",
        note: "Carried the Constance often, helping cement its status.",
      },
    ],
    watchQuery: "Hermès Constance bag history H clasp",
    tidbits: [
      {
        kind: "origin",
        title: "Born the same day as a baby",
        body:
          "In 1959 the in-house designer Catherine Chaillet, then pregnant, created the bag for Hermès. As the story goes, her design left the workshop on the same day she gave birth, so she named it Constance after her newborn daughter.",
        sources: [
          { name: "Sotheby's", url: "https://www.sothebys.com/en/articles/all-about-the-hermes-constance" },
          { name: "SACLÀB", url: "https://saclab.com/the-constance-close-up/" },
        ],
      },
      {
        kind: "design",
        title: "The H that clicks shut",
        body:
          "The Constance is instantly recognizable for its bold H clasp. The H is also the lock: it opens and closes with a spring mechanism hidden on each side of the metal bar attached to the flap.",
        sources: [{ name: "SACLÀB", url: "https://saclab.com/the-constance-close-up/" }],
      },
      {
        kind: "culture",
        title: "In production since day one",
        body:
          "The Constance has stayed in continuous production since 1959 and remains one of Hermès' most sought designs, helped along by admirers like Jackie Kennedy Onassis.",
        sources: [{ name: "Sotheby's", url: "https://www.sothebys.com/en/articles/all-about-the-hermes-constance" }],
      },
    ],
  },
  {
    match: ["neverfull"],
    tagline: "Built in 2007 to beat Goyard's tote, it became Louis Vuitton's best seller and turns fully inside out.",
    people: [
      {
        name: "Nicholas Knightly",
        role: "Louis Vuitton leather goods design director",
        note: "Framed the brief: one bag for the beach, work, shopping, and carrying baby gear.",
      },
    ],
    watchQuery: "Louis Vuitton Neverfull history design",
    tidbits: [
      {
        kind: "origin",
        title: "The answer to Goyard",
        body:
          "Louis Vuitton introduced the Neverfull in 2007 to compete with Goyard's popular Saint-Louis tote. The house wanted one bag that could do everything, and it went on to outsell its rival and become LV's best-selling tote.",
        sources: [
          { name: "Sotheby's", url: "https://www.sothebys.com/en/articles/louis-vuitton-neverfull-the-tote-that-is-truly-never-full" },
          { name: "Rebag", url: "https://www.rebag.com/thevault/the-louis-vuitton-neverfull-a-history/" },
        ],
      },
      {
        kind: "design",
        title: "A tote you can flip inside out",
        body:
          "The design drew on Louis Vuitton's 19th-century Navy and Laundry bags. Thanks to its seam construction, the Neverfull can be turned completely inside out for a different look.",
        sources: [
          { name: "Sotheby's", url: "https://www.sothebys.com/en/articles/louis-vuitton-neverfull-the-tote-that-is-truly-never-full" },
        ],
      },
      {
        kind: "trivia",
        title: "The name is a wink",
        body:
          "It launched in three sizes and the name is a small joke: the bag is roomy enough that it always seems to hold a little more, so it is never quite full.",
        sources: [
          { name: "Sotheby's", url: "https://www.sothebys.com/en/articles/louis-vuitton-neverfull-the-tote-that-is-truly-never-full" },
        ],
      },
    ],
  },
  {
    match: ["speedy"],
    tagline: "A 1930s travel bag, shrunk to Audrey Hepburn's specifications.",
    people: [
      {
        name: "Audrey Hepburn",
        role: "The muse behind the size",
        note: "Asked Louis Vuitton for a smaller everyday version, and the Speedy 25 was born.",
      },
    ],
    watchQuery: "Louis Vuitton Speedy history Audrey Hepburn",
    tidbits: [
      {
        kind: "origin",
        title: "The Express, scaled down",
        body:
          "The Speedy arrived in 1930 as a smaller take on the popular Keepall travel bag. In an era of faster travel by car, train and plane, it was first called the Express.",
        sources: [
          { name: "WWD", url: "https://wwd.com/fashion-news/fashion-features/everything-to-know-about-louis-vuittons-speedy-bag-1235093134/" },
          { name: "l'Étoile", url: "https://etoile-luxuryvintage.com/blogs/the-history-of/history-of-the-bag-louis-vuitton-speedy" },
        ],
      },
      {
        kind: "culture",
        title: "Audrey's 25",
        body:
          "In 1959 Audrey Hepburn asked Louis Vuitton to miniaturize the bag into something she could carry every day. The resulting Speedy 25, just 25 centimeters wide, turned the style into an icon and is still a favorite size.",
        sources: [
          { name: "WWD", url: "https://wwd.com/fashion-news/fashion-features/everything-to-know-about-louis-vuittons-speedy-bag-1235093134/" },
        ],
      },
      {
        kind: "design",
        title: "It learned to hang from the shoulder",
        body:
          "For most of its life the Speedy was a hand-carry. In 2011 the Speedy Bandoulière added a long strap so it could finally be worn on the shoulder or across the body. Bandoulière is French for shoulder strap.",
        sources: [
          { name: "l'Étoile", url: "https://etoile-luxuryvintage.com/blogs/the-history-of/history-of-the-bag-louis-vuitton-speedy" },
        ],
      },
    ],
  },
  {
    match: ["capucines"],
    tagline: "Named for the Paris street where Louis Vuitton opened his very first store in 1854.",
    people: [
      {
        name: "Louis Vuitton",
        role: "Founder",
        note: "Opened the rue Neuve-des-Capucines shop in 1854 that the bag is named to honor.",
      },
    ],
    watchQuery: "Louis Vuitton Capucines bag history",
    tidbits: [
      {
        kind: "origin",
        title: "A nod to 1854",
        body:
          "Launched in late 2013, the Capucines takes its name from rue Neuve-des-Capucines near Place Vendôme, the address of Louis Vuitton's very first store, opened in 1854.",
        sources: [
          { name: "Louis Vuitton", url: "https://us.louisvuitton.com/eng-us/stories/the-capucines" },
          { name: "NUVO", url: "https://nuvomagazine.com/magazine/summer-2014/louis-vuitton-capucines-handbag" },
        ],
      },
      {
        kind: "design",
        title: "Logo turned quiet",
        body:
          "The Capucines arrived as Louis Vuitton leaned into cleaner, minimally branded bags rather than all-over monogram. The LV initials sit discreetly on the front, a deliberate move away from logo-heavy design.",
        sources: [
          { name: "Louis Vuitton", url: "https://us.louisvuitton.com/eng-us/stories/the-capucines" },
        ],
      },
      {
        kind: "culture",
        title: "A quiet-luxury cult bag",
        body:
          "Without an obvious logo to announce it, the Capucines built a following among shoppers who wanted the craft without the branding, and it is now considered one of the house's modern cult handbags.",
        sources: [
          { name: "Marie Claire", url: "https://www.marieclaire.co.uk/fashion/louis-vuitton-capucines-cult-handbag-751250" },
        ],
      },
    ],
  },
  {
    match: ["lady dior"],
    tagline: "A gift to Princess Diana that she carried so often it took her name.",
    people: [
      {
        name: "Gianfranco Ferré",
        role: "Dior designer",
        note: "Designed the bag in 1994, originally under the name Chouchou.",
      },
      {
        name: "Princess Diana",
        role: "Namesake",
        note: "Received and carried the bag so often that Dior renamed it in her honor.",
      },
    ],
    watchQuery: "Lady Dior bag history Princess Diana",
    tidbits: [
      {
        kind: "origin",
        title: "From Chouchou to Lady Dior",
        body:
          "Gianfranco Ferré designed the bag in 1994 under the nickname Chouchou, French for favorite. In 1995 France's first lady Bernadette Chirac gave one to Princess Diana during a Paris visit. In 1996, as a tribute, Dior renamed it Lady Dior with her blessing.",
        sources: [
          { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lady_Dior" },
          { name: "WWD", url: "https://wwd.com/fashion-news/fashion-scoops/feature/lady-dior-bag-history-1237071573/" },
        ],
      },
      {
        kind: "design",
        title: "The cannage quilt",
        body:
          "The bag's woven diamond pattern is called cannage, or caning. It echoes the Napoléon III chairs that Christian Dior seated his guests on at his runway shows. Cannage means the woven caning used on classic French furniture.",
        sources: [{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lady_Dior" }],
      },
      {
        kind: "culture",
        title: "Diana's bag",
        body:
          "Diana received the black bag at the opening of a Cézanne exhibition at the Grand Palais and was photographed with it again and again. The press tie to the Princess turned it into one of fashion's most recognizable bags.",
        sources: [
          { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lady_Dior" },
          { name: "WWD", url: "https://wwd.com/fashion-news/fashion-scoops/feature/lady-dior-bag-history-1237071573/" },
        ],
      },
    ],
  },
  {
    match: ["saddle"],
    tagline:
      "John Galliano's equestrian bag became the first It bag of the 2000s, faded, then came roaring back.",
    people: [
      {
        name: "John Galliano",
        role: "Dior creative director",
        note: "Introduced the asymmetrical saddle-shaped bag in 1999.",
      },
      {
        name: "Sarah Jessica Parker",
        role: "The screen moment",
        note: "Carried it as Carrie Bradshaw on Sex and the City, sealing its Y2K fame.",
      },
    ],
    watchQuery: "Dior Saddle bag history John Galliano",
    tidbits: [
      {
        kind: "origin",
        title: "A curve borrowed from a horse",
        body:
          "Dior introduced the Saddle in 1999 under John Galliano. Its asymmetrical, saddle-shaped body, hand-stitched piping and dangling D charm debuted in the Spring/Summer 2000 collection.",
        sources: [{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dior_Saddle_bag" }],
      },
      {
        kind: "culture",
        title: "Carrie Bradshaw's bag",
        body:
          "The Saddle took off in the early 2000s on figures like Paris Hilton and, most famously, Carrie Bradshaw in Sex and the City, styled by Patricia Field in season three. Vogue later called it a pop-culture phenomenon and a defining Y2K piece.",
        sources: [
          { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dior_Saddle_bag" },
          { name: "Hypebae", url: "https://hypebae.com/2018/10/dior-saddle-bag-history-john-galliano" },
        ],
      },
      {
        kind: "trivia",
        title: "Gone, then back again",
        body:
          "By 2001 Dior's accessories sales had reportedly jumped about 60 percent. The bag faded with the era, then Maria Grazia Chiuri revived it in 2018 and a new generation made it a hit all over again.",
        sources: [{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dior_Saddle_bag" }],
      },
    ],
  },
  {
    match: ["marmont"],
    tagline: "Alessandro Michele scaled up a 1970s belt buckle and made one of the decade's most-searched bags.",
    people: [
      {
        name: "Alessandro Michele",
        role: "Gucci creative director",
        note: "Launched the Marmont early in his tenure and built it around an archival Double G.",
      },
    ],
    watchQuery: "Gucci GG Marmont bag history Alessandro Michele",
    tidbits: [
      {
        kind: "origin",
        title: "A belt buckle, supersized",
        body:
          "The GG Marmont arrived for Fall/Winter 2016, early in Alessandro Michele's tenure. He pulled the Double G from a 1970s Gucci belt buckle, scaled it up, gave it an antiqued finish and set it front and center.",
        sources: [
          { name: "Rebag", url: "https://www.rebag.com/thevault/gucci-101-marmont-collection/" },
          { name: "PurseBlog", url: "https://www.purseblog.com/gucci/the-ultimate-gucci-marmont-bag-guide/" },
        ],
      },
      {
        kind: "design",
        title: "The chevron quilt",
        body:
          "The Marmont is instantly known for its soft matelassé chevron leather. Matelassé is a padded, quilted texture, here stitched into a raised chevron pattern.",
        sources: [
          { name: "Fashionphile", url: "https://www.fashionphile.com/blogs/academy/a-gucci-marmont-guide" },
        ],
      },
      {
        kind: "culture",
        title: "The resale obsession",
        body:
          "The Double G hardware and matelassé leather became shorthand for Gucci's maximalist resurgence. Over the decade since, the Marmont has stayed one of the most bought, resold and searched designer bags in the world.",
        sources: [{ name: "Rebag", url: "https://www.rebag.com/thevault/gucci-101-marmont-collection/" }],
      },
    ],
  },
  {
    match: ["dionysus"],
    tagline: "Named for a Greek god who, the myth says, rode a tiger across a river.",
    people: [
      {
        name: "Alessandro Michele",
        role: "Gucci creative director",
        note: "Introduced the Dionysus in 2015 as a statement of his archival, maximalist Gucci.",
      },
    ],
    watchQuery: "Gucci Dionysus bag history tiger clasp",
    tidbits: [
      {
        kind: "origin",
        title: "A god among bags",
        body:
          "When Alessandro Michele became Gucci's creative director in 2015 he introduced the Dionysus, named for the ancient Greek god of wine, celebration and a touch of madness.",
        sources: [
          { name: "Rebag", url: "https://www.rebag.com/thevault/gucci-101-the-dionysus-collection/" },
          { name: "Bustle", url: "https://www.bustle.com/style/gucci-dionysus-bag" },
        ],
      },
      {
        kind: "design",
        title: "The tiger-head clasp",
        body:
          "The two tiger heads on the closure come from a myth in which Dionysus crossed a river on a tiger's back, the river later named the Tigris. The horseshoe shape behind them nods to Gucci's long equestrian heritage.",
        sources: [
          { name: "Rebag", url: "https://www.rebag.com/thevault/gucci-101-the-dionysus-collection/" },
          { name: "NGV", url: "https://www.ngv.vic.gov.au/essay/dionysus-bag/" },
        ],
      },
      {
        kind: "culture",
        title: "Michele's calling card",
        body:
          "Layered with mythology and archival references, the Dionysus helped define Michele's eclectic, maximalist era at Gucci and became one of the house's signature modern bags.",
        sources: [{ name: "Rebag", url: "https://www.rebag.com/thevault/gucci-101-the-dionysus-collection/" }],
      },
    ],
  },
  {
    match: ["jackie"],
    tagline: "First called the G1244, until Jackie Kennedy bought six and was rarely photographed without one.",
    people: [
      {
        name: "Jackie Kennedy Onassis",
        role: "Namesake",
        note: "Carried the bag so constantly that Gucci renamed it in her honor.",
      },
      {
        name: "Alessandro Michele",
        role: "Gucci creative director",
        note: "Revived it as the Jackie 1961 in 2020.",
      },
    ],
    watchQuery: "Gucci Jackie 1961 bag history Jackie Kennedy",
    tidbits: [
      {
        kind: "origin",
        title: "From a product code to a first lady",
        body:
          "Gucci introduced the bag in 1961 as the G1244. Jacqueline Kennedy Onassis was photographed with it so often that the house simply started calling it the Jackie.",
        sources: [
          { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Gucci_Jackie" },
          { name: "Editorialist", url: "https://editorialist.com/fashion/gucci-jackie-bag/" },
        ],
      },
      {
        kind: "design",
        title: "A relaxed half-moon",
        body:
          "The Jackie is a half-moon hobo shape with a piston-shaped closure, looser and softer than the structured bags of its day. Jackie reportedly used its wide base to shield her face from the paparazzi.",
        sources: [{ name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Gucci_Jackie" }],
      },
      {
        kind: "trivia",
        title: "Six in one visit",
        body:
          "As the story goes, in 1964 she walked into a Gucci boutique and left with six of the bags. Decades later Alessandro Michele brought it back as the Jackie 1961 at Gucci's Men's Fall 2020 show.",
        sources: [
          { name: "Editorialist", url: "https://editorialist.com/fashion/gucci-jackie-bag/" },
          { name: "Bustle", url: "https://www.bustle.com/style/gucci-jackie-1961-bag" },
        ],
      },
    ],
  },
  {
    match: ["bamboo"],
    tagline: "Born from postwar scarcity, its handle is still bent over an open flame in Florence.",
    people: [
      {
        name: "Guccio Gucci",
        role: "Founder",
        note: "The house whose Florentine artisans improvised the bamboo handle in 1947.",
      },
    ],
    watchQuery: "Gucci Bamboo 1947 bag history",
    tidbits: [
      {
        kind: "origin",
        title: "Made from what was left",
        body:
          "Gucci introduced the Bamboo bag in 1947, in the lean years after the war when leather and metal were scarce in Italy. Short on materials, the house's artisans turned to bamboo imported from Japan.",
        sources: [
          { name: "Into Archive", url: "https://www.intoarchive.com/editorials/gucci-bamboo-bag-history" },
          { name: "Weekly Lux Drop", url: "https://www.weeklyluxdrop.com/blogs/news/an-iconic-gucci-piece-the-gucci-bamboo-bag-a-timeless-creation-born-from-adversity" },
        ],
      },
      {
        kind: "design",
        title: "Bent over a flame",
        body:
          "Craftsmen heated and curved the bamboo over an open flame into its signature arched handle, a method that holds its shape once cooled. Each handle is still shaped by hand in Florence using that 1947 technique.",
        sources: [
          { name: "Into Archive", url: "https://www.intoarchive.com/editorials/gucci-bamboo-bag-history" },
          { name: "Barnebys", url: "https://www.barnebys.com/blog/how-the-gucci-bag-got-its-bamboo-handle" },
        ],
      },
      {
        kind: "trivia",
        title: "Patented in 1958",
        body:
          "The design was distinctive enough that Gucci secured a patent on the bamboo bag in 1958, so no other house could copy it.",
        sources: [{ name: "Into Archive", url: "https://www.intoarchive.com/editorials/gucci-bamboo-bag-history" }],
      },
    ],
  },
  {
    match: ["triomphe"],
    tagline: "A logo Céline Vipiana spotted on the Arc de Triomphe in 1971, revived as a clasp by Hedi Slimane in 2018.",
    people: [
      {
        name: "Céline Vipiana",
        role: "Founder",
        note: "Noticed the interlocking chains around the Arc de Triomphe and turned them into the house emblem.",
      },
      {
        name: "Hedi Slimane",
        role: "Celine creative director",
        note: "Revived the 1970s emblem as the Triomphe clasp for his 2018 debut.",
      },
    ],
    watchQuery: "Celine Triomphe bag history Hedi Slimane",
    tidbits: [
      {
        kind: "origin",
        title: "A chain around a monument",
        body:
          "The name and clasp trace to the Arc de Triomphe. One afternoon in 1971 the founder, Céline Vipiana, broke down at Place de l'Étoile in Paris and noticed the interlocking chain links circling the monument, each like a pair of joined Cs. That became the Triomphe emblem.",
        sources: [
          { name: "The Hosta", url: "https://www.the-hosta.com/en-us/blogs/handbag-faqs/what-is-the-story-behind-the-celine-triomphe-logo" },
          { name: "Celine", url: "https://www.celine.com/en-int/cm/the-triomphe-bag" },
        ],
      },
      {
        kind: "design",
        title: "The clasp is the logo",
        body:
          "Hedi Slimane revived that archival double-C emblem as the bag's clasp for his debut Celine collection in 2018, so the closure that holds the bag shut is also the house signature.",
        sources: [
          { name: "Bagaholicboy", url: "https://bagaholicboy.com/2023/05/celine-everything-to-know-about-the-iconic-triomphe" },
        ],
      },
      {
        kind: "culture",
        title: "The quiet-luxury signature",
        body:
          "Under Slimane the Triomphe became Celine's defining bag and a staple of the quiet-luxury look, recognized by its clasp rather than a loud logo.",
        sources: [{ name: "myGemma", url: "https://mygemma.com/blogs/news/the-history-of-celine" }],
      },
    ],
  },
];
