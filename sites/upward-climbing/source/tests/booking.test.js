import test from 'node:test';
import assert from 'node:assert/strict';
import { getBookingDays, todayInShanghai, isPastSession, seatsAvailable, sessions, loadBookings, validateBooking, filterSessions, getSessionPeriod } from '../src/booking.js';

test('Shanghai booking dates cross the year boundary independently of machine timezone', () => {
  const now = new Date('2026-12-31T16:30:00Z');
  assert.equal(todayInShanghai(now), '2027-01-01');
  const days = getBookingDays(now);
  assert.equal(days.length, 7);
  assert.equal(days[0].key, '2027-01-01');
  assert.equal(days[6].key, '2027-01-07');
  assert.equal(new Set(days.map(d => d.key)).size, 7);
});

test('booking cutoff uses the session start in Shanghai', () => {
  const session = sessions[0];
  assert.equal(isPastSession('2026-11-13', session, new Date('2026-11-13T01:59:59Z')), false);
  assert.equal(isPastSession('2026-11-13', session, new Date('2026-11-13T02:00:00Z')), true);
});

test('reservations consume places only in the matching date and session', () => {
  const session = sessions[1];
  const bookings = [
    { id: 'mine', date: '2026-11-13', sessionId: session.id, people: 2 },
    { id: 'another-day', date: '2026-11-14', sessionId: session.id, people: 3 },
    { id: 'another-session', date: '2026-11-13', sessionId: sessions[0].id, people: 3 },
  ];
  assert.equal(seatsAvailable('2026-11-13', session, bookings), 2);
  assert.equal(seatsAvailable('2026-11-13', session, bookings.filter(b => b.id !== 'mine')), 4);
  assert.equal(seatsAvailable('2026-11-13', session, [{ date: '2026-11-13', sessionId: session.id, people: 8 }]), 0);
});

test('full and invalid reservations are rejected while valid input is accepted', () => {
  const valid = { name: '测试岩友', phone: '13800138000', people: '2', agreed: true };
  assert.equal(validateBooking(valid, 4), '');
  assert.match(validateBooking(valid, 0), /余位/);
  assert.match(validateBooking({ ...valid, people: '2.5' }, 4), /余位/);
  assert.match(validateBooking({ ...valid, phone: '12345678901' }, 4), /手机号/);
  assert.match(validateBooking({ ...valid, name: '  ' }, 4), /称呼/);
  assert.match(validateBooking({ ...valid, agreed: false }, 4), /须知/);
});

test('unavailable or corrupted local storage does not crash the page', () => {
  assert.deepEqual(loadBookings({ getItem: () => '{broken' }), []);
  assert.deepEqual(loadBookings({ getItem: () => '{"not":"an array"}' }), []);
  assert.deepEqual(loadBookings({ getItem: () => { throw new Error('storage blocked'); } }), []);
  assert.deepEqual(loadBookings({ getItem: () => '[{"id":"x","date":"2026-11-13","sessionId":"unknown","people":2}]' }), []);
});

test('invalid saved records are discarded without losing valid reservations', () => {
  const valid = { id: 'UP-TEST', date: '2026-11-14', sessionId: sessions[1].id, people: 2, name: '测试岩友', total: 336 };
  const data = [null, valid, { ...valid, date: '2026-02-31' }, { ...valid, total: -10 }];
  assert.deepEqual(loadBookings({ getItem: () => JSON.stringify(data) }), [valid]);
});

test('time-of-day boundaries and category filters combine rather than override each other', () => {
  assert.equal(getSessionPeriod({ time: '11:59' }), 'morning');
  assert.equal(getSessionPeriod({ time: '12:00' }), 'afternoon');
  assert.equal(getSessionPeriod({ time: '18:00' }), 'evening');
  const options = { date: '2026-11-13', category: 'intro', period: 'morning' };
  assert.deepEqual(filterSessions(options).map(s => s.id), ['first-climb-am']);
  assert.deepEqual(filterSessions({ ...options, period: 'afternoon' }), []);
  assert.equal(filterSessions({ date: options.date }).length, 6);
});

test('available-only filters exclude started, full and locally filled sessions', () => {
  const date = '2026-11-13';
  const now = new Date('2026-11-13T02:30:00Z');
  const bookings = [{ date, sessionId: 'first-climb-am', people: 4 }];
  const result = filterSessions({ date, now, bookings, onlyAvailable: true });
  assert.deepEqual(result.map(s => s.id), ['afternoon-boulder', 'rope-class', 'first-climb-pm']);
  assert.deepEqual(filterSessions({ date, now, bookings, onlyAvailable: true, category: 'intro', period: 'morning' }), []);
  assert.deepEqual(filterSessions({ date, onlyAvailable: true, now: new Date('2026-11-13T14:00:00Z') }), []);
});
