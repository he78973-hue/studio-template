/**
 * Bookshelf —— 项目核心：60 本书的 InstancedMesh 渲染、矩阵管理、
 * 射线检测绑定与 GSAP 纯动画交互。
 *
 * 架构一览
 * ─────────────────────────────────────────────────────────────
 *  60 本书 → 4 个分区 → 4 个 InstancedMesh（每区 1 个 draw call）
 *      │
 *      ├─ 几何：共用 BoxGeometry(1,1,1)，按 dimensions 缩放
 *      ├─ 贴图：每区 1 张「低分辨率书脊柱图集」，用 instanced attribute
 *      │        aAtlasCell + onBeforeCompile 把每个实例的 UV 映射到自己的格子
 *      ├─ 变换：布局算法给出静止位姿；悬停/抽出时只改「当前位姿」，
 *      │        由脏标记驱动批量 setMatrixAt（见 writeMatrices）
 *      └─ 交互：R3F 射线检测拿到 instanceId → 反查书目 →
 *               GSAP 补间悬停偏移 / 抽出进度（位姿每帧插值）
 *
 * 状态流：React state（activeBookId / hoveredBookId / activeSectionId）
 *        自上而下驱动 3D；3D 动画的关键节点（onFocusReady / onFocusLeave）
 *        再回调给 React 打开模态框——3D 与 React 状态完全同步。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import type { Book, BookPlacement, Section, SectionId } from '../types';
import {
  SPINE_ATLAS_GRID,
  SPINE_ATLAS_PAGES_CELL,
  attachAtlasCells,
  atlasCellFor,
  createSpineAtlasMaterial,
} from '../lib/atlasMaterial';
import type { SpineTextureManager } from '../lib/textures';
import { FocusBook } from './FocusBook';

/** 悬停外移距离：2cm */
const HOVER_OUT = 0.02;
/** 悬停时的微弱 Z 轴旋转偏移（弧度） */
const HOVER_ROT = 0.04;
/** 未激活分区实例的明暗系数 */
const DIM_FACTOR = 0.42;

export interface BookshelfProps {
  sections: Section[];
  placements: BookPlacement[];
  activeBookId: string | null;
  hoveredBookId: string | null;
  activeSectionId: SectionId;
  reducedMotion: boolean;
  textureManager: SpineTextureManager;
  onHoverChange: (id: string | null) => void;
  /** 点击某本书（Scene 负责决定：选中 / 切换 / 取消） */
  onRequestActivate: (id: string) => void;
  /** 抽出动画完全就位 */
  onFocusReady: (id: string) => void;
  /** 返回动画结束 */
  onFocusLeave: (id: string) => void;
  onTextureStateChange: (id: string, state: 'loading' | 'ready' | 'released') => void;
}

/** 一本书的运行时记录：静止位姿 + GSAP 驱动的当前位姿 */
interface RuntimeBook {
  book: Book;
  placement: BookPlacement;
  sectionIndex: number;
  /** 当前位姿（GSAP 补间的宿主） */
  position: THREE.Vector3;
  euler: THREE.Euler;
  quaternion: THREE.Quaternion;
  /** 静止位姿 */
  basePosition: THREE.Vector3;
  baseEuler: THREE.Euler;
  /** 悬停偏移量（GSAP 补间的宿主） */
  hoverProxy: { z: number; rot: number };
  hoverTween: gsap.core.Tween | null;
  /** true = 已被焦点网格接管，实例缩放归零 */
  hidden: boolean;
}

interface PresentingBook {
  id: string;
  phase: 'enter' | 'exit';
}

