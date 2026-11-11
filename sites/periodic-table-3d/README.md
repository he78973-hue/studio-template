# ELEMENTA · 3D 原子图谱

包含 118 元素周期表和玻尔原子示意模型的交互式网站模板。**浅色／暗色两套皮肤位于同一个页面**，右上角随时切换；元素格、原子材质、轨道、详情面板和图例同步更新。

## 运行与发布

直接用现代浏览器打开 `index.html`，或在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8080/sites/periodic-table-3d/>。

运行仅需 **一个 `index.html`**：Three.js r160、OrbitControls、PT Mono 字体、代码、样式、数据和依赖许可文本已内嵌，不需要 CDN、网络请求、后端或 npm 安装。`src/` 用于编辑和重建，`preview/` 仅用于画廊，均不是运行依赖。

## 交互

- 悬停元素显示信息；点击进入原子视图，显示符号、中文名、序数、质量、分类和电子壳层。
- 拖拽旋转、滚轮缩放；「原子核特写」按钮或 `N` 切换核特写。
- 「返回周期表」、`Esc` 或原子视图中点击画布返回。
- 右上角「浅色／暗色」支持鼠标、Tab + Enter/Space；默认暗色，选择通过本机 `localStorage` 保存。存储被禁用时仍可切换。
- 主题切换保留当前元素、核特写状态和相机位置，不重建原子；任一主题按钮可中断首次引导。
- `?demo=0` 跳过首次引导；`?mode=2d` 强制 Canvas 降级。WebGL 创建失败时也会自动使用 Canvas 2D。
- `prefers-reduced-motion: reduce` 跳过首次引导并减少相机及环境动效，不等同于完全静止的原子模型。

## 可编辑源码与验证

可选构建依赖：Node.js 18+（仅标准库）。在仓库根目录运行：

```sh
node sites/periodic-table-3d/build.mjs
node sites/periodic-table-3d/src/check-data.mjs
node sites/periodic-table-3d/src/check-theme.mjs
python3 scripts/validate-catalog.py
```

`build.mjs` 会把 `src/`、vendor 和完整许可文本重新内联进 `index.html`。应修改源码后构建，不要只修改生成的 HTML。不要删除 vendor 中的许可证文件。

浏览器打开本模板并通过 agent-browser 连接**可见标签页**后运行：

```sh
agent-browser eval --stdin < sites/periodic-table-3d/src/check-theme-browser.js
```

WebGL 与 `?mode=2d` 分别执行。检查覆盖主题状态、存储、按钮状态、纹理复用/数量稳定、切换期间保留元素和核特写、相机不被主题切换重置，以及返回周期表。数据检查覆盖元素数量、序数、坐标唯一性、分类和壳层电子数求和。

### 目录

```text
periodic-table-3d/
├── index.html
├── build.mjs
├── README.md
├── preview/cover.png
├── preview/video.mp4
└── src/
    ├── elements.js            静态数据
    ├── theme.js / styles.css  共享渲染调色板与 UI token
    ├── textures.js            可原位重绘的 Canvas 贴图
    ├── scene.js / table.js    渲染器、相机和周期表
    ├── atom.js / ui.js        原子模型与 HTML 面板
    ├── app.js / fallback2d.js 主控与 Canvas 降级
    ├── check-data.mjs / check-theme.mjs / check-theme-browser.js
    └── vendor/
        ├── three.module.js / OrbitControls.js
        ├── PTMono.woff2
        ├── LICENSE-three.txt
        └── OFL-PTMono.txt
```

## 科学与产品边界

