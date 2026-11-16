export const SEGMENT_LENGTH = 64;
export const REGION_LENGTH = 760;
export const TRANSITION_LENGTH = 180;
export const MAX_SPEED = 22;
export const START_CLEARANCE = 100;
export const REGIONS = [
  { name: '清晨松林', sky: '#cedfe5', fog: '#d6e3e7', snow: '#e8eff0', light: '#fff0d5', ambient: '#bdd9e7', trees: 1, flakes: 1 },
  { name: '开阔雪坡', sky: '#bcd9e3', fog: '#d7e7eb', snow: '#f3f1e5', light: '#fff0cd', ambient: '#ccdee6', trees: .20, flakes: .15 },
  { name: '冰蓝山谷', sky: '#b7d0e0', fog: '#c6dfe8', snow: '#e0edf0', light: '#d4eaff', ambient: '#a9cde8', trees: .34, flakes: .5 },
  { name: '暮色山间小镇', sky: '#e4cbd0', fog: '#e5d6d4', snow: '#f3e9df', light: '#ffcf96', ambient: '#c7c7da', trees: .48, flakes: .4 },
];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function getRegionStart(regionIndex) {
  if (!Number.isInteger(regionIndex) || regionIndex < 0 || regionIndex >= REGIONS.length) return 0;
  // Starting inside the region keeps the previous landscape behind the welcome camera.
  return regionIndex === 0 ? 0 : regionIndex * REGION_LENGTH + 96;
}
export function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
export function random(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function biomeAt(distance) {
  const d = Math.max(0, distance), chapter = Math.floor(d / REGION_LENGTH), progress = d % REGION_LENGTH;
  const from = chapter % 4, to = (from + 1) % 4;
  const blend = smoothstep(REGION_LENGTH - TRANSITION_LENGTH, REGION_LENGTH, progress);
  const weights = [0, 0, 0, 0]; weights[from] = 1 - blend; weights[to] = blend;
  return { from, to, blend, weights, chapter, progress: progress / REGION_LENGTH, current: blend > .5 ? to : from };
}
export function routeAt(d, seed = 1) { return Math.sin(d * .007 + seed % 10) * 12 + Math.sin(d * .017 + seed % 7) * 3.5; }
export function elevationAt(d) { return -d * .09 + Math.sin(d * .019) * 1.2 + Math.sin(d * .042) * .35; }
export function groundAt(x, d, seed = 1) {
  const lateral = Math.abs(x - routeAt(d, seed));
  const bank = smoothstep(12, 48, lateral) * (3.4 + Math.sin(d * .021) * 1.2);
  return elevationAt(d) + bank + Math.sin(x * .13 + d * .025) * .14;
}
export function obstacleRows(start, seed, runStart = 0) {
  const rng = random(Math.imul(Math.floor(start / SEGMENT_LENGTH) + 37, 7919) ^ seed);
  const rows = [];
  for (let offset = 16; offset < SEGMENT_LENGTH; offset += 30) {
    const d = start + offset;
    if (d < runStart + START_CLEARANCE) continue;
    const x = (rng() - .5) * 17;
    const type = rng() < .38 ? 'tree' : rng() < .57 ? 'rock' : 'stump';
    rows.push({ d, x: routeAt(d, seed) + x, type, radius: type === 'tree' ? 1.1 : type === 'rock' ? 1.05 : .7, height: type === 'tree' ? 7 : type === 'rock' ? .85 : .7 });
  }
  return rows;
}
export function intersectsObstacle(player, obstacle) {
  const radius = obstacle.radius + .38;
  return Math.abs(player.distance - obstacle.d) < radius + .48 && Math.abs(player.x - obstacle.x) < radius && player.jump < obstacle.height;
}
