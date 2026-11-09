/* 构建：把 src/ 各模块 + three.js vendor 全部内联为单个 index.html
   —— 完全离线可用：双击即开，不依赖任何 CDN / 网络 / 本地服务 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(join(root, 'src', f), 'utf8');
const vendor = f => readFileSync(join(root, 'src', 'vendor', f), 'utf8');
const thirdPartyNotices = [vendor('LICENSE-three.txt'), vendor('OFL-PTMono.txt')].join('\n\n');
if (/<\/script/i.test(thirdPartyNotices)) throw new Error('Invalid text in dependency notices');

/* PT Mono 以 base64 data URI 内联（SIL OFL 1.1）：零网络请求也能保住品牌等宽字体 */
const FONT_FACE = `@font-face {
  font-family: 'PT Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(data:font/woff2;base64,${readFileSync(join(root, 'src', 'vendor', 'PTMono.woff2')).toString('base64')}) format('woff2');
}`;

/* ---------- three.js 内联变换 ---------- */
// three.module.js：唯一 export { ... }; → return { ... };，包进 IIFE 避免 1056 个顶层名污染
function inlineThree() {
  let code = vendor('three.module.js');
  if ((code.match(/^export\s*\{/gm) || []).length !== 1) {
    console.error('three.module.js export 结构不符合预期');
    process.exit(1);
  }
  code = code.replace(/^export\s*\{/m, 'return {');
  return `/* ===== three.js r160（内联，离线可用） ===== */\nwindow.THREE = (function () {\n'use strict';\n${code}\n})();`;
}

// OrbitControls.js：import {...} from 'three' → 从 window.THREE 解构；export → return
function inlineOrbitControls() {
  let code = vendor('OrbitControls.js');
  const importRe = /^import\s*\{([\s\S]*?)\}\s*from\s*'three';?\s*$/m;
  const m = code.match(importRe);
  if (!m) { console.error('OrbitControls.js import 结构不符合预期'); process.exit(1); }
  const names = m[1].split(',').map(s => s.trim()).filter(Boolean).join(', ');
  code = code.replace(importRe, `const { ${names} } = window.THREE;`);
  code = code.replace(/^export\s*\{\s*OrbitControls\s*\};?\s*$/m, 'return OrbitControls;');
  return `/* ===== OrbitControls r160（内联） ===== */\nwindow.OrbitControls = (function () {\n'use strict';\n${code}\n})();`;
}

/* ---------- 应用模块内联：去掉相对 import/export 与 three import ---------- */
function inline(code) {
  return code
    .replace(/^import\s+[^;]*?from\s+'\.\/[^']*';?\s*$/gm, '')
    .replace(/^import \* as THREE from 'three';?\s*$/gm, '')
    .replace(/^import\s+\{[^}]*\}\s*from\s*'three\/addons\/[^']*';?\s*$/gm, '')
    .replace(/^export\s+/gm, '')
    .trim();
}

const appModules = [
  ['数据层 · elements.js', 'elements.js'],
  ['主题层 · theme.js', 'theme.js'],
  ['贴图层 · textures.js', 'textures.js'],
  ['场景层 · scene.js', 'scene.js'],
  ['表格层 · table.js', 'table.js'],
  ['原子层 · atom.js', 'atom.js'],
  ['UI 层 · ui.js', 'ui.js'],
  ['降级层 · fallback2d.js', 'fallback2d.js'],
  ['主控层 · app.js', 'app.js'],
];

const bundle = [
  'const THREE = window.THREE;',
  'const OrbitControls = window.OrbitControls;',
  ...appModules.flatMap(([label, file]) => [`/* ===== ${label} ===== */`, inline(src(file))]),
].join('\n\n');

// 'three' 的 import 必须已全部剥离；只允许无 import/export 残留
const residue = bundle.match(/^(import|export)\s.+$/gm) || [];
if (residue.length) {
  console.error('构建失败：拼接后残留 import/export:\n' + residue.join('\n'));
  process.exit(1);
}

// 启动兜底：任何初始化异常都在加载层显示原因，而不是永远转圈
const guarded = `try {\n${bundle}\n} catch (err) {\n  console.error(err);\n  var __l = document.getElementById('loader');\n  if (__l) {\n    var __r = __l.querySelector('.ring'); if (__r) __r.style.animation = 'none';\n    var __t = __l.querySelector('.l-text');\n    if (__t) __t.textContent = '初始化失败 · ' + (err && err.message ? err.message : err);\n  }\n}`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>元素周期表 · 3D 原子图谱</title>
<script>
try {
  document.documentElement.dataset.theme = localStorage.getItem('elementa-theme') === 'light' ? 'light' : 'dark';
} catch { document.documentElement.dataset.theme = 'dark'; }
</script>
<style>
${FONT_FACE}
${src('styles.css')}
</style>
<script type="text/plain" id="third-party-notices">
${thirdPartyNotices}
</script>
</head>
<body>
<canvas id="scene" aria-label="3D 元素周期表"></canvas>

<header id="brand">
  <div class="title">元素周期表</div>
  <div class="en">ELEMENTA · ATOMIC ATLAS</div>
  <div class="meta">ELEMENTS 118 · Z 1—118 · SHELLS K–Q</div>
</header>

<div id="theme-switch" role="group" aria-label="外观主题">
  <button class="theme-option" type="button" data-theme-choice="light" aria-pressed="false">浅色</button>
  <button class="theme-option" type="button" data-theme-choice="dark" aria-pressed="true">暗色</button>
</div>

<div id="rotate-hint">建议横屏观看</div>
<div id="view-hint">拖拽旋转 · 滚轮缩放 · N 键切换核特写 · ESC 返回</div>
<div id="tooltip" role="status"></div>
<aside id="panel" aria-label="元素详情"></aside>
<div id="legend" aria-label="元素分类图例"></div>

<div id="loader">
  <div class="ring"></div>
  <div class="l-text">正在初始化 · INITIALIZING</div>
  <div class="l-sub">THREE.JS r160 · 118 ELEMENTS</div>
</div>

<script>
${inlineThree()}

${inlineOrbitControls()}

${guarded}
</script>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), html);
console.log(`index.html 生成完成（${(html.length / 1024).toFixed(0)} KB，全内联离线版）`);
