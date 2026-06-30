import type { HouseStory } from "./types";

/**
 * Authored house stories. Sourced narrative recut into short, icon-led beats.
 * Add a house here to upgrade it from the reflowed-description fallback to the
 * rich beats layout. Hermès is the first; sourcing lives in
 * docs/research-drafts/hermes-house-story.md.
 */
export const HOUSE_STORIES: HouseStory[] = [
  {
    match: ["hermès", "hermes"],
    lead: "The rare house where the world’s most wanted handbag began as a tool for a horse.",
    beats: [
      {
        icon: "saddlery",
        lead: "A Paris saddlery, 1837.",
        body: "Thierry Hermès made riding gear for European nobility.",
      },
      {
        icon: "stitch",
        lead: "The saddle-stitch stayed.",
        body: "Each Birkin and Kelly is cut, stitched and signed by a single artisan, start to finish.",
      },
      {
        icon: "clasp",
        lead: "1923, a first.",
        body: "The Bolide put the first zipper ever on a handbag.",
      },
      {
        icon: "tag",
        lead: "Named with stable logic.",
        body: "The Kelly for the princess, the Birkin for the actress, the Evelyne and Picotin straight from the stable.",
      },
      {
        icon: "family",
        lead: "Still in the family.",
        body: "Six generations on, the founding family still controls the house, a large part of why the waitlists and resale premiums run the way they do.",
      },
    ],
  },
  {
    match: ["chanel"],
    lead: "The couturière who freed women from corsets, then gave them a bag with a strap so their hands were free too.",
    beats: [
      {
        icon: "scissors",
        lead: "A couturière first.",
        body: "Gabrielle ‘Coco’ Chanel built the house on freeing women from corsets, long before the first bag.",
      },
      {
        icon: "clasp",
        lead: "February 1955.",
        body: "She named the quilted flap for its own birthday, the 2.55, and added a shoulder strap so women had their hands back.",
      },
      {
        icon: "stitch",
        lead: "The diamond quilt.",
        body: "The house signature, stitched on pebbled caviar or soft lambskin leather.",
      },
      {
        icon: "family",
        lead: "Named for a love.",
        body: "Karl Lagerfeld called Chanel’s edgiest bag the Boy, after Boy Capel, the great love of Coco’s life.",
      },
    ],
  },
  {
    match: ["louis vuitton", "vuitton"],
    lead: "A trunk maker whose canvas, drawn to defeat counterfeiters, became the most copied print in luxury.",
    beats: [
      {
        icon: "trunk",
        lead: "Paris, 1854.",
        body: "Louis Vuitton opened as a malletier, a maker of flat-topped trunks that stacked where domed ones could not.",
      },
      {
        icon: "loom",
        lead: "1896, against the fakes.",
        body: "Georges Vuitton drew the Monogram canvas to make the house impossible to copy.",
      },
      {
        icon: "tag",
        lead: "Named from the map of Paris.",
        body: "The Capucines for the street of the first store, the Alma for a bridge, the Petite Malle a trunk small enough to wear.",
      },
      {
        icon: "clasp",
        lead: "Travel, shrunk to the city.",
        body: "The Speedy was a 1930s travel bag made small; the Neverfull, a 2007 tote that turns fully inside out.",
      },
    ],
  },
  {
    match: ["gucci"],
    lead: "A Florentine leather house that turned the language of the stable into a fashion signature.",
    beats: [
      {
        icon: "atelier",
        lead: "Florence, 1921.",
        body: "Guccio Gucci opened a leather goods shop, inspired by the fine luggage he had handled working in London hotels.",
      },
      {
        icon: "saddlery",
        lead: "The stable, on a bag.",
        body: "The Horsebit clasp and the green-red-green web came straight from equestrian gear.",
      },
      {
        icon: "flag",
        lead: "Bamboo from scarcity.",
        body: "Postwar shortages gave the 1947 Bamboo bag its flame-bent handle, still shaped over an open flame in Florence.",
      },
    ],
  },
  {
    match: ["dior"],
    lead: "The house that relaunched Paris fashion overnight, and named its bags for the city and the people who carried them.",
    beats: [
      {
        icon: "scissors",
        lead: "1947, the New Look.",
        body: "Christian Dior’s first collection brought back the cinched waist and full skirt, and remade postwar fashion.",
      },
      {
        icon: "tag",
        lead: "30 Montaigne.",
        body: "Named for the Paris address where Dior built the house and showed that first collection.",
      },
      {
        icon: "family",
        lead: "A princess’s bag.",
        body: "The Lady Dior took its name from Princess Diana, who carried it so constantly it became hers.",
      },
    ],
  },
  {
    match: ["celine", "céline"],
    lead: "A children’s-shoe shop that became a byword for quiet, modern French luxury.",
    beats: [
      {
        icon: "scissors",
        lead: "Paris, 1945.",
        body: "Céline Vipiana opened a made-to-measure children’s shoe house before turning to leather and ready-to-wear.",
      },
      {
        icon: "tier",
        lead: "A logo from the Arc.",
        body: "The Triomphe clasp came from chains Céline Vipiana spotted on the Arc de Triomphe in 1971, revived by Hedi Slimane in 2018.",
      },
      {
        icon: "clasp",
        lead: "Phoebe Philo’s It bag.",
        body: "The Luggage tote, winged and zipped like a face, defined late-2000s minimalism.",
      },
    ],
  },
  {
    match: ["saint laurent", "yves saint laurent", "ysl"],
    lead: "The house that put women in tuxedos, and named a bag for the muse who shaped its founder.",
    beats: [
      {
        icon: "scissors",
        lead: "1961, a new house.",
        body: "Yves Saint Laurent founded his own label and soon put women in Le Smoking, the tuxedo as eveningwear.",
      },
      {
        icon: "family",
        lead: "Named for a muse.",
        body: "The LouLou honours Loulou de la Falaise, who shaped the YSL world, with quilting that traces a Y.",
      },
      {
        icon: "clasp",
        lead: "The bag of the day.",
        body: "Hedi Slimane built the Sac de Jour as Saint Laurent’s structured everyday classic.",
      },
    ],
  },
  {
    match: ["fendi"],
    lead: "A Roman fur and leather house that invented the It bag and the idea of the bag worn tucked under the arm.",
    beats: [
      {
        icon: "atelier",
        lead: "Rome, 1925.",
        body: "Adele and Edoardo Fendi opened a fur and leather workshop in the heart of the city.",
      },
      {
        icon: "clasp",
        lead: "The first It bag.",
        body: "The 1997 Baguette, carried under the arm like a loaf of bread, arguably began the It-bag era.",
      },
      {
        icon: "tag",
        lead: "Made to be seen open.",
        body: "The Peekaboo is built so the craftsmanship inside peeks out.",
      },
    ],
  },
  {
    match: ["bottega veneta", "bottega"],
    lead: "An Italian house whose signature is a woven leather that carries no logo at all.",
    beats: [
      {
        icon: "loom",
        lead: "Veneto, 1966.",
        body: "Bottega Veneta built its name on intrecciato, leather cut into strips and woven by hand.",
      },
      {
        icon: "tier",
        lead: "Quiet on purpose.",
        body: "Its old motto, when your own initials are enough, made discreet no-logo luxury the whole point.",
      },
      {
        icon: "tag",
        lead: "Named for a photograph.",
        body: "The Jodie hobo takes its name from a 1990s image of Jodie Foster using one to hide from the cameras.",
      },
    ],
  },
  {
    match: ["prada"],
    lead: "A Milan leather-goods shop that became the thinking person’s luxury house, on the back of a nylon bag.",
    beats: [
      {
        icon: "trunk",
        lead: "Milan, 1913.",
        body: "Mario Prada opened a fine leather and travel goods store in the Galleria Vittorio Emanuele II.",
      },
      {
        icon: "tag",
        lead: "Named for the arcade.",
        body: "The Galleria bag carries the name of that first store’s Milan arcade.",
      },
      {
        icon: "loom",
        lead: "Nylon as luxury.",
        body: "Miuccia Prada’s black nylon backpack made an industrial fabric a status symbol in the 1980s.",
      },
    ],
  },
  {
    match: ["loewe"],
    lead: "Spain’s oldest luxury house, reborn as a leather laboratory.",
    beats: [
      {
        icon: "atelier",
        lead: "Madrid, 1846.",
        body: "Loewe began as a group of leather artisans, and leather is still its craft.",
      },
      {
        icon: "tier",
        lead: "A modern leather lab.",
        body: "From 2013 Jonathan Anderson reframed the house around craft and material.",
      },
      {
        icon: "clasp",
        lead: "Cut flat, folded to shape.",
        body: "His first bag, the Puzzle, is cut from geometric panels and folded into a cube.",
      },
    ],
  },
  {
    match: ["coach"],
    lead: "An American leather house born from a baseball glove, now the heart of accessible luxury.",
    beats: [
      {
        icon: "atelier",
        lead: "New York, 1941.",
        body: "Coach began making leather goods inspired by the supple, worn-in feel of a baseball glove.",
      },
      {
        icon: "tag",
        lead: "The Tabby returns.",
        body: "Its Tabby shoulder bag revives a 1970s Coach silhouette.",
      },
      {
        icon: "catalogue",
        lead: "Accessible by design.",
        body: "Coach sits in the premium tier, the designer bag most often found in US thrift stores.",
      },
    ],
  },
  {
    match: ["mulberry"],
    lead: "An English house that made workmanlike leather and a giant padlock into a national favourite.",
    beats: [
      {
        icon: "pin",
        lead: "English by character.",
        body: "Mulberry built its name on sturdy, countryside-bred English leather goods.",
      },
      {
        icon: "tag",
        lead: "Named for a neighbourhood.",
        body: "The Bayswater, its most British bag, takes the name of a West London area.",
      },
    ],
  },
  {
    match: ["telfar"],
    lead: "A New York label that made a luxury-feeling bag priced and made for everyone.",
    beats: [
      {
        icon: "flag",
        lead: "New York, since 2005.",
        body: "Telfar Clemens built a unisex brand on the idea that luxury should not gatekeep.",
      },
      {
        icon: "tag",
        lead: "The Bushwick Birkin.",
        body: "Its vegan-leather Shopping Bag, modeled on a department-store tote, became a cult symbol of accessible design.",
      },
    ],
  },
];
