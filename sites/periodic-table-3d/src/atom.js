/* ============================================================================
   原子层 — 3D 玻尔模型：原子核球簇 / 倾斜轨道环 / 公转电子 / 辉光壳
   ========================================================================== */
import * as THREE from 'three';
import { CATEGORIES } from './elements.js';
import { makeElectronGlowTexture } from './textures.js';
import { mulberry32 } from './scene.js';
import { renderTheme } from './theme.js';

const SHELL_COLORS = ['#8FFBDC', '#5FE8C8', '#3AD9C0', '#2AC9B8', '#25B9B0', '#2AA8C8', '#3F97D8'];
const PROTON = { c: 0xFF8A50, e: 0xFF5A28 };
const NEUTRON = { c: 0x4FA8FF, e: 0x2E7FE0 };
const TRAIL_LEN = 0.5;

let electronGlowTex = null;

export function buildAtom(el) {
  if (!electronGlowTex) electronGlowTex = makeElectronGlowTexture();
  const group = new THREE.Group();
  const glowShells = [], orbitMeshes = [];

  /* ---------- 原子核：质子(橙) / 中子(蓝) 球簇 ---------- */
  const A = Math.max(1, Math.round(el.mass));
  const P = Math.min(el.z, A);
  const Nn = A - P;
  const nucleusR = 0.15 * Math.cbrt(A) + 0.17;
  const rnd = mulberry32(el.z * 7919 + 13);
  const nucleonGeo = new THREE.SphereGeometry(0.082, 10, 8);

  function nucleonMesh(count, mat) {
    const m = new THREE.InstancedMesh(nucleonGeo, mat, Math.max(count, 1));
    m.count = count;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // 球内均匀确定性随机
      const u = rnd(), v = rnd(), w = rnd();
      const r = nucleusR * Math.cbrt(u);
      const th = Math.acos(2 * v - 1), ph = 2 * Math.PI * w;
      dummy.position.set(r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    return m;
  }

  const nucleusGroup = new THREE.Group();
  nucleusGroup.add(nucleonMesh(P, new THREE.MeshStandardMaterial({
    color: PROTON.c, emissive: PROTON.e, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.05,
  })));
  nucleusGroup.add(nucleonMesh(Nn, new THREE.MeshStandardMaterial({
    color: NEUTRON.c, emissive: NEUTRON.e, emissiveIntensity: 0.45, roughness: 0.4, metalness: 0.05,
  })));
  group.add(nucleusGroup);

  // 原子核外半透明绿色辉光球壳（两层 additive）
  for (const [k, op] of [[1.75, 0.13], [2.5, 0.05]]) {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(nucleusR * k, 24, 18),
      new THREE.MeshBasicMaterial({
        color: 0x3DF5A8, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      })
    );
    group.add(shell);
    glowShells.push({ material: shell.material, opacity: op });
  }

  /* ---------- 电子壳层：倾斜轨道环 + 公转电子 + 拖尾 ---------- */
  const shells = [];
  const total = el.shells.reduce((a, b) => a + b, 0);
  const coreGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const haloGeo = new THREE.SphereGeometry(0.15, 8, 6);
  const trailGeo = new THREE.PlaneGeometry(TRAIL_LEN, 0.075);

  const coreMesh = new THREE.InstancedMesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xEAFFF7, fog: false }), total);
  const haloMesh = new THREE.InstancedMesh(haloGeo, new THREE.MeshBasicMaterial({
    map: electronGlowTex, color: 0x9CFFE4, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }), total);
  const trailMesh = new THREE.InstancedMesh(trailGeo, new THREE.MeshBasicMaterial({
    map: electronGlowTex, color: 0x6FE9CE, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }), total);
  coreMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  haloMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(coreMesh, haloMesh, trailMesh);

  let idx = 0;
  const dummy = new THREE.Object3D();
  const tmpV = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const X_AXIS = new THREE.Vector3(1, 0, 0);

  el.shells.forEach((count, i) => {
    const r = 1.05 + i * 0.82;
    const color = new THREE.Color(SHELL_COLORS[Math.min(i, SHELL_COLORS.length - 1)]);
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      Math.sin(el.z * 1.7 + i * 2.1) * 0.85 + 0.18,
      Math.cos(el.z * 2.3 + i * 1.3) * 0.85,
      Math.sin(el.z * 3.1 + i * 0.7) * 0.5,
    ));

    // 主环 + 外层柔光环
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.011, 6, 128),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    ring.quaternion.copy(quat);
    group.add(ring);
    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.035, 6, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    haloRing.quaternion.copy(quat);
    group.add(haloRing);
    orbitMeshes.push({ ring, haloRing });

    shells.push({
      r, count, quat, base: idx,
      angle: rnd() * Math.PI * 2,
      speed: 0.95 / (1 + i * 0.55),
      tangentQ: new THREE.Quaternion(),
    });
    idx += count;
  });

  // 拖尾朝向预计算：局部 X 对齐轨道切向
  for (const s of shells) {
    s.tangentQ.identity(); // 每帧按电子角度动态设置
  }

  function update(dt, time) {
    nucleusGroup.rotation.y += dt * 0.14;
    nucleusGroup.rotation.x += dt * 0.05;

    for (const s of shells) {
      s.angle += dt * s.speed;
      for (let k = 0; k < s.count; k++) {
        const i = s.base + k;
        const th = s.angle + (k * Math.PI * 2) / s.count;
        const px = s.r * Math.cos(th), py = s.r * Math.sin(th);
        // 电子核 + 辉光
        tmpV.set(px, py, 0).applyQuaternion(s.quat);
        dummy.position.copy(tmpV);
        dummy.quaternion.identity();
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        coreMesh.setMatrixAt(i, dummy.matrix);
        dummy.scale.setScalar(0.9 + 0.12 * Math.sin(time * 3 + i));
        dummy.updateMatrix();
        haloMesh.setMatrixAt(i, dummy.matrix);
        // 拖尾：沿切向、退后半圈弧长
        const back = th - 0.42;
        tmpV.set(s.r * Math.cos(back), s.r * Math.sin(back), 0).applyQuaternion(s.quat);
        const tangent = new THREE.Vector3(-Math.sin(th), Math.cos(th), 0).normalize();
        tmpQ.copy(s.quat).multiply(new THREE.Quaternion().setFromUnitVectors(X_AXIS, tangent));
        dummy.position.copy(tmpV);
        dummy.quaternion.copy(tmpQ);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        trailMesh.setMatrixAt(i, dummy.matrix);
      }
    }
    coreMesh.instanceMatrix.needsUpdate = true;
    haloMesh.instanceMatrix.needsUpdate = true;
    trailMesh.instanceMatrix.needsUpdate = true;
  }

  function applyTheme() {
    const theme = renderTheme();
    const blending = theme.light ? THREE.NormalBlending : THREE.AdditiveBlending;
    const [protons, neutrons] = nucleusGroup.children;
    protons.material.color.set(theme.proton); protons.material.emissive.set(theme.protonEmissive);
    protons.material.emissiveIntensity = 0.5 * theme.nucleonEmission;
    neutrons.material.color.set(theme.neutron); neutrons.material.emissive.set(theme.neutronEmissive);
    neutrons.material.emissiveIntensity = 0.45 * theme.nucleonEmission;
    coreMesh.material.color.set(theme.core);
    haloMesh.material.color.set(theme.halo); haloMesh.material.opacity = theme.haloOpacity;
    trailMesh.material.color.set(theme.trail); trailMesh.material.opacity = theme.trailOpacity;
    for (const material of [coreMesh.material, haloMesh.material, trailMesh.material]) material.toneMapped = !theme.light;
    for (const material of [haloMesh.material, trailMesh.material]) material.blending = blending;
    for (const glow of glowShells) {
      glow.material.color.set(theme.atomGlow);
      glow.material.opacity = glow.opacity * theme.atomGlowScale;
      glow.material.blending = blending;
    }
    orbitMeshes.forEach(({ ring, haloRing }, i) => {
      for (const mesh of [ring, haloRing]) {
        mesh.material.color.set(theme.shells[Math.min(i, theme.shells.length - 1)]);
        mesh.material.blending = blending;
        mesh.material.toneMapped = !theme.light;
      }
      ring.material.opacity = theme.orbitOpacity;
      haloRing.material.opacity = theme.orbitHalo;
    });
    group.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }
  applyTheme();

  function dispose() {
    group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
  }

  const outerR = el.shells.length ? 1.05 + (el.shells.length - 1) * 0.82 : 1.05;
  return { group, update, dispose, applyTheme, nucleusR, outerR, shells: shells.map(s => ({ r: s.r, count: s.count })) };
}

/* 各壳层半径（驱动详情面板与相机距离） */
export function shellRadii(el) {
  return el.shells.map((_, i) => 1.05 + i * 0.82);
}
