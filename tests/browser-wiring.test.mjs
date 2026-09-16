import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("Judge Demo collection operations use the multi-element selector helper", () => {
  assert.doesNotMatch(
    source,
    /(^|[^$])\$\("\[data-film-step\]", els\.judgeFilmStepper\)\.forEach/m,
    "setJudgeFilmStep must not call forEach on the single-element $ helper"
  );

  assert.doesNotMatch(
    source,
    /(^|[^$])\$\("\.prop-object\.is-new-variable", els\.stage\)\.forEach/m,
    "resetJudgeFilmVisuals must not call forEach on the single-element $ helper"
  );

  assert.match(
    source,
    /\$\$\("\[data-film-step\]", els\.judgeFilmStepper\)\.forEach/
  );

  assert.match(
    source,
    /\$\$\("\.prop-object\.is-new-variable", els\.stage\)\.forEach/
  );
});
