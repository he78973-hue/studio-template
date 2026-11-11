/* ============================================================================
   表格层 — 118 元素格 + 占位格 + 列号条 + 分组标签 + 辉光
   ========================================================================== */
import * as THREE from 'three';
import { ELEMENTS, CATEGORIES, PLACEHOLDERS } from './elements.js';
import {
  makeTileTexture, makePlaceholderTexture, makeGlowTexture,
  makeColumnStripTexture, makeGroupLabelTexture,
} from './textures.js';
import { mulberry32, camera, REDUCED } from './scene.js';
import { renderTheme, categoryColor, onThemeChange } from './theme.js';

export const PITCH = 1.12;
export const TILE = 1.0;
export const TILT = -0.42;

export function gridPos(xpos, ypos) {
  return {
    x: (xpos - 9.5) * PITCH,
    y: (5.2 - ypos) * PITCH - (ypos >= 8 ? 0.5 : 0),
  };
}

export const TABLE_HALF_W = 18 * PITCH / 2;
const TOP_Y = (5.2 - 1) * PITCH;
const BOTTOM_Y = (5.2 - 9) * PITCH - 0.5;
export const TABLE_CENTER_Y = (TOP_Y + BOTTOM_Y) / 2;
export const TABLE_HALF_H = (TOP_Y - BOTTOM_Y) / 2;

export const tableGroup = new THREE.Group();
tableGroup.rotation.x = TILT;

const boxGeo = new THREE.BoxGeometry(TILE, TILE, 0.12);
const glowGeo = new THREE.PlaneGeometry(1.66, 1.66);
const glowTex = makeGlowTexture();

const rnd = mulberry32(118);
const tiles = [];       // 可交互元素格
const allTiles = [];    // 含占位格

function edgeMaterial(hex, ei) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex).multiplyScalar(0.24),
    emissive: new THREE.Color(hex),
    emissiveIntensity: ei,
    roughness: 0.55, metalness: 0.1,
  });
}
function backMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x0a1714, roughness: 0.8, metalness: 0 });
}
function makeGlowQuad(x, y, hex, opacity) {
  const glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    map: glowTex, color: new THREE.Color(hex),
    transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  glow.position.set(x, y, -0.1);
  return glow;
}

function attachTile(mesh, glow, isTile, extra) {
  mesh.userData = Object.assign({
    isTile, baseY: mesh.position.y, phase: rnd() * Math.PI * 2,
    cur: { s: 1, e: 0.42, o: 1, g: 0.15, z: 0 },
    tgt: { s: 1, e: 0.42, o: 1, g: 0.15, z: 0 },
    glow,
  }, extra);
  glow.userData.tile = mesh;
  tableGroup.add(mesh); tableGroup.add(glow);
  allTiles.push(mesh);
}

function buildTile(el) {
  const col = CATEGORIES[el.category].color;
  const tex = makeTileTexture(el);
  const front = new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff,
    emissiveIntensity: 0.42, roughness: 0.6, metalness: 0.06,
    transparent: true, opacity: 1,
  });
  const mesh = new THREE.Mesh(boxGeo, [
    edgeMaterial(col, 0.22), edgeMaterial(col, 0.22), edgeMaterial(col, 0.22),
    edgeMaterial(col, 0.22), front, backMaterial(),
  ]);
  const { x, y } = gridPos(el.xpos, el.ypos);
  mesh.position.set(x, y, 0);
  attachTile(mesh, makeGlowQuad(x, y, col, 0.15), true, { el, mat: front });
  tiles.push(mesh);
}

for (const el of ELEMENTS) buildTile(el);

// 镧系/锕系占位格（主表对应位置，不可交互）
for (const ph of PLACEHOLDERS) {
  const { x, y } = gridPos(ph.xpos, ph.ypos);
  const mesh = new THREE.Mesh(boxGeo, [
    edgeMaterial('#B6B6B6', 0.22), edgeMaterial('#B6B6B6', 0.22), edgeMaterial('#B6B6B6', 0.22),
    edgeMaterial('#B6B6B6', 0.22),
    new THREE.MeshStandardMaterial({
      map: makePlaceholderTexture(ph), roughness: 0.8, metalness: 0,
      transparent: true, opacity: 0.85,
    }),
    backMaterial(),
  ]);
  mesh.position.set(x, y, 0);
  attachTile(mesh, makeGlowQuad(x, y, '#8899aa', 0.04), false, {
    cur: { s: 1, e: 0.22, o: 0.85, g: 0.04, z: 0 },
    tgt: { s: 1, e: 0.22, o: 0.85, g: 0.04, z: 0 },
  });
}

// 列号条 1–18（单张贴图）
{
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(18 * PITCH, 0.46),
    new THREE.MeshBasicMaterial({
      map: makeColumnStripTexture(), transparent: true,
      opacity: 0.85, depthWrite: false, fog: false,
    })
  );
  strip.position.set(0, TOP_Y + 0.62, 0);
  tableGroup.add(strip);
}

// 拆行分组标签（镧系 / 锕系）
for (const [ypos, main, sub, cat] of [[8, '镧系', '57–71 · LA', 'lanthanide'], [9, '锕系', '89–103 · AC', 'actinide']]) {
  const { y } = gridPos(1.5, ypos);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.72),
    new THREE.MeshBasicMaterial({
      map: makeGroupLabelTexture(main, sub, cat),
      transparent: true, opacity: 0.92, depthWrite: false, fog: false,
    })
  );
  label.position.set((1.5 - 9.5) * PITCH, y, 0.02);
  tableGroup.add(label);
}

