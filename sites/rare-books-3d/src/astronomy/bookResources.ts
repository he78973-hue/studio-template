/**
 * 一本书的全部视觉资源（几何 / 材质 / 纹理）
 * ─────────────────────────────────────────────────────────────
 * 所有资源都登记进该书的 DisposalStack，并由 manager 在关闭/切换时统一 flush。
 * ensureBookResources 是幂等的：已创建则直接复用（避免 StrictMode 双挂载与
 * 重复打开时的重建掉帧）；prefetch（悬停预热）与组件挂载走同一条路径。
 */
import * as THREE from 'three';
import type { Book } from '../types';
import { applyMorph, createMorphPageGeometry } from './geometry';
import { createConstellationTexture, createParchmentRoughnessTexture, createParchmentTexture } from './parchment';
import { estimateTextureBytes, type BookResourceCache } from './resourceCache';

/** 星轨粒子数：兼顾密度与移动端性能（每帧 CPU 积分） */
export const NEBULA_COUNT = 1800;

export interface SpreadDimensions {
  /** 单页宽（米） */
  pageW: number;
  /** 页高（米） */
  pageH: number;
  /** 摊开总宽（米） */
  spreadW: number;
  /** 书页纸块厚度（米） */
  thickness: number;
}

/**
 * 由书目尺寸推导「摊开双页」尺寸。
 * 闭合书的 width = 书脊厚度 → 摊开后单页宽 ≈ depth（书口宽度）；
 * 再乘缩放系数，保证在相机前置距离下占据画面约 55%～65%，给文字留出空间。
 */
export function spreadDimensions(book: Book): SpreadDimensions {
  const pageW = book.dimensions.depth * 0.85;
  const pageH = book.dimensions.height * 0.9;
  return { pageW, pageH, spreadW: pageW * 2, thickness: Math.max(0.012, book.dimensions.width * 0.55) };
}

export interface BookVisualResources {
  spread: SpreadDimensions;
  pageGeometry: THREE.BufferGeometry;
  pageMaterial: THREE.MeshStandardMaterial;
  constellationGeometry: THREE.PlaneGeometry;
  constellationMaterial: THREE.MeshBasicMaterial;
  nebulaGeometry: THREE.BufferGeometry;
  nebulaMaterial: THREE.ShaderMaterial;
}

/** 生成星轨粒子的轨道参数（确定性，按 book.id 播种） */
export interface OrbitParams {
  count: number;
  /** 半长轴 a（米） */
  semiMajor: Float32Array;
  /** 离心率 e：0 = 圆轨道（行星星历），大 = 彗星轨道 */
  ecc: Float32Array;
  /** 轨道倾角 i（弧度） */
  inc: Float32Array;
  /** 升交点黄经 Ω */
  node: Float32Array;
  /** 当前真近点角 θ */
  theta: Float32Array;
  /** 角速度系数 k（开普勒第二定律：dθ/dt ∝ 1/r²） */
  omega: Float32Array;
  /** 绽放延迟 0..0.65（分层展开） */
  delay: Float32Array;
  /** 距离层次缩放 0.55..1.5 */
  scale: Float32Array;
  /** 喷涌初速方向（单位向量） */
  spray: Float32Array;
  /** 点尺寸 */
  size: Float32Array;
  /** 闪烁相位 */
  phase: Float32Array;
  /** 颜色（暖白 → 冰蓝 → 琥珀） */
  color: Float32Array;
}

