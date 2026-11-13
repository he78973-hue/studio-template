import { cp, readdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('../', import.meta.url));
const template = path.resolve(source, '..');
const dist = path.join(source, 'dist');
const generated = ['index.html', 'favicon.svg', 'assets', 'data'];

// Check the completed build before replacing only known generated runtime paths.
for (const name of generated) await stat(path.join(dist, name));
for (const name of await readdir(dist)) {
  if (!generated.includes(name)) throw new Error(`Unexpected build output: ${name}`);
}
for (const name of generated) {
  await rm(path.join(template, name), { recursive: true, force: true });
  await cp(path.join(dist, name), path.join(template, name), { recursive: true });
}
console.log('Exported static index.html, favicon.svg, assets/ and data/');
