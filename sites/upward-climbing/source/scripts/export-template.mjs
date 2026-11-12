import { access, cp, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const template = new URL('../../', import.meta.url);
const entries = ['index.html', 'favicon.svg', 'assets/'];

// Validate the completed build before replacing only the generated runtime files.
await Promise.all([...entries, 'assets/app.js'].map(entry => access(new URL(entry, output))));
await access(new URL('source/package.json', template));
await rm(new URL('assets/', template), { recursive: true, force: true });
for (const entry of entries) {
  await cp(new URL(entry, output), new URL(entry, template), { recursive: true });
}
console.log('Exported static entry, favicon and assets; source, licenses and preview preserved.');
