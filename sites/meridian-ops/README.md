# Meridian · 全球运营指挥中心

全球运营数据看板静态模板，包含 KPI、大区达成、品类结构、营收趋势、贸易网络、告警及订单明细。无需安装依赖或构建。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/meridian-ops/>。

## 文件与发布

- [index.html](./index.html)：页面入口、演示数据与内嵌 SVG 图表。
- [assets/ops.css](./assets/ops.css)：响应式布局、深浅主题与动效。
- [assets/ops.js](./assets/ops.js)：主题切换、区域下钻、趋势切换、地图选择、搜索、排序和分页。
- [preview/cover.png](./preview/cover.png)：独立的模板画廊封面。
- [preview/video.mp4](./preview/video.mp4)：模板画廊录制预览。

静态发布只需要 `index.html` 和 `assets/`。`preview/` 为画廊素材，不是网页运行依赖。

## 功能与边界

- 深浅主题选择保存在 `localStorage`。
- 区域下钻与订单筛选联动；订单表支持搜索、排序和每页 8 条的分页。
- 时间范围切换展示不同演示趋势，贸易网络支持枢纽选择。
- 动效适配 `prefers-reduced-motion`；无 JavaScript 时保留静态图表、数据与正文。
- 所有运营数值、客户、订单和告警均为虚构演示数据；时钟显示本地时间，并不代表接入真实运营服务。
- Google Fonts 提供 Archivo、Noto Sans SC、PT Mono；字体加载失败时使用系统字体回退。页面其余资源均在本地。

## Studio 模板预览素材

固定使用 [preview/cover.png](./preview/cover.png) 和 [preview/video.mp4](./preview/video.mp4)，分别供静态封面及静音循环预览使用。封面保留独立 PNG；视频为实际模板录制，转换为无音轨、faststart 的 H.264 MP4，保留画面比例。预览文件随模板提交，不使用外部视频链接或 Git LFS 指针。

- 封面：2878 × 1558，约 364 KiB。
- 视频：1280 × 694，30 fps，约 28.63 秒，8.66 MiB。
- 本模板通过仓库根 [catalog.json](../../catalog.json) 登记到 Studio 的“工具”分类；标题、描述和素材路径均由该清单维护。素材路径为 `sites/meridian-ops/preview/cover.png` 与 `sites/meridian-ops/preview/video.mp4`，不复制到 Studio 的 public 目录。添加模板目录或 README 本身不会自动登记到画廊；清单变更合并后，再更新 Studio 的 `STUDIO_TEMPLATE_REF` 为包含清单、源码和素材的已合并完整 commit SHA。

## 已知演示限制

金额排序可用；更新时间字符串排序尚未正确按时间比较。切换趋势范围后，坐标刻度及辅助说明尚待完善。窄屏导航可横向滚动；表头排序和地图枢纽选择缺少完整键盘操作支持。正式业务接入前应完善这些行为及无障碍验证。

## 许可

完整模板未附明确的代码许可，不额外宣称 MIT 或无限制商用授权。对外分发前请确认相应权利。Google Fonts 中的 Archivo、Noto Sans SC 和 PT Mono 使用 SIL Open Font License 1.1。
