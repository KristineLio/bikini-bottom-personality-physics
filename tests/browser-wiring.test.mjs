import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("collection operations never call forEach on the single-element $ helper", () => {
  const misuses = [...source.matchAll(/(^|[^$])\$\([^\n;]*?\)\.forEach\s*\(/gm)];
  assert.equal(
    misuses.length,
    0,
    "Use $$() for collections. Found single-element $().forEach usage: " +
      misuses.map(match => match[0].trim()).join(" | ")
  );
});

test("Judge Demo collection resets use the multi-element selector helper", () => {
  assert.match(source, /\$\$\("\.actor", els\.stage\)\.forEach/);
  assert.match(source, /\$\$\("\[data-film-step\]", els\.judgeFilmStepper\)\.forEach/);
  assert.match(source, /\$\$\("\.prop-object\.is-new-variable", els\.stage\)\.forEach/);
});
