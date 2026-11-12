/**
 * 书目数据：4 个分区 × 15 本 = 60 本天文学珍藏。
 *
 * 分区命名沿用参考架构图（First Editions / Art Books / Australiana / Poetry），
 * 内容按「天文学」主题填充。尺寸、书脊色、烫金色直接驱动：
 *   - layout.ts  的排布（厚薄不一、高矮错落）
 *   - textures.ts 的程序化书脊绘制
 * 想要接入真实资源时，给任意书目补上 lowResTextureUrl / highResTextureUrl 即可，
 * 其余逻辑（图集、流式加载、LRU）无需改动。
 */
import type { Book, Section, SectionId } from '../types';

export const SECTIONS: Section[] = [
  {
    id: 'first-editions',
    name: 'First Editions',
    nameZh: '天文典籍初版',
    hint: '1515—1698 · 从托勒密到惠更斯，日心说与经典天文学的奠基之作',
  },
  {
    id: 'art-books',
    name: 'Art Books',
    nameZh: '星图与图版',
    hint: '1247—1991 · 雕版星图、南天图录与天体图集',
  },
  {
    id: 'australiana',
    name: 'Australiana',
    nameZh: '南天星录',
    hint: '1847—2003 · 好望角与澳洲天文学家的南天观测',
  },
  {
    id: 'poetry',
    name: 'Poetry',
    nameZh: '星宇诗抄',
    hint: '战国—1921 · 中西诗人笔下的星空与月光',
  },
];

export const SECTION_IDS: SectionId[] = SECTIONS.map((s) => s.id);

