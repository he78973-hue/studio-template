# 观潮 TrendAtlas · 欧美新品研究工作台

暖棕、米白、酒红与鼠尾草绿组成的外贸新品研究模板。面向节日装饰和家居用品团队，将社媒内容线索拆解成产品系列、打样任务与季度计划。React 可编辑源码与预构建静态入口一起提供。

## 静态预览

在模板仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8080/sites/trendatlas/`。也可在本模板目录启动 HTTP 服务，或将 `index.html`、`assets/`、`images/`、`fonts/`、`licenses/` 一起发布到静态服务器。支持子目录挂载，请使用 HTTP，不直接双击 `file://` 入口。

页面脚本、样式、图片和 DM Sans 字体均本地提供；中文使用设备字体栈。默认运行不依赖 CDN、后台或外部 API。用户主动打开来源链接时才访问对应平台。

## 开发与复用

阅读 [DEVELOPER_PROMPT.md](./DEVELOPER_PROMPT.md) 可直接把项目背景、视觉规则、数据约束和验收要求交给开发者或编码助手。

需要 Node.js 20.19+ 或 22.12+。在 `source/` 中运行：

```sh
npm ci
npm run dev
npm test
npm run build:template
```

`npm run build` 只构建 `source/dist/`；`npm run build:template` 还更新上一层模板的生成入口和运行资源。导出脚本根据 `.runtime-files.json` 只替换已生成的运行文件，保留预览素材、源码与说明。源码仓库外也可通过 `--out-dir /path/to/sites/trendatlas` 指定导出目录。

```text
trendatlas/
├── index.html                 # 已构建的静态入口
├── assets/                    # 打包的 JS/CSS/字体
├── images/                    # 本地风格参考照片
├── fonts/                     # DM Sans 本地字体与来源
├── licenses/                  # 第三方许可
├── source/                    # React + Vite 源码、锁文件与测试
├── preview/cover.png          # 独立画廊封面
├── preview/video.mp4          # 真实浏览器录制
├── DEVELOPER_PROMPT.md         # 可直接复用的开发提示词
├── DESIGN.md                  # 设计系统与布局约束
├── CREDITS.md                 # 图片、字体、依赖来源
└── VERIFICATION.md            # 提交版本的实测结果
```

## 功能与边界

- 新品机会总览、社媒热门内容、商超观察、灵感收藏、季度企划与数据来源六个页面。
- 国家/欧洲汇总、品类、节日、平台、关键词和30/90天观察窗；可解释指标、排名、键盘图表、精确数据表和CSV导出。
- 内容机制、产品系列、打样任务、原始指标与原帖依据分开展示。
- 企划创建/编辑、开发月份和阶段、删除撤销、本地保存；节日倒排支持可调整周期。
- CSV整批校验、旧列兼容、重复记录拦截、缺失值保留及公式注入防护。

**演示数据不是市场结论。** 18条构造样本的观察基准固定为2026-11-13；演示指标、历史曲线和内容拆解不是实际采集结果。外部搜索入口不是原始证据；图片是风格参考，不代表具体商品或平台原帖。

用户导入与演示数据分开展示。当前没有平台连接、实时采集或实际销量接口；导入快照没有历史时不补造曲线。机会分是选题参考，不是销量预测。真实数据集成说明见 [DATA-INTEGRATION.md](./DATA-INTEGRATION.md)。

开发至到仓默认13周（约3个月），提前4周上架可调整。节日日期按选择的企划年度计算，复活节使用西方教会格里高利历，美国感恩节只用于美国。开发任务月份不是销售月份。

数据仅存于当前源的浏览器 localStorage，键前缀为 `trendatlas:`；同源下多个本模板副本共享数据，跨浏览器/设备不自动同步。清除站点存储会清除本地记录，可先用CSV导出。没有账号、多人协作或云端数据库。

## Studio 画廊素材与登记

固定素材为 `preview/cover.png` 与 `preview/video.mp4`，来自提交版本的真实浏览器画面，视频为静音H.264、faststart。画幅、时长、大小、解码与浏览器播放/跳转结果见 [VERIFICATION.md](./VERIFICATION.md)。两份素材不参与页面运行；更改页面外观或展示交互时需一起更新。

根清单登记 `id: trendatlas`、`scene: tools`、`tone: sand`，配套双语标题/描述及仓库相对素材路径。没有公开部署地址时不填写 `previewUrl`。

本PR仅提交模板。合并后由目标Studio环境负责人选取包含清单、源码和素材的已合并完整SHA，配置 `STUDIO_TEMPLATE_REF` 并进行真实画廊验收；合并本身不会自动完成上架。

## 许可与署名

模板自有代码与观潮文字标识未另行指定开源许可证。React/React DOM/Scheduler为MIT，Lucide为ISC并包含Feather衍生内容的MIT说明，DM Sans为SIL OFL 1.1；对应许可随 `licenses/` 提供。参考照片来自Unsplash，逐项URL及许可入口见 [CREDITS.md](./CREDITS.md)。不将整个模板或第三方照片声明为无条件商用素材包。
