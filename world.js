export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function actorByKey(world, key) {
  return world.actors.find(actor => actor.key === key) || null;
}

export function propByKey(world, key) {
  return world.props.find(prop => prop.key === key) || null;
}

export function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function proximityWeight(a, b, maxDistance = 70) {
  if (!a || !b) return 0;
  return clamp(1 - (distance(a, b) / maxDistance), 0, 1);
}

export function pointToSegmentDistance(point, start, end) {
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

export function cloneWorld(world) {
  return {
    ...world,
    actors: world.actors.map(actor => ({ ...actor })),
    props: world.props.map(prop => ({ ...prop }))
  };
}

export function createWorld({ scene = "krusty", actors = [], props = [] } = {}) {
  return {
    scene,
    actors: actors.map(actor => ({
      id: actor.id || "actor-" + actor.key,
      carry: null,
      ...actor
    })),
    props: props.map(prop => ({
      id: prop.id || "prop-" + prop.key,
      taken: false,
      ...prop
    }))
  };
}

export function canonicalWorldSignature(world, extra = "") {
  const actors = [...world.actors]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(a => [a.key, Math.round(a.x), Math.round(a.y), a.carry || "-"].join(":"))
    .join("|");

  const props = [...world.props]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(p => [p.key, Math.round(p.x), Math.round(p.y), p.taken ? 1 : 0].join(":"))
    .join("|");

  return [world.scene, actors, props, extra].join("::");
}

export function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function fingerprint(input) {
  return "#" + hashString(input).toString(16).padStart(8, "0").toUpperCase();
}

export function applyActions(world, actions) {
  const next = cloneWorld(world);

  for (const action of actions) {
    if (!action.grabs && !action.takes) continue;
    const propKey = action.takes || action.grabs;
    const prop = propByKey(next, propKey);
    const actor = actorByKey(next, action.actor);
    if (prop) prop.taken = true;
    if (actor) actor.carry = propKey;
  }

  return next;
}
