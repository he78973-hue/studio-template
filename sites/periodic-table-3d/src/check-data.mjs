/* 数据自检：Z 连续 1-118、shells 求和=Z、质量>0、网格坐标唯一、分类合法 */
import { ELEMENTS, CATEGORIES, CATEGORY_ORDER, PLACEHOLDERS } from './elements.js';

const errors = [];
if (ELEMENTS.length !== 118) errors.push(`元素数量 ${ELEMENTS.length} ≠ 118`);
const seen = new Set();
for (const e of ELEMENTS) {
  if (e.z < 1 || e.z > 118) errors.push(`${e.symbol}: z=${e.z} 越界`);
  const sum = e.shells.reduce((a, b) => a + b, 0);
  if (sum !== e.z) errors.push(`${e.symbol}: shells 求和 ${sum} ≠ z ${e.z} (${e.shells})`);
  if (!(e.mass > 0)) errors.push(`${e.symbol}: mass=${e.mass}`);
  if (!CATEGORIES[e.category]) errors.push(`${e.symbol}: 未知分类 ${e.category}`);
  if (e.shells.length > 7) errors.push(`${e.symbol}: 壳层数 ${e.shells.length} > 7`);
  if (!e.name || e.name.length < 1) errors.push(`${e.symbol}: 缺少中文名`);
  const key = `${e.xpos},${e.ypos}`;
  if (seen.has(key)) errors.push(`${e.symbol}: 网格坐标重复 (${key})`);
  seen.add(key);
  // 每层电子数不得超过 2n²
  e.shells.forEach((n, i) => { if (n > 2 * (i + 1) ** 2) errors.push(`${e.symbol}: 第${i + 1}层 ${n} > 2n²`); });
}
// 抽查关键元素（验收清单点名）
const spot = { Fe: [2, 8, 14, 2], C: [2, 4], H: [1] };
for (const [sym, shells] of Object.entries(spot)) {
  const el = ELEMENTS.find(e => e.symbol === sym);
  if (JSON.stringify(el.shells) !== JSON.stringify(shells)) errors.push(`${sym} shells ${el.shells} ≠ ${shells}`);
}
if (new Set(ELEMENTS.map(e => e.z)).size !== 118) errors.push('z 有重复');
for (const p of PLACEHOLDERS) if (seen.has(`${p.xpos},${p.ypos}`)) errors.push(`占位格与元素重叠 (${p.xpos},${p.ypos})`);
if (CATEGORY_ORDER.length !== Object.keys(CATEGORIES).length) errors.push('图例顺序与分类数量不符');

if (errors.length) { console.error('数据自检失败:\n' + errors.join('\n')); process.exit(1); }
console.log('数据自检通过：118 元素 / shells 求和全部 = Z / 坐标唯一 / 分类合法');
console.log('抽查：Fe [2,8,14,2] · C [2,4] · H [1] ✓');
