# CAIS — Porto Rocha 形式语言工作室作品集

复刻 [portorocha.com](https://www.portorocha.com/) 设计语言的工作室作品集模板：白底画布、`#007aff` 单一强调色、sf-pro 紧凑排版（14px / 23px 双档）、40px 大圆角按钮与 8–10px 卡片圆角。左侧固定栏承载品牌字标、纽约/伦敦双城实时时钟、About 卡与项目索引；右侧滚动区为 Hero 大图加三列瀑布流新闻卡。纯静态、零依赖、零构建。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/cais/>。本模板不使用 ES Modules，`file://` 直接打开亦可，但仍推荐通过 HTTP 访问。

## 文件结构

```text
cais/
├── index.html
├── assets/
│   ├── tokens.css        # 设计令牌：色彩/字体/间距/圆角/动效/布局，含暗色主题反相
│   ├── studio.css        # 布局、组件、覆盖层、响应式与 reduced-motion
│   ├── studio.js         # 双城时钟、主题开关、覆盖层、滚动进场
│   ├── fonts/
│   │   └── inter-var.woff2   # Inter（SIL OFL），非 Apple 平台上 sf-pro 的最近替代
│   └── img/              # 照片（Picsum/Lorem Picsum 开源照片）与手绘 SVG 缩略标记
├── preview/              # Studio 上架素材，不是网站运行依赖
│   ├── cover.png         # 默认封面与视频加载失败回退
│   └── video.mp4         # hover、选中后输入框和详情预览的录制视频
└── README.md
```

## 设计令牌（复刻自 portorocha.com 的计算样式）

| 类别 | 值 |
| --- | --- |
| 背景 / 卡片 | `#ffffff` / `#f5f5f5` |
| 文字 / 次要文字 | `#000000` / `#666666`（白底 5.7:1） |
| 强调色 | `#007aff`（唯一 accent，CTA、链接、hover、focus 环） |
| 字体 | `sf-pro-text`（正文 14px/17.5px）与 `sf-pro-display`（卡片标题 23px/27px，字距 0.45px）；Apple 平台走系统字体，其余平台回落到自托管 Inter |
| 间距 | 16px 基数（4/8/12/16/24/32/48/64） |
| 圆角 | 按钮 40px、卡片 8px、About/项目行 10px、图片 4px、缩略图 8px |
| 侧栏 | 386px（≥1280px 固定，右侧滚动；<1024px 堆叠为单列） |

## 功能与使用边界

- **双城时钟**：纽约 ⇄ 伦敦每 6 秒轮换，`Intl.DateTimeFormat` 实时走秒，轮换带一次淡入；`prefers-reduced-motion` 下停止轮换动画。
- **暗色模式**：右上角开关切换同一套令牌的反相（`#0c0c0c` 底、6% 白卡片、`#a8a8a8` 次要文字，深底 7.4:1），选择记入 `localStorage`，刷新保持。
- **项目索引**：8 个项目行（5 张照片缩略图 + 3 个手绘 SVG 标记），点击打开项目详情覆盖层（大图、年份、服务清单、正文），`Esc` / 点击遮罩 / Close 关闭，焦点归还触发元素。
- **Show all projects**：全屏覆盖层以网格复用同一批项目行（DOM 克隆，不双份维护）。
- **新闻流**：三列 CSS 瀑布流（ Tablet 2 列、手机 1 列），进入视口时错峰淡入一次。
- **响应式**：<1024px 侧栏转为静态通栏、项目索引变网格；<720px 单列、Hero 改 4:3。
- **边界**：所有文案与项目均为**虚构示例内容**（工作室、客户、新闻、日期均非真实）；照片来自 [Lorem Picsum](https://picsum.photos)（Unsplash 开源照片），Inter 字体为 SIL OFL 开源许可；无任何网络请求、无构建、无外部依赖。

## Studio 模板预览素材

本模板遵循[仓库统一的预览素材约束](../../README.md#gallery-preview-assets)，保存两个独立文件：

- [preview/cover.png](./preview/cover.png)：1280 × 800 全彩 PNG（约 0.97 MiB），与录制视频同画幅比例，内容为桌面首屏（侧栏 + Hero + 新闻流首排）。
- [preview/video.mp4](./preview/video.mp4)：1280 × 800、30 fps、约 19.3 秒、约 2.8 MiB、H.264、无音轨、`moov` 前置（faststart）。录制内容：首屏停留 → 滚动浏览新闻流 → 回到顶部 → hover 并打开 Ember 项目详情 → `Esc` 关闭 → 打开 All projects 覆盖层 → 关闭，含指针轨迹。

封面为独立截图，与视频内容一致但不从视频抽取；两份素材均保留自身比例，不拉伸。更新模板外观或行为时，必须同步更新这两个固定文件名下的文件。根 [catalog.json](../../catalog.json) 中本模板声明的仓库根相对路径为 `sites/cais/preview/cover.png` 与 `sites/cais/preview/video.mp4`。
