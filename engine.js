import { PERSONALITY_WEIGHTS } from "./personalities.js";
import {
  actorByKey,
  propByKey,
  distance,
  proximityWeight,
  pointToSegmentDistance,
  clamp,
  canonicalWorldSignature,
  fingerprint,
  applyActions
} from "./world.js";

function scoreChoice(world) {
  const plankton = actorByKey(world, "plankton");
  const sponge = actorByKey(world, "spongebob");
  const mrkrabs = actorByKey(world, "mrkrabs");
  const patrick = actorByKey(world, "patrick");
  const squidward = actorByKey(world, "squidward");

  const formula = propByKey(world, "formula");
  const money = propByKey(world, "money");
  const clarinet = propByKey(world, "clarinet");

  const krabsMoneyScore = mrkrabs && money
    ? PERSONALITY_WEIGHTS.mrkrabs.money_priority *
      (0.72 + 0.28 * proximityWeight(mrkrabs, money))
    : 0;

  const krabsFormulaScore = mrkrabs && formula
    ? PERSONALITY_WEIGHTS.mrkrabs.formula_priority *
      (0.72 + 0.28 * proximityWeight(mrkrabs, formula))
    : 0;

  const krabsChoice = krabsMoneyScore > krabsFormulaScore
    ? "money"
    : (krabsFormulaScore > 0 ? "formula" : null);

  const spongeProtectScore = sponge && formula
    ? PERSONALITY_WEIGHTS.spongebob.protect *
      (0.72 + 0.28 * proximityWeight(sponge, formula))
    : 0;

  const spongeFollowScore = sponge && mrkrabs && krabsChoice === "money"
    ? PERSONALITY_WEIGHTS.spongebob.follow_authority *
      (0.72 + 0.28 * proximityWeight(sponge, mrkrabs))
    : 0;

  const spongeChoice = spongeFollowScore > spongeProtectScore
    ? "money"
    : (spongeProtectScore > 0 ? "formula" : null);

  const patrickMoneyScore = patrick && money
    ? PERSONALITY_WEIGHTS.patrick.novelty_drive *
      (0.68 + 0.32 * proximityWeight(patrick, money))
    : 0;

  const patrickChoosesMoney =
    patrickMoneyScore > PERSONALITY_WEIGHTS.patrick.impulse_control;

  const patrickPathHitsClarinet = Boolean(
    patrickChoosesMoney &&
    patrick &&
    money &&
    clarinet &&
    pointToSegmentDistance(clarinet, patrick, money) < 11
  );

  const squidwardProtectsClarinet = Boolean(
    squidward &&
    clarinet &&
    distance(squidward, clarinet) < 30 &&
    (patrickPathHitsClarinet || distance(patrick, clarinet) < 24)
  );

  const activeDefenders =
    (krabsChoice === "formula" ? 1 : 0) +
    (spongeChoice === "formula" ? 1 : 0);

  return {
    plankton,
    sponge,
    mrkrabs,
    patrick,
    squidward,
    formula,
    money,
    clarinet,
    krabsMoneyScore,
    krabsFormulaScore,
    krabsChoice,
    spongeProtectScore,
    spongeFollowScore,
    spongeChoice,
    patrickMoneyScore,
    patrickChoosesMoney,
    patrickPathHitsClarinet,
    squidwardProtectsClarinet,
    activeDefenders
  };
}

