// Authored example menu. Prices are integer CNY; no store API is connected.
export const products = [
  {
    id: 'tofu', name: '香烤豆腐能量碗', english: 'THE SUPER BOWL', category: 'bowl',
    price: 38, unit: '碗', image: new URL('./assets/bowl-signature.webp', import.meta.url).href, cutout: true, tone: 'blue',
    tag: 'SUPER 招牌', accent: true,
    ingredients: '香烤豆腐 · 毛豆 · 甜玉米 · 鸡蛋 · 时蔬',
    description: '香烤豆腐的焦香，遇上时蔬的爽脆。一碗丰富，让这一餐更有满足感。',
    dressing: '芝麻风味酱汁',
    details: '搭配芝麻风味酱汁。含大豆、鸡蛋与芝麻。',
    alt: '香烤豆腐、毛豆、玉米、鸡蛋和多彩时蔬沙拉碗',
  },
  {
    id: 'avocado', name: '牛油果花园沙拉', english: 'GREEN GOODNESS', category: 'salad',
    price: 36, unit: '碗', image: new URL('./assets/bowl-garden.webp', import.meta.url).href, cutout: true, tone: 'green',
    tag: '满满植物能量',
    ingredients: '牛油果 · 鹰嘴豆 · 烤红薯 · 小番茄 · 生菜',
    description: '绵密牛油果、甜软红薯与清爽绿叶菜，把花园里的好味道装进碗里。',
    dressing: '酸奶芝麻酱汁',
    details: '搭配酸奶芝麻酱汁。含乳制品与芝麻。',
    alt: '牛油果、鹰嘴豆、烤红薯和小番茄搭配绿叶菜',
  },
  {
    id: 'rainbow', name: '缤纷彩虹时蔬碗', english: 'EAT THE RAINBOW', category: 'salad',
    price: 32, unit: '碗', image: new URL('./assets/bowl-avocado.webp', import.meta.url).href, cutout: true, tone: 'peach',
    tag: '清爽脆口',
    ingredients: '彩椒 · 樱桃萝卜 · 胡萝卜 · 黄瓜 · 紫甘蓝',
    description: '让颜色成为这一餐的主角。清脆时蔬搭配明亮柠檬香，轻盈也有好滋味。',
    dressing: '柠檬橄榄油汁',
    details: '搭配柠檬橄榄油汁。示例配方不含常见八类过敏原；实际制作可能存在交叉接触。',
    alt: '彩椒、萝卜、黄瓜、胡萝卜和紫甘蓝组成的彩虹沙拉',
  },
  {
    id: 'pomegranate', name: '牛油果石榴沙拉', english: 'A LITTLE EXTRA GREEN', category: 'salad',
    price: 39, unit: '份', image: new URL('./assets/salad-energy.jpg', import.meta.url).href, tone: 'green',
    tag: '酸甜好心情',
    ingredients: '牛油果 · 石榴 · 菠菜 · 胡萝卜 · 混合籽仁',
    description: '石榴的酸甜点亮牛油果的柔滑，再加一点籽仁的脆，口口都有层次。',
    dressing: '柑橘油醋汁',
    details: '搭配柑橘油醋汁。含芝麻；混合籽仁可能接触坚果。',
    alt: '铺满牛油果、石榴、菠菜和混合籽仁的沙拉盘',
  },
  {
    id: 'egg', name: '田园鸡蛋暖蔬碗', english: 'SUNSHINE IN A BOWL', category: 'bowl',
    price: 35, unit: '碗', image: new URL('./assets/salad-seasonal.jpg', import.meta.url).href, tone: 'peach',
    tag: '暖心一碗',
    ingredients: '鸡蛋 · 牛油果 · 番茄 · 羽衣甘蓝 · 芝麻',
    galleryImage: new URL('./assets/bowl-seasonal-crop.webp', import.meta.url).href,
    description: '鸡蛋与暖蔬带来踏实的满足，搭配清爽鲜蔬，把日常吃得暖一点。',
    dressing: '清爽柠檬酱汁',
    details: '搭配清爽柠檬酱汁。含鸡蛋与芝麻。暖蔬与冷鲜配菜分区搭配。',
    alt: '鸡蛋、番茄、羽衣甘蓝和牛油果盛放在蓝色餐盘中',
  },
  {
    id: 'greek', name: '希腊菲达沙拉', english: 'A TASTE OF THE MED', category: 'salad',
    price: 36, unit: '碗', image: new URL('./assets/menu-greek.webp', import.meta.url).href, tone: 'green',
    tag: '地中海风味',
    ingredients: '菲达奶酪 · 番茄 · 黄瓜 · 橄榄 · 红洋葱 · 青椒',
    description: '咸香菲达奶酪配上多汁番茄与清脆黄瓜，带着橄榄和香草的地中海气息。',
    dressing: '牛至柠檬橄榄油汁',
    details: '示例配方含乳制品。菲达奶酪自带咸香，酱汁建议少量拌入。',
    alt: '菲达奶酪、番茄、黄瓜、橄榄和红洋葱组成的希腊沙拉',
    credit: {
      author: 'zone41', title: 'Greek Salad Choriatiki', source: 'https://commons.wikimedia.org/wiki/File:Greek_Salad_Choriatiki.jpg',
      license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    },
  },
  {
    id: 'chicken', name: '鸡肉石榴能量碗', english: 'CHICKEN & GOOD ENERGY', category: 'bowl',
    price: 42, unit: '碗', image: new URL('./assets/menu-chicken.webp', import.meta.url).href, tone: 'peach',
    tag: '丰富又满足',
    ingredients: '鸡肉 · 鸡蛋 · 意面 · 生菜 · 石榴 · 小番茄',
    description: '手撕鸡肉与鸡蛋让这一碗更丰盛，意面带来满足，石榴酸甜点亮每一口。',
    dressing: '柠檬香草油醋汁',
    details: '示例配方含鸡蛋与小麦（麸质）。鸡肉和意面搭配冷鲜时蔬，酱汁分装。',
    alt: '鸡肉、鸡蛋、石榴、生菜与意面搭配的丰盛沙拉碗',
    credit: {
      author: 'T. Bjornstad', title: 'Chicken salad with eggs', source: 'https://commons.wikimedia.org/wiki/File:Chicken_salad_with_eggs.jpg',
      license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
  {
    id: 'shrimp', name: '蒜香鲜虾沙拉', english: 'A LITTLE COASTAL CRUNCH', category: 'salad',
    price: 46, unit: '份', image: new URL('./assets/menu-shrimp.webp', import.meta.url).href, tone: 'peach',
    tag: '鲜香酥脆',
    ingredients: '虾仁 · 蒜香面包丁 · 黄瓜 · 番茄 · 红洋葱 · 罗勒',
    description: '鲜虾的弹嫩，搭配蒜香面包丁的酥脆。加一点清爽时蔬，吃出海岸边的好心情。',
    dressing: '柠檬蒜香汁',
    details: '示例配方含甲壳类、小麦（麸质）与乳制品；面包丁使用黄油烘烤。',
    alt: '鲜虾、蒜香面包丁、黄瓜、番茄与红洋葱沙拉',
    credit: {
      author: 'Jon Sullivan', title: 'Prawn salad with garlic croutons', source: 'https://commons.wikimedia.org/wiki/File:Prawn_salad_with_garlic_croutons.jpg',
      license: 'Public domain', licenseUrl: null,
    },
  },
  {
    id: 'orange', name: '阳光鲜榨橙汁', english: 'SIP SOME SUNSHINE', category: 'drink',
    price: 18, unit: '杯', image: new URL('./assets/juice.jpg', import.meta.url).href, tone: 'peach',
    tag: '给新鲜加一杯',
    ingredients: '鲜橙原汁 · 一口明亮的酸甜',
    galleryImage: new URL('./assets/juice-cutout.webp', import.meta.url).href,
    description: '给你的沙拉配一杯阳光。鲜橙原汁，保留水果本来的酸甜。',
    dressing: '300mL · 不额外添加糖',
    details: '示例规格 300mL，不额外添加糖。含水果本身的糖分；对柑橘类过敏者请留意。',
    alt: '一杯橙黄色鲜榨果汁，杯沿配有柑橘切片',
  },
];

export const categories = { all: '全部美味', salad: '招牌沙拉', bowl: '能量暖碗', drink: '鲜榨果饮' };
export const MAX_QUANTITY = 20;
export const STORAGE_KEY = 'super-salad:bag:v1';

export function normalizeBag(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(products.flatMap(({ id }) => {
    const quantity = value[id];
    return Number.isSafeInteger(quantity) && quantity > 0
      ? [[id, Math.min(quantity, MAX_QUANTITY)]] : [];
  }));
}

export function getBagTotals(bag) {
  return products.reduce((totals, product) => {
    const quantity = bag[product.id] || 0;
    return { count: totals.count + quantity, price: totals.price + product.price * quantity };
  }, { count: 0, price: 0 });
}
