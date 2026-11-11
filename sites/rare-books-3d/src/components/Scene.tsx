/**
 * Scene —— 场景编排层。
 * 职责：把 React 状态（activeBookId / activeSectionId / hoveredBookId）与
 * 3D 世界双向同步；提供黄金时刻光影、微尘、相机与 OrbitControls；
 * 承载键盘导航（← → 换书、↑ ↓ 换分区、Enter 详情、Esc 返回）与 ARIA 播报。
 */
import { useCallback, useEffect, useMemo, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BOOKS, SECTIONS } from '../data/books';
import { computeShelfLayout } from '../lib/layout';
import { SpineTextureManager } from '../lib/textures';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { Bookshelf } from './Bookshelf';
import { DustMotes } from './DustMotes';
import { SectionTabs } from './SectionTabs';
import { BookModal } from './BookModal';
import { Hud } from './Hud';
import type { Book, SectionId } from '../types';

/** 书架中心（OrbitControls 的默认目标） */
const SHELF_TARGET = new THREE.Vector3(0, 1.0, 0.15);

export function Scene() {
  const reducedMotion = usePrefersReducedMotion();

  /* ── 数据与布局 ─────────────────────────────────────────────── */
  const layout = useMemo(() => computeShelfLayout(BOOKS), []);
  const bookById = useMemo(() => new Map(BOOKS.map((b) => [b.id, b])), []);
  const textureManager = useMemo(() => new SpineTextureManager(), []);

  /** 分区 → 书架顺序的书目 */
  const sectionBooks = useMemo(() => {
    const map = new Map<SectionId, Book[]>();
    for (const sec of SECTIONS) {
      map.set(
        sec.id,
        layout.placements
          .filter((p) => p.section === sec.id)
          .sort((a, b) => a.sectionIndex - b.sectionIndex)
          .map((p) => p.book)
      );
    }
    return map;
  }, [layout]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const sec of SECTIONS) c[sec.id] = (sectionBooks.get(sec.id) ?? []).length;
    return c;
  }, [sectionBooks]);

  /* ── React 状态（3D 的唯一真源） ────────────────────────────── */
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('first-editions');
  const [modalBookId, setModalBookId] = useState<string | null>(null);
  const [textureState, setTextureState] = useState<{ id: string; state: 'loading' | 'ready' | 'released' } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [stats, setStats] = useState(() => textureManager.stats);

  const controlsRef = useRef<React.ElementRef<typeof OrbitControls> | null>(null);

  useEffect(() => () => textureManager.dispose(), [textureManager]);
  useEffect(() => setStats(textureManager.stats), [textureManager, textureState, activeBookId]);

  /* ── 3D → React 回调 ────────────────────────────────────────── */
  const handleRequestActivate = useCallback(
    (id: string) => {
      const book = bookById.get(id);
      if (book) setActiveSectionId(book.section); // 点哪区的书，聚焦哪区
      setActiveBookId((cur) => (cur === id ? null : id)); // 再次点击同一本 = 返回
      setModalBookId(null); // 切换时先收起详情，等新书就位再打开
    },
    [bookById]
  );

  const handleFocusReady = useCallback(
    (id: string) => {
      setModalBookId(id); // 抽出动画完全就位 → 打开 2D 详情
      const book = bookById.get(id);
      if (book) {
        setAnnouncement(`《${book.title}》已抽出就位：${book.author}，${book.year}年。按 Esc 返回书架。`);
      }
    },
    [bookById]
  );

  const handleFocusLeave = useCallback((id: string) => {
    setModalBookId((cur) => (cur === id ? null : cur));
  }, []);

  const handleHoverChange = useCallback(
    (id: string | null) => {
      setHoveredBookId(id);
      if (id) {
        const book = bookById.get(id);
        if (book) setAnnouncement(`悬停《${book.title}》，${book.author}，${book.year}年`);
      }
    },
    [bookById]
  );

  const handleTextureState = useCallback((id: string, state: 'loading' | 'ready' | 'released') => {
    setTextureState({ id, state });
  }, []);

  const handleSectionChange = useCallback(
    (id: SectionId) => {
      setActiveSectionId(id);
      setActiveBookId(null);
      setModalBookId(null);
      const sec = SECTIONS.find((s) => s.id === id);
      setAnnouncement(`已切换分区：${sec?.nameZh ?? ''}，共 ${counts[id] ?? 0} 册`);
    },
    [counts]
  );

  /** 分区聚焦：相机与 OrbitControls 目标平滑移到对应书区（首次挂载跳过，保留全景取景） */
  const sectionFocusDone = useRef(false);
  useEffect(() => {
    const controls = controlsRef.current;
    const bay = layout.bays.find((b) => b.section === activeSectionId);
    if (!controls || !bay) return;
    if (!sectionFocusDone.current) {
      sectionFocusDone.current = true;
      return;
    }
    const camera = controls.object;
    const target = new THREE.Vector3(bay.center[0], 1.05, SHELF_TARGET.z);
    // 固定俯视角，距离随分区收敛，保证切换后该书区占据画面主体
    const dir = new THREE.Vector3(0, 0.16, 1).normalize();
    const camPos = target.clone().addScaledVector(dir, 2.45);
    const dur = reducedMotion ? 0.001 : 0.9;
    const onUpdate = () => controls.update();
    gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease: 'power2.inOut', onUpdate });
    gsap.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z, duration: dur, ease: 'power2.inOut', onUpdate });
    return () => {
      gsap.killTweensOf(controls.target);
      gsap.killTweensOf(camera.position);
    };
  }, [activeSectionId, layout, reducedMotion]);

  /* ── 键盘导航 ───────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (t.closest('[data-nav-zone]')) return; // 标签页自行处理方向键
      if (t.closest('[role="dialog"]') && (e.key === 'Enter' || e.key === ' ')) return; // 按钮自己处理回车

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault();
          const list = sectionBooks.get(activeSectionId) ?? [];
          if (list.length === 0) return;
          const idx = activeBookId ? list.findIndex((b) => b.id === activeBookId) : -1;
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = list[(((idx + dir) % list.length) + list.length) % list.length];
          setActiveSectionId(next.section);
          setActiveBookId(next.id);
          setModalBookId(null);
          setAnnouncement(`已选中《${next.title}》，${next.author}，${next.year}年。按 Enter 查看详情。`);
          break;
        }
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const i = SECTIONS.findIndex((s) => s.id === activeSectionId);
          const dir = e.key === 'ArrowDown' ? 1 : -1;
          const next = SECTIONS[(i + dir + SECTIONS.length) % SECTIONS.length];
          setActiveSectionId(next.id);
          setActiveBookId(null);
          setModalBookId(null);
          setAnnouncement(`已切换分区：${next.nameZh}，共 ${counts[next.id] ?? 0} 册`);
          break;
        }
        case 'Enter': {
          if (!activeBookId) return;
          e.preventDefault();
          setModalBookId((cur) => (cur === activeBookId ? null : activeBookId));
          break;
        }
        case 'Escape': {
          if (!activeBookId) return;
          e.preventDefault();
          setActiveBookId(null);
          setModalBookId(null);
          setAnnouncement('已返回书架');
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeBookId, activeSectionId, sectionBooks, counts]);

  /* ── 模态框 ─────────────────────────────────────────────────── */
  const modalBook = modalBookId ? bookById.get(modalBookId) ?? null : null;
  const coverUrl = useMemo(
    () => (modalBook ? textureManager.getCoverDataURL(modalBook) : ''),
    [modalBook, textureManager]
  );

  const stepModal = useCallback(
    (dir: 1 | -1) => {
      const list = sectionBooks.get(activeSectionId) ?? [];
      if (!modalBookId || list.length === 0) return;
      const i = list.findIndex((b) => b.id === modalBookId);
      const next = list[(i + dir + list.length) % list.length];
      setActiveSectionId(next.section);
      setActiveBookId(next.id);
      setModalBookId(null);
    },
    [modalBookId, activeSectionId, sectionBooks]
  );

  /* ── 点击背景关闭（区分拖拽旋转与点击） ──────────────────────── */
  const pointerStart = useRef({ x: 0, y: 0 });
  const dismissActive = useCallback(() => {
    if (!activeBookId) return;
    setActiveBookId(null);
    setModalBookId(null);
    setAnnouncement('已返回书架');
  }, [activeBookId]);

  // 地板/墙/木框都是 mesh，点击它们不会触发 onPointerMissed，
  // 因此背景关闭要同时覆盖「命中房间」与「什么都没命中」两种情况。
  const handleBackgroundClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      const ne = e.nativeEvent as MouseEvent;
      if (Math.hypot(ne.clientX - pointerStart.current.x, ne.clientY - pointerStart.current.y) > 6) return;
      dismissActive();
    },
    [dismissActive]
  );

  const handlePointerMissed = useCallback(
    (e: MouseEvent) => {
      if (Math.hypot(e.clientX - pointerStart.current.x, e.clientY - pointerStart.current.y) > 6) return;
      dismissActive();
    },
    [dismissActive]
  );

  const activeSection = SECTIONS.find((s) => s.id === activeSectionId);
  const activeBook = activeBookId ? bookById.get(activeBookId) ?? null : null;
  const hoveredBook = hoveredBookId ? bookById.get(hoveredBookId) ?? null : null;

  /* 开发期调试桥：把 3D/状态同步情况挂到 window，便于自动化断言（生产构建不注入） */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__RARE_BOOKS__ = {
      bookCount: BOOKS.length,
      placements: layout.placements.length,
      sections: SECTIONS.map((s) => s.id),
      activeBookId,
      activeSectionId,
      hoveredBookId,
      modalBookId,
      textureStats: () => textureManager.stats,
      cameraPos: () => {
        const c = controlsRef.current?.object;
        return c ? [+c.position.x.toFixed(2), +c.position.y.toFixed(2), +c.position.z.toFixed(2)] : null;
      },
      controlsTarget: () => {
        const t = controlsRef.current?.target;
        return t ? [+t.x.toFixed(2), +t.y.toFixed(2), +t.z.toFixed(2)] : null;
      },
    };
  }, [layout, activeBookId, activeSectionId, hoveredBookId, modalBookId, textureManager]);

  return (
    <div className="stage">
      <div
        className="stage__canvas"
        id="shelf-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeSectionId}`}
        tabIndex={0}
        aria-label="古籍书架 3D 视图：拖拽旋转，滚轮缩放，方向键切换书本"
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 42, position: [0, 1.15, 2.9], near: 0.1, far: 60 }}
          onPointerDown={(e) => {
            pointerStart.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMissed={handlePointerMissed}
        >
          <color attach="background" args={['#17110c']} />
          <fog attach="fog" args={['#1a120b', 7, 16]} />

          {/* 首帧按可视区域自动取景（之后完全交给用户） */}
          <CameraRig totalWidth={layout.totalWidth} totalHeight={layout.totalHeight} />

          {/* ── 黄金时刻光影：暖色环境 + 低角度暖金平行光 ── */}
          <ambientLight color="#ffdfb8" intensity={0.85} />
          <directionalLight
            color="#ffb45e"
            intensity={3.1}
            position={[-3.4, 2.0, 2.8]}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-left={-2.8}
            shadow-camera-right={2.8}
            shadow-camera-top={3}
            shadow-camera-bottom={-0.9}
            shadow-camera-near={0.5}
            shadow-camera-far={14}
          />
          {/* 右侧弱补光：提亮远处分区，避免一侧死黑 */}
          <directionalLight color="#ffd2a0" intensity={0.55} position={[3.6, 2.2, 2.4]} />
          <pointLight color="#ffc98d" intensity={0.45} distance={8} decay={2} position={[1.8, 1.6, 1.6]} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={2.6} color="#ffc98d" position={[-2.6, 1.1, 2.6]} scale={[5, 2.4, 1]} />
            <Lightformer form="rect" intensity={1.4} color="#ffe8c8" position={[3.2, 2.4, -1.4]} scale={[3.4, 2, 1]} />
            <Lightformer form="circle" intensity={0.9} color="#ffd9a0" position={[0, 3.2, 1]} scale={[2.4, 2.4, 1]} />
          </Environment>

          {/* ── 房间：地板 / 背景墙 / 书柜木框（点击任意背景即返回书架） ── */}
          <group onClick={handleBackgroundClick}>
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[26, 26]} />
              <meshStandardMaterial color="#2b2015" roughness={0.95} metalness={0} />
            </mesh>
            <mesh position={[0, 2.4, -0.8]} receiveShadow>
              <planeGeometry args={[16, 7]} />
              <meshStandardMaterial color="#241a12" roughness={1} metalness={0} />
            </mesh>
            {layout.bays.map((bay) => (
              <group key={bay.section}>
                {bay.boards.map((board, i) => (
                  <mesh key={i} position={board.position} castShadow receiveShadow>
                    <boxGeometry args={board.size} />
                    <meshStandardMaterial color="#5f4128" roughness={0.82} metalness={0.02} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>

          {/* ── 60 本书 ── */}
          <Bookshelf
            sections={SECTIONS}
            placements={layout.placements}
            activeBookId={activeBookId}
            hoveredBookId={hoveredBookId}
            activeSectionId={activeSectionId}
            reducedMotion={reducedMotion}
            textureManager={textureManager}
            onHoverChange={handleHoverChange}
            onRequestActivate={handleRequestActivate}
            onFocusReady={handleFocusReady}
            onFocusLeave={handleFocusLeave}
            onTextureStateChange={handleTextureState}
          />

          {/* ── 微尘 ── */}
          <DustMotes reducedMotion={reducedMotion} />

          <OrbitControls
            ref={controlsRef}
            target={SHELF_TARGET.toArray()}
            enableDamping
            dampingFactor={0.06}
            enablePan={false}
            minDistance={0.9}
            maxDistance={7}
            maxPolarAngle={1.62}
            makeDefault
          />
        </Canvas>
      </div>

      <div className="stage__overlay">
        <div className="stage__tabs">
          <SectionTabs sections={SECTIONS} activeId={activeSectionId} counts={counts} onChange={handleSectionChange} />
          <p className="stage__hint">{activeSection?.hint}</p>
        </div>
        <Hud
          activeBook={activeBook}
          hoveredBook={hoveredBook}
          loading={textureState?.state === 'loading' && textureState.id === activeBookId}
          stats={stats}
          total={BOOKS.length}
        />
      </div>

      {modalBook && (
        <BookModal
          book={modalBook}
          section={SECTIONS.find((s) => s.id === modalBook.section)}
          coverUrl={coverUrl}
          onDismiss={dismissActive}
          onPrev={() => stepModal(-1)}
          onNext={() => stepModal(1)}
        />
      )}

      {/* 读屏器播报 */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}

/** 首帧取景：按画布比例把整个书架纳入视野，之后不再干预用户操作 */
function CameraRig({ totalWidth, totalHeight }: { totalWidth: number; totalHeight: number }) {
  const { camera, size } = useThree();
  const didInit = useRef(false);

  useLayoutEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    const halfW = totalWidth / 2 + 0.2;
    const halfH = totalHeight / 2 + 0.28;
    const dist = Math.max(halfW / (Math.tan(fov / 2) * aspect), halfH / Math.tan(fov / 2), 2.1);
    const dir = new THREE.Vector3().subVectors(camera.position, SHELF_TARGET);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0.12, 1);
    dir.normalize();
    camera.position.copy(SHELF_TARGET).addScaledVector(dir, dist);
    camera.lookAt(SHELF_TARGET);
  }, [camera, size, totalWidth, totalHeight]);

  return null;
}