function applyTableTheme() {
  const theme = renderTheme();
  for (const mesh of allTiles) {
    const u = mesh.userData;
    const color = u.el ? categoryColor(u.el.category) : theme.placeholderText;
    mesh.material.slice(0, 4).forEach(material => {
      material.color.set(color).multiplyScalar(theme.edgeFactor);
      material.emissive.set(color);
      material.emissiveIntensity = theme.edgeEmission;
    });
    mesh.material[5].color.set(theme.back);
    u.glow.visible = !theme.light;
    if (!u.darkFront) {
      u.darkFront = mesh.material[4];
      u.lightFront = new THREE.MeshBasicMaterial({
        map: u.darkFront.map, transparent: true, opacity: u.cur.o, toneMapped: false,
      });
    }
    // Unlit ink faces avoid washing out text; the slab edges remain physically lit.
    mesh.material[4] = theme.light ? u.lightFront : u.darkFront;
    if (u.isTile) u.mat = mesh.material[4];
    for (const index of [0, 1, 2, 3, 5]) {
      mesh.material[index].transparent = theme.light;
      mesh.material[index].opacity = theme.light ? u.cur.o : 1;
      mesh.material[index].needsUpdate = true;
    }
  }
}
applyTableTheme();
onThemeChange(applyTableTheme);

/* ---------- 相机取景 ---------- */
/* ---------- 相机取景 ----------
   表格绕 X 轴倾斜后，远近边的透视缩放不同；对四角（含列号条）做 NDC 投影，
   二分求最小可行距离，保证任何宽高比下不出血。 */
export function fitDistance() {
  const vFov = camera.fov * Math.PI / 180;
  const tanV = Math.tan(vFov / 2);
  const tgtY = TABLE_CENTER_Y - 0.2;
  const corners = [];
  const ys = [TABLE_HALF_H, TOP_Y + 0.85];       // 主体上下边 + 列号条顶
  for (const yAbs of ys) {
    for (const sy of yAbs === TABLE_HALF_H ? [1, -1] : [1]) {
      for (const sx of [1, -1]) {
        const y = sy * yAbs;
        corners.push({
          x: sx * TABLE_HALF_W,
          ry: y - tgtY,
          z: -y * Math.sin(TILT),                 // rotation.x = TILT 后的深度
        });
      }
    }
  }
  const fits = d => {
    for (const c of corners) {
      const dz = Math.max(d - c.z, 0.5);          // 沿视方向的等效距离
      if (Math.abs(c.x) / (dz * tanV * camera.aspect) > 0.93) return false;
      if (Math.abs(c.ry) / (dz * tanV) > 0.88) return false;
    }
    return true;
  };
  let lo = 6, hi = 80;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid; else lo = mid;   // fits 随距离增大单调为真
  }
  return lo;
}

/* ---------- 每帧更新：行波 / hover / 淡入淡出 ---------- */
const K = 1 - Math.exp(-6.5); // 阻尼系数（帧率无关）
export function updateTable(dt, time) {
  for (const m of allTiles) {
    const u = m.userData;
    if (!REDUCED) {
      const col = u.el ? u.el.xpos : 0;
      m.position.y = u.baseY + Math.sin(time * 0.85 + col * 0.5 + u.phase) * 0.1;
    } else {
      m.position.y = u.baseY;
    }
    const c = u.cur, t = u.tgt;
    c.s += (t.s - c.s) * K; c.e += (t.e - c.e) * K;
    c.o += (t.o - c.o) * K; c.g += (t.g - c.g) * K;
    c.z += (t.z - c.z) * K;
    m.scale.setScalar(c.s);
    m.position.z = c.z;
    if (u.mat) { u.mat.emissiveIntensity = c.e * renderTheme().emissionScale; u.mat.opacity = c.o; }
    if (renderTheme().light) {
      for (const index of [0, 1, 2, 3, 5]) m.material[index].opacity = c.o;
    }
    if (u.glow) u.glow.material.opacity = c.g;
  }
}

/* ---------- hover / 视图状态 ---------- */
export function setHovered(mesh) {
  for (const m of tiles) {
    const u = m.userData;
    const on = m === mesh;
    u.tgt.s = on ? 1.1 : 1;
    u.tgt.e = on ? 1.5 : 0.42;
    u.tgt.g = on ? 0.95 : 0.15;
    u.tgt.z = on ? 0.1 : 0;
  }
}

/* 进入原子视图：其余格淡出压暗，选中格保持并提亮 */
export function setTableDimmed(selected) {
  for (const m of tiles) {
    const u = m.userData;
    if (m === selected) { u.tgt.o = 1; u.tgt.e = 0.75; u.tgt.s = 1.06; u.tgt.g = 0.5; }
    else { u.tgt.o = 0.07; u.tgt.e = 0.06; u.tgt.g = 0.0; }
  }
}
export function setTableRestore() {
  for (const m of tiles) {
    const u = m.userData;
    u.tgt.o = 1; u.tgt.e = 0.42; u.tgt.s = 1; u.tgt.g = 0.15; u.tgt.z = 0;
  }
}

export const interactiveTiles = tiles;
