import { assetUrl } from './assets.js';

export const DEMO_DATE = '2026-11-13';
export const MARKETS = { US: '美国', UK: '英国', DE: '德国', FR: '法国' };
export const EUROPE_MARKETS = ['UK', 'DE', 'FR'];
export const CATEGORIES = ['节日装饰', '家居装饰', '餐厨用品', '家用纺织', '香氛个护'];
export const HOLIDAYS = { christmas: '圣诞节', easter: '复活节', halloween: '万圣节', valentine: '情人节', thanksgiving: '感恩节', evergreen: '日常家居', unassigned: '待归类' };
export const CONTENT_FORMATS = ['布置前后对比', 'DIY 教程', '开箱与好物', '餐桌场景', '氛围短片', '收纳改造', '图文灵感'];
export const SOURCES = [
  { name: 'Pinterest', type: 'social', short: 'P', description: '审美关键词、收藏趋势与灵感主题', url: 'https://trends.pinterest.com/', access: '按账号与地区确认可用的趋势工具或授权 API；也可导出调研记录后导入。' },
  { name: 'TikTok', type: 'social', short: '♪', description: '热门话题、内容互动与新品讨论', url: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en', access: '使用 Creative Center 人工观察，或在获得适用 API 权限后接入；当前未配置凭据。' },
  { name: 'Instagram', type: 'social', short: '◎', description: '生活方式内容、视觉风格与创作者', url: 'https://www.instagram.com/', access: '需确认 Meta 账号类型、API 权限及可读取范围；当前未连接账号。' },
  { name: 'Target', type: 'retail', short: '◎', description: '美国家居新品、货架风格与价格带', url: 'https://www.target.com/c/home/-/N-5xtvd', access: '通过官方合作数据、授权服务或人工记录采集；上架信息不能直接视为真实销量。' },
  { name: 'Walmart', type: 'retail', short: '✳', description: '大众消费趋势、畅销榜与新品观察', url: 'https://www.walmart.com/cp/home/4044', access: '需评估官方接口或有授权的数据供应商；当前未接入销量或商品数据。' },
  { name: 'Amazon', type: 'retail', short: 'a', description: '细分榜单、评价关键词与品类变化', url: 'https://www.amazon.com/Best-Sellers-Home-Kitchen/zgbs/home-garden', access: '需确认 Amazon API 或第三方授权数据范围；榜单排名与真实销量分别记录。' },
  { name: 'IKEA', type: 'retail', short: 'I', description: '欧美家居系列、季节布置与新品场景', url: 'https://www.ikea.com/', access: '按目标国家记录季节系列、材质与陈列方式；需官方合作、授权服务或人工调研记录，当前未接入。' },
  { name: 'Action', type: 'retail', short: 'A', description: '德国、法国的节庆装饰与平价家居', url: 'https://www.action.com/', access: '首期覆盖德国与法国的公开商品观察入口；需授权数据或人工记录。商品上架不能视为销量，当前未接入。' },
];

const seed = [
  ['organic-ceramics', '有机形态陶瓷', 'Organic ceramics', '家居装饰', 'US', 94, 83, 68, ['Pinterest', 'TikTok', 'Target'], ['自然肌理', '奶油色', '手作感'], 'ceramics', '以不规则轮廓和哑光釉面组成花器、烛台系列；先做三款轮廓与两组釉色小样。', ['#d8cabc', '#b59b7a', '#73755c']],
  ['quiet-living', '自然系慢生活', 'Quiet living', '家居装饰', 'UK', 87, 79, 52, ['Pinterest', 'Instagram', 'Amazon'], ['原木', '低饱和', '自然主义'], 'interior', '将浅木、藤编和米白陶瓷组织为可组合的桌面系列，突出材质之间的对比。', ['#d8d4c5', '#a79573', '#667459']],
  ['soft-stripes', '柔色条纹织物', 'Soft stripes', '家用纺织', 'US', 85, 73, 46, ['Pinterest', 'Target'], ['细条纹', '鼠尾草绿', '棉麻'], 'textiles', '开发浅绿与奶油色细条纹餐巾、桌旗和抱枕；统一纹样尺度与系列包装。', ['#b6bea3', '#eee4d1', '#c99c8b']],
  ['sculptural-candles', '雕塑感香氛', 'Sculptural candles', '香氛个护', 'DE', 89, 70, 61, ['TikTok', 'Instagram', 'Amazon'], ['曲线造型', '疗愈', '礼赠'], 'candles', '以圆润容器和低饱和色构建礼赠香氛系列，验证容器稳定性与运输包装。', ['#e4d9c7', '#b48871', '#a5ad94']],
  ['coffee-ritual', '居家咖啡仪式', 'Coffee rituals', '餐厨用品', 'US', 81, 86, 35, ['TikTok', 'Walmart', 'Amazon'], ['咖啡角', '模块收纳', '陶瓷杯'], 'coffee', '围绕咖啡角设计杯碟、托盘与小收纳，让相同配色贯穿三种产品。', ['#644b3d', '#c2a184', '#e3d8c5']],
  ['linen-table', '棉麻餐桌美学', 'Linen table', '家用纺织', 'DE', 76, 79, 29, ['Pinterest', 'Amazon'], ['亚麻', '餐桌布置', '素色'], 'textiles', '用自然褶皱、宽边与同色刺绣形成产品识别，补齐桌布、餐垫和餐巾。', ['#d0c1aa', '#ece5d8', '#92967e']],
  ['earthy-tableware', '大地色餐具', 'Earthy tableware', '餐厨用品', 'UK', 83, 84, 41, ['Pinterest', 'Instagram', 'Amazon'], ['窑变釉', '陶土', '日常餐桌'], 'ceramics', '建立陶土红、燕麦白、橄榄绿三色餐具组合，优先验证釉色与食品接触要求。', ['#b87b59', '#d8cfb9', '#79795f']],
  ['botanical-scent', '植物系香氛', 'Botanical scent', '香氛个护', 'US', 72, 64, 24, ['Instagram', 'Target'], ['草本', '简洁包装', '浴室'], 'candles', '以植物线描与半透明容器建立轻量视觉，开发扩香与蜡烛组合装。', ['#859377', '#dce0cf', '#d4bc99']],
  ['compact-living', '小空间收纳', 'Compact living', '家居装饰', 'DE', 69, 88, 22, ['TikTok', 'Amazon'], ['堆叠', '模块化', '多功能'], 'interior', '先研究书桌和玄关两类场景，设计同底面尺寸的可堆叠收纳产品。', ['#dad8cd', '#9b8b76', '#515b50']],
  ['weekend-brunch', '周末早午餐', 'Weekend brunch', '餐厨用品', 'US', 77, 74, 32, ['TikTok', 'Target', 'Walmart'], ['早餐杯', '分享餐盘', '明亮色彩'], 'coffee', '开发早餐杯与分享盘的套系图案，色彩保持低饱和并留出节日包装变体。', ['#e4b967', '#dcd5bf', '#a8b3a1']],
  ['textured-cushion', '立体肌理抱枕', 'Textured cushions', '家用纺织', 'UK', 70, 71, 18, ['Pinterest', 'Amazon'], ['圈绒', '立体纹样', '触感'], 'textiles', '通过圈绒与平织对比形成触感层次，控制配色数量并测试面料耐磨。', ['#e0d5c1', '#b3a58d', '#8e776b']],
  ['amber-glow', '琥珀色暖光', 'Amber glow', '家居装饰', 'DE', 65, 62, -8, ['Instagram', 'Amazon'], ['琥珀色', '复古', '暖光'], 'candles', '以小批次探索暖色玻璃与烛台搭配，待增长信号回升后再扩展系列。', ['#b57535', '#dec6a4', '#695543']],
  ['ribbon-christmas', '丝绒蝴蝶结圣诞', 'Velvet bow Christmas', '节日装饰', 'US', 96, 82, 76, ['TikTok', 'Pinterest', 'Target'], ['酒红丝绒', '蝴蝶结', '复古圣诞'], 'christmas', '开发树挂、门环、烛台绑饰三款组合。先验证蝴蝶结定型、可拆装结构与平摊包装，形成同材质不同尺寸的系列。', ['#763b3f', '#c9b99d', '#304d3d']],
  ['paper-village', '纸艺发光圣诞村', 'Paper Christmas village', '节日装饰', 'FR', 91, 78, 63, ['Pinterest', 'Instagram', 'Action'], ['折叠纸艺', '暖光', '窗台陈列'], 'christmas-gifts', '设计可折叠纸屋与可拆式灯座，组合为三件套。优先验证折叠次数、灯源隔离、稳定性和小体积运输包装。', ['#ded5c2', '#b49d73', '#f4ecd9']],
  ['pastel-easter', '柔彩复活节餐桌', 'Pastel Easter tablescape', '节日装饰', 'DE', 86, 76, 49, ['Pinterest', 'Instagram', 'IKEA'], ['兔形轮廓', '彩蛋', '春日餐桌'], 'ceramics', '开发兔形摆件、彩蛋小花器和餐巾环三件套；先做同色系轮廓草图，检查摆放稳定性与包装分格。', ['#bdc5a6', '#e9d2bf', '#dac8d5']],
  ['heart-table', '爱心礼赠小场景', 'Valentine table decor', '节日装饰', 'UK', 88, 74, 55, ['TikTok', 'Instagram', 'Amazon'], ['爱心', '烛光', '小件礼赠'], 'candles', '开发爱心托盘、双支烛台和小卡夹组合。尽量沿用现有器型，测试配色和小批量礼盒，而非直接投入新模具。', ['#bd7b79', '#efd5c9', '#853f49']],
  ['soft-halloween', '柔软南瓜万圣节', 'Fabric pumpkin Halloween', '节日装饰', 'US', 84, 80, 42, ['TikTok', 'Pinterest', 'Walmart'], ['布艺南瓜', '可复用', '秋日玄关'], 'textiles', '开发可拆填充的布艺南瓜、门挂与桌面摆件。先做两种材质和三种尺寸，比较组装耗时与压缩包装效果。', ['#b87b4f', '#d7bf94', '#737452']],
  ['harvest-table', '丰收季自然餐桌', 'Thanksgiving natural table', '节日装饰', 'US', 80, 77, 31, ['Pinterest', 'Instagram', 'Target'], ['秋叶', '原木', '丰收餐桌'], 'coffee', '用秋叶餐巾环、木质小托盘和低矮摆件组成餐桌系列。提炼通用秋季元素，让产品可延伸到日常使用。', ['#ab7851', '#e1cba3', '#6c7350']],
];

const contentExamples = {
  'ribbon-christmas': { festival: 'christmas', format: '布置前后对比', hook: '一条丝绒带，让普通圣诞树有了复古感', mechanism: '同机位前后对比，把低成本装饰带来的变化集中在开头；细节特写让材质更容易被看见。', productIdea: '可重复使用的蝴蝶结树挂＋门环＋烛台绑饰', sampleTask: '制作 3 个尺寸、2 种定型结构的蝴蝶结样，测试展开与复原。', views: 1280000, likes: 86400 },
  'paper-village': { festival: 'christmas', format: 'DIY 教程', hook: '把窗台变成一座会发光的小镇', mechanism: '折叠过程提供可模仿的步骤，点灯瞬间形成视觉反差；单个纸屋可以逐步延展成整套场景。', productIdea: '折叠纸屋三件套＋可拆灯座＋替换屋顶图案', sampleTask: '验证纸屋折痕强度、灯座结构与折叠包装尺寸。', views: 940000, likes: null },
  'pastel-easter': { festival: 'easter', format: '餐桌场景', hook: '不用整桌换新，也能布置春日复活节', mechanism: '在日常白色餐具上叠加少量彩蛋、兔形轮廓和花枝，示范小件装饰的场景改造能力。', productIdea: '兔形摆件＋彩蛋花器＋同色餐巾环', sampleTask: '完成 3 款轮廓和 2 组低饱和配色，核算三件套装箱率。', views: 620000, likes: null },
  'heart-table': { festival: 'valentine', format: '氛围短片', hook: '两个人的晚餐，用三个小物件改变气氛', mechanism: '灯光、托盘和小摆件依次进入镜头，强调同套产品组合使用；适合礼赠套装的展示。', productIdea: '爱心托盘＋双支烛台＋礼赠卡夹', sampleTask: '优先复用现有模具，制作色样并测试礼盒内衬。', views: 780000, likes: 49200 },
  'soft-halloween': { festival: 'halloween', format: '布置前后对比', hook: '不走恐怖路线，也能做出秋日万圣节玄关', mechanism: '用柔软面料和大地色替代一次性塑料装饰，强化触感和可复用体验；玄关视角更易比较整体效果。', productIdea: '可拆填充布艺南瓜＋秋季门挂', sampleTask: '比对丝绒与棉麻两种面料，测试压缩运输后的恢复。', views: 860000, likes: 57300 },
  'harvest-table': { festival: 'thanksgiving', format: '餐桌场景', hook: '把秋叶和原木搬上丰收餐桌', mechanism: '低矮摆件保留交流视线，俯拍展现餐桌组合；从单件商品转向完整餐桌方案。', productIdea: '秋叶餐巾环＋原木小托盘＋矮款桌面摆件', sampleTask: '检查餐巾环连接结构和木件表面处理，形成两种装箱方案。', views: 510000, likes: null },
  'organic-ceramics': { format: '开箱与好物', hook: '不同轮廓、同一釉色，把桌面小物连成一个系列', mechanism: '触感特写与器型对照突出手作感，展示一件到一组的陈列变化。', productIdea: '有机形态花器＋烛台＋首饰托盘', sampleTask: '输出 3 款轮廓草图，比较哑光釉与颗粒釉。', views: 430000, likes: null },
  'coffee-ritual': { format: '收纳改造', hook: '用一只托盘，把杂乱台面变成咖啡角', mechanism: '固定机位展示台面从杂乱到有序，产品功能通过动作直接表达。', productIdea: '模块化咖啡托盘＋杯碟＋小收纳', sampleTask: '验证不同杯径的兼容性和清洁死角。', views: 710000, likes: 38500 },
  'soft-stripes': { format: '布置前后对比', hook: '只换桌旗和抱枕，让房间换个季节', mechanism: '将同一纹样跨品类使用，降低完整换装的理解成本。', productIdea: '细条纹桌旗＋餐巾＋同色抱枕套', sampleTask: '比较两种条纹尺度，完成棉麻色样。', views: 380000, likes: null },
  'sculptural-candles': { format: '氛围短片', hook: '香氛容器，也可以成为不点燃时的摆件', mechanism: '用轮廓、光影和手部动作突出容器设计，强调日常装饰的二次使用场景。', productIdea: '雕塑感香氛容器＋同形托盘', sampleTask: '验证容器稳定性与运输内衬，核对烛芯与容器适配。', views: 560000, likes: 32400 },
};

export const sourceSlug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const primaryPlatform = trend => trend.platform || trend.sources.find(name => SOURCES.find(source => source.name === name)?.type === 'social') || '';
export const holidayLabel = trend => HOLIDAYS[trend.festival] || HOLIDAYS.unassigned;

export function opportunityScore(trend) {
  return Math.round(trend.social * 0.45 + trend.retail * 0.35 + Math.min(100, Math.max(0, trend.growth)) * 0.2);
}

export const demoTrends = seed.map((row, index) => {
  const [id, title, en, category, market, social, retail, growth, sources, tags, image, brief, colors] = row;
  return {
    id, title, en, category, market, social, retail, growth, sources, tags, brief, colors,
    festival: 'evergreen', format: '图文灵感', hook: `${title}的场景搭配与产品细节`, mechanism: '对照材质、轮廓和组合方式，先记录可复用的设计元素，再核查是否有持续增长的原始内容依据。',
    productIdea: brief.split('；')[0], sampleTask: '先收集原始帖子与商品链接，再完成轮廓、材质和系列化草图。', views: null, likes: null, postUrl: '',
    ...contentExamples[id], platform: sources.find(name => SOURCES.find(source => source.name === name)?.type === 'social') || '',
    image: assetUrl(`images/${image}.jpg`), observedAt: `2026-11-${String(13 - index % 5).padStart(2, '0')}`,
    url: '', provenance: 'demo',
    history: Array.from({ length: 13 }, (_, i) => {
      if (i === 12) return social;
      const baseline = Math.min(100, social / (1 + growth / 100));
      if (i <= 8) return Math.round(baseline * (0.54 + i * 0.0575));
      const rhythms = [[0.18, 0.59, 0.73], [0.55, 0.62, 0.89], [0.24, 0.39, 0.84]];
      return Math.round(baseline + (social - baseline) * rhythms[index % 3][i - 9]);
    }),
  };
});

export function researchUrl(trend, source) {
  const q = encodeURIComponent(trend.en || trend.title);
  if (source === 'Pinterest') return `https://www.pinterest.com/search/pins/?q=${q}`;
  if (source === 'TikTok') return `https://www.tiktok.com/search?q=${q}`;
  if (source === 'Target') return `https://www.target.com/s?searchTerm=${q}`;
  if (source === 'Walmart') return `https://www.walmart.com/search?q=${q}`;
  if (source === 'Amazon') return `https://www.amazon.${{ DE: 'de', UK: 'co.uk', FR: 'fr', US: 'com' }[trend.market] || 'com'}/s?k=${q}`;
  if (source === 'IKEA') return `https://www.ikea.com/${{ US: 'us/en', UK: 'gb/en', DE: 'de/de', FR: 'fr/fr' }[trend.market] || 'us/en'}/`;
  if (source === 'Action') return `https://www.action.com/${trend.market === 'FR' ? 'fr-fr' : 'de-de'}/`;
  return 'https://www.instagram.com/';
}

export function observationWindow(anchor, days) {
  const start = new Date(`${anchor}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { start: start.toISOString().slice(0, 10), end: anchor };
}

export function filterTrends(trends, { market = 'all', category = 'all', query = '', channel = 'all', platform = 'all', festival = 'all', days = 30, anchor = DEMO_DATE } = {}) {
  const end = new Date(`${anchor}T23:59:59Z`).getTime();
  const start = new Date(`${observationWindow(anchor, days).start}T00:00:00Z`).getTime();
  return trends.filter(t => {
    const observed = new Date(`${t.observedAt}T12:00:00Z`).getTime();
    const matchesChannel = channel === 'all' || t.sources.some(s => SOURCES.find(source => source.name === s)?.type === channel);
    const matchesMarket = market === 'all' || (market === 'EUROPE' ? EUROPE_MARKETS.includes(t.market) : t.market === market);
    const matchesCategory = category === 'all' || (category === 'home' ? t.category !== '节日装饰' : t.category === category);
    return matchesMarket && matchesCategory && matchesChannel && (platform === 'all' || primaryPlatform(t) === platform) && (festival === 'all' || (t.festival || 'unassigned') === festival) &&
      `${t.title} ${t.en} ${t.tags.join(' ')} ${t.sources.join(' ')} ${t.hook || ''} ${t.productIdea || ''} ${holidayLabel(t)}`.toLowerCase().includes(query.trim().toLowerCase()) && observed >= start && observed <= end;
  }).sort((a, b) => opportunityScore(b) - opportunityScore(a));
}

export function nextQuarters(date = new Date()) {
  const q = Math.floor(date.getMonth() / 3);
  return Array.from({ length: 4 }, (_, i) => {
    const next = q + i + 1;
    return `${date.getFullYear() + Math.floor(next / 4)}-Q${next % 4 + 1}`;
  });
}

export function quarterMonths(quarter) {
  const q = Number(quarter.split('Q')[1]);
  return Array.from({ length: 3 }, (_, i) => (q - 1) * 3 + i + 1);
}
