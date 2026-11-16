import test from 'node:test';
import assert from 'node:assert/strict';
import { demoTrends, filterTrends, nextQuarters, observationWindow, opportunityScore } from '../src/data.js';
import { parseCSV, validateImport, templateCSV, trendCSV, makeCSV } from '../src/csv.js';
import { DEFAULT_TIMING, easterDate, holidayDate, quarterOf, resolveTiming, seasonalSchedule } from '../src/seasonal.js';

test('filters apply market, category, channel and date consistently', () => {
  const filtered = filterTrends(demoTrends, { market: 'US', category: '餐厨用品', channel: 'retail' });
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every(t => t.market === 'US' && t.category === '餐厨用品'));
  assert.equal(filterTrends(demoTrends, { query: 'no matching trend' }).length, 0);
  assert.equal(filterTrends(demoTrends, { anchor: '2027-03-01' }).length, 0);
  assert.ok(opportunityScore(filtered[0]) >= opportunityScore(filtered[1]));
});

test('quarter rollover is correct at year boundaries', () => {
  assert.deepEqual(nextQuarters(new Date(2026, 10, 13)), ['2027-Q1', '2027-Q2', '2027-Q3', '2027-Q4']);
});

test('observation windows include exactly the labeled dates across month and year boundaries', () => {
  assert.deepEqual(observationWindow('2026-11-13', 30), { start: '2026-10-15', end: '2026-11-13' });
  assert.deepEqual(observationWindow('2026-11-13', 90), { start: '2026-08-16', end: '2026-11-13' });
  assert.deepEqual(observationWindow('2027-01-01', 30), { start: '2026-12-03', end: '2027-01-01' });
  assert.deepEqual(observationWindow('2028-03-01', 2), { start: '2028-02-29', end: '2028-03-01' });
  const records = ['2026-10-14', '2026-10-15', '2026-11-13', '2026-11-14'].map(observedAt => ({ ...demoTrends[0], id: observedAt, observedAt }));
  assert.deepEqual(filterTrends(records, { anchor: '2026-11-13', days: 30 }).map(t => t.observedAt), ['2026-10-15', '2026-11-13']);
});

test('CSV handles BOM, escaped quotes, commas and multiline fields', () => {
  assert.deepEqual(parseCSV('\uFEFFa,b\r\n"c,d","line\nwith ""quotes"""'), [['a', 'b'], ['c,d', 'line\nwith "quotes"']]);
  assert.throws(() => parseCSV('a\n"unclosed'), /未闭合/);
});

test('import accepts a template and export round trip with provenance', () => {
  const records = validateImport(templateCSV('2026-11-13'));
  assert.equal(records.length, 1);
  assert.equal(records[0].provenance, 'imported');
  assert.deepEqual(validateImport(trendCSV(records, '用户导入')), records);
});

test('import rejects invalid date, missing numeric value and unsafe URL atomically', () => {
  const csv = templateCSV('2026-11-13');
  assert.throws(() => validateImport(csv.replace('2026-11-13', '2026-02-30')), /有效日期/);
  assert.throws(() => validateImport(csv.replace('"70"', '""')), /必须为数字/);
  assert.throws(() => validateImport(csv.replace('https://www.target.com/', 'javascript:alert(1)')), /url/);
  assert.throws(() => validateImport('title\nx'), /缺少列/);
  assert.throws(() => validateImport(trendCSV(demoTrends, '演示数据 · 非真实市场结论')), /演示数据/);
});

test('CSV export prevents formula injection and preserves numeric negatives', () => {
  const csv = makeCSV(['name', 'value'], [['=HYPERLINK("evil")', -8]]);
  const parsed = parseCSV(csv);
  assert.equal(parsed[1][0][0], "'");
  assert.equal(parsed[1][1], '-8');
});

test('Europe, holiday, home and primary-platform filters compose correctly', () => {
  const holiday = filterTrends(demoTrends, { market: 'EUROPE', category: '节日装饰', festival: 'christmas', platform: 'Pinterest' });
  assert.equal(holiday.length, 1);
  assert.equal(holiday[0].market, 'FR');
  assert.equal(holiday[0].id, 'paper-village');
  assert.ok(filterTrends(demoTrends, { category: 'home' }).every(t => t.category !== '节日装饰'));
  assert.equal(filterTrends(demoTrends, { category: 'home' }).length, 12);
  assert.equal(filterTrends(demoTrends, { query: '可拆灯座' })[0].id, 'paper-village');
});

