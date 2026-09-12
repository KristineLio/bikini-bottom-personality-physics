# Personality Physics — Architecture

The project is deliberately split between a **pure deterministic simulation core** and the browser presentation layer.

## Data flow

```text
World State
   ↓
Stimulus Detection
   ↓
Personality Scores
   ↓
Decision Resolver
   ↓
Ordered Actions
   ↓
Resulting World State
   ↓
UI + Animation
```

The core contract is:

```js
resolve(worldState) -> {
  actions,
  outcome,
  scores,
  decisions,
  resultingState
}
```

`resolve()` has no DOM dependency, no timers, and no randomness. That makes the central claim testable: the same canonical world state must produce the same ordered trace.

## Modules

### `personalities.js`
Character metadata, explicit personality weights, and human-readable rule descriptions.

Examples:

```js
mrkrabs.money_priority = 100
mrkrabs.formula_priority = 76
spongebob.protect = 90
spongebob.follow_authority = 95
```

### `world.js`
Pure world-state primitives:

- actor/prop lookup
- Euclidean distance
- proximity weighting
- point-to-segment distance
- canonical state signatures
- deterministic hashing
- application of semantic actions to a cloned world

### `engine.js`
The UI-independent resolver.

It converts world geometry + active stimuli + personality weights into an **ordered action trace** and a resulting state.

Example chain:

```text
+ money
→ Patrick's novelty score crosses threshold
→ Patrick's path crosses clarinet safety radius
→ Squidward protects clarinet
→ Krabs' money score beats formula score
→ active formula defenders fall to zero
→ Plankton's opportunism rule fires
```

### `scenarios.js`
Factories for reproducible initial states such as the Judge Demo and Motivation Collision setup. Scenarios only define inputs; they do not define outcomes.

### `ui.js`
Small DOM utilities. It contains no simulation rules.

### `animations.js`
Time and element-transition helpers. Animation consumes engine actions but does not decide them.

### `app.js`
Browser orchestration: input handling, rendering, Judge Demo direction, Director Mode, and mapping engine actions to presentation.

## Determinism proof

Two fingerprints are shown in the product:

1. **Setup fingerprint** — hash of the canonical world state.
2. **Trace fingerprint** — hash of the ordered action trace + outcome.

The verification rule is simple:

```text
same setup hash + same trace hash + same outcome = deterministic replay
```

Changing one variable (for example, adding money) should change the setup hash and can change the action trace and outcome.

## Automated tests

Run:

```bash
npm test
```

The test suite verifies:

- same state → same trace
- no money → Krabs defends formula
- money present → money priority wins
- Patrick's path near clarinet → Squidward reacts
- moving clarinet away → Squidward does not react
- identical states → identical state + trace hashes
- changing one input → changed state + trace hashes

No external test framework or runtime dependency is required; tests use Node's built-in `node:test`.


## Engine boundary vs. character skin

The repository has two deliberate identities:

- **Personality Physics** — the reusable simulation concept and engine.
- **Bikini Bottom: Personality Physics** — the original hackathon demonstration skin.

The engine never asks whether it is running "the SpongeBob version." It receives a world state containing actor keys, props, coordinates, and rule weights. A future original-character skin can therefore reuse the same:

- `resolve(worldState)` contract
- world geometry
- canonical state hashing
- deterministic replay proof
- tests
- presentation pipeline

Only character metadata, artwork, copy, and scenario factories need to change.

That separation matters for portfolio use: the technical project is a deterministic multi-agent character simulation, not a hard-coded fan game.

## Presentation boundary

The runtime is intentionally one-way:

```text
engine actions
   ↓
app orchestration
   ↓
animation + UI
```

Animation can change how long a decision is visible, but it cannot change which decision the engine selected.

This is why the 20-second Judge Demo can be aggressively edited for pacing while still sharing the same resolver with Director Mode.

## Deployment

The browser application is static and uses ES modules, so production deployment requires no server runtime.

The repository includes a GitHub Pages workflow that:

1. checks out `main`,
2. runs the deterministic engine test suite,
3. uploads the static repository as a Pages artifact,
4. deploys only after tests pass.

This makes the live portfolio build downstream of the same proof suite used to defend the simulation claims.
