/**
 * 程序化羊皮纸 / 星座图纹理（Canvas 绘制，零外部资源）
 * ─────────────────────────────────────────────────────────────
 * - createParchmentTexture：书页基底的粗糙纸面（纤维、霉斑、边缘晕影），
 *   同时产出 map 与 roughnessMap，让 MeshStandardMaterial 有纸质感。
 * - createConstellationTexture：图版层的「技术线框」层（黑/银/白）——
 *   透明背景 + 深褐色墨线，配合 Three.MultiplyBlending 叠在书页上，
 *   透明处不影响纸面，墨线处相乘变暗，达到「数字文字与古籍纹理融为一体」。
 */
import * as THREE from 'three';
import type { Book } from '../types';
import { hashString, mulberry32 } from '../lib/prng';

function canvas2d(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** 羊皮纸基底：摊开双页（中间为书脊） */
export function createParchmentTexture(w = 1024, h = 512, seed = 'parchment'): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(w, h);
  const rng = mulberry32(hashString(seed));

  // 1) 底色：暖奶油 → 边缘焦黄
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#efe2c4');
  base.addColorStop(0.5, '#e7d8b6');
  base.addColorStop(1, '#ddc9a2');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // 2) 纸纤维：细短随机划痕
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const len = 2 + rng() * 9;
    const ang = (rng() - 0.5) * 0.5;
    ctx.strokeStyle = rng() > 0.5 ? '#8a7448' : '#fff8e6';
    ctx.lineWidth = rng() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 3) 霉斑 / 水渍（foxing）
  for (let i = 0; i < 46; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 4 + rng() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(150, 116, 62, ${0.05 + rng() * 0.09})`);
    g.addColorStop(1, 'rgba(150, 116, 62, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4) 书脊压暗 + 装订线
  const spine = ctx.createLinearGradient(w / 2 - 26, 0, w / 2 + 26, 0);
  spine.addColorStop(0, 'rgba(96, 72, 40, 0)');
  spine.addColorStop(0.5, 'rgba(96, 72, 40, 0.42)');
  spine.addColorStop(1, 'rgba(96, 72, 40, 0)');
  ctx.fillStyle = spine;
  ctx.fillRect(w / 2 - 26, 0, 52, h);
  ctx.strokeStyle = 'rgba(70, 52, 28, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w / 2, 6);
  ctx.lineTo(w / 2, h - 6);
  ctx.stroke();

  // 5) 四缘晕影
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
  vig.addColorStop(0, 'rgba(90, 66, 34, 0)');
  vig.addColorStop(1, 'rgba(90, 66, 34, 0.3)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  return toTexture(canvas);
}

/** 同源的粗糙度图（纤维越密越粗糙） */
export function createParchmentRoughnessTexture(w = 512, h = 256, seed = 'parchment'): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(w, h);
  const rng = mulberry32(hashString(seed) ^ 0x9e37);
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = rng() > 0.5 ? '#9a9a9a' : '#ffffff';
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 3, 1);
  }
  ctx.globalAlpha = 1;
  return toTexture(canvas, false);
}

/**
 * 空灵气韵的星图线框（淡墨 / 银 / 白，强调留白与光感）
 * ─────────────────────────────────────────────────────────────
 * 设计原则：淡（石墨灰而非浓黑）、细（1.4px 级）、疏（网格 4×2、去掉刻度与装饰环）、
 * 透（大面积低 alpha 留白），再加一层中央柔光把图版「托亮」。
 *
 * ⚠️ 透明底 + 常规 alpha 混合：Multiply 只能压暗，表达不了白色柔光。
 */
export function createConstellationTexture(book: Book, w = 512, h = 256): THREE.CanvasTexture {
  const { canvas, ctx } = canvas2d(w, h);
  const rng = mulberry32(hashString(book.id));

  ctx.clearRect(0, 0, w, h);

  const INK = 'rgba(78, 73, 66, '; //       淡墨（石墨灰）：结构线 / 文字
  const SILVER = 'rgba(176, 180, 188, '; //  银：网格 / 星点光晕
  const WHITE = 'rgba(255, 255, 255, '; //   白：星点核心 / 中央柔光

  // ① 中央柔光：把图版从纸面上轻轻托亮（空灵的光感来源）
  const glow = ctx.createRadialGradient(w / 2, h * 0.48, 0, w / 2, h * 0.48, Math.min(w, h) * 0.62);
  glow.addColorStop(0, WHITE + '0.16)');
  glow.addColorStop(0.45, WHITE + '0.07)');
  glow.addColorStop(1, WHITE + '0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // ② 极淡的纸面压深（四缘），形成「纸上光斑」的层次
  const shade = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  shade.addColorStop(0, 'rgba(120, 96, 62, 0)');
  shade.addColorStop(1, 'rgba(84, 62, 32, 0.2)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ③ 单线细框（淡墨），不再用双线 + 刻度 + 角饰
  const m = Math.round(w * 0.055);
  ctx.strokeStyle = INK + '0.46)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);

  // ④ 稀疏坐标网格（4×2，银，极淡）——只作方位暗示，不抢主体
  const gx0 = m + 6;
  const gy0 = m + 6;
  const gw = w - (m + 6) * 2;
  const gh = h - (m + 6) * 2;
  ctx.strokeStyle = SILVER + '0.2)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const x = gx0 + (gw * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, gy0);
    ctx.lineTo(x, gy0 + gh);
    ctx.stroke();
  }
  for (let i = 1; i < 2; i++) {
    const y = gy0 + (gh * i) / 2;
    ctx.beginPath();
    ctx.moveTo(gx0, y);
    ctx.lineTo(gx0 + gw, y);
    ctx.stroke();
  }

  // ⑤ 星座：淡墨细线，星点数量减少、分布更疏
  const drawConstellation = (cx: number, cy: number, radius: number) => {
    const n = 5 + Math.floor(rng() * 3);
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const r = radius * (0.3 + 0.7 * Math.sqrt(rng()));
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, rng()]);
    }
    const order = [...pts].sort((p, q) => p[2] - q[2]);
    ctx.strokeStyle = INK + '0.56)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    order.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();
    return pts;
  };

  const leftPts = drawConstellation(w * 0.29, h * 0.47, Math.min(w, h) * 0.34);
  const rightPts = drawConstellation(w * 0.71, h * 0.53, Math.min(w, h) * 0.3);

  // ⑥ 星点：大而淡的银色柔光 + 小白色核心（几乎不加黑，避免发「脏」）
  const drawStar = (x: number, y: number, mag: number) => {
    const r = 2.6 + mag * 3.2;
    // 柔光晕：两层径向渐变，外大内小
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
    g.addColorStop(0, SILVER + '0.4)');
    g.addColorStop(0.35, SILVER + '0.14)');
    g.addColorStop(1, SILVER + '0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.4, 0, Math.PI * 2);
    ctx.fill();
    // 白色核心：收锐 + 提亮，读作「星点」而非文字笔画
    ctx.fillStyle = WHITE + '0.98)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  };
  [...leftPts, ...rightPts].forEach(([x, y, mag]) => drawStar(x, y, mag));

  // ⑦ 跨页「中天」虚线（银，极淡）
  const brightest = (pts: Array<[number, number, number]>) => pts.reduce((a, b) => (a[2] < b[2] ? a : b));
  ctx.strokeStyle = SILVER + '0.34)';
  ctx.setLineDash([3, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(brightest(leftPts)[0], brightest(leftPts)[1]);
  ctx.lineTo(brightest(rightPts)[0], brightest(rightPts)[1]);
  ctx.stroke();
  ctx.setLineDash([]);

  // ⑧ 标注：淡墨标题 + 银副标，字距放宽、降低存在感
  ctx.textAlign = 'center';
  // 文字：加深加大 —— 与「发光星点」在明度上明确分层（星=亮，字=沉）
  ctx.fillStyle = INK + '0.88)';
  ctx.font = `bold ${Math.round(h * 0.072)}px Georgia, "Times New Roman", serif`;
  ctx.fillText(book.titleEn.toUpperCase().slice(0, 22), w * 0.5, h * 0.2);

  ctx.font = `italic ${Math.round(h * 0.05)}px Georgia, serif`;
  ctx.fillStyle = 'rgba(96, 88, 74, 0.85)';
  ctx.fillText(`TABULA ${book.year.replace(/[^0-9]/g, '') || '----'}`, w * 0.5, h * 0.88);

  return toTexture(canvas);
}
