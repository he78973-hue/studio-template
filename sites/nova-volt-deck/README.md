# 星潮电动 · 商业企划案 Deck（NOVA VOLT Business Plan Deck）

16:9 的 HTML 幻灯片模版：1920×1080 画布、12 页、键盘/点击导航、可导出 PDF。
内容是一份电车品牌的商业企划案（**虚构演示数据**，页面已标注），
视觉系统取自 `new_brandskills`（StepFun Brand Tokens v2.0），7 张配图为原创 SVG。

## 本地预览

因为使用 ES Modules，需要通过 HTTP 访问（不能直接双击 `file://`）：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
# 打开 http://127.0.0.1:8080/sites/nova-volt-deck/
```

操作：`→` / `空格` / `PgDn` 下一页，`←` / `PgUp` 上一页，`Home`/`End` 首末页，
数字键 `1`–`9` 跳页，URL 锚点 `#3`（支持浏览器前进后退），右下角 `EXPORT PDF` 导出。

## 文件结构

```text
nova-volt-deck/
├── index.html              # 12 页幻灯片本体（改内容只动这里）
├── assets/
│   ├── tokens.css          # StepFun 品牌三层 token（配色/字阶/间距/纸纹）
│   ├── deck.css            # 版式：.slide 基座 / 栅格 / 卡片 / 目录 / 路线图 / 导航 / 打印
│   ├── deck.js             # 缩放适配 + 键盘导航 + 点阵标题 + 打印（无框架依赖）
│   ├── dotmatrix.js        # 品牌点阵标题渲染器（零依赖 → SVG）
│   └── svg/                # 7 张配图设计源（可编辑矢量，唯一设计源）
│       ├── cover-car.svg / battery-modules.svg / factory-plant.svg
│       ├── city-network.svg / chart-market.svg / matrix-competition.svg
│       ├── chart-finance.svg / dot-title-1.svg / dot-title-2.svg
└── preview/                # 画廊展示素材，不是网站运行依赖
    ├── cover.png
    └── video.mp4
```

## 画廊预览素材规格

| 文件 | 规格 |
| --- | --- |
| `preview/cover.png` | 1280×720 PNG，约 0.20 MiB，与视频同模板同构图（视频第 1 帧同版式） |
| `preview/video.mp4` | H.264（high profile）、1280×720、30 fps、14.4 s、无音轨、moov 前置（faststart）、约 0.85 MiB |

录制方式：本地 HTTP 服务 + 无头 Chromium 按 1280×720 逐页截图（12 页，每页 1.2 s），
`ffmpeg` 编码（`-movflags +faststart -an`，首尾各 0.35 s 淡入淡出）。
素材对应本次提交的模板版本；刷新模板外观时需同批更新两个文件。

## 使用边界

- 字体：中文「思源宋体 CN / Source Han Serif CN」、英文与数字「Lora」。
  HTML 版经 Google Fonts 加载 Noto Serif SC（思源宋体的同源发行版）+ Lora；
  离线回退系统宋体 / Georgia。**未嵌入字体**，换机器需自备字体。
- 内容为商业企划案演示用虚构值（含市场、销量、财务、竞品定位），
  页脚与图表口径已标注「演示数据 · 非真实经营披露」，不构成真实经营或市场数据。
- 摄影类位图未使用；全部配图为原创 SVG 矢量插画（等距电池模组、工厂、城市网络、
  两张图表、定位矩阵、电车侧视），可整组替换。
- 点阵标题（封面「星潮电动」、封底、每页页头点阵章号）由 `dotmatrix.js` 现场渲染，
  几何遵循品牌规则：中文 9 行点 / 英文 7 行点、P/d = 1.35、点径 ±4% 抖动模拟油墨扩散。
- 网站代码不引用 `preview/` 下任何文件；该目录仅作画廊展示。

## 复用

1. 整块复制一个 `<section class="slide">` 即可增页；底部圆点与页码由 `deck.js` 自动生成。
2. 换插图：替换 `assets/svg/*.svg`（保持 `viewBox="0 0 960 640"` 最稳），改对应 `<img src>`。
3. 换配色/字阶：只改 `assets/tokens.css`。
4. 图表数据直接改 SVG 内 `<text>`（设计源）或改为原生图表；两页数据表在 `<details>` 内有 mono 等价表。
