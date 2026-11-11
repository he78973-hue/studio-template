// 双坐标傅里叶圆链 — 数学验证脚本（node）
// 输入: ref/bird.svg 的单闭合鹈鹕外轮廓（含双脚）
// 输出: 弧长等距采样点、实数傅里叶系数、各 N 的重建误差、布局所需的链条幅度数据
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_FILE = process.argv[2] ?? join(ROOT, 'ref/bird.svg');
const M = 2048;          // 弧长等距采样点数
const KMAX = 50;         // 最高谐波阶数

// ---------- 1. 提取外轮廓子路径 ----------
const svg = readFileSync(SVG_FILE, 'utf8');
const dMatch = svg.match(/\sd="([^"]+)"/);
if (!dMatch) throw new Error('no path d found');
const dAll = dMatch[1];
// 子路径在 M/m 处切开；第一个子路径即外轮廓（第二个是眼睛内孔，单闭合轮廓不含内孔）
const parts = dAll.split(/(?=[Mm])/).filter(s => s.trim().length);
const d = parts[0];
console.log(`子路径数: ${parts.length}（取第 1 个外轮廓，长度 ${d.length} 字符）`);

// ---------- 2. SVG path 词法 + 扁平化 ----------
function tokenize(d) {
  const out = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
  let m;
  while ((m = re.exec(d))) out.push(m[1] ?? parseFloat(m[2]));
  return out;
}

