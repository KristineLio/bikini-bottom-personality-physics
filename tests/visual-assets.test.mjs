import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const requiredAssets = [
  "assets/backgrounds/main/krusty-krab-bg-main.png",
  "assets/backgrounds/optional/chum-bucket-bg-main.png",
  "assets/backgrounds/optional/conch-street-bg-main.png",
  "assets/backgrounds/optional/spongebob-house-bg-main.png",
  "assets/backgrounds/overlays/bubble-overlay-soft.png",
  "assets/backgrounds/overlays/krusty-krab-fg-overlay.png",
  "assets/backgrounds/overlays/stage-floor-shadow-overlay.png",
  "assets/backgrounds/overlays/underwater-light-rays-overlay.png",
  "assets/characters/spongebob.png",
  "assets/characters/patrick.png",
  "assets/characters/squidward.png",
  "assets/characters/mr-krabs.png",
  "assets/characters/plankton.png",
  "assets/characters/spongebob-alert.png",
  "assets/characters/patrick-excited.png",
  "assets/characters/squidward-reacting.png",
  "assets/characters/mr-krabs-money-focus.png",
  "assets/characters/plankton-carry-formula.png",
  "assets/props/formula.png",
  "assets/props/money.png",
  "assets/props/clarinet.png",
  "assets/props/magic-conch.png",
  "assets/fx/action-burst.png",
  "assets/fx/focus-glow-ring.png",
  "assets/fx/motion-streak-plankton.png",
  "assets/fx/soft-character-shadow.png",
  "assets/ui/xray-panel-bg.png",
  "assets/ui/result-panel-bg.png"
];

test("visual asset pack files required by the UI exist", async () => {
  await Promise.all(requiredAssets.map(path => access(new URL("../" + path, import.meta.url))));
});

test("production CSS references PNG character sprites instead of legacy SVG files", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  for (const name of ["spongebob", "patrick", "squidward", "mr-krabs", "plankton"]) {
    assert.match(css, new RegExp("assets/characters/" + name.replace("-", "\\-") + "\\.png"));
    assert.doesNotMatch(css, new RegExp("assets/characters/" + name.replace("-", "\\-") + "\\.svg"));
  }
});

test("Pages workflow copies the complete assets tree", async () => {
  const workflow = await readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /cp -R assets\/\. dist\/assets\//);
});

test("semantic reaction classes are wired to the visual variants", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  for (const className of ["variant-alert", "variant-excited", "variant-reacting", "variant-money-focus", "variant-carry-formula"]) {
    assert.match(app, new RegExp(className));
  }
});
