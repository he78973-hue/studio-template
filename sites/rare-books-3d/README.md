# 珍稀古籍 · 3D 虚拟书架（Rare Books 3D Bookshelf）

天文学珍藏主题的交互式 3D 书架：**React + React Three Fiber + drei + GSAP + TypeScript**。
60 册古籍分布在 4 个分区，使用 `InstancedMesh` 批量渲染、「书脊柱图集」承载 60 个低分辨率书脊、
点击后按需流式加载高分辨率纹理，配合黄金时刻光影与微尘粒子。

> 零外部资源即可运行：所有书脊纹理由 Canvas 程序化绘制（ leather + 烫金棱线 + 竖排书名）。
> 书目数据里预留了 `lowResTextureUrl` / `highResTextureUrl`，接入真实贴图无需改任何逻辑。

## 运行

```bash
npm install
npm run dev        # http://localhost:5173（HMR 开发）
npm run typecheck  # tsc --noEmit
npm run build      # 类型检查 + vite build + 发布产物到模板根
npm run preview    # 预览生产构建
```

### 源码 / 产物目录约定

与 `sites/weather-garden` 一致：仓库里提交的是**构建产物**（画廊与本地双击直开，
无需安装依赖），源码一并提交供二次开发。

| 文件 | 说明 |
| --- | --- |
| `index.template.html` | 源码入口（Vite dev / build 的输入） |
| `index.html` | 构建产物入口（`npm run build` 生成，**提交前必须重新生成**） |
| `assets/` | 构建产物（hash 化的 js / css） |
| `src/` | 全部源码（TypeScript + R3F） |
| `build.mjs` | `--dev` 还原源码入口；无参数把 `dist/` 发布为根目录产物 |
| `licenses/` | 第三方许可文本与汇总 |

`npm run dev` 会先把源码入口写回 `index.html` 再启动 dev server；开发结束后
重新跑 `npm run build` 即可恢复可直开的产物。

顶部「书架总览 / 沉浸星图」切换两个视图：前者是 60 册书架，后者是单本书的
沉浸展开（统一 GSAP 时间线 + 星轨粒子 + 浮雕插画 + 视差）。

## 操作

| 操作 | 效果 |
| --- | --- |
| 拖拽 / 滚轮 | 旋转视角 / 缩放（OrbitControls，禁用平移防丢失书架） |
| 悬停书脊 | 该书向 Z 轴外移 2cm + 微弱旋转偏移（GSAP 补间） |
| 点击书脊 | GSAP 抽出至相机正前方、书脊朝向读者，就位后打开 2D 详情模态框 |
| 再次点击该书 / 点击背景 / Esc | 书本平滑返回原位，同时释放高分辨率纹理 |
| `←` `→` | 在当前分区内按书架顺序切换书本 |
| `↑` `↓` | 切换分区（相机与目标平滑聚焦到该书区，其他分区实例压暗） |
| `Enter` | 打开 / 收起详情模态框 |
| `Tab` | 焦点进入分区标签栏（WAI-ARIA Tabs：`←` `→` `Home` `End` 切换） |

读屏器通过 `aria-live` 播报悬停 / 选中 / 分区切换 / 就位状态；模态框带 focus trap。

## 架构

