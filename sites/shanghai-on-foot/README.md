# 上海路书 · Shanghai, on foot

一份可旋转、可逐站阅读的上海街区漫游模板：从武康大楼，经武康路与安福路，在淮海中路收尾。暖象牙白、树皮棕、砖红路线与金棕树冠组成梧桐街区的午后色彩。Three.js、Lucide、地图和照片均已打包到本地，查看页面不需要安装依赖或配置地图 API key。

## 静态预览与部署

在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/shanghai-on-foot/>。也可将 `index.html`、`favicon.svg`、整个 `assets/`、`data/` 和 `licenses/` 独立部署到静态 HTTP 服务。资源使用相对路径，支持子目录挂载。

请通过 HTTP 打开，不能直接双击 `index.html` 使用 `file://`：JavaScript 模块和地图 JSON 需要正常的 HTTP 加载环境。页面的资料链接需要联网，但地图、照片与阅读交互无需外部服务。`preview/` 仅供画廊使用，不是运行依赖。

## 编辑与构建

需要 Node.js 20.19+ 和 npm，在 `sites/shanghai-on-foot/source/` 中运行：

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
npm run check
npm run build
```

开发地址为 <http://127.0.0.1:5176/>。构建先生成 `source/dist/`，再由 `source/scripts/export-template.mjs` 更新模板根目录的静态入口、图标、`assets/` 和 `data/`。导出仅替换这四项生成内容；源码、许可、说明与预览素材保留。

| 路径 | 修改内容 |
| --- | --- |
| `source/src/style.css` | 网页语义色、字号、间距及桌面／手机布局 |
| `source/src/geometry.js` | 场景配色、投影与路线几何 |
| `source/src/places.js` | 九站文案、顺序与来源链接 |
| `source/src/scene.js` | 相机、取景、旋转、缩放与拾取 |
| `source/src/architecture.js`、`refined-landmarks.js`、`details.js` | 程序化建筑、材质与植被 |
| `source/public/data/` | 本地街区数据；轮廓 ID 更新后必须重新识别地标并运行检查 |
| `source/public/assets/CREDITS.md` | 三张公开许可照片的作者、来源与改编说明 |

可复用的简短制作提示词见 [PROMPT.md](./PROMPT.md)。

## 交互与内容边界

- 地图支持拖动旋转、滚轮和按钮缩放、朝北、返回全景；点击地图标记或地点列表可进入详情。
- 九站包含武康大楼、对街取景点、武康庭、巴金故居、罗密欧阳台、RAC Bar、wiggle wiggle、多抓鱼和淮海中路终点；上一站／下一站与地图联动。
- 七处地标按公开外观资料进行风格化建模。武康大楼以约 30 米高、八层作比例锚点；地块匹配、屋顶、背面、商店分界与庭院陈设并非测绘复原。
- 数据包含 780 个建筑轮廓、90 条道路；路线中心线约 2,185 米，含逛店与庭院绕行的行程估计为 2–3 公里、3–4 小时。红线不是实时人行导航；店铺营业、预约、地铁出口和现场过街情况需自行核实。
- 手机采用地图与滚动阅读区的上下布局；支持键盘、减少动态效果偏好及 WebGL／数据失败时的文字阅读回退。
- 无账户、支付、定位权限、分析埋点或后端。中文字体使用设备字体栈，跨系统字形会有差异。

## 预览素材与上架

`preview/cover.png` 与 `preview/video.mp4` 来自本次提交版本的真实浏览器呈现，使用相同的 1280×800 画幅。视频展示路线全景、武康大楼及其他站点的镜头切换，为 30 fps、无音轨、faststart 的 H.264 MP4；精确时长和体积见 [VERIFICATION.md](./VERIFICATION.md)。修改外观或演示交互后应同时更新两份素材。

根 `catalog.json` 登记 ID `shanghai-on-foot`、分类 `creative`、双语文案、`sand` 色调以及固定封面／视频路径。没有公开演示地址，因此省略 `previewUrl`。

本次交付是模板登记 PR。合并后由目标 Studio 环境负责人选择包含源码、清单及素材的已合并完整 SHA，配置服务端 `STUDIO_TEMPLATE_REF` 并验收画廊播放与封面回退；提交或合并 PR 不等于已在 Studio 上架。

## 许可与署名

- 模板自有代码未另行指定开源许可证，不将整个模板宣称为 MIT 或无条件商用素材包。
- Three.js 0.170.0 与其 OrbitControls／几何辅助代码：MIT；Lucide 0.468.0：ISC，含 Feather 来源的 MIT 说明。发行包许可在 `licenses/`。
- OpenStreetMap 数据经 OpenFreeMap／OpenMapTiles 提供，依据 ODbL 1.0 使用。页面保留署名；本地衍生数据及源快照随 `data/` 提供，说明见 [data/README.md](./data/README.md)。
- 武康大楼照片：Supanut Arunoprayote，CC BY 4.0；武康路 210 号照片：Shypanda，CC BY 3.0；巴金故居照片：Jpbowen，CC BY-SA 4.0。图片缩放、裁切并在界面中降饱和度；巴金照片的展示改编同样采用 CC BY-SA 4.0。完整原图与许可链接见 [assets/CREDITS.md](./assets/CREDITS.md)。
- 预览封面／视频是本模板的画面录制，包含武康大楼照片时保留上述作者与许可说明。本次录制不展示巴金照片；源码中的巴金照片及其改编仍按 CC BY-SA 4.0 单独提供。
- 地标、店名仅作地点识别，不表示商家背书。未确认开放许可的研究照片未随模板提交；橱窗图案为原创程序化色彩示意。
