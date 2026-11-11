/* ============================================================================
   NOVA VOLT · 商业企划案 Deck · deck.js
   ----------------------------------------------------------------------------
   职责：① 1920×1080 画布自适应缩放 ② 键盘/点击/锚点导航与进度
        ③ 点阵标题（dotmatrix.js，字体就绪后渲染，失败回落常规字体）④ 打印导出
   无依赖（除品牌 dotmatrix.js）；reduced-motion 下不做入场动画由 CSS 负责。
   ========================================================================== */

import { dotMatrixSVG } from './dotmatrix.js';

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const slides = [...document.querySelectorAll('.slide')];
const scaleEl = document.querySelector('.deck-scale');
const progressEl = document.querySelector('.deck-progress');
const prevBtn = document.querySelector('[data-nav="prev"]');
const nextBtn = document.querySelector('[data-nav="next"]');
const printBtn = document.querySelector('[data-nav="print"]');
const countEl = document.querySelector('[data-nav="count"]');
const dotsEl = document.querySelector('[data-nav="dots"]');

let current = 0;

/* ---------- ① 自适应缩放 ---------- */
function fit() {
  const s = Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H);
  scaleEl.style.transform = `scale(${s})`;
}

/* ---------- ② 导航 ---------- */
function render() {
  slides.forEach((el, i) => el.classList.toggle('is-active', i === current));
  const n = String(current + 1).padStart(2, '0');
  const total = String(slides.length).padStart(2, '0');
  countEl.textContent = `${n} / ${total}`;
  slides.forEach((el, i) => {
    const p = el.querySelector('[data-page]');
    if (p) p.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`;
  });
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  dotsEl.querySelectorAll('.nav-dot').forEach((d, i) => {
    d.classList.toggle('is-current', i === current);
    d.setAttribute('aria-current', i === current ? 'true' : 'false');
  });
  progressEl.style.width = `${((current + 1) / slides.length) * 100}%`;
  history.replaceState(null, '', `#${current + 1}`);
}

function goTo(i) {
  current = Math.max(0, Math.min(slides.length - 1, i));
  render();
}
const next = () => goTo(current + 1);
const prev = () => goTo(current - 1);

/* 圆点导航 */
dotsEl.innerHTML = slides
  .map((_, i) => `<button class="nav-dot" type="button" data-goto="${i}" aria-label="第 ${i + 1} 页"></button>`)
  .join('');
dotsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-goto]');
  if (btn) goTo(Number(btn.dataset.goto));
});

prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);
printBtn.addEventListener('click', () => window.print());

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  switch (e.key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ':
      e.preventDefault(); next(); break;
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault(); prev(); break;
    case 'Home':
      e.preventDefault(); goTo(0); break;
    case 'End':
      e.preventDefault(); goTo(slides.length - 1); break;
    default:
      if (/^[1-9]$/.test(e.key)) goTo(Number(e.key) - 1);
  }
});

/* 触屏 / 点击左右半屏翻页（避开导航与可交互元素） */
document.querySelector('.deck-stage').addEventListener('click', (e) => {
  if (e.target.closest('.deck-nav, a, button, details, summary')) return;
  const x = e.clientX / window.innerWidth;
  if (x > 0.66) next();
  else if (x < 0.33) prev();
});

/* ---------- ③ 点阵标题 ---------- */
function renderDotTitles() {
  document.querySelectorAll('[data-dotmatrix]').forEach((el, i) => {
    const text = el.dataset.dotmatrix;
    const H = Number(el.dataset.h || 140);
    const color = el.dataset.color || '#1A1A1A';
    const check = el.dataset.check !== 'off';
    try {
      const svg = dotMatrixSVG(text, {
        H,
        color,
        rows: /[\u3400-\u9FFF]/.test(text) ? 9 : 7,   // 中文 9 行 / 英文 7 行（品牌规则）
        font: '700 100px "Source Han Serif CN", "Noto Serif SC", serif',
        tracking: 0.02,
        threshold: 0.42,
        seed: 20261105 + i,
      });
      el.innerHTML = svg;
      el.querySelector('svg')?.setAttribute('aria-label', text);
      const fb = el.querySelector('.dot-fallback');
      if (fb) fb.style.display = 'none';
    } catch (err) {
      const fb = el.querySelector('.dot-fallback');
      if (fb) fb.style.display = 'block';
      if (check) console.warn('dotmatrix fallback:', err);
    }
  });
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(renderDotTitles);
} else {
  window.addEventListener('load', renderDotTitles);
}

/* ---------- ④ 启动 ---------- */
const startHash = Number(location.hash.replace('#', ''));
goTo(Number.isFinite(startHash) && startHash > 0 ? startHash - 1 : 0);
fit();
window.addEventListener('resize', fit);
window.addEventListener('hashchange', () => {
  const h = Number(location.hash.replace('#', ''));
  if (Number.isFinite(h) && h > 0 && h - 1 !== current) goTo(h - 1);
});
window.addEventListener('beforeprint', () => { scaleEl.style.transform = 'none'; });
window.addEventListener('afterprint', fit);