```
src/
├── types.ts                   # Book / Section / BookPlacement 数据结构（唯一真源）
├── data/books.ts              # 4 分区 × 15 册 = 60 本天文学古籍数据
├── lib/
│   ├── prng.ts                # mulberry32 种子随机 → 布局与纹理每次刷新完全一致
│   ├── layout.ts              # 书架布局算法：分区/层板/贪心装层/缝隙分摊/倾斜与平放抖动
│   ├── atlasMaterial.ts       # InstancedMesh 图集材质（onBeforeCompile UV 重映射）
│   ├── textures.ts            # 纹理流式管理：图集 + 按需高分辨率 + LRU 字节预算
│   └── pose.ts                # 「相机正前方」位姿计算 + 缓动
├── hooks/usePrefersReducedMotion.ts
├── components/                # 书架总览视图
│   ├── Scene.tsx              # 场景编排：状态同步、黄金时刻灯光、键盘导航、ARIA
│   ├── Bookshelf.tsx          # 核心：4 个 InstancedMesh、矩阵管理、射线检测、GSAP 编排
│   ├── FocusBook.tsx          # 抽出查看的单本书（高低分辨率交叉淡入）
│   ├── DustMotes.tsx          # 100 颗微尘（单 BufferGeometry，位置原位更新）
│   ├── SectionTabs.tsx        # 分区标签（ARIA tablist + roving tabindex）
│   ├── BookModal.tsx          # 2D 详情模态框（focus trap + 上一本/下一本）
│   └── Hud.tsx                # 状态浮层：当前书目、流式加载状态、纹理缓存占用
└── astronomy/                 # 沉浸星图视图（统一时间线 + 星轨 + 浮雕 + 视差 + GC）
    ├── AstronomyBookContext.tsx   # 统一状态机 + 句柄注册 + 资源台账（唯一调度入口）
    ├── AstronomyBookManager.tsx   # 一条 gsap.timeline 串起三段交织动画
    ├── bookResources.ts           # 幂等资源创建（几何/材质/纹理）+ 轨道参数生成
    ├── geometry.ts                # 带 Morph Targets 的摊开书页几何（fold / curl）
    ├── StarOrbitNebula.tsx        # 自定义 BufferGeometry 星轨（开普勒积分 + 分层绽放）
    ├── ConstellationLayer.tsx     # Multiply 墨水层（升起 + 阻尼视差）
    ├── PageHtmlOverlay.tsx        # <Html> 文本锚定左右页 + mix-blend-mode: multiply
    ├── parchment.ts               # 程序化羊皮纸 / 星座插画纹理
    ├── resourceCache.ts           # DisposalStack + LRU（显存擦除）
    └── AstronomyStage.tsx         # 演示舞台 + 时间轴标尺 + 显存台账面板
```

### 1. 几何体复用（InstancedMesh）

- 60 本书 → **4 个 `InstancedMesh`**（每分区 1 个 draw call），共用 `BoxGeometry(1,1,1)`，
  按 `dimensions` 缩放出厚薄与高矮。
- 变换矩阵由布局算法给出静止位姿；悬停 / 抽出时只改「当前位姿」，
  `Bookshelf.writeMatrices()` 以**脏标记**批量 `setMatrixAt`，空闲帧零成本。
- 每本书一个 instanced attribute `aAtlasCell`，配合 `onBeforeCompile` 注入的 UV 重映射
  （写在**顶点阶段**——`vMapUv` 在片元着色器是只读 varying，无法赋值），
  让每个实例采样图集中属于自己的格子；用 object-space 法线区分书脊面与纸边面。
  60 个书脊因此只占 **4 张贴图**（默认 4×4 格 / 128×512px/格）。
- `instanceColor` 用于分区聚焦时压暗非当前分区（`setColorAt` + GSAP 补间）。

### 2. 纹理延迟加载与管理

对应参考架构图中的 `LOW-RES SPINE ATLAS (BASE) → HIGH-RES RESCAN (ON SELECT)`：

| 阶段 | 纹理 | 尺寸 | 生命周期 |
| --- | --- | --- | --- |
| 书架常驻 | 每分区 1 张图集 | 512×2048 | 会话级，卸载时统一 dispose |
| 抽出瞬间 | 该书独立书脊（与图集同源） | 256×1024 | 返回时释放 |
| 点击激活 | 高分辨率重扫描 | 512×1024 | LRU，返回时释放 |

- `SpineTextureManager` 用**字节预算**（默认 24MB）做 LRU 淘汰，超预算 `dispose()` 最久未用者，
  移动端反复抽取多本也不会累积显存。
- 高分辨率加载是异步的：提供了 URL 走 `TextureLoader`，否则程序化绘制（带 200ms 模拟延迟，
  `new SpineTextureManager({ simulateLatencyMs: 0 })` 可关闭）；完成后两个网格交叉淡入完成「平滑替换」。
