// Regenerate geometry and coefficients before producing the standalone page.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const script of ['bird-contour.mjs', 'fourier.mjs']) {
  execFileSync(process.execPath, [join(ROOT, 'tools', script)], { stdio: 'inherit' });
}
const svg = readFileSync(join(ROOT, 'ref/bird.svg'), 'utf8');
const d = svg.match(/\sd="([^"]+)"/)[1];
const data = JSON.parse(readFileSync(join(ROOT, 'tools/fourier-data.json'), 'utf8'));
const art = JSON.parse(readFileSync(join(ROOT, 'tools/bird-parts.json'), 'utf8'));
const fallback = {
  ax0: data.meta.ax0, ay0: data.meta.ay0,
  x: data.coefs.x, y: data.coefs.y, height: data.meta.height,
};
let html = readFileSync(join(ROOT, 'tools/page.template.html'), 'utf8');
for (const [token, value] of Object.entries({
  __CONTOUR_D__: d, __FALLBACK__: JSON.stringify(fallback), __BIRD_ART__: JSON.stringify(art),
})) {
  if (!html.includes(token)) throw new Error(`Missing template placeholder: ${token}`);
  html = html.replaceAll(token, value);
}
const out = join(ROOT, 'index.html');
writeFileSync(out, html);
console.log(`Built ${out} (${(html.length / 1024).toFixed(1)} KB)`);
