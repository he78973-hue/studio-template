# 秋日来信 · 3D 八音盒

暖白留白中的秋日微缩音乐盒：胡桃木与黄铜底座、金色树林、红枫、河湾、车站和环形铁路。模型与播放器居中，支持旋转、缩放，以及同步的火车、齿轮和原创合成旋律。

## 直接运行

用现代桌面浏览器双击 `index.html`，或在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8080/sites/autumn-letter/>。

运行只需 **一个 `index.html`**。Three.js、Lucide 图标、样式、程序化模型/贴图、音乐合成代码和完整依赖许可均已内嵌；不需要 CDN、后端、API key 或 npm 安装。`preview/` 是画廊素材，不是运行依赖。

## 交互

- 拖动 / 单指拖动旋转；滚轮 / 双指捏合缩放，距离有上下限。
- 「初见视角」恢复初始构图；画布聚焦时可用方向键旋转、`+` / `-` 缩放、`Home` 复位。
- 播放按钮或可见的黄铜发条启动/暂停音乐、火车及齿轮。音乐需要用户操作后才开始。
- 音量滑杆调节实际输出；扬声器按钮静音并恢复之前的非零音量，图标和读屏标签同步更新。
- 暂停保留音乐/火车位置，机械运动短暂减速；页面隐藏时暂停声音。
- 尊重 reduced-motion 偏好；WebGL 上下文中断时提供重新打开按钮。

## 编辑与重建

构建需要 Node.js 20.19+ 或 22.12+。在本模板目录执行：

```sh
npm ci
npm run build
npm start
```

打开 <http://127.0.0.1:5212/>。编辑 `index.template.html`、`src/` 后重新执行 `npm run build`；`index.html` 为生成文件。提交更新时应同时重建入口并刷新封面与视频。

| 路径 | 用途 |
| --- | --- |
| `index.template.html` | 可编辑页面结构 |
| `src/style.css` / `src/icons.js` | 语义样式 token、响应式布局和统一图标 |
| `src/main.js` / `src/audio.js` | 交互、动画同步及 Web Audio 合成 |
| `src/scene.js` / `src/layout.js` | 摄像机、灯光、灰模及共享场景布局 |
| `src/music-box.js` / `src/craft.js` | 木盒、黄铜结构、几何与材质 |
| `src/forest.js` / `src/landscape.js` | 植被、微缩动物、地形与河流 |
| `src/station.js` / `src/railway.js` | 车站、轨道、桥梁和火车 |
| `src/optimize.js` | 静态网格批处理 |
| `scripts/build-standalone.mjs` | 单文件构建与依赖许可内联 |
| [PROMPT.md](./PROMPT.md) | 可替换主题、季节和场景元素的简短复用 prompt |

## 演示边界

- 这是风格化收藏品演示，不是可制造的机械工程图或真实车站的测绘复刻。齿轮为同步装饰动画。
- 曲目「林间慢行」为代码内原创 Web Audio 合成旋律，不是实物八音盒录音。
- 1 场景单位约对应收藏品的 2 cm；底座约 25 cm 宽、5 cm 厚。微缩景物约为 1:100，树冠密度和高度做艺术压缩。
- 无账户、支付、真实订单或云端存储；系统字体不随模板分发。
- 需要 WebGL 和 Web Audio。低性能设备的帧率无保证；移动端布局/手势使用 Chrome 模拟验证，未宣称真机 iOS/Android 或其他浏览器引擎均已通过。

## Studio 预览素材

固定路径为 `preview/cover.png` 与 `preview/video.mp4`。封面和视频均来自本次提交的居中无侧栏版本；视频是真实浏览器录制，展示播放中的火车、旋转观察与初见视角复位。格式、大小、浏览器播放/跳转结果记录在 [QA.md](./QA.md)。

封面为 1280×800 PNG（约 329 KiB）；视频为同画幅、20 fps、10.2 秒的 H.264 MP4（约 1.80 MiB），无音轨并启用 faststart。两者均通过完整解码及浏览器检查。

登记：`autumn-letter` / `creative` / `sand`。清单、源码、封面和视频通过同一个 PR 提交。合并后由目标 Studio 环境负责人选取包含它们的已合并完整 SHA，更新服务端 `STUDIO_TEMPLATE_REF` 并完成画廊验收；PR 本身不代表已在 Studio 上架。参见[上架流程](../../docs/template-publishing.md)。

## 许可与署名

应用代码未另行指定独立开源许可证。微缩场景、程序化贴图和旋律由代码生成，品牌为演示命名；原始五张用户参考截图仅用于造型参考，不包含在提交中。

- Three.js 0.180.0 / OrbitControls / RoomEnvironment：MIT，见 [three-MIT.txt](./licenses/three-MIT.txt)。
- Lucide 0.468.0：ISC；继承的 Feather 图标为 MIT，见 [lucide-ISC.txt](./licenses/lucide-ISC.txt) 和 [feather-MIT.txt](./licenses/feather-MIT.txt)。
- 完整许可同时嵌入 `index.html` 的 `script#third-party-notices[type="text/plain"]`，单独分发入口仍保留依赖署名。