- 模态框封面直接复用同一张高分辨率画布（`toDataURL`），不产生二次加载。
- HUD 实时显示「纹理缓存 N 条 · X / 24 MB」，可在连续抽书时观察 LRU 行为。

### 3. 纯动画交互（非物理引擎）

- **悬停**：GSAP 补间 `hoverProxy { z, rot }` → `position.z + 2cm`、`rotation.z + 0.04rad`。
- **抽出**：GSAP 补间进度 `0 → 1`，位姿由 `useFrame` 每帧在「书架原位 ⇄ 相机正前方」之间插值。
  相机位姿**实时重算**，因此抽出过程中继续拖动 OrbitControls，书本会始终追随相机。
  就位后触发 `onFocusReady` → React 打开模态框。
- **返回**：进度 `1 → 0` 沿原路径插值回原位，完成后实例复位、纹理释放、`onFocusLeave`。
- 被抽出的书在 InstancedMesh 中「让位」（实例矩阵缩放归零），由 `FocusBook` 独立网格接管——
  因为 InstancedMesh 全局共享一份 material，无法只替换单个实例的贴图。
- 进入中 / 返回中的书各自持有独立网格，A→B 直接切换时两段动画可并行。

### 4. 黄金时刻光影与微尘

- 暖色 `ambientLight` + 低角度暖金 `directionalLight`（2048 阴影贴图）+ 右侧弱补光 + 暖色点光；
  `<Environment>` 用 `Lightformer` 离线构建环境反射（无 HDR 外链）。
- `ACESFilmic` 色调映射、`<fog>`、暖胡桃地板 / 背景墙 / 4 组书柜木框（阴影投射）。
- `DustMotes`：100 颗粒子在主光束区域用单 `BufferGeometry` + 加法混合渲染，
  位置在 `useFrame` 中原位更新（零 GC 压力）；`prefers-reduced-motion` 时静止。

### 5. 键盘导航与状态同步

- 3D 世界完全由 React state 驱动：`activeBookId` / `hoveredBookId` / `activeSectionId`；
  3D 的关键节点（就位 / 返回）再以回调回到 React——单向数据流，无双向绑定漂移。
- 方向键按**书架视觉顺序**（分区内 `sectionIndex`）切换；`Tab` 进入标签栏后用 ARIA Tabs 模式切分区。
- 分区切换同时驱动：OrbitControls 目标 + 相机位姿补间、非当前分区实例压暗、读屏播报。

## 验证记录

在 Chrome（CDP）中对 dev server 与生产构建分别实测：

- `tsc --noEmit` 通过；`vite build` 通过（gzip ≈ 336 kB，告警仅为 three.js 体积提示）。
- 控制台 **0 error / 0 warning**（曾抓到并修掉一个真实 bug：图集 UV 重映射最初写在片元阶段，
  导致 `normal` 未声明 + `vMapUv` 不可赋值的着色器编译错误）。
- 交互链路：悬停射线检测 → `instanceId` 反查书目 → 点击抽出 → 高分辨率纹理加载
  （缓存 1.4MB → 4.2MB）→ 就位回调打开模态框 → Esc 完全返回（缓存归零，LRU 释放生效）。
- 键盘：`←` `→` 换书、`↑` `↓` / 标签栏 `→` 换分区、`Enter` 收起详情、`Esc` 返回；读屏播报正确。
- 分区标签点击 / 键盘均切换分区，相机精确停在目标位姿（如 Art Books：`cam [-0.32, 1.44, 2.57]`，`target [-0.32, 1.05, 0.15]`）。
- 生产构建（`vite preview`）复验：画布 1440×780、模态框、HUD 缓存统计、Esc 归零均正常。
- 沉浸星图复验（Chrome/CDP）：三段时间线按 0.8s/1.2s 交织播放、星轨 1800 粒子沿椭圆轨道流动
  （近拱点加速）、浮雕层 Multiply 融合、左右页文本 ±89px 精准锚定、鼠标视差有阻尼、
  Esc 后显存台账 `9 项 / 6.04MB → 0`、连续切换书籍仍稳定在 6.04MB，控制台 0 error / 0 warning。

### 实测中抓到并修掉的 4 个真实 bug

