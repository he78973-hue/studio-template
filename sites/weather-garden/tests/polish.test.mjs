import test from 'node:test';
import assert from 'node:assert/strict';
import { hourlyChart, plotModel } from '../src/charts.js';
import { weatherTransitionScale } from '../src/scene.js';

const start = Date.UTC(2026, 10, 11, 14) / 1000;
const hours = Array.from({ length: 4 }, (_, i) => ({ time: start + i * 3600, temperature: 10 - i, wind: .2, direction: 0, precipitation: 0 }));

test('low wind axis does not repeat rounded labels at different heights', () => {
  const svg = hourlyChart(hours, 'wind', -1, 'Asia/Shanghai');
  const labels = [...svg.matchAll(/<text class="chart-axis" x="22"[^>]*>([^<]+)<\/text>/g)].map(m => m[1]);
  assert(labels.length >= 3);
  assert.equal(new Set(labels).size, labels.length, `Ambiguous y-axis labels: ${labels.join(', ')}`);
});
test('a midnight crossing is annotated with the next date', () => {
  const svg = hourlyChart(hours, 'temperature', -1, 'Asia/Shanghai');
  assert.match(svg, /11月12日/);
});
test('nice axes keep zero rain and all temperatures in range', () => {
  for (const metric of ['temperature', 'wind', 'precipitation']) {
    const model = plotModel(hours, metric);
    assert(model.max > model.min);
    assert(hours.every(h => h[metric] >= model.min && h[metric] <= model.max));
    if (metric !== 'temperature') assert.equal(model.min, 0);
  }
});
test('weather-settle motion starts continuously and returns exactly to rest', () => {
  for (const startScale of [.93, 1, 1.04]) {
    assert.equal(weatherTransitionScale(0, startScale), startScale);
    assert(Math.abs(weatherTransitionScale(.001, startScale) - startScale) < .001);
    assert.equal(weatherTransitionScale(1, startScale), 1);
    for (let i = 0; i <= 100; i++) {
      const scale = weatherTransitionScale(i / 100, startScale);
      assert(scale >= .9 && scale <= 1.08);
    }
  }
});