export function generateOrbitParams(bookId: string, count = NEBULA_COUNT): OrbitParams {
  // 用 book.id 的哈希做种子：同一本书每次生成的星轨完全一致
  let seed = 0x811c9dc5;
  for (let i = 0; i < bookId.length; i++) {
    seed ^= bookId.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193);
  }
  const rng = (() => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  const p: OrbitParams = {
    count,
    semiMajor: new Float32Array(count),
    ecc: new Float32Array(count),
    inc: new Float32Array(count),
    node: new Float32Array(count),
    theta: new Float32Array(count),
    omega: new Float32Array(count),
    delay: new Float32Array(count),
    scale: new Float32Array(count),
    spray: new Float32Array(count * 3),
    size: new Float32Array(count),
    phase: new Float32Array(count),
    color: new Float32Array(count * 3),
  };

  for (let i = 0; i < count; i++) {
    const roll = rng();
    // 三类轨道：55% 圆形行星星历 / 30% 高偏心彗星 / 15% 近圆喷涌尾迹
    const isComet = roll > 0.55 && roll <= 0.85;
    const isSpray = roll > 0.85;

    // 半长轴 0.13~0.43；离心率上限 0.72（彗星近日点会探入避让区而淡出，
    // 视觉上就是「从图版背后掠过」）；具体避让由着色器 uClearInner/Outer 保证
    p.semiMajor[i] = 0.13 + rng() * (isComet ? 0.3 : 0.24);
    p.ecc[i] = isComet ? 0.36 + rng() * 0.36 : rng() * 0.14;
    p.inc[i] = (rng() - 0.5) * (isComet ? 1.05 : 0.5); // 彗星轨道更倾斜
    p.node[i] = rng() * Math.PI * 2;
    p.theta[i] = rng() * Math.PI * 2;
    // 开普勒角速度：k / r²；k 与轨道尺度正相关，整体放慢以显「星历」流动感
    p.omega[i] = (isComet ? 0.5 : 0.22) * (0.4 + rng() * 0.9) / Math.sqrt(p.semiMajor[i]);
    p.delay[i] = Math.pow(rng(), 1.4) * 0.65; // 幂律分布：少数先绽放，多数随后
    p.scale[i] = 0.8 + Math.pow(rng(), 0.7) * 0.75; // 最终半径 ≈ 0.1 ~ 0.72

    // 喷涌方向：以 +Z（朝向读者）为主的半球随机方向
    const sa = rng() * Math.PI * 2;
    const sz = 0.25 + rng() * 0.75;
    const sr = Math.sqrt(1 - sz * sz);
    p.spray[i * 3] = Math.cos(sa) * sr * (isSpray ? 0.5 : 0.28);
    p.spray[i * 3 + 1] = Math.sin(sa) * sr * (isSpray ? 0.5 : 0.28);
    p.spray[i * 3 + 2] = sz;

    // 世界直径（米）：普通星 5~11mm，彗星更亮 9~17mm
    p.size[i] = (isComet ? 0.0075 : 0.0042) + rng() * 0.005;
    p.phase[i] = rng();
    // 配色：多数暖白（羊皮纸上的金粉），少量冰蓝与琥珀
    const c = rng();
    if (c > 0.88) {
      p.color[i * 3] = 0.62;
      p.color[i * 3 + 1] = 0.78;
      p.color[i * 3 + 2] = 1.0;
    } else if (c > 0.76) {
      p.color[i * 3] = 1.0;
      p.color[i * 3 + 1] = 0.78;
      p.color[i * 3 + 2] = 0.42;
    } else {
      p.color[i * 3] = 1.0;
      p.color[i * 3 + 1] = 0.94;
      p.color[i * 3 + 2] = 0.8;
    }
  }
  return p;
}

