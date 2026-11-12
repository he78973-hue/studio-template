/**
 * 带 Morph Targets 的「摊开书页」几何体
 * ─────────────────────────────────────────────────────────────
 * 需求：书本飞至镜头前后，用 Morph Targets（而非逐帧改顶点）把书「翻开」。
 *
 * 建模约定（书本局部坐标系）：
 *   - 书页平铺在 XY 平面，书脊（装订线）沿 Y 轴、位于 x = 0；
 *   - 右页 x ∈ [0, pageW]，左页 x ∈ [-pageW, 0]，总摊开宽度 = 2 × pageW；
 *   - 基准姿态 = 「完全摊开」（两页都在 z = 0）。
 *
 * 两个形变目标（morphAttributes.position[0..1]）：
 *   [0] fold  —— 左页绕书脊（Y 轴）旋转 φ = π − ε 折到右页上方（合上书）。
 *               绕 Y 轴旋转矩阵：x' = x·cosφ + z·sinφ，z' = −x·sinφ + z·cosφ。
 *               因 x < 0，取 φ = π − ε 时 x' ≈ +|x|（正好叠到右页上），
 *               z' ≈ ε·|x| > 0（自然抬起，避开与右页共面闪烁）。
 *   [1] curl  —— 摊开后纸面的轻微外卷（阅读时的自然垂坠）：
 *               z += amp · (|x|/pageW)^1.5 · (1 − 0.25·|y|/(pageH/2))
 *               自由边（|x| = pageW）卷得最多，书脊处为 0。
 *
 * 形变法线：[0] 随刚体旋转同步旋转（精确）；[1] 近似复用基准法线（视觉无差）。
 * 驱动方式：mesh.morphTargetInfluences[0/1] ∈ [0,1]，由 GSAP 时间线补间。
 */
import * as THREE from 'three';
import { estimateGeometryBytes } from './resourceCache';

export interface MorphPageGeometryOptions {
  /** 单页宽度（米） */
  pageWidth: number;
  /** 页高（米） */
  pageHeight: number;
  /** 每页横向分段（越高，纸面弯曲越细腻） */
  segX?: number;
  /** 每页纵向分段 */
  segY?: number;
}

export interface MorphPageGeometryResult {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  indexCount: number;
  /** 估算显存占用（字节） */
  bytes: number;
}

