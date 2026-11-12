/**
 * 微尘粒子系统：100 个缓慢漂浮的尘埃，集中在主光源（夕阳斜照）照射区域。
 * 单个 BufferGeometry + PointsMaterial（加法混合），位置在 useFrame 中原位更新，
 * 不产生任何 GC 压力。prefers-reduced-motion 时静止。
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../lib/prng';

export interface DustMotesProps {
  count?: number;
  reducedMotion?: boolean;
  /** 微尘活动范围 */
  area?: { x: number; yMin: number; yMax: number; zMin: number; zMax: number };
}

export function DustMotes({ count = 100, reducedMotion = false, area }: DustMotesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const x = area?.x ?? 1.6;
  const yMin = area?.yMin ?? 0.15;
  const yMax = area?.yMax ?? 2.1;
  const zMin = area?.zMin ?? 0.2;
  const zMax = area?.zMax ?? 1.35;

  const { positions, seeds } = useMemo(() => {
    const rng = mulberry32(0x5eed);
    const positions = new Float32Array(count * 3);
    // 每颗粒子：3 个方向的漂浮速度 + 1 个相位
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rng() * 2 - 1) * x;
      positions[i * 3 + 1] = yMin + rng() * (yMax - yMin);
      positions[i * 3 + 2] = zMin + rng() * (zMax - zMin);
      seeds[i * 4] = 0.05 + rng() * 0.12;
      seeds[i * 4 + 1] = 0.04 + rng() * 0.1;
      seeds[i * 4 + 2] = 0.04 + rng() * 0.1;
      seeds[i * 4 + 3] = rng() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count, x, yMin, yMax, zMin, zMax]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points || reducedMotion) return;
    const t = clock.elapsedTime;
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const s = i * 4;
      const phase = seeds[s + 3];
      arr[i * 3] = positions[i * 3] + Math.sin(t * seeds[s] + phase) * 0.055;
      arr[i * 3 + 1] = positions[i * 3 + 1] + Math.sin(t * seeds[s + 1] + phase * 1.7) * 0.075;
      arr[i * 3 + 2] = positions[i * 3 + 2] + Math.cos(t * seeds[s + 2] + phase * 0.6) * 0.045;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.0075}
        color="#ffd9a0"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
