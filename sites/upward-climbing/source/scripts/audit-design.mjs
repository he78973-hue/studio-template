import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// Static design audit adapted for this JavaScript / Lucide registry project.
const failures = [];
const read = path => readFileSync(path, 'utf8');
const stylesheet = read('src/styles.css').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@font-face\s*\{[^}]*\}/g, '').replace(/@media[^\{]+\{/g, '');
if (/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/i.test(stylesheet)) failures.push('Colors outside the token layer');
if (/-?\d*\.?\d+(?:px|rem|em)\b/.test(stylesheet)) failures.push('Untokenized visual dimensions');
const definitions = new Set(Array.from(read('src/tokens.css').matchAll(/(--[\w-]+)\s*:/g), m => m[1]));
for (const [, name] of read('src/styles.css').matchAll(/var\((--[\w-]+)/g)) {
  if (!definitions.has(name)) failures.push(`Undefined token: ${name}`);
}

const registryPath = 'src/components/icons.jsx';
const registry = read(registryPath);
const glyphs = new Set(Array.from(registry.matchAll(/^  (?:'([\w-]+)'|([\w-]+)):\s*\w+/gm), m => m[1] || m[2]));
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : /\.[jt]sx?$/.test(path) ? [path] : [];
  });
}
let staticRefs = 0;
for (const path of walk('src')) {
  const source = read(path);
  if (source.includes("from 'lucide-react'") && path !== registryPath) failures.push(`Scattered icon import: ${path}`);
  if (/<svg\b/.test(source) && path !== 'src/components/Brand.jsx') failures.push(`Unregistered SVG: ${path}`);
  for (const [, name] of source.matchAll(/<Icon\s+name="([\w-]+)"/g)) {
    staticRefs++;
    if (!glyphs.has(name)) failures.push(`Missing icon ${name} in ${relative('.', path)}`);
  }
  for (const [, name] of source.matchAll(/icon:\s*'([\w-]+)'/g)) {
    if (!glyphs.has(name)) failures.push(`Missing data-layer icon ${name}`);
  }
  if (path !== registryPath && /strokeWidth=|<Icon[^>]+size=\{\d/.test(source)) failures.push(`Per-instance icon styling: ${path}`);
}
if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: tokenized styles, ${definitions.size} declared tokens, ${glyphs.size} registered glyphs, ${staticRefs} resolved static icon references, no scattered Lucide imports.`);
}
