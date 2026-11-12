/**
 * PageHtmlOverlay —— 用 Drei <Html> 把 2D 文本精准锚定到 3D 书页表面
 * ─────────────────────────────────────────────────────────────
 * 局部坐标公式（书本局部坐标系：书页平铺 XY 平面、书脊沿 Y 轴位于 x = 0）：
 *
 *   pageSurfaceZ = thickness / 2                    // 纸块前表面
 *   textZ        = pageSurfaceZ + 0.118             // 抬到浮雕层之上，避免被遮
 *   右页中心     = ( +pageW / 2, 0, textZ )
 *   左页中心     = ( −pageW / 2, 0, textZ )
 *
 * ⚠️ 为什么这里「不用」transform 模式（重要）：
 *   drei 的 <Html transform> 把物体世界矩阵直接搬进 CSS 3D 空间，
 *   即「1 个世界单位 = 1 个 CSS 像素」，而透视距离
 *       fov = projectionMatrix.elements[5] × canvasHeight/2 ≈ 662
 *   意味着只有「离相机约 662 个单位」的物体才能 1:1 呈现。
 *   本项目是米制场景（书本距相机仅 ~0.63 单位），transform 模式会把
 *   文本放大近千倍并甩到屏幕外（实测 rect 3093px / x=-2542）。
 *   因此改用默认的「投影锚定」：每帧把上面的局部坐标经 matrixWorld
 *   投影到屏幕，文字恒为可读大小、位置与左右页严格一一对应；
 *   代价是文字不随纸面倾斜（书页正面朝向读者时无感）。
 *   若把场景整体放大到千单位级（如 1 单位 = 1mm），加回 transform
 *   并设 distanceFactor ≈ 400 即可获得真正的 3D 倾斜文本。
 *
 * - occlude=[pageMesh]：书本转到侧面时自动隐藏，避免文字漂浮在空中；
 * - mix-blend-mode: multiply：文字与下方羊皮纸/墨线相乘融合
 *   （Canvas 是独立合成层，混合发生在文字与 3D 画面之间）。
 */
import { Html } from '@react-three/drei';
import type { RefObject } from 'react';
import type * as THREE from 'three';
import type { Book } from '../types';

export interface PageHtmlOverlayProps {
  book: Book;
  side: 'left' | 'right';
  pageW: number;
  thickness: number;
  /** 书页网格（用于遮挡判断） */
  pageMeshRef: RefObject<THREE.Mesh>;
  /** 文本相对纸面的抬升（米） */
  lift?: number;
}

export function PageHtmlOverlay({ book, side, pageW, thickness, pageMeshRef, lift = 0.075 }: PageHtmlOverlayProps) {
  // ── 精准局部坐标 ──
  const x = side === 'right' ? pageW / 2 : -pageW / 2;
  const z = thickness / 2 + lift;

  return (
    <Html
      position={[x, 0, z]}
      occlude={[pageMeshRef]}
      center
      style={{ pointerEvents: 'none' }}
      wrapperClass="astro-html"
    >
      <div className={`astro-label astro-label--${side}`} style={{ mixBlendMode: 'multiply' }}>
        {side === 'left' ? (
          <>
            <span className="astro-label__kicker">{book.year}</span>
            <span className="astro-label__title">{book.title}</span>
            <span className="astro-label__rule" aria-hidden="true" />
            <span className="astro-label__en">{book.titleEn}</span>
          </>
        ) : (
          <>
            <span className="astro-label__kicker">{book.author}</span>
            <span className="astro-label__title">星历 · EPHEMERIS</span>
            <span className="astro-label__rule" aria-hidden="true" />
            <span className="astro-label__en">{book.id.toUpperCase()}</span>
          </>
        )}
      </div>
    </Html>
  );
}
