/* ============================================================================
 * StepFun Brand · 点阵风格化标题渲染器  (Stylized Display / Dot Matrix)
 * ----------------------------------------------------------------------------
 * 零依赖，输出 SVG 字符串。既可在浏览器运行，也可在 Node 里做无 canvas 的
 * 栅格化降级（内置 chunky 位图字形）。
 *
 * 几何规格（来源：《开发者风格手册》+ 官方样例实测复核）
 *   手册标注      MASTER RATIO  H : d = 5.69 : 1
 *   两处官方样例实测一致   P = 1.35 d   (gap = 0.35 d)
 *   通用公式      H_cap = d × (1 + pitchRatio × (R − 1))
 *   反解          d = H_cap / (1 + pitchRatio × (R − 1))
 *   安全区        四周各 0.5 H
 *
 *   H_cap      大写字高（光学高度）
 *   d          点径
 *   P          栅格间距（点中心距）
 *   R          点行数 —— 尺寸 + 语种挡位变量：
 *                英文 · 母版 / 中小尺寸    R = 5   （点粗，颗粒感强）
 *                英文 · 大标题（章节页级） R = 7   （点细，更精致）
 *                中文 · 任意尺寸           R = 9   （汉字笔画复杂，栅格不够密会丢结构）
 * ========================================================================== */

export const PITCH_RATIO = 1.35;   // P / d
export const GAP_RATIO   = 0.35;   // gap / d
export const MASTER_RATIO = 5.69;  // 手册标注 H : d（等价 R ≈ 4.5）

/* 点行数挡位 */
export const ROWS = { EN_MASTER: 5, EN_DISPLAY: 7, CN: 9 };

/* 默认禁则：文案长度上限 */
export const MAX_LENGTH = { enChars: 14, enWords: 2, cnChars: 6 };

/**
 * 按文案自动挑点行数：含 CJK → 9；纯英文且字数多 → 7；其余 → 5。
 * @param {string} text
 * @param {'master'|'large'|'auto'} mode
 */
export function rowsFor(text, mode = 'auto') {
  if (mode === 'master') return ROWS.EN_MASTER;
  if (mode === 'large') return ROWS.EN_DISPLAY;
  if (/[\u3400-\u9FFF\u3040-\u30FF]/.test(text)) return ROWS.CN;
  return /[A-Z]/.test(text) && text.length > 9 ? ROWS.EN_DISPLAY : ROWS.EN_MASTER;
}

/** 文案长度是否合法（手册"标题文字过长时不得应用"） */
export function checkLength(text) {
  const cn = (text.match(/[\u3400-\u9FFF\u3040-\u30FF]/g) || []).length;
  const enChars = (text.match(/[A-Za-z0-9]/g) || []).length;
  const enWords = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    ok: cn <= MAX_LENGTH.cnChars && enChars <= MAX_LENGTH.enChars && enWords <= MAX_LENGTH.enWords,
    cnChars: cn, enChars, enWords,
    limits: MAX_LENGTH
  };
}

/**
 * 由「大写字高 H_cap」与「点行数 R」反解全套几何参数。
 * @param {number} hCap  大写字高（光学高度），单位与输出画布一致
 * @param {number} rows  大写字高内的点行数，默认 5
 * @returns {{hCap:number,d:number,pitch:number,gap:number,rows:number,safe:number}}
 */
export function dotParams(hCap, rows = 5) {
  const r = Math.max(2, rows);
  const d = hCap / (1 + PITCH_RATIO * (r - 1));
  const pitch = d * PITCH_RATIO;
  return {
    hCap,
    rows: r,
    d,
    pitch,
    gap: d * GAP_RATIO,
    safe: hCap * 0.5            // 最小安全区域：四周各 0.5H
  };
}

/**
 * 按手册 MASTER RATIO 直接取点径（母版口径，等价 R≈4.5）。
 * @param {number} hCap
 */
export function dotParamsMasterRatio(hCap) {
  const d = hCap / MASTER_RATIO;
  const pitch = d * PITCH_RATIO;
  return { hCap, rows: (hCap / pitch).toFixed(2) * 1, d, pitch, gap: d * GAP_RATIO, safe: hCap * 0.5 };
}

