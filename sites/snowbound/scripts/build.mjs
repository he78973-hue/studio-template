import { build } from 'vite';
import { cp, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
await build();
await rename('dist/index.template.html', 'dist/index.html');
// assets/ is exclusively generated; source and gallery preview files live elsewhere.
await rm('assets', { recursive: true, force: true });
await cp('dist/assets', 'assets', { recursive: true });
await cp('dist/index.html', 'index.html');
await cp('dist/favicon.svg', 'favicon.svg');
console.log('Published static index.html, assets/ and favicon.svg. Source entry remains index.template.html.');
