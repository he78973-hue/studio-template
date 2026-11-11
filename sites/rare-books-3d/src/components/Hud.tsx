/** Hud —— 3D 场景状态浮层：当前书目、纹理流式加载状态、LRU 缓存占用、操作提示。 */
import type { Book } from '../types';
import type { SpineTextureStats } from '../lib/textures';

export interface HudProps {
  activeBook: Book | null;
  hoveredBook: Book | null;
  loading: boolean;
  stats: SpineTextureStats;
  total: number;
}

export function Hud({ activeBook, hoveredBook, loading, stats, total }: HudProps) {
  const shown = activeBook ?? hoveredBook;
  return (
    <div className="hud">
      <div className="hud__readout">
        {shown ? (
          <>
            <span className="hud__label">{activeBook ? '正在查看' : '悬停'}</span>
            <strong className="hud__title">《{shown.title}》</strong>
            <span className="hud__meta">
              {shown.author} · {shown.year} · {shown.titleEn}
            </span>
          </>
        ) : (
          <>
            <span className="hud__label">馆藏</span>
            <strong className="hud__title">天文学珍藏 · {total} 册</strong>
            <span className="hud__meta">点击书脊抽出查看 · 方向键 ← → 切换 · ↑ ↓ 切换分区</span>
          </>
        )}
      </div>

      <div className="hud__status">
        {loading && (
          <span className="hud__loading">
            <i className="hud__spinner" aria-hidden="true" />
            高清纹理加载中…
          </span>
        )}
        <span className="hud__stats" title="高分辨率纹理 LRU 缓存占用（预算上限防止移动端 OOM）">
          纹理缓存 {stats.entries} 条 · {(stats.bytes / 1048576).toFixed(1)} / {(stats.budget / 1048576).toFixed(0)} MB
        </span>
      </div>
    </div>
  );
}