/* ---------------------------------------------------------------------------
 * 1) 由位掩码生成点（纯函数，便于测试 / 服务端 / 无 canvas 环境）
 * ------------------------------------------------------------------------- */

/**
 * @param {(x:number,y:number)=>number} coverage 采样函数，返回 0..1 覆盖率
 * @param {number} cols 栅格列数
 * @param {number} rows 栅格行数
 * @param {object} o    选项
 * @returns {Array<{cx:number,cy:number,r:number}>}
 */
export function dotsFromCoverage(coverage, cols, rows, o = {}) {
  const pitch = o.pitch ?? 20;
  const d = o.d ?? pitch / PITCH_RATIO;
  const threshold = o.threshold ?? 0.45;
  const inkSpread = o.inkSpread ?? 0.06;
  const jitterGrid = o.jitterGrid ?? 0.8;
  const seed = o.seed ?? 20260814;
  const rnd = mulberry32(seed);

  const out = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const cv = coverage(gx, gy);
      if (cv < threshold) continue;
      // 油墨扩散：点径随覆盖度微调 + 随机抖动
      const spread = 1 + (rnd() - 0.5) * 2 * inkSpread;
      const r = (d / 2) * spread * (0.94 + 0.12 * Math.min(1, cv));
      // 栅格轻微错位（真实印刷的套色/落点误差）
      const jx = (rnd() - 0.5) * 2 * jitterGrid;
      const jy = (rnd() - 0.5) * 2 * jitterGrid;
      out.push({
        cx: gx * pitch + pitch / 2 + jx,
        cy: gy * pitch + pitch / 2 + jy,
        r: Math.max(0.4, r)
      });
    }
  }
  return out;
}

/** 由二值点阵（字符串数组，'#'/'.'）直接生成点 —— 无需任何字体 */
export function dotsFromBitmask(bitmap, o = {}) {
  const pitch = o.pitch ?? 20;
  const d = o.d ?? pitch / PITCH_RATIO;
  const rnd = mulberry32(o.seed ?? 7);
  const inkSpread = o.inkSpread ?? 0.06;
  const jitterGrid = o.jitterGrid ?? 0.8;
  const out = [];
  bitmap.forEach((line, gy) => {
    [...line].forEach((ch, gx) => {
      if (ch !== '#' && ch !== '1') return;
      const spread = 1 + (rnd() - 0.5) * 2 * inkSpread;
      out.push({
        cx: gx * pitch + pitch / 2 + (rnd() - 0.5) * 2 * jitterGrid,
        cy: gy * pitch + pitch / 2 + (rnd() - 0.5) * 2 * jitterGrid,
        r: (d / 2) * spread
      });
    });
  });
  return out;
}

/* ---------------------------------------------------------------------------
 * 2) 浏览器：用 canvas 栅格化任意文字（支持中文），再按栅格采样
 * ------------------------------------------------------------------------- */

