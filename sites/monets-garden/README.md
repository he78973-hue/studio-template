# 莫奈的花园 · 走进画中

**让一幅画，变成一场可以走进去的漫游。**

沿睡莲池与日本桥走进莫奈的花园，在画架旁读懂创作、晚年与浮世绘。
保留原画笔触，支持滚动漫游与手机触控；场景为艺术化演绎。

**Monet's Garden · Step into the Painting** — a painterly journey from Monet's
1899 water-lily painting to an imagined painting session, with sourced stories
about the artwork, his later life and Japanese influences.

## 运行

模板根目录已经包含构建完成的 `index.html` 和 `assets/`，可以直接部署到静态
HTTP(S) 服务；支持站点根路径和子目录。运行时无需 API Key、后端或外部 CDN。
ES modules / WebGL 资源需要 HTTP(S)；不把直接双击 `file://` 作为支持方式。

在模板仓库根目录预览：

```sh
python3 -m http.server 8080
```

打开 `http://localhost:8080/sites/monets-garden/`。

## 交互

- 点击“走入花园”，滚轮或章节按钮依次浏览：池畔 → 日本桥 → 光与倒影 → 穿过花径 → 遇见莫奈。
- 鼠标移动轻微环顾；手机上滑/下滑前后移动，横向拖动环顾，12px 后锁定方向。
- 点击桥或画家旁的标记阅读三组故事；阅读期间花园停止渲染。
- 方向键切换位置；故事标签支持左右箭头、Home/End；Escape 关闭介绍或返回首页。
- 暂停按钮停止环境动态并简化界面过渡；尊重系统“减少动态”。
- 弹窗 300ms 进入 / 180ms 退出，支持中途取消、连点和焦点恢复。

## 编辑与构建

需要 Node.js 20.19+ 或 22.12+，使用提交的 npm lockfile：

```sh
npm ci --prefix source
npm run dev --prefix source
npm run build --prefix source
```

构建会通过 `publish.mjs` 更新模板根目录的入口和运行资源。修改后提交这些产物，
并按上架规范重新录制封面与视频。依赖：Three.js 0.180、Lucide 0.468、Vite 7。

| 文件 | 适合修改的内容 |
| --- | --- |
| `source/src/content.js` | 五段旅程的名称、文案与观画位置 |
| `source/src/stories.js` | 三组故事、图片、事实与引用 |
| `source/src/main.js` | 首页名称、说明及交互状态 |
| `source/src/styles.css` / `deep-styles.css` | 字体、颜色、布局与动效 token |
| `source/src/deep-garden.js` | 空间路径、桥、画架与人物位置 |
| `source/src/painted-foliage.js` | 保留原画连续笔触的枝叶叠层 |
| `source/public/assets/` | 原画、抠图及本地字体 |

复用说明与提示词见 [DEVELOPER_PROMPT.md](./DEVELOPER_PROMPT.md)。

## 素材与史实边界

主画为莫奈《睡莲池上的桥》（1899）；该年夏天画家58岁。作画人物取材于萨金特
1885年的莫奈作画像，是艺术化拼接。晚年及橘园《睡莲》属于之后的时期，介绍中
分别标明。空间尺寸为推演，视角有界，不是实测复原或自由行走的完整吉维尼。

原画的整片垂柳、相邻色块和笔触方向被保留在不同深度中。不要把它们重新切成
大量随机颗粒，也不要用规则叶片或矢量花瓣替代。

## Studio 预览素材

`preview/video.mp4` 是本次模板的真实浏览器录屏；`preview/cover.png` 是从录屏
开场画面保存的独立 PNG，不依赖运行时截帧。
1280 × 720、30fps，视频展示进入、五段旅程、三组故事和返回首页。
视频为 H.264、无音轨、faststart；两份素材比例一致，独立于运行资源。
实际编码、时长、体积及浏览器播放验收记录见 [VERIFICATION.md](./VERIFICATION.md)。

## 许可与署名

应用代码未另行指定开源许可证。原画及历史图像的来源、使用依据和完整链接见
[CREDITS.md](./CREDITS.md)。Three.js 使用 MIT；Lucide 使用 ISC / Feather 衍生
部分 MIT；两组字体使用 SIL OFL；完整依赖文本保存在 `licenses/`。

PR 合并不等于已在目标 Studio 环境上架；需由维护者完成上游同步和环境版本接入。
