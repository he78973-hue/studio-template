/**
 * 显存 / 内存清理机制（Garbage Collection Ledger）
 * ─────────────────────────────────────────────────────────────
 * 问题：每打开一本书都会生成「数千个星轨粒子 + 全息羊皮纸纹理 + Morph 几何」，
 * 若不显式 dispose，WebGL 纹理与缓冲会一直驻留显存，移动端几次切换后即 OOM。
 *
 * 设计：
 *   - DisposalStack   一本书的「资源台账」，按 key 登记 geometry / material / texture，
 *                     flush() 时逐个 .dispose() 并清空（幂等，可重复调用）。
 *   - BookResourceCache 全局缓存：打开时触活（复用，避免重建掉帧），
 *                     切换 / 关闭时 release → 该书的资源被彻底擦除。
 *   - 每本书带「估算字节数」，HUD 可直接观察显存占用变化。
 */

export interface Disposable {
  dispose(): void;
}

/** 估算纹理显存：RGBA + mipmap 链 ≈ +33% */
export function estimateTextureBytes(w: number, h: number): number {
  return w * h * 4 * 1.33;
}

/** 估算缓冲显存：position/normal/uv + morph targets(2 份 position + 1 份 normal) */
export function estimateGeometryBytes(vertexCount: number, indexCount: number, morphTargets = 2): number {
  const base = vertexCount * (3 + 3 + 2) * 4 + indexCount * 4;
  const morph = vertexCount * (3 * morphTargets + 3 * Math.min(1, morphTargets)) * 4;
  return base + morph;
}

export class DisposalStack {
  private items = new Map<string, Disposable>();

  /** 登记资源（同 key 重复登记会覆盖旧值，避免 StrictMode 双挂载时重复创建） */
  track<T extends Disposable>(key: string, item: T): T {
    const prev = this.items.get(key);
    if (prev && prev !== item) prev.dispose();
    this.items.set(key, item);
    return item;
  }

  /** 取已登记资源（复用路径） */
  get<T extends Disposable>(key: string): T | undefined {
    return this.items.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.items.has(key);
  }

  /** 幂等擦除： dispose 全部并清空台账 */
  flush(): void {
    for (const item of this.items.values()) {
      try {
        item.dispose();
      } catch {
        /* 已释放过的对象忽略 */
      }
    }
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }
}

export interface ResourceStats {
  /** 当前缓存的书本数 */
  books: number;
  /** 登记的可释放资源条数 */
  entries: number;
  /** 估算显存占用（字节） */
  bytes: number;
}

export class BookResourceCache {
  private stacks = new Map<string, DisposalStack>();
  private bytes = new Map<string, number>();
  private lru: string[] = [];
  /** 正在展示的书（任何淘汰都跳过它，避免把眼前这本书的资源删掉） */
  private activeId: string | null = null;
  readonly maxBooks: number;
  /** 预热缓存上限：除活动书本外，最多额外保留几本（悬停扫书目时防止无界增长） */
  readonly maxWarm: number;

  constructor(maxBooks = 1, maxWarm = 2) {
    this.maxBooks = maxBooks;
    this.maxWarm = maxWarm;
  }

  /** 取（或新建）一本书的台账 */
  stackFor(bookId: string): DisposalStack {
    let stack = this.stacks.get(bookId);
    if (!stack) {
      stack = new DisposalStack();
      this.stacks.set(bookId, stack);
      this.bytes.set(bookId, 0);
    }
    return stack;
  }

  /** 累加估算字节 */
  addBytes(bookId: string, n: number): void {
    this.bytes.set(bookId, (this.bytes.get(bookId) ?? 0) + n);
  }

  /** 触活（打开一本书）：标记为活动书本，并把缓存压回 maxBooks */
  touch(bookId: string): void {
    this.activeId = bookId;
    this.promote(bookId);
    this.evictBeyond(this.maxBooks, bookId);
  }

  /** 预热（悬停一本书）：建栈但不提升为活动书本，总量受 maxBooks + maxWarm 约束 */
  retain(bookId: string): void {
    this.promote(bookId);
    this.evictBeyond(this.maxBooks + this.maxWarm, this.activeId);
  }

  private promote(bookId: string): void {
    const i = this.lru.indexOf(bookId);
    if (i >= 0) this.lru.splice(i, 1);
    this.lru.push(bookId);
  }

  /** 从最久未用开始淘汰，直到不超过 limit；protect 永不被淘汰 */
  private evictBeyond(limit: number, protect: string | null): void {
    while (this.stacks.size > limit && this.lru.length > 0) {
      const victim = this.lru[0];
      if (!victim || victim === protect) {
        // 保护对象排在队首 → 先绕到队尾再试，避免死循环
        this.lru.push(this.lru.shift() as string);
        if (this.lru[0] === victim) break;
        continue;
      }
      this.release(victim);
    }
  }

  /** 擦除一本书的全部资源（显存） */
  release(bookId: string): void {
    if (this.activeId === bookId) this.activeId = null;
    this.stacks.get(bookId)?.flush();
    this.stacks.delete(bookId);
    this.bytes.delete(bookId);
    const i = this.lru.indexOf(bookId);
    if (i >= 0) this.lru.splice(i, 1);
  }

  /** 擦除除 keepId 外的所有书 —— 切换书籍时调用，保证上一本被彻底擦除 */
  releaseOthers(keepId: string | null): void {
    for (const id of [...this.stacks.keys()]) {
      if (id !== keepId) this.release(id);
    }
  }

  /** 全部擦除（组件卸载 / 关闭详情时调用） */
  releaseAll(): void {
    this.activeId = null;
    for (const id of [...this.stacks.keys()]) this.release(id);
  }

  get stats(): ResourceStats {
    let entries = 0;
    let bytes = 0;
    for (const [id, stack] of this.stacks) {
      entries += stack.size;
      bytes += this.bytes.get(id) ?? 0;
    }
    return { books: this.stacks.size, entries, bytes };
  }
}
