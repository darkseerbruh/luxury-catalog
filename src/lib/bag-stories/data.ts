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
];
