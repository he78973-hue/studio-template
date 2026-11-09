/* ============================================================================
   UI 层 — HTML 覆盖层：详情面板 / 图例 / 信息卡 / 按钮 / 加载态
   风格：StepFun 品牌深色主题 · mono 元数据 · 发丝线 · 无投影
   ========================================================================== */
import { CATEGORIES, CATEGORY_ORDER, SHELL_LABELS } from './elements.js';
import { categoryColor, onThemeChange } from './theme.js';

const $ = s => document.querySelector(s);

export const ui = {
  panel: $('#panel'), tooltip: $('#tooltip'), legend: $('#legend'),
  loader: $('#loader'), scene: $('#scene'),
};

/* ---------- 详情面板 ---------- */
export function renderPanel(el) {
  const cat = CATEGORIES[el.category];
  const shells = el.shells.map((n, i) => `${SHELL_LABELS[i]} ${n}`).join(' · ');
  ui.panel.innerHTML = `
    <div class="p-head">
      <div class="p-symbol">${el.symbol}</div>
      <div>
        <div class="p-name">${el.name}</div>
        <div class="p-en">${el.symbol} · No.${el.z}</div>
      </div>
    </div>
    <hr class="p-hairline">
    <div class="p-row"><span class="p-key">原子序数 Z</span><span class="p-val">${el.z}</span></div>
    <div class="p-row"><span class="p-key">相对原子质量</span><span class="p-val">${el.mass}</span></div>
    <div class="p-row"><span class="p-key">电子排布</span><span class="p-val p-shells">${shells}</span></div>
    <div class="p-row"><span class="p-key">分类</span>
      <span class="p-cat"><span class="p-dot" style="--dot:${categoryColor(el.category)}"></span><span class="p-cat-name">${cat.cn}</span></span>
    </div>
    <div class="p-actions">
      <button class="btn" id="btn-nucleus" type="button">原子核特写 · NUCLEUS</button>
      <button class="btn" id="btn-back" type="button">← 返回周期表 · BACK <span class="kbd">ESC</span></button>
    </div>`;
  ui.panel.dataset.category = el.category;
  ui.panel.style.setProperty('--dot', categoryColor(el.category));
  $('#btn-back').addEventListener('click', () => window.__ptExitAtom && window.__ptExitAtom());
  $('#btn-nucleus').addEventListener('click', () => window.__ptToggleNucleus && window.__ptToggleNucleus());
  return { cat };
}

export function showPanel(show) { ui.panel.classList.toggle('show', show); }

/* ---------- 底部分类图例 ---------- */
export function buildLegend() {
  ui.legend.innerHTML = CATEGORY_ORDER.map(k => {
    const c = CATEGORIES[k];
    return `<span class="lg-item" data-cat="${k}"><span class="lg-dot" style="--dot:${categoryColor(k)}"></span><span class="lg-name">${c.cn}</span></span>`;
  }).join('');
}
export function showLegend(show, activeCat) {
  ui.legend.classList.toggle('show', show);
  ui.legend.querySelectorAll('.lg-item').forEach(item => {
    item.classList.toggle('active', !!activeCat && item.dataset.cat === activeCat);
  });
}

onThemeChange(() => {
  ui.legend.querySelectorAll('[data-cat]').forEach(item => {
    item.querySelector('.lg-dot').style.setProperty('--dot', categoryColor(item.dataset.cat));
  });
  const category = ui.panel.dataset.category;
  if (category) {
    ui.panel.style.setProperty('--dot', categoryColor(category));
    ui.panel.querySelector('.p-dot')?.style.setProperty('--dot', categoryColor(category));
  }
});

/* ---------- hover 信息卡 ---------- */
export function showTooltip(el, x, y) {
  ui.tooltip.innerHTML = `
    <div class="t-sym">${el.symbol}</div>
    <div class="t-name">${el.name}</div>
    <div class="t-z">Z ${el.z} · A ${el.mass}</div>`;
  ui.tooltip.classList.add('show');
  moveTooltip(x, y);
}
export function moveTooltip(x, y) {
  const r = ui.tooltip.getBoundingClientRect();
  const nx = Math.min(x + 16, window.innerWidth - r.width - 10);
  const ny = Math.min(y + 16, window.innerHeight - r.height - 10);
  ui.tooltip.style.left = nx + 'px';
  ui.tooltip.style.top = ny + 'px';
}
export function hideTooltip() { ui.tooltip.classList.remove('show'); }

/* ---------- 加载态 ---------- */
export function hideLoader() {
  ui.loader.classList.add('done');
  setTimeout(() => { ui.loader.style.display = 'none'; }, 280);
}

/* ---------- 视图切换（body class 驱动 CSS） ---------- */
export function setView(isAtom) {
  document.body.classList.toggle('atom-view', isAtom);
  ui.scene.classList.toggle('atom', isAtom);
}
