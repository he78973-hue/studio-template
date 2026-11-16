import { CATEGORIES, CONTENT_FORMATS, HOLIDAYS, MARKETS, SOURCES } from './data.js';

const FIELDS = ['title', 'en', 'category', 'market', 'sources', 'social', 'retail', 'growth', 'observedAt', 'url', 'tags', 'brief'];
const OPTIONAL_FIELDS = ['festival', 'platform', 'format', 'hook', 'mechanism', 'productIdea', 'sampleTask', 'views', 'likes', 'postUrl'];

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('CSV 引号格式不正确，请使用标准 CSV 文件。');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field); field = ''; closed = false;
      if (char !== ',') {
        if (row.some(cell => cell.trim())) rows.push(row);
        row = [];
        if (char === '\r' && input[i + 1] === '\n') i++;
      }
    } else {
      if (closed && char.trim()) throw new Error('CSV 引号后存在多余字符。');
      if (!closed) field += char;
    }
  }
  if (quoted) throw new Error('CSV 存在未闭合的引号。');
  row.push(field);
  if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

export function validateImport(text) {
  if (text.length > 2_000_000) throw new Error('文件过大，请使用 2 MB 以内的 CSV。');
  const [rawHeaders, ...rows] = parseCSV(text);
  if (!rawHeaders || !rows.length) throw new Error('文件中没有数据，请参考导入模板。');
  if (rows.length > 2000) throw new Error('单次最多导入 2,000 条记录。');
  const headers = rawHeaders.map(h => h.trim());
  if (new Set(headers).size !== headers.length) throw new Error('CSV 存在重复的列名。');
  const missing = FIELDS.filter(k => !headers.includes(k));
  if (missing.length) throw new Error(`缺少列：${missing.join('、')}。请下载模板后填写。`);
  const ids = new Set();
  return rows.map((row, i) => {
    const fail = message => { throw new Error(`第 ${i + 2} 行：${message}`); };
    if (row.length !== headers.length) fail('列数与表头不一致。');
    if (headers.includes('数据性质') && row[headers.indexOf('数据性质')].includes('演示')) fail('这是演示数据导出文件，不能作为真实调研导入。请使用有依据的调研记录。');
    const record = Object.fromEntries(FIELDS.map(h => [h, row[headers.indexOf(h)].trim()]));
    if (!record.title || record.title.length > 100) fail('title 需填写 1–100 字的趋势名称。');
    if (!CATEGORIES.includes(record.category)) fail(`category 需为 ${CATEGORIES.join(' / ')}。`);
    if (!Object.hasOwn(MARKETS, record.market)) fail('market 需为 US、UK、DE 或 FR。');
    const sources = record.sources.split('|').map(s => s.trim()).filter(Boolean);
    if (!sources.length || sources.some(s => !SOURCES.some(source => source.name === s))) fail('sources 需使用已列出的来源名称，多个来源用 | 分隔。');
    for (const key of ['social', 'retail', 'growth']) {
      if (record[key] === '' || !Number.isFinite(Number(record[key]))) fail(`${key} 必须为数字。`);
      record[key] = Number(record[key]);
    }
    if (record.social < 0 || record.social > 100 || record.retail < 0 || record.retail > 100) fail('social 和 retail 指数必须在 0–100 之间。');
    if (record.growth < -100 || record.growth > 10000) fail('growth 需在 -100 到 10000 之间。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.observedAt)) fail('observedAt 需使用 YYYY-MM-DD 格式。');
    const date = new Date(`${record.observedAt}T12:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== record.observedAt) fail('observedAt 不是有效日期。');
    for (const key of OPTIONAL_FIELDS) record[key] = headers.includes(key) ? row[headers.indexOf(key)].trim() : '';
    record.festival ||= 'unassigned';
    if (!Object.hasOwn(HOLIDAYS, record.festival)) fail('festival 请填写 christmas / easter / halloween / valentine / thanksgiving / evergreen / unassigned。');
    if (record.format && !CONTENT_FORMATS.includes(record.format)) fail(`format 请使用：${CONTENT_FORMATS.join(' / ')}。`);
    if (record.platform && (!SOURCES.some(s => s.type === 'social' && s.name === record.platform) || !sources.includes(record.platform))) fail('platform 需为 sources 中的 TikTok、Pinterest 或 Instagram。');
    for (const key of ['views', 'likes']) {
      record[key] = record[key] === '' ? null : Number(record[key]);
      if (record[key] !== null && (!Number.isSafeInteger(record[key]) || record[key] < 0)) fail(`${key} 需为非负整数；未知时请留空，不要填写 0。`);
    }
    if ((record.postUrl || record.views !== null || record.likes !== null) && !record.platform) fail('填写原帖或原始指标时，请同时填写 platform，避免混淆不同平台的数据。');
    for (const key of ['url', 'postUrl']) {
      if (!record[key]) continue;
      try { if (!['https:', 'http:'].includes(new URL(record[key]).protocol)) fail(`${key} 仅支持 http 或 https 链接。`); }
      catch { fail(`${key} 不是有效的网页链接。`); }
    }
    const id = record.postUrl ? `import-post-${record.platform}-${record.postUrl}-${record.market}-${record.observedAt}` : `import-${record.title}-${record.market}-${record.observedAt}`;
    if (ids.has(id)) fail('同一原帖或趋势、市场和日期出现重复记录。');
    ids.add(id);
    return { ...record, id, sources: [...new Set(sources)], tags: record.tags.split('|').filter(Boolean), provenance: 'imported', image: '', colors: [], history: [] };
  });
}

export function makeCSV(headers, rows) {
  const escape = value => {
    let text = String(value ?? '');
    // Neutralize spreadsheet formulas in text while preserving numeric values.
    if (typeof value !== 'number' && /^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
}

export function templateCSV(date) {
  return makeCSV([...FIELDS, ...OPTIONAL_FIELDS], [['调研示例（请替换）', 'Replace with your research', '节日装饰', 'US', 'Pinterest|Target', 70, 60, 15, date, 'https://www.target.com/', '蝴蝶结|丝绒', '请填写基于实际观察的设计建议。', 'christmas', 'Pinterest', '图文灵感', '请填写真实内容标题或开头', '请描述吸引关注的内容特点', '请填写可开发的产品系列', '请填写下一步打样任务', '', '', '']]);
}

export function trendCSV(trends, provenance) {
  return makeCSV([...FIELDS, ...OPTIONAL_FIELDS, '数据性质'], trends.map(t => [...[...FIELDS, ...OPTIONAL_FIELDS].map(k => Array.isArray(t[k]) ? t[k].join('|') : t[k]), provenance]));
}

export function downloadFile(content, filename, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
