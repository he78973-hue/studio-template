# 女神衣橱 · MUSE WARDROBE

粉色、可可棕与米色的私人搭配工作室：Three.js 试衣室、心情与天气推荐、照片/衣物上传、本地衣橱和搭配收藏。提交内容包括**可直接访问的静态演示**和**带真实图像编辑接口的完整 React + Node 源码**。

## 静态预览

在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8080/sites/muse-wardrobe/>。也可将本目录的 `index.html`、`assets/`、`images/`、`favicon.svg` 和 `licenses/` 独立放到静态 HTTP 服务中。支持子目录挂载；请使用 HTTP，不使用 `file://`。

- 页面脚本、图标、人物、衣物与房间纹理均在本地，无需 CDN、安装依赖或配置密钥即可查看。
- 静态版包含两套**预生成试穿示例**，界面明确标注 `DEMO`：默认粉色上衣 + 米色长裤 + 棕包 + 踝靴，以及仅选择粉色上衣。
- 其他组合、用户上传的人物和衣物不会冒用示例结果：界面提示暂无预生成示例，仍可在平铺视图中整理、搭配和收藏。
- 静态版不调用 `/api/tryon`，不向图像模型发送上传照片。新照片的真实 AI 换装需要下述 Node 服务。
- 天气默认值是演示数据；点击“获取天气”才会访问 Open-Meteo，失败时可手动设置。公共免费 API 仅用于非商业演示。
- `preview/` 是 Studio 画廊素材，网页运行不依赖它。

## 源码与真实换装

需要 Node.js **22.12+** 和 npm。在 `source/` 中：

```sh
npm ci
npm run dev
```

复制 `source/.env.example` 为 `source/.env.local`，设置兼容图像编辑接口的服务端环境变量：

```dotenv
TRYON_API_BASE=https://api.openai.com/v1
TRYON_API_KEY=在本机填写密钥
TRYON_MODEL=gpt-image-2
```

也支持 `OPENAI_API_KEY` 或 `STEPCODE_BASE_URL` / `STEPCODE_API_KEY`。服务端调用 `/images/edits`；凭据不会注入浏览器，仓库不包含密钥。无凭据时明确提示服务未配置。

```sh
npm test               # 推荐、接口边界、缓存/异步及静态示例匹配测试
npm run build          # 构建静态 DEMO 并导出到本模板根目录
npm run build:server   # 构建使用真实换装接口的前端到 source/dist
npm run preview        # 与 Node 换装接口一起预览最近一次 source/dist 构建
```

需要真实换装的生产预览时，按 `build:server` → `preview` 的顺序执行；`build` 生成的是静态 DEMO。`npm run dev` 始终使用 Node 接口。生产部署需要 Node 后端或等价的独立 API；只上传静态文件不会提供图像生成。

图像生成不是实时布料模拟，通常需几十秒；相同内容通过服务端缓存复用，当前会话再穿同一套会直接复用已加载结果。初次进入真实服务版本仅查询已有缓存，不主动创建新生成任务。选衣合并 400ms 内的连续操作；旧结果不会覆盖新的选择，但已提交到模型的任务可能仍会完成并进入缓存。

macOS 使用系统 Vision 做人物前景提取。其他平台可运行图像生成，但没有等价抠图服务时保留生成背景。人物是图像模型输出的透明平面，房间与相机是真正三维几何；不能查看人物真实背面，也不提供准确尺码/试衣合身度保证。

## 交互与数据边界

- 全身/近景、拖动镜头、滚轮事件缩放、原照复位与平铺视图；场景静止时按需停止重绘。
- 心情、气温、天气和场合的本地规则推荐，不将规则推荐描述为模型推理。
- JPG / PNG / WebP 上传、衣物标签编辑、分类互斥选择、命名收藏与恢复。
- IndexedDB 数据库以 `muse-wardrobe:<当前目录路径>` 命名，按浏览器源和模板目录隔离。清理站点数据会清除本地衣橱。
- 本地自动写入有 250ms 防抖；在这个窗口内立即刷新或关闭页面，最近一次修改可能尚未落盘。界面中的收藏反馈先更新内存状态，不等同于数据库事务已完成。
- Node 模式试穿时会将人物和所选衣物发送至配置的图像服务；生成缓存保存在 `source/.cache/tryon/`，被 Git 忽略。
- 鼠标与键盘焦点分开处理；鼠标选完下拉框不会残留焦点圈，Tab/方向键仍有可见提示。支持原生弹窗焦点管理和 reduced motion。
- `?gray=1&view=front` / `diagonal` / `top` 为灰模检查；`?view=front` / `back` / `left` / `right` 为房间检查，不代表人物有背面重建。

## 文件结构

```text
muse-wardrobe/
├── index.html, favicon.svg    # 已构建的静态入口
├── assets/, images/           # 本地运行文件与两套明确标记的预生成示例
├── source/                   # React/Vite、Node 接口、Swift 抠图、测试与锁文件
├── licenses/                 # 依赖许可原文
├── preview/cover.png          # 独立画廊封面
├── preview/video.mp4          # 实际页面录屏
├── ASSET-SOURCES.json         # 商品参考图逐项来源
├── CREDITS.md                # 素材、数据与许可边界
└── VERIFICATION.md            # 本次提交的实测记录
```

`source/scripts/export-template.mjs` 只更新生成的运行文件，保留源码、许可、README 和预览目录。修改展示效果或演示交互后须重新录制两份预览素材。

## Studio 画廊素材与登记

固定素材为 `preview/cover.png` 与 `preview/video.mp4`，均来自本次静态模板的实际浏览器呈现，保持相同比例。视频为 30 fps 的无音轨 faststart H.264，展示全身/近景、平铺、重置及预生成示例切换，不展示上传隐私照片或现场模型生成。解码、时长和大小见 [VERIFICATION.md](./VERIFICATION.md)。

根 `catalog.json` 登记 `muse-wardrobe`，分类 `tools`、色调 `sand`，同时提供双语标题/说明及仓库相对媒体路径。没有填写虚构或本地 `previewUrl`。

本 PR 仅提交模板和清单，**不代表已在 Studio 上架**。合并后由目标 Studio 环境维护者选定包含本模板的完整已合并 SHA，设置服务端 `STUDIO_TEMPLATE_REF`，并验证真实画廊的封面、播放、选择和失败回退。

## 许可与署名

模板自有代码与 MUSE 标志未另行指定许可证，不把整个素材包宣称为 MIT 或已获无条件商用授权。React / React DOM / Scheduler / Three.js 为 MIT；Lucide 为 ISC，Feather 衍生部分为 MIT；仅 Node 源码使用的 Sharp 为 Apache-2.0。完整依赖许可见 `licenses/`。

人物、商品摄影、城市与木地板纹理的具体来源、改动及各自权利边界见 [CREDITS.md](./CREDITS.md) 和 [ASSET-SOURCES.json](./ASSET-SOURCES.json)。商品摄影没有附带开放再许可；保留原品牌来源，商用/再分发前应确认相应权利或替换。预生成图不表示真实商品合身效果或品牌/人物背书。
