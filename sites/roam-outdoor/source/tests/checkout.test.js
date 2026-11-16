import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutTotal, normalizeCart, validateCheckout } from '../src/lib/checkout.js';

test('legacy bags retain quantities and sizes while migrating to the exact new colorway', () => {
  const result = normalizeCart([
    { id: 'a04', color: '琥珀红', size: 'M', quantity: 2, price: 1, src: 'old.png' },
    { id: 'a04', color: '天空蓝', size: 'L', quantity: 1, price: 0 },
    { id: 'c02', color: '琥珀红', size: '均码', quantity: 1, filter: 'tone-red' },
  ]);
  assert.equal(result[0].color, '热粉');
  assert.equal(result[0].quantity, 2);
  assert.equal(result[0].size, 'M');
  assert.equal(result[0].price, 1680);
  assert.match(result[0].src, /shell-pink/);
  assert.equal(result[1].color, '天蓝');
  assert.equal(result[1].size, 'L');
  assert.match(result[2].src, /cap-pink/);
  assert.equal(result[2].filter, '');
});

test('merged legacy and new color keys stay unique; invalid quantities are ignored', () => {
  const result = normalizeCart([
    { id: 'a04', color: '琥珀红', size: 'M', quantity: 2 },
    { id: 'a04', color: '热粉', size: 'M', quantity: 3 },
    { id: 'a04', color: '热粉', size: 'M', quantity: -2 },
    { id: 'a04', color: '热粉', size: 'XXXS', quantity: 1 },
    { id: 'unknown', size: 'M', quantity: 1 },
    null,
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 5);
  assert.deepEqual(normalizeCart({ items: [] }), []);
});

test('checkout totals account for each line quantity and use integer minor units', () => {
  assert.equal(checkoutTotal([{ price: 1680, quantity: 2 }, { price: 228, quantity: 1 }]), 3588);
  assert.equal(checkoutTotal([{ price: .1, quantity: 1 }, { price: .2, quantity: 1 }]), .3);
  assert.equal(checkoutTotal([]), 0);
});

test('checkout reports all missing or invalid information', () => {
  const errors = validateCheckout({ recipient: ' ', phone: '123', region: '', address: '家', method: 'unknown' });
  assert.deepEqual(Object.keys(errors), ['recipient', 'phone', 'region', 'address', 'method']);
});

test('checkout accepts either supported demo payment method and formatted phone input', () => {
  for (const method of ['wechat', 'alipay']) {
    assert.deepEqual(validateCheckout({ recipient: '山行测试', phone: '138 0000 0000', region: '浙江省杭州市西湖区', address: '山行路 18 号 201 室', method }), {});
  }
});
