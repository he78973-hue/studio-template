/**
 * 书架布局算法。
 *
 * 输入 60 本书的纯数据，输出每本书的世界坐标位姿（BookPlacement）与书柜木框规格。
 * 全部使用种子随机（mulberry32），刷新后书架完全一致。
 *
 * 布局策略（模拟真实珍稀书架的「错落有致」）：
 *   - 4 个分区并排，每区 3 层搁板；
 *   - 每层按书脊宽度贪心装入，装不下的推到下一层；
 *   - 每层内按高度降序排列（大对开本靠外侧），剩余宽度按比例分摊成缝隙；
 *   - 每本书带轻微倾斜 / 前倾 / 探出（seeded jitter）；
 *   - 约 8% 的书平放（躺倒在搁板一端）。
 */
import type { Book, BookPlacement, SectionId } from '../types';
import { SECTIONS } from '../data/books';
import { chance, mulberry32, randRange } from './prng';

/* ── 书柜尺度（米） ───────────────────────────────────────────── */
export const BAY_WIDTH = 0.52;
export const BAY_GAP = 0.12;
export const BAY_DEPTH = 0.42;
export const BAY_HEIGHT = 2.05;
export const SHELVES_PER_BAY = 3;
export const BASE_HEIGHT = 0.14;
export const TOP_HEIGHT = 0.1;
export const BOARD_THICKNESS = 0.035;
export const SIDE_PANEL = 0.02;

/** 单层可用宽度（减去两侧板） */
const INNER_WIDTH = BAY_WIDTH - SIDE_PANEL * 2;
const INNER_HALF = INNER_WIDTH / 2;
const MIN_GAP = 0.006;
const MAX_GAP = 0.05;
const MAX_PER_ROW = 7;
const SHELF_PITCH = (BAY_HEIGHT - BASE_HEIGHT - TOP_HEIGHT) / SHELVES_PER_BAY;

/** 第 i 层搁板上表面高度 */
export function shelfTopY(shelf: number): number {
  return BASE_HEIGHT + shelf * SHELF_PITCH;
}

/** 分区 i 的中心 X */
export function bayCenterX(bayIndex: number): number {
  const totalWidth = SECTIONS.length * BAY_WIDTH + (SECTIONS.length - 1) * BAY_GAP;
  return -totalWidth / 2 + bayIndex * (BAY_WIDTH + BAY_GAP) + BAY_WIDTH / 2;
}

export interface BoardSpec {
  position: [number, number, number];
  size: [number, number, number];
}

export interface BaySpec {
  section: SectionId;
  bayIndex: number;
  center: [number, number, number];
  boards: BoardSpec[];
}

export interface ShelfLayout {
  placements: BookPlacement[];
  bays: BaySpec[];
  totalWidth: number;
  totalHeight: number;
}

/** 木框：侧板 + 顶板 + 底板 + 每层搁板 */
function buildBayBoards(section: SectionId, bayIndex: number): BoardSpec[] {
  const cx = bayCenterX(bayIndex);
  const boards: BoardSpec[] = [];
  const sideX = BAY_WIDTH / 2 - SIDE_PANEL / 2;

  boards.push({ position: [cx - sideX, BAY_HEIGHT / 2, 0], size: [SIDE_PANEL, BAY_HEIGHT, BAY_DEPTH] });
  boards.push({ position: [cx + sideX, BAY_HEIGHT / 2, 0], size: [SIDE_PANEL, BAY_HEIGHT, BAY_DEPTH] });
  boards.push({ position: [cx, BAY_HEIGHT - 0.02, 0], size: [BAY_WIDTH, 0.04, BAY_DEPTH] });
  boards.push({ position: [cx, 0.02, 0], size: [BAY_WIDTH, 0.04, BAY_DEPTH] });
  for (let s = 0; s < SHELVES_PER_BAY; s++) {
    const y = shelfTopY(s);
    boards.push({ position: [cx, y - BOARD_THICKNESS / 2, 0], size: [BAY_WIDTH, BOARD_THICKNESS, BAY_DEPTH] });
  }
  return boards;
}

/** 贪心装入：按书脊宽度把书分到各层 */
function packRows(books: Book[], flat: boolean[]): Book[][] {
  const rows: Book[][] = [[]];
  let used = 0;
  for (let i = 0; i < books.length; i++) {
    const w = books[i].dimensions.width;
    const need = used === 0 ? w : w + MIN_GAP;
    const row = rows[rows.length - 1];
    if (row.length < MAX_PER_ROW && used + need <= INNER_WIDTH + 1e-6) {
      row.push(books[i]);
      used += need;
    } else {
      rows.push([books[i]]);
      used = w;
    }
  }
  return rows;
}

