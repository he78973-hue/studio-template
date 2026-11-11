# StepCode · iPhone Duo — 发布短片

用 LaunchMotion skill `bs-launchmotion-data-copper-device-orbits`（复刻自
[skillry.dev](https://skillry.dev/skills/bs-launchmotion-data-copper-device-orbits)）生成的 6.8 秒
发布短片：**StepCode 移动版 App 跑在真机形态的 Apple iPhone Duo 上**，视觉风格由 StepFun 品牌
UIUX 设计系统（new_brandskills）定义。单文件场景、零构建、零运行时依赖（仅 GSAP 与三个自托管字体）。

短片结构（沿用原 skill 的 6.8s 时间线）：S1 铰链处微拍拉远露出整机 → S2 标志性折叠、封面屏
（外屏）接力 → S3 展开归位，双屏分屏视图 + 标题 "Two screens. One agent."。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/stepcode-iphone-duo/>。场景内置了「无 HyperFrames 运行时则
自动循环播放」的回退，`file://` 直接双击打开也会自动循环播放；通过 HyperFrames 工具链
（`npx hyperframes preview/render`）打开则由其运行时驱动，可逐帧检查与重新渲染。

## 文件结构

```text
stepcode-iphone-duo/
├── index.html            # 场景：GSAP 时间线 + 双面板 3D Duo + 三屏 UI（单文件，约 28KB）
├── vendor/
│   └── gsap.min.js       # GSAP 3.14.2（标准许可，见下）
├── assets/
│   ├── inter.woff2       # Inter（SIL OFL 1.1）——界面文案
│   ├── lora.woff2        # Lora（SIL OFL 1.1）——大标题（StepFun 品牌英文衬线）
│   └── pt-mono.woff2     # PT Mono（SIL OFL 1.1）——全部结构化数据/元数据
├── preview/              # Studio 上架素材，不是网站运行依赖
│   ├── cover.png         # 默认封面与视频加载失败回退（终帧独立 PNG）
│   └── video.mp4         # hover、选中后输入框和详情预览的录制视频（H.264 无音轨 faststart）
└── README.md
```

## 真机尺寸依据（apple.com.cn/iphone-duo 技术规格）

| 状态 | 官方尺寸 | 场景比例 |
| --- | --- | --- |
| 展开 | 164.6 × 117.8 × 5.2 mm | 1000 × 700 px（1.40 : 1 横向近正方） |
| 闭合 | 84.1 × 117.8 × 11.3 mm | 500 × 700 px（单面板 1.40 : 1） |
| 内屏 | 7.6"（1878×2670） | 双面板并排 + 中央 1.5px 折痕 |
| 外屏 | 5.4"（1398×2034） | 折叠后朝外的封面屏 |

机身厚度按 5.2mm/84.1mm ≈ 6.2% 折算为 32px 侧壁；双屏内缘 2px 细边框几乎贴到折痕，
显示带 ≈4px，两半在中间是连着的。

## StepCode 移动端 UI（按桌面版重新设计，双屏分工）

- **左屏 · 会话列表**：StepCode 标 + `06 ACTIVE`、Signal Blue 主 CTA「新建会话」、搜索框、
  项目/分组 tab、6 条会话（蓝点=运行中 / 绿点=已完成，时间戳 PT Mono）、发丝线分隔。
- **右屏 · 当前对话**：标题 + `3 TOOLS · 12.4K TOK`、用户气泡、「✓ 已完成 · 工具调用 3 项」
  工具卡（流式光标）、`src/duo/layout.ts` diff 卡（−红/+绿品牌墨色）、files chips 行、
  输入框 + `step-5-preview` chip。
- **封面屏 · 紧凑续聊**：`AGENT · LIVE`、对话摘要、「外屏接着聊。折起来也不打断——」+ 光标、
  「更早」上下文行、输入框、`STEPCODE` 字标、`COVER · COMPACT` mono 角标。

## StepFun 品牌风格落地

Signal Blue `#00A9FF` 唯一强调色（≤3%，主 CTA / 运行中点 / 光标 / 发送键）；Marker Yellow
只做标题徽章一个圆点（≤1%）；Ink Black `#1A1A1A` 页面 + 48px 网格；PT Mono 排全部结构化数据；
中文界面用 PingFang SC（系统字体）、英文标题 Lora、界面文案 Inter；无投影，层级靠发丝线与表面
色阶；终帧右下角 `STEPCODE · IPHONE DUO · 6.8S · 1920×1080 · 30FPS` mono 角标让结构可见。

## 功能与使用边界

- **折叠/展开**：右屏以铰链为轴 194° 翻到左屏背后并抬升 64px 避让共面（z-fighting）；
  封面屏朝向按 φ+θ=180 调校，折叠停顿帧封面正对可读。屏幕为 panel 的直接 3D 子元素
  （自带 translateZ + backface-visibility），避免 Chrome preserve-3d 扁平化子元素的深度排序毛刺。
- **三块屏幕**均为静态 UI 快照（无真实交互、无数据请求）；`file://` 下字体与 GSAP 均为
  本地相对路径，可离线播放。
- **演示边界**：这是品牌发布短片，不是可操作的 App；会话列表、对话内容、diff 与 token 数均为
  演示数据，不代表 StepCode 真实产品能力；iPhone Duo 为 Apple 商标，本项目仅为设计学习用途的
  风格化演绎，与 Apple 官方无关。
- **已知限制**： PingFang SC 依赖系统字体（非 Apple 平台回落 Noto Sans SC / 系统无级黑）；
  视频为 6.8s 循环播放，无播放控件；4K 需自行以 `--resolution 4k` 重渲（时序不变）。

## 许可与署名

- 场景代码：StepFun Studio — 可自由用于 StepFun 产品内演示。
- GSAP 3.14.2：© GreenSock，标准许可（<https://gsap.com/standard-license>）。
- Inter / Lora / PT Mono：SIL Open Font License 1.1（Google Fonts）。
- 原始场景语言来自 LaunchMotion skill `bs-launchmotion-data-copper-device-orbits`；
  品牌规范来自 StepFun UIUX 设计系统 v2.0。iPhone Duo 外形数据来自 Apple 官方页面
  （apple.com.cn/iphone-duo），仅作比例参考。

## 预览素材

`preview/cover.png` 与 `preview/video.mp4` 为同一渲染的终帧与全片（1920×1080 / 30fps /
6.8s / H.264 无音轨 / faststart），随模板版本同步刷新；素材不是运行依赖。
