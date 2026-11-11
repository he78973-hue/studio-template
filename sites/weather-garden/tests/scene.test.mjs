import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { WeatherScene } from '../src/scene.js';

function harness(run) {
  const previousDocument = globalThis.document, previousRAF = globalThis.requestAnimationFrame;
  let frames = 0, renders = 0;
  globalThis.document = { hidden: false };
  globalThis.requestAnimationFrame = () => { frames++; return 1; };
  const scene = Object.create(WeatherScene.prototype);
  Object.assign(scene, {
    disposed: false, visible: true, reduced: false, last: 100, time: 0,
    yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0, yawVelocity: 0, pitchVelocity: 0,
    root: new THREE.Group(), drops: { visible: false }, snow: { visible: false },
    windGroup: { visible: true }, reading: { wind: 3, direction: 0 },
    up: new THREE.Vector3(0, 1, 0), tangent: new THREE.Vector3(),
    renderer: { render: () => renders++ },
    streams: [{ seed: 0, marker: new THREE.Object3D(), curve: {
      getPoint: u => { assert(u >= 0 && u <= 1, 'Curve parameter must stay within [0,1]'); return new THREE.Vector3(u, 0, 0); },
      getTangent: () => new THREE.Vector3(1, 0, 0),
    } }],
  });
  try { run(scene, () => ({ frames, renders })); }
  finally { globalThis.document = previousDocument; globalThis.requestAnimationFrame = previousRAF; }
}
test('an RAF timestamp older than start() does not produce negative wind progress', () => {
  harness((scene, counts) => { scene.frame(90); assert(scene.time >= 0); assert.equal(counts().renders, 1); });
});
test('reset releases capture and clears the drag before starting the spring', () => {
  harness((scene, counts) => {
    let released = null;
    scene.canvas = { hasPointerCapture: id => id === 7, releasePointerCapture: id => { assert.equal(scene.drag, null); released = id; } };
    scene.drag = { pointerId: 7 }; scene.targetYaw = .8; scene.targetPitch = .2;
    scene.reset();
    assert.equal(released, 7); assert.equal(scene.targetYaw, 0); assert.equal(scene.targetPitch, 0);
    assert.equal(counts().frames, 1);
  });
});
test('offscreen scene stops drawing and scheduling frames', () => {
  harness((scene, counts) => { scene.visible = false; scene.frame(120); assert.deepEqual(counts(), { frames: 0, renders: 0 }); });
});
test('reduced motion snaps to its target and does not idle-loop', () => {
  harness((scene, counts) => { scene.reduced = true; scene.targetYaw = .5; scene.frame(120); assert.equal(scene.yaw, .5); assert.deepEqual(counts(), { frames: 0, renders: 1 }); });
});
