import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("Judge Demo collection operations use the multi-element selector helper", () => {
  assert.equal(
    source.includes('$("[data-film-step]", els.judgeFilmStepper).forEach'),
    false,
    "setJudgeFilmStep must not call forEach on the single-element $ helper"
  );

  assert.equal(
    source.includes('$(".prop-object.is-new-variable", els.stage).forEach'),
    false,
    "resetJudgeFilmVisuals must not call forEach on the single-element $ helper"
  );

  assert.equal(
    source.includes('$$("[data-film-step]", els.judgeFilmStepper).forEach'),
    true
  );

  assert.equal(
    source.includes('$$(".prop-object.is-new-variable", els.stage).forEach'),
    true
  );
});
