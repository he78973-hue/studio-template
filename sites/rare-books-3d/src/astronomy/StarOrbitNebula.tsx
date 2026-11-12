/**
 * StarOrbitNebula —— 天文学「星历轨道」粒子系统
 * ─────────────────────────────────────────────────────────────
 * 动态顶点更新：位置不靠静态缓冲，而是每帧在 useFrame 里用原生 Float32Array
 * 现算，再置 geometry.attributes.position.needsUpdate = true 上传 GPU。
 *
 * 每颗粒子的运动 = 三层叠加：
 *   ① 开普勒椭圆轨道（焦点在书页中心 [0,0,0]）：
 *        r(θ) = a(1−e²) / (1 + e·cosθ)            —— 极坐标形式，太阳/书在焦点
 *        dθ/dt = k / max(r², rMin²)               —— 开普勒第二定律（近拱点加速）
 *      再用倾角 i 与升交点黄经 Ω 把轨道平面旋转到 3D（矩阵元素按粒子预计算一次）。
 *   ② 分层「绽放」：bloom 0→1 由 GSAP 时间线驱动，每颗粒子带 delay，
 *        spread = easeOutCubic((bloom − delay) / (1 − delay)) × scale
 *      → bloom = 0 时所有粒子精确聚在书页中心，随时间线错落向外展开。
 *   ③ 喷涌冲量：sprayK = 4·spread·(1−spread)，在 spread = 0.5 处最大、
 *      两端为 0 —— 粒子先从书页缝隙「涌出」，再平滑归位到自己的轨道。
 *
 * 性能：1800 颗粒子每帧仅 2 次三角函数（θ 的 sin/cos；轨道姿态矩阵已预计算），
 *       闪烁交给顶点着色器的 uTime，无需逐帧改属性。
 */
import { useLayoutEffect, useRef } from 'react';

const scaleVec = new THREE.Vector2();
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitParams } from './bookResources';
import { fillNebulaStaticAttributes, generateOrbitParams } from './bookResources';

export interface StarOrbitNebulaHandle {
  setBloom: (v: number) => void;
  setVisible: (v: boolean) => void;
  setOpacity: (v: number) => void;
}

export interface StarOrbitNebulaProps {
  bookId: string;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  /** 时间线驱动的绽放进度 0..1 */
  bloomRef: React.MutableRefObject<{ value: number }>;
  /** 时间线驱动的整体不透明度 0..1 */
  opacityRef: React.MutableRefObject<{ value: number }>;
  onHandle?: (handle: StarOrbitNebulaHandle) => void;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 与 GSAP power2.out 同形的缓动，保证 CPU 侧绽放与时间线手感一致 */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const StarOrbitNebula = ({
  bookId,
  geometry,
  material,
  bloomRef,
  opacityRef,
  onHandle,
}: StarOrbitNebulaProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const visibleRef = useRef(false);

  // 轨道参数按 bookId 确定性生成（换书重挂载时与缓存的位置缓冲保持一致）
  const params = useRef<OrbitParams>(generateOrbitParams(bookId));
  // 预计算每颗粒子的轨道姿态矩阵元素（静态，避免每帧 4 次三角函数）
  const attitude = useRef<{
    m00: Float32Array;
    m10: Float32Array;
    m01: Float32Array;
    m11: Float32Array;
    m21: Float32Array;
  }>({ m00: new Float32Array(0), m10: new Float32Array(0), m01: new Float32Array(0), m11: new Float32Array(0), m21: new Float32Array(0) });

  useLayoutEffect(() => {
    const p = generateOrbitParams(bookId);
    params.current = p;
    const m00 = new Float32Array(p.count);
    const m10 = new Float32Array(p.count);
    const m01 = new Float32Array(p.count);
    const m11 = new Float32Array(p.count);
    const m21 = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const cO = Math.cos(p.node[i]);
      const sO = Math.sin(p.node[i]);
      const ci = Math.cos(p.inc[i]);
      const si = Math.sin(p.inc[i]);
      m00[i] = cO; //  x =  cosΩ·px − sinΩ·cos i·py
      m10[i] = sO; //  y =  sinΩ·px + cosΩ·cos i·py
      m01[i] = -sO * ci; //      z =  sin i·py
      m11[i] = cO * ci;
      m21[i] = si;
    }
    attitude.current = { m00, m10, m01, m11, m21 };
    fillNebulaStaticAttributes(geometry, p);
    // 复位到书页中心，等待时间线触发绽放
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
    (pos.array as Float32Array).fill(0);
    pos.needsUpdate = true;
  }, [bookId, geometry]);

  // 句柄：给 manager 的时间线回调用（不触发 React 重渲染）
  useLayoutEffect(() => {
    onHandle?.({
      setBloom: (v) => {
        bloomRef.current.value = v;
      },
      setVisible: (v) => {
        visibleRef.current = v;
        const points = pointsRef.current;
        if (points) points.visible = v;
      },
      setOpacity: (v) => {
        opacityRef.current.value = v;
      },
    });
  }, [onHandle, bloomRef, opacityRef]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points || !visibleRef.current) return;

    // 时间线进度 → 着色器 uniform
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uOpacity.value = opacityRef.current.value;
    // 尺寸衰减基准：绘制缓冲高度/2（随 DPR 与画布尺寸变化）
    state.gl.getDrawingBufferSize(scaleVec);
    material.uniforms.uScale.value = scaleVec.y * 0.5;

    const bloom = bloomRef.current.value;
    if (bloom <= 0) {
      // 未触发：保持聚拢（仍写入一次，避免上一本书残留）
      return;
    }

    const p = params.current;
    const att = attitude.current;
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const dt = Math.min(0.05, delta); // 切后台回来时钳制步长，防跳轨

    for (let i = 0; i < p.count; i++) {
      const i3 = i * 3;
      const a = p.semiMajor[i];
      const e = p.ecc[i];
      const theta = p.theta[i];
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // ① 开普勒椭圆（焦点在原点）
      const r = Math.max(0.05, (a * (1 - e * e)) / (1 + e * cosT));
      const px = r * cosT;
      const py = r * sinT;
      const x1 = px * att.m00[i] + py * att.m01[i];
      const y1 = px * att.m10[i] + py * att.m11[i];
      const z1 = py * att.m21[i];

      // ② 分层绽放缓动（每颗粒子有 delay → 错落展开）
      const delay = p.delay[i];
      const local = clamp01((bloom - delay) / (1 - delay));
      const spread = easeOutCubic(local) * p.scale[i];

      // ③ 喷涌冲量：中段最强、两端为 0
      const sprayK = 4 * spread * (1 - spread) * 0.075;

      arr[i3] = x1 * spread + p.spray[i3] * sprayK;
      arr[i3 + 1] = y1 * spread + p.spray[i3 + 1] * sprayK;
      arr[i3 + 2] = z1 * spread + p.spray[i3 + 2] * sprayK;

      // 开普勒第二定律积分：角速度 ∝ 1/r²
      p.theta[i] = theta + (p.omega[i] / (r * r)) * dt;
    }

    attr.needsUpdate = true; // ← 每帧上传动态顶点
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} visible={false} />;
};
