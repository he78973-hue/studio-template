import { test } from 'node:test';
import assert from 'node:assert/strict';
import { biomeAt, obstacleRows, routeAt, groundAt, intersectsObstacle, getRegionStart, REGION_LENGTH, SEGMENT_LENGTH, MAX_SPEED, START_CLEARANCE } from '../src/course.js';

test('all biome boundaries, including the loop, are spatially continuous', () => {
  for (let region = 1; region <= 12; region++) {
    const boundary = region * REGION_LENGTH, a = biomeAt(boundary - .001), b = biomeAt(boundary + .001);
    for (let i = 0; i < 4; i++) assert.ok(Math.abs(a.weights[i] - b.weights[i]) < .00001);
    assert.equal(b.current, region % 4);
    const approaching = biomeAt(boundary - 90);
    assert.ok(approaching.weights[(region - 1) % 4] > .4);
    assert.ok(approaching.weights[region % 4] > .4);
    assert.equal(approaching.weights.reduce((sum, w) => sum + w, 0), 1);
  }
});

test('regions take 30–45 seconds at intended speed, with a slower introductory region', () => {
  assert.ok(REGION_LENGTH / MAX_SPEED >= 30 && REGION_LENGTH / MAX_SPEED <= 45);
  let time = 0, d = 0, speed = 12;
  while (d < REGION_LENGTH) { speed = Math.min(MAX_SPEED, speed + .42 / 120); d += speed / 120; time += 1 / 120; }
  assert.ok(time >= 30 && time <= 45, `first chapter took ${time}s`);
});

test('streamed obstacle rows are reproducible and leave multiple safe corridors', () => {
  for (const seed of [1, 137, 555, 1926]) for (let index = 0; index < 160; index++) {
    const start = index * SEGMENT_LENGTH, obstacles = obstacleRows(start, seed);
    assert.deepEqual(obstacles, obstacleRows(start, seed));
    for (const o of obstacles) {
      assert.ok(o.d >= start && o.d < start + SEGMENT_LENGTH);
      assert.ok(Math.abs(o.x - routeAt(o.d, seed)) <= 8.5);
      const safe = [-8, -4, 0, 4, 8].filter(lane => Math.abs(routeAt(o.d, seed) + lane - o.x) > o.radius + .75);
      assert.ok(safe.length >= 3, 'obstacle leaves at least three traversable lanes');
    }
  }
});

test('jump clears low obstacles but does not pass through trees', () => {
  const p = { x: 0, distance: 150, jump: 0 };
  const rock = { x: 0, d: 150, radius: 1.05, height: .85 };
  assert.equal(intersectsObstacle(p, rock), true);
  assert.equal(intersectsObstacle({ ...p, jump: 1.1 }, rock), false);
  assert.equal(intersectsObstacle({ ...p, jump: 1.1 }, { ...rock, height: 7 }), true);
  assert.equal(intersectsObstacle({ ...p, x: 3 }, rock), false);
  assert.equal(intersectsObstacle({ ...p, distance: 154 }, rock), false);
});

test('terrain and route do not crack at segment boundaries; restart seeds change the course', () => {
  assert.notEqual(routeAt(300, 555), routeAt(300, 692));
  for (let index = 1; index < 100; index++) {
    const d = index * SEGMENT_LENGTH, x = routeAt(d, 555);
    assert.ok(Math.abs(groundAt(x, d - .001, 555) - groundAt(x, d + .001, 555)) < .001);
    assert.ok(Math.abs(routeAt(d - .001, 555) - routeAt(d + .001, 555)) < .001);
  }
});

test('every selectable destination starts fully inside its own landscape', () => {
  for (let region = 0; region < 4; region++) {
    const start = getRegionStart(region), biome = biomeAt(start);
    assert.equal(biome.current, region);
    assert.equal(biome.weights[region], 1);
    assert.ok(start + START_CLEARANCE < (region + 1) * REGION_LENGTH);
    if (region > 0) assert.equal(biomeAt(start - 35).current, region, 'welcome camera also sits inside the selected region');
  }
  for (const invalid of [-1, 4, .5, NaN, Infinity, '3']) assert.equal(getRegionStart(invalid), 0);
});

test('all destinations get a visible obstacle-free start while later collisions remain possible', () => {
  for (let region = 0; region < 4; region++) for (const seed of [1, 555, 692, 829]) {
    const start = getRegionStart(region), first = Math.floor(start / SEGMENT_LENGTH);
    const obstacles = Array.from({ length: 6 }, (_, i) => obstacleRows((first + i) * SEGMENT_LENGTH, seed, start)).flat();
    assert.ok(obstacles.length > 0, 'obstacles resume after the starting stretch');
    assert.ok(obstacles.every(o => o.d >= start + START_CLEARANCE));
    const obstacle = obstacles[0];
    assert.equal(intersectsObstacle({ x: obstacle.x, distance: obstacle.d, jump: 0 }, obstacle), true);
  }
});
