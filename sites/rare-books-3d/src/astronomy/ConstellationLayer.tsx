/**
 * ConstellationLayer —— 复古星座插画「全息浮雕」层
 * ─────────────────────────────────────────────────────────────
 * - 材质使用 Three.MultiplyBlending（墨线 × 纸面）：透明处不动纸面，
 *   墨线处相乘变暗，与羊皮纸真正融为一体（见 bookResources.ts）。
 * - 升起：由时间线的 rise 0→1 驱动，z 从纸面抬到空中，同时透明度淡入、轻微放大。
 * - 视差：鼠标归一化坐标 → 目标旋转，用指数阻尼逼近
 *       cur += (target − cur) · (1 − e^(−λ·dt))，λ = 6/s
 *   → 不绑帧率、无过冲，关掉时平滑回正。
 */
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SpreadDimensions } from './bookResources';

export interface ConstellationLayerHandle {
  setRise: (v: number) => void;
  setParallax: (on: boolean) => void;
  setVisible: (v: boolean) => void;
}

export interface ConstellationLayerProps {
  spread: SpreadDimensions;
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
  /** 时间线驱动的升起进度 0..1 */
  riseRef: React.MutableRefObject<{ value: number }>;
  /** 全局归一化指针 [-1, 1] */
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  /** 视差阻尼系数 λ（1/s） */
  damping?: number;
  /** 最大摇晃幅度（弧度） */
  amplitude?: number;
  /** 升起高度（米） */
  lift?: number;
  onHandle?: (handle: ConstellationLayerHandle) => void;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const ConstellationLayer = ({
  spread,
  geometry,
  material,
  riseRef,
  pointer,
  damping = 6,
  amplitude = 0.075,
  lift = 0.1,
  onHandle,
}: ConstellationLayerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const riseCur = useRef({ x: 0, y: 0 }); // 阻尼后的当前旋转
  const parallaxRef = useRef(false);
  const visibleRef = useRef(false);

  useLayoutEffect(() => {
    onHandle?.({
      setRise: (v) => {
        riseRef.current.value = v;
      },
      setParallax: (on) => {
        parallaxRef.current = on;
      },
      setVisible: (v) => {
        visibleRef.current = v;
        const g = groupRef.current;
        if (g) g.visible = v;
      },
    });
  }, [onHandle, riseRef]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g || !visibleRef.current) return;

    // ① 升起（纸面 → 空中）；墨水通过 uInk 淡入（MultiplyBlending 忽略 opacity）
    const e = easeOutCubic(riseRef.current.value);
    g.position.z = spread.thickness * 0.5 + 0.006 + e * lift;
    g.scale.setScalar(0.93 + 0.07 * e);
    material.opacity = e; // 透明 alpha 混合：直接用 opacity 淡入

    // ② 阻尼视差：目标 = 鼠标位置 × 幅度；λ 固定则与帧率无关
    const tx = parallaxRef.current ? -pointer.current.y * amplitude : 0;
    const ty = parallaxRef.current ? pointer.current.x * amplitude * 1.15 : 0;
    const k = 1 - Math.exp(-damping * Math.min(0.1, delta));
    riseCur.current.x += (tx - riseCur.current.x) * k;
    riseCur.current.y += (ty - riseCur.current.y) * k;
    g.rotation.x = riseCur.current.x;
    g.rotation.y = riseCur.current.y;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* renderOrder=1：保证画在书页之后；depthWrite=false：不遮挡背后星轨 */}
      <mesh geometry={geometry} material={material} renderOrder={1} />
    </group>
  );
};
