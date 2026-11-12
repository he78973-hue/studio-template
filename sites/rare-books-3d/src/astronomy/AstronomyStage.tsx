/**
 * AstronomyStage —— 沉浸模式演示舞台
 * ─────────────────────────────────────────────────────────────
 * 用法：
 *   <AstronomyBookProvider books={BOOKS} reducedMotion={false}>
 *     <AstronomyStage />
 *   </AstronomyBookProvider>
 *
 * 舞台本身只做三件事：布光、渲染 <AstronomyBookManager />、以及把
 * Context 的状态（phase / 时间线进度 / 显存占用）可视化出来，
 * 方便直接观察「统一时间线」与「GC 是否真的在擦显存」。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BOOKS, SECTIONS } from '../data/books';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { AstronomyBookManager, TIMELINE } from './AstronomyBookManager';
import { useAstronomyBook } from './AstronomyBookContext';
import { Icon } from '../lib/icons';
import type { Book } from '../types';

const PHASE_LABEL: Record<string, string> = {
  idle: '待机',
  opening: '展开中',
  open: '已展开',
  closing: '收起中',
};

/** 以 rAF 频率采样 ref（不触发 React 重渲染） */
function useSampler<T>(sample: () => T, onValue: (v: T) => void, active = true) {
  const cb = useRef(onValue);
  cb.current = onValue;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      cb.current(sample());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sample, active]);
}

/** 时间轴标尺：标出三阶段与重叠区间，播放头跟随时间线进度 */
function TimelineRuler() {
  const { progressRef, phase } = useAstronomyBook();
  const [progress, setProgress] = useState(0);
  const sample = useCallback(() => progressRef.current, [progressRef]);
  useSampler(sample, setProgress, phase !== 'idle');

  const pct = (t: number) => `${(t / TIMELINE.total) * 100}%`;

  return (
    <div className="astro-timeline">
      <div className="astro-timeline__head">
        <span className={`astro-pill astro-pill--${phase}`}>{PHASE_LABEL[phase] ?? phase}</span>
        <span className="astro-timeline__title">统一 GSAP 时间线 · 总时长 {TIMELINE.total.toFixed(1)}s</span>
        <span className="astro-timeline__clock">{(progress * TIMELINE.total).toFixed(2)}s</span>
      </div>
      <div className="astro-timeline__track">
        <div className="astro-timeline__seg astro-timeline__seg--fly" style={{ left: 0, width: pct(1) }}>
          <span>① 飞入 + Morph 翻开</span>
        </div>
        <div className="astro-timeline__seg astro-timeline__seg--nebula" style={{ left: pct(0.8), width: pct(0.7) }}>
          <span>② 星轨喷涌</span>
        </div>
        <div className="astro-timeline__seg astro-timeline__seg--constellation" style={{ left: pct(1.2), width: pct(0.8) }}>
          <span>③ 浮雕升起 + 视差</span>
        </div>
        <div className="astro-timeline__playhead" style={{ left: `${progress * 100}%` }} />
      </div>
      <p className="astro-timeline__hint">
        ② 与 ① 重叠 0.2s、③ 与 ② 重叠 0.6s —— 三段交织为一次连续「绽放」，而非首尾相接。
      </p>
    </div>
  );
}

/** 显存台账：直接读 BookResourceCache，验证 GC 是否真的在擦 */
function MemoryPanel() {
  const { resources, activeBookId } = useAstronomyBook();
  const [stats, setStats] = useState(resources.stats);
  const sample = useCallback(() => {
    const s = resources.stats;
    return `${s.books}/${s.entries}/${s.bytes}`;
  }, [resources]);
  useSampler(sample, () => setStats(resources.stats));

  return (
    <div className="astro-mem" title="每本书的粒子缓冲 / 羊皮纸纹理 / 浮雕纹理 / Morph 几何都登记在台账里，退场时统一 dispose">
      <span className="astro-mem__label">显存台账</span>
      <span className="astro-mem__value">
        {stats.books} 本 · {stats.entries} 项 · {(stats.bytes / 1048576).toFixed(2)} MB
      </span>
      <span className="astro-mem__note">{activeBookId ? '打开/切换即淘汰上一本' : '关闭后全部擦除'}</span>
    </div>
  );
}

