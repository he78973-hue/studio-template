/* ============================================================================
   主控层 — 视图状态机 / 交互 / 引导动画 / 动画循环
   ========================================================================== */
import * as THREE from 'three';
import { ELEMENTS } from './elements.js';
import {
  renderer, scene, camera, controls, tableGroup, nucleusLight,
  flyCamera, updateTweens, Ease, addTween, onResize, REDUCED, tweensDebug, WEBGL_OK,
} from './scene.js';
import { initFallback2D } from './fallback2d.js';
import {
  TABLE_CENTER_Y, TILT, fitDistance, updateTable, setHovered,
  setTableDimmed, setTableRestore, interactiveTiles,
} from './table.js';
import { buildAtom } from './atom.js';
import { getTheme, renderTheme, onThemeChange, initThemeControls } from './theme.js';
import {
  ui, renderPanel, showPanel, buildLegend, showLegend,
  showTooltip, moveTooltip, hideTooltip, hideLoader, setView,
} from './ui.js';

function init3D() {
scene.add(tableGroup);

/* ---------- 视图状态 ---------- */
let view = 'table';            // 'table' | 'atom'
let current = null;            // { el, atom, mesh }
let nucleusMode = false;
let cameraBusy = false;
const fadingAtoms = [];        // 淡出中的旧原子（进入新原子时立即清理）

const FLY_S = REDUCED ? 0.2 : 1.2;     // 飞入/飞出时长·秒（prompt: 1~1.5s ease-in-out）

function tablePose() {
  const d = fitDistance();
  return { pos: new THREE.Vector3(0, 1.5, d), tgt: new THREE.Vector3(0, TABLE_CENTER_Y - 0.2, 0), d };
}
function atomPose(atom) {
  const dist = Math.max(atom.outerR + 2.15, 3.4);
  const dir = new THREE.Vector3(0.16, 0.34, 1).normalize();
  return { pos: dir.multiplyScalar(dist), tgt: new THREE.Vector3(0, 0, 0) };
}
function nucleusPose(atom) {
  const dist = atom.nucleusR * 2.7 + 1.0;
  const dir = new THREE.Vector3(0.32, 0.24, 1).normalize();
  return { pos: dir.multiplyScalar(dist), tgt: new THREE.Vector3(0, 0, 0) };
}

function applyLimits(atom) {
  if (atom) {
    controls.minDistance = atom.nucleusR * 1.6 + 0.55;
    controls.maxDistance = atom.outerR + 6;
    controls.maxPolarAngle = Math.PI;
  } else {
    const d = fitDistance();
    controls.minDistance = d * 0.45;
    controls.maxDistance = d * 1.6;
    controls.maxPolarAngle = 1.35;
  }
}

function fly(toPos, toTgt, ms, onDone) {
  cameraBusy = true;
  return flyCamera(toPos, toTgt, ms, () => { cameraBusy = false; onDone && onDone(); });
}

/* ---------- 进入 / 退出原子视图 ---------- */
function enterAtom(el, mesh) {
  if (view === 'atom') return;
  // 立即清理仍在淡出的旧原子，避免幽灵残留
  for (const a of fadingAtoms) { scene.remove(a.group); a.dispose(); }
  fadingAtoms.length = 0;
  view = 'atom'; nucleusMode = false;
  setView(true);
  hideTooltip();
  setHovered(null);
  setTableDimmed(mesh);
  renderPanel(el);
  showPanel(true);
  showLegend(true, el.category);

  const atom = buildAtom(el);
  atom.group.scale.setScalar(REDUCED ? 1 : 0.82);
  scene.add(atom.group);
  current = { el, atom, mesh };

  // 原子淡入（缩放 + 点光）
  const from = atom.group.scale.x;
  addTween({
    t: 0, dur: REDUCED ? 0.001 : 0.42, ease: Ease.outCubic,
    onUpdate: e => { atom.group.scale.setScalar(from + (1 - from) * e); nucleusLight.intensity = 1.35 * e * renderTheme().pointLight; },
  });

  applyLimits(atom);
  const pose = atomPose(atom);
  fly(pose.pos, pose.tgt, FLY_S);
}

function exitAtom() {
  if (view !== 'atom') return;
  const cur = current;
  current = null;
  view = 'table'; nucleusMode = false;
  setView(false);
  showPanel(false);
  showLegend(false);
  hideTooltip();
  setTableRestore();
  applyLimits(null);
  const pose = tablePose();
  fly(pose.pos, pose.tgt, FLY_S * 0.92);

  if (cur) {
    const from = cur.atom.group.scale.x;
    fadingAtoms.push(cur.atom);
    addTween({
      t: 0, dur: REDUCED ? 0.001 : 0.3, ease: Ease.inCubic,
      onUpdate: e => {
        cur.atom.group.scale.setScalar(from + (0.78 - from) * e);
        nucleusLight.intensity = 1.35 * (1 - e) * renderTheme().pointLight;
      },
      onDone: () => {
        scene.remove(cur.atom.group);
        cur.atom.dispose();
        fadingAtoms.splice(fadingAtoms.indexOf(cur.atom), 1);
      },
    });
  }
}

function toggleNucleus() {
  if (view !== 'atom' || !current) return;
  const pose = nucleusMode ? atomPose(current.atom) : nucleusPose(current.atom);
  nucleusMode = !nucleusMode;
  const btn = document.getElementById('btn-nucleus');
  if (btn) btn.textContent = nucleusMode ? '原子全景 · OVERVIEW' : '原子核特写 · NUCLEUS';
  fly(pose.pos, pose.tgt, REDUCED ? 0.2 : 0.9);
}

window.__ptExitAtom = exitAtom;
window.__ptToggleNucleus = toggleNucleus;
window.__ptEnterAtom = (sym) => {
  const el = ELEMENTS.find(e => e.symbol === sym);
  const mesh = interactiveTiles.find(m => m.userData.el === el);
  if (el && mesh) enterAtom(el, mesh);
};
/* 测试钩子：交付门实测用（相机位姿 / 元素格屏幕坐标 / 状态） */
window.__ptDebug = { camera, controls, scene, renderer, THREE, tweens: () => tweensDebug() };
window.__ptTilePos = (sym) => {
  const m = interactiveTiles.find(t => t.userData.el.symbol === sym);
  if (!m) return null;
  const v = new THREE.Vector3();
  m.getWorldPosition(v);
  v.project(camera);
  return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
};

/* ---------- 射线拾取 ---------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(interactiveTiles, false);
  return hits.length ? hits[0].object : null;
}
function tileScreenPos(mesh) {
  const v = new THREE.Vector3();
  mesh.getWorldPosition(v);
  v.project(camera);
  return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
}

/* ---------- 指针交互 ---------- */
let mouseX = 0, mouseY = 0, downX = 0, downY = 0;
const parallax = { y: 0, x: 0 };

ui.scene.addEventListener('pointermove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (view === 'table' && !cameraBusy) {
    const hit = pick(e.clientX, e.clientY);
    setHovered(hit);
    if (hit) showTooltip(hit.userData.el, e.clientX, e.clientY);
    else hideTooltip();
  } else if (view === 'table') {
    hideTooltip();
  }
  // 视差目标（±3°）
  parallax.y = (e.clientX / window.innerWidth - 0.5) * 0.1047;
  parallax.x = (e.clientY / window.innerHeight - 0.5) * 0.045;
});
ui.scene.addEventListener('pointerleave', () => { if (view === 'table') { setHovered(null); hideTooltip(); } });
ui.scene.addEventListener('pointerdown', e => {
  downX = e.clientX; downY = e.clientY;
  ui.scene.classList.add('grabbing');
  cancelDemo();
});
window.addEventListener('pointerup', e => {
  ui.scene.classList.remove('grabbing');
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved > 6) return;                       // 拖拽不算点击
  if (e.target !== ui.scene) return;           // 只响应画布点击
  if (cameraBusy) return;                      // 相机飞行中不响应点击（防误拾取）
  if (view === 'table') {
    const hit = pick(e.clientX, e.clientY);
    if (hit) enterAtom(hit.userData.el, hit);
  } else {
    exitAtom();                                // 原子视图点击空白处返回
  }
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && view === 'atom') { cancelDemo(); exitAtom(); }
  if (e.key === 'n' || e.key === 'N') { cancelDemo(); toggleNucleus(); }
});

