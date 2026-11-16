import { build } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const templateMode = process.argv.includes('--template');
const filename = templateMode ? 'index.html' : '秋日来信.html';
const result = await build({
  root,
  configFile: false,
  publicDir: false,
  logLevel: 'error',
  build: {
    write: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(root, 'src/main.js'),
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
});

const chunks = result.output.filter(item => item.type === 'chunk');
const styles = result.output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css'));
const otherAssets = result.output.filter(item => item.type === 'asset' && !item.fileName.endsWith('.css'));
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length || styles.length !== 1 || otherAssets.length) {
  throw new Error('Standalone output must contain exactly one script and one stylesheet, with no external assets.');
}

const template = await readFile(resolve(root, templateMode ? 'index.template.html' : 'index.html'), 'utf8');
const favicon = await readFile(resolve(root, 'public/favicon.svg'), 'utf8');
const notices = (await Promise.all(['three-MIT.txt', 'lucide-ISC.txt', 'feather-MIT.txt'].map(async name =>
  `${name}\n\n${await readFile(resolve(root, 'licenses', name), 'utf8')}`
))).join('\n\n-----\n\n').replace(/<\/script/gi, '<\\/script');
// Three.js shader templates contain insignificant line-end spaces; keep the generated file diff-clean.
const js = chunks[0].code.replace(/[\t ]+$/gm, '').replace(/<\/script/gi, '<\\/script');
const css = String(styles[0].source).replace(/<\/style/gi, '<\\/style');
const replaceOnce = (html, pattern, content) => {
  if (!pattern.test(html)) throw new Error(`Standalone template marker missing: ${pattern}`);
  // A callback prevents minified code containing "$&" from being interpreted as a replacement token.
  return html.replace(pattern, () => content);
};

let html = replaceOnce(template, /\s*<script id="file-entry">[\s\S]*?<\/script>/, '');
html = replaceOnce(html, /<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}" />`);
html = replaceOnce(html, /<\/head>/, `    <style>${css}</style>\n  </head>`);
html = replaceOnce(html, /<script type="module" src="\/src\/main\.js"><\/script>/, `<script>${js}</script>`);
html = replaceOnce(html, /<\/body>/, `<script id="third-party-notices" type="text/plain">${notices}</script>\n  </body>`);

await writeFile(resolve(root, filename), html);
if (!templateMode) {
  await mkdir(resolve(root, 'dist'), { recursive: true });
  await writeFile(resolve(root, 'dist', filename), html);
}
console.log(`Standalone HTML: ${filename} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)${templateMode ? '' : ', also copied to dist/'}.`);
