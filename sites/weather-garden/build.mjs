import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
let three = read('vendor/three.module.js');
if ((three.match(/^export\s*\{/gm) || []).length !== 1) throw Error('Unexpected Three.js module format');
three = three.replace(/^export\s*\{/m, 'return {');
const inline = code => code.replace(/^import .*;\s*$/gm, '').replace(/^export\s+/gm, '').trim();
const files = ['data.js', 'icons.js', 'charts.js', 'snapshot.js', 'scene.js', 'app.js'];
const app = files.map(file => `/* ${file} */\n${inline(read('src/' + file))}`).join('\n\n');
const bundle = `window.THREE = (function(){\n${three}\n})();\n(function(){\n'use strict';\nconst THREE = window.THREE;\n${app}\n})();`;
new Script(bundle, { filename: 'weather-garden.inline.js' });
const licenses = read('vendor/LICENSE-three.txt') + '\n\n' + read('vendor/LICENSE-lucide.txt');
if (/<\/script/i.test(licenses)) throw Error('Unexpected closing tag in license text');
let html = read('index.template.html');
for (const [token, value] of Object.entries({ __STYLES__: read('src/styles.css'), __LICENSES__: licenses, __BUNDLE__: bundle.replace(/<\/script/gi, '<\\/script') })) {
  if (!html.includes(token)) throw Error('Missing template token: ' + token);
  html = html.replace(token, () => value);
}
writeFileSync(join(root, 'index.html'), html);
console.log(`Built standalone index.html: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB, local Three.js + icons + timestamped snapshot.`);
