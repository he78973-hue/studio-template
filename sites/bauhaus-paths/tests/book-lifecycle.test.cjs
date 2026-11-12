const test = require('node:test');
const assert = require('node:assert/strict');
const { TurnModel } = require('../book-state.js');

test('drag can interrupt an animation and cancel to the committed spread', () => {
  const m = new TurnModel(); m.request(1, 0); const p = m.tick(240).progress;
  m.beginDrag(240); assert.equal(m.progress, p); m.dragTo(.7); m.cancel(300);
  assert.equal(m.tick(1200).committed, 0); assert.equal(m.moving, false);
});
test('environment settling cancels an uncommitted drag', () => {
  const m = new TurnModel(); m.beginDrag(0); m.dragTo(.4); m.settle();
  assert.equal(m.progress, 0); assert.equal(m.dragging, false); assert.equal(m.animation, null);
});
test('environment settling completes a requested navigation', () => {
  const m = new TurnModel(); m.request(1, 200); m.tick(330); m.settle();
  assert.equal(m.progress, 1); assert.equal(m.committed, 1); assert.equal(m.moving, false);
  assert.equal(m.tick(9000).progress, 1);
});
test('rapid alternating requests always preserve bounded progress', () => {
  const m = new TurnModel();
  for (let i = 0; i < 20; i++) {
    m.request(i % 2, i * 40); m.tick(i * 40 + 20);
    assert(m.progress >= 0 && m.progress <= 1);
  }
  assert.equal(m.tick(3000).committed, 1); assert.equal(m.moving, false);
});
test('dragging from the second spread without crossing halfway returns there', () => {
  const m = new TurnModel(1); m.beginDrag(100); m.dragTo(.68); m.release(200, 0); m.tick(1200);
  assert.equal(m.committed, 1); assert.equal(m.progress, 1);
});
test('reduced-motion reversal resolves immediately, without stale animation', () => {
  const m = new TurnModel(); m.request(1, 100); m.tick(350); m.request(0, 350, true);
  assert.equal(m.committed, 0); assert.equal(m.moving, false); assert.equal(m.animation, null);
});