/** 4 个分区 × 15 本。数组顺序 = 书架内的排列顺序 = 键盘导航顺序。 */
export const BOOKS: Book[] = [
  // ── First Editions · 天文典籍初版 ──────────────────────────────
  { id: 'fe-01', section: 'first-editions', title: '天文学大成', titleEn: 'Almagestum', author: '克劳狄乌斯·托勒密', year: '1515', dimensions: { width: 0.052, height: 0.3, depth: 0.17 }, spineColor: '#6e2f2c', giltColor: '#c9a24b', summary: '威尼斯阿尔丁印刷所刊行的拉丁文译本，古希腊天文学百科全书的首个印刷版本，地心宇宙体系的集大成者。' },
  { id: 'fe-02', section: 'first-editions', title: '天体运行论', titleEn: 'De revolutionibus orbium coelestium', author: '尼古拉·哥白尼', year: '1543', dimensions: { width: 0.062, height: 0.31, depth: 0.18 }, spineColor: '#5d4630', giltColor: '#c9a24b', summary: '日心说的奠基之作。据说哥白尼在临终当天才收到样书，从此太阳取代地球成为宇宙的中心。' },
  { id: 'fe-03', section: 'first-editions', title: '新星', titleEn: 'De nova stella', author: '第谷·布拉赫', year: '1573', dimensions: { width: 0.041, height: 0.29, depth: 0.16 }, spineColor: '#33503d', giltColor: '#c9a24b', summary: '对 1572 年仙后座超新星的观测报告，动摇了「天体永恒不变」的千年信条。' },
  { id: 'fe-04', section: 'first-editions', title: '宇宙的神秘', titleEn: 'Mysterium cosmographicum', author: '约翰内斯·开普勒', year: '1596', dimensions: { width: 0.038, height: 0.27, depth: 0.15 }, spineColor: '#2c3a52', giltColor: '#c9a24b', summary: '开普勒的出道之作：用五种正多面体嵌套解释行星轨道，神秘而执拗的宇宙几何学。' },
  { id: 'fe-05', section: 'first-editions', title: '星际信使', titleEn: 'Sidereus Nuncius', author: '伽利略·伽利莱', year: '1610', dimensions: { width: 0.035, height: 0.24, depth: 0.14 }, spineColor: '#6e2f2c', giltColor: '#c9a24b', summary: '望远镜观测的首部科学报告：木星的四颗卫星、月面山脉与银河的恒星本质。' },
  { id: 'fe-06', section: 'first-editions', title: '新天文学', titleEn: 'Astronomia Nova', author: '约翰内斯·开普勒', year: '1609', dimensions: { width: 0.058, height: 0.29, depth: 0.17 }, spineColor: '#4a2320', giltColor: '#c9a24b', summary: '行星运动第一、第二定律在此诞生，「天体物理学」取代「天体几何学」的起点。' },
  { id: 'fe-07', section: 'first-editions', title: '世界的和谐', titleEn: 'Harmonices Mundi', author: '约翰内斯·开普勒', year: '1619', dimensions: { width: 0.055, height: 0.28, depth: 0.16 }, spineColor: '#5d4630', giltColor: '#c9a24b', summary: '行星运动第三定律与「天体音乐」：轨道周期的平方与半长轴的立方成正比。' },
  { id: 'fe-08', section: 'first-editions', title: '试金者', titleEn: 'Il Saggiatore', author: '伽利略·伽利莱', year: '1623', dimensions: { width: 0.036, height: 0.26, depth: 0.15 }, spineColor: '#33503d', giltColor: '#c9a24b', summary: '关于彗星本质的论战檄文，也是伽利略阐述数学—实验科学方法论的名篇。' },
  { id: 'fe-09', section: 'first-editions', title: '两大世界体系对话', titleEn: 'Dialogo sopra i due massimi sistemi del mondo', author: '伽利略·伽利莱', year: '1632', dimensions: { width: 0.045, height: 0.29, depth: 0.17 }, spineColor: '#2c3a52', giltColor: '#c9a24b', summary: '托勒密与哥白尼两派的三日对话，通俗而锋利；也为伽利略招来了宗教审判。' },
  { id: 'fe-10', section: 'first-editions', title: '新天文学大成', titleEn: 'Almagestum Novum', author: '乔瓦尼·里乔利', year: '1651', dimensions: { width: 0.072, height: 0.36, depth: 0.21 }, spineColor: '#4a2320', giltColor: '#c9a24b', summary: '十七世纪最厚重的天文学综述，耶稣会天文学家的集大成之作，对开巨册。' },
  { id: 'fe-11', section: 'first-editions', title: '月面学', titleEn: 'Selenographia', author: '约翰内斯·赫维留', year: '1647', dimensions: { width: 0.068, height: 0.34, depth: 0.2 }, spineColor: '#6b4a2f', giltColor: '#c9a24b', summary: '第一幅系统的月面图集，赫维留用手绘铜版记录了月海的轮廓与「月面学」的命名。' },
  { id: 'fe-12', section: 'first-editions', title: '天体机械', titleEn: 'Machina Coelestis', author: '约翰内斯·赫维留', year: '1673', dimensions: { width: 0.05, height: 0.32, depth: 0.18 }, spineColor: '#5d4630', giltColor: '#c9a24b', summary: '望远镜瞄准与测量仪器的专著，观测技术史的重要文献。' },
  { id: 'fe-13', section: 'first-editions', title: '自然哲学的数学原理', titleEn: 'Philosophiæ Naturalis Principia Mathematica', author: '艾萨克·牛顿', year: '1687', dimensions: { width: 0.066, height: 0.33, depth: 0.19 }, spineColor: '#26364f', giltColor: '#c9a24b', summary: '万有引力与经典力学的奠基，用三条运动定律统一了天上与人间的运动规律。' },
  { id: 'fe-14', section: 'first-editions', title: '鲁道夫星表', titleEn: 'Tabulae Rudolphinae', author: '约翰内斯·开普勒', year: '1627', dimensions: { width: 0.06, height: 0.31, depth: 0.18 }, spineColor: '#33503d', giltColor: '#c9a24b', summary: '首部基于椭圆轨道的实用星表，精度远超以往，航海与历法的基石。' },
  { id: 'fe-15', section: 'first-editions', title: '宇宙论', titleEn: 'Cosmotheoros', author: '克里斯蒂安·惠更斯', year: '1698', dimensions: { width: 0.044, height: 0.27, depth: 0.16 }, spineColor: '#4a2320', giltColor: '#c9a24b', summary: '对行星世界与地外生命的思辨之作，十七世纪的「太空畅想」。' },

  // ── Art Books · 星图与图版 ────────────────────────────────────
  { id: 'ab-01', section: 'art-books', title: '测天图', titleEn: 'Uranometria', author: '约翰·拜耳', year: '1603', dimensions: { width: 0.07, height: 0.35, depth: 0.2 }, spineColor: '#3a4a52', giltColor: '#c9a24b', summary: '第一幅覆盖全天的雕版星图，拜耳命名法（α、β、γ…）的来源，科学与艺术的交点。' },
  { id: 'ab-02', section: 'art-books', title: '和谐大宇宙', titleEn: 'Harmonia Macrocosmica', author: '安德烈亚斯·塞拉里乌斯', year: '1660', dimensions: { width: 0.075, height: 0.37, depth: 0.22 }, spineColor: '#4a4030', giltColor: '#d4af6a', summary: '巴洛克天文学图集的巅峰：日心、地心模型并列，折叠图版美得令人屏息。' },
  { id: 'ab-03', section: 'art-books', title: '天空图集', titleEn: 'Atlas Coelestis', author: '约翰·塞勒', year: '1680', dimensions: { width: 0.058, height: 0.33, depth: 0.19 }, spineColor: '#2f3f46', giltColor: '#c9a24b', summary: '英国早期天文图集的代表，为航海与普及观测而绘。' },
  { id: 'ab-04', section: 'art-books', title: '弗拉姆斯蒂德天图', titleEn: 'Atlas Coelestis', author: '约翰·弗拉姆斯蒂德', year: '1729', dimensions: { width: 0.08, height: 0.38, depth: 0.23 }, spineColor: '#3a4a52', giltColor: '#c9a24b', summary: '格林尼治首任皇家天文学家的遗作，巨幅铜版星图，精度冠绝十八世纪初。' },
  { id: 'ab-05', section: 'art-books', title: '科佩尔尼克天图', titleEn: 'Atlas Coelestis', author: '约翰·多普尔迈尔', year: '1742', dimensions: { width: 0.062, height: 0.34, depth: 0.2 }, spineColor: '#565038', giltColor: '#c9a24b', summary: '纽伦堡的天文学家与插图家合作的星图，图文俱佳，德式严谨与巴洛克趣味并存。' },
  { id: 'ab-06', section: 'art-books', title: '南天星志', titleEn: 'Coelum Australe Stelliferum', author: '尼古拉·路易·德·拉卡伊', year: '1763', dimensions: { width: 0.066, height: 0.36, depth: 0.21 }, spineColor: '#2f3f46', giltColor: '#c9a24b', summary: '好望角四年观测的结晶：南天 4000 颗恒星与 14 个新星座的命名。' },
  { id: 'ab-07', section: 'art-books', title: '波得星图', titleEn: 'Uranographia', author: '约翰·埃勒特·波得', year: '1801', dimensions: { width: 0.07, height: 0.35, depth: 0.21 }, spineColor: '#4a4030', giltColor: '#d4af6a', summary: '收录 17000 颗恒星、100 个星座的巨幅星图，古典星图黄金时代的谢幕之作。' },
  { id: 'ab-08', section: 'art-books', title: '苏州石刻天文图', titleEn: 'Suzhou Stone Star Map', author: '南宋 · 礼制局', year: '1247', dimensions: { width: 0.05, height: 0.31, depth: 0.18 }, spineColor: '#3f4436', giltColor: '#c9a24b', summary: '现存最著名的中国古代全天石刻星图，1440 颗星，比欧洲同时期星图更为精密。' },
  { id: 'ab-09', section: 'art-books', title: '天体图集', titleEn: 'A Celestial Atlas', author: '亚历山大·贾米森', year: '1822', dimensions: { width: 0.052, height: 0.32, depth: 0.18 }, spineColor: '#3a4a52', giltColor: '#c9a24b', summary: '十九世纪英国家庭书桌上的流行星图，把皇家天文学家的精度带进客厅。' },
  { id: 'ab-10', section: 'art-books', title: '新测天图', titleEn: 'Uranometria Nova', author: '弗里德里希·阿格兰德', year: '1843', dimensions: { width: 0.064, height: 0.34, depth: 0.2 }, spineColor: '#565038', giltColor: '#c9a24b', summary: '波恩巡天的前奏，系统性测量恒星位置与亮度的开端。' },
  { id: 'ab-11', section: 'art-books', title: '星图与望远镜手册', titleEn: 'Star Atlas and Telescopic Handbook', author: '亚瑟·诺顿', year: '1910', dimensions: { width: 0.048, height: 0.28, depth: 0.17 }, spineColor: '#2f3f46', giltColor: '#c9a24b', summary: '业余天文学者的圣经，「诺顿星图」至今仍是最著名的入门星图之一。' },
  { id: 'ab-12', section: 'art-books', title: '全天星图', titleEn: 'Atlas of the Heavens', author: '安东宁·贝奇瓦尔', year: '1948', dimensions: { width: 0.05, height: 0.3, depth: 0.18 }, spineColor: '#4a4030', giltColor: '#c9a24b', summary: '布拉格出版的经典星图，手工绘制的柔和星点至今被望远镜爱好者珍藏。' },
  { id: 'ab-13', section: 'art-books', title: '帕洛玛巡天图集', titleEn: 'The Palomar Observatory Sky Survey', author: '帕洛玛天文台', year: '1950', dimensions: { width: 0.058, height: 0.33, depth: 0.19 }, spineColor: '#3a4a52', giltColor: '#c9a24b', summary: '照相底片巡天的里程碑，第一次把整个北天完整留影在一套图集里。' },
  { id: 'ab-14', section: 'art-books', title: '剑桥星图', titleEn: 'The Cambridge Star Atlas', author: '威尔·特里翁', year: '1991', dimensions: { width: 0.046, height: 0.29, depth: 0.17 }, spineColor: '#565038', giltColor: '#c9a24b', summary: '当代最通行的入门星图，用极简等距投影把全天摊平在手掌之间。' },
  { id: 'ab-15', section: 'art-books', title: '中西对照恒星图表', titleEn: 'Sino-Western Star Catalogue and Charts', author: '伊世同', year: '1981', dimensions: { width: 0.054, height: 0.32, depth: 0.19 }, spineColor: '#2f3f46', giltColor: '#c9a24b', summary: '中国星官体系与西方星座的对照总表，两种星空语言之间的翻译词典。' },

  // ── Australiana · 南天星录 ────────────────────────────────────
  { id: 'au-01', section: 'australiana', title: '好望角观测成果', titleEn: 'Results of Astronomical Observations at the Cape of Good Hope', author: '约翰·赫歇尔', year: '1847', dimensions: { width: 0.075, height: 0.37, depth: 0.22 }, spineColor: '#8a6a42', giltColor: '#e0bd6e', summary: '在南非开普敦的四年巡天：南天双星、星云与星团目录，子承父业的观测史诗。' },
  { id: 'au-02', section: 'australiana', title: '南天测光星图', titleEn: 'Uranometria Argentina', author: '本杰明·古尔德', year: '1879', dimensions: { width: 0.07, height: 0.36, depth: 0.21 }, spineColor: '#7a5230', giltColor: '#c9a24b', summary: '阿根廷科尔多瓦天文台的南天测光与星图，把南天的亮度秩序一次说清。' },
  { id: 'au-03', section: 'australiana', title: '温莎天文台回忆录', titleEn: 'Astronomical Memoirs', author: '约翰·特巴特', year: '1863', dimensions: { width: 0.045, height: 0.27, depth: 0.16 }, spineColor: '#93754a', giltColor: '#c9a24b', summary: '澳洲第一位本土天文学家的私人天文台札记，新南威尔士乡野里的双星与彗星。' },
  { id: 'au-04', section: 'australiana', title: '墨尔本天文台观测', titleEn: 'Melbourne Observations', author: '罗伯特·埃勒里', year: '1869', dimensions: { width: 0.04, height: 0.26, depth: 0.15 }, spineColor: '#8a6a42', giltColor: '#c9a24b', summary: '南半球早期政府天文台的例行观测报告，殖民地的星空也被逐颗编号。' },
  { id: 'au-05', section: 'australiana', title: '科尔多瓦巡天', titleEn: 'Cordoba Durchmusterung', author: '约翰·马丁·托梅', year: '1892', dimensions: { width: 0.06, height: 0.32, depth: 0.19 }, spineColor: '#6b4f35', giltColor: '#c9a24b', summary: '南天 -22° 至 -90° 的照相巡天，数百万颗恒星的位置与亮度总账。' },
  { id: 'au-06', section: 'australiana', title: '好望角摄影巡天', titleEn: 'Cape Photographic Durchmusterung', author: '大卫·吉尔', year: '1896', dimensions: { width: 0.065, height: 0.34, depth: 0.2 }, spineColor: '#7a5230', giltColor: '#e0bd6e', summary: '用照相机代替眼睛与钟表完成的天体测量革命，南天巡天的现代起点。' },
  { id: 'au-07', section: 'australiana', title: '南天双星表', titleEn: 'Southern Double Stars', author: '罗伯特·索恩斯·艾恩斯', year: '1899', dimensions: { width: 0.042, height: 0.27, depth: 0.16 }, spineColor: '#93754a', giltColor: '#c9a24b', summary: '南天双星的系统测量，日后南非联合天文台创始人的早期工作。' },
  { id: 'au-08', section: 'australiana', title: '阿德莱德天文台报告', titleEn: 'Adelaide Observatory Reports', author: '查尔斯·托德', year: '1865', dimensions: { width: 0.038, height: 0.25, depth: 0.15 }, spineColor: '#8a6a42', giltColor: '#c9a24b', summary: '南澳洲天文台的年度观测与时间发播报告，电报时代的星空时刻表。' },
  { id: 'au-09', section: 'australiana', title: '麦哲伦云', titleEn: 'The Magellanic Clouds', author: '佩雷格林·霍奇', year: '1981', dimensions: { width: 0.05, height: 0.29, depth: 0.17 }, spineColor: '#6b4f35', giltColor: '#c9a24b', summary: '离银河最近的两个伴星系专著，南天夜空中两团朦胧云气的现代解剖。' },
  { id: 'au-10', section: 'australiana', title: '麦哲伦云', titleEn: 'The Magellanic Clouds', author: '本特·韦斯特伦德', year: '1997', dimensions: { width: 0.055, height: 0.31, depth: 0.18 }, spineColor: '#7a5230', giltColor: '#c9a24b', summary: '斯德哥尔摩学派的大麦哲伦云研究综述，恒星形成史的天然实验室。' },
  { id: 'au-11', section: 'australiana', title: '暗色火花', titleEn: 'Dark Sparklers', author: '休·凯恩斯', year: '2003', dimensions: { width: 0.048, height: 0.28, depth: 0.17 }, spineColor: '#93754a', giltColor: '#c9a24b', summary: '澳洲原住民天文与流星传统的整理研究，被殖民之前的南天叙事。' },
  { id: 'au-12', section: 'australiana', title: '欧南台南天巡天图集', titleEn: 'ESO/SERC Southern Sky Survey Atlas', author: '欧洲南方天文台', year: '1982', dimensions: { width: 0.06, height: 0.33, depth: 0.19 }, spineColor: '#8a6a42', giltColor: '#e0bd6e', summary: '南天照相巡天的玻璃底片图集，ESO 大视场巡天的公开遗产。' },
  { id: 'au-13', section: 'australiana', title: '英澳台南天图集', titleEn: 'UK Schmidt Southern Sky Survey Atlas', author: '英澳天文台', year: '1993', dimensions: { width: 0.058, height: 0.32, depth: 0.19 }, spineColor: '#6b4f35', giltColor: '#c9a24b', summary: '赛丁泉天文台施密特望远镜的南天图集，红敏底片揭示银河系心脏。' },
  { id: 'au-14', section: 'australiana', title: '南天异星志', titleEn: 'Observations of Southern Novae', author: '悉尼天文台', year: '1892', dimensions: { width: 0.044, height: 0.28, depth: 0.17 }, spineColor: '#7a5230', giltColor: '#c9a24b', summary: '十九世纪末南天新星的目视与照相记录，爆发恒星的第一手档案。' },
  { id: 'au-15', section: 'australiana', title: '极南星表', titleEn: 'Extreme Southern Star Catalogue', author: '墨尔本天文台', year: '1901', dimensions: { width: 0.046, height: 0.29, depth: 0.17 }, spineColor: '#93754a', giltColor: '#c9a24b', summary: '南天极区恒星的精测星表，为后来的南极点天文观测铺路。' },

  // ── Poetry · 星宇诗抄 ─────────────────────────────────────────
  { id: 'po-01', section: 'poetry', title: '天问', titleEn: 'Tian Wen · Questions to Heaven', author: '屈原', year: '约前 4 世纪', dimensions: { width: 0.03, height: 0.22, depth: 0.14 }, spineColor: '#4a2c3c', giltColor: '#c9a24b', summary: '一口气问遍天地圆方、日月星辰的楚辞奇篇，中国最早的天问式宇宙追问。' },
  { id: 'po-02', section: 'poetry', title: '观沧海', titleEn: 'Viewing the Blue Sea', author: '曹操', year: '207', dimensions: { width: 0.028, height: 0.21, depth: 0.13 }, spineColor: '#5a3540', giltColor: '#c9a24b', summary: '「日月之行，若出其中；星汉灿烂，若出其里」——建安十二年的碣石海夜。' },
  { id: 'po-03', section: 'poetry', title: '春江花月夜', titleEn: 'A Moonlit Night on the Spring River', author: '张若虚', year: '唐', dimensions: { width: 0.032, height: 0.24, depth: 0.14 }, spineColor: '#4a2c3c', giltColor: '#d4af6a', summary: '「江天一色无纤尘，皎皎空中孤月轮」，以孤月照尽人生离别的盛唐绝唱。' },
  { id: 'po-04', section: 'poetry', title: '夜宿山寺', titleEn: 'Night Stay at a Mountain Temple', author: '李白', year: '唐', dimensions: { width: 0.026, height: 0.2, depth: 0.12 }, spineColor: '#6b3a44', giltColor: '#c9a24b', summary: '「危楼高百尺，手可摘星辰。不敢高声语，恐惊天上人。」二十字的星空童话。' },
  { id: 'po-05', section: 'poetry', title: '阁夜', titleEn: 'Night in the Loft', author: '杜甫', year: '766', dimensions: { width: 0.03, height: 0.23, depth: 0.14 }, spineColor: '#3d2b3a', giltColor: '#c9a24b', summary: '「五更鼓角声悲壮，三峡星河影动摇」，战乱夜空里的银河倒影。' },
  { id: 'po-06', section: 'poetry', title: '水调歌头', titleEn: 'Prelude to Water Melody', author: '苏轼', year: '1076', dimensions: { width: 0.034, height: 0.25, depth: 0.15 }, spineColor: '#4a2c3c', giltColor: '#d4af6a', summary: '「明月几时有？把酒问青天」，中秋词的绝唱，中国人共同的月亮记忆。' },
  { id: 'po-07', section: 'poetry', title: '浣溪沙', titleEn: 'Huanchasha', author: '纳兰性德', year: '清', dimensions: { width: 0.028, height: 0.21, depth: 0.13 }, spineColor: '#5a3540', giltColor: '#c9a24b', summary: '「辛苦最怜天上月，一昔如环，昔昔都成玦」，以月之圆缺写尽人间聚散。' },
  { id: 'po-08', section: 'poetry', title: '失乐园', titleEn: 'Paradise Lost', author: '约翰·弥尔顿', year: '1667', dimensions: { width: 0.055, height: 0.31, depth: 0.18 }, spineColor: '#4a2c3c', giltColor: '#c9a24b', summary: '英语文学中最宏大的宇宙漫游，天界地理学与撒旦陨落的史诗。' },
  { id: 'po-09', section: 'poetry', title: '星光之夜', titleEn: 'The Starlight Night', author: '杰拉尔德·曼利·霍普金斯', year: '1881', dimensions: { width: 0.033, height: 0.24, depth: 0.14 }, spineColor: '#5a3540', giltColor: '#d4af6a', summary: '「看啊，闪烁的冬夜星空！」跳荡的节奏把整片银河写成了焰火。' },
  { id: 'po-10', section: 'poetry', title: '博学的天文学家', titleEn: 'When I Heard the Learn’d Astronomer', author: '沃尔特·惠特曼', year: '1865', dimensions: { width: 0.031, height: 0.23, depth: 0.14 }, spineColor: '#4a2c3c', giltColor: '#c9a24b', summary: '听腻了图表与演说，诗人溜出门去，直接在夜里仰望那一片神秘的星。' },
  { id: 'po-11', section: 'poetry', title: '啊，月亮与星星', titleEn: 'Ah Moon — and Star!', author: '艾米莉·狄金森', year: '19 世纪', dimensions: { width: 0.027, height: 0.21, depth: 0.13 }, spineColor: '#3d2b3a', giltColor: '#c9a24b', summary: '「是你把宇宙的钥匙遗失，还是它本就在你手中？」小而亮的星象之谜。' },
  { id: 'po-12', section: 'poetry', title: '升腾', titleEn: 'Élévation', author: '夏尔·波德莱尔', year: '1857', dimensions: { width: 0.03, height: 0.23, depth: 0.14 }, spineColor: '#6b3a44', giltColor: '#d4af6a', summary: '「飞越湖泊与山谷，越过一切」，在精神上空采摘星辰的法语名篇。' },
  { id: 'po-13', section: 'poetry', title: '星辰之光', titleEn: 'The Light of Stars', author: '亨利·朗费罗', year: '1838', dimensions: { width: 0.032, height: 0.24, depth: 0.14 }, spineColor: '#5a3540', giltColor: '#c9a24b', summary: '「星光穿过静静的夜，把灵魂领向上帝的居所」，新英格兰的静谧夜空。' },
  { id: 'po-14', section: 'poetry', title: '敕勒歌', titleEn: 'The Chile Song', author: '北朝民歌', year: '约 5—6 世纪', dimensions: { width: 0.026, height: 0.2, depth: 0.12 }, spineColor: '#4a2c3c', giltColor: '#c9a24b', summary: '「天似穹庐，笼盖四野」，游牧民族眼里最古老也最准确的天球形状。' },
  { id: 'po-15', section: 'poetry', title: '天上的街市', titleEn: 'The Street Market in the Sky', author: '郭沫若', year: '1921', dimensions: { width: 0.033, height: 0.25, depth: 0.15 }, spineColor: '#3d2b3a', giltColor: '#c9a24b', summary: '「我想那缥缈的空中，定然有美丽的街市」，五四诗人笔下的星河市集。' },
];

/** 按分区聚合，保持书架顺序 */
export function booksBySection(): Map<SectionId, Book[]> {
  const map = new Map<SectionId, Book[]>();
  for (const book of BOOKS) {
    const arr = map.get(book.section) ?? [];
    arr.push(book);
    map.set(book.section, arr);
  }
  return map;
}