/* ---------- 首次进入引导动画（可被任何指针操作中断） ---------- */
const demo = { running: false, log: [] };
function cancelDemo() {
  if (!demo.running) return;
  demo.running = false;
  if (view === 'table') { setHovered(null); hideTooltip(); }
}
const wait = ms => new Promise(res => setTimeout(res, ms));

async function runDemo() {
  demo.running = true;
  const steps = [
    ['hover', 'Fe', 1200], ['enter', 'Fe'], ['hold', null, 2500],
    ['nucleus', null, 1400], ['hold', null, 1800], ['overview', null, 1100], ['hold', null, 900],
    ['exit'], ['wait', null, 500],
    ['hover', 'C', 900], ['enter', 'C'], ['hold', null, 2200],
    ['exit'], ['wait', null, 400],
    ['hover', 'H', 700], ['enter', 'H'], ['hold', null, 2200],
    ['exit'],
  ];
  for (const step of steps) {
    if (!demo.running) { demo.log.push('cancelled'); return; }
    const [op, arg, ms] = step;
    demo.log.push(op + (arg ? ':' + arg : ''));
    if (op === 'hover') {
      const mesh = interactiveTiles.find(m => m.userData.el.symbol === arg);
      if (!mesh) continue;
      setHovered(mesh);
      const p = tileScreenPos(mesh);
      showTooltip(mesh.userData.el, p.x, p.y);
      await wait(ms);
    } else if (op === 'enter') {
      hideTooltip();
      const el = ELEMENTS.find(e => e.symbol === arg);
      const mesh = interactiveTiles.find(m => m.userData.el === el);
      enterAtom(el, mesh);
      await wait(FLY_S * 1000 + 250);
    } else if (op === 'nucleus') {
      toggleNucleus();
      await wait(ms);
    } else if (op === 'overview') {
      toggleNucleus();
      await wait(ms);
    } else if (op === 'exit') {
      exitAtom();
      await wait(FLY_S * 920 + 250);
    } else {
      await wait(ms);
    }
  }
  demo.running = false;
  demo.log.push('done');
}

