/**
 * 珍稀古籍 3D 虚拟书架 —— 核心数据结构定义
 *
 * 数据是整个 3D 体验的唯一真源（single source of truth）：
 * - 布局算法（src/lib/layout.ts）依据 dimensions 把书排进 4 个分区；
 * - 纹理管理器（src/lib/textures.ts）依据 spineColor / giltColor 程序化绘制书脊；
 * - InstancedMesh 依据数据数组批量写入变换矩阵；
 * - 2D 模态框直接渲染同一条数据。
 */

/** 四个分区（与参考架构图中的 UI 标签一一对应） */
export type SectionId = 'first-editions' | 'art-books' | 'australiana' | 'poetry';

/** 一本书的三个维度（米）。书架按 1 单位 = 1 米 搭建。 */
export interface BookDimensions {
  /** 书脊宽度（X 轴）—— 决定厚薄，0.02 ~ 0.08m */
  width: number;
  /** 书高（Y 轴）—— 0.17 ~ 0.38m */
  height: number;
  /** 书页厚度（Z 轴，书脊到书口的方向）—— 0.12 ~ 0.23m */
  depth: number;
}

/** 一本书的完整数据。新增/修改书目只需改 src/data/books.ts，其余全部自动适配。 */
export interface Book {
  /** 唯一 id，同时作为 React 状态（activeBookId / hoveredBookId）的同步键 */
  id: string;
  /** 所属分区 */
  section: SectionId;
  /** 中文主标题（书脊竖排烫金用） */
  title: string;
  /** 原文标题 */
  titleEn: string;
  /** 作者 / 编纂者 */
  author: string;
  /** 出版 / 抄录年份 */
  year: string;
  /** 三维尺寸 */
  dimensions: BookDimensions;
  /** 书脊皮革基色（低分辨率图集程序化绘制用） */
  spineColor: string;
  /** 烫金装饰色 */
  giltColor: string;
  /**
   * 低分辨率书脊纹理 URL（可选）。
   * 缺省时由纹理管理器程序化绘制（Canvas）——保证零外部资源也能运行。
   * 传入真实 URL 时，图集会改为加载该图片。
   */
  lowResTextureUrl?: string;
  /**
   * 高分辨率封面 / 书脊纹理 URL（可选）。
   * 仅在书本被点击激活时异步加载（High-Res Rescan on Select），
   * 加载完成后交叉淡入替换低分辨率纹理；缺省时程序化绘制高分辨率书脊。
   */
  highResTextureUrl?: string;
  /** 2D 详情模态框简介 */
  summary: string;
}

/** 分区元数据（标签页 / 图例 / 读屏播报） */
export interface Section {
  id: SectionId;
  /** 标签英文名（与参考架构图一致） */
  name: string;
  /** 中文副标题 */
  nameZh: string;
  /** 分区说明 */
  hint: string;
}

/** 布局算法为每本书算出的「静止位姿」（世界坐标） */
export interface BookPlacement {
  book: Book;
  /** 全局书架顺序下标（60 本连续编号，键盘导航顺序） */
  index: number;
  /** 所在分区内的局部下标（InstancedMesh 的 instanceId） */
  sectionIndex: number;
  section: SectionId;
  position: [number, number, number];
  /** 欧拉角（含轻微倾斜，营造错落感） */
  rotation: [number, number, number];
  /** 是否平放（躺倒在书桌上） */
  flat: boolean;
}
