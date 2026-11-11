import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(ROOT, path), 'utf8');
const html = read('index.html');
const outline = read('ref/bird.svg').match(/\sd="([^"]+)"/)[1];
const { layers } = JSON.parse(read('tools/bird-parts.json'));
const data = JSON.parse(read('tools/fourier-data.json'));
assert.equal((outline.match(/M/g) || []).length, 1, 'One continuous contour');
assert.equal((outline.match(/Z/g) || []).length, 1, 'One closed contour');
assert.equal(layers[0].d, outline, 'Art and Fourier input share an outline');
assert.deepEqual(layers.map(p => p.id), ['silhouette', 'bill', 'feet', 'eye', 'eye-highlight']);
assert.equal((layers.find(p => p.id === 'feet').d.match(/M/g) || []).length, 2, 'Two feet');
assert(data.meta.width > 440 && data.meta.width < 450, 'Reference width');
assert(data.meta.height > 330 && data.meta.height < 332, 'Reference height including feet');
assert(data.meta.width / data.meta.height > 1.34 && data.meta.width / data.meta.height < 1.37);
assert.equal(data.meta.M, 2048);
assert.equal(data.meta.KMAX, 50);
for (const axis of ['x', 'y']) {
  assert.equal(data.coefs[axis].length, 50);
  assert(data.coefs[axis].every(pair => pair.length === 2 && pair.every(Number.isFinite)));
}
assert(data.errors.every((p, i, a) => Number.isFinite(p.err) && (!i || p.err < a[i - 1].err)));
assert(data.errors.at(-1).err < 0.2);
assert(html.includes(`const CONTOUR_D = "${outline}"`), 'Built path matches source');
assert(html.includes(JSON.stringify({ layers })), 'Built art matches source');
assert(!/__CONTOUR_D__|__FALLBACK__|__BIRD_ART__/.test(html), 'No unexpanded placeholders');
new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1], { filename: 'index.html' });
console.log('PASS: contour topology, two feet, reference aspect ratio, 100 coefficient pairs, monotonic error, generated sources, and JavaScript syntax.');
