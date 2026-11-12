/**
 * 确定性伪随机数（mulberry32）。
 * 布局与纹理都使用它，保证每次刷新书架完全一致（便于回归测试与截图比对）。
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 由字符串生成稳定种子（FNV-1a），用于按书 id 生成稳定纹理细节 */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function randRange(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

/** 以概率 p 返回 true */
export function chance(rng: () => number, p: number): boolean {
  return rng() < p;
}
