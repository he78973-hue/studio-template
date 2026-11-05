# AURELLE · 静奢护肤与高定美妆

美妆品牌电商静态模板，包含品牌介绍、产品展示、搜索、快速查看和本地购物袋。SVG 产品插画与图标已内嵌，无需安装依赖或构建。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/aurelle/>。

## 文件与发布

- [index.html](./index.html)：页面入口、内嵌插画和图标映射。
- [assets/css/style.css](./assets/css/style.css)：响应式布局和动效。
- [assets/js/main.js](./assets/js/main.js)：抽屉、搜索、快速查看与购物袋交互。
- [assets/svg/favicon.svg](./assets/svg/favicon.svg)：站点图标。
- [preview/cover.png](./preview/cover.png)：独立的模板画廊封面。
- [preview/video.mp4](./preview/video.mp4)：模板画廊录制预览。

静态发布只需要 `index.html` 和 `assets/`。`preview/` 为画廊素材，不是网页运行依赖。网页运行资源均位于本地，字体使用系统字体栈。

## 功能与边界

- 搜索实时筛选产品；快速查看支持数量选择和加入购物袋。
- 购物袋支持数量修改、移除、小计计算，并通过 `localStorage` 保存。
- 移动端菜单、购物袋、搜索和快速查看浮层支持关闭及 Escape 操作。
- 产品、文案、价格、服务承诺和品牌信息均为演示内容。真实销售前应替换并审核。
- 账户入口和结算仅显示演示提示，没有登录、订单、库存、支付或邮件后端。
- 订阅表单只更新页面提示，**不会发送邮件、生成会员或保存订阅**；页面中的成功提示不能视为真实投递结果。
- 配送、退换、社交等部分链接为占位入口。完整的键盘焦点管理、真实业务服务和生产级无障碍验证需在正式接入时补齐。

## Studio 模板预览素材

固定使用 [preview/cover.png](./preview/cover.png) 和 [preview/video.mp4](./preview/video.mp4)，分别供静态封面及静音循环预览使用。封面保留独立 PNG；视频为实际模板录制，转换为无音轨、faststart 的 H.264 MP4，保留画面比例。预览文件随模板提交，不使用外部视频链接或 Git LFS 指针。

- 封面：2878 × 1558，约 563 KiB。
- 视频：1280 × 694，标称 30 fps，约 27.28 秒，8.48 MiB；末尾保留原录制的短暂停帧。
- 本模板通过仓库根 [catalog.json](../../catalog.json) 登记到 Studio 的“营销”分类；标题、描述和素材路径均由该清单维护。素材路径为 `sites/aurelle/preview/cover.png` 与 `sites/aurelle/preview/video.mp4`，不复制到 Studio 的 public 目录。添加模板目录或 README 本身不会自动登记到画廊；清单变更合并后，再更新 Studio 的 `STUDIO_TEMPLATE_REF` 为包含清单、源码和素材的已合并完整 commit SHA。

## 已知演示限制

页面的滚动显现依赖 JavaScript 正常执行；禁用脚本时部分正文会隐藏。减少动画偏好可取消入场动效，但公告栏仍自动轮换。390px 窄屏测试通过；375px 及更窄屏幕的顶栏仍存在挤出和缩放问题。浮层的完整焦点约束、返回焦点及关闭状态的键盘隔离尚待补齐。正式业务接入前应完善这些行为及无障碍验证。

## 许可与署名

页面保留 `© 2026 AURELLE`。完整模板未附明确的代码许可，不额外宣称 MIT 或无限制商用授权。

内嵌图标来自 Font Awesome Free 7.3.1，版权归 Fonticons, Inc.：SVG 图标依据 CC BY 4.0，相关字体依据 SIL OFL 1.1，代码依据 MIT。详见 [Font Awesome 许可](https://fontawesome.com/license/free)。保留 HTML 中的原图标署名和图标映射内的版权注释；该许可不能推及整个模板。