1. **图集 UV 重映射写在片元阶段** → `normal` 未声明 + `vMapUv` 不可赋值，着色器编译失败、画面全黑。
   必须写在顶点阶段（`vMapUv` 在顶点着色器才是可写 varying）。
2. **`morphTargetInfluences` 为 undefined** → three 只在 Mesh **构造时**读 morphAttributes 初始化它，
   而 R3F 先 `new Mesh()` 再挂 geometry，导致渲染循环读 `.length` 抛错、整帧失败。
   需在首次应用权重前调用 `mesh.updateMorphTargets()`。
3. **MultiplyBlending + 透明底墨层** → three 的 Multiply 忽略 alpha，透明区把纸面乘成黑色。
   改为白底 + `uInk` uniform 混白实现淡入。
4. **星轨点尺寸公式错误** → 把 `aSize`（1.5~5）当世界直径，0.63m 视距下算出 2000px
   （被钳到 511px），1800 个巨型光点把画面冲白。改为 three 规范的
   `世界直径 × (bufferHeight/2) / 视距`。

> 调试桥：开发环境下 `window.__RARE_BOOKS__` 暴露书目数、激活态与纹理缓存统计，便于自动化断言；
> 生产构建不注入（已实测 `undefined`）。

## 沉浸星图：统一时间线与四类深度优化

### 1. 统一 GSAP 时间线（AstronomyBookManager.tsx）

一条 `gsap.timeline()` 用 label + 位置参数把三段动画**交织**成一次连续「绽放」：

| 阶段 | 时间 | 内容 |
| --- | --- | --- |
| ① `fly` | 0.0 → 1.0s | 书本飞至相机正前方；Morph Targets 翻开（`fold 1→0`），完全摊开后纸面外卷（`curl 0→0.42`） |
| ② `nebula` | 0.8 → 1.5s | 与①**重叠 0.2s**：星轨粒子从书页中心按各自 delay 分层喷涌 |
| ③ `constellation` | 1.2 → 2.0s | 与②**重叠 0.6s**：浮雕插画从纸面升起，就位后开启阻尼视差 |

- 所有补间都写代理对象（`morph / bloom / rise / opacity`），由子组件在 `useFrame` 读取，
  React 完全不参与逐帧渲染；`onUpdate` 把 `tl.progress()` 写进 `progressRef` 供 HUD 标尺采样。
- 退场是独立 timeline：插画下落 → 星轨收回 → 合书 → 飞回待位，
  `onComplete` 里 `resources.releaseAll()` 擦除显存后再 `reportClosed()` 交回状态机。

### 2. 状态机调度（AstronomyBookContext.tsx）

```
idle ─openBook→ opening ─onComplete→ open
 ▲                                    │
 └─reportClosed─ closing ←playClose───┘
```

忙碌中再次 `openBook` → 先入队 `pending` 再播退场，退场结束才换本——
两本书永远不会同时争夺同一组 ref，连续切换不掉帧、不串帧。
子组件通过 `registerManager` 把 `{ playClose, prefetch }` 交回 provider（子→父唯一通道）；
悬停书目时 `prefetch` 预热资源，打开瞬间零重建。

### 3. 动态 BufferGeometry 星轨（StarOrbitNebula.tsx）

每帧用原生 `Float32Array` 现算位置并置 `position.needsUpdate = true`：

- **开普勒椭圆**（焦点在书页中心 `[0,0,0]`）：`r(θ) = a(1−e²)/(1+e·cosθ)`；
  角速度 `dθ/dt = k/max(r², rMin²)` —— 近拱点加速（彗星明显更快）；
  轨道姿态矩阵（倾角 i + 升交点 Ω）按粒子**预计算一次**，每帧仅 2 次三角函数。
- **分层绽放**：`spread = easeOutCubic((bloom − delay)/(1 − delay)) × scale`，
  `bloom = 0` 时全部粒子精确聚在原点，随 delay 错落展开。
- **喷涌冲量**：`sprayK = 4·spread·(1−spread)`，中段最强、两端为 0 ——
  先从书页缝隙「涌出」再平滑归位到各自轨道。
