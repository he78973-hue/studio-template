/* ============================================================================
   场景层 — 渲染器 / 相机 / 控制器 / 灯光 / 星点 / 补间系统
   ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { renderTheme, onThemeChange } from './theme.js';

export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const canvas = document.getElementById('scene');

/* WebGL 不可用（无 GPU 加速 / 远程桌面 / 虚拟机 / 浏览器禁用）时不抛错，
   导出 WEBGL_OK=false，由主控层切换到 Canvas 2D 降级模式 */
export const WEBGL_OK = (() => {
  try {
    const r = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(window.innerWidth, window.innerHeight);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.18;
    return r;
  } catch (e) {
    console.warn('WebGL 不可用，切换 Canvas 2D 降级模式：', e && e.message);
    return null;
  }
})();

export const renderer = WEBGL_OK;

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04120f, 0.0075);

export const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 1.8, 24);

export const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;

/* ---------- 灯光：环境 + 主方向 + 原子视图的青绿点光 ---------- */
const ambient = new THREE.AmbientLight(0xffffff, 0.62);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xffffff, 1.05);
key.position.set(7, 12, 10);
scene.add(key);
const rim = new THREE.DirectionalLight(0x67e8c8, 0.35);
rim.position.set(-8, -4, -10);
scene.add(rim);
export const nucleusLight = new THREE.PointLight(0x35e0b0, 0, 26, 1.6);
scene.add(nucleusLight);

/* ---------- 星点（确定性伪随机，固定种子） ---------- */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B2F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const stars = (() => {
  const rnd = mulberry32(20260806);
  const N = 900;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rnd() - 0.5) * 150;
    pos[i * 3 + 1] = (rnd() - 0.5) * 95;
    pos[i * 3 + 2] = -14 - rnd() * 70;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x9fd8cc, size: 0.14, sizeAttenuation: true,
    transparent: true, opacity: 0.75, depthWrite: false, fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
})();

function applySceneTheme() {
  const theme = renderTheme();
  scene.fog.color.set(theme.fog);
  scene.fog.density = theme.fogDensity;
  if (renderer) renderer.toneMappingExposure = theme.exposure;
  ambient.intensity = theme.ambient;
  key.intensity = theme.key;
  rim.color.set(theme.rim); rim.intensity = theme.rimIntensity;
  stars.material.color.set(theme.stars);
  stars.material.opacity = theme.starOpacity;
}
applySceneTheme();
onThemeChange(applySceneTheme);

/* ---------- 补间系统：所有相机运动统一走这一个循环 ---------- */
const tweens = [];
export function addTween(t) { tweens.push(t); return t; }
export function clearTweens(filter) {
  for (let i = tweens.length - 1; i >= 0; i--) if (!filter || filter(tweens[i])) tweens.splice(i, 1);
}
export function updateTweens(dt) {  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    t.t += dt;
    const p = Math.min(t.t / t.dur, 1);
    t.onUpdate(t.ease ? t.ease(p) : p, p);
    if (p >= 1) { tweens.splice(i, 1); t.onDone && t.onDone(); }
  }
}
export const Ease = {
  inOutCubic: p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  outCubic: p => 1 - Math.pow(1 - p, 3),
  inCubic: p => p * p * p,
};

export function tweensDebug() {
  return tweens.map(t => ({ tag: t.tag, t: +t.t.toFixed(3), dur: t.dur }));
}

/* 相机飞行：position 与 controls.target 同步补间，无跳变 */
export function flyCamera(toPos, toTarget, dur, onDone) {
  clearTweens(t => t.tag === 'camera');
  const fromPos = camera.position.clone();
  const fromTgt = controls.target.clone();
  controls.enabled = false;
  return addTween({
    tag: 'camera', t: 0, dur,
    ease: REDUCED ? Ease.inOutCubic : Ease.inOutCubic,
    onUpdate: (e) => {
      camera.position.lerpVectors(fromPos, toPos, e);
      controls.target.lerpVectors(fromTgt, toTarget, e);
      camera.lookAt(controls.target);
    },
    onDone: () => {
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.enabled = true;
      onDone && onDone();
    },
  });
}

/* ---------- resize 自适应 ---------- */
export function onResize(fitTable, fitAtom) {
  window.addEventListener('resize', () => {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (fitTable) fitTable();
    if (fitAtom) fitAtom();
  });
}