export function createMorphPageGeometry({
  pageWidth,
  pageHeight,
  segX = 14,
  segY = 18,
}: MorphPageGeometryOptions): MorphPageGeometryResult {
  const cols = segX + 1;
  const rows = segY + 1;
  const perHalf = cols * rows;
  const vertexCount = perHalf * 2;

  const position = new Float32Array(vertexCount * 3);
  const normal = new Float32Array(vertexCount * 3);
  const uv = new Float32Array(vertexCount * 2);
  const foldPos = new Float32Array(vertexCount * 3);
  const foldNrm = new Float32Array(vertexCount * 3);
  const curlPos = new Float32Array(vertexCount * 3);

  // 索引总数 = 2 页 × segX × segY × 6（每格 2 个三角形 × 3 顶点）
  const indexCount = 2 * segX * segY * 6;
  const index = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);

  // 合上时的折叠角：π − ε。ε 越小越「合拢」，但需保留余量避免共面闪烁
  const FOLD_EPS = 0.035;
  const cosPhi = Math.cos(Math.PI - FOLD_EPS); // ≈ −0.9994
  const sinPhi = Math.sin(Math.PI - FOLD_EPS); // ≈ +0.035
  const CURL_AMP = pageWidth * 0.075;

  let vi = 0; // 顶点游标
  let ii = 0; // 索引游标

  // 依次生成右页（half = 0）与左页（half = 1）
  for (let half = 0; half < 2; half++) {
    const sign = half === 0 ? +1 : -1; // 右页 x 递增，左页 x 递减
    const base = half * perHalf;

    for (let iy = 0; iy < rows; iy++) {
      const v = iy / segY; // 0..1 自下而上
      const y = (v - 0.5) * pageHeight;
      for (let ix = 0; ix < cols; ix++) {
        const u = ix / segX; // 0..1 自书脊向自由边
        const x = sign * u * pageWidth;

        const o3 = vi * 3;
        const o2 = vi * 2;

        // 基准（摊开）
        position[o3] = x;
        position[o3 + 1] = y;
        position[o3 + 2] = 0;
        // 摊平时法线朝读者（+Z）
        normal[o3] = 0;
        normal[o3 + 1] = 0;
        normal[o3 + 2] = 1;
        // UV：左页镜像 u，保证羊皮纸纹理不左右颠倒
        uv[o2] = half === 0 ? u : 1 - u;
        uv[o2 + 1] = v;

        if (half === 0) {
          // 右页不参与折叠：形变目标与基准一致（影响权重对右页无副作用）
          foldPos[o3] = x;
          foldPos[o3 + 1] = y;
          foldPos[o3 + 2] = 0;
          foldNrm[o3] = 0;
          foldNrm[o3 + 1] = 0;
          foldNrm[o3 + 2] = 1;
        } else {
          // 左页绕书脊（Y 轴）旋转 (π − ε)
          const x0 = x;
          const z0 = 0;
          foldPos[o3] = x0 * cosPhi + z0 * sinPhi;
          foldPos[o3 + 1] = y;
          foldPos[o3 + 2] = -x0 * sinPhi + z0 * cosPhi + 0.0015; // 额外微抬，双保险
          // 刚体旋转同步旋转法线
          foldNrm[o3] = 0 * cosPhi + 1 * sinPhi;
          foldNrm[o3 + 1] = 0;
          foldNrm[o3 + 2] = -0 * sinPhi + 1 * cosPhi;
        }

        // 纸面外卷：自由边卷曲大、书脊处为 0，上下缘略微收敛
        const t = Math.abs(x) / pageWidth;
        curlPos[o3] = x;
        curlPos[o3 + 1] = y;
        curlPos[o3 + 2] = CURL_AMP * Math.pow(t, 1.5) * (1 - 0.25 * Math.abs(y) / (pageHeight / 2));

        vi++;
      }
    }

    // 索引（两页各自成网格）
    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = base + iy * cols + ix;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        index[ii++] = a;
        index[ii++] = c;
        index[ii++] = b;
        index[ii++] = b;
        index[ii++] = c;
        index[ii++] = d;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));

  // ── Morph Targets ──
  const foldAttr = new THREE.BufferAttribute(foldPos, 3);
  const foldNormalAttr = new THREE.BufferAttribute(foldNrm, 3);
  const curlAttr = new THREE.BufferAttribute(curlPos, 3);
  geometry.morphAttributes.position = [foldAttr, curlAttr];
  geometry.morphAttributes.normal = [foldNormalAttr, foldNormalAttr]; // curl 近似复用
  geometry.computeBoundingSphere();

  return {
    geometry,
    vertexCount,
    indexCount,
    bytes: estimateGeometryBytes(vertexCount, indexCount, 2),
  };
}

/** 把 morph 权重写入网格（时间线每帧调用；fold 1=合上 0=摊开，curl 0..1 外卷） */
export function applyMorph(mesh: THREE.Mesh | null, fold: number, curl: number): void {
  if (!mesh) return;
  /**
   * 关键细节：three 只在 Mesh「构造时」根据 geometry.morphAttributes 初始化
   * morphTargetInfluences；而 R3F 是先 new Mesh() 再挂 geometry，
   * 所以这里必须是 undefined —— 不补初始化，渲染循环读 .length 会直接抛错
   * （表现为整帧渲染失败、画面全黑）。updateMorphTargets() 会按当前 geometry 重建。
   */
  if (!mesh.morphTargetInfluences || mesh.morphTargetInfluences.length < 2) {
    mesh.updateMorphTargets();
    if (!mesh.morphTargetInfluences) mesh.morphTargetInfluences = [0, 0];
  }
  mesh.morphTargetInfluences[0] = THREE.MathUtils.clamp(fold, 0, 1);
  mesh.morphTargetInfluences[1] = THREE.MathUtils.clamp(curl, 0, 1);
}