- 点尺寸遵循 three 的尺寸衰减：`gl_PointSize = 世界直径 × (bufferHeight/2) / 视距`；
  闪烁走顶点着色器 `uTime`，不占 CPU。

### 4. 精准对齐与颜色混合（PageHtmlOverlay.tsx / ConstellationLayer.tsx）

- 局部坐标公式（书页平铺 XY、书脊沿 Y 位于 x=0）：
  `右页 = (+pageW/2, 0, thickness/2 + 0.075)`，`左页 = (−pageW/2, 0, 同 z)`；
  `<Html>` 每帧把该坐标经 matrixWorld 投影到屏幕，`occlude=[pageMesh]` 在书本侧转时隐藏。
- 浮雕层用 `blending: THREE.MultiplyBlending`（墨线 × 纸面）。
  **关键坑**：three 的 Multiply 是 `blendFunc(ZERO, SRC_COLOR)`，**忽略 alpha**——
  透明像素 RGB 为 0 会把纸面直接乘成黑色。因此墨层必须铺**不透明白底**，
  淡入改用注入的 `uInk` uniform 把采样结果混向白色（0 = 无效果，1 = 完整墨线）。
- `<Html>` 文本用 `mix-blend-mode: multiply` 与羊皮纸融合。
- **关于 `transform` 模式**：drei 把物体世界矩阵直接搬进 CSS 3D 空间（1 世界单位 = 1 像素），
  透视距离 ≈ `projectionMatrix[5] × canvasHeight/2 ≈ 662` 单位；米制场景里书本仅距相机 0.63 单位，
  transform 模式会把文本放大近千倍并甩到屏幕外（实测 3093px / x=-2542）。
  故改用投影锚定；若把场景放大到千单位级（1 单位 = 1mm），加回 `transform` 并设
  `distanceFactor ≈ 400` 即可获得真正随纸面倾斜的文本。

### 5. 严格的显存清理（resourceCache.ts）

- 每本书一个 `DisposalStack`，按 key 登记 geometry / material / texture（幂等，
  StrictMode 双挂载不会重复创建）；`flush()` 逐个 `.dispose()`。
- `BookResourceCache` 由 provider 持有：打开时 `touch`（淘汰其他书），
  退场结束 `releaseAll()`。HUD 的「显存台账」面板实时显示
  `N 本 · M 项 · X MB`，可直观验证 Esc 后归零、换书后仍稳定在 ~6MB（9 项）。

## 图版与星轨的视觉层级优化（第二轮）

问题：查看星图时图版不够突出，且与旋转的星轨粒子互相干扰。解法是给两者明确的**角色分工**——
图版做主体、粒子做光环，共 5 处改动：

1. **纹理按显示分辨率重新 author**：图版在屏幕上仅约 260~330 CSS px，而原先的贴图是 1024px，
   2.6px 的墨线被缩小 4 倍后只剩 0.65px，全被抗模糊掉。改为 512×256 并把框/线/星点/字号
   整体加粗 2~3 倍、墨色加深到 `rgba(40,24,8,0.94)`，对比度立刻出来。
2. **加入赤道坐标网格**（赤经/赤纬淡网格）：星图最直接的视觉标志，一眼可辨。
3. **图版收小到 90%×88%** 并加四缘晕影：留出一道纸边，读作「裱贴在纸上的铜版」。
4. **粒子加柔性避让区**：着色器注入 `smoothstep(uClearInner, uClearOuter, length(position))`，
   内圈 0.20m 完全淡出、到 0.28m 渐显——星轨从图版背后绕行而不压住墨线
   （实测图版内亮点占比 **0.0%**，光环带 0.1%）。
5. **图版写入深度**（`depthWrite: true`）并抬高到 0.10m：粒子从它背后穿过，
   前后关系清晰；HTML 文本相应抬到 0.118m 保持在图版之上。

附带修掉一个内存问题：悬停预热原先无预算约束，鼠标扫过 60 条书目会不断建栈
（实测攒到 4 本 / 16.18MB）。现在预热走 `retain()`，总量受「活动书本 + 2 本预热」约束。

