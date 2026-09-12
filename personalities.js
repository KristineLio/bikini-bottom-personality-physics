export const CHARACTERS = Object.freeze({
  spongebob: {
    name: "SpongeBob",
    css: "toon-spongebob",
    traits: "HELPFUL · LOYAL",
    voice: { pitch: 1.38, rate: 1.08 }
  },
  patrick: {
    name: "Patrick",
    css: "toon-patrick",
    traits: "CURIOUS · IMPULSIVE",
    voice: { pitch: 0.78, rate: 0.86 }
  },
  squidward: {
    name: "Squidward",
    css: "toon-squidward",
    traits: "IRRITABLE · AVOIDS CHAOS",
    voice: { pitch: 0.72, rate: 0.96 }
  },
  mrkrabs: {
    name: "Mr. Krabs",
    css: "toon-mrkrabs",
    traits: "MONEY-OBSESSED",
    voice: { pitch: 0.8, rate: 1.02 }
  },
  plankton: {
    name: "Plankton",
    css: "toon-plankton",
    traits: "FORMULA-OBSESSED",
    voice: { pitch: 1.5, rate: 1.12 }
  }
});

export const PERSONALITY_WEIGHTS = Object.freeze({
  plankton: Object.freeze({
    formula_obsession: 100,
    opportunism: 92
  }),
  mrkrabs: Object.freeze({
    money_priority: 100,
    formula_priority: 76
  }),
  spongebob: Object.freeze({
    protect: 90,
    follow_authority: 95
  }),
  patrick: Object.freeze({
    novelty_drive: 88,
    impulse_control: 20
  }),
  squidward: Object.freeze({
    clarinet_protection: 92
  })
});

export const PERSONALITY_RULES = Object.freeze({
  plankton: Object.freeze([
    "Visible formula activates formula_obsession.",
    "If no formula defenders remain, opportunism converts intent into theft."
  ]),
  mrkrabs: Object.freeze([
    "Compare money_priority against formula_priority.",
    "The highest active score becomes the selected target."
  ]),
  spongebob: Object.freeze([
    "Protect the formula unless follow_authority becomes stronger.",
    "Scene-specific work cues can redirect attention."
  ]),
  patrick: Object.freeze([
    "Novel stimuli compete against low impulse_control.",
    "Movement path can become a stimulus for other characters."
  ]),
  squidward: Object.freeze([
    "Protect the clarinet when another character enters its safety radius or crosses its path."
  ])
});

export const PROPS = Object.freeze({
  formula: { name: "Secret Formula", icon: "📜" },
  money: { name: "Money", icon: "💵" },
  clarinet: { name: "Clarinet", icon: "🎵" },
  spatula: { name: "Spatula", icon: "🍳" },
  jellyfish: { name: "Jellyfish", icon: "🪼" },
  conch: { name: "Magic Conch", icon: "🐚", css: "magic-conch" }
});

export const SCENES = Object.freeze({
  krusty: "THE KRUSTY KRAB",
  chum: "CHUM BUCKET LAB",
  fields: "JELLYFISH FIELDS",
  house: "SPONGEBOB’S HOUSE",
  street: "CONCH STREET"
});
