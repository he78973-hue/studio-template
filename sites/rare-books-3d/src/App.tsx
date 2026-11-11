import { useLayoutEffect, useRef, useState } from 'react';
import { Scene } from './components/Scene';
import { Icon } from './lib/icons';
import { AstronomyBookProvider } from './astronomy/AstronomyBookContext';
import { AstronomyStage } from './astronomy/AstronomyStage';
import { BOOKS } from './data/books';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';

type View = 'shelf' | 'immersive';

export default function App() {
  const [view, setView] = useState<View>('shelf');
  const reducedMotion = usePrefersReducedMotion();
  /** 滑动药丸的几何：实测激活按钮，避免 padding/gap 造成的百分比误差 */
  const groupRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const active = group.querySelector<HTMLElement>('.app__view.is-active');
      if (!active) return;
      setPill({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(group);
    return () => ro.disconnect();
  }, [view]);

  return (
    <div className="app">
      <header className="app__head">
        <div className="app__brand">
          <span className="app__mark" aria-hidden="true">
            <Icon name="sparkles" size={18} />
          </span>
          <div>
            <h1 className="app__title">珍稀古籍 · 3D 虚拟书架</h1>
            <p className="app__subtitle">
              {view === 'shelf' ? 'Rare Books 3D Bookshelf — 天文学珍藏 · 60 册' : '沉浸星图 · 统一时间线动画编排'}
            </p>
          </div>
        </div>

        <div className="app__views" role="group" aria-label="视图切换">
          {/* 分组自适应包裹两个等宽按钮，药丸以它为基准（避免被 meta 文本撑宽） */}
          <div className="app__views-group" ref={groupRef}>
            <span
              className="app__views-pill"
              aria-hidden="true"
              style={{ ['--pill-x' as string]: `${pill.x}px`, ['--pill-w' as string]: `${pill.w}px` }}
            />
            <button
              type="button"
              className={`app__view${view === 'shelf' ? ' is-active' : ''}`}
              aria-pressed={view === 'shelf'}
              onClick={() => setView('shelf')}
            >
              <Icon name="library" size={15} />
              书架总览
            </button>
            <button
              type="button"
              className={`app__view${view === 'immersive' ? ' is-active' : ''}`}
              aria-pressed={view === 'immersive'}
              onClick={() => setView('immersive')}
            >
              <Icon name="telescope" size={15} />
              沉浸星图
            </button>
          </div>
          <p className="app__meta">React Three Fiber · InstancedMesh · GSAP Timeline · Texture Streaming</p>
        </div>
      </header>

      {view === 'shelf' ? (
        <Scene />
      ) : (
        <AstronomyBookProvider books={BOOKS} reducedMotion={reducedMotion} cacheBooks={1}>
          <AstronomyStage />
        </AstronomyBookProvider>
      )}

      <footer className="app__foot">
        {view === 'shelf' ? (
          <>
            <span>拖拽旋转 · 滚轮缩放 · 点击书脊抽出查看</span>
            <span className="app__keys">← → 切换书本 · ↑ ↓ 切换分区 · Enter 详情 · Esc 返回书架</span>
          </>
        ) : (
          <>
            <span>悬停书目预热资源 · 点击展开 · 拖拽旋转视角</span>
            <span className="app__keys">← → 上一本/下一本 · Esc 收起（退场即擦除显存）</span>
          </>
        )}
      </footer>
    </div>
  );
}