test('optional social metrics preserve unknown values and original URLs', () => {
  const record = validateImport(templateCSV('2026-11-13'))[0];
  assert.equal(record.festival, 'christmas');
  assert.equal(record.views, null);
  assert.equal(record.likes, null);
  const content = { ...record, market: 'FR', views: 120000, likes: 4300, postUrl: 'https://www.pinterest.com/pin/123456/' };
  const imported = validateImport(trendCSV([content], '用户导入'))[0];
  assert.equal(imported.views, 120000);
  assert.equal(imported.postUrl, content.postUrl);
  assert.equal(imported.market, 'FR');
  assert.throws(() => validateImport(trendCSV([{ ...content, views: -1 }], '用户导入')), /非负整数/);
  assert.throws(() => validateImport(trendCSV([{ ...content, postUrl: 'javascript:alert(1)' }], '用户导入')), /postUrl/);
  assert.throws(() => validateImport(trendCSV([{ ...content, platform: 'Instagram' }], '用户导入')), /platform/);
  assert.throws(() => validateImport(trendCSV([{ ...content, festival: 'made-up' }], '用户导入')), /festival/);
  assert.throws(() => validateImport(trendCSV([{ ...content, platform: '' }], '用户导入')), /platform/);
  const posts = validateImport(trendCSV([content, { ...content, postUrl: 'https://www.pinterest.com/pin/654321/' }], '用户导入'));
  assert.equal(posts.length, 2);
  assert.notEqual(posts[0].id, posts[1].id);
  assert.throws(() => validateImport(trendCSV([content, content], '用户导入')), /重复记录/);
});

test('legacy CSV stays importable without new optional columns', () => {
  const csv = 'title,en,category,market,sources,social,retail,growth,observedAt,url,tags,brief\n旧版调研,,家居装饰,US,Pinterest,70,60,15,2026-11-13,,,已有建议';
  const record = validateImport(csv)[0];
  assert.equal(record.festival, 'unassigned');
  assert.equal(record.views, null);
  assert.equal(record.brief, '已有建议');
});

test('holiday dates handle movable events and year rollover', () => {
  assert.equal(easterDate(2026), '2026-04-05');
  assert.equal(easterDate(2027), '2027-03-28');
  assert.equal(holidayDate('thanksgiving', 2027), '2027-11-25');
  assert.equal(seasonalSchedule({ anchor: '2026-12-26' }).find(h => h.id === 'christmas').eventDate, '2027-12-25');
  assert.equal(quarterOf('2027-03-31'), '2027-Q1');
});

test('lead-time planning is UTC-stable and respects market scope', () => {
  const current = seasonalSchedule({ anchor: '2026-11-13', year: 2027, leadWeeks: 24, shelfWeeks: 4 });
  const revised = seasonalSchedule({ anchor: '2026-11-13', year: 2027, leadWeeks: 36, shelfWeeks: 4 });
  const original = current.find(h => h.id === 'christmas');
  const earlier = revised.find(h => h.id === 'christmas');
  assert.equal(original.shelfDate, '2027-11-27');
  assert.equal((new Date(original.kickoffDate) - new Date(earlier.kickoffDate)) / 86400000, 84);
  assert.equal(quarterOf(earlier.kickoffDate), '2027-Q1');
  assert.ok(current.find(h => h.id === 'valentine').daysUntilKickoff < 0);
  assert.equal(seasonalSchedule({ anchor: '2026-11-13', market: 'EUROPE' }).some(h => h.id === 'thanksgiving'), false);
  assert.throws(() => seasonalSchedule({ anchor: '2026-11-13', leadWeeks: -1 }), /Invalid/);
});

test('confirmed three-month default migrates once and preserves custom choices', () => {
  assert.deepEqual(resolveTiming(null), DEFAULT_TIMING);
  assert.equal(resolveTiming({ leadWeeks: 24, shelfWeeks: 4 }).leadWeeks, 13);
  assert.equal(resolveTiming({ leadWeeks: 36, shelfWeeks: 6 }).leadWeeks, 36);
  assert.equal(resolveTiming({ leadWeeks: 24, shelfWeeks: 6, version: 2 }).leadWeeks, 24);
  assert.equal(resolveTiming({ leadWeeks: 0, shelfWeeks: 4 }).leadWeeks, 13);
  const schedule = seasonalSchedule({ anchor: '2026-11-13', year: 2027 });
  assert.equal(schedule.find(h => h.id === 'easter').kickoffDate, '2026-11-29');
  assert.equal(schedule.find(h => h.id === 'christmas').kickoffDate, '2027-08-28');
});
