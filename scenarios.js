import { createWorld } from "./world.js";

export function createJudgeWorld({ includeMoney = false } = {}) {
  return createWorld({
    scene: "krusty",
    actors: [
      { key: "plankton", x: 26, y: 61 },
      { key: "spongebob", x: 70, y: 62 },
      { key: "patrick", x: 17, y: 80 },
      { key: "mrkrabs", x: 84, y: 78 }
    ],
    props: [
      { key: "formula", x: 49, y: 54 },
      ...(includeMoney ? [{ key: "money", x: 81, y: 58 }] : [])
    ]
  });
}

export function createMotivationCollisionWorld() {
  return createWorld({
    scene: "krusty",
    actors: [
      { key: "plankton", x: 22, y: 58 },
      { key: "patrick", x: 46, y: 68 },
      { key: "squidward", x: 58, y: 78 },
      { key: "mrkrabs", x: 84, y: 61 }
    ],
    props: [
      { key: "formula", x: 31, y: 50 },
      { key: "money", x: 72, y: 49 },
      { key: "clarinet", x: 58, y: 61 }
    ]
  });
}

export function createExampleWorld() {
  return createWorld({
    scene: "krusty",
    actors: [
      { key: "plankton", x: 23, y: 62 },
      { key: "spongebob", x: 71, y: 62 },
      { key: "mrkrabs", x: 85, y: 76 }
    ],
    props: [
      { key: "formula", x: 50, y: 53 },
      { key: "spatula", x: 69, y: 48 }
    ]
  });
}