/** 从 CSS font 简写里取出字号（px） */
export function fontPx(spec) {
  const m = String(spec).match(/(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : 100;
}
/** 替换 CSS font 简写里的字号 */
export function withPx(spec, px) {
  const s = String(spec);
  return /(\d+(?:\.\d+)?)px/.test(s)
    ? s.replace(/(\d+(?:\.\d+)?)px/, px.toFixed(4) + 'px')
    : `${px.toFixed(4)}px ${s}`;
}

/**
 * 把文字栅格化为覆盖率采样函数。仅在浏览器（document / OffscreenCanvas）中可用。
 *
 * ⚠️ 关键：`targetCap` 会先把**字号拟合到大写字高 = targetCap**，
 * 让字形与栅格同尺度。否则字形相对栅格过小 → 采样稀疏 → 点阵形不成字。
 */
export function makeTextCoverage(text, o = {}) {
  const spec0 = o.font ?? '700 100px Inter, "Source Han Sans SC", sans-serif';
  const tracking = o.tracking ?? 0;
  const pad = o.pad ?? 0.35;           // 四周留白（em）
  const targetCap = o.targetCap ?? 0;  // 0 = 沿用 spec 自带字号

  const mk = (w, h) => (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(w, h)
    : Object.assign(document.createElement('canvas'), { width: w, height: h });

  // --- 1. 把字号拟合到目标大写字高 ---
  const size0 = fontPx(spec0);
  const pm = mk(10, 10).getContext('2d');
  pm.font = spec0;
  const cap0 = pm.measureText('H').actualBoundingBoxAscent || size0 * 0.72;
  let size = targetCap > 0 ? size0 * (targetCap / cap0) : size0;

  // 二次校正（字体 ascent 与字号并非严格线性）
  const p2 = mk(10, 10).getContext('2d');
  p2.font = withPx(spec0, size);
  const cap1 = p2.measureText('H').actualBoundingBoxAscent || size * 0.72;
  if (targetCap > 0 && cap1 > 0) size *= targetCap / cap1;
  const specF = withPx(spec0, size);

  // --- 2. 正式绘制 ---
  const meas = mk(10, 10).getContext('2d');
  meas.font = specF;
  const chars = [...text];
  const trackPx = tracking * size;
  let width = 0;
  for (const ch of chars) width += meas.measureText(ch).width + trackPx;
  width -= trackPx;
  const capH = meas.measureText('H').actualBoundingBoxAscent || size * 0.72;
  const desc = meas.measureText('yp').actualBoundingBoxDescent || size * 0.22;
  const padPx = size * pad;

  const W = Math.ceil(width + padPx * 2);
  const H = Math.ceil(capH + desc + padPx * 2);
  const c = mk(W, H);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.font = specF;
  ctx.textBaseline = 'alphabetic';
  let x = padPx;
  const y = padPx + capH;
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + trackPx;
  }
  const img = ctx.getImageData(0, 0, W, H).data;

  return {
    width: W, height: H, fontSize: size, capHeight: capH, baselineY: y,
    ascent: capH, descent: desc,
    /** 返回该格点中心对应的覆盖率 0..1 */
    samplePx(px, py, box) {
      const x0 = Math.max(0, Math.round(px - box / 2));
      const x1 = Math.min(W, Math.round(px + box / 2));
      const y0 = Math.max(0, Math.round(py - box / 2));
      const y1 = Math.min(H, Math.round(py + box / 2));
      if (x1 <= x0 || y1 <= y0) return 0;
      let hit = 0, tot = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const a = img[(yy * W + xx) * 4 + 3];
          if (a > 100) hit++;
          tot++;
        }
      }
      return tot ? hit / tot : 0;
    }
  };
}

/* ---------------------------------------------------------------------------
 * 3) 主入口：生成 SVG
 * ------------------------------------------------------------------------- */

/**
 * @param {string} text  标题文案（英文建议 ≤2 词 / ≤14 字符；中文 ≤6 字符）
 * @param {object} opts
 *   H         大写字高（光学高度），必填
 *   rows      点行数：英文母版 5 / 英文大标题 7 / 中文 9。省略时按 rowsFor() 自动判定
 *   color     点色，默认 '#1A1A1A'
 *   font      canvas 字体（英文用 Inter / Source Han Sans，中文用思源黑体 Bold）
 *   tracking  字间距（em），英文大写建议 0.08，中文 0.02
 *   threshold 覆盖率阈值，默认 0.45（英文 0.42，中文 0.50）
 *   inkSpread 油墨扩散，默认 0.06
 *   misregister 套色错位（画布单位），默认 0.5
 *   jitterGrid  栅格轻微错位，默认 0.8
 *   className / ariaLabel / idPrefix
 * @returns {string} SVG 字符串
 */
