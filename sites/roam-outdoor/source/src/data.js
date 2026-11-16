const asset = name => `./assets/${name}.webp?v=2`;

export const categories = [
  { id: 'store', label: '展厅', en: 'THE STORE', icon: 'grid', number: '00' },
  { id: 'clothing', label: '服装', en: 'APPAREL', icon: 'shirt', number: '01' },
  { id: 'caps', label: '帽饰', en: 'HEADWEAR', icon: 'compass', number: '02' },
  { id: 'packs', label: '背包', en: 'BACKPACKS', icon: 'backpack', number: '03' },
  { id: 'shoes', label: '徒步鞋', en: 'FOOTWEAR', icon: 'footprints', number: '04' },
];

const apparel = [
  { id: 'a01', name: '云径轻量防风衣', en: 'CLOUD WIND SHELL', price: 680, image: 'shell-white', tone: 'cloud', color: '白色', weight: '120g', feature: '轻量防风', icon: 'wind', tag: 'LIGHT & FREE' },
  { id: 'a02', name: '天际全天候冲锋衣', en: 'SKYLINE RAIN SHELL', price: 1280, image: 'shell-blue', tone: 'sky', color: '天蓝', weight: '240g', feature: '全天候防护', icon: 'rain', tag: 'ALL WEATHER' },
  { id: 'a03', name: '岩间摇粒绒夹克', en: 'RIDGE FLEECE', price: 780, image: 'fleece', tone: 'cloud', color: '岩灰', weight: '310g', feature: '柔软保温', icon: 'feather', tag: 'TRAIL LAYER' },
  { id: 'a04', name: '山脊 3L 冲锋衣', en: 'RIDGELINE 3L SHELL', price: 1680, image: 'shell-pink', tone: 'pink', color: '热粉', weight: '320g', feature: '三层防水', icon: 'rain', tag: 'THE SIGNATURE' },
  { id: 'a05', name: '远山轻量羽绒服', en: 'SUMMIT DOWN JACKET', price: 1480, image: 'puffer', tone: 'ink', color: '深岩蓝', weight: '360g', feature: '轻量保温', icon: 'feather', tag: 'HIGHER GROUND' },
  { id: 'a06', name: '越野轻壳冲锋衣', en: 'TRAVERSE LIGHT SHELL', price: 980, image: 'shell-blue', tone: 'sky', color: '天蓝', weight: '210g', feature: '透气防护', icon: 'wind', tag: 'KEEP MOVING' },
  { id: 'a07', name: '晨雾防风外套', en: 'MIST WIND JACKET', price: 580, image: 'shell-white', tone: 'cloud', color: '白色', weight: '105g', feature: '收纳便携', icon: 'feather', tag: 'PACK LIGHT' },
].map(p => ({ ...p, category: 'clothing', sizes: ['S', 'M', 'L', 'XL'], description: '为山野里的每一种天气留好余地。轻量面料与顺应身体的剪裁，让上坡、穿林和停下看风景，都自在一点。' }));

const colors = [
  { tone: 'sky', color: '天蓝', image: 'cap-blue' },
  { tone: 'pink', color: '热粉', image: 'cap-pink' },
  { tone: 'cloud', color: '白色', image: 'cap-white' },
];
const caps = Array.from({ length: 9 }, (_, i) => ({
  id: `c0${i+1}`, category: 'caps', name: ['山行五片帽', '远足轻量帽', '径野运动帽'][Math.floor(i/3)], en: ['TRAIL FIVE PANEL', 'ROAM LIGHT CAP', 'FIELD DAY CAP'][Math.floor(i/3)], price: [228, 198, 258][Math.floor(i/3)], ...colors[i%3], sizes: ['均码'], weight: '65g', feature: '透气速干', icon: 'wind', tag: 'TAKE THE LONG WAY', description: '从日出的第一段上坡，到林间的最后一束光。轻盈透气的五片式帽身，可调节后扣，陪你走得更远。'
}));
const packs = Array.from({ length: 6 }, (_, i) => ({
  id: `b0${i+1}`, category: 'packs', name: ['漫游 28L 徒步背包', '远径 35L 旅行背包'][Math.floor(i/3)], en: ['ROAM 28L DAYPACK', 'TRAVERSE 35L PACK'][Math.floor(i/3)], price: [880, 1180][Math.floor(i/3)], image: i%3 === 1 ? 'pack-pink' : 'pack-blue', tone: ['sky', 'pink', 'cloud'][i%3], color: ['天蓝', '热粉', '岩灰'][i%3], filter: i%3 === 2 ? 'tone-neutral' : '', sizes: [i < 3 ? '28L' : '35L'], weight: i < 3 ? '820g' : '980g', feature: '分区收纳', icon: 'backpack', tag: 'CARRY LESS. GO FURTHER.', description: '带上需要的，把多余的留在身后。清晰的收纳分区、贴合背部的背负结构，装得下一个周末，也装得下说走就走。'
}));
const shoes = Array.from({ length: 6 }, (_, i) => ({
  id: `s0${i+1}`, category: 'shoes', name: i%2 ? '岩途防水徒步靴' : '山径轻量徒步鞋', en: i%2 ? 'RIDGE WATERPROOF BOOT' : 'TRAIL WALKER', price: i%2 ? 1180 : 980, image: i%2 ? 'boot-brown' : 'boot-blue', tone: i%3 === 2 ? 'cloud' : i%2 ? 'ink' : 'sky', color: i%3 === 2 ? '石灰' : i%2 ? '岩棕' : '山岩蓝', filter: i%3 === 2 ? 'tone-neutral' : '', sizes: ['38','39','40','41','42','43','44'], weight: '385g', feature: '山地抓地', icon: 'footprints', tag: 'FIND YOUR FOOTING', description: '脚下有把握，才有心情看远方。宽适鞋头与灵活鞋底，照顾山间的碎石路，也陪你走过回家的街角。'
}));

export const products = [...apparel, ...caps, ...packs, ...shoes].map(p => ({ ...p, src: asset(p.image) }));
export const byCategory = id => products.filter(p => p.category === id);
export const money = value => `¥${value.toLocaleString('zh-CN')}`;

export function variantsFor(product) {
  if (product.category === 'clothing' && product.image.startsWith('shell')) {
    return [
      { label: '天蓝', tone: 'sky', src: asset('shell-blue'), filter: '' },
      { label: '热粉', tone: 'pink', src: asset('shell-pink'), filter: '' },
      { label: '白色', tone: 'cloud', src: asset('shell-white'), filter: '' },
    ];
  }
  return [{ label: product.color, tone: product.tone, src: product.src, filter: product.filter || '' }];
}
