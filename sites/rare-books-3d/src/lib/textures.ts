/**
 * 纹理流式管理（Texture Streaming）
 * ─────────────────────────────────────────────────────────────
 * 对应参考架构图中的 「LOW-RES SPINE ATLAS (BASE) → HIGH-RES RESCAN (ON SELECT)」：
 *
 *   1. 书架常驻：每个分区一张「低分辨率书脊柱图集」（默认 4×4 格 / 128×512px/格），
 *      60 本书共用 4 张贴图、4 个 draw call；每格内含该书专属的皮革色、烫金棱线、
 *      竖排书名与年份——低分辨率、高压缩，常驻显存也不会 OOM。
 *   2. 点击激活：只给这一本异步加载「高分辨率」纹理（512×1024，或真实 URL），
 *      加载完成后交叉淡入替换（见 components/FocusBook.tsx）。
 *   3. 返回书架：立即从 LRU 释放该书的 mid/high 纹理（dispose），
 *      高分辨率缓存有字节预算（默认 24MB），超预算自动淘汰最久未用的一本，
 *      移动端反复抽取多本书也不会累积显存。
 *
 * 所有纹理都可以用程序化 Canvas 绘制（零外部资源、离线可跑），
 * 也可以在 Book 数据里提供真实 URL，逻辑自动切换。
 */
import * as THREE from 'three';
import type { Book } from '../types';
import type { AtlasGrid, Cell } from './atlasMaterial';
import { hashString, mulberry32 } from './prng';

const SERIF = `Georgia, "Times New Roman", "Songti SC", "SimSun", "Noto Serif CJK SC", serif`;

/** 图集单元格尺寸（低分辨率） */
export const ATLAS_CELL = { w: 128, h: 512 };
/** 抽出瞬间的「中分辨率」重扫描尺寸（与图集同源，保证无跳变） */
export const MID_SIZE = { w: 256, h: 1024 };
/** 高分辨率重扫描尺寸 */
export const HIGH_SIZE = { w: 512, h: 1024 };

export type SpineDetail = 'low' | 'mid' | 'high';

interface CacheEntry {
  texture: THREE.Texture;
  bytes: number;
}

function estimateBytes(w: number, h: number): number {
  return w * h * 4 * 1.33; // RGBA + mipmap 链约 +33%
}

/** hex 颜色提亮（amount>0）或压暗（amount<0） */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  if (amount >= 0) {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else {
    const k = 1 + amount;
    r = Math.round(r * k);
    g = Math.round(g * k);
    b = Math.round(b * k);
  }
  return `rgb(${r},${g},${b})`;
}

/** 竖排文字按可用高度自动缩号，避免长标题溢出书脊 */
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize = 8): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${size}px ${SERIF}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  ctx.font = `${size}px ${SERIF}`;
  return size;
}

/** 绘制「纸边 / 书口」格：图集中非书脊面共用 */
function drawPages(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#e6d9bb';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(122, 100, 66, 0.22)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.fillStyle = 'rgba(90, 72, 46, 0.35)';
  for (let x = 0; x < w; x += 14) ctx.fillRect(x, 0, 1, h);
  const edge = ctx.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, 'rgba(60,44,24,0.45)');
  edge.addColorStop(0.12, 'rgba(60,44,24,0)');
  edge.addColorStop(0.88, 'rgba(60,44,24,0)');
  edge.addColorStop(1, 'rgba(60,44,24,0.45)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
}

/**
 * 程序化绘制一书脊：皮革底色 + 颗粒 + 烫金双线框 + 凸起棱线 + 菱形纹饰 + 竖排烫金文字。
 * detail 决定颗粒密度与是否绘制原文标题——这就是「低/高分辨率」的视觉差异。
 */
