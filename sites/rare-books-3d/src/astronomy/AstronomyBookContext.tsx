/**
 * AstronomyBookContext —— 用统一的 React Context 调度整套复杂动画与 GC
 * ─────────────────────────────────────────────────────────────
 * 为什么需要它：开书（Morph）、星轨喷涌、插画升起、视差、显存清理分属不同组件，
 * 若各自为政就会出现「动画割裂 + 切换掉帧 + 内存堆积」。这里把三件事收到一处：
 *
 *   1. 状态机（provider 持有）
 *        idle ──openBook──▶ opening ──onComplete──▶ open
 *         ▲                                          │
 *         └────reportClosed──── closing ◀──playClose──┘
 *      忙碌中再次 openBook → 先入队 pending，播退场，退场结束再换成下一本，
 *      于是「连续切换」永远不会出现两本书同时争夺同一组 ref 的情况。
 *   2. 句柄注册：Canvas 内的 manager 通过 registerManager 把
 *      { playClose, prefetch } 交回 provider（子 → 父通信的唯一通道）。
 *   3. 资源台账：BookResourceCache 由 provider 持有，manager 在退场结束时
 *      releaseAll() —— 上一本书的数千粒子、全息纹理、Morph 几何被彻底 dispose。
 *
 * 另提供 pointer / progressRef 两个 ref（不触发重渲染），
 * 供视差与 HUD 时间轴以 rAF 频率读取。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Book } from '../types';
import { BookResourceCache } from './resourceCache';

export type BookPhase = 'idle' | 'opening' | 'open' | 'closing';

export interface AstronomyManagerHandle {
  /** 播放退场（结束后回调 reportClosed） */
  playClose: () => void;
  /** 预热一本书的资源（悬停时调用，避免打开瞬间重建掉帧） */
  prefetch: (bookId: string) => void;
}

export interface AstronomyBookContextValue {
  books: Book[];
  activeBookId: string | null;
  phase: BookPhase;
  /** 归一化指针 [-1, 1]，y 向上为正 */
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  /** 当前时间线总进度 0..1（HUD 采样） */
  progressRef: React.MutableRefObject<number>;
  resources: BookResourceCache;
  reducedMotion: boolean;
  openBook: (bookId: string) => void;
  closeBook: () => void;
  step: (dir: 1 | -1) => void;
  prefetch: (bookId: string) => void;
  registerManager: (handle: AstronomyManagerHandle | null) => void;
  reportOpen: () => void;
  reportClosed: () => void;
}

const AstronomyBookContext = createContext<AstronomyBookContextValue | null>(null);

export interface AstronomyBookProviderProps {
  books: Book[];
  reducedMotion?: boolean;
  /** 最多缓存几本书的资源（默认 1：切换即彻底擦除上一本） */
  cacheBooks?: number;
  children: React.ReactNode;
}

export function AstronomyBookProvider({
  books,
  reducedMotion = false,
  cacheBooks = 1,
  children,
}: AstronomyBookProviderProps) {
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [phase, setPhase] = useState<BookPhase>('idle');

  const managerRef = useRef<AstronomyManagerHandle | null>(null);
  const pendingRef = useRef<string | null>(null);
  const phaseRef = useRef<BookPhase>('idle');
  phaseRef.current = phase;

  const resources = useMemo(() => new BookResourceCache(cacheBooks), [cacheBooks]);
  const pointer = useRef({ x: 0, y: 0 });
  const progressRef = useRef(0);

  /* 全局指针 → 归一化（视差用，passive 不阻塞滚动） */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointer.current.y = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  /* Provider 卸载 = 整个体验结束 → 显存全部擦除 */
  useEffect(() => () => resources.releaseAll(), [resources]);

  const openBook = useCallback(
    (bookId: string) => {
      if (phaseRef.current === 'idle') {
        progressRef.current = 0;
        setActiveBookId(bookId);
        setPhase('opening');
        return;
      }
      // 忙碌中：排队 + 退场；退场完成由 reportClosed 换成下一本
      pendingRef.current = bookId;
      setPhase('closing');
      managerRef.current?.playClose();
    },
    []
  );

  const closeBook = useCallback(() => {
    if (phaseRef.current === 'idle') return;
    pendingRef.current = null;
    setPhase('closing');
    managerRef.current?.playClose();
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (books.length === 0) return;
      const idx = activeBookId ? books.findIndex((b) => b.id === activeBookId) : -1;
      const next = books[(((idx + dir) % books.length) + books.length) % books.length];
      if (next) openBook(next.id);
    },
    [books, activeBookId, openBook]
  );

  const prefetch = useCallback((bookId: string) => {
    managerRef.current?.prefetch(bookId);
  }, []);

  const registerManager = useCallback((handle: AstronomyManagerHandle | null) => {
    managerRef.current = handle;
  }, []);

  const reportOpen = useCallback(() => setPhase('open'), []);

  const reportClosed = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    progressRef.current = 0;
    if (pending) {
      setActiveBookId(pending);
      setPhase('opening');
    } else {
      setActiveBookId(null);
      setPhase('idle');
    }
  }, []);

  const value = useMemo<AstronomyBookContextValue>(
    () => ({
      books,
      activeBookId,
      phase,
      pointer,
      progressRef,
      resources,
      reducedMotion,
      openBook,
      closeBook,
      step,
      prefetch,
      registerManager,
      reportOpen,
      reportClosed,
    }),
    [books, activeBookId, phase, resources, reducedMotion, openBook, closeBook, step, prefetch, registerManager, reportOpen, reportClosed]
  );

  return <AstronomyBookContext.Provider value={value}>{children}</AstronomyBookContext.Provider>;
}

export function useAstronomyBook(): AstronomyBookContextValue {
  const ctx = useContext(AstronomyBookContext);
  if (!ctx) throw new Error('useAstronomyBook 必须在 <AstronomyBookProvider> 内使用');
  return ctx;
}
