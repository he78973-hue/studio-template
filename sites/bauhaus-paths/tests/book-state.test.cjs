const test = require('node:test');
const assert = require('node:assert/strict');
const { TurnModel, clamp } = require('../book-state.js');

test('clamp rejects non-finite values and preserves boundaries', () => {
  assert.equal(clamp(-5), 0); assert.equal(clamp(5), 1);
  assert.equal(clamp(NaN), 0); assert.equal(clamp(Infinity), 0);
});
test('a full turn commits exactly once at the endpoint', () => {
  const m = new TurnModel(); m.request(1, 0);
  assert.equal(m.committed, 0); assert.equal(m.moving, true);
  assert(m.tick(330).progress > 0 && m.progress < 1);
  assert.deepEqual(m.tick(660), {progress:1,committed:1,target:1,moving:false,dragging:false});
  assert.equal(m.tick(5000).progress, 1);
});
test('reversing a moving turn does not jump', () => {
  const m = new TurnModel(); m.request(1, 0); const p = m.tick(250).progress;
  m.request(0, 250); assert.equal(m.progress, p);
  assert.equal(m.tick(1000).committed, 0);
});
test('repeated same-target input does not restart the animation', () => {
  const m = new TurnModel(); m.request(1, 0);
  m.request(1, 300); m.request(1, 600);
  assert.equal(m.tick(661).committed, 1); assert.equal(m.moving, false);
});
test('dragging is bounded and snaps using direction/velocity', () => {
  const m = new TurnModel(); m.beginDrag(0); m.dragTo(5); assert.equal(m.progress, 1);
  m.dragTo(-1); assert.equal(m.progress, 0); m.dragTo(.20); m.release(100,.001);
  assert.equal(m.target, 1); m.tick(1000); assert.equal(m.committed, 1);
  m.beginDrag(1100); m.dragTo(.75); m.release(1200,-.001); m.tick(2200);
  assert.equal(m.committed, 0);
});
test('cancel returns to the last committed page', () => {
  const m = new TurnModel(1); m.beginDrag(0); m.dragTo(.2); m.cancel(50); m.tick(1000);
  assert.equal(m.committed, 1);
});
test('reduced motion and hidden-document settle leave no animation', () => {
  const m = new TurnModel(); m.request(1,0,true); assert.equal(m.committed,1); assert.equal(m.moving,false);
  m.request(0,100); m.settle(); assert.equal(m.committed,0); assert.equal(m.animation,null);
});
test('four-spread model moves by one leaf and clamps both ends', () => {
  const m = new TurnModel(0, 3);
  for (let index = 1; index <= 3; index++) {
    m.request(index, index * 1000, true);
    assert.equal(m.committed, index);
  }
  m.request(9, 4000, true); assert.equal(m.committed, 3);
  m.request(-8, 5000, true); assert.equal(m.committed, 0);
});
test('middle-leaf drag snaps to adjacent spread without skipping', () => {
  const m = new TurnModel(1, 3);
  m.beginDrag(0); m.dragTo(1.68); m.release(50, 0); m.tick(800);
  assert.equal(m.committed, 2);
  m.beginDrag(900); m.dragTo(1.18); m.release(1000, -.002); m.tick(1800);
  assert.equal(m.committed, 1);
});
