# 晴屿 · Weather Garden

移动端优先的天气可视化 **Web App**：可拖拽的 Three.js 天气积木、与所选预报小时联动的读数、温度/降水/风速图、一周温差、风向盘、UV 和日出日落进程。

它按 `sites/weather-garden/` 收录，是网页模板，**不是 APK / IPA 或原生 App**。默认公共天气接口仅用于非商业演示；商业部署的数据授权边界见下文。

## 本地预览

直接打开 `index.html`，或从仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8080/sites/weather-garden/>。运行仅需一个 `index.html`：代码、样式、Three.js、图标、依赖许可及带日期的上海历史快照均内嵌。页面无需安装包或 CDN；获取最新预报需要网络。

## 交互与可视化

- 拖拽天气积木查看侧面，松手回正；方向键和重置按钮也可操作。天气造型包含晴、晴间多云、阴、月牙、雨、雪、雷雨和雾。
- 小时时间轴选择更新温度、天气造型及其他读数。跨日期显示日期标记；下方风、UV、太阳区域也标明所选时段，避免与当前天气混淆。
- 温度折线、降水柱形、风速/来向共用明确的时间轴；刻度采用可读步长，零值与缺值分别处理。
- 一周最低/最高温度使用共同尺度，点击某天查看详细预报。
- 「看见风」显示由单地点风速和风向驱动的动画示意，不是区域流体模拟或台风轨迹。
- 六个内置城市：上海、杭州、北京、深圳、成都、三亚。城市搜索仅搜索此列表，不申请定位权限。
- 支持动态 `prefers-reduced-motion`，无需刷新；离屏/后台暂停 3D 绘制。WebGL 初始化失败时改用明确的图标降级，数据和图表仍可读。

## 数据口径和错误处理