function drawSpine(ctx: CanvasRenderingContext2D, w: number, h: number, book: Book, detail: SpineDetail): void {
  const rng = mulberry32(hashString(book.id) + (detail === 'high' ? 977 : detail === 'mid' ? 131 : 7));
  const cx = w / 2;

  // 1) 皮革底色：横向渐变模拟书脊的圆柱受光
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, shade(book.spineColor, -0.42));
  grad.addColorStop(0.18, shade(book.spineColor, 0.06));
  grad.addColorStop(0.42, shade(book.spineColor, 0.14));
  grad.addColorStop(0.62, shade(book.spineColor, 0.04));
  grad.addColorStop(1, shade(book.spineColor, -0.45));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2) 上下封口压深（装订挤压的暗部）
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, w, h * 0.035);
  ctx.fillRect(0, h * 0.965, w, h * 0.035);

  // 3) 皮革颗粒（细节级别越高越细）
  const grains = detail === 'high' ? 3400 : detail === 'mid' ? 1100 : 300;
  ctx.globalAlpha = 0.055;
  for (let i = 0; i < grains; i++) {
    ctx.fillStyle = rng() > 0.5 ? '#000000' : '#ffffff';
    ctx.fillRect(rng() * w, rng() * h, 1, 1);
  }
  ctx.globalAlpha = 1;

  // 4) 烫金双线边框
  const inset = Math.max(3, w * 0.07);
  ctx.strokeStyle = book.giltColor;
  ctx.lineWidth = Math.max(1, w * 0.014);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.strokeRect(inset * 1.7, inset * 1.7, w - inset * 3.4, h - inset * 3.4);

  // 5) 凸起棱线（raised bands）：暗-金-亮-暗 四条线一组，跨过整条书脊
  const bands = detail === 'high' ? 6 : 5;
  const bandH = Math.max(1.5, h * 0.0035);
  for (let i = 1; i <= bands; i++) {
    const y = (h * i) / (bands + 1);
    const x0 = inset * 1.7;
    const bw = w - inset * 3.4;
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(x0, y - 1, bw, 1);
    ctx.fillStyle = book.giltColor;
    ctx.fillRect(x0, y, bw, bandH);
    ctx.fillStyle = 'rgba(255,240,205,0.55)';
    ctx.fillRect(x0, y + bandH, bw, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(x0, y + bandH + 1, bw, 1);
  }

  // 6) 顶部菱形烫金纹饰
  const dy = h * 0.86;
  const r = Math.max(2.5, w * 0.05);
  ctx.save();
  ctx.translate(cx, dy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = book.giltColor;
  ctx.fillRect(-r / 2, -r / 2, r, r);
  ctx.restore();

  // 7) 竖排烫金文字：自下而上阅读（ctx.rotate(+90°) 使文字沿书脊向上）
  ctx.save();
  ctx.translate(cx, 0);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = Math.max(1, w * 0.02);
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = book.giltColor;

  const line = (text: string, fracFromBottom: number, sizeFrac: number, alpha = 1) => {
    ctx.globalAlpha = alpha;
    fitFont(ctx, text, h * 0.62, h * sizeFrac);
    ctx.fillText(text, -(fracFromBottom - 0.5) * h, 0);
    ctx.globalAlpha = 1;
  };

  line(book.title, 0.62, 0.056);
  line(book.author, 0.31, 0.028);
  line(book.year, 0.18, 0.024, 0.92);
  if (detail === 'high') line(book.titleEn.toUpperCase(), 0.07, 0.019, 0.85);
  ctx.restore();
}

export interface SpineTextureStats {
  /** 当前缓存的纹理条数 */
  entries: number;
  /** 已占用字节 */
  bytes: number;
  /** 高分辨率缓存预算（字节） */
  budget: number;
}

export class SpineTextureManager {
  /** 低/中/高分辨率纹理缓存：key = `${bookId}@${detail}`，带 LRU */
  private cache = new Map<string, CacheEntry>();
  private lru: string[] = [];
  private inflight = new Map<string, Promise<THREE.Texture>>();
  private canvases = new Map<string, HTMLCanvasElement>();
  /** 常驻图集（每分区一张，不参与 LRU） */
  private atlases = new Map<string, THREE.Texture>();
  private budgetBytes: number;
  private usedBytes = 0;
  /** 模拟真实网络延迟，让「按需流式加载」可感知；生产环境传 0 */
  readonly simulateLatencyMs: number;

  constructor(options: { budgetBytes?: number; simulateLatencyMs?: number } = {}) {
    this.budgetBytes = options.budgetBytes ?? 24 * 1024 * 1024;
    this.simulateLatencyMs = options.simulateLatencyMs ?? 200;
  }

  get stats(): SpineTextureStats {
    let bytes = 0;
    for (const entry of this.cache.values()) bytes += entry.bytes;
    return { entries: this.cache.size, bytes, budget: this.budgetBytes };
  }

  /* ── 低分辨率图集（书架常驻） ───────────────────────────────── */

  /**
   * 把一个分区的书绘制进一张图集。
   * @param cellOf   第 i 本书的格子坐标（与 atlasMaterial.atlasCellFor 一致）
   * @param atlasKey 登记键（一般传分区 id），供 dispose() 统一释放
   */
  buildAtlas(
    books: Book[],
    grid: AtlasGrid,
    cellOf: (book: Book, i: number) => Cell,
    pagesCell: Cell,
    atlasKey?: string
  ): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = grid.cols * ATLAS_CELL.w;
    canvas.height = grid.rows * ATLAS_CELL.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');

    books.forEach((book, i) => {
      const [col, row] = cellOf(book, i);
      const x = col * ATLAS_CELL.w;
      const y = row * ATLAS_CELL.h;
      ctx.fillStyle = book.spineColor;
      ctx.fillRect(x, y, ATLAS_CELL.w, ATLAS_CELL.h);
      // 2px 内缩：避免 mipmap 采样时相邻格子互相渗色
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 2, y + 2, ATLAS_CELL.w - 4, ATLAS_CELL.h - 4);
      ctx.clip();
      ctx.translate(x + 2, y + 2);
      drawSpine(ctx, ATLAS_CELL.w - 4, ATLAS_CELL.h - 4, book, 'low');
      ctx.restore();
    });

    // 最后一格画「纸边」，供非书脊面采样
    ctx.save();
    ctx.beginPath();
    const px = pagesCell[0] * ATLAS_CELL.w + 2;
    const py = pagesCell[1] * ATLAS_CELL.h + 2;
    ctx.rect(px, py, ATLAS_CELL.w - 4, ATLAS_CELL.h - 4);
    ctx.clip();
    ctx.translate(px, py);
    drawPages(ctx, ATLAS_CELL.w - 4, ATLAS_CELL.h - 4);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    if (atlasKey) this.atlases.set(atlasKey, texture);
    return texture;
  }

  /* ── 单本书脊纹理 ───────────────────────────────────────────── */

  /** 同步获取（或绘制）一本书的独立书脊画布 */
  private canvasFor(book: Book, detail: SpineDetail): HTMLCanvasElement {
    const key = `${book.id}@${detail}-canvas`;
    const cached = this.canvases.get(key);
    if (cached) return cached;
    const size = detail === 'high' ? HIGH_SIZE : detail === 'mid' ? MID_SIZE : ATLAS_CELL;
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext('2d');
    if (ctx) drawSpine(ctx, size.w, size.h, book, detail);
    this.canvases.set(key, canvas);
    return canvas;
  }

  /** 抽出瞬间使用：与图集同源的中分辨率纹理，保证实例 → 焦点网格无跳变 */
  getSpineTexture(book: Book, detail: 'mid' | 'low' = 'mid'): THREE.Texture {
    const key = `${book.id}@${detail}`;
    const hit = this.cache.get(key);
    if (hit) {
      this.touch(key);
      return hit.texture;
    }
    const canvas = this.canvasFor(book, detail);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.store(key, texture, canvas.width, canvas.height);
    return texture;
  }

  /**
   * 高分辨率纹理异步加载（High-Res Rescan on Select）。
   * - 提供了 highResTextureUrl → 走 TextureLoader；
   * - 否则程序化绘制（并模拟一次网络延迟，使加载状态可见）。
   */
  loadHighRes(book: Book): Promise<THREE.Texture> {
    const key = `${book.id}@high`;
    const hit = this.cache.get(key);
    if (hit) {
      this.touch(key);
      return Promise.resolve(hit.texture);
    }
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const promise = (async () => {
      let texture: THREE.Texture;
      if (book.highResTextureUrl) {
        try {
          texture = await new THREE.TextureLoader().loadAsync(book.highResTextureUrl);
          texture.colorSpace = THREE.SRGBColorSpace;
        } catch {
          texture = this.fromCanvas(book, 'high');
        }
      } else {
        if (this.simulateLatencyMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.simulateLatencyMs));
        }
        texture = this.fromCanvas(book, 'high');
      }
      this.store(key, texture, texture.image?.width ?? HIGH_SIZE.w, texture.image?.height ?? HIGH_SIZE.h);
      return texture;
    })();

    this.inflight.set(key, promise);
    void promise.finally(() => this.inflight.delete(key));
    return promise;
  }

  private fromCanvas(book: Book, detail: 'mid' | 'high'): THREE.Texture {
    const canvas = this.canvasFor(book, detail);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  /** 2D 模态框的封面图（与 3D 高分辨率纹理同源，避免二次加载） */
  getCoverDataURL(book: Book): string {
    return this.canvasFor(book, 'high').toDataURL('image/png');
  }

  /* ── LRU 与释放 ─────────────────────────────────────────────── */

  private touch(key: string): void {
    const i = this.lru.indexOf(key);
    if (i >= 0) this.lru.splice(i, 1);
    this.lru.push(key);
  }

  private store(key: string, texture: THREE.Texture, w: number, h: number): void {
    this.cache.set(key, { texture, bytes: estimateBytes(w, h) });
    this.touch(key);
    this.recomputeUsed();
    this.evict();
  }

  private recomputeUsed(): void {
    let bytes = 0;
    for (const entry of this.cache.values()) bytes += entry.bytes;
    this.usedBytes = bytes;
  }

  /** 超出字节预算时，从最久未用开始淘汰（刚插入的本条不会被淘汰） */
  private evict(): void {
    while (this.usedBytes > this.budgetBytes && this.lru.length > 1) {
      const victim = this.lru[0];
      const entry = this.cache.get(victim);
      if (entry) {
        entry.texture.dispose(); // 真正释放显存，否则 LRU 只是丢了引用
        this.cache.delete(victim);
      }
      this.lru.shift();
      this.recomputeUsed();
    }
  }

  /** 书本返回书架：释放它的中/高分辨率纹理（图集是共享资源，不动） */
  release(bookId: string): void {
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(`${bookId}@`)) {
        this.cache.get(key)?.texture.dispose();
        this.cache.delete(key);
        const i = this.lru.indexOf(key);
        if (i >= 0) this.lru.splice(i, 1);
      }
    }
    this.canvases.delete(`${bookId}@mid-canvas`);
    this.canvases.delete(`${bookId}@high-canvas`);
    this.recomputeUsed();
  }

  /** 卸载整个场景 */
  dispose(): void {
    for (const entry of this.cache.values()) entry.texture.dispose();
    this.cache.clear();
    this.lru = [];
    for (const texture of this.atlases.values()) texture.dispose();
    this.atlases.clear();
    this.canvases.clear();
    this.usedBytes = 0;
  }
}