/** 一层内按高度降序（稳定排序），平放书排到层尾 */
function sortRow(books: Book[], flatFlags: Map<string, boolean>): Book[] {
  return [...books].sort((a, b) => {
    const fa = flatFlags.get(a.id) ? 1 : 0;
    const fb = flatFlags.get(b.id) ? 1 : 0;
    if (fa !== fb) return fa - fb;
    return b.dimensions.height - a.dimensions.height;
  });
}

export function computeShelfLayout(books: Book[]): ShelfLayout {
  const placements: BookPlacement[] = [];
  const bays: BaySpec[] = [];
  let globalIndex = 0;

  SECTIONS.forEach((section, bayIndex) => {
    const sectionBooks = books.filter((b) => b.section === section.id);
    const rng = mulberry32(0x9e3779b9 ^ (bayIndex * 2654435761));

    // 1. 挑出平放的书（每区至多 2 本，且不打头）
    const flatFlags = new Map<string, boolean>();
    sectionBooks.forEach((book, i) => {
      const want = i > 0 && chance(rng, 0.08);
      const count = [...flatFlags.values()].filter(Boolean).length;
      flatFlags.set(book.id, want && count < 2);
    });

    const standing = sectionBooks.filter((b) => !flatFlags.get(b.id));
    const flatBooks = sectionBooks.filter((b) => flatFlags.get(b.id));

    // 2. 站立书贪心分层，平放书补到各层末尾
    const rows = packRows(standing, [...flatFlags.values()]);
    flatBooks.forEach((book) => {
      const row = rows.find((r) => r.length < MAX_PER_ROW) ?? rows[rows.length - 1];
      row.push(book);
    });
    while (rows.length < SHELVES_PER_BAY) rows.push([]);

    // 3. 每层定位 + 缝隙分摊
    rows.slice(0, SHELVES_PER_BAY).forEach((row, shelf) => {
      const sorted = sortRow(row, flatFlags);
      const y0 = shelfTopY(shelf);
      const totalW = sorted.reduce((sum, b) => sum + b.dimensions.width, 0);
      const n = sorted.length;
      const gap = n > 1 ? Math.min(MAX_GAP, Math.max(MIN_GAP, (INNER_WIDTH - totalW) / (n - 1))) : 0;
      let cursor = -INNER_HALF;

      for (const book of sorted) {
        const flat = flatFlags.get(book.id) === true;
        const w = book.dimensions.width;
        const x = bayCenterX(bayIndex) + cursor + w / 2;

        // ── 有机感的抖动（seeded） ──
        const lean = chance(rng, 0.1) ? randRange(rng, 0.02, 0.05) * (rng() > 0.5 ? 1 : -1) : randRange(rng, -0.015, 0.015);
        const tilt = chance(rng, 0.07) ? randRange(rng, 0.02, 0.04) * (rng() > 0.5 ? 1 : -1) : randRange(rng, -0.012, 0.012);
        const protrude = chance(rng, 0.15) ? 0 : randRange(rng, 0.004, 0.03);

        let position: [number, number, number];
        let rotation: [number, number, number];
        if (flat) {
          // 平放：绕 X 轴躺倒，封面朝读者，书脊朝上
          position = [x, y0 + book.dimensions.depth / 2, protrude + randRange(rng, -0.01, 0.01)];
          rotation = [-Math.PI / 2, randRange(rng, -0.03, 0.03), randRange(rng, -0.03, 0.03)];
        } else {
          position = [x, y0 + book.dimensions.height / 2, protrude];
          rotation = [tilt, randRange(rng, -0.01, 0.01), lean];
        }

        placements.push({
          book,
          index: globalIndex++,
          sectionIndex: placements.filter((p) => p.section === section.id).length,
          section: section.id,
          position,
          rotation,
          flat,
        });
        cursor += w + gap;
      }
    });

    bays.push({
      section: section.id,
      bayIndex,
      center: [bayCenterX(bayIndex), 1.0, 0.15],
      boards: buildBayBoards(section.id, bayIndex),
    });
  });

  const totalWidth = SECTIONS.length * BAY_WIDTH + (SECTIONS.length - 1) * BAY_GAP;
  return { placements, bays, totalWidth, totalHeight: BAY_HEIGHT };
}