function BookPicker() {
  const { books, activeBookId, openBook, prefetch, phase } = useAstronomyBook();
  return (
    <div className="astro-picker">
      <div className="astro-picker__head">馆藏 {books.length} 册（悬停预热 · 点击展开）</div>
      <div className="astro-picker__list">
        {SECTIONS.map((sec) => (
          <div key={sec.id} className="astro-picker__group">
            <div className="astro-picker__section">
              {sec.name} · {sec.nameZh}
            </div>
            {books
              .filter((b) => b.section === sec.id)
              .map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`astro-picker__item${activeBookId === b.id ? ' is-active' : ''}`}
                  onPointerEnter={() => prefetch(b.id)}
                  onFocus={() => prefetch(b.id)}
                  onClick={() => openBook(b.id)}
                  disabled={phase === 'closing'}
                >
                  <span className="astro-picker__title">《{b.title}》</span>
                  <span className="astro-picker__meta">
                    {b.author} · {b.year}
                  </span>
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Controls() {
  const { step, closeBook, phase, activeBookId } = useAstronomyBook();
  return (
    <div className="astro-controls">
      <button type="button" className="btn" onClick={() => step(-1)} disabled={phase === 'closing'}>
        <Icon name="arrow-left" size={15} />
        上一本
      </button>
      <button type="button" className="btn" onClick={() => step(1)} disabled={phase === 'closing'}>
        下一本
        <Icon name="arrow-right" size={15} />
      </button>
      <button type="button" className="btn btn--ghost" onClick={closeBook} disabled={!activeBookId || phase === 'closing'}>
        <Icon name="chevron-up" size={15} />
        收起
      </button>
    </div>
  );
}

/** 首帧取景：把「待命位姿」与书架视角纳入画面 */
function CameraRig() {
  const { camera, size } = useThree();
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const target = new THREE.Vector3(0, 0.55, 0.6);
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    const dist = Math.max(2.0, 1.15 / (Math.tan(fov / 2) * aspect), 1.15 / Math.tan(fov / 2));
    camera.position.set(0, 0.85, target.z + dist);
    camera.lookAt(target);
  }, [camera, size]);
  return null;
}

export function AstronomyStage() {
  const reducedMotion = usePrefersReducedMotion();

  // Esc 全局收起
  const { closeBook, phase, activeBookId } = useAstronomyBook();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBook();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeBook]);

  const activeBook: Book | null = activeBookId ? BOOKS.find((b) => b.id === activeBookId) ?? null : null;

  // 挂载后自动展开第一本：让「统一时间线」的效果立即可见（Esc / 收起 可回到待机）
  const { openBook, books } = useAstronomyBook();
  useEffect(() => {
    if (books.length === 0) return;
    const t = setTimeout(() => openBook(books[0].id), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="astro">
      <div className="astro__canvas">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 42, position: [0, 0.85, 2.6], near: 0.05, far: 40 }}
        >
          <color attach="background" args={['#140e08']} />
          <fog attach="fog" args={['#140e08', 4, 12]} />
          <CameraRig />

          {/* 同样的黄金时刻布光 */}
          <ambientLight color="#ffdfb8" intensity={0.7} />
          <directionalLight
            color="#ffb45e"
            intensity={2.4}
            position={[-2.6, 2.4, 2.6]}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-left={-2}
            shadow-camera-right={2}
            shadow-camera-top={2.5}
            shadow-camera-bottom={-1.5}
          />
          <pointLight color="#ffc98d" intensity={0.5} distance={6} decay={2} position={[1.4, 1.1, 1.6]} />

          {/* 地面：承接书本投影 */}
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.78, 0]} receiveShadow>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#2b2015" roughness={0.95} metalness={0} />
          </mesh>

          <AstronomyBookManager />

          <OrbitControls
            target={[0, 0.55, 0.6]}
            enableDamping
            dampingFactor={0.08}
            enablePan={false}
            // 允许一直推到星图跟前（全角度沉浸观察）
            minDistance={0.32}
            maxDistance={6}
            maxPolarAngle={1.85}
            makeDefault
          />
        </Canvas>
      </div>

      <div className="astro__ui">
        <div className="astro__top">
          <BookPicker />
          <div className="astro__side">
            <MemoryPanel />
            <Controls />
            {activeBook && (
              <div className="astro-now">
                <span className="astro-now__label">当前</span>
                <strong>《{activeBook.title}》</strong>
                <span>
                  {activeBook.author} · {activeBook.year} · {activeBook.titleEn}
                </span>
              </div>
            )}
          </div>
        </div>
        <TimelineRuler />
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {activeBook ? `已展开《${activeBook.title}》，${activeBook.author}，${activeBook.year}年` : '书架待机'}
      </div>
    </div>
  );
}
