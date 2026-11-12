import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { WEATHER_SNAPSHOT } from '../src/snapshot.js';
import { CITIES, normalizeForecast, upcomingHours, forecastURL, timeText, dateKey, weatherInfo, windName, uvLabel, rainSummary } from '../src/data.js';
import { plotModel, hourlyChart, weekRows, daylightMinutes } from '../src/charts.js';
const raw = () => structuredClone(WEATHER_SNAPSHOT.raw);
const data = () => normalizeForecast(raw(), CITIES[0], WEATHER_SNAPSHOT.fetchedAt);

test('real snapshot retains its original date, units and values', () => {
  const result = data();
  assert.equal(result.current.time, WEATHER_SNAPSHOT.raw.current.time);
  assert.equal(result.current.temperature, WEATHER_SNAPSHOT.raw.current.temperature_2m);
  assert.equal(result.hourly.length, 168); assert.equal(result.daily.length, 7);
  assert.equal(result.timezone, 'Asia/Shanghai');
});
test('API requests explicit units and unambiguous Unix timestamps', () => {
  const url = new URL(forecastURL(CITIES[2]));
  assert.equal(url.hostname, 'api.open-meteo.com');
  assert.equal(url.searchParams.get('wind_speed_unit'), 'ms');
  assert.equal(url.searchParams.get('timeformat'), 'unixtime');
  assert.equal(url.searchParams.get('latitude'), '39.9');
});
test('24-hour window starts strictly after current forecast timestamp', () => {
  const result = data(), hours = upcomingHours(result);
  assert.equal(hours.length, 24);
  assert(hours.every(h => h.time > result.current.time));
  assert.equal(hours.at(-1).time - hours[0].time, 23 * 3600);
});
test('formatting follows the API timezone, not the browser timezone', () => {
  assert.equal(timeText(0, 'Asia/Shanghai'), '08:00');
  assert.equal(dateKey(0, 'America/New_York'), '1969-12-31');
  assert.equal(timeText(Date.UTC(2026, 2, 8, 7) / 1000, 'America/New_York'), '03:00');
});
test('missing timezone is rejected instead of using device time', () => {
  const sample = raw(); delete sample.timezone;
  assert.throws(() => normalizeForecast(sample, CITIES[0]));
});
test('wrong units and unordered timestamps are rejected', () => {
  const sample = raw(); sample.hourly_units.wind_speed_10m = 'km/h';
  assert.throws(() => normalizeForecast(sample, CITIES[0]), /单位/);
  const repeated = raw(); repeated.hourly.time[1] = repeated.hourly.time[0];
  assert.throws(() => normalizeForecast(repeated, CITIES[0]), /时间/);
});
test('null and out-of-range readings stay missing, never become zero', () => {
  const sample = raw(); sample.hourly.temperature_2m[2] = null; sample.hourly.precipitation_probability[3] = 101;
  const result = normalizeForecast(sample, CITIES[0]);
  assert.equal(result.hourly[2].temperature, null); assert.equal(result.hourly[3].probability, null);
});
test('incomplete precipitation probabilities do not claim a complete maximum', () => {
  assert.equal(rainSummary([{ probability: 0, precipitation: 0 }, { probability: null, precipitation: null }]).maxProbability, null);
  assert.equal(rainSummary([{ probability: 0, precipitation: 0 }]).maxProbability, 0);
  assert.equal(rainSummary([]).total, null);
});
test('weather mapping covers day/night, rain, snow and storm without fabricating unknown codes', () => {
  assert.equal(weatherInfo(0, false).kind, 'moon'); assert.equal(weatherInfo(2).kind, 'partly');
  assert.equal(weatherInfo(63).kind, 'rain'); assert.equal(weatherInfo(75).kind, 'snow'); assert.equal(weatherInfo(99).kind, 'storm');
  assert.match(weatherInfo(999).label, /暂缺/);
});
test('meteorological wind direction and UV thresholds are consistent', () => {
  assert.equal(windName(0), '北风'); assert.equal(windName(90), '东风'); assert.equal(windName(360), '北风');
  assert.equal(uvLabel(2.9), '低'); assert.equal(uvLabel(3), '中等'); assert.equal(uvLabel(11), '极高');
});
test('temperature scale includes all values and rain always has a zero baseline', () => {
  const hours = upcomingHours(data());
  const temp = plotModel(hours, 'temperature');
  assert(temp.min < Math.min(...hours.map(h => h.temperature))); assert(temp.max > Math.max(...hours.map(h => h.temperature)));
  assert.equal(plotModel(hours, 'precipitation').min, 0);
});
test('SVG generation handles gaps and all-missing series explicitly', () => {
  const hours = upcomingHours(data()).map(h => ({ ...h, temperature: null }));
  assert.match(hourlyChart(hours, 'temperature', -1, 'Asia/Shanghai'), /暂不可用|暂缺/);
  hours[2].temperature = 12; hours[5].temperature = 13;
  assert(!hourlyChart(hours, 'temperature', 2, 'Asia/Shanghai').includes('NaN'));
  assert.match(hourlyChart(hours, 'temperature', -1, 'Asia/Shanghai'), /<circle/, 'Isolated valid readings remain visible');
  assert.equal((weekRows(data()).match(/data-day=/g) || []).length, 7);
});
test('daylight measures time between sunrise and sunset, not sunshine hours', () => {
  assert.equal(daylightMinutes({ sunrise: 100, sunset: 3700 }), 60);
  assert.equal(daylightMinutes({ sunrise: null, sunset: 3700 }), null);
});
test('standalone build parses and includes required licenses', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1); new Script(scripts[0][1]);
  assert(!/__BUNDLE__|__STYLES__|__LICENSES__/.test(html));
  assert(html.includes('Permission is hereby granted')); assert(html.includes('Lucide'));
});