export function resolve(world, options = {}) {
  const {
    includeNeutralObservers = false,
    includeSceneRules = true
  } = options;

  const s = scoreChoice(world);
  const actions = [];
  const cause = [];
  let chaos = 12;
  let outcome = "THE EPISODE STAYS CALM";

  const planktonTargetsFormula = Boolean(s.plankton && s.formula);

  if (s.money) {
    if (s.patrickChoosesMoney) {
      actions.push({
        actor:"patrick",
        text:"Ooooh… money.",
        trait:"IMPULSIVE",
        why:"novelty_drive (" + Math.round(s.patrickMoneyScore) +
          ") beats impulse_control (" + PERSONALITY_WEIGHTS.patrick.impulse_control + ").",
        target:"money",
        chaos:12,
        chainLabel:"Money pulls Patrick across the room"
      });
      chaos += 10;
    }

    if (s.squidwardProtectsClarinet) {
      actions.push({
        actor:"squidward",
        text:"Watch the clarinet!",
        trait:"PROTECTS HIS CLARINET",
        why:"Patrick’s route passes through Squidward’s clarinet safety radius.",
        target:"clarinet",
        chaos:10,
        chainLabel:"Patrick’s path triggers Squidward"
      });
      chaos += 10;
    } else if (
      s.squidward &&
      s.clarinet &&
      distance(s.squidward, s.clarinet) < 22
    ) {
      actions.push({
        actor:"squidward",
        text:"Nobody touch this.",
        trait:"PROTECTS HIS CLARINET",
        why:"clarinet_protection stays active because the clarinet is inside Squidward’s personal zone.",
        target:"clarinet",
        chaos:5,
        chainLabel:"Squidward guards the clarinet"
      });
      chaos += 5;
    }

    if (s.krabsChoice === "money") {
      actions.push({
        actor:"mrkrabs",
        text:"MONEY?!",
        trait:"MONEY > EVERYTHING",
        why:"money_priority (" + Math.round(s.krabsMoneyScore) +
          ") beats formula_priority (" + Math.round(s.krabsFormulaScore) + ").",
        target:"money",
        chaos:17,
        grabs:"money",
        chainLabel:"Krabs abandons defense for money"
      });
      chaos += 16;
    } else if (s.krabsChoice === "formula") {
      actions.push({
        actor:"mrkrabs",
        text:"Nobody touches me formula!",
        trait:"PROTECTIVE",
        why:"formula_priority wins because no stronger money stimulus is active.",
        target:"formula",
        chaos:10,
        chainLabel:"Krabs stays on formula defense"
      });
      chaos += 8;
    }

    if (s.spongeChoice === "money") {
      actions.push({
        actor:"spongebob",
        text:"Mr. Krabs?",
        trait:"HELPFUL · DISTRACTIBLE",
        why:"follow_authority (" + Math.round(s.spongeFollowScore) +
          ") beats protect (" + Math.round(s.spongeProtectScore) + ").",
        target:"money",
        chaos:8,
        chainLabel:"SpongeBob follows Krabs"
      });
      chaos += 8;
    } else if (s.spongeChoice === "formula") {
      actions.push({
        actor:"spongebob",
        text:"Protect the formula!",
        trait:"LOYAL · PROTECTIVE",
        why:"protect (" + Math.round(s.spongeProtectScore) +
          ") remains SpongeBob’s strongest active rule.",
        target:"formula",
        chaos:12,
        chainLabel:"SpongeBob protects the formula"
      });
      chaos += 10;
    }

    const formulaStolen = planktonTargetsFormula && s.activeDefenders === 0;

    if (planktonTargetsFormula) {
      actions.push({
        actor:"plankton",
        text: formulaStolen
          ? (s.squidwardProtectsClarinet ? "Everyone looked away." : "Perfect distraction.")
          : "Formula detected.",
        trait: formulaStolen ? "SCHEMING" : "FORMULA-OBSESSED",
        why: formulaStolen
          ? "No active formula defender remains, so Plankton’s opportunism rule fires."
          : "formula_obsession stays high, but defenders are still present.",
        target:"formula",
        chaos: formulaStolen ? 24 : 18,
        ...(formulaStolen ? { takes:"formula" } : {}),
        chainLabel: formulaStolen
          ? "Plankton exploits the opening"
          : "Plankton targets the formula"
      });
      chaos += formulaStolen ? 24 : 12;
    }

    if (formulaStolen) {
      outcome = s.squidwardProtectsClarinet && s.patrickChoosesMoney && s.krabsChoice === "money"
        ? "CHAIN REACTION: PLANKTON STEALS THE FORMULA"
        : "PLANKTON STEALS THE FORMULA";
    } else if (planktonTargetsFormula) {
      outcome = "THE FORMULA IS SAFE";
    }

    if (formulaStolen && s.patrickChoosesMoney && s.squidwardProtectsClarinet && s.krabsChoice === "money") {
      cause.push(
        "💵 Money stimulus","→",
        "⭐ Patrick crosses the room","→",
        "🎵 Squidward protects clarinet","→",
        "🦀 Krabs chooses money","→",
        "📜 Plankton exploits the opening"
      );
    } else if (formulaStolen) {
      cause.push(
        "📜 Formula visible","→",
        s.krabsChoice === "money" ? "💵 Krabs chooses money" : "🚫 No defender nearby","→",
        "🦠 Plankton sees opening","→",
        "📜 Formula stolen"
      );
    } else if (planktonTargetsFormula) {
      cause.push(
        "📜 Formula visible","→",
        s.activeDefenders > 0
          ? "🛡️ Personality rules keep a defender active"
          : "🦠 Plankton targets it","→",
        "✅ Formula safe"
      );
    }
  } else {
    if (planktonTargetsFormula) {
      actions.push({
        actor:"plankton",
        text:"Formula detected.",
        trait:"FORMULA-OBSESSED",
        why:"formula_obsession (" + PERSONALITY_WEIGHTS.plankton.formula_obsession +
          ") targets the visible formula.",
        target:"formula",
        chaos:25,
        chainLabel:"Plankton locks onto the formula"
      });
      chaos += 12;
    }

    if (s.spongeChoice === "formula") {
      actions.push({
        actor:"spongebob",
        text:"Protect the formula!",
        trait:"LOYAL · PROTECTIVE",
        why:"protect (" + Math.round(s.spongeProtectScore) +
          ") is SpongeBob’s strongest active rule.",
        target:"formula",
        chaos:34,
        chainLabel:"SpongeBob protects the formula"
      });
      chaos += 10;
    }

    if (s.krabsChoice === "formula") {
      actions.push({
        actor:"mrkrabs",
        text:"Nobody touches me formula!",
        trait:"PROTECTIVE",
        why:"Without money present, formula_priority (" +
          Math.round(s.krabsFormulaScore) + ") stays active.",
        target:"formula",
        chaos:38,
        chainLabel:"Krabs stays on formula defense"
      });
      chaos += 8;
    }

    if (includeNeutralObservers && s.patrick) {
      actions.push({
        actor:"patrick",
        text:"I’ll just watch.",
        trait:"CURIOUS",
        why:"No stimulus exceeds Patrick’s impulse threshold.",
        chaos:36,
        chainLabel:"Patrick remains an observer"
      });
    }

    if (planktonTargetsFormula) {
      outcome = s.activeDefenders > 0
        ? "THE FORMULA IS SAFE"
        : "PLANKTON STEALS THE FORMULA";

      if (s.activeDefenders === 0) {
        actions.push({
          actor:"plankton",
          text:"Too easy.",
          trait:"SCHEMING",
          why:"No active formula defender remains.",
          target:"formula",
          chaos:25,
          takes:"formula",
          chainLabel:"Plankton takes the unguarded formula"
        });
      }

      cause.push(
        "📜 Formula visible","→",
        s.activeDefenders > 0
          ? "🛡️ Personality rules keep a defender active"
          : "🚫 No active defender","→",
        s.activeDefenders > 0 ? "✅ Formula safe" : "📜 Formula stolen"
      );
    }
  }

  if (includeSceneRules && world.scene === "fields" && propByKey(world, "jellyfish")) {
    if (s.patrick) {
      actions.push({
        actor:"patrick",
        text:"Jellyfish!",
        trait:"CURIOUS",
        why:"curiosity beats Patrick’s current task.",
        target:"jellyfish",
        chaos:10,
        chainLabel:"Jellyfish hijacks Patrick’s attention"
      });
    }
    if (s.sponge) {
      actions.push({
        actor:"spongebob",
        text:"Let’s go jellyfishing!",
        trait:"ENTHUSIASTIC",
        why:"The jellyfish becomes the strongest scene-specific stimulus.",
        target:"jellyfish",
        chaos:7,
        chainLabel:"SpongeBob joins the distraction"
      });
    }
    if (outcome === "THE EPISODE STAYS CALM") {
      outcome = "JELLYFISHING TAKES OVER THE EPISODE";
    }
    chaos += 15;
  }

  if (
    includeSceneRules &&
    world.scene === "krusty" &&
    s.sponge &&
    propByKey(world, "spatula")
  ) {
    actions.push({
      actor:"spongebob",
      text:"Order up!",
      trait:"LOVES HIS JOB",
      why:"work_instinct activates on the spatula cue.",
      target:"spatula",
      chaos:-4,
      chainLabel:"Work instinct pulls SpongeBob back"
    });
    chaos = Math.max(5, chaos - 4);
    if (outcome === "THE EPISODE STAYS CALM") {
      outcome = "SPONGEBOB SAVES THE LUNCH RUSH";
    }
  }

  if (!actions.length && world.actors[0]) {
    actions.push({
      actor:world.actors[0].key,
      text:"Nothing to react to… yet.",
      trait:"NO STRONG TRIGGER",
      why:"No stimulus crosses this character’s active threshold.",
      chaos:2,
      chainLabel:"No strong stimulus"
    });
    cause.push("🎬 Setup","→","😌 No strong trigger","→","🌊 Low chaos");
  }

  const isChainReaction = Boolean(
    planktonTargetsFormula &&
    s.patrickChoosesMoney &&
    s.squidwardProtectsClarinet &&
    s.krabsChoice === "money" &&
    s.activeDefenders === 0
  );

  const resultingState = applyActions(world, actions);

  return {
    outcome,
    actions,
    events: actions,
    cause,
    chaos: clamp(chaos, 4, 100),
    isChainReaction,
    scores: {
      krabsMoneyScore: Math.round(s.krabsMoneyScore),
      krabsFormulaScore: Math.round(s.krabsFormulaScore),
      spongeProtectScore: Math.round(s.spongeProtectScore),
      spongeFollowScore: Math.round(s.spongeFollowScore),
      patrickMoneyScore: Math.round(s.patrickMoneyScore),
      activeDefenders: s.activeDefenders
    },
    decisions: {
      krabsChoice: s.krabsChoice,
      spongeChoice: s.spongeChoice,
      patrickChoosesMoney: s.patrickChoosesMoney,
      patrickPathHitsClarinet: s.patrickPathHitsClarinet,
      squidwardProtectsClarinet: s.squidwardProtectsClarinet
    },
    resultingState
  };
}

export function traceSignature(result) {
  return result.actions.map((action, index) => [
    index,
    action.actor,
    action.target || "-",
    action.text,
    action.trait || "-",
    action.grabs || "-",
    action.takes || "-"
  ].join(":")).join("|") + "|OUTCOME:" + result.outcome;
}

export function captureDeterminismProof(world, result = resolve(world)) {
  return {
    setupHash: fingerprint(canonicalWorldSignature(world)),
    traceHash: fingerprint(traceSignature(result)),
    outcome: result.outcome
  };
}
