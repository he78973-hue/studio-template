# 包豪斯道路 · Bauhaus Paths

中文交互阅读模板：四组跨页、八页正文，加一个包含三件作品的 Three.js 教学展台。靛蓝书封、浅色纸张和细线排版；无构建步骤、后端、账号或运行时网络依赖。

## 启动

直接用支持 WebGL 2 的现代浏览器打开本目录 `index.html`，或从仓库根目录启动：

```sh
python3 -m http.server 8876 --directory sites/bauhaus-paths
```

访问 `http://127.0.0.1:8876/`。部署时发布本目录入口及运行资源；`preview/` 只用于 Studio 画廊，网页本身不依赖封面或视频。

## 内容与操作

- 四组跨页依次为学校与校长、从观察到设计、形式与工坊、从课堂到作品。
- 上一/下一跨页、页缘点击或拖动；方向键逐页，Home/End 到首末页。`#spread-1` 至 `#spread-4` 支持刷新与历史恢复。
- 灰色观察练习：交换背景、显示色值；两块灰保持相同色值。
- 作品展台：台灯、几何棋具、瓦西里椅。拖动旋转、滚轮缩放；聚焦展台后方向键旋转、`+/-` 缩放、`0` 或按钮重置。模型无自动旋转。
- 窄屏将当前跨页的两页堆叠阅读；减少动态效果时即时换页。没有 JavaScript 时八页正文和三件作品说明仍可读；WebGL 不可用时保留静态结构示意。

## 真实内容与演示边界

原始阅读概述参考杭间、靳埭强主编《包豪斯道路：历史、遗泽、世界和中国》（山东美术出版社，2010），印刷第16—26、27—28页。新增形式/工坊内容参考 Frank Whitford《包豪斯》（林鹤译），印刷第106—121、138—139页；作品分别参考第139页台灯、第159页棋具、第185页椅子。页内资料面板有对应来源。

文字、图解和模型是原创的教学解释，并非原书电子版、课程逐项复刻或官方产品资产。台灯、棋具和椅子是近似比例的程序化模型，不是经实物测量的精密复刻；棋盘不可对弈。没有书籍扫描页、原作照片、私人 PDF、真实测量数据或购买功能。CSS 翻页为刚性书叶，不是纸张物理模拟。

## 依赖、许可与署名

- 原型自有代码与教学文案未另行声明开源许可证；不要据此推断对引用作品、书籍或商标的授权。
- Three.js r169：MIT；本地 classic-script 构建 `vendor/three.global.js`，见 `vendor/LICENSE-three.txt`，支持直接打开文件，不需要 CDN。
- Lucide Static 0.468.0：ISC / Feather-derived MIT；五个字形由 `icons.js` 统一渲染，保留 `assets/lucide/LICENSE` 和原始 SVG。
- 使用设备系统中文字体，不分发字体文件。书籍仅作资料参考，版权属于各权利人；本模板不主张官方关联。

## 验证

```sh
node --test sites/bauhaus-paths/tests/book-state.test.cjs sites/bauhaus-paths/tests/book-lifecycle.test.cjs
python3 scripts/validate-catalog.py
```

浏览器验收使用外部 `agent-browser` CLI 和已启动的 Chrome CDP 实例。在本目录服务于 8876 的前提下，从仓库根目录运行：

```sh
BAUHAUS_CDP=http://127.0.0.1:9223 python3 sites/bauhaus-paths/tests/browser-smoke.py
```

`BAUHAUS_BASE` 可覆盖页面地址；无脚本检查用同端口 `localhost` 避开已加载脚本的缓存。本脚本会操作对应 CDP 浏览器，请使用专用测试实例而非个人标签页。结果和截图写入本目录 `qa/`（git 忽略）。48 项检查覆盖直接打开、跨页/历史、拖拽、手机、焦点、3D 和降级；15 项 Node 测试覆盖翻页模型。

## Studio 预览素材

`preview/cover.png` 与 `preview/video.mp4` 均来自此次提交代码的真实浏览器画面，未混入桌面或书籍扫描。录屏演示翻页和三维作品查看；封面与视频保持相同比例。MP4 为 H.264、无音轨、faststart，具体尺寸/时长与播放验收记录见 `VALIDATION.md`。改变演示外观或行为时，需要同时更新这两个固定文件。

## 上架状态

本目录和根 `catalog.json` 共同构成登记。提交或合并 PR 不代表已经出现在 Studio：合并后由目标 Studio 环境负责人选择包含源码、清单、预览的完整已合并 SHA，更新服务端 `STUDIO_TEMPLATE_REF` 并验收画廊。此 PR 不修改 Studio 服务配置，也不自动合并。