const NEBULA_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScale;
  uniform float uOpacity;
  // 图版避让区：半径小于 uClearInner 的粒子完全淡出，到 uClearOuter 渐显
  uniform float uClearInner;
  uniform float uClearOuter;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    // 闪烁：每颗粒子独立相位的正弦调制
    float twinkle = 0.62 + 0.38 * sin(uTime * 2.1 + aPhase * 6.2831853);
    vAlpha = uOpacity * twinkle;
    // 避让：以书页中心为圆心的柔性空腔，星轨从图版背后/四周绕行而不压住墨线
    vAlpha *= smoothstep(uClearInner, uClearOuter, length(position));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // 透视尺寸衰减（与 three PointsMaterial 一致）：
    //   gl_PointSize = 世界直径 × (绘制缓冲高度/2) / 视距
    // aSize 以「米」计（0.005~0.016），0.63m 视距下约 2~6px。
    // ⚠️ 必须钳制上限：否则镜头一靠近，点尺寸按 1/距离 暴涨到几百像素，
    //    1800 个超大加法混合 sprite 会把填充率打爆（缩放卡顿的根因）。
    gl_PointSize = min(aSize * uScale / max(0.001, -mv.z) * (0.7 + 0.6 * twinkle), 16.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // 空灵柔光：以 1.6 次幂衰减的宽光晕，而非硬边圆点
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    float a = pow(1.0 - clamp(d, 0.0, 1.0), 1.6);
    if (vAlpha <= 0.001) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

export function ensureBookResources(book: Book, cache: BookResourceCache): BookVisualResources {
  const stack = cache.stackFor(book.id);
  const spread = spreadDimensions(book);

  // ── 书页（Morph Targets） ──
  let pageGeometry = stack.get<THREE.BufferGeometry>('pageGeometry');
  if (!pageGeometry) {
    pageGeometry = stack.track(
      'pageGeometry',
      createMorphPageGeometry({ pageWidth: spread.pageW, pageHeight: spread.pageH, segX: 14, segY: 18 }).geometry
    );
  }

  let pageMaterial = stack.get<THREE.MeshStandardMaterial>('pageMaterial');
  if (!pageMaterial) {
    const map = stack.track('pageMap', createParchmentTexture(1024, 512, book.id));
    const rough = stack.track('pageRough', createParchmentRoughnessTexture(512, 256, book.id));
    cache.addBytes(book.id, estimateTextureBytes(1024, 512) + estimateTextureBytes(512, 256));
    pageMaterial = stack.track(
      'pageMaterial',
      new THREE.MeshStandardMaterial({
        map,
        roughnessMap: rough,
        roughness: 0.94,
        metalness: 0,
        // 左页折到右页上方时会看到背面 → 双面渲染
        side: THREE.DoubleSide,
      })
    );
  }

  // ── 全息浮雕星座插画（Multiply 墨水层） ──
  let constellationGeometry = stack.get<THREE.PlaneGeometry>('constellationGeometry');
  if (!constellationGeometry) {
    constellationGeometry = stack.track(
      'constellationGeometry',
      // 图版略小于摊开纸面：留出一道纸边，读作「裱贴在纸上的铜版」
      new THREE.PlaneGeometry(spread.spreadW * 0.9, spread.pageH * 0.88)
    );
  }

  let constellationMaterial = stack.get<THREE.MeshBasicMaterial>('constellationMaterial');
  if (!constellationMaterial) {
    const tex = stack.track('constellationMap', createConstellationTexture(book, 512, 256));
    cache.addBytes(book.id, estimateTextureBytes(512, 256));
    /**
     * 黑/银/白三色线框图版：透明底 + 常规 alpha 混合。
     * - 透明处羊皮纸纹理直接透上来，纸感不失；
     * - depthWrite: false —— 不写深度，星轨粒子按距离排序自然从其背后穿过；
     * - opacity 由时间线的 rise 进度驱动淡入。
     */
    constellationMaterial = stack.track(
      'constellationMaterial',
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      })
    );
  }

  // ── 星轨粒子 ──
  let nebulaGeometry = stack.get<THREE.BufferGeometry>('nebulaGeometry');
  if (!nebulaGeometry) {
    nebulaGeometry = stack.track('nebulaGeometry', new THREE.BufferGeometry());
    const position = new Float32Array(NEBULA_COUNT * 3);
    const size = new Float32Array(NEBULA_COUNT);
    const phase = new Float32Array(NEBULA_COUNT);
    const color = new Float32Array(NEBULA_COUNT * 3);
    // 初始全部聚在原点（书页中心），由 bloom 驱动向外绽放
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage));
    nebulaGeometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    nebulaGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    nebulaGeometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    cache.addBytes(book.id, NEBULA_COUNT * (3 + 1 + 1 + 3) * 4);
  }

  let nebulaMaterial = stack.get<THREE.ShaderMaterial>('nebulaMaterial');
  if (!nebulaMaterial) {
    nebulaMaterial = stack.track(
      'nebulaMaterial',
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          // 绘制缓冲高度的一半（随画布尺寸/DPR 更新，见 StarOrbitNebula）
          uScale: { value: 250 },
          uOpacity: { value: 0 },
          // 图版半对角 ≈ 0.194m：内圈 0.20 全避让（保证图版内零星点），到 0.28 渐显
          uClearInner: { value: 0.2 },
          uClearOuter: { value: 0.28 },
        },
        vertexShader: NEBULA_VERTEX,
        fragmentShader: NEBULA_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
  }

  return {
    spread,
    pageGeometry,
    pageMaterial,
    constellationGeometry,
    constellationMaterial,
    nebulaGeometry,
    nebulaMaterial,
  };
}

/** 把静态属性（尺寸/相位/颜色）写入星轨几何（随书切换重建时调用一次） */
export function fillNebulaStaticAttributes(
  geometry: THREE.BufferGeometry,
  params: OrbitParams
): void {
  const size = geometry.getAttribute('aSize') as THREE.BufferAttribute;
  const phase = geometry.getAttribute('aPhase') as THREE.BufferAttribute;
  const color = geometry.getAttribute('aColor') as THREE.BufferAttribute;
  for (let i = 0; i < params.count; i++) {
    size.array[i] = params.size[i];
    phase.array[i] = params.phase[i];
    color.array[i * 3] = params.color[i * 3];
    color.array[i * 3 + 1] = params.color[i * 3 + 1];
    color.array[i * 3 + 2] = params.color[i * 3 + 2];
  }
  size.needsUpdate = true;
  phase.needsUpdate = true;
  color.needsUpdate = true;
}

/** 供 manager 复位书本形态 */
export { applyMorph };