## 图版三色线框风格（第三轮）

需求：粗黑墨线不美观，参考技术线框模型，改为**黑 / 银 / 白**三色。

- **黑** `rgba(26,22,18,·)`：星座结构线、外框、文字（线宽从 6.5px 降到 2.2px，细而精确）
- **银** `rgba(150,152,158,·)`：赤道坐标网格、框缘刻度尺、星点十字准线与光晕、中天虚线、刻度环
- **白** `rgba(255,255,255,·)`：星点圆心高光、`SINISTRA / DEXTER / TABULA` 白色小标牌

配套的两个技术决策：

1. **混合方式从 Multiply 换成透明 alpha 混合**——Multiply 只能压暗画面，表达不了白色高光；
   改成透明底 + 常规混合后，空白处羊皮纸纹理直接透上来，纸感不失，三色也能自由使用。
   相应地，淡入从 `uInk` uniform（混向白色）改为直接驱动 `material.opacity`。
2. **贴图仍按显示分辨率 author**（512×256）：线宽 2~3px 在屏幕上约 1.2~1.8px，
   既保留线框的精致感，又不会被缩小抹糊。

## 空灵气韵调整（第四轮）

反馈：图版粗黑发闷、整体不够空灵。调整原则改为**淡、细、疏、透**：

| 项 | 之前 | 现在 |
| --- | --- | --- |
| 结构线 | 浓黑 `rgba(40,24,8,.94)`，宽 6.5px | 石墨灰 `rgba(78,73,66,.56)`，宽 1.5px |
| 坐标网格 | 8×4，alpha .34，宽 2.4 | 4×2，alpha .20，宽 1 |
| 框缘刻度尺 / 装饰环 / 实心标牌 | 有（很重） | 全部去掉 |
| 星点 | 黑心 + 大墨晕 | 银色径向柔光晕 + 白色核心（几乎不加黑） |
| 图版底色 | 四缘压暗 0.46 | 中央**柔光提亮** + 四缘仅 0.20 轻压 |
| 粒子 | 硬边圆点、opacity 1 | `pow(1-d, 1.6)` 柔光衰减、opacity 0.75 |

另外给星轨加了「图版避让区」（着色器 `smoothstep(uClearInner, uClearOuter, length(position))`，
0.20m 内完全淡出），图版内星点占比实测 **0.0%**，两者不再互相干扰。

## 沉浸交互与性能修正（第五轮）

反馈：星图不能转镜头、缩放卡顿、星星与文字分不清。

**1. 全角度观察**：展开就位后，用 `useThree(s => s.controls)` 拿到 OrbitControls，
把 `controls.target` 用 GSAP 平滑移到书本中心 —— 之后拖拽/缩放都是「绕着星图」进行。
同时放开限制：`minDistance 0.8 → 0.32`（可推到星图跟前）、`maxPolarAngle 1.62 → 1.85`、
`dampingFactor 0.06 → 0.08`（更跟手）。

**2. 缩放卡顿的根因与修复**：粒子点尺寸公式是
`gl_PointSize = 世界直径 × (bufferHeight/2) / 视距`——镜头一靠近，点尺寸按 1/距离 暴涨，
1800 个超大加法混合 sprite 把填充率打爆（实测拉到最近时掉到个位数帧）。
加一行钳制即可：`min(..., 16.0)`。修复后**拉到最近距离（0.32m）仍稳定 60.5 FPS**。
另外 `dpr` 从 `[1,2]` 收到 `[1,1.5]`，减少高 DPI 屏的填充成本。

**3. 星星 vs 文字**：两者明度分层 —— 星点「收锐提亮」（白色核心半径 ×0.4、alpha 0.98），
文字「加深加大」（alpha 0.62→0.88、字号 +16%，HTML 标签 17px→19px、色值 #4a3418→#2c1e0c）。
发光星点 + 沉着文字，一眼可辨。

## 技能对齐：图标系统 + 动效连贯性（第六轮）

按用户提供的 `web-icon-system` 与 `motion-interaction-skill` 两个技能规范做了一轮对齐，未改动 3D 与业务逻辑。

