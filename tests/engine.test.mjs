import test from "node:test";
import assert from "node:assert/strict";

import { resolve, traceSignature, captureDeterminismProof } from "../engine.js";
import { createJudgeWorld, createMotivationCollisionWorld } from "../scenarios.js";
import { cloneWorld, propByKey } from "../world.js";

test("same state produces the same ordered trace", () => {
  const world = createJudgeWorld();
  const first = resolve(world, { includeNeutralObservers: true, includeSceneRules: false });
  const second = resolve(world, { includeNeutralObservers: true, includeSceneRules: false });

  assert.equal(traceSignature(first), traceSignature(second));
  assert.deepEqual(first.actions, second.actions);
  assert.equal(first.outcome, second.outcome);
});

test("money absent: Mr. Krabs defends the formula", () => {
  const result = resolve(createJudgeWorld(), {
    includeNeutralObservers: true,
    includeSceneRules: false
  });

  assert.equal(result.decisions.krabsChoice, "formula");
  assert.ok(result.actions.some(action =>
    action.actor === "mrkrabs" && action.target === "formula"
  ));
  assert.match(result.outcome, /SAFE/);
});

test("money present: money priority beats formula priority", () => {
  const result = resolve(createJudgeWorld({ includeMoney: true }), {
    includeNeutralObservers: true,
    includeSceneRules: false
  });

  assert.equal(result.decisions.krabsChoice, "money");
  assert.ok(result.scores.krabsMoneyScore > result.scores.krabsFormulaScore);
  assert.ok(result.actions.some(action =>
    action.actor === "mrkrabs" &&
    action.target === "money" &&
    action.grabs === "money"
  ));
});

test("Patrick crossing the clarinet path triggers Squidward", () => {
  const world = createMotivationCollisionWorld();
  const result = resolve(world, { includeSceneRules: false });

  assert.equal(result.decisions.patrickChoosesMoney, true);
  assert.equal(result.decisions.patrickPathHitsClarinet, true);
  assert.equal(result.decisions.squidwardProtectsClarinet, true);
  assert.ok(result.actions.some(action =>
    action.actor === "squidward" && action.target === "clarinet"
  ));
});

test("moving the clarinet away removes Squidward from the chain", () => {
  const world = cloneWorld(createMotivationCollisionWorld());
  const clarinet = propByKey(world, "clarinet");
  clarinet.x = 8;
  clarinet.y = 18;

  const result = resolve(world, { includeSceneRules: false });

  assert.equal(result.decisions.patrickPathHitsClarinet, false);
  assert.equal(result.decisions.squidwardProtectsClarinet, false);
  assert.ok(!result.actions.some(action => action.actor === "squidward"));
});

test("identical world states produce identical setup and trace hashes", () => {
  const firstWorld = createJudgeWorld({ includeMoney: true });
  const secondWorld = createJudgeWorld({ includeMoney: true });

  const first = resolve(firstWorld, {
    includeNeutralObservers: true,
    includeSceneRules: false
  });
  const second = resolve(secondWorld, {
    includeNeutralObservers: true,
    includeSceneRules: false
  });

  const firstProof = captureDeterminismProof(firstWorld, first);
  const secondProof = captureDeterminismProof(secondWorld, second);

  assert.equal(firstProof.setupHash, secondProof.setupHash);
  assert.equal(firstProof.traceHash, secondProof.traceHash);
  assert.equal(firstProof.outcome, secondProof.outcome);
});

test("changing one variable changes both setup and action trace", () => {
  const baselineWorld = createJudgeWorld();
  const changedWorld = createJudgeWorld({ includeMoney: true });

  const baseline = resolve(baselineWorld, {
    includeNeutralObservers: true,
    includeSceneRules: false
  });
  const changed = resolve(changedWorld, {
    includeNeutralObservers: true,
    includeSceneRules: false
  });

  const baselineProof = captureDeterminismProof(baselineWorld, baseline);
  const changedProof = captureDeterminismProof(changedWorld, changed);

  assert.notEqual(baselineProof.setupHash, changedProof.setupHash);
  assert.notEqual(baselineProof.traceHash, changedProof.traceHash);
  assert.notEqual(baselineProof.outcome, changedProof.outcome);
});
