import { access, cp, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const template = new URL('../../', import.meta.url);
const entries = ['index.html', 'assets/'];

// Only replace generated runtime output. Source, credits, licenses and gallery
// material are maintained independently and must survive every rebuild.
await Promise.all([...entries, 'assets/fonts/brand.woff2', 'assets/shell-pink.webp'].map(entry => access(new URL(entry, output))));
await access(new URL('source/package.json', template));
await rm(new URL('assets/', template), { recursive: true, force: true });
for (const entry of entries) await cp(new URL(entry, output), new URL(entry, template), { recursive: true });
console.log('Exported ROAM static entry and assets; source, notices and gallery media preserved.');