function flatten(d, subdiv = 64) {
  const t = tokenize(d);
  const subpaths = [];
  let cur = null, cx = 0, cy = 0, startX = 0, startY = 0, prevCtrl = null, cmd = null;
  const cubicAt = (p0, p1, p2, p3, u) => {
    const v = 1 - u;
    return [
      v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
      v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
    ];
  };
  let i = 0;
  const num = () => t[i++];
  while (i < t.length) {
    const c = t[i++];
    if (typeof c === 'number') throw new Error('expected command, got number ' + c);
    cmd = c;
    if (c === 'M' || c === 'm') {
      let x = num(), y = num();
      if (c === 'm') { x += cx; y += cy; }
      if (cur && cur.length > 1) subpaths.push(cur);
      cur = [[x, y]]; cx = x; cy = y; startX = x; startY = y; prevCtrl = null;
      // 隐式后续坐标对按 L 处理
      while (i < t.length && typeof t[i] === 'number') {
        let lx = num(), ly = num();
        if (c === 'm') { lx += cx; ly += cy; }
        cur.push([lx, ly]); cx = lx; cy = ly;
      }
      prevCtrl = null;
    } else if (c === 'L' || c === 'l') {
      while (i < t.length && typeof t[i] === 'number') {
        let x = num(), y = num();
        if (c === 'l') { x += cx; y += cy; }
        cur.push([x, y]); cx = x; cy = y; prevCtrl = null;
      }
    } else if (c === 'C' || c === 'c') {
      while (i + 5 < t.length + 1 && typeof t[i] === 'number') {
        let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
        if (c === 'c') { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
        const p0 = [cx, cy], p1 = [x1, y1], p2 = [x2, y2], p3 = [x, y];
        for (let s = 1; s <= subdiv; s++) cur.push(cubicAt(p0, p1, p2, p3, s / subdiv));
        cx = x; cy = y; prevCtrl = [x2, y2];
      }
    } else if (c === 'S' || c === 's') {
      while (typeof t[i] === 'number') {
        let x2 = num(), y2 = num(), x = num(), y = num();
        if (c === 's') { x2 += cx; y2 += cy; x += cx; y += cy; }
        const p1 = prevCtrl ? [2 * cx - prevCtrl[0], 2 * cy - prevCtrl[1]] : [cx, cy];
        const p0 = [cx, cy], p2 = [x2, y2], p3 = [x, y];
        for (let s = 1; s <= subdiv; s++) cur.push(cubicAt(p0, p1, p2, p3, s / subdiv));
        cx = x; cy = y; prevCtrl = [x2, y2];
      }
    } else if (c === 'Z' || c === 'z') {
      if (cx !== startX || cy !== startY) cur.push([startX, startY]);
      cx = startX; cy = startY; prevCtrl = null;
      if (cur && cur.length > 1) subpaths.push(cur);
      cur = null;
    } else {
      throw new Error('unsupported command: ' + c);
    }
  }
  if (cur && cur.length > 1) subpaths.push(cur);
  return subpaths;
}

const subpaths = flatten(d);
const poly = subpaths[0];
console.log(`扁平化点数: ${poly.length}`);

// ---------- 3. 弧长等距重采样 ----------
function resample(poly, M) {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    const dx = poly[i][0] - poly[i - 1][0], dy = poly[i][1] - poly[i - 1][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const total = cum[cum.length - 1];
  const pts = new Array(M);
  let j = 0;
  for (let k = 0; k < M; k++) {
    const s = (k / M) * total;
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const segLen = cum[j + 1] - cum[j] || 1;
    const u = (s - cum[j]) / segLen;
    pts[k] = [
      poly[j][0] + (poly[j + 1][0] - poly[j][0]) * u,
      poly[j][1] + (poly[j + 1][1] - poly[j][1]) * u,
    ];
  }
  return { pts, total };
}

const { pts: P, total } = resample(poly, M);
console.log(`轮廓周长: ${total.toFixed(1)} px，采样间距: ${(total / M).toFixed(3)} px`);

// ---------- 4. 实数傅里叶系数（x, y 各自独立） ----------
// x(t) = ax0 + Σ_{k=1..K} [axk·cos(2πkt) + bxk·sin(2πkt)]
const COS = [], SIN = [];
for (let k = 0; k <= KMAX; k++) {
  const c = new Float64Array(M), s = new Float64Array(M);
  for (let i = 0; i < M; i++) {
    const a = (2 * Math.PI * k * i) / M;
    c[i] = Math.cos(a); s[i] = Math.sin(a);
  }
  COS.push(c); SIN.push(s);
}
function dft(vals) {
  let a0 = 0;
  for (let i = 0; i < M; i++) a0 += vals[i];
  a0 /= M;
  const coefs = [];
  for (let k = 1; k <= KMAX; k++) {
    let a = 0, b = 0;
    for (let i = 0; i < M; i++) { a += vals[i] * COS[k][i]; b += vals[i] * SIN[k][i]; }
    coefs.push({ k, a: (2 / M) * a, b: (2 / M) * b });
  }
  return { a0, coefs };
}
const X = P.map(p => p[0]), Y = P.map(p => p[1]);
const FX = dft(X), FY = dft(Y);

// ---------- 5. 重建 + 误差 ----------
const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
const height = ymax - ymin, width = xmax - xmin;
console.log(`轮廓包围盒: w=${width.toFixed(1)} h=${height.toFixed(1)}，归一化基准=高度 ${height.toFixed(1)}`);

function reconstruct(N, t) {
  let x = FX.a0, y = FY.a0;
  for (let k = 1; k <= N; k++) {
    const ang = 2 * Math.PI * k * t;
    const c = Math.cos(ang), s = Math.sin(ang);
    x += FX.coefs[k - 1].a * c + FX.coefs[k - 1].b * s;
    y += FY.coefs[k - 1].a * c + FY.coefs[k - 1].b * s;
  }
  return [x, y];
}

// 误差口径: 同一等弧长参数 t_i 下，重建点 P'(t_i) 与原采样点 P(t_i) 的二维欧氏距离 RMS，
// 除以原轮廓包围盒高度，化为百分比。
function rmsError(N) {
  let acc = 0;
  for (let i = 0; i < M; i++) {
    const [rx, ry] = reconstruct(N, i / M);
    acc += (rx - xs[i]) ** 2 + (ry - ys[i]) ** 2;
  }
  return Math.sqrt(acc / M) / height * 100;
}

console.log('\nN     error%    Σr_x    Σr_y    max|Qx|   max|Qy|   重建bbox');
const report = [];
let prevErr = Infinity;
for (const N of [1, 5, 10, 20, 50]) {
  const err = rmsError(N);
  let srX = 0, srY = 0, maxQX = 0, maxQY = 0;
  for (let k = 1; k <= N; k++) {
    srX += Math.hypot(FX.coefs[k - 1].a, FX.coefs[k - 1].b);
    srY += Math.hypot(FY.coefs[k - 1].a, FY.coefs[k - 1].b);
  }
  for (let i = 0; i < M; i++) {
    const t = i / M;
    let qx = 0, qy = 0;
    for (let k = 1; k <= N; k++) {
      const ang = 2 * Math.PI * k * t, c = Math.cos(ang), s = Math.sin(ang);
      qx += FX.coefs[k - 1].a * s - FX.coefs[k - 1].b * c;
      qy += FY.coefs[k - 1].a * s - FY.coefs[k - 1].b * c;
    }
    maxQX = Math.max(maxQX, Math.abs(qx));
    maxQY = Math.max(maxQY, Math.abs(qy));
  }
  let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
  for (let i = 0; i < M; i++) {
    const [rx, ry] = reconstruct(N, i / M);
    bx0 = Math.min(bx0, rx); bx1 = Math.max(bx1, rx);
    by0 = Math.min(by0, ry); by1 = Math.max(by1, ry);
  }
  const mono = err <= prevErr + 1e-9;
  prevErr = err;
  console.log(
    `${String(N).padEnd(5)} ${err.toFixed(3).padStart(7)}% ${srX.toFixed(1).padStart(7)} ${srY.toFixed(1).padStart(7)} ` +
    `${maxQX.toFixed(1).padStart(8)} ${maxQY.toFixed(1).padStart(8)}   ${(bx1 - bx0).toFixed(0)}×${(by1 - by0).toFixed(0)}` +
    (mono ? '' : '  ← 误差非单调!')
  );
  report.push({ N, err, srX, srY, maxQX, maxQY });
}

// 圆链实际包围盒（用于版面布局）：每个圆的圆心=前 k-1 个向量之和，半径=r_k
function chainBBox(N) {
  const bb = { x: { g: [Infinity, -Infinity], y: [Infinity, -Infinity] } };
  for (const axis of ['x', 'y']) {
    const F = axis === 'x' ? FX : FY;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < 720; i++) {
      const t = i / 720;
      let px = 0, py = 0; // 相对锚点的部分和
      for (let k = 1; k <= N; k++) {
        const ang = 2 * Math.PI * k * t, c = Math.cos(ang), s = Math.sin(ang);
        const r = Math.hypot(F.coefs[k - 1].a, F.coefs[k - 1].b);
        // 圆心 = (px,py)，圆半径 r
        x0 = Math.min(x0, px - r); x1 = Math.max(x1, px + r);
        y0 = Math.min(y0, py - r); y1 = Math.max(y1, py + r);
        px += F.coefs[k - 1].a * c + F.coefs[k - 1].b * s;
        py += F.coefs[k - 1].a * s - F.coefs[k - 1].b * c;
      }
    }
    bb[axis] = { g: [x0, x1], q: [y0, y1] };
  }
  return bb;
}
console.log('\n圆链包围盒（相对锚点，未缩放）:');
for (const N of [1, 5, 10, 20, 50]) {
  const b = chainBBox(N);
  console.log(`N=${String(N).padEnd(3)} x链: x∈[${b.x.g[0].toFixed(0)}, ${b.x.g[1].toFixed(0)}] (宽${(b.x.g[1] - b.x.g[0]).toFixed(0)}) y∈[${b.x.q[0].toFixed(0)}, ${b.x.q[1].toFixed(0)}] (高${(b.x.q[1] - b.x.q[0]).toFixed(0)}) | y链: x∈[${b.y.g[0].toFixed(0)}, ${b.y.g[1].toFixed(0)}] (宽${(b.y.g[1] - b.y.g[0]).toFixed(0)}) y∈[${b.y.q[0].toFixed(0)}, ${b.y.q[1].toFixed(0)}] (高${(b.y.q[1] - b.y.q[0]).toFixed(0)})`);
}

// N=1 必须是椭圆（一阶谐波必然是椭圆）；报告其轴比
{
  const c = FX.coefs[0], d2 = FY.coefs[0];
  const ux = [c.a, c.b], uy = [d2.a, d2.b];
  const m11 = ux[0] * ux[0] + ux[1] * ux[1], m22 = uy[0] * uy[0] + uy[1] * uy[1], m12 = ux[0] * uy[0] + ux[1] * uy[1];
  const tr = m11 + m22, det = m11 * m22 - m12 * m12;
  const l1 = (tr + Math.sqrt(Math.max(0, tr * tr - 4 * det))) / 2, l2 = (tr - Math.sqrt(Math.max(0, tr * tr - 4 * det))) / 2;
  console.log(`\nN=1 椭圆半轴: ${Math.sqrt(l1).toFixed(1)} / ${Math.sqrt(l2).toFixed(1)}（轴比 ${(Math.sqrt(l1) / Math.sqrt(l2)).toFixed(2)}）`);
}

// 点误差分布：RMS 之外，报告最大点误差及其位置（t=0 起点）
for (const N of [1, 5, 10, 20, 50]) {
  let maxD = 0, maxI = 0;
  for (let i = 0; i < M; i++) {
    const [rx, ry] = reconstruct(N, i / M);
    const dd = Math.hypot(rx - xs[i], ry - ys[i]);
    if (dd > maxD) { maxD = dd; maxI = i; }
  }
  const [rx0, ry0] = reconstruct(N, 0);
  console.log(`N=${String(N).padEnd(3)} 最大点误差 ${maxD.toFixed(2)}px @i=${maxI}（t=${(maxI / M).toFixed(3)}）· t=0 重建 (${rx0.toFixed(1)}, ${ry0.toFixed(1)}) vs 采样0 (${xs[0].toFixed(1)}, ${ys[0].toFixed(1)})`);
}

// ---------- 6. 输出数据 + 预览 SVG ----------
mkdirSync(join(ROOT, 'tools'), { recursive: true });
const out = {
  meta: { M, KMAX, width, height, perimeter: total, xmin, xmax, ymin, ymax, ax0: FX.a0, ay0: FY.a0 },
  coefs: {
    x: FX.coefs.map(c => [round(c.a), round(c.b)]),
    y: FY.coefs.map(c => [round(c.a), round(c.b)]),
  },
  errors: report.map(r => ({ N: r.N, err: r.err })),
};
function round(v) { return Math.round(v * 1e6) / 1e6; }
writeFileSync(join(ROOT, 'tools/fourier-data.json'), JSON.stringify(out));

// 预览 SVG：原剪影 + 描出轮廓 + 采样点 + N=1 椭圆 + N=50 重建
const pad = 40, W = 560, H = 640;
const sx = (W - 2 * pad) / width, sy = (H - 2 * pad) / height;
const s = Math.min(sx, sy);
const ox = (W - width * s) / 2 - xmin * s, oy = (H - height * s) / 2 - ymin * s;
const T = (p) => `${(p[0] * s + ox).toFixed(2)},${(p[1] * s + oy).toFixed(2)}`;
const origD = subpaths.map(sp => 'M' + sp.map(T).join('L') + 'Z').join(' ');
let recon1 = '', recon50 = '';
for (let i = 0; i <= 720; i++) {
  const t = i / 720;
  const p1 = reconstruct(1, t), p50 = reconstruct(50, t);
  recon1 += (i ? 'L' : 'M') + T(p1);
  recon50 += (i ? 'L' : 'M') + T(p50);
}
const dots = P.filter((_, i) => i % 64 === 0).map(p => `<circle cx="${(p[0] * s + ox).toFixed(1)}" cy="${(p[1] * s + oy).toFixed(1)}" r="1.6" fill="#00A9FF"/>`).join('');
const svgOut = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#F7F7F7"/>
<path d="${origD}" fill="#7E72CC"/>
<path d="${recon50}" fill="none" stroke="#00A9FF" stroke-width="2" opacity="0.95"/>
<path d="${recon1}" fill="none" stroke="#1A1A1A" stroke-width="1.4" opacity="0.9"/>
${dots}
<text x="20" y="30" fill="#1A1A1A" font-family="Georgia, serif" font-size="15">鹈鹕轮廓确认预览 — 参考像素鹈鹕描出的单闭合外轮廓</text>
<text x="20" y="${H - 34}" fill="#1A1A1A" font-family="Georgia, serif" font-size="13">墨 = N=1 一阶谐波（必为椭圆）</text>
<text x="20" y="${H - 16}" fill="#0091E0" font-family="Georgia, serif" font-size="13">蓝 = N=50 重建（error ${report.find(r => r.N === 50).err.toFixed(2)}%）· 点 = 弧长等距采样（每 64 取 1）</text>
</svg>`;
writeFileSync(join(ROOT, 'tools/contour-preview.svg'), svgOut);
console.log('\n已写出: tools/fourier-data.json, tools/contour-preview.svg');
