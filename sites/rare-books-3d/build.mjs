/**
 * 构建产物落盘脚本（零依赖，node build.mjs 即可运行）
 *
 * 目录约定与 sites/weather-garden 一致：
 *   index.template.html   源码入口（Vite dev / build 的输入）
 *   index.html            构建产物入口（提交进仓库，画廊/本地双击直开）
 *   assets/               构建产物（hash 化的 js/css）
 *
 * 用法：
 *   node build.mjs --dev     把源码入口写回 index.html（给 vite dev 做 HMR）
 *   node build.mjs           把 dist/ 发布为仓库根下的 index.html + assets/
 *                             （在 vite build 之后运行）
 */
import { cpSync, existsSync, readdirSync, rmSync, statSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes('--dev');

if (dev) {
  copyFileSync(join(root, 'index.template.html'), join(root, 'index.html'));
  console.log('dev entry restored: index.html -> index.template.html');
  process.exit(0);
}

const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ 不存在：请先运行 vite build');
  process.exit(1);
}

// 清理上一轮产物，避免残留过期 hash 文件
rmSync(join(root, 'index.html'), { force: true });
rmSync(join(root, 'assets'), { recursive: true, force: true });

// Vite 按输入文件名输出 index.template.html，发布时改回约定的入口名 index.html
const OUTPUT_NAME = { 'index.template.html': 'index.html' };

for (const entry of readdirSync(dist)) {
  const from = join(dist, entry);
  const to = join(root, OUTPUT_NAME[entry] ?? entry);
  if (statSync(from).isDirectory()) cpSync(from, to, { recursive: true });
  else copyFileSync(from, to);
}
rmSync(dist, { recursive: true, force: true });

const assets = readdirSync(join(root, 'assets'));
console.log(`published: index.html + assets/ (${assets.join(', ')})`);
