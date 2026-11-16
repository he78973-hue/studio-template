import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out-dir')) {
  throw new Error('Usage: npm run build:template -- [--out-dir /path/to/sites/trendatlas]');
}
const target = resolve(args[1] || (basename(root) === 'source' ? join(root, '..') : join(root, 'release', 'trendatlas')));
if (basename(target) !== 'trendatlas' || target === root) {
  throw new Error('The output directory must be named trendatlas and must not be the source root.');
}
const dist = join(root, 'dist');
await stat(join(dist, 'index.html'));
await mkdir(target, { recursive: true });
const manifestPath = join(target, '.runtime-files.json');
let previous = [];
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(previous) || previous.some(path => typeof path !== 'string' || path.startsWith('/') || path.split('/').includes('..') || !/^(index\.html|assets\/|images\/|fonts\/|licenses\/)/.test(path))) {
  throw new Error('Invalid generated-runtime manifest; refusing to remove files.');
}
// Only previously generated runtime files are replaced. Preview media, source,
// publishing verification and template documentation are never removed.
for (const path of previous) await rm(join(target, path), { force: true });
const generated = [];
async function exportFiles(folder) {
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;
    const file = join(folder, entry.name);
    if (entry.isDirectory()) await exportFiles(file);
    else {
      const path = relative(dist, file);
      await mkdir(dirname(join(target, path)), { recursive: true });
      await cp(file, join(target, path));
      generated.push(path.split(sep).join('/'));
    }
  }
}
await exportFiles(dist);
await writeFile(manifestPath, `${JSON.stringify(generated, null, 2)}\n`);
const source = join(target, 'source');
if (source !== root) {
  await mkdir(source, { recursive: true });
  // Explicit allowlist: no node_modules, browser state, local history or screenshots.
  for (const entry of ['src', 'public', 'tests', 'scripts', 'package.json', 'package-lock.json', 'vite.config.js', 'index.html', '.gitignore']) {
    await cp(join(root, entry), join(source, entry), { recursive: true, filter: path => !['.DS_Store', '.gitkeep'].includes(basename(path)) });
  }
  const distributed = basename(root) === 'source';
  const docsRoot = distributed ? dirname(root) : root;
  for (const [from, to] of [[distributed ? 'README.md' : 'TEMPLATE_README.md', 'README.md'], ['DEVELOPER_PROMPT.md', 'DEVELOPER_PROMPT.md'], ['CREDITS.md', 'CREDITS.md'], ['DESIGN.md', 'DESIGN.md'], [distributed ? 'DATA-INTEGRATION.md' : 'docs/DATA-INTEGRATION.md', 'DATA-INTEGRATION.md']]) {
    await cp(join(docsRoot, from), join(target, to));
  }
  await writeFile(join(source, 'README.md'), '# Editable TrendAtlas source\n\nSee ../README.md and ../DEVELOPER_PROMPT.md.\n\nRun `npm ci`, `npm run dev`, and `npm test`. `npm run build:template` rebuilds and updates the parent static template, preserving its preview media and documentation.\n');
}
await writeFile(join(target, '.gitignore'), 'source/node_modules/\nsource/dist/\nsource/release/\n.DS_Store\n');
console.log(`Exported ${generated.length} runtime files and editable source to ${target}`);