export function Bookshelf(props: BookshelfProps) {
  const {
    sections,
    placements,
    activeBookId,
    hoveredBookId,
    activeSectionId,
    reducedMotion,
    textureManager,
    onHoverChange,
    onRequestActivate,
    onFocusReady,
    onFocusLeave,
    onTextureStateChange,
  } = props;

  /* ── 运行时记录 ─────────────────────────────────────────────── */
  const runtime = useMemo<RuntimeBook[]>(
    () =>
      placements.map((p) => {
        const basePosition = new THREE.Vector3(...p.position);
        const baseEuler = new THREE.Euler(...p.rotation);
        return {
          book: p.book,
          placement: p,
          sectionIndex: p.sectionIndex,
          position: basePosition.clone(),
          euler: baseEuler.clone(),
          quaternion: new THREE.Quaternion().setFromEuler(baseEuler),
          basePosition,
          baseEuler,
          hoverProxy: { z: 0, rot: 0 },
          hoverTween: null,
          hidden: false,
        };
      }),
    [placements]
  );
  const byId = useMemo(() => new Map(runtime.map((r) => [r.book.id, r])), [runtime]);

  /** 分区 → 该区书目（按 sectionIndex 排序，即书架顺序） */
  const sectionBooks = useMemo(() => {
    const map = new Map<SectionId, Book[]>();
    for (const sec of sections) {
      map.set(
        sec.id,
        placements
          .filter((p) => p.section === sec.id)
          .sort((a, b) => a.sectionIndex - b.sectionIndex)
          .map((p) => p.book)
      );
    }
    return map;
  }, [placements, sections]);

  /** 每分区一张低分辨率图集（4 张贴图承载 60 个书脊） */
  const atlases = useMemo(() => {
    const map = new Map<SectionId, THREE.Texture>();
    for (const sec of sections) {
      const books = sectionBooks.get(sec.id) ?? [];
      map.set(
        sec.id,
        textureManager.buildAtlas(
          books,
          SPINE_ATLAS_GRID,
          (_, i) => atlasCellFor(i, SPINE_ATLAS_GRID),
          SPINE_ATLAS_PAGES_CELL,
          sec.id
        )
      );
    }
    return map;
  }, [sections, sectionBooks, textureManager]);

  /* ── 实例网格登记 ───────────────────────────────────────────── */
  const meshes = useRef(new Map<SectionId, THREE.InstancedMesh>());
  const dirty = useRef(true);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const registerMesh = useCallback((section: SectionId, mesh: THREE.InstancedMesh | null) => {
    if (mesh) meshes.current.set(section, mesh);
    else meshes.current.delete(section);
  }, []);

  /**
   * 矩阵批量更新：只在「脏」时执行（悬停 / 抽出 / 分区明暗 / 首次挂载）。
   * 60 个 setMatrixAt + 4 次 needsUpdate，空闲帧零成本。
   */
  const writeMatrices = useCallback(() => {
    for (const rt of runtime) {
      dummy.position.copy(rt.position);
      dummy.quaternion.copy(rt.quaternion);
      if (rt.hidden) {
        dummy.scale.setScalar(1e-4); // 让位给焦点网格（退化为不可见）
      } else {
        dummy.scale.set(rt.book.dimensions.width, rt.book.dimensions.height, rt.book.dimensions.depth);
      }
      dummy.updateMatrix();
      const mesh = meshes.current.get(rt.book.section);
      if (mesh) mesh.setMatrixAt(rt.sectionIndex, dummy.matrix);
    }
    for (const mesh of meshes.current.values()) mesh.instanceMatrix.needsUpdate = true;
  }, [runtime, dummy]);

  useFrame(() => {
    if (dirty.current) {
      writeMatrices();
      dirty.current = false;
    }
  });

  /* ── 悬停：向 Z 轴外移 2cm + 微弱旋转 ──────────────────────── */
  const hoveredRtRef = useRef<RuntimeBook | null>(null);

  const applyHover = useCallback((rt: RuntimeBook) => {
    rt.position.set(rt.basePosition.x, rt.basePosition.y, rt.basePosition.z + rt.hoverProxy.z);
    rt.euler.set(rt.baseEuler.x, rt.baseEuler.y, rt.baseEuler.z + rt.hoverProxy.rot);
    rt.quaternion.setFromEuler(rt.euler);
    dirty.current = true;
  }, []);

  const animateHover = useCallback(
    (rt: RuntimeBook, target: 0 | 1) => {
      rt.hoverTween?.kill();
      rt.hoverTween = gsap.to(rt.hoverProxy, {
        z: target * HOVER_OUT,
        rot: target * HOVER_ROT,
        duration: reducedMotion ? 0.001 : 0.42,
        ease: 'power3.out',
        onUpdate: () => applyHover(rt),
      });
    },
    [applyHover, reducedMotion]
  );

  useEffect(() => {
    const prev = hoveredRtRef.current;
    // 抽出状态下禁用悬停
    const next = hoveredBookId && !activeBookId ? byId.get(hoveredBookId) ?? null : null;
    hoveredRtRef.current = next;
    if (prev && prev !== next) animateHover(prev, 0);
    if (next && !next.hidden) animateHover(next, 1);
  }, [hoveredBookId, activeBookId, byId, animateHover]);

  /* ── 激活：抽出查看 / 返回书架 ──────────────────────────────── */
  const activeRtRef = useRef<RuntimeBook | null>(null);
  const [presenting, setPresenting] = useState<PresentingBook[]>([]);

  const handleReady = useCallback((id: string) => onFocusReady(id), [onFocusReady]);
  const handleDone = useCallback(
    (id: string) => {
      setPresenting((prev) => prev.filter((p) => p.id !== id));
      onFocusLeave(id);
    },
    [onFocusLeave]
  );
  const handleInstanceHidden = useCallback(
    (id: string, hidden: boolean) => {
      const rt = byId.get(id);
      if (rt) {
        rt.hidden = hidden;
        dirty.current = true;
      }
    },
    [byId]
  );
  const handleTextureState = useCallback(
    (id: string, state: 'loading' | 'ready' | 'released') => onTextureStateChange(id, state),
    [onTextureStateChange]
  );
  const handleRequestClose = useCallback((id: string) => onRequestActivate(id), [onRequestActivate]);

  useEffect(() => {
    activeRtRef.current = activeBookId ? byId.get(activeBookId) ?? null : null;
    setPresenting((cur) => {
      const existing = cur.find((p) => p.id === activeBookId);
      // 同一本书已处于 enter：不重启动画
      if (existing && existing.phase === 'enter') return cur;
      const exiting = cur.filter((p) => p.id !== activeBookId).map((p) => ({ ...p, phase: 'exit' as const }));
      const entering = activeBookId ? [{ id: activeBookId, phase: 'enter' as const }] : [];
      const next = [...exiting, ...entering];
      const same =
        next.length === cur.length &&
        next.every((n, i) => cur[i].id === n.id && cur[i].phase === n.phase);
      return same ? cur : next;
    });
  }, [activeBookId, byId]);

  /* ── 分区聚焦：非当前分区实例压暗，突出当前分区 ──────────────── */
  useEffect(() => {
    const proxy = { k: 0 };
    const from = new Map<SectionId, number>();
    const to = new Map<SectionId, number>();
    for (const sec of sections) {
      const mesh = meshes.current.get(sec.id);
      if (!mesh?.instanceColor) continue;
      mesh.getColorAt(0, tmpColor);
      from.set(sec.id, tmpColor.r);
      to.set(sec.id, sec.id === activeSectionId ? 1 : DIM_FACTOR);
    }
    const tween = gsap.to(proxy, {
      k: 1,
      duration: reducedMotion ? 0.001 : 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        for (const sec of sections) {
          const mesh = meshes.current.get(sec.id);
          if (!mesh?.instanceColor) continue;
          const v = THREE.MathUtils.lerp(from.get(sec.id) ?? 1, to.get(sec.id) ?? 1, proxy.k);
          tmpColor.setScalar(v);
          for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, tmpColor);
          mesh.instanceColor.needsUpdate = true;
        }
      },
    });
    return () => {
      tween.kill();
    };
  }, [activeSectionId, sections, reducedMotion, tmpColor]);

  /* ── 射线检测 → 书目 ────────────────────────────────────────── */
  const handleBookEvent = useCallback(
    (type: 'over' | 'out' | 'click', book: Book | null) => {
      if (activeRtRef.current) {
        // 抽出状态：不再高亮，但点击仍可切换书本
        if (type === 'click' && book) onRequestActivate(book.id);
        return;
      }
      if (type === 'over') {
        onHoverChange(book?.id ?? null);
        document.body.style.cursor = 'pointer';
      } else if (type === 'out') {
        onHoverChange(null);
        document.body.style.cursor = 'default';
      } else if (type === 'click' && book) {
        onRequestActivate(book.id);
      }
    },
    [onHoverChange, onRequestActivate]
  );

  useEffect(() => () => { document.body.style.cursor = 'default'; }, []);

  return (
    <group>
      {/* 4 个分区 = 4 个 InstancedMesh */}
      {sections.map((sec) => (
        <SectionInstances
          key={sec.id}
          section={sec}
          books={sectionBooks.get(sec.id) ?? []}
          atlas={atlases.get(sec.id)}
          registerMesh={registerMesh}
          onBookEvent={handleBookEvent}
        />
      ))}

      {/* 抽出查看的焦点网格：进入中 / 返回中的书各持一份，动画互不干扰 */}
      {presenting.map((p) => {
        const rt = byId.get(p.id);
        if (!rt) return null;
        return (
          <FocusBook
            key={p.id}
            book={rt.book}
            basePosition={rt.placement.position}
            baseEuler={rt.placement.rotation}
            phase={p.phase}
            reducedMotion={reducedMotion}
            textureManager={textureManager}
            onReady={handleReady}
            onDone={handleDone}
            onTextureState={handleTextureState}
            onRequestClose={handleRequestClose}
            onInstanceHidden={handleInstanceHidden}
          />
        );
      })}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────── */

interface SectionInstancesProps {
  section: Section;
  books: Book[];
  atlas: THREE.Texture | undefined;
  registerMesh: (section: SectionId, mesh: THREE.InstancedMesh | null) => void;
  onBookEvent: (type: 'over' | 'out' | 'click', book: Book | null) => void;
}

/** 一个分区的 InstancedMesh：共享 BoxGeometry + 图集材质 + 每实例 UV 偏移 */
function SectionInstances({ section, books, atlas, registerMesh, onBookEvent }: SectionInstancesProps) {
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    attachAtlasCells(g, books.length, SPINE_ATLAS_GRID);
    return g;
  }, [books.length]);

  const material = useMemo(
    () =>
      atlas
        ? createSpineAtlasMaterial(atlas, { grid: SPINE_ATLAS_GRID, pagesCell: SPINE_ATLAS_PAGES_CELL })
        : null,
    [atlas]
  );

  useEffect(() => () => {
    geometry.dispose();
    material?.dispose();
  }, [geometry, material]);

  const handleRef = useCallback(
    (mesh: THREE.InstancedMesh | null) => {
      registerMesh(section.id, mesh);
      if (!mesh) return;
      // 实例矩阵每帧都在变（悬停/抽出）→ 声明为动态缓冲
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // 初始化实例颜色为白色，供分区明暗调制（setColorAt）使用
      const white = new THREE.Color(1, 1, 1);
      for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, white);
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    [registerMesh, section.id]
  );

  if (!material) return null;

  return (
    <instancedMesh
      ref={handleRef}
      args={[geometry, material, books.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onPointerOver={(e) => {
        e.stopPropagation();
        const book = books[e.instanceId ?? -1] ?? null;
        onBookEvent('over', book);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        const book = books[e.instanceId ?? -1] ?? null;
        onBookEvent('out', book);
      }}
      onClick={(e) => {
        e.stopPropagation();
        const book = books[e.instanceId ?? -1] ?? null;
        onBookEvent('click', book);
      }}
    />
  );
}
