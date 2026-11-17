import { assetURL } from './asset-url.js';

export const stories = [
  {
    id: 'painting', label: '1899 · 作画时刻', eyebrow: 'GIVERNY, SUMMER 1899',
    title: '在光线改变之前。', subtitle: 'The garden becomes a painting',
    image: assetURL('monet-1899.webp'), imageAlt: '纳达尔拍摄的莫奈肖像，1899年，留着长胡须的画家直视镜头。',
    caption: '克劳德·莫奈 · 纳达尔摄 · 1899', imageClass: 'portrait',
    paragraphs: [
      '1899 年的夏天，莫奈 58 岁。他眼前的水上花园，已经是自己经营多年的作品：池塘、植物与木桥，都是画家为日常观看而安排的风景。',
      '据 The Met 介绍，他在这一年开始描绘池上木桥的十八个视图，其中十二幅完成于夏天。这幅《睡莲池上的桥》以少见的竖幅构图，让桥下的睡莲与倒影格外醒目。',
      '他并非只画一个地方，而是反复观察同一处风景如何随光线变化。户外的观看与画室里的修改，共同构成了他的创作过程。',
    ],
    facts: [['1893','营造水上花园'],['1899','木桥系列的夏天'],['92.7 × 73.7 cm','这幅画的尺寸']],
    links: [
      ['The Met · 作品介绍','https://www.metmuseum.org/art/collection/search/437127'],
      ['The Met · 莫奈的创作','https://www.metmuseum.org/essays/claude-monet-1840-1926'],
    ],
    note: '此处的作画场景为艺术化拼接。人物姿态取材于萨金特1885年的莫奈作画像；不是对1899年某次作画现场的复原。',
  },
  {
    id: 'later-life', label: '晚年 · 与花园相伴', eyebrow: 'A LIFE IN GIVERNY · 1883–1926',
    title: '把余生，交给一座花园。', subtitle: 'The years beside the water',
    image: assetURL('garden-water.webp'), imageAlt: '莫奈画中的睡莲和层层叠叠的池水笔触。',
    caption: '水与睡莲 · 图为1899年作品局部', imageClass: 'water-detail',
    paragraphs: [
      '莫奈从 1883 年起居住在吉维尼，直到 1926 年去世，共度过了 43 年。到了 1910—1920 年代，他的创作几乎全部围绕着自家的睡莲池展开。花园既是生活的所在，也是他持续探索绘画的地方。',
      '晚年也有沉重的失去：妻子爱丽丝于 1911 年去世，长子让于 1914 年去世。他在 1912 年被诊断出白内障，并于 1923 年接受手术；视力问题使创作更为艰难，他仍持续投入睡莲主题。',
      '那些越来越宽阔的画布，把水面变成包围观者的世界。1922 年，他签署将《睡莲》大型装饰画捐赠法国的契约。作品在他去世后，于 1927 年在巴黎橘园美术馆正式展出。',
    ],
    facts: [['43 年','在吉维尼生活'],['1922','签署《睡莲》捐赠契约'],['1927','橘园《睡莲》展厅开放']],
    links: [
      ['莫奈故居 · 官方年表','https://claudemonetgiverny.fr/en/decouvrir/timeline/'],
      ['The Met · 莫奈晚年的绘画','https://www.metmuseum.org/essays/claude-monet-1840-1926'],
    ],
    note: '这里讲述的是1899年之后的晚年生活；《睡莲池上的桥》与橘园的大型《睡莲》组画属于不同阶段。',
  },
  {
    id: 'japan', label: '日本桥 · 浮世绘', eyebrow: 'JAPONISME · AN IMAGINED JAPAN',
    title: '一座桥，连接两种观看。', subtitle: 'Japan, imagined in Giverny',
    image: assetURL('monet-garden.webp'), imageAlt: '莫奈画中的绿色日式拱桥，横跨睡莲池。',
    caption: '莫奈选择的绿色 · 《睡莲池上的桥》局部', imageClass: 'bridge-detail',
    paragraphs: [
      '莫奈喜爱并收藏日本浮世绘版画。今天，在吉维尼故居明黄色的餐厅墙上，仍能看到他的日本版画收藏。日本艺术走进了他的日常，也改变了他组织画面的方式。',
      '莫奈故居的官方介绍将这座日本桥的灵感与他收藏的版画联系起来。桥被安排在花园主路的轴线上，他特别选择了绿色，使它与日本传统桥梁常见的红色形成区别。竹、枫树与垂柳一起，构成了他想象中的水上花园。',
      '浮世绘带来的影响不止是“画一座日本桥”。The Met 指出，日本木版画启发了莫奈的不对称构图与对平面色彩的强调。桥、睡莲和倒影，最终被他转化成属于自己的绘画语言。',
    ],
    facts: [['版画收藏','日本艺术进入日常'],['绿色拱桥','画家的个人选择'],['不对称构图','另一种观看风景的方式']],
    links: [
      ['莫奈故居 · 水上花园与日本桥','https://claudemonetgiverny.fr/en/decouvrir/water-lily-pond/'],
      ['The Met · 日本主义','https://www.metmuseum.org/essays/japonisme'],
      ['莫奈故居 · 日本版画收藏','https://claudemonetgiverny.fr/en/decouvrir/claude-monets-house/'],
    ],
    note: '资料支持日本版画与桥及绘画语言的联系；这里没有将桥认定为某一幅浮世绘的逐一复制。',
  },
];
