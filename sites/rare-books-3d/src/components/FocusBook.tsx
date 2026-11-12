/**
 * FocusBook —— 「抽出查看」状态下的单本书。
 *
 * 为什么需要它：InstancedMesh 全局共享一份 material，无法只替换某一个实例的贴图。
 * 因此被点击的书会从 InstancedMesh「让位」（实例矩阵缩放归零），改由一个独立的
 * 焦点网格接管——它拥有自己的 material，可以：
 *   1. 先贴上与图集同源的中分辨率纹理（抽出过程无跳变）；
 *   2. 高分辨率纹理异步到位后，用两个网格交叉淡入完成「平滑替换」；
 *   3. 返回书架时释放纹理，实例复位。
 *
 * 同时存在「进入中」与「返回中」两本书时，各自持有独立实例，动画互不干扰。
 */
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import type { Book } from '../types';
import { computeCameraPose, createPose, easeInOutCubic } from '../lib/pose';
import type { SpineTextureManager } from '../lib/textures';

export interface FocusBookProps {
  book: Book;
  /** 书架上的静止位姿 */
  basePosition: [number, number, number];
  baseEuler: [number, number, number];
  /** 'enter' = 抽出查看；'exit' = 返回书架 */
  phase: 'enter' | 'exit';
  reducedMotion: boolean;
  textureManager: SpineTextureManager;
  /** 完全就位（供 Scene 打开 2D 模态框） */
  onReady: (bookId: string) => void;
  /** 返回完成（供 Scene 卸载本组件） */
  onDone: (bookId: string) => void;
  onTextureState: (bookId: string, state: 'loading' | 'ready' | 'released') => void;
  /** 点击书体 → 再次点击关闭 */
  onRequestClose: (bookId: string) => void;
  /** 实例让位 / 复位 */
  onInstanceHidden: (bookId: string, hidden: boolean) => void;
}

export function FocusBook(props: FocusBookProps) {
  const {
    book,
    basePosition,
    baseEuler,
    phase,
    reducedMotion,
    textureManager,
    onReady,
    onDone,
    onTextureState,
    onRequestClose,
    onInstanceHidden,
  } = props;

  const groupRef = useRef<THREE.Group>(null);
  const matLowRef = useRef<THREE.MeshStandardMaterial>(null);
  const matHighRef = useRef<THREE.MeshStandardMaterial>(null);

  /** 抽出进度：0 = 书架上原位，1 = 相机正前方（GSAP 补间的宿主对象） */
  const progress = useRef({ value: 0 });
  const camPose = useRef(createPose());
  const current = useRef({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion() });
  const cancelled = useRef(false);

  const base = useRef({
    position: new THREE.Vector3(...basePosition),
    quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(...baseEuler)),
    scale: new THREE.Vector3(book.dimensions.width, book.dimensions.height, book.dimensions.depth),
  });

  // 回调统一走 ref，避免父组件重渲染导致 effect 重复触发（GSAP 陷阱）
  const handlers = useRef({ onReady, onDone, onTextureState, onRequestClose, onInstanceHidden });
  handlers.current = { onReady, onDone, onTextureState, onRequestClose, onInstanceHidden };

  /* ── 进入 / 返回 ───────────────────────────────────────────── */
  useLayoutEffect(() => {
    const p = progress.current;
    const group = groupRef.current;
    if (!group) return;
    gsap.killTweensOf(p);

    if (phase === 'enter') {
      cancelled.current = false;
      handlers.current.onInstanceHidden(book.id, true); // 实例让位，避免共面闪烁
      group.visible = true;
      group.scale.copy(base.current.scale);
      group.position.copy(base.current.position);
      group.quaternion.copy(base.current.quaternion);
      current.current.position.copy(base.current.position);
      current.current.quaternion.copy(base.current.quaternion);

      // 中分辨率纹理（与书架图集同源）立即就位 → 抽出过程无跳变
      const matLow = matLowRef.current;
      if (matLow) {
        matLow.map = textureManager.getSpineTexture(book, 'mid');
        matLow.opacity = 1;
        matLow.visible = true;
        matLow.needsUpdate = true;
      }
      const matHigh = matHighRef.current;
      if (matHigh) {
        matHigh.opacity = 0;
        matHigh.map = null;
        matHigh.needsUpdate = true;
      }

      // GSAP：抽出进度 0 → 1；位姿由下方 useFrame 每帧插值，实时跟随相机
      gsap.to(p, {
        value: 1,
        duration: reducedMotion ? 0.001 : 0.95,
        ease: 'power3.inOut',
        onComplete: () => {
          if (!cancelled.current) handlers.current.onReady(book.id);
        },
      });

      // 纹理流式加载：高分辨率异步到位后交叉淡入替换
      handlers.current.onTextureState(book.id, 'loading');
      void textureManager.loadHighRes(book).then((texture) => {
        if (cancelled.current || !matHighRef.current) {
          textureManager.release(book.id);
          return;
        }
        const high = matHighRef.current;
        high.map = texture;
        high.opacity = 0;
        high.needsUpdate = true;
        handlers.current.onTextureState(book.id, 'ready');
        gsap.to(high, { opacity: 1, duration: 0.55, ease: 'power2.out' });
        const low = matLowRef.current;
        if (low) {
          gsap.to(low, {
            opacity: 0,
            duration: 0.55,
            ease: 'power2.out',
            onComplete: () => {
              if (matLowRef.current) matLowRef.current.visible = false;
            },
          });
        }
      });
    } else {
      // 返回书架：进度 1 → 0，useFrame 沿原路径插值回原位
      cancelled.current = true;
      gsap.killTweensOf(matLowRef.current ?? {});
      gsap.killTweensOf(matHighRef.current ?? {});
      gsap.to(p, {
        value: 0,
        duration: reducedMotion ? 0.001 : 0.72,
        ease: 'power3.inOut',
        onComplete: () => {
          if (groupRef.current) groupRef.current.visible = false;
          handlers.current.onInstanceHidden(book.id, false);
          textureManager.release(book.id); // LRU 释放中/高分辨率纹理
          handlers.current.onTextureState(book.id, 'released');
          handlers.current.onDone(book.id);
        },
      });
    }

    return () => {
      gsap.killTweensOf(p);
    };
  }, [phase, book, reducedMotion, textureManager]);

  /* ── 每帧位姿：书架原位 ⇄ 相机正前方 ───────────────────────── */
  useFrame(({ camera }) => {
    const p = progress.current.value;
    const group = groupRef.current;
    if (!group || p <= 0) return;

    // 相机位姿实时重算：抽出过程中继续拖动 OrbitControls，书本始终追随相机
    computeCameraPose(camera, book, camPose.current);
    const e = easeInOutCubic(p);
    current.current.position.lerpVectors(base.current.position, camPose.current.position, e);
    current.current.quaternion.slerpQuaternions(base.current.quaternion, camPose.current.quaternion, e);

    group.position.copy(current.current.position);
    group.quaternion.copy(current.current.quaternion);
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* renderOrder 0/1 + 相同几何体：高分辨率网格稳定覆盖在低分辨率网格之上，
          从而用 opacity 完成交叉淡入，无需自定义着色器 */}
      <mesh renderOrder={0} onClick={(e) => { e.stopPropagation(); handlers.current.onRequestClose(book.id); }}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial ref={matLowRef} transparent depthWrite roughness={0.58} metalness={0.05} />
      </mesh>
      <mesh renderOrder={1}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial ref={matHighRef} transparent depthWrite roughness={0.5} metalness={0.08} />
      </mesh>
    </group>
  );
}