使用 [Open-Meteo Forecast API](https://open-meteo.com/en/docs)。这是模型预报，不等于气象站实测，也不替代官方灾害预警。

- API 请求 Unix 时间戳，按返回的 IANA 时区格式化；温度 °C、风速 m/s、降水 mm、湿度/概率 %。
- 小时降水量和概率对应**截至标示时间之前的一小时**；小时图从响应当前时刻之后开始。
- 空值保留破折号/图表间断/不可用提示，不转换成零，也不为了展示效果生成假柱形。
- 太阳弧表示白昼时间进程，不是太阳真实高度角；白昼时长不是无云日照时长。
- 每个城市独立缓存，旧请求会被取消/忽略，避免快速切城时串数据。
- `src/snapshot.js` 保存一次真实上海响应及原始时间。无法联网时明确显示“历史快照”，不会更新其时间来冒充新预报，也不会用于其他城市。
- 无缓存城市显示不可用状态和重试。页面显示来源、预报时间和获取时间；截图中的数值以拍摄时为准。

## 构建与检查

可选构建环境：Node.js 18+，仅标准库，不需要 `npm install`。从仓库根目录：

```sh
npm --prefix sites/weather-garden run build
npm --prefix sites/weather-garden test
python3 scripts/validate-catalog.py
```

修改 `src/` 或 `index.template.html` 后重新构建。只修改生成的 `index.html` 会被下次构建覆盖。

用 agent-browser 连接已打开、可见且有预报数据的页面后：

```sh
agent-browser eval --stdin < sites/weather-garden/tests/browser-check.js
agent-browser eval --stdin < sites/weather-garden/tests/recovery-browser.js
agent-browser eval --stdin < sites/weather-garden/tests/polish-browser.js
```

`tests/fallback-browser.js` 需要 HTTP 预览环境：它读取入口并在临时 iframe 内禁用 WebGL，检查完移除 `#qaFallback`，不修改正式应用的渲染能力。

## 文件结构

```text
weather-garden/
├── index.html / index.template.html
├── build.mjs / package.json
├── README.md
├── src/
│   ├── data.js       单位、时间、WMO 类型与校验
│   ├── app.js        接口、缓存、界面与恢复
│   ├── charts.js     SVG 图表及共享尺度
│   ├── scene.js      3D 造型、材质和手势
│   ├── styles.css    语义 token 与移动布局
│   └── icons.js / snapshot.js
├── tests/
├── vendor/           Three.js、图标来源和完整许可
└── preview/
    ├── cover.png
    └── video.mp4
```

`preview/` 是 Studio 画廊素材，不是运行依赖。没有后端、账号、支付、用户云存储或第三方分析 SDK；浏览器只保存城市选择和同城预报缓存。

## Studio 预览素材

- `preview/cover.png`：1280×720、76,143 bytes；16:9 独立 PNG，截取实录第一页（首屏：城市、当前温度、3D 天气积木与 quick metrics），与视频同模板同构图。
- `preview/video.mp4`：1280×720、30 fps、16.23 秒、486,856 bytes；H.264/yuv420p、无音轨、已启用 faststart（moov 先于 mdat）。
- 画廊要求 16:9 画幅；App 本体是 480px 宽度的移动端优先布局，录制时为 1280×720 桌面视口、App 列居中，保留原始比例不做拉伸，两侧为页面背景。
- 视频是真实浏览器中的本次提交页面实录，不是截图拼接；依次覆盖：拨动 3D 天气积木后松手回正、「看见风」风线、滚动到逐小时图表并点选时刻、拖动小时时间轴、一周冷暖中打开单日详情再关闭、城市弹窗中从上海切换为杭州（实时重新获取预报）、最后回到第一页首屏。
- 录制时成功取得 Open-Meteo 模型预报，来源与时间在界面中显示；数值会随实际预报更新，不应当作恒定示例。录像全部通过页面既有控件触发，未伪造天气数值或模型渲染。
- 两个文件均为真实入库媒体，不是 Git LFS 指针或外链；外观或示范行为变化时同时更新。源代码不依赖这些画廊素材。

## 本次提交验证

- 构建及 22 项单元测试通过；在此目录的实际页面重新运行了 33 项主流程、6 项请求恢复、8 项界面打磨检查，全部通过，浏览器未捕获异常列表为空。
- PNG 已完整解码并审图；MP4 已经 FFmpeg 全量解码，ffprobe 确认 H.264、无音轨、30 fps、时长与画幅，仓库脚本确认 faststart。
- 浏览器验证了视频播放、8 秒跳转和末尾循环。媒体测试读取仓库文件的完整字节作为 Blob，避免本地 Python 静态服务器不支持 HTTP Range 的影响；这不是实际 Studio/CDN 验收。
- `python3 scripts/validate-catalog.py` 通过，唯一 WARN 是仓库既有 `step-studio` 封面超过建议 1 MiB；本模板没有新增媒体告警，也没有修改旧条目或历史豁免。
- 独立只读交叉复核未发现打包、路径、登记或许可说明的阻塞项。合并冲突状态以 PR 创建后对最新 `main` 的 Git/GitHub 检查为准，后续上游变化仍需复查。

## 许可与数据使用

- 应用代码未指定独立开源许可证，不把所有代码或数据一概宣称为 MIT/无限制商用。
- Three.js r160：MIT，完整文本见 `vendor/LICENSE-three.txt`。
- Lucide 图标：ISC，部分继承 Feather MIT；完整声明见 `vendor/LICENSE-lucide.txt`，固定源码 commit/图标列表见 `vendor/lucide-source.json`。依赖许可也内嵌于 HTML。
- Open-Meteo 数据：按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，保留署名、来源、许可链接及快照时间；页面只做取样、计算和显示舍入，不伪造预测。
- **数据许可与 API 服务许可不同。** 当前使用的免费端点只允许其条款中的非商业用途，详见 [Open-Meteo 使用条款](https://open-meteo.com/en/terms)。商业环境上线前必须选择获授权的数据服务/订阅或合规自托管方案，并调整 `src/data.js` 的数据接入；需凭据时使用受控后端，不将密钥放进前端。该 PR 不代表获得商业 API 授权。
- 设计采用 style-fidelity、motion-interaction-skill、web-icon-system 的指导；技能包本身不是运行依赖，也未随模板分发。字体使用系统回退，没有打包字体文件。

## 已知边界

需要现代浏览器；未认证真实 iOS/Android 设备性能，也没有原生安装包。存在风场/太阳进程的艺术化表达，不能用于专业灾害决策。数据服务可用性和额度受提供方约束；缓存/快照让页面仍可演示，但不意味着离线数据是新预报。无 WebGL 降级不是 3D 材质或手势的等价实现，不宣称全站 WCAG 合规。

合并并不自动上架。由对应 Studio 环境负责人选择同时包含 catalog、源码和媒体的已合并完整 SHA，更新 `STUDIO_TEMPLATE_REF`，再验收 hover/聚焦、选中 composer、详情视频及失败回退；本 PR 不修改 Studio 配置或自动部署。参见[上架流程](../../docs/template-publishing.md)。