- 原子视图是便于观察壳层数量的**玻尔式示意模型**，不是量子轨道/电子云计算，也不按真实粒径、间距或时间尺度模拟。
- 核内质子数按序数，演示质量数取原子质量四舍五入，中子数由此推算；这不是精确同位素选择或核物理计算。
- 数据为随模板提供的静态数据表；自动检查验证结构和计数关系，不是对所有科学数据来源的独立审计。
- 没有账号、云端存储、实时科学数据库或服务端功能。唯一持久化状态是本机主题偏好。
- Canvas 降级保留表格、原子和主题交互，但不是 WebGL 材质、透视和光照的等价实现；降级不会播放 WebGL 引导流程。
- 密集的 18 列表格更适合横屏或缩放观察。文字 Canvas 图形未提供完整键盘元素导航，不宣称全站无障碍合规；HTML 主题/详情按钮具备键盘操作与焦点态。
- 需要现代浏览器；低性能设备上的帧率未作保证。中文衬线/罕见汉字依赖系统字体，等宽字体 PT Mono 已内嵌。

## Studio 预览素材与本次验证

- `preview/cover.png`：1280×900，423,953 bytes（约 414 KiB），同一页面浅色周期表视图的独立截图。
- `preview/video.mp4`：1280×900，20 fps，20.15 秒，3,921,868 bytes（约 3.74 MiB）；H.264/yuv420p、无音轨、faststart。
- 视频为本次提交页面的真实浏览器录制：暗色周期表 → Fe 原子 → 浅色原子 → 核特写 → 返回周期表 → 暗／浅切换。录制时仅使用 `?demo=0` 跳过自动引导，再触发页面既有操作；没有拼接静态画面或修改模型表现。
- 初次 30 fps 录制因编码器积压失败，未采用；最终按 20 fps 重录，低于仓库建议的 30 fps，但满足必需的格式、时长与大小规范。压缩保留原分辨率和录制帧率，不拉伸、不插帧。
- 封面和视频保持相同画幅，包含同一套双主题页面。视觉或示范行为变化时，应同时刷新这两个固定文件。

构建、元素数据检查、主题静态检查通过；本次重新运行的 WebGL 浏览器检查 **19/19**、Canvas 2D **14/14** 通过。PNG 已在浏览器完整解码并审图；MP4 已完整 FFmpeg 解码，并在浏览器验证静音内联播放、7 秒跳转和末尾循环。媒体浏览器检查读取仓库视频完整字节后使用 Blob，以排除本地 Python 静态服务器不支持 HTTP Range 的影响；真实 Studio/CDN 路径仍须部署环境验收。

`python3 scripts/validate-catalog.py` 通过：6 scenes、11 templates；唯一 WARN 是既有 `step-studio` 封面超过建议 1 MiB，本模板无媒体告警，ffprobe 检查未跳过。根 `catalog.json` 是登记来源：`periodic-table-3d` / `creative` / `forest`；原有条目及相对顺序保持不变。

**提交 PR 不代表已经上架。** 合并后由对应 Studio 环境负责人选择包含目录、源码和媒体的同一已合并完整 SHA，更新服务端 `STUDIO_TEMPLATE_REF`，再验收静态封面、hover/聚焦、选中 composer、详情视频和加载失败回退。本 PR 不修改 Studio 配置，不自动合并或部署。参见[上架流程](../../docs/template-publishing.md)。

## 许可与署名

应用代码未指定独立开源许可证，不额外宣称 MIT 或无限制商用。以下依赖保留各自许可：

- **Three.js r160 / OrbitControls**：Copyright 2010–2023 three.js authors，MIT；完整文本见 [`src/vendor/LICENSE-three.txt`](./src/vendor/LICENSE-three.txt)，来源 [three.js r160 LICENSE](https://github.com/mrdoob/three.js/blob/r160/LICENSE)。
- **PT Mono**：Copyright 2011 ParaType Ltd.，SIL Open Font License 1.1；保留字体名约束，字体文件未修改。完整文本见 [`src/vendor/OFL-PTMono.txt`](./src/vendor/OFL-PTMono.txt)，来源 [Google Fonts / PT Mono](https://github.com/google/fonts/tree/main/ofl/ptmono)。

构建会将两份完整依赖许可放进生成 HTML 的 `script#third-party-notices[type="text/plain"]` 中，因此单独分发 HTML 也保留许可文本。系统字体不随本模板分发。设计技能仅用于实现指导，不是运行依赖，也不随模板打包。参见根 [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)。
