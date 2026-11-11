# Fourier Pelican · 傅里叶鹈鹕

双坐标傅里叶圆链的纯静态 Canvas 数学可视化。两条圆链分别控制笔尖的横、纵坐标，以 N = 1 / 5 / 10 / 20 / 50 逐级重建一条包含长嘴、喉囊、翘尾及双脚的鹈鹕闭合轮廓。纸底、蓝色轨迹与灰阶参考插画，完整动画约 26 秒。

## 本地预览与发布

在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/fourier-pelican/>。也支持直接用浏览器打开本目录的 `index.html`。

**运行仅需 `index.html`**，无安装步骤、框架、CDN、外部字体、后端或网络请求。CSS、JavaScript、路径、备用系数均内嵌。字体使用本机字体栈，不打包字体文件；不同系统的字形可能略有变化。

## 文件结构

```text
fourier-pelican/
├── index.html                  自包含网站入口
├── README.md
├── ref/bird.svg                外轮廓和命名插画图层
├── tools/
│   ├── bird-contour.mjs        参考坐标与曲线路径的生成源
│   ├── bird-parts.json         命名图层（含两只脚，不按子路径索引猜测部件）
│   ├── fourier.mjs             等弧长采样、DFT、误差和圆链边界
│   ├── fourier-data.json       生成的系数
│   ├── page.template.html      页面源模板，不可作为网站入口
│   ├── build.mjs               重新生成路径、系数和 index.html
│   ├── verify.mjs              静态回归检查
│   ├── browser-check.js       浏览器回归检查
│   ├── bird-preview.svg       生成的插画预览
│   └── contour-preview.svg    生成的数学轮廓对照
└── preview/
    ├── cover.png              Studio 静态封面
    └── video.mp4              Studio 实录视频
```

网站运行不读取 `ref/`、`tools/` 或 `preview/`。前两者用于可编辑源码与复现，后者只用于 Studio 画廊。

## 编辑与验证

可选构建工具使用 Node.js 标准库，无 npm 依赖。Node.js 18 或更新版本：

```sh
node sites/fourier-pelican/tools/build.mjs
node sites/fourier-pelican/tools/verify.mjs
python3 scripts/validate-catalog.py
```

修改 `tools/bird-contour.mjs` 的参考坐标或 `tools/page.template.html` 的页面实现，再构建；不要只修改生成的 `index.html`。构建路径相对脚本自身解析，可从任意工作目录运行。

在浏览器打开本模板、通过 CDP 连接 agent-browser 后，可执行：

```sh
agent-browser eval --stdin < sites/fourier-pelican/tools/browser-check.js
```

该检查覆盖初始化、误差单调性、521 个时间采样点的画幅边界和投影关系、真实 Canvas 圆链端点、6 个时间点的像素确定性、暂停无重绘和播放/重播/快捷键。

## 交互与演示边界

- 前 20 秒包含五个阶段，每阶段 4 秒；之后轮廓填色居中，并展示公式，26 秒时停止。
- 播放 / 暂停 / 重播；Space 播放暂停、R 重播、← / → 跳转一秒。
- `prefers-reduced-motion: reduce` 下初始暂停，由用户主动播放。
- `window.renderAt(t)` 为确定性绘制接口；`window.__ft.seek(t)` 暂停并跳转到 0–26 秒。
- 本模板是固定轮廓的教学/创意演示，**不包含图片上传、自动描摹、图像识别、用户存储或视频导出 UI**。预览视频由维护者在浏览器中录制，不是网站运行依赖。
- 眼睛和高光只出现在参考插画中，不作为断开的傅里叶笔画；外轮廓包含嘴、身体、尾巴和两只脚。

## 数学口径与限制

M = 2048 个等弧长样本，分别对 x(t)、y(t) 做实数 DFT，最高阶 50。x 链直接绘制，y 链交换几何坐标，使实际圆链末端与笔尖投影一致。

| N | 归一化 RMS error |
|---|---|
| 1 | 15.784% |
| 5 | 5.257% |
| 10 | 2.147% |
| 20 | 0.689% |
| 50 | 0.142% |

error 为同一参数下重建点与输入样本的二维距离 RMS ÷ 输入轮廓高度。它衡量对**手工描绘矢量路径**的重建误差，不是对原始图片的像素相似度。有限阶谐波会轻微圆化嘴根和脚踝等转角。浏览器 SVG 采样不可用时采用预算系数，error 显示破折号。

需要支持 Canvas 2D、Path2D、SVG 路径采样和 CSS aspect-ratio 的现代浏览器；未验证旧版浏览器。动画中的文字也是 Canvas 内容，页面另提供简要替代说明和原生播放按钮，不宣称完整无障碍数学图形阅读支持。

## Studio 预览素材

- `preview/cover.png`：1280×1100，181,366 字节（约 177 KiB）；同一模板、同一视口的 N=50 完整轮廓静态截图。
- `preview/video.mp4`：1280×1100、30 fps、26.43 秒、3,293,283 字节（约 3.14 MiB）；H.264 / yuv420p，无音轨，`moov` 位于 `mdat` 之前。
- 使用 agent-browser 对本次提交的页面进行完整实时浏览器录制，从第一阶到片尾公式；没有替换画面、拉伸、借用旧版本素材或引入桌面内容。FFmpeg 只进行无音轨 faststart 封装。
- 两份素材保持相同画幅，均为仓库中的真实文件，不是 LFS 指针。视觉/行为修改后需同时刷新它们，固定文件名不变。

验证记录：源码构建与静态回归通过，页面浏览器回归 30/30 通过；PNG 已在浏览器解码并审图，MP4 已完整 FFmpeg 解码并在浏览器验证播放、18.5 秒跳转和末尾循环。浏览器媒体检查从仓库读取完整视频字节，以 Blob 播放来排除本地 Python 静态服务器不支持 HTTP Range 的影响；生产媒体服务的 Range 请求和 Studio 实际播放器另需环境验收。

目录登记位于根 [catalog.json](../../catalog.json)：`fourier-pelican` / `creative` / `ink`。已有条目及顺序保持不变。`python3 scripts/validate-catalog.py` 通过，唯一 WARN 是仓库原有 `step-studio` 封面超过建议 1 MiB，本模板没有媒体警告。

**PR 不等于已上架。** 合并后，由目标 Studio 环境负责人选择包含模板、目录和媒体的同一个已合并完整 SHA，更新服务端 `STUDIO_TEMPLATE_REF`，再验收空闲封面、hover/键盘聚焦播放、选中预览、详情预览与视频失败回退。本提交未修改 Studio 配置、未部署生产环境，也不将未合并分支作为正式清单。详见[上架流程](../../docs/template-publishing.md)。

## 许可与署名

本实现未指定独立开源代码许可证，不额外宣称 MIT 或无限制商用。鹈鹕路径按提交者提供的角色参考图重新描绘；原始位图未包含在仓库中。角色、品牌标识及其相关权利仍归相应权利方，提交本模板不构成额外商标/角色授权；对外再分发前请确认相应权利。

没有引入第三方模板、运行时库、图片下载或字体文件。页面使用系统字体回退，因此不转授权任何本机字体。参见根目录 [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)。
