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
];