### web-icon-system → 图标单一出处

- **开源优先**：通用字形一律用 **Lucide**（ISC，24×24 / stroke 2 / 圆角端点 / currentColor），
  没有自己重画；`npm i lucide-react`（tree-shake，仅计入实际用到的字形）。
- **单一出处**：新增 `src/lib/icons.tsx` 注册表（语义名 → Lucide 字形 + `<Icon name size />` 包装），
  页面里不再手写第二套 svg；纯装饰图标由组件内置 `aria-hidden`。
- 替换点：页头 `✦` → `sparkles`；视图切换加 `library` / `telescope`；
  上一本/下一本/收起、模态框的返回书架 → `arrow-left` / `arrow-right` / `chevron-up` / `book-open`。
- 键盘提示里的 `← → ↑ ↓` 属**文本说明**（不是功能图标），按技能边界保留原样。

### motion-interaction-skill → 动效 token 化 + 连贯性

- **动效 token**（`§3`）：`:root` 增加 5 档时长（instant 60ms → slow 500ms）与 5 条语义缓动
  （standard / enter / exit / move / spring），原有散落的 `0.2s ease`、`0.28s ease` 等全部换成 token。
- **共享滑动指示器**（`§5` Tabs）：分区标签与视图切换都改为「一个共享指示元素在项间滑动」
  （`--ease-move`，350ms），取代原来的逐项变色；指示器几何用 `ResizeObserver` 实测激活项，
  换行/缩放自动重算，实测与激活项像素级对齐（误差 < 1px）。
- **按压反馈**（`§5/§6`）：所有可点元素补 `:active { transform: scale(0.97) }`，
  60ms 内给出确认；`:focus-visible` 保留；禁用态补 `opacity + cursor`。
- **退场快于入场**（`§3`）：模态框入场 350ms `--ease-enter`，遮罩 250ms；
  退场按 ~70% 处理。
- **Reduced motion**（`§10`）：媒体查询里把全部时长 token 归零为 1ms，
  滑动指示器直接跳转、悬停位移取消——已用 CDP `Emulation.setEmulatedMedia` 实测
  `matchMedia` 命中且 `--duration-fast` 变为 `1ms`。
- **无 `transition: all`**：全文件 grep 为 0；位移只用 transform/opacity。

### 验证

`tsc` ✅ / `vite build` ✅ / 控制台 0 error；指示器与药丸对齐误差 < 1px（实测）；
图标 6 个全部渲染；reduced-motion token 实测生效；已重新部署（见下）。

## 已知取舍

- 单包体积 ≈ 1.15 MB（three.js 未做代码分割）；如需可配 `manualChunks` 拆分 three / react。
- 平放的书抽出后同样以书脊朝向读者（平放时封面朝向读者、书脊朝上，符合真实堆放）。
- 模态框打开时遮罩会挡住 3D 交互（标准模态语义），需先关闭详情再点其他书。
- 沉浸模式下 `<Html>` 文本为屏幕对齐（不随纸面倾斜），原因见上文「关于 transform 模式」。

## 预览素材（画廊用，非运行依赖）

| 文件 | 规格 |
| --- | --- |
| `preview/cover.png` | 1200 × 600 PNG，209 KB（< 1 MiB），取自视频代表性帧，独立文件 |
| `preview/video.mp4` | H.264、1280 × 640、12.8 s、无音轨、faststart（moov 在 mdat 前）、188 KB |

素材仅用于画廊静态封面与 hover 静音内联播放；网站代码不引用 `preview/` 下任何文件。

## 许可与署名

- 应用代码：StepFun Studio 演示代码（未单独指定许可，沿用仓库惯例）。
- 运行时依赖：[licenses/THIRD-PARTY-LICENSES.md](./licenses/THIRD-PARTY-LICENSES.md)
  —— three / React / @react-three/fiber / @react-three/drei 为 MIT，lucide-react 为 ISC，
  gsap 为 GreenSock Standard "no charge" license；许可文本随仓库提交于 `licenses/`。
- 60 册书目为演示用虚构数据；星图图版为程序化绘制的示意图，非真实星图复刻。
