/* ============================================================================
   降级层 — Canvas 2D 渲染器（WebGL 不可用时的自动降级）
   3D 投影数学 + 同一数据集 / UI 覆盖层 / 交互：
   拖拽旋转 · 滚轮缩放 · 鼠标视差 · hover 高亮 · 点击飞入 · 核特写 · 返回
   ========================================================================== */
import { ELEMENTS, CATEGORIES, SHELL_LABELS, PLACEHOLDERS } from './elements.js';
import { drawTileArt } from './textures.js';
import {
  renderPanel, showPanel, buildLegend, showLegend,
  showTooltip, moveTooltip, hideTooltip, hideLoader, setView,
} from './ui.js';
import { REDUCED } from './scene.js';
import { getTheme, renderTheme, categoryColor, onThemeChange } from './theme.js';

const F2_PITCH = 1.12;
const F2_TOP_Y = (5.2 - 1) * F2_PITCH;
const F2_BOTTOM_Y = (5.2 - 9) * F2_PITCH - 0.5;
const F2_HALF_W = 18 * F2_PITCH / 2;
const F2_SHELL_BASE = 1.05, F2_SHELL_STEP = 0.82;

function f2GridPos(xpos, ypos) {
  return { x: (xpos - 9.5) * F2_PITCH, y: (5.2 - ypos) * F2_PITCH - (ypos >= 8 ? 0.5 : 0) };
}
function f2Rnd(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B2F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* 确定性欧拉角 → 3D 点（与 three.js Euler 'XYZ' 同序：先 Z 再 Y 再 X） */
function f2Rotate(x, y, z, rx, ry, rz) {
  const x1 = x * Math.cos(rz) - y * Math.sin(rz);
  const y1 = x * Math.sin(rz) + y * Math.cos(rz);
  const x2 = x1 * Math.cos(ry) + z * Math.sin(ry);
  const z2 = -x1 * Math.sin(ry) + z * Math.cos(ry);
  const y3 = y1 * Math.cos(rx) - z2 * Math.sin(rx);
  const z3 = y1 * Math.sin(rx) + z2 * Math.cos(rx);
  return { x: x2, y: y3, z: z3 };
}

export function initFallback2D() {
  /* 自建画布：原 #scene 可能已被 WebGL 渲染器占用上下文 */
  const old = document.getElementById('scene');
  if (old) old.remove();
  const canvas = document.createElement('canvas');
  canvas.id = 'scene';
  canvas.setAttribute('aria-label', '3D 元素周期表');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器不支持 Canvas 2D');

  let W = 0, H = 0;
  let view = 'table';
  let current = null;
  let hovered = null;
  let trans = null;
  let nucleusZoom = 0;
  let simTime = 0;

  /* ---------- 相机（每个视图独立） ---------- */
  const cam = {
    table: { yaw: 0, pitch: -0.42, zoom: 1, tYaw: 0, tPitch: -0.42, tZoom: 1 },
    atom: { yaw: 0.6, pitch: 0.35, zoom: 1, tYaw: 0.6, tPitch: 0.35, tZoom: 1 },
  };
  const activeCam = () => (view === 'table' ? cam.table : cam.atom);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- 格子贴图预渲染（一次性，之后每帧只 drawImage） ---------- */
  const tileCache = new Map();
  onThemeChange(() => tileCache.clear());
  function tileCanvas(el) {
    let c = tileCache.get(el.z);
    if (!c) {
      c = document.createElement('canvas');
      c.width = 192; c.height = 192;
      drawTileArt(c.getContext('2d'), el, 192);
      tileCache.set(el.z, c);
    }
    return c;
  }

  /* ---------- 3D 投影：世界点 → 屏幕 ---------- */
  function project(p, focal, scale, cx, cy) {
    const c = activeCam();
    const x1 = p.x * Math.cos(c.yaw) + p.z * Math.sin(c.yaw);
    const z1 = -p.x * Math.sin(c.yaw) + p.z * Math.cos(c.yaw);
    const y2 = p.y * Math.cos(c.pitch) - z1 * Math.sin(c.pitch);
    const z2 = p.y * Math.sin(c.pitch) + z1 * Math.cos(c.pitch);
    const f = focal / Math.max(0.5, focal - z2);
    return { x: cx + x1 * scale * f, y: cy - y2 * scale * f, z: z2, f };
  }

  /* ---------- 视图切换 ---------- */
  function startTransition(dir) { trans = { p: 0, dur: REDUCED ? 0.05 : 1.2, dir }; }
  function enterAtom(el) {
    if (view === 'atom') return;
    view = 'atom';
    setView(true);
    hideTooltip();
    hovered = null;
    current = { el };
    renderPanel(el);
    showPanel(true);
    showLegend(true, el.category);
    startTransition('in');
  }
  function exitAtom() {
    if (view !== 'atom') return;
    view = 'table';
    setView(false);
    showPanel(false);
    showLegend(false);
    hideTooltip();
    startTransition('out');
    setTimeout(() => { current = null; }, REDUCED ? 60 : 900);
  }
  function toggleNucleus() {
    if (view !== 'atom') return;
    nucleusZoom = nucleusZoom > 0.5 ? 0 : 1;
    const btn = document.getElementById('btn-nucleus');
    if (btn) btn.textContent = nucleusZoom ? '原子全景 · OVERVIEW' : '原子核特写 · NUCLEUS';
  }
  window.__ptExitAtom = exitAtom;
  window.__ptToggleNucleus = toggleNucleus;
  window.__ptEnterAtom = sym => {
    const el = ELEMENTS.find(e => e.symbol === sym);
    if (el) enterAtom(el);
  };
  window.__ptTilePos = sym => {
    const el = ELEMENTS.find(e => e.symbol === sym);
    if (!el) return null;
    const t = tileScreen(el);
    return { x: t.x, y: t.y };
  };
  window.__ptState = () => ({
    view, theme: getTheme(), nucleusMode: nucleusZoom > 0.5, demoRunning: false,
    element: current ? current.el.symbol : null,
    shells: current ? current.el.shells.slice() : null,
    renderer: 'canvas2d',
  });

  /* ---------- 星空 ---------- */
  const starRnd = f2Rnd(20260806);
  const stars = Array.from({ length: 140 }, () => ({
    x: starRnd(), y: starRnd(), r: 0.4 + starRnd() * 1.2, ph: starRnd() * 6.28,
  }));
  function drawStars() {
    const theme = renderTheme();
    ctx.save();
    for (const st of stars) {
      const a = REDUCED ? 0.4 : 0.22 + 0.35 * (0.5 + 0.5 * Math.sin(simTime * 0.6 + st.ph));
      ctx.globalAlpha = a * (theme.light ? 0.2 : 1);
      ctx.fillStyle = theme.stars;
      ctx.beginPath();
      ctx.arc(st.x * W, st.y * H, st.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 表格视图 ---------- */
  function tableFit() {
    const c = activeCam();
    const s = Math.min(W / (2 * F2_HALF_W + 1.6), H / (F2_TOP_Y - F2_BOTTOM_Y + 3.0)) * 0.92 * c.zoom;
    return { s, cx: W / 2, cy: H / 2 + 10 };
  }
  function tileScreen(el) {
    const { s, cx, cy } = tableFit();
    const p = f2GridPos(el.xpos, el.ypos);
    const wave = REDUCED ? 0 : Math.sin(simTime * 0.85 + el.xpos * 0.5 + el.z * 0.11) * 0.1;
    const q = project({ x: p.x, y: p.y + wave, z: 0 }, 14, s, cx, cy);
    return { x: q.x, y: q.y, z: q.z, f: q.f, size: F2_PITCH * s * 0.92 * q.f };
  }

  function drawTable(alpha) {
    const theme = renderTheme();
    const { s, cx, cy } = tableFit();
    ctx.save();
    ctx.globalAlpha = alpha;

    // 列号 1–18（投影到表格上方）
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `400 ${Math.max(10, s * 0.30)}px "PT Mono", ui-monospace, Menlo, monospace`;
    for (let i = 1; i <= 18; i++) {
      const q = project({ x: (i - 9.5) * F2_PITCH, y: F2_TOP_Y + 0.62, z: 0 }, 14, s, cx, cy);
      ctx.fillStyle = theme.column;
      ctx.globalAlpha = alpha * Math.min(1, 0.9 * q.f);
      ctx.fillText(String(i), q.x, q.y);
      ctx.globalAlpha = alpha;
    }

    // 分组标签 + 占位格（按深度排序绘制）
    const items = [];
    for (const ph of PLACEHOLDERS) {
      const p = f2GridPos(ph.xpos, ph.ypos);
      items.push({ kind: 'ph', ph, p, z: project({ x: p.x, y: p.y, z: 0 }, 14, s, cx, cy).z });
    }
    for (const [ypos, main, sub, cat] of [[8, '镧系', '57–71 · LA', 'lanthanide'], [9, '锕系', '89–103 · AC', 'actinide']]) {
      const p = f2GridPos(1.5, ypos);
      items.push({ kind: 'label', main, sub, cat, p, z: project({ x: p.x, y: p.y, z: 0 }, 14, s, cx, cy).z });
    }
    for (const el of ELEMENTS) {
      const t = tileScreen(el);
      items.push({ kind: 'tile', el, t, z: t.z });
    }
    items.sort((a, b) => b.z - a.z);   // 远的先画

    for (const it of items) {
      if (it.kind === 'label') {
        const q = project({ x: it.p.x - 1.0, y: it.p.y, z: 0 }, 14, s, cx, cy);
        ctx.textAlign = 'left';
        ctx.globalAlpha = alpha * q.f;
        ctx.fillStyle = theme.secondary;
        ctx.font = `600 ${s * 0.42 * q.f}px "PingFang SC", "Noto Sans SC", sans-serif`;
        ctx.fillText(it.main, q.x, q.y - s * 0.10 * q.f);
        ctx.fillStyle = categoryColor(it.cat);
        ctx.font = `400 ${s * 0.22 * q.f}px "PT Mono", ui-monospace, monospace`;
        ctx.fillText(it.sub, q.x, q.y + s * 0.28 * q.f);
        ctx.globalAlpha = alpha;
      } else if (it.kind === 'ph') {
        const q = project({ x: it.p.x, y: it.p.y, z: 0 }, 14, s, cx, cy);
        const sz = F2_PITCH * s * 0.92 * q.f;
        ctx.save();
        ctx.globalAlpha = alpha * 0.85 * q.f;
        ctx.fillStyle = theme.placeholder;
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        ctx.strokeRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        ctx.setLineDash([]);
        ctx.fillStyle = theme.placeholderText;
        ctx.font = `400 ${sz * 0.16}px "PT Mono", ui-monospace, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it.ph.label, q.x, q.y - sz * 0.08);
        ctx.fillStyle = theme.muted;
        ctx.font = `400 ${sz * 0.13}px "PingFang SC", "Noto Sans SC", sans-serif`;
        ctx.fillText(it.ph.sub, q.x, q.y + sz * 0.16);
        ctx.restore();
      } else {
        const el = it.el, t = it.t;
        const isSel = current && current.el.z === el.z;
        const isHov = hovered && hovered.z === el.z;
        const scale = (isHov ? 1.1 : (isSel ? 1.06 : 1)) * t.f;
        const dim = current && !isSel ? 0.10 : 1;
        ctx.save();
        ctx.globalAlpha = alpha * dim;
        if (isHov || isSel) {
          ctx.shadowColor = categoryColor(el.category);
          ctx.shadowBlur = theme.light ? 0 : t.size * (isHov ? 0.55 : 0.3);
        }
        ctx.drawImage(tileCanvas(el), t.x - t.size * scale / 2, t.y - t.size * scale / 2, t.size * scale, t.size * scale);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ---------- 原子视图（真 3D 投影） ---------- */
  function atomShells(el, R) {
    const rnd = f2Rnd(el.z * 7919 + 13);
    const outer = F2_SHELL_BASE + (el.shells.length - 1) * F2_SHELL_STEP;
    return el.shells.map((count, i) => {
      const r = R * ((F2_SHELL_BASE + i * F2_SHELL_STEP) / outer);
      return {
        count, r,
        tilt: {
          rx: Math.sin(el.z * 1.7 + i * 2.1) * 0.85 + 0.18,
          ry: Math.cos(el.z * 2.3 + i * 1.3) * 0.85,
          rz: Math.sin(el.z * 3.1 + i * 0.7) * 0.5,
        },
        speed: 0.95 / (1 + i * 0.55),
        angle: rnd() * 6.2832,
      };
    });
  }

  function drawAtom(el, cx, cy, R, alpha) {
    const theme = renderTheme();
    const A = Math.max(1, Math.round(el.mass));
    const P = Math.min(el.z, A), Nn = A - P;
    const clusterR = R * 0.15;
    const nucR = Math.max(0.9, clusterR * Math.sqrt(1.15 / Math.max(1, P + Nn)));  // 粒子半径按数量收缩，互不粘连
    const shells = atomShells(el, R);

    ctx.save();
    ctx.globalAlpha = alpha;

    // 核外辉光
    const glow = ctx.createRadialGradient(cx, cy, clusterR * 0.3, cx, cy, clusterR * 2.8);
    glow.addColorStop(0, theme.atomGlow2d);
    glow.addColorStop(1, theme.atomGlow + '00');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, clusterR * 2.8, 0, 6.2832); ctx.fill();

    // 轨道环（3D 圆环投影）
    for (const sg of shells) {
      ctx.strokeStyle = theme.orbit2d;
      ctx.lineWidth = Math.max(1, R * 0.007);
      ctx.beginPath();
      for (let k = 0; k <= 72; k++) {
        const th = (k / 72) * 6.2832;
        const p = f2Rotate(sg.r * Math.cos(th), sg.r * Math.sin(th), 0, sg.tilt.rx, sg.tilt.ry, sg.tilt.rz);
        const q = project(p, R * 2.4, 1, cx, cy);
        if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }

    // 电子拖尾 + 电子
    for (const sg of shells) {
      for (let k = 0; k < sg.count; k++) {
        const th = sg.angle + (k * 6.2832) / sg.count;
        // 拖尾（沿轨道退 0.42 rad 的弧段）
        ctx.strokeStyle = theme.trail + '80';
        ctx.lineWidth = Math.max(1.5, R * 0.013);
        ctx.beginPath();
        for (let s = 0; s <= 8; s++) {
          const a = th - 0.42 * (s / 8);
          const p = f2Rotate(sg.r * Math.cos(a), sg.r * Math.sin(a), 0, sg.tilt.rx, sg.tilt.ry, sg.tilt.rz);
          const q = project(p, R * 2.4, 1, cx, cy);
          if (s === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        // 电子
        const p = f2Rotate(sg.r * Math.cos(th), sg.r * Math.sin(th), 0, sg.tilt.rx, sg.tilt.ry, sg.tilt.rz);
        const q = project(p, R * 2.4, 1, cx, cy);
        ctx.save();
        ctx.shadowColor = theme.halo;
        ctx.shadowBlur = theme.light ? 0 : R * 0.05;
        ctx.fillStyle = theme.core;
        ctx.beginPath();
        ctx.arc(q.x, q.y, Math.max(2, R * 0.018), 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
    }

    // 原子核：质子橙 / 中子蓝 独立粒子（3D 球内分布投影）
    const rnd = f2Rnd(el.z * 7919 + 13);
    const pts = [];
    for (let i = 0; i < P + Nn; i++) {
      const u = rnd(), v = rnd(), w = rnd();
      const rr = clusterR * Math.cbrt(u);
      const th = Math.acos(2 * v - 1), ph = 2 * Math.PI * w;
      pts.push({
        x: rr * Math.sin(th) * Math.cos(ph),
        y: rr * Math.sin(th) * Math.sin(ph),
        z: rr * Math.cos(th),
        proton: i < P,
      });
    }
    pts.sort((a, b) => b.z - a.z);   // 远的先画
    for (const p of pts) {
      const q = project(p, R * 2.4, 1, cx, cy);
      ctx.fillStyle = p.proton ? theme.proton : theme.neutron;
      ctx.strokeStyle = p.proton ? theme.protonEdge : theme.neutronEdge;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(1.2, nucR * q.f), 0, 6.2832);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    return shells;
  }

  /* ---------- 指针交互：拖拽旋转 / 滚轮缩放 / hover / 点击 ---------- */
  function pick(x, y) {
    let best = null, bestD = Infinity;
    for (const el of ELEMENTS) {
      const t = tileScreen(el);
      const h = t.size / 2;
      if (x >= t.x - h && x <= t.x + h && y >= t.y - h && y <= t.y + h) {
        const d = (x - t.x) ** 2 + (y - t.y) ** 2;
        if (d < bestD) { bestD = d; best = el; }
      }
    }
    return best;
  }
  let downX = 0, downY = 0, dragging = false, moved = 0;
  canvas.addEventListener('pointerdown', e => {
    downX = e.clientX; downY = e.clientY; moved = 0;
    dragging = true;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (dragging) {
      const dx = e.clientX - downX, dy = e.clientY - downY;
      moved = Math.max(moved, Math.hypot(dx, dy));
      const c = activeCam();
      c.tYaw = c.yaw + dx * 0.0062;
      c.tPitch = Math.max(-1.25, Math.min(1.25, c.pitch - dy * 0.0062));
      downX = e.clientX; downY = e.clientY;
      hideTooltip();
      return;
    }
    if (view !== 'table' || (trans && trans.dir === 'in')) { hideTooltip(); return; }
    // 表格视图：hover + 视差目标（±3°）
    const c = cam.table;
    c.tYaw = (e.clientX / W - 0.5) * 0.1047;
    c.tPitch = -0.42 + (e.clientY / H - 0.5) * 0.045;
    const el = pick(e.clientX, e.clientY);
    hovered = el;
    if (el) showTooltip(el, e.clientX, e.clientY);
    else hideTooltip();
  });
  canvas.addEventListener('pointerup', e => {
    dragging = false;
    canvas.releasePointerCapture && e.pointerId !== undefined && canvas.releasePointerCapture(e.pointerId);
    if (moved > 6 || trans) return;      // 拖拽不算点击
    if (view === 'table') {
      const el = pick(e.clientX, e.clientY);
      if (el) enterAtom(el);
    } else {
      exitAtom();
    }
  });
  canvas.addEventListener('pointerleave', () => { dragging = false; hovered = null; hideTooltip(); });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const c = activeCam();
    c.tZoom = Math.max(0.45, Math.min(2.6, c.tZoom * Math.exp(-e.deltaY * 0.0011)));
  }, { passive: false });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && view === 'atom') exitAtom();
    if ((e.key === 'n' || e.key === 'N') && view === 'atom') toggleNucleus();
  });

  /* ---------- 主循环 ---------- */
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; simTime += dt;

    if (trans) {
      trans.p += dt / trans.dur;
      if (trans.p >= 1) { trans.p = 1; trans = null; }
    }
    const nzTarget = view === 'atom' && nucleusZoom ? 1 : 0;
    nucleusZoom += (nzTarget - nucleusZoom) * (1 - Math.exp(-6 * dt));

    // 相机阻尼（拖拽 / 视差 / 缩放统一走这里）
    const k = 1 - Math.exp(-7 * dt);
    for (const key of ['table', 'atom']) {
      const c = cam[key];
      if (REDUCED) { c.yaw = c.tYaw; c.pitch = c.tPitch; c.zoom = c.tZoom; continue; }
      c.yaw += (c.tYaw - c.yaw) * k;
      c.pitch += (c.tPitch - c.pitch) * k;
      c.zoom += (c.tZoom - c.zoom) * k;
    }

    ctx.clearRect(0, 0, W, H);
    drawStars();

    if (view === 'table' || (trans && trans.dir === 'out')) {
      const p = trans && trans.dir === 'out' ? trans.p : 0;
      drawTable(1 - p);
    }
    if ((view === 'atom' || (trans && trans.dir === 'in')) && current) {
      const el = current.el;
      const p = trans && trans.dir === 'in' ? trans.p : (trans && trans.dir === 'out' ? 1 - trans.p : 1);
      if (p > 0) {
        const outer = F2_SHELL_BASE + (el.shells.length - 1) * F2_SHELL_STEP;
        const base = Math.min(W * 0.26, H * 0.30) * activeCam().zoom;
        const R = base / Math.max(1, outer / 3.4) * (0.55 + 0.45 * p) * (1 + nucleusZoom * 1.25);
        const cx = W / 2 + W * 0.09, cy = H / 2;
        const shells = drawAtom(el, cx, cy, R, p);
        if (!REDUCED) for (const sg of shells) sg.angle += dt * sg.speed;
      }
    }
  }

  /* ---------- 启动 ---------- */
  buildLegend();
  requestAnimationFrame(loop);
  setTimeout(hideLoader, 700);
}
