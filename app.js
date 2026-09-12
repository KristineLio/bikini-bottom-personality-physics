(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const CHARACTERS = {
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
      voice: { pitch: .78, rate: .86 }
    },
    squidward: {
      name: "Squidward",
      css: "toon-squidward",
      traits: "IRRITABLE · AVOIDS CHAOS",
      voice: { pitch: .72, rate: .96 }
    },
    mrkrabs: {
      name: "Mr. Krabs",
      css: "toon-mrkrabs",
      traits: "MONEY-OBSESSED",
      voice: { pitch: .8, rate: 1.02 }
    },
    plankton: {
      name: "Plankton",
      css: "toon-plankton",
      traits: "FORMULA-OBSESSED",
      voice: { pitch: 1.5, rate: 1.12 }
    }
  };

  const PROPS = {
    formula: { name: "Secret Formula", icon: "📜" },
    money: { name: "Money", icon: "💵" },
    clarinet: { name: "Clarinet", icon: "🎵" },
    spatula: { name: "Spatula", icon: "🍳" },
    jellyfish: { name: "Jellyfish", icon: "🪼" },
    conch: { name: "Magic Conch", icon: "🐚", css: "magic-conch" }
  };

  const SCENES = {
    krusty: "THE KRUSTY KRAB",
    chum: "CHUM BUCKET LAB",
    fields: "JELLYFISH FIELDS",
    house: "SPONGEBOB’S HOUSE",
    street: "CONCH STREET"
  };

  const PERSONALITY_WEIGHTS = {
    plankton: {
      formula_obsession: 100,
      opportunism: 92
    },
    mrkrabs: {
      money_priority: 100,
      formula_priority: 76
    },
    spongebob: {
      protect: 90,
      follow_authority: 95
    },
    patrick: {
      novelty_drive: 88,
      impulse_control: 20
    }
  };

  const state = {
    scene: "krusty",
    actors: [],
    props: [],
    mode: "home",
    voice: false,
    runToken: 0,
    dragging: null,
    chaos: 8,
    determinismBaseline: null,
    judgeBaselineScenario: null,
    judgeChangedScenario: null
  };

  const els = {
    home: $("#home"),
    play: $("#play"),
    stage: $("#stage"),
    stageActors: $("#stageActors"),
    stageProps: $("#stageProps"),
    sceneToolbar: $("#sceneToolbar"),
    sceneTitle: $("#sceneTitle"),
    directorPanel: $("#directorPanel"),
    conchPanel: $("#conchPanel"),
    resultDock: $("#resultDock"),
    eventTimeline: $("#eventTimeline"),
    causeFlow: $("#causeFlow"),
    resultHeadline: $("#resultHeadline"),
    chaosPct: $("#chaosPct"),
    chaosFill: $("#chaosFill"),
    modeTitle: $("#modeTitle"),
    modeSubtitle: $("#modeSubtitle"),
    voiceBtn: $("#btnVoice"),
    judgeOverlay: $("#judgeOverlay"),
    butterflyFx: $("#butterflyFx"),
    changeBadge: $("#changeBadge"),
    narrator: $("#narrator"),
    stageBanner: $("#stageBanner"),
    chainBadge: $("#chainBadge"),
    sceneFocus: $("#sceneFocus"),
    consequenceFlash: $("#consequenceFlash"),
    filmFinale: $("#filmFinale"),
    physicsLayer: $("#physicsLayer"),
    physicsActor: $("#physicsActor"),
    physicsRule: $("#physicsRule"),
    physicsInput: $("#physicsInput"),
    physicsRuleShort: $("#physicsRuleShort"),
    physicsAction: $("#physicsAction"),
    physicsConsequence: $("#physicsConsequence"),
    judgeProgress: $("#judgeProgress"),
    judgeFilmStepper: $("#judgeFilmStepper"),
    judgeRoundLabel: $("#judgeRoundLabel"),
    judgeProgressText: $("#judgeProgressText"),
    judgeProgressFill: $("#judgeProgressFill"),
    compareOverlay: $("#compareOverlay"),
    roundOneOutcome: $("#roundOneOutcome"),
    roundTwoOutcome: $("#roundTwoOutcome"),
    roundOneEvents: $("#roundOneEvents"),
    roundTwoEvents: $("#roundTwoEvents"),
    determinismStatus: $("#determinismStatus"),
    determinismSetupHash: $("#determinismSetupHash"),
    determinismTraceHash: $("#determinismTraceHash"),
    determinismOutcome: $("#determinismOutcome"),
    determinismMessage: $("#determinismMessage"),
    conchQuestion: $("#conchQuestion"),
    conchAnswer: $("#conchAnswer"),
    castTray: $("#castTray"),
    propTray: $("#propTray")
  };

  function toonMarkup(key, small = false) {
    const c = CHARACTERS[key];
    return '<div class="' + (small ? "toon mini-object-toon " : "toon ") + c.css + '"><span></span></div>';
  }

  function showScreen(which) {
    els.home.classList.toggle("is-active", which === "home");
    els.play.classList.toggle("is-active", which === "play");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function setChaos(value) {
    state.chaos = clamp(Math.round(value), 0, 100);
    els.chaosPct.textContent = state.chaos + "%";
    els.chaosFill.style.width = state.chaos + "%";
  }

  function setScene(scene) {
    state.scene = SCENES[scene] ? scene : "krusty";
    els.stage.className = "stage scene-" + state.scene;
    els.sceneTitle.textContent = SCENES[state.scene];
    $$(".scene-chip").forEach(btn => btn.classList.toggle("is-active", btn.dataset.scene === state.scene));
  }

  function clearStage() {
    state.actors = [];
    state.props = [];
    renderStage();
    hideResult();
    hideNarrator();
    hideBanner();
    hideChainBadge();
    hidePhysics();
    clearVisualFocus();
    resetJudgeFilmVisuals();
    setChaos(8);
  }

  function actorByKey(key) {
    return state.actors.find(a => a.key === key);
  }

  function propByKey(key) {
    return state.props.find(p => p.key === key);
  }

  function addActor(key, x = 50, y = 65) {
    if (!CHARACTERS[key]) return null;
    const existing = actorByKey(key);
    if (existing) {
      existing.x = x;
      existing.y = y;
      renderStage();
      return existing;
    }
    const obj = { id: "actor-" + key, key, x, y, carry: null };
    state.actors.push(obj);
    renderStage();
    return obj;
  }

  function addProp(key, x = 50, y = 56) {
    if (!PROPS[key]) return null;
    const existing = propByKey(key);
    if (existing) {
      existing.x = x;
      existing.y = y;
      renderStage();
      return existing;
    }
    const obj = { id: "prop-" + key, key, x, y, taken: false };
    state.props.push(obj);
    renderStage();
    return obj;
  }

  function removeObject(type, key) {
    if (type === "actor") state.actors = state.actors.filter(a => a.key !== key);
    else state.props = state.props.filter(p => p.key !== key);
    renderStage();
  }

  function renderStage() {
    els.stageActors.innerHTML = state.actors.map(a => {
      const c = CHARACTERS[a.key];
      return '<div class="actor" data-type="actor" data-key="' + a.key + '" style="left:' + a.x + '%;top:' + a.y + '%;z-index:' + (6 + Math.round(a.y / 15)) + '" title="Drag to move · double-click to remove">' +
        toonMarkup(a.key) +
        '<div class="actor-carry' + (a.carry ? " is-on" : "") + '" aria-hidden="true">' + (a.carry ? (PROPS[a.carry]?.icon || "") : "") + '</div>' +
        '<div class="actor-name">' + c.name.toUpperCase() + '</div>' +
        '<div class="actor-bubble"><small>' + c.traits + '</small><span></span></div>' +
      '</div>';
    }).join("");

    els.stageProps.innerHTML = state.props.map(p => {
      const prop = PROPS[p.key];
      return '<div class="prop-object ' + (prop.css || "") + (p.taken ? " is-taken" : "") + '" data-type="prop" data-key="' + p.key + '" style="left:' + p.x + '%;top:' + p.y + '%;z-index:' + (5 + Math.round(p.y / 15)) + '" title="Drag to move · double-click to remove">' +
        '<span>' + prop.icon + '</span><small>' + prop.name.toUpperCase() + '</small></div>';
    }).join("");

    $$(".actor,.prop-object", els.stage).forEach(bindDrag);
  }

  function bindDrag(el) {
    el.addEventListener("pointerdown", event => {
      if (state.mode === "judge" || state.mode === "example") return;
      event.preventDefault();
      const rect = els.stage.getBoundingClientRect();
      state.dragging = {
        el,
        type: el.dataset.type,
        key: el.dataset.key,
        rect
      };
      el.setPointerCapture?.(event.pointerId);
    });

    el.addEventListener("pointermove", event => {
      if (!state.dragging || state.dragging.el !== el) return;
      const { rect, type, key } = state.dragging;
      const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 5, 95);
      const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 92);
      const obj = type === "actor" ? actorByKey(key) : propByKey(key);
      if (!obj) return;
      obj.x = Math.round(x * 10) / 10;
      obj.y = Math.round(y * 10) / 10;
      el.style.left = obj.x + "%";
      el.style.top = obj.y + "%";
      el.style.zIndex = String((type === "actor" ? 6 : 5) + Math.round(obj.y / 15));
    });

    const end = () => { state.dragging = null; };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);

    el.addEventListener("dblclick", () => {
      if (state.mode === "director" || state.mode === "chaos" || state.mode === "conch") {
        removeObject(el.dataset.type, el.dataset.key);
      }
    });
  }

  function distance(a, b) {
    if (!a || !b) return Infinity;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function proximityWeight(a, b, maxDistance = 70) {
    if (!a || !b) return 0;
    return clamp(1 - (distance(a, b) / maxDistance), 0, 1);
  }

  function pointToSegmentDistance(point, start, end) {
    if (!point || !start || !end) return Infinity;
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const wx = point.x - start.x;
    const wy = point.y - start.y;
    const len2 = vx * vx + vy * vy;
    if (len2 === 0) return distance(point, start);
    const t = clamp((wx * vx + wy * vy) / len2, 0, 1);
    const px = start.x + t * vx;
    const py = start.y + t * vy;
    return Math.hypot(point.x - px, point.y - py);
  }

  function hashString(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function setupSignature(extra = "") {
    const actors = [...state.actors].sort((a,b) => a.key.localeCompare(b.key))
      .map(a => a.key + ":" + Math.round(a.x) + "," + Math.round(a.y)).join("|");
    const props = [...state.props].sort((a,b) => a.key.localeCompare(b.key))
      .map(p => p.key + ":" + Math.round(p.x) + "," + Math.round(p.y)).join("|");
    return [state.scene, actors, props, extra].join("::");
  }

  function clearVisualFocus() {
    if (!els.stage) return;
    els.stage.classList.remove("has-active-character", "is-payoff");
    els.stage.removeAttribute("data-visual-phase");
    $$(".actor", els.stage).forEach(el => el.classList.remove("is-active-character", "focus", "is-payoff-escape"));
    $$(".prop-object", els.stage).forEach(el => el.classList.remove("is-active-target"));
    if (els.sceneFocus) {
      els.sceneFocus.style.removeProperty("--focus-x");
      els.sceneFocus.style.removeProperty("--focus-y");
    }
  }

  function focusVisualEvent(actorKey, targetKey, phase = "stimulus") {
    clearVisualFocus();
    const actor = actorByKey(actorKey);
    const target = targetKey ? propByKey(targetKey) : null;
    const actorEl = actorElement(actorKey);
    const targetEl = targetKey ? propElement(targetKey) : null;

    if (actorEl) actorEl.classList.add("is-active-character", "focus");
    if (targetEl) targetEl.classList.add("is-active-target");

    if (actorEl) els.stage.classList.add("has-active-character");
    els.stage.dataset.visualPhase = phase;

    const focusX = target ? ((actor?.x || 50) + target.x) / 2 : (actor?.x || 50);
    const focusY = target ? ((actor?.y || 55) + target.y) / 2 : (actor?.y || 55);
    if (els.sceneFocus) {
      els.sceneFocus.style.setProperty("--focus-x", focusX + "%");
      els.sceneFocus.style.setProperty("--focus-y", focusY + "%");
    }
  }

  function flashConsequence(kind = "normal") {
    if (!els.consequenceFlash) return;
    els.consequenceFlash.dataset.kind = kind;
    els.consequenceFlash.classList.remove("is-on");
    void els.consequenceFlash.offsetWidth;
    els.consequenceFlash.classList.add("is-on");
    setTimeout(() => els.consequenceFlash?.classList.remove("is-on"), 520);
  }

  function actorElement(key) {
    return $('.actor[data-key="' + key + '"]', els.stage);
  }

  function propElement(key) {
    return $('.prop-object[data-key="' + key + '"]', els.stage);
  }

  function react(key, text, trait) {
    const el = actorElement(key);
    if (!el) return;
    const bubble = $(".actor-bubble", el);
    if (trait) $("small", bubble).textContent = trait;
    $("span", bubble).textContent = text;
    bubble.classList.add("is-on");
    el.classList.add("react", "focus");
    speak(text, key);
    setTimeout(() => {
      bubble.classList.remove("is-on");
      el.classList.remove("react", "focus");
    }, 1350);
  }

  function moveObject(type, key, x, y, duration = 650) {
    const obj = type === "actor" ? actorByKey(key) : propByKey(key);
    const el = type === "actor" ? actorElement(key) : propElement(key);
    if (!obj || !el) return Promise.resolve();

    const dx = x - obj.x;
    if (type === "actor") {
      el.classList.toggle("is-facing-left", dx < -1);
      el.classList.toggle("is-facing-right", dx >= -1);
      el.classList.add("is-walking");
    }

    obj.x = x;
    obj.y = y;
    el.style.zIndex = String((type === "actor" ? 6 : 5) + Math.round(y / 15));
    el.style.transition = "left " + duration + "ms cubic-bezier(.2,.8,.2,1), top " + duration + "ms cubic-bezier(.2,.8,.2,1)";
    requestAnimationFrame(() => {
      el.style.left = x + "%";
      el.style.top = y + "%";
    });

    return new Promise(resolve => {
      setTimeout(() => {
        el.style.transition = "";
        el.classList.remove("is-walking");
        resolve();
      }, duration + 40);
    });
  }

  async function walkActorTo(key, x, y, duration = 650) {
    const el = actorElement(key);
    if (!el) return;
    el.classList.add("anticipate");
    await sleep(120);
    el.classList.remove("anticipate");
    await moveObject("actor", key, x, y, duration);
  }

  async function dramaticEscapeWithProp(actorKey, options = {}) {
    const actor = actorByKey(actorKey);
    const el = actorElement(actorKey);
    if (!actor || !el) return;

    els.stage.classList.add("is-payoff");
    el.classList.add("is-payoff-escape", "is-active-character");
    flashConsequence("payoff");
    await sleep(options.escapeAnticipation ?? 120);

    const escapeX = actor.x > 50 ? 91 : 9;
    const escapeY = clamp(actor.y - 8, 28, 78);
    await walkActorTo(actorKey, escapeX, escapeY, options.escapeDuration ?? 760);

    react(actorKey, actorKey === "plankton" ? "Mine!" : "Got it!", "PAYOFF");
    await sleep(options.escapeHold ?? 280);
    flashConsequence("payoff");

    el.classList.remove("is-payoff-escape");
    setTimeout(() => els.stage?.classList.remove("is-payoff"), 500);
  }

  function setCarry(actorKey, propKey) {
    const actor = actorByKey(actorKey);
    if (!actor) return;
    actor.carry = propKey || null;
    const el = actorElement(actorKey);
    if (!el) return;
    const carry = $(".actor-carry", el);
    if (carry) {
      carry.textContent = propKey ? (PROPS[propKey]?.icon || "") : "";
      carry.classList.toggle("is-on", !!propKey);
    }
  }

  function clearCarries() {
    state.actors.forEach(actor => actor.carry = null);
    $$(".actor-carry", els.stage).forEach(el => {
      el.textContent = "";
      el.classList.remove("is-on");
    });
  }

  function markPropTaken(key, taken = true, carrierKey = null) {
    const prop = propByKey(key);
    if (!prop) return;
    prop.taken = taken;
    const el = propElement(key);
    if (el) el.classList.toggle("is-taken", taken);
    if (carrierKey) setCarry(carrierKey, taken ? key : null);
  }

  function physicsForEvent(event) {
    const actor = event.actor;
    const target = event.target || "";
    const text = (event.text || "").toLowerCase();

    if (actor === "plankton" && target === "formula") {
      return {
        actor: "PLANKTON",
        rule: "formula_obsession = HIGH",
        input: "📜 Formula visible",
        ruleShort: "Prioritize formula",
        action: event.takes ? "Take formula" : "Move toward formula",
        consequence: event.takes ? "Formula ownership changes" : "Defense is triggered"
      };
    }

    if (actor === "mrkrabs" && target === "money") {
      return {
        actor: "MR. KRABS",
        rule: "money_priority > formula_priority",
        input: "💵 Money appears",
        ruleShort: "Money outranks defense",
        action: event.grabs ? "Grab money" : "Move toward money",
        consequence: "Formula loses a defender"
      };
    }

    if (actor === "mrkrabs" && target === "formula") {
      return {
        actor: "MR. KRABS",
        rule: "business_protection = HIGH",
        input: "📜 Formula threatened",
        ruleShort: "Protect business asset",
        action: "Guard formula",
        consequence: "Plankton is blocked"
      };
    }

    if (actor === "spongebob" && target === "formula") {
      return {
        actor: "SPONGEBOB",
        rule: "protect + follow_authority",
        input: "📜 Formula threatened",
        ruleShort: "Loyalty activates",
        action: "Protect formula",
        consequence: "Formula stays defended"
      };
    }

    if (actor === "spongebob" && target === "money") {
      return {
        actor: "SPONGEBOB",
        rule: "helpfulness + follow_authority",
        input: "🦀 Mr. Krabs reacts",
        ruleShort: "Follow authority signal",
        action: "Follow the commotion",
        consequence: "Formula defense weakens"
      };
    }

    if (actor === "patrick" && target === "money") {
      return {
        actor: "PATRICK",
        rule: "novelty_drive = HIGH; impulse_control = LOW",
        input: "💵 Money appears",
        ruleShort: "Strongest novelty wins",
        action: "Approach money",
        consequence: "Room attention shifts"
      };
    }

    if (actor === "squidward" && target === "clarinet") {
      return {
        actor: "SQUIDWARD",
        rule: "clarinet_protection = HIGH",
        input: "🎵 Clarinet threatened",
        ruleShort: "Protect clarinet",
        action: "Move to clarinet",
        consequence: "Squidward ignores other chaos"
      };
    }

    if (actor === "spongebob" && target === "spatula") {
      return {
        actor: "SPONGEBOB",
        rule: "work_instinct = HIGH",
        input: "🍳 Spatula available",
        ruleShort: "Work cue activates",
        action: "Return to work",
        consequence: "Chaos decreases"
      };
    }

    if (target === "jellyfish") {
      return {
        actor: (CHARACTERS[actor]?.name || actor).toUpperCase(),
        rule: "curiosity > current_task",
        input: "🪼 Jellyfish nearby",
        ruleShort: "Curiosity wins",
        action: "Approach jellyfish",
        consequence: "Episode focus changes"
      };
    }

    return {
      actor: (CHARACTERS[actor]?.name || "CHARACTER").toUpperCase(),
      rule: (event.trait || "personality_rule").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + " = ACTIVE",
      input: target ? ((PROPS[target]?.icon || "🎬") + " " + (PROPS[target]?.name || "Stimulus")) : "🎬 Current scene state",
      ruleShort: event.trait || "Personality reacts",
      action: event.text || "React",
      consequence: text.includes("nothing") ? "No state change" : "World state updates"
    };
  }

  function showPhysics(event) {
    if (!els.physicsLayer || !event) return;
    const p = physicsForEvent(event);
    els.physicsActor.textContent = p.actor;
    els.physicsRule.textContent = p.rule;
    els.physicsInput.textContent = p.input;
    els.physicsRuleShort.textContent = p.ruleShort;
    els.physicsAction.textContent = p.action;
    els.physicsConsequence.textContent = p.consequence;
    els.physicsLayer.classList.remove("physics-pulse");
    void els.physicsLayer.offsetWidth;
    els.physicsLayer.classList.add("is-on", "physics-pulse");
  }

  function hidePhysics() {
    if (!els.physicsLayer) return;
    els.physicsLayer.classList.remove("is-on", "physics-pulse");
  }

  function showNarrator(who, why) {
    els.narrator.innerHTML = '<b>' + who + '</b> <span>' + why + '</span>';
    els.narrator.classList.add("is-on");
  }

  function hideNarrator() {
    els.narrator.classList.remove("is-on");
  }

  async function performVisualEvent(token, event, options = {}) {
    if (token !== state.runToken) return false;

    const target = event.target && propByKey(event.target);
    const actor = actorByKey(event.actor);
    const showRule = options.showRule !== false;

    // 1) Stimulus.
    focusVisualEvent(event.actor, event.target || null, "stimulus");
    await sleep(options.stimulusPause ?? 150);
    if (token !== state.runToken) return false;

    // 2) Winning rule. Judge film can flash this briefly instead of
    // leaving a technical panel over the animation.
    els.stage.dataset.visualPhase = "rule";
    if (showRule) {
      showPhysics(event);
      await sleep(options.rulePause ?? 190);
      if (token !== state.runToken) return false;
      if (options.briefRule) hidePhysics();
    } else {
      hidePhysics();
    }

    // 3) Movement.
    els.stage.dataset.visualPhase = "movement";
    if (target && actor) {
      const side = actor.x <= target.x ? -8 : 8;
      await walkActorTo(
        event.actor,
        clamp(target.x + side, options.minX ?? 7, options.maxX ?? 93),
        clamp(target.y + 10, options.minY ?? 18, options.maxY ?? 90),
        options.moveDuration ?? 540
      );
    }
    if (token !== state.runToken) return false;

    // 4) Reaction.
    els.stage.dataset.visualPhase = "reaction";
    react(event.actor, event.text, event.trait);
    showNarrator(
      CHARACTERS[event.actor]?.name || "Narrator",
      event.why || ("because " + (event.trait || "personality").toLowerCase() + ".")
    );

    if (options.progress != null && els.judgeProgressFill) {
      els.judgeProgressFill.style.width = options.progress + "%";
    }
    if (options.chaosMode === "set") {
      setChaos(event.chaos);
    } else if (options.chaosMode === "add") {
      setChaos(state.chaos + (event.chaos || 5));
    }

    await sleep(options.reactionHold ?? 760);
    if (token !== state.runToken) return false;

    // 5) Consequence.
    els.stage.dataset.visualPhase = "consequence";
    if (event.grabs) {
      markPropTaken(event.grabs, true, event.actor);
      flashConsequence("grab");
    }

    if (event.takes) {
      markPropTaken(event.takes, true, event.actor);
      await dramaticEscapeWithProp(event.actor, options);
    } else {
      flashConsequence("normal");
      await sleep(options.consequencePause ?? 180);
    }

    if (token !== state.runToken) return false;
    hidePhysics();
    hideNarrator();
    clearVisualFocus();
    return true;
  }

  const JUDGE_FILM_STEPS = ["setup", "round1", "variable", "round2", "proof"];

  function setJudgeFilmStep(step) {
    const activeIndex = JUDGE_FILM_STEPS.indexOf(step);
    if (!els.judgeFilmStepper || activeIndex < 0) return;
    $("[data-film-step]", els.judgeFilmStepper).forEach(node => {
      const index = JUDGE_FILM_STEPS.indexOf(node.dataset.filmStep);
      node.classList.toggle("is-active", index === activeIndex);
      node.classList.toggle("is-done", index < activeIndex);
    });
  }

  function setVariableFreeze(on) {
    els.stage.classList.toggle("is-variable-freeze", on);
    const money = propElement("money");
    if (money) money.classList.toggle("is-new-variable", on);
  }

  function showFilmFinale(on = true) {
    if (!els.filmFinale) return;
    els.filmFinale.classList.toggle("is-on", on);
    els.filmFinale.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function resetJudgeFilmVisuals() {
    if (!els.stage) return;
    els.stage.classList.remove("is-variable-freeze");
    $(".prop-object.is-new-variable", els.stage).forEach(el => el.classList.remove("is-new-variable"));
    showFilmFinale(false);
  }

  async function judgeFilmEvent(token, event, progress, options = {}) {
    return performVisualEvent(token, event, {
      chaosMode:"set",
      progress,
      minX:8,
      maxX:92,
      minY:20,
      maxY:90,
      stimulusPause:70,
      moveDuration:360,
      reactionHold:390,
      consequencePause:90,
      briefRule:true,
      rulePause:420,
      ...options
    });
  }

  function showChainBadge(step, total, label) {
    if (!els.chainBadge) return;
    els.chainBadge.innerHTML = '<span>CHAIN ' + step + '/' + total + '</span><b>' + label + '</b>';
    els.chainBadge.classList.remove("chain-pulse");
    void els.chainBadge.offsetWidth;
    els.chainBadge.classList.add("is-on", "chain-pulse");
  }

  function hideChainBadge() {
    if (!els.chainBadge) return;
    els.chainBadge.classList.remove("is-on", "chain-pulse");
  }

  function showBanner(text) {
    els.stageBanner.textContent = text;
    els.stageBanner.classList.add("is-on");
  }

  function hideBanner() {
    els.stageBanner.classList.remove("is-on");
  }

  function overlay(text, on = true) {
    els.judgeOverlay.innerHTML = text.replace(/\n/g, "<br>");
    els.judgeOverlay.classList.toggle("is-on", on);
  }

  function voiceAvailable() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function speak(text, characterKey) {
    if (!state.voice || !voiceAvailable()) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = CHARACTERS[characterKey]?.voice || { pitch: 1, rate: 1 };
      utterance.pitch = voice.pitch;
      utterance.rate = voice.rate;
      utterance.volume = .82;
      window.speechSynthesis.speak(utterance);
      const timeout = setTimeout(() => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      }, 2800);
      utterance.onend = () => clearTimeout(timeout);
      utterance.onerror = () => clearTimeout(timeout);
    } catch (_) {
      // Voice is optional. Visual bubbles always remain the source of truth.
    }
  }

  function renderTrays() {
    els.castTray.innerHTML = Object.entries(CHARACTERS).map(([key, c]) =>
      '<button class="object-card" data-add-actor="' + key + '">' +
        toonMarkup(key, true) +
        '<b>' + c.name.toUpperCase() + '</b><small>' + c.traits + '</small>' +
      '</button>'
    ).join("");

    els.propTray.innerHTML = Object.entries(PROPS).map(([key, p]) =>
      '<button class="object-card" data-add-prop="' + key + '">' +
        '<div class="prop-icon">' + p.icon + '</div><b>' + p.name.toUpperCase() + '</b>' +
      '</button>'
    ).join("");

    $$("[data-add-actor]", els.castTray).forEach((btn, i) => btn.addEventListener("click", () => {
      addActor(btn.dataset.addActor, 18 + (i * 16) % 70, 68 + (i % 2) * 13);
    }));

    $$("[data-add-prop]", els.propTray).forEach((btn, i) => btn.addEventListener("click", () => {
      addProp(btn.dataset.addProp, 25 + (i * 13) % 60, 49 + (i % 3) * 12);
    }));
  }

  function setModeChrome(mode) {
    state.mode = mode;
    const director = mode === "director" || mode === "chaos";
    const conch = mode === "conch";
    const judge = mode === "judge";
    const example = mode === "example";

    els.directorPanel.hidden = !director;
    els.conchPanel.hidden = !conch;
    els.sceneToolbar.hidden = judge || example;
    els.judgeProgress.hidden = !judge;
    els.compareOverlay.hidden = true;

    if (judge) {
      els.modeTitle.textContent = "20-SECOND JUDGE DEMO";
      els.modeSubtitle.textContent = "Watch one variable change the episode.";
    } else if (director) {
      els.modeTitle.textContent = mode === "chaos" ? "CHAOS SETUP" : "DIRECTOR MODE";
      els.modeSubtitle.textContent = "Place the cast. Personalities decide.";
    } else if (conch) {
      els.modeTitle.textContent = "MAGIC CONCH EXPERIMENT";
      els.modeSubtitle.textContent = "Same setup + same question = same answer.";
    } else if (example) {
      els.modeTitle.textContent = "PLANKTON’S VERY BAD DAY";
      els.modeSubtitle.textContent = "A deterministic example episode.";
    }
  }

  function openDirector(chaos = false) {
    state.runToken++;
    showScreen("play");
    setModeChrome(chaos ? "chaos" : "director");
    clearStage();
    setScene("krusty");

    if (chaos) {
      addActor("spongebob", 73, 60);
      addActor("patrick", 18, 76);
      addActor("squidward", 58, 77);
      addActor("mrkrabs", 84, 73);
      addActor("plankton", 25, 56);
      addProp("formula", 49, 54);
      addProp("money", 82, 56);
      addProp("clarinet", 58, 64);
      addProp("spatula", 70, 48);
      setChaos(28);
      showBanner("CHAOS SETUP LOADED — PRESS ACTION");
      setTimeout(hideBanner, 1800);
    } else {
      addActor("spongebob", 70, 61);
      addActor("plankton", 28, 60);
      addProp("formula", 50, 54);
    }
  }

  function loadChainReactionSetup() {
    state.runToken++;
    showScreen("play");
    setModeChrome("director");
    clearStage();
    setScene("krusty");

    // This button only places objects. The outcome is still resolved from
    // personality priorities + geometry when ACTION is pressed.
    addActor("plankton", 22, 58);
    addActor("patrick", 46, 68);
    addActor("squidward", 58, 78);
    addActor("mrkrabs", 84, 61);

    addProp("formula", 31, 50);
    addProp("money", 72, 49);
    addProp("clarinet", 58, 61);

    setChaos(22);
    showBanner("MOTIVATION COLLISION LOADED — PRESS ACTION");
    setTimeout(hideBanner, 1800);
  }

  function openConch() {
    state.runToken++;
    showScreen("play");
    setModeChrome("conch");
    clearStage();
    setScene("house");
    addActor("spongebob", 66, 65);
    addActor("patrick", 27, 73);
    addActor("squidward", 84, 73);
    addProp("conch", 50, 54);
    els.conchAnswer.textContent = "The Magic Conch is listening…";
    setChaos(10);
  }

  function directorSimulation() {
    const has = key => !!actorByKey(key);
    const prop = key => !!propByKey(key);
    const events = [];
    let outcome = "THE EPISODE STAYS CALM";
    let chaos = 12;
    let cause = [];

    const plankton = actorByKey("plankton");
    const sponge = actorByKey("spongebob");
    const mrkrabs = actorByKey("mrkrabs");
    const patrick = actorByKey("patrick");
    const squidward = actorByKey("squidward");

    const formula = propByKey("formula");
    const money = propByKey("money");
    const clarinet = propByKey("clarinet");
    const jellyfish = propByKey("jellyfish");

    // Competing motivations are scored from personality weight + proximity.
    // The special Director Mode setup is only placement: this resolver never
    // checks which preset loaded it.
    const krabsMoneyScore = mrkrabs && money
      ? PERSONALITY_WEIGHTS.mrkrabs.money_priority * (.72 + .28 * proximityWeight(mrkrabs, money))
      : 0;
    const krabsFormulaScore = mrkrabs && formula
      ? PERSONALITY_WEIGHTS.mrkrabs.formula_priority * (.72 + .28 * proximityWeight(mrkrabs, formula))
      : 0;
    const krabsChoice = krabsMoneyScore > krabsFormulaScore
      ? "money"
      : (krabsFormulaScore > 0 ? "formula" : null);

    const spongeProtectScore = sponge && formula
      ? PERSONALITY_WEIGHTS.spongebob.protect * (.72 + .28 * proximityWeight(sponge, formula))
      : 0;
    const spongeFollowScore = sponge && mrkrabs && krabsChoice === "money"
      ? PERSONALITY_WEIGHTS.spongebob.follow_authority * (.72 + .28 * proximityWeight(sponge, mrkrabs))
      : 0;
    const spongeChoice = spongeFollowScore > spongeProtectScore
      ? "money"
      : (spongeProtectScore > 0 ? "formula" : null);

    const patrickMoneyScore = patrick && money
      ? PERSONALITY_WEIGHTS.patrick.novelty_drive * (.68 + .32 * proximityWeight(patrick, money))
      : 0;
    const patrickChoosesMoney = patrickMoneyScore > PERSONALITY_WEIGHTS.patrick.impulse_control;

    const planktonTargetsFormula = !!(plankton && formula);
    const patrickPathHitsClarinet = !!(
      patrickChoosesMoney &&
      patrick && money && clarinet &&
      pointToSegmentDistance(clarinet, patrick, money) < 11
    );
    const squidwardProtectsClarinet = !!(
      squidward && clarinet &&
      distance(squidward, clarinet) < 30 &&
      (patrickPathHitsClarinet || distance(patrick, clarinet) < 24)
    );

    const activeDefenders =
      (krabsChoice === "formula" ? 1 : 0) +
      (spongeChoice === "formula" ? 1 : 0);

    if (planktonTargetsFormula) {
      events.push({
        actor:"plankton",
        text:"Formula detected.",
        trait:"FORMULA-OBSESSED",
        why:"formula_obsession = HIGH: a visible formula becomes Plankton’s target.",
        target:"formula",
        chaos:18,
        chainLabel:"Plankton locks onto the formula"
      });
      chaos += 12;
    }

    if (patrickChoosesMoney) {
      events.push({
        actor:"patrick",
        text:"Ooooh… money.",
        trait:"IMPULSIVE",
        why:"novelty_drive (" + Math.round(patrickMoneyScore) + ") beats impulse_control (" + PERSONALITY_WEIGHTS.patrick.impulse_control + ").",
        target:"money",
        chaos:12,
        chainLabel:"Money pulls Patrick across the room"
      });
      chaos += 10;
    }

    if (squidwardProtectsClarinet) {
      events.push({
        actor:"squidward",
        text:"Watch the clarinet!",
        trait:"PROTECTS HIS CLARINET",
        why:"Patrick’s route passes through Squidward’s clarinet safety radius.",
        target:"clarinet",
        chaos:10,
        chainLabel:"Patrick’s path triggers Squidward"
      });
      chaos += 10;
    } else if (squidward && clarinet && distance(squidward, clarinet) < 22) {
      events.push({
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

    if (krabsChoice === "money") {
      events.push({
        actor:"mrkrabs",
        text:"MONEY?!",
        trait:"MONEY > EVERYTHING",
        why:"money_priority (" + Math.round(krabsMoneyScore) + ") beats formula_priority (" + Math.round(krabsFormulaScore) + ").",
        target:"money",
        chaos:17,
        grabs:"money",
        chainLabel:"Krabs abandons defense for money"
      });
      chaos += 16;
    } else if (krabsChoice === "formula") {
      events.push({
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

    if (spongeChoice === "money") {
      events.push({
        actor:"spongebob",
        text:"Mr. Krabs?",
        trait:"HELPFUL · DISTRACTIBLE",
        why:"follow_authority (" + Math.round(spongeFollowScore) + ") beats protect (" + Math.round(spongeProtectScore) + ").",
        target:"money",
        chaos:8,
        chainLabel:"SpongeBob follows Krabs"
      });
      chaos += 8;
    } else if (spongeChoice === "formula") {
      events.push({
        actor:"spongebob",
        text:"Protect the formula!",
        trait:"LOYAL · PROTECTIVE",
        why:"protect (" + Math.round(spongeProtectScore) + ") remains SpongeBob’s strongest active rule.",
        target:"formula",
        chaos:12,
        chainLabel:"SpongeBob protects the formula"
      });
      chaos += 10;
    }

    const formulaStolen = planktonTargetsFormula && activeDefenders === 0;
    if (formulaStolen) {
      events.push({
        actor:"plankton",
        text: squidwardProtectsClarinet ? "Everyone looked away." : "Perfect distraction.",
        trait:"SCHEMING",
        why:"No active formula defender remains, so Plankton’s opportunism rule fires.",
        target:"formula",
        chaos:24,
        takes:"formula",
        chainLabel:"Plankton exploits the opening"
      });
      chaos += 24;
      outcome = squidwardProtectsClarinet && patrickChoosesMoney && krabsChoice === "money"
        ? "CHAIN REACTION: PLANKTON STEALS THE FORMULA"
        : "PLANKTON STEALS THE FORMULA";
    } else if (planktonTargetsFormula) {
      outcome = "THE FORMULA IS SAFE";
    }

    if (state.scene === "fields" && jellyfish) {
      if (patrick) {
        events.push({
          actor:"patrick", text:"Jellyfish!", trait:"CURIOUS",
          why:"curiosity beats Patrick’s current task.",
          target:"jellyfish", chaos:10,
          chainLabel:"Jellyfish hijacks Patrick’s attention"
        });
      }
      if (sponge) {
        events.push({
          actor:"spongebob", text:"Let’s go jellyfishing!", trait:"ENTHUSIASTIC",
          why:"The jellyfish becomes the strongest scene-specific stimulus.",
          target:"jellyfish", chaos:7,
          chainLabel:"SpongeBob joins the distraction"
        });
      }
      if (outcome === "THE EPISODE STAYS CALM") outcome = "JELLYFISHING TAKES OVER THE EPISODE";
      chaos += 15;
    }

    if (prop("spatula") && has("spongebob") && state.scene === "krusty") {
      events.push({
        actor:"spongebob", text:"Order up!", trait:"LOVES HIS JOB",
        why:"work_instinct activates on the spatula cue.",
        target:"spatula", chaos:-4,
        chainLabel:"Work instinct pulls SpongeBob back"
      });
      chaos = Math.max(5, chaos - 4);
      if (outcome === "THE EPISODE STAYS CALM") outcome = "SPONGEBOB SAVES THE LUNCH RUSH";
    }

    const isChainReaction = !!(
      formulaStolen &&
      patrickChoosesMoney &&
      squidwardProtectsClarinet &&
      krabsChoice === "money"
    );

    if (isChainReaction) {
      cause = [
        "💵 Money stimulus",
        "→",
        "⭐ Patrick crosses the room",
        "→",
        "🎵 Squidward protects clarinet",
        "→",
        "🦀 Krabs chooses money",
        "→",
        "📜 Plankton exploits the opening"
      ];
    } else if (formulaStolen) {
      cause = [
        "📜 Formula visible",
        "→",
        krabsChoice === "money" ? "💵 Krabs chooses money" : "🚫 No defender nearby",
        "→",
        "🦠 Plankton sees opening",
        "→",
        "📜 Formula stolen"
      ];
    } else if (planktonTargetsFormula) {
      cause = [
        "📜 Formula visible",
        "→",
        activeDefenders > 0 ? "🛡️ Personality rules keep a defender active" : "🦠 Plankton targets it",
        "→",
        "✅ Formula safe"
      ];
    }

    if (!events.length) {
      const first = state.actors[0];
      if (first) {
        events.push({
          actor:first.key,
          text:"Nothing to react to… yet.",
          trait:CHARACTERS[first.key].traits,
          why:"No stimulus crosses this character’s active threshold.",
          chaos:2,
          chainLabel:"No strong stimulus"
        });
      }
      cause = ["🎬 Setup", "→", "😌 No strong trigger", "→", "🌊 Low chaos"];
    }

    return {
      outcome,
      events,
      cause,
      chaos:clamp(chaos, 4, 100),
      isChainReaction,
      scores:{
        krabsMoneyScore:Math.round(krabsMoneyScore),
        krabsFormulaScore:Math.round(krabsFormulaScore),
        spongeProtectScore:Math.round(spongeProtectScore),
        spongeFollowScore:Math.round(spongeFollowScore),
        patrickMoneyScore:Math.round(patrickMoneyScore),
        activeDefenders
      }
    };
  }

  async function runDirectorSimulation() {
    const token = ++state.runToken;
    hideResult();
    hideBanner();
    hideChainBadge();
    state.props.forEach(p => p.taken = false);
    state.actors.forEach(a => a.carry = null);
    renderStage();

    const result = directorSimulation();
    setChaos(result.isChainReaction ? 22 : 12);
    showBanner(result.isChainReaction
      ? "⚡ MOTIVATION COLLISION — WATCH THE RIPPLE"
      : "ACTION — PERSONALITY RULES ARE LIVE"
    );
    await sleep(650);
    if (token !== state.runToken) return;
    hideBanner();

    for (let i = 0; i < result.events.length; i++) {
      const event = result.events[i];
      if (token !== state.runToken) return;

      if (result.isChainReaction) {
        showChainBadge(i + 1, result.events.length, event.chainLabel || "World state changed");
      }

      const ok = await performVisualEvent(token, event, {
        chaosMode:"add",
        reactionHold:result.isChainReaction ? 820 : 720,
        moveDuration:560
      });
      if (!ok) return;
    }

    if (token !== state.runToken) return;
    hideNarrator();
    hidePhysics();
    hideChainBadge();

    if (result.isChainReaction) {
      showBanner("OH. ONE ROOM → FOUR MOTIVES → ONE CHAIN REACTION");
      await sleep(950);
      if (token !== state.runToken) return;
      hideBanner();
    }

    showResult(result);
  }

  function showResult(result) {
    els.resultHeadline.textContent = result.outcome;
    els.eventTimeline.innerHTML = result.events.map((e, i) =>
      '<li><b>' + (i + 1) + '.</b> ' + (CHARACTERS[e.actor]?.name || "Scene") + ': “' + e.text + '”</li>'
    ).join("");

    const cause = result.cause.length ? result.cause : ["🎬 Setup", "→", "🧠 Personality rules", "→", "🎞️ Outcome"];
    els.causeFlow.innerHTML = cause.map((item, i) => {
      if (item === "→") return '<div class="cause-arrow">→</div>';
      const cls = i === 0 ? " trigger" : (i === cause.length - 1 ? (result.outcome.includes("STOLEN") ? " bad" : " good") : "");
      return '<div class="cause-node' + cls + '">' + item + '</div>';
    }).join("");
    els.resultDock.hidden = false;
    setChaos(result.chaos);
    els.resultDock.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideResult() {
    els.resultDock.hidden = true;
  }

  function setupJudgeRound(includeMoney) {
    clearStage();
    setScene("krusty");
    addActor("plankton", 26, 61);
    addActor("spongebob", 70, 62);
    addActor("patrick", 17, 80);
    addActor("mrkrabs", 84, 78);
    addProp("formula", 49, 54);
    if (includeMoney) addProp("money", 81, 58);
  }

  function resolveJudgeScenario() {
    const hasFormula = !!propByKey("formula");
    const hasMoney = !!propByKey("money");
    const has = key => !!actorByKey(key);
    const events = [];

    const krabsMoneyScore = has("mrkrabs") && hasMoney ? PERSONALITY_WEIGHTS.mrkrabs.money_priority : 0;
    const krabsFormulaScore = has("mrkrabs") && hasFormula ? PERSONALITY_WEIGHTS.mrkrabs.formula_priority : 0;
    const krabsChoice = krabsMoneyScore > krabsFormulaScore ? "money" : (krabsFormulaScore > 0 ? "formula" : null);

    const spongeProtectScore = has("spongebob") && hasFormula ? PERSONALITY_WEIGHTS.spongebob.protect : 0;
    const spongeFollowScore = has("spongebob") && krabsChoice === "money" ? PERSONALITY_WEIGHTS.spongebob.follow_authority : 0;
    const spongeChoice = spongeFollowScore > spongeProtectScore ? "money" : (spongeProtectScore > 0 ? "formula" : null);

    const patrickNoveltyScore = has("patrick") && hasMoney ? PERSONALITY_WEIGHTS.patrick.novelty_drive : 0;
    const defenders = (krabsChoice === "formula" ? 1 : 0) + (spongeChoice === "formula" ? 1 : 0);

    if (hasMoney) {
      if (patrickNoveltyScore > PERSONALITY_WEIGHTS.patrick.impulse_control) {
        events.push({
          actor:"patrick", text:"Ooooh… money.", trait:"IMPULSIVE",
          why:"Money creates a novelty score higher than Patrick’s impulse control.",
          target:"money", chaos:48
        });
      }

      if (krabsChoice === "money") {
        events.push({
          actor:"mrkrabs", text:"MONEY?!", trait:"MONEY > EVERYTHING",
          why:"money_priority (" + krabsMoneyScore + ") beats formula_priority (" + krabsFormulaScore + ").",
          target:"money", chaos:61, grabs:"money"
        });
      }

      if (spongeChoice === "money") {
        events.push({
          actor:"spongebob", text:"Mr. Krabs?", trait:"HELPFUL · DISTRACTIBLE",
          why:"follow_authority (" + spongeFollowScore + ") beats protect (" + spongeProtectScore + ").",
          target:"money", chaos:70
        });
      }

      if (has("plankton") && hasFormula) {
        const canSteal = defenders === 0;
        events.push({
          actor:"plankton",
          text: canSteal ? "Perfect distraction." : "Formula detected.",
          trait: canSteal ? "SCHEMING" : "FORMULA-OBSESSED",
          why: canSteal
            ? "No active defenders remain, so opportunism activates."
            : "formula_obsession stays high, but defenders are still present.",
          target:"formula",
          chaos: canSteal ? 88 : 62,
          ...(canSteal ? { takes:"formula" } : {})
        });
      }
    } else {
      if (has("plankton") && hasFormula) {
        events.push({
          actor:"plankton", text:"Formula detected.", trait:"FORMULA-OBSESSED",
          why:"formula_obsession (" + PERSONALITY_WEIGHTS.plankton.formula_obsession + ") targets the visible formula.",
          target:"formula", chaos:25
        });
      }

      if (spongeChoice === "formula") {
        events.push({
          actor:"spongebob", text:"Protect the formula!", trait:"LOYAL · PROTECTIVE",
          why:"protect (" + spongeProtectScore + ") is SpongeBob’s strongest active rule.",
          target:"formula", chaos:34
        });
      }

      if (krabsChoice === "formula") {
        events.push({
          actor:"mrkrabs", text:"Nobody touches me formula!", trait:"PROTECTIVE",
          why:"Without money present, formula_priority (" + krabsFormulaScore + ") stays active.",
          target:"formula", chaos:38
        });
      }

      if (has("patrick")) {
        events.push({
          actor:"patrick", text:"I’ll just watch.", trait:"CURIOUS",
          why:"No stimulus exceeds Patrick’s impulse threshold.",
          chaos:36
        });
      }
    }

    const formulaStolen = has("plankton") && hasFormula && defenders === 0;
    const outcome = formulaStolen ? "❌ FORMULA STOLEN" : "✅ FORMULA SAFE";

    return {
      includeMoney: hasMoney,
      label: hasMoney ? "SAME SETUP + 💵 MONEY" : "ORIGINAL SETUP",
      outcome,
      events,
      decisionState: {
        krabsMoneyScore,
        krabsFormulaScore,
        krabsChoice,
        spongeProtectScore,
        spongeFollowScore,
        spongeChoice,
        patrickNoveltyScore,
        defenders
      }
    };
  }

  function fingerprint(value) {
    return "#" + hashString(value).toString(16).padStart(8, "0").toUpperCase();
  }

  function traceSignature(scenario) {
    return scenario.events.map((event, index) => [
      index,
      event.actor,
      event.target || "-",
      event.text,
      event.trait,
      event.grabs || "-",
      event.takes || "-"
    ].join(":")).join("|") + "|OUTCOME:" + scenario.outcome;
  }

  function captureJudgeFingerprint(scenario) {
    return {
      setupHash: fingerprint(setupSignature()),
      traceHash: fingerprint(traceSignature(scenario)),
      outcome: scenario.outcome
    };
  }

  function setDeterminismPanel(mode, data) {
    if (!els.determinismStatus) return;

    els.determinismSetupHash.textContent = data.setupHash;
    els.determinismTraceHash.textContent = data.traceHash;
    els.determinismOutcome.textContent = data.outcome;
    els.determinismStatus.className = "determinism-status " + mode;

    if (mode === "match") {
      els.determinismStatus.textContent = "✓ MATCH VERIFIED";
      els.determinismMessage.innerHTML = "<strong>Same setup fingerprint. Same ordered action trace. Same outcome.</strong> No random branch was introduced.";
    } else if (mode === "changed") {
      els.determinismStatus.textContent = "🦋 TRACE CHANGED";
      els.determinismMessage.innerHTML = "<strong>One input changed: + 💵 MONEY.</strong> The setup fingerprint changed, the decision trace changed, and the episode branched.";
    } else {
      els.determinismStatus.textContent = "BASELINE CAPTURED";
      els.determinismMessage.textContent = "Run the exact same input again. If the ordered action trace matches, the same world state produced the same episode.";
    }
  }

  function fillJudgeComparison() {
    const baseline = state.judgeBaselineScenario;
    const changed = state.judgeChangedScenario;
    els.roundOneOutcome.textContent = baseline?.outcome || "✅ FORMULA SAFE";
    els.roundTwoOutcome.textContent = changed?.outcome || "❌ FORMULA STOLEN";
    els.roundOneEvents.innerHTML = [
      "Plankton targets formula",
      "SpongeBob protects it",
      "Mr. Krabs guards the restaurant",
      "Patrick has no stronger trigger"
    ].map(x => "<li>" + x + "</li>").join("");
    els.roundTwoEvents.innerHTML = [
      "Patrick notices money",
      "Mr. Krabs abandons the formula for money",
      "SpongeBob follows the commotion",
      "Plankton uses the distraction"
    ].map(x => "<li>" + x + "</li>").join("");
  }

  async function judgeEvent(token, event, progress, options = {}) {
    return performVisualEvent(token, event, {
      chaosMode:"set",
      progress,
      minX:8,
      maxX:92,
      minY:20,
      maxY:90,
      moveDuration:550,
      reactionHold:780,
      ...options
    });
  }

  async function playVerificationScenario(scenarioKey) {
    const token = ++state.runToken;

    showScreen("play");
    setModeChrome("judge");
    els.compareOverlay.hidden = true;
    els.judgeProgress.hidden = false;
    els.judgeProgressFill.style.width = "0%";

    setupJudgeRound(scenarioKey === "changed");
    const scenario = resolveJudgeScenario();
    const runFingerprint = captureJudgeFingerprint(scenario);
    setChaos(8);

    els.judgeRoundLabel.textContent = scenarioKey === "baseline" ? "DETERMINISM TEST" : "VARIABLE TEST";
    els.judgeProgressText.textContent = scenarioKey === "baseline" ? "Exact same inputs" : "Only + 💵 MONEY changed";

    if (scenarioKey === "baseline") {
      overlay("↻ SAME SETUP\nRUNNING AGAIN");
    } else {
      overlay("🦋 CHANGE ONE VARIABLE\n+ 💵 MONEY");
    }

    await sleep(850);
    if (token !== state.runToken) return;
    overlay("", false);

    for (let i = 0; i < scenario.events.length; i++) {
      const progress = 12 + Math.round(((i + 1) / scenario.events.length) * 78);
      const ok = await judgeEvent(token, scenario.events[i], progress);
      if (!ok) return;
    }

    hideNarrator();
    hidePhysics();
    els.judgeProgressFill.style.width = "100%";

    if (scenarioKey === "baseline") {
      const baseline = state.determinismBaseline;
      const exactMatch = baseline &&
        baseline.setupHash === runFingerprint.setupHash &&
        baseline.traceHash === runFingerprint.traceHash &&
        baseline.outcome === runFingerprint.outcome;

      showBanner(exactMatch ? "✓ VERIFIED: SAME SETUP → SAME TRACE → SAME OUTCOME" : "⚠ TRACE MISMATCH");
      await sleep(1250);
      if (token !== state.runToken) return;
      hideBanner();
      setDeterminismPanel(exactMatch ? "match" : "baseline", runFingerprint);
    } else {
      const baseline = state.determinismBaseline;
      const changedAsExpected = baseline &&
        baseline.setupHash !== runFingerprint.setupHash &&
        baseline.traceHash !== runFingerprint.traceHash;

      showBanner(changedAsExpected ? "🦋 ONE VARIABLE CHANGED → NEW TRACE" : "VARIABLE TEST COMPLETE");
      await sleep(1250);
      if (token !== state.runToken) return;
      hideBanner();
      setDeterminismPanel("changed", runFingerprint);
    }

    fillJudgeComparison();
    els.compareOverlay.hidden = false;
  }

  async function openJudge() {
    const token = ++state.runToken;
    const filmStartedAt = Date.now();

    showScreen("play");
    setModeChrome("judge");
    setScene("krusty");
    els.judgeProgress.hidden = false;
    els.judgeProgressFill.style.width = "0%";
    els.compareOverlay.hidden = true;
    resetJudgeFilmVisuals();

    // 0–2s · SETUP
    setupJudgeRound(false);
    const round1 = resolveJudgeScenario();
    state.judgeBaselineScenario = round1;
    state.determinismBaseline = captureJudgeFingerprint(round1);

    setChaos(8);
    setJudgeFilmStep("setup");
    els.judgeRoundLabel.textContent = "SETUP";
    els.judgeProgressText.textContent = "Same setup = same outcome";
    els.judgeProgressFill.style.width = "5%";
    overlay("SAME SETUP\n= SAME OUTCOME");
    await sleep(1650);
    if (token !== state.runToken) return;
    overlay("", false);

    // 2–7s · ROUND 1
    setJudgeFilmStep("round1");
    els.judgeRoundLabel.textContent = "ROUND 1";
    els.judgeProgressText.textContent = "Original setup";
    // Patrick remains in the setup, but his neutral “I’ll just watch”
    // event is intentionally not cut into the film. The proof trace still
    // records it; the cinematic cut only shows causal actions.
    const round1VisibleEvents = round1.events.filter(event => !(event.actor === "patrick" && !event.target));
    const round1Film = [
      { showRule:true,  progress:17 },
      { showRule:true,  progress:29 },
      { showRule:false, progress:42 }
    ];

    for (let i = 0; i < round1VisibleEvents.length; i++) {
      const ok = await judgeFilmEvent(
        token,
        round1VisibleEvents[i],
        round1Film[i]?.progress ?? (17 + i * 12),
        round1Film[i] || {}
      );
      if (!ok) return;
    }

    showBanner("ROUND 1 · " + round1.outcome);
    els.judgeProgressFill.style.width = "46%";
    await sleep(620);
    if (token !== state.runToken) return;
    hideBanner();

    // 7–9s · Freeze the experiment and reveal exactly one new input.
    setJudgeFilmStep("variable");
    els.judgeRoundLabel.textContent = "+1 VARIABLE";
    els.judgeProgressText.textContent = "Everything else stays the same";
    els.judgeProgressFill.style.width = "50%";

    setupJudgeRound(true);
    const round2 = resolveJudgeScenario();
    state.judgeChangedScenario = round2;

    setVariableFreeze(true);
    els.butterflyFx.classList.add("is-on");
    els.changeBadge.innerHTML = "🦋 CHANGE ONE THING<br><span style=\"font-size:34px\">💵</span><br>+ MONEY";
    els.changeBadge.classList.add("is-on");
    overlay("ONE NEW VARIABLE");
    await sleep(1700);
    if (token !== state.runToken) return;

    overlay("", false);
    els.changeBadge.classList.remove("is-on");
    els.butterflyFx.classList.remove("is-on");
    setVariableFreeze(false);

    // 9–15/17s · ROUND 2
    setJudgeFilmStep("round2");
    els.judgeRoundLabel.textContent = "ROUND 2";
    els.judgeProgressText.textContent = "Same world + 💵 MONEY";
    els.judgeProgressFill.style.width = "54%";
    showBanner("SAME WORLD · + 💵 MONEY");
    await sleep(480);
    if (token !== state.runToken) return;
    hideBanner();

    const round2Film = [
      { showRule:false, progress:64, reactionHold:400 },
      { showRule:true,  progress:74, reactionHold:430 },
      { showRule:false, progress:83, reactionHold:400 },
      {
        showRule:true,
        progress:94,
        reactionHold:410,
        moveDuration:350,
        escapeAnticipation:110,
        escapeDuration:950,
        escapeHold:300
      }
    ];

    for (let i = 0; i < round2.events.length; i++) {
      if (i === round2.events.length - 1) {
        showBanner("NO DEFENDERS LEFT");
        await sleep(540);
        if (token !== state.runToken) return;
        hideBanner();
      }

      const ok = await judgeFilmEvent(token, round2.events[i], round2Film[i]?.progress ?? (64 + i * 10), round2Film[i] || {});
      if (!ok) return;
    }

    showBanner("ROUND 2 · " + round2.outcome);
    els.judgeProgressFill.style.width = "97%";
    await sleep(620);
    if (token !== state.runToken) return;
    hideBanner();

    // 17–20s · FINAL FRAME
    setJudgeFilmStep("proof");
    els.judgeRoundLabel.textContent = "PROOF";
    els.judgeProgressText.textContent = "Same personalities. One new variable.";
    els.judgeProgressFill.style.width = "100%";
    showFilmFinale(true);

    // Keep the total experience close to 20 seconds even if the browser
    // renders individual animation frames slightly faster or slower.
    const elapsed = Date.now() - filmStartedAt;
    const finaleHold = clamp(19800 - elapsed, 2400, 4200);
    await sleep(finaleHold);
    if (token !== state.runToken) return;

    showFilmFinale(false);
    fillJudgeComparison();
    setDeterminismPanel("baseline", state.determinismBaseline);

    // Land directly on the proof instead of a wall of explanation.
    els.compareOverlay.hidden = false;
    els.compareOverlay.scrollTop = 0;
  }

  async function openExample() {
    const token = ++state.runToken;
    showScreen("play");
    setModeChrome("example");
    clearStage();
    setScene("krusty");
    addActor("plankton", 23, 62);
    addActor("spongebob", 71, 62);
    addActor("mrkrabs", 85, 76);
    addProp("formula", 50, 53);
    addProp("spatula", 69, 48);
    setChaos(18);

    overlay("🎬 PLANKTON’S VERY BAD DAY");
    await sleep(850);
    if (token !== state.runToken) return;
    overlay("", false);

    const events = [
      { actor:"plankton", text:"Today is the day!", trait:"SCHEMING", why:"Plankton cannot resist the formula.", target:"formula", chaos:30 },
      { actor:"spongebob", text:"Not on my shift!", trait:"LOYAL", why:"SpongeBob protects the Krusty Krab.", target:"formula", chaos:44 },
      { actor:"mrkrabs", text:"Get away from me formula!", trait:"PROTECTIVE", why:"Mr. Krabs protects the business.", target:"formula", chaos:56 },
      { actor:"plankton", text:"I hate this restaurant.", trait:"STUBBORN", why:"The same motivations reliably produce the same defeat.", chaos:42 }
    ];

    for (const e of events) {
      if (token !== state.runToken) return;
      await judgeEvent(token, e, 0);
    }
    hideNarrator();
    hidePhysics();
    showBanner("OUTCOME: PLANKTON FAILS. AGAIN.");
    await sleep(1100);
    if (token === state.runToken) hideBanner();
  }

  function askConch() {
    if (state.mode !== "conch") return;
    const question = (els.conchQuestion.value || "Should we do it?").trim();
    const answers = [
      "No.",
      "Yes.",
      "Maybe someday.",
      "Ask again when the chaos is lower.",
      "The shell says: absolutely not.",
      "The shell approves.",
      "Nothing."
    ];
    const index = hashString(setupSignature(question.toLowerCase())) % answers.length;
    const answer = answers[index];
    els.conchAnswer.textContent = "🐚 “" + answer + "”";
    const conch = propElement("conch");
    if (conch) {
      conch.classList.remove("magic-conch");
      void conch.offsetWidth;
      conch.classList.add("magic-conch");
    }
    speak(answer, "squidward");
    showNarrator("MAGIC CONCH", "same setup + same question = same answer.");
    setChaos(12 + index * 4);
    setTimeout(hideNarrator, 1600);
  }

  function toggleVoice() {
    state.voice = !state.voice;
    if (!voiceAvailable()) state.voice = false;
    els.voiceBtn.innerHTML = (state.voice ? "🔊 <span>VOICE ON</span>" : "🔇 <span>MUTED</span>");
    if (state.voice) speak("Voices on.", "spongebob");
  }

  function goHome() {
    state.runToken++;
    if (voiceAvailable()) window.speechSynthesis.cancel();
    els.compareOverlay.hidden = true;
    els.judgeOverlay.classList.remove("is-on");
    els.butterflyFx.classList.remove("is-on");
    els.changeBadge.classList.remove("is-on");
    hideNarrator();
    hideBanner();
    hideChainBadge();
    hidePhysics();
    resetJudgeFilmVisuals();
    showScreen("home");
    state.mode = "home";
  }

  function bindStageParallax() {
    if (!els.stage || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    els.stage.addEventListener("pointermove", event => {
      if (event.pointerType === "touch") return;
      const rect = els.stage.getBoundingClientRect();
      const nx = clamp((event.clientX - rect.left) / rect.width, 0, 1) - .5;
      const ny = clamp((event.clientY - rect.top) / rect.height, 0, 1) - .5;
      els.stage.style.setProperty("--parallax-x", (nx * 14).toFixed(1) + "px");
      els.stage.style.setProperty("--parallax-y", (ny * 10).toFixed(1) + "px");
    });

    els.stage.addEventListener("pointerleave", () => {
      els.stage.style.setProperty("--parallax-x", "0px");
      els.stage.style.setProperty("--parallax-y", "0px");
    });
  }

  function bindUI() {
    $("#btnJudge").addEventListener("click", openJudge);
    $("#btnDirector").addEventListener("click", () => openDirector(false));
    $("#btnChaos").addEventListener("click", () => openDirector(true));
    $("#btnConch").addEventListener("click", openConch);
    $("#btnExample").addEventListener("click", openExample);
    $("#btnHome").addEventListener("click", goHome);
    $("#btnVoice").addEventListener("click", toggleVoice);
    $("#btnAction").addEventListener("click", runDirectorSimulation);
    $("#btnLoadChainReaction").addEventListener("click", loadChainReactionSetup);
    $("#btnReset").addEventListener("click", () => openDirector(state.mode === "chaos"));
    $("#btnCloseResult").addEventListener("click", hideResult);
    $("#btnAskConch").addEventListener("click", askConch);
    els.conchQuestion.addEventListener("keydown", event => {
      if (event.key === "Enter") askConch();
    });

    $("#btnRunSameSetup").addEventListener("click", () => playVerificationScenario("baseline"));
    $("#btnChangeOneVariable").addEventListener("click", () => playVerificationScenario("changed"));
    $("#btnReplayJudge").addEventListener("click", openJudge);
    $("#btnOpenDirectorFromCompare").addEventListener("click", () => openDirector(false));
    $("#btnCompareHome").addEventListener("click", goHome);

    $$(".scene-chip").forEach(btn => btn.addEventListener("click", () => setScene(btn.dataset.scene)));
  }

  renderTrays();
  bindUI();
  bindStageParallax();
  setChaos(8);
  setScene("krusty");
})();
