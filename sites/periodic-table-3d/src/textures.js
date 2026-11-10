/* ============================================================================
   贴图层 — 全部 CanvasTexture 程序化生成（零外部贴图）
   元素格 / 辉光 / 列号条 / 占位格 / 分组标签 / 电子辉光
   ========================================================================== */
import * as THREE from 'three';
import { CATEGORIES } from './elements.js';
import { renderTheme, categoryColor, onThemeChange } from './theme.js';

const themedTextures = [];
function themeTexture(w, h, paint) {
  const { c, g } = ctx2d(w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const repaint = () => { g.clearRect(0, 0, w, h); paint(g); tex.needsUpdate = true; };
  repaint();
  themedTextures.push(repaint);
  return tex;
}
onThemeChange(() => themedTextures.forEach(repaint => repaint()));

const FONT_SYMBOL = '700 {s}px "Inter", "Helvetica Neue", Arial, sans-serif';
const FONT_MONO = '{s}px "PT Mono", "SFMono-Regular", ui-monospace, Menlo, monospace';
const FONT_CN = '{s}px "PingFang SC", "Noto Sans SC", "Source Han Sans SC", sans-serif';

function ctx2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d') };
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ---------- 元素格表面：符号 / 序数 / 中文名 / 原子量 ---------- */
export function drawTileArt(g, el, S) {
  const PAD = Math.round(S * 0.047);
  const theme = renderTheme(), col = categoryColor(el.category);
  const bg = g.createLinearGradient(0, 0, 0, S);
  bg.addColorStop(0, theme.tileTop);
  bg.addColorStop(1, theme.tileBottom);
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);

  const glow = g.createRadialGradient(S / 2, S * 0.62, S * 0.03, S / 2, S * 0.62, S * 0.62);
  glow.addColorStop(0, col + (theme.light ? '14' : '2E'));
  glow.addColorStop(1, col + '00');
  g.fillStyle = glow;
  g.fillRect(0, 0, S, S);

  g.strokeStyle = col + (theme.light ? '70' : 'CC');
  g.lineWidth = Math.max(1.5, S * 0.011);
  roundRect(g, PAD, PAD, S - PAD * 2, S - PAD * 2, S * 0.042);
  g.stroke();

  g.strokeStyle = col;
  g.lineWidth = Math.max(2, S * 0.014);
  const L = S * 0.068, o = PAD + S * 0.021;
  const corners = [[o, o, 1, 1], [S - o, o, -1, 1], [o, S - o, 1, -1], [S - o, S - o, -1, -1]];
  for (const [x, y, sx, sy] of corners) {
    g.beginPath();
    g.moveTo(x + sx * L, y); g.lineTo(x, y); g.lineTo(x, y + sy * L);
    g.stroke();
  }

  g.fillStyle = theme.secondary;
  g.font = FONT_MONO.replace('{s}', Math.round(S * 0.11));
  g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText(String(el.z), PAD + S * 0.052, PAD + S * 0.047);

  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = FONT_SYMBOL.replace('{s}', Math.round(S * 0.40));
  g.shadowColor = col; g.shadowBlur = theme.light ? 0 : S * 0.085;
  g.fillStyle = theme.light ? col : theme.text;
  g.fillText(el.symbol, S / 2, S * 0.47);
  g.shadowBlur = 0;

  g.textAlign = 'left'; g.textBaseline = 'bottom';
  g.font = FONT_CN.replace('{s}', Math.round(S * 0.11));
  g.fillStyle = theme.secondary;
  g.fillText(el.name, PAD + S * 0.052, S - PAD - S * 0.052);
  g.textAlign = 'right';
  g.font = FONT_MONO.replace('{s}', Math.round(S * 0.083));
  g.fillStyle = theme.muted;
  g.fillText(el.mass, S - PAD - S * 0.047, S - PAD - S * 0.057);
}

export function makeTileTexture(el) {
  const S = 192;
  const tex = themeTexture(S, S, g => drawTileArt(g, el, S));
  tex.anisotropy = 4;
  return tex;
}

/* ---------- 占位格（镧系/锕系拆行提示，不可交互） ---------- */
export function makePlaceholderTexture(ph) {
  const S = 192, PAD = 9;
  return themeTexture(S, S, g => {
    const theme = renderTheme();
    g.fillStyle = theme.placeholder;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = theme.border;
    g.lineWidth = 2;
    g.setLineDash([7, 6]);
    roundRect(g, PAD, PAD, S - PAD * 2, S - PAD * 2, 8);
    g.stroke();
    g.setLineDash([]);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = theme.placeholderText;
    g.font = FONT_MONO.replace('{s}', 26);
    g.fillText(ph.label, S / 2, S * 0.42);
    g.font = FONT_CN.replace('{s}', 20);
    g.fillStyle = theme.muted;
    g.fillText(ph.sub, S / 2, S * 0.60);
  });
}

/* ---------- 共享辉光贴图（格后径向光晕） ---------- */
export function makeGlowTexture() {
  const S = 128;
  const { c, g } = ctx2d(S, S);
  const rg = g.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  rg.addColorStop(0, 'rgba(255,255,255,0.9)');
  rg.addColorStop(0.35, 'rgba(255,255,255,0.32)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- 列号条 1–18（一张长条贴图，单次绘制） ---------- */
export function makeColumnStripTexture() {
  const W = 1536, H = 72;
  return themeTexture(W, H, g => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = FONT_MONO.replace('{s}', 30);
    g.fillStyle = renderTheme().column;
    for (let i = 1; i <= 18; i++) g.fillText(String(i), (i - 0.5) * (W / 18), H / 2);
  });
}

/* ---------- 分组标签（镧系/锕系行首） ---------- */
export function makeGroupLabelTexture(main, sub, category) {
  const W = 320, H = 110;
  return themeTexture(W, H, g => {
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = FONT_CN.replace('{s}', 40);
    g.fillStyle = renderTheme().secondary;
    g.fillText(main, 8, H * 0.38);
    g.font = FONT_MONO.replace('{s}', 20);
    g.fillStyle = categoryColor(category);
    g.fillText(sub, 10, H * 0.72);
  });
}

/* ---------- 电子辉光（ additive 精灵） ---------- */
export function makeElectronGlowTexture() {
  const S = 64;
  const { c, g } = ctx2d(S, S);
  const rg = g.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.3, 'rgba(140,255,224,0.55)');
  rg.addColorStop(1, 'rgba(140,255,224,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
