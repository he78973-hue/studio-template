# ROAM 山行 · 徒步装备展厅

天蓝、白色和热粉组成的中文户外装备概念店。固定视角 2.5D 展厅使用透明商品摄影、挂轨、洞洞板与格柜，点击装备进入详情；包含完整的本地选购与演示结算流程。React 可编辑源码和构建后的静态入口一同提供。

## 静态预览与部署

在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/roam-outdoor/>。独立部署时保留 `index.html`、整个 `assets/` 及 `licenses/`。相对资源基址支持子目录挂载；使用 HTTP 服务，不以 `file://` 运行 React 模块入口。

运行资源全部本地打包，无外部 CDN、API 或后端依赖。`preview/` 是 Studio 画廊素材，不是网站运行依赖。

## 开发与重新构建

需要 Node.js 18+（满足 Vite 6 的版本要求）及 npm。在 `sites/roam-outdoor/source/` 运行：

```sh
npm ci
npm run dev
npm test
npm run build
```

构建先生成 `source/dist/`，再由 `scripts/export-template.mjs` 更新模板根目录的静态入口和 `assets/`，保留说明、许可、源码与画廊素材。修改外观或演示行为后，重新录制封面与视频。

```text
roam-outdoor/
├── index.html
├── assets/             # 本地脚本、样式、WebP、字体及 SOURCES.md
├── licenses/           # 运行依赖、字体和图标的完整许可
├── source/             # React / Vite 源码、锁文件与测试
├── preview/
│   ├── cover.png
│   └── video.mp4
├── VERIFICATION.md
└── README.md
```

## 功能与边界

- 展厅总览，以及服装、帽饰、背包、徒步鞋四类装备陈列。
- 商品共享元素转场、上一件／下一件、服装横向手势、颜色／尺码／数量、尺码参考和加购反馈。
- 购物袋支持规格合并、数量 1–99、删除、金额重算和刷新保留；旧色名及损坏记录有恢复处理。
- 收货表单校验、返回购物袋保留本次草稿、微信／支付宝方式选择、明确标注的演示付款回执和完成后清空购物袋。
- 键盘、Escape、焦点恢复、响应式布局与减少动态效果。无 View Transitions API 时仍可正常切换状态。
- ROAM、商品名称、价格、规格与服务文案均为演示内容。没有真实库存、订单、支付商户接口、物流或消息服务；“演示付款完成”不代表扣款或生成可履约订单。
- 购物袋存在当前源的 `localStorage` 键 `roam-shopping-bag-v1`；同源下多个本模板副本共享演示购物袋。收货信息仅保留在当前弹窗会话内，不上传、不写入持久存储；关闭弹窗后重置。
- 场景为固定视角的摄影式 2.5D，不是可自由旋转的服装三维模型。真机、Safari/Firefox 和低端设备帧率不在本次验证范围内。

## Studio 模板预览素材

固定使用 `preview/cover.png` 与 `preview/video.mp4`，来自本次提交版本的真实浏览器呈现；封面为独立 PNG，视频为无音轨、faststart H.264 MP4。具体尺寸、时长、校验及播放／跳转结果见 [VERIFICATION.md](./VERIFICATION.md)。录制展示展区切换、商品配置、购物袋与空白结算页面，不录入个人收货资料。

- 封面：1280×900，约 579 KiB。
- 视频：1280×900、30fps、19.57 秒，约 1.44 MiB。

根 `catalog.json` 登记 `roam-outdoor`，分类 `marketing`，色调 `sea`。素材路径分别为 `sites/roam-outdoor/preview/cover.png` 和 `sites/roam-outdoor/preview/video.mp4`。未提供公开演示地址，因此不填写 `previewUrl`。

PR 提交或合并并不自动上架。合并后由目标 Studio 环境负责人选择包含源码、登记和素材的已合并完整 SHA，设置服务端 `STUDIO_TEMPLATE_REF`，再验收真实画廊封面、hover/focus、选中预览及失败回退。本 PR 不修改 Studio 部署配置。

## 许可与署名

- 模板自有代码和 ROAM 标志未另行指定开源许可证，不将完整模板声明为 MIT 或无限制商用素材包。
- React、React DOM、Scheduler：MIT。Lucide：ISC，Feather 衍生部分 MIT；完整发行许可在 `licenses/`。
- Barlow Condensed、Manrope、PT Mono：SIL OFL 1.1；完整字体许可在 `licenses/OFL-*.txt`。中文采用设备字体栈。
- 商品摄影来自 Montane、Cotopaxi 与 Lems 的公开商品 CDN，并进行了抠图、裁切或调色。它们是第三方参考素材，不属于 ROAM，也不表示关联或背书；公开 URL 不等于开放再分发许可，本提交不声称取得其开放或商业使用授权。商业使用前应替换为自有或已获相应授权的商品摄影。
- 每个图片文件的原始链接、所属品牌、加工说明及字体来源见 [assets/SOURCES.md](./assets/SOURCES.md)。依赖的 MIT/ISC/OFL 许可不能推及商品照片。