export function dotMatrixSVG(text, opts = {}) {
  const H = opts.H ?? 107;
  const rows = opts.rows ?? rowsFor(text, opts.mode);
  const geo = dotParams(H, rows);
  const pitch = geo.pitch;
  const d = geo.d;
  const isCJK = /[\u3400-\u9FFF\u3040-\u30FF]/.test(text);
  const threshold = opts.threshold ?? (isCJK ? 0.50 : 0.45);
  const inkSpread = opts.inkSpread ?? 0.06;
  const misregister = opts.misregister ?? 0.5;
  const jitterGrid = opts.jitterGrid ?? 0.8;
  const color = opts.color ?? '#1A1A1A';
  const font = opts.font ?? '700 100px Inter, "Source Han Sans SC", sans-serif';
  const tracking = opts.tracking ?? (isCJK ? 0.02 : 0.06);

  let dots = [];
  let vbW = 0, vbH = 0;

  if (opts.bitmap) {
    // 无字体环境：直接给二值点阵
    const cols = opts.bitmap[0].length;
    dots = dotsFromBitmask(opts.bitmap, { pitch, d, inkSpread, jitterGrid, seed: opts.seed });
    vbW = cols * pitch;
    vbH = opts.bitmap.length * pitch;
  } else {
    const cov = makeTextCoverage(text, { font, tracking, targetCap: H });
    const cols = Math.ceil(cov.width / pitch);
    const rws = Math.ceil(cov.height / pitch);
    const box = pitch;   // 采样盒 = 一个栅格
    dots = dotsFromCoverage(
      (gx, gy) => cov.samplePx(gx * pitch + pitch / 2, gy * pitch + pitch / 2, box),
      cols, rws,
      { pitch, d, threshold, inkSpread, jitterGrid, seed: opts.seed }
    );
    vbW = cols * pitch;
    vbH = rws * pitch;
  }

  // 套色错位：整层微移
  const shift = misregister;

  const circles = dots
    .map(p => `<circle cx="${(p.cx + shift).toFixed(2)}" cy="${(p.cy + shift * 0.5).toFixed(2)}" r="${p.r.toFixed(2)}"/>`)
    .join('');

  const pad = geo.safe;   // 视觉上把安全区留在 viewBox 外时由调用方处理
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}"` +
    (opts.className ? ` class="${opts.className}"` : '') +
    ` role="img" aria-label="${escapeAttr(opts.ariaLabel ?? text)}"` +
    ` preserveAspectRatio="xMidYMid meet" fill="${color}">` +
    `<title>${escapeAttr(text)}</title>` +
    circles +
    `</svg>`;
}

/* ---------------------------------------------------------------------------
 * 4) 便捷：直接从文案 + 目标宽度，算出建议 H 与 rows
 * ------------------------------------------------------------------------- */
export function suggestScale(charCount, targetWidth, opts = {}) {
  // 点阵下每个字符约占 1.15 个点宽的栅格
  const perChar = opts.perChar ?? 5.2;          // 栅格列数/字符（粗点阵字形约 5 列）
  const cols = Math.max(1, charCount * perChar);
  const pitch = targetWidth / cols;
  const rows = opts.rows ?? 5;
  const d = pitch / PITCH_RATIO;
  const hCap = d * (1 + PITCH_RATIO * (rows - 1));
  return { pitch, d, hCap, rows, safe: hCap * 0.5 };
}

/* ---------------------------- 工具函数 ---------------------------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------------------------- 使用示例 ---------------------------------- *
 *
 * import { dotMatrixSVG, dotParams, suggestScale, rowsFor, checkLength } from './dotmatrix.js';
 *
 * // A. 已知光学高度（英文大标题挡）
 * dotParams(128, 7);                  // → d≈14.07, pitch≈18.99, safe=64
 * const svg = dotMatrixSVG('STEPFUN', {
 *   H: 128, rows: 7, color: '#1A1A1A',
 *   font: '700 100px Inter, "Source Han Sans SC", sans-serif',
 *   tracking: 0.08, threshold: 0.42,
 *   inkSpread: 0.06, misregister: 0.5, jitterGrid: 0.8
 * });
 *
 * // B. 已知可用宽度（自适应）
 * const s = suggestScale('STEPFUN'.length, 940);   // → 合适的 hCap
 * dotMatrixSVG('STEPFUN', { H: s.hCap, rows: s.rows });
 *
 * // C. 深色章节页（英文大标题 → R=7）
 * dotMatrixSVG('ColorSystem', {
 *   H: 128, rows: 7, color: '#F7F7F7',
 *   font: '700 100px Lora, Inter, serif', tracking: 0.02
 * });
 *
 * // D. 中文（自动切 R=9 + 阈值 0.50 + tracking 0.02）
 * rowsFor('标题文案');                // → 9
 * dotMatrixSVG('标题文案', {
 *   H: 79, color: '#1A1A1A',
 *   font: '700 100px "Source Han Sans SC", sans-serif'
 * });
 *
 * // E. 交付前拦截"文案过长"
 * checkLength('SCALE UP POSSIBILITIES FOR EVERYONE');  // → { ok:false, ... }
 * ---------------------------------------------------------------------- */
