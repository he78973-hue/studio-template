# 发布验证 · 2026-11-16

验证对象为本目录已构建的静态模板，以及 `source/` 中的 Node 接口版本。环境：macOS、Node.js 26.12.0、Chrome/CDP、agent-browser、FFmpeg/ffprobe 9.0.2。最低 Node 22.12 来自构建工具要求，本轮未额外使用该最低版本跑一遍。

## 构建与自动检查

在 `source/` 执行：

| 检查 | 结果 |
|---|---|
| `npm ci` | 成功；锁定依赖安装完成 |
| `npm test` | **24/24 通过**：7 推荐、2 静态示例身份匹配、9 缓存/异步客户端、6 服务端边界测试 |
| `npm run build` | 成功；静态产物导出到模板根，`base: "./"` |
| `npm run build:server` | 成功；完整接口版构建到 `source/dist/` |
| `npm ls --depth=0` | 成功；无缺失依赖 |

Vite 对包含 Three.js 的约 881kB 静态 JS 发出大于 500kB 的提示（gzip 约 241kB）；构建成功，未隐藏提示。字符串转义配置保留 GLSL 内容并避免生成文件的行尾空白。

在仓库根执行 `python3 scripts/validate-catalog.py` 与 `git diff --check`，退出码均为 0。已查看告警：存量 `step-studio` 封面为 1,134,675 bytes，超过建议 1 MiB；本模板的封面、视频符合建议大小，不修改其他模板或降低校验标准。

发布资源额外检查：18 张运行图片全部通过 Sharp 原始像素解码；与 `source/public/images/` 逐字节一致；入口引用的 favicon、JS、CSS 均为存在的 `./` 相对资源；依赖清单与锁文件一致。未发现个人绝对路径、常见密钥格式或私钥标记；私密环境文件、生成缓存和依赖目录由 Git 忽略。

## 静态浏览器验证

使用仓库根 HTTP 服务的 `/sites/muse-wardrobe/` 子目录；桌面 1280×960，移动视口 390×844。

| 场景 | 实际结果 |
|---|---|
| 初始资源 | 页面、图片、字体栈、图标、Three.js 全部使用本地资源；未点击天气查询时，外部请求 0、试穿 API 请求 0 |
| 两套预生成结果 | 四件套与仅粉色上衣分别加载对应 WebP，显示“预生成试穿示例 / DEMO”；场景始终只有一个人物图层 |
| 未提供示例的组合 | 选择白 T 等组合后提示暂无示例，显示原照；平铺显示实际所选衣服，没有伪造生成结果 |
| 上传与刷新 | 使用公开米色毛衣图测试本地上传，刷新后仍在；新上传衣物不冒用预生成结果，不发试穿请求 |
| 收藏 | 命名保存四件套，等待 700ms 后刷新；收藏保留，恢复入口正常。250ms 内立刻刷新可丢失最后修改，见下方限制 |
| 镜头与切换 | 全身、近景、平铺、真人、重置和两套示例切换正常；画廊录屏展示这些实际交互 |
| 灰模 | 分别打开 `?gray=1&view=front`、`diagonal`、`top`，确认体块/人物尺度/阴影；截图见 `verification/gray-*.png` |
| 房间检查 | 分别打开 `?view=front`、`back`、`left`、`right`；几何随相机改变，人物仍为面向相机的图片；截图见 `verification/room-*.png` |
| 移动布局 | 390px 视口下文档宽 375px，无横向溢出；人物、偏好、衣橱纵向排列，见 `verification/mobile-390.png` |
| 无障碍 | axe-core 4.12.1：**0 violations / 0 incomplete / 41 passes** |
| 浏览器错误 | 最终静态及 Node 预览会话均未捕获页面异常 |

鼠标下拉选择后不残留焦点圈、Tab/方向键可见焦点、弹窗 Enter/Escape、相机拖动及 reduced motion 在本次打包所依据的同版本界面中已测试；发布适配没有改动对应实现。硬件触控和真实鼠标滚轮未作设备级验证，不将合成事件等同于实机测试。

## Node 接口验证

`npm run build:server` 后通过 Node preview 打开页面，配置接口返回 `configured: true`、`model: gpt-image-2`、`foreground: true`。使用公开默认人物与四件套的已有生成缓存验证：

- `/api/tryon/config`、`/api/tryon/cache` 和对应 `/api/tryon/image/...` 均返回 200。
- 浏览器显示“已切换到试穿结果 / AI TRY-ON”，人物来自真实缓存接口；首次加载未提交新的模型生成。
- 该缓存仅在本机验证目录中，未随源码提交；没有密钥或私人上传照片进入模板。

接口实现此前已用真实 `gpt-image-2` 多图编辑和 macOS Vision 抠图验证；本次发布复测使用缓存，没有再次发起付费模型任务。先前同一四件套各一次测量为 medium 42.860s、low 46.312s，不足以推导平均速度或低画质更快，因此保持 medium。新环境的提供商权限、延迟、费用和非 macOS 抠图能力需部署方验证。

## 画廊媒体

| 文件 | 实测 |
|---|---|
| `preview/cover.png` | 独立浏览器截图，1280×960，**678,099 bytes**，PNG 完整解码成功 |
| `preview/video.mp4` | 实际页面录制后转 H.264 / yuv420p，1280×960、30fps、**11.866667s**、**745,411 bytes**、无音轨、faststart |

校验命令（仓库根）：

```sh
ffprobe -v error -show_streams -show_format -of json sites/muse-wardrobe/preview/video.mp4
ffmpeg -v error -i sites/muse-wardrobe/preview/video.mp4 -f null -
python3 scripts/validate-catalog.py
```

视频全片解码无错误，仓库校验确认 `moov` 在 `mdat` 前。Chrome 实际打开视频：`readyState=4`，seek 到 5s 后播放前进至 5.6019s；从末尾循环回 0.6701s，`ended=false`、`error=null`。已检查封面、视频分镜及本目录各视角截图，没有把合成动画当作页面录屏。

## 明确限制与上架状态

- 静态版只有两套预生成示例；新照片/衣物真实换装需运行 Node 源码并配置服务。房间为三维几何，人物为透明图片，不是人体背面重建或尺码仿真。
- IndexedDB 自动保存有 250ms 防抖，内存反馈早于事务完成；极快刷新/关闭可能丢失最近一次修改。持久化验证明确等待写入窗口后再刷新。
- 商品摄影未附开放再许可；素材/AI 输出/代码各自权利边界见 `CREDITS.md`，没有将整个包重新许可为 MIT。
- 当前证据属于本地模板与媒体验证。目标 Studio 环境和发布负责人尚待维护者指定；合并后仍需选择包含模板的完整已合并 SHA，并实际验证画廊读取、播放、选择及失败回退。**本 PR 不代表已上架。**
