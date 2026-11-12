# 岩点 UPWARD — 都市攀岩俱乐部

暖白、炭黑与攀岩橙组成的中文攀岩馆网站模板，包含场馆介绍、初攀指南、票价与装备清单，以及可操作的本地预约演示。React 源码和已构建的静态入口一同提交；查看模板不需要安装依赖。

## 静态预览与部署

在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/upward-climbing/>。网站也可独立部署到任意静态 HTTP 服务：将 `index.html`、`favicon.svg`、整个 `assets/` 和 `licenses/` 放在同一目录。支持子目录挂载；请使用 HTTP，不要直接通过 `file://` 打开。

图片、字体、React 和图标的运行资源均已本地打包，页面不依赖外部 CDN、API 或后端。`preview/` 仅供 Studio 画廊使用，不是网站运行依赖。

## 源码开发与重新构建

需要 Node.js 18+（满足 Vite 6 要求）与 npm。在 `sites/upward-climbing/source/` 中运行：

```sh
npm ci
npm run dev
npm test
npm run audit:design
npm run build
```

`npm run build` 先在 `source/dist/` 中完成 Vite 构建，再通过 `scripts/export-template.mjs` 更新上一层模板目录的入口、favicon 和 `assets/`。相对资源基址支持子目录部署；导出脚本仅替换生成的运行文件，保留源码、许可、说明与预览素材。修改外观或演示交互后，须重新录制 `preview/cover.png` 与 `preview/video.mp4`。

```text
upward-climbing/
├── index.html                  # 已构建的静态入口
├── favicon.svg
├── assets/                     # 本地脚本、样式、图片、字体及署名
├── licenses/                   # React / React DOM / Scheduler / Lucide 许可
├── source/                     # React + Vite 可编辑源码和锁文件
│   ├── src/
│   ├── public/
│   ├── scripts/
│   └── tests/
├── preview/
│   ├── cover.png
│   └── video.mp4
└── README.md
```

## 功能与演示边界

- 抱石、绳攀、初攀介绍，票价、时长、包含项、装备准备和常见问题。
- 上海时区的未来七天课表，项目／开场时段／可预约筛选，以及可展开场次详情。
- 原生预约对话框、表单校验、人数和剩余容量检查、本地回执、预约列表及二次确认取消。
- 响应式导航、键盘操作和减少动态效果偏好支持。
- UPWARD 是虚构概念馆；面积、线路、教练、价格、余位和营业信息均为示例，没有真实营业地址、实时库存、支付或外部预约服务。
- 预约保存在当前浏览器、当前源的 `localStorage` 键 `upward-demo-bookings-v1`；同源下多个本模板副本共享这份演示数据。电话号码仅在内存中校验，不写入本地存储，也不上传。
- 清除浏览器数据会清除演示预约；本地余位只反映当前浏览器的记录，不提供跨用户并发库存。演示回执不能用于入场。

## Studio 预览素材

固定文件为 `preview/cover.png` 与 `preview/video.mp4`，两者来自本次提交版本的真实浏览器呈现，画幅为 1280 × 900。封面独立保存；视频为 30 fps、约 21.13 秒、1.84 MiB 的无音轨 faststart H.264 MP4，展示首页、攀爬空间、初攀介绍、预约筛选和空白预约表单。录制未填写姓名、电话或提交预约。

根 `catalog.json` 登记 ID `upward-climbing`、分类 `sites`、双语文案、`sand` 色调和上述两份素材的仓库相对路径。没有公开 demo 时不填写 `previewUrl`。检查命令及实测结果见 [VERIFICATION.md](./VERIFICATION.md)。

提交 PR 不等于完成 Studio 上架。合并后由目标 Studio 环境负责人选定已合并的完整 SHA，更新服务端 `STUDIO_TEMPLATE_REF` 并验收画廊封面、播放和回退；本提交不修改 Studio 环境配置。

## 许可与署名

- 模板自有代码和 UPWARD 标志未另行指定开源许可证；不将整个模板宣称为 MIT 或无条件商用素材包。
- React、React DOM 与 Scheduler：MIT；完整许可随 `licenses/` 提供。
- Lucide：ISC，以及其 Feather 衍生内容的 MIT 说明；保留完整发行包许可。
- Barlow Condensed：SIL Open Font License 1.1，见 `assets/OFL-Barlow.txt`；中文字体使用设备字体栈。
- 动作与脚法图片：John Kane，CC0 1.0；场馆参考图：Bondarev.gal，CC BY 4.0；绳攀背影：Allan Mas，Pexels License。作者、原图、许可及裁切说明见 [assets/SOURCES.md](./assets/SOURCES.md)，也可从页面底部打开。
- 图库照片不表示 UPWARD 场馆、教练或其背书；图片版权许可不自动解决第三方肖像、隐私和商标权利。原先的正脸、侧脸照片及历史设计截图不包含在本模板中。

`SOURCES.md` 保留 UTF-8 BOM，避免浏览器直接打开 Markdown 时误判中文编码。修改署名请编辑 `source/public/assets/SOURCES.md` 后重新构建。
