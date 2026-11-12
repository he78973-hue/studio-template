/**
 * 图集（Atlas）材质：让 InstancedMesh 的每个实例显示图集中属于自己的那一格。
 *
 * 背景：InstancedMesh 全局只有一份 geometry + material，默认所有实例共用同一张
 * 贴图和同一套 UV——60 本书会长得一模一样。做法是给每本书配一个 instanced
 * attribute `aAtlasCell`（它在图集中的格子坐标），并用 onBeforeCompile 往
 * MeshStandardMaterial 的着色器里注入一小段 UV 重映射：
 *
 *   vMapUv = (vMapUv + mix(pagesCell, aAtlasCell, isSpineFace)) / grid;
 *
 * - 书脊面（局部法线 |z| ≈ 1）→ 该书在低分辨率图集中的格子；
 * - 其余面（封面/书口/书顶）→ 统一的「纸边」格子。
 * 这样 60 本书共用 1 个 draw call + 每分区 1 张贴图，却有各自的颜色、书名与年份。
 */
import * as THREE from 'three';

export interface AtlasGrid {
  cols: number;
  rows: number;
}

/** 4×4 = 16 格：15 本书 + 1 格「纸边」 */
export const SPINE_ATLAS_GRID: AtlasGrid = { cols: 4, rows: 4 };
/** 「纸边 / 书口」占用的格子（第 16 格，15 本书用不到） */
export const SPINE_ATLAS_PAGES_CELL: Cell = [3, 3];

export type Cell = [number, number];

/** 第 index 本书落在图集中的哪一格（与 textures.buildAtlas 的绘制顺序保持一致） */
export function atlasCellFor(index: number, grid: AtlasGrid): Cell {
  return [index % grid.cols, Math.floor(index / grid.cols)];
}

export interface SpineAtlasMaterialOptions {
  grid: AtlasGrid;
  /** 「书口/纸边」占用的格子 */
  pagesCell: Cell;
}

/**
 * 创建带图集 UV 重映射的标准材质。
 * @param atlasTexture 低分辨率图集纹理（CanvasTexture）
 */
export function createSpineAtlasMaterial(
  atlasTexture: THREE.Texture,
  { grid, pagesCell }: SpineAtlasMaterialOptions
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    map: atlasTexture,
    roughness: 0.62,
    metalness: 0.06,
    color: 0xffffff,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAtlasGrid = { value: new THREE.Vector2(grid.cols, grid.rows) };
    shader.uniforms.uPagesCell = { value: new THREE.Vector2(pagesCell[0], pagesCell[1]) };

    // 重映射必须写在【顶点阶段】：vMapUv 在顶点着色器里是「可写 varying」，
    // 到了片元着色器就是只读输入（GLSL ES 1.00 不允许赋值）。
    // 判面用 object-space 法线（书脊面局部法线 = ±Z），不受实例旋转影响。
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec2 aAtlasCell;\nuniform vec2 uAtlasGrid;\nuniform vec2 uPagesCell;'
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        #ifdef USE_MAP
          float spineFace = step(0.5, abs(normal.z));
          vMapUv = (vMapUv + mix(uPagesCell, aAtlasCell, spineFace)) / uAtlasGrid;
        #endif`
      );
  };

  // 4 个分区的材质源码完全一致 → 共享同一个 program，只各自持有 uniform
  material.customProgramCacheKey = () => `spine-atlas-${grid.cols}x${grid.rows}`;
  return material;
}

/** 给 InstancedMesh 的 geometry 附加每实例的图集格子属性 */
export function attachAtlasCells(geometry: THREE.BufferGeometry, count: number, grid: AtlasGrid): void {
  const cells = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const [cx, cy] = atlasCellFor(i, grid);
    cells[i * 2] = cx;
    cells[i * 2 + 1] = cy;
  }
  geometry.setAttribute('aAtlasCell', new THREE.InstancedBufferAttribute(cells, 2));
}