document.getElementById('theme-switch').addEventListener('click', cancelDemo);
onThemeChange(() => {
  current?.atom.applyTheme();
  fadingAtoms.forEach(atom => atom.applyTheme());
});

/* ---------- resize ---------- */
onResize(() => {
  if (view === 'table' && !cameraBusy) {
    const pose = tablePose();
    applyLimits(null);
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).add(dir.multiplyScalar(pose.d));
  }
});

/* ---------- 动画循环 ---------- */
buildLegend();
const startPose = tablePose();
camera.position.copy(startPose.pos);
controls.target.copy(startPose.tgt);
applyLimits(null);

let last = performance.now(), simTime = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now; simTime += dt;

  updateTweens(dt);
  updateTable(dt, simTime);
  if (current) current.atom.update(dt, simTime);

  // 表格视差（惯性阻尼，reduced-motion 关闭）
  if (!REDUCED) {
    const kp = 1 - Math.exp(-3.4 * dt);
    if (view === 'table') {
      tableGroup.rotation.y += (parallax.y - tableGroup.rotation.y) * kp;
      tableGroup.rotation.x += (TILT + parallax.x - tableGroup.rotation.x) * kp;
    } else {
      tableGroup.rotation.y += (0 - tableGroup.rotation.y) * kp;
      tableGroup.rotation.x += (TILT - tableGroup.rotation.x) * kp;
    }
  }

  // 原子核点光呼吸
  if (current) nucleusLight.intensity = (REDUCED ? 1.35 : 1.15 + 0.3 * Math.sin(simTime * 2.2)) * renderTheme().pointLight;
  else nucleusLight.intensity = 0;

  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

/* ---------- 启动：加载态 → 主界面 → 首次引导 ---------- */
const skipDemo = new URLSearchParams(location.search).get('demo') === '0';
window.__ptState = () => ({
  view, theme: getTheme(), nucleusMode, demoRunning: demo.running,
  element: current ? current.el.symbol : null,
  demoLog: demo.log.slice(-6),
  shells: current ? current.atom.shells.map(s => s.count) : null,
  nucleus: current ? { p: current.el.z, n: Math.round(current.el.mass) - current.el.z, r: +current.atom.nucleusR.toFixed(3) } : null,
  cameraBusy,
});
setTimeout(() => {
  hideLoader();
  if (!skipDemo && !REDUCED) runDemo();
}, 1100);
}

/* ---------- 启动分流：WebGL 可用走 3D，否则自动降级 Canvas 2D ---------- */
initThemeControls();
const force2D = new URLSearchParams(location.search).get('mode') === '2d';
if (WEBGL_OK && !force2D) {
  init3D();
} else {
  initFallback2D();
}
