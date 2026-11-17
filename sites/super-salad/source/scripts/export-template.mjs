import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const source = fileURLToPath(new URL('../', import.meta.url));
const template = dirname(source.replace(/\/$/, ''));
if (basename(template) !== 'super-salad') throw new Error('Unexpected export destination');
// Only generated runtime files are replaced. Docs, source, licenses and preview remain.
await rm(join(template, 'assets'), { recursive: true, force: true });
await mkdir(join(template, 'assets'), { recursive: true });
await cp(join(source, 'dist/assets'), join(template, 'assets'), { recursive: true });
await cp(join(source, 'dist/index.html'), join(template, 'index.html'));
console.log('Exported static Super Salad template with relative asset paths.');
