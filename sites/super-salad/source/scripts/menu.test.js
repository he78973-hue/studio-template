import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBag, getBagTotals } from '../menu.js';
import { parseCssTime } from '../motion.js';

test('invalid persisted payloads recover to an empty bag', () => {
  for (const value of [null, undefined, 12, 'broken', [], [1, 2]]) {
    assert.deepEqual(normalizeBag(value), {});
  }
});

test('unknown products and invalid quantities cannot affect an order', () => {
  assert.deepEqual(normalizeBag({
    tofu: 2, orange: 1, avocado: -2, rainbow: '3', egg: 0.5,
    pomegranate: Number.POSITIVE_INFINITY, unknown: 999,
  }), { tofu: 2, orange: 1 });
});

test('restored quantities are capped at twenty per product', () => {
  assert.deepEqual(normalizeBag({ tofu: 21, orange: 1000 }), { tofu: 20, orange: 20 });
});

test('mixed product quantities produce the correct count and price', () => {
  assert.deepEqual(getBagTotals({ tofu: 2, orange: 1 }), { count: 3, price: 94 });
  assert.deepEqual(getBagTotals({}), { count: 0, price: 0 });
  assert.deepEqual(getBagTotals({ avocado: 20, rainbow: 1 }), { count: 21, price: 752 });
});

test('new menu selections survive restoration alongside legacy product IDs', () => {
  const restored = normalizeBag({ tofu: 2, greek: 1, chicken: 2, shrimp: 1, orange: 1, removed: 9 });
  assert.deepEqual(restored, { tofu: 2, greek: 1, chicken: 2, shrimp: 1, orange: 1 });
  assert.deepEqual(getBagTotals(restored), { count: 7, price: 260 });
});

test('motion timing survives CSS minification from milliseconds to seconds', () => {
  for (const [input, expected] of [['480ms', 480], ['.48s', 480], [' 0.3s ', 300], ['90ms', 90], ['0ms', 0]]) {
    assert.equal(parseCssTime(input, 160), expected);
  }
  for (const input of ['', '-20ms', 'Infinityms', '120junkms', '200']) {
    assert.equal(parseCssTime(input, 160), 160);
  }
});
