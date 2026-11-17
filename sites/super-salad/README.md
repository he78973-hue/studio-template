# 超级沙拉 · SUPER SALAD

把菜单变成一张有食欲的餐桌：深叶绿、柑橘橙与奶油白，九款餐品散铺陈列，点开餐盘后在旁边展开食材小票。包含可编辑的原生 HTML/CSS/JavaScript 源码和已构建静态入口。

**可复用 prompt：[DEVELOPER_PROMPT.md](./DEVELOPER_PROMPT.md)。**

## 直接预览与部署

在仓库根目录运行：

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/super-salad/>。静态托管时保留 `index.html`、`assets/`、许可文件和素材署名说明。资源路径为相对路径，支持子目录挂载。使用 HTTP 服务，不以 `file://` 运行模块入口。

运行资源全部本地打包，无 CDN、登录、后端或外部 API 依赖。`preview/` 是画廊展示素材，不是运行依赖。

## 编辑与重新构建

需要 Node.js 18+（符合 Vite 6 要求）及 npm。在 `sites/super-salad/source/` 中运行：

```sh
npm ci
npm run dev
npm test
npm run build
```

`npm run build` 生成 `source/dist/`，再导出到模板根目录的 `index.html` 和 `assets/`，不改写文档、许可或画廊素材。请编辑 `source/`，不要直接修改生成文件。修改外观或演示行为后，重新录制封面与视频。

菜单在 `source/menu.js`；配色、字号、间距和动效 token 在 `source/styles.css`；陈列与小票组件在 `source/dish-gallery.js`、`source/dish-gallery.css`。可选的图片裁切脚本使用 Python 3 与 Pillow，正常运行和构建不需要 Pillow。

## 体验与边界

- 九款演示餐品：五款沙拉、三款能量碗、一款橙汁；支持分类筛选。
- 悬停／键盘聚焦点亮餐盘；点击放大并展开食材、酱汁、过敏原说明、价格与加购小票。
- 购物袋可修改数量、移除餐品、查看总价，最多每款 20 份；刷新后保留选择。
- 订单预览为本地示例，不提交门店、不扣款；菜名、价格、配方、品牌标志和服务文案都是概念演示，不代表真实经营主体或商标注册状态。
- 桌面三列、手机两列，末项居中；原生弹窗支持 Escape、焦点恢复、滚动详情与减少动态效果。
- CSS 与 Web Animations API 共用动效 token；快速切换或关闭时取消旧动画，首屏装饰离屏／后台暂停。
- 购物袋使用同源 `localStorage` 键 `super-salad:bag:v1`；同源多个副本共享演示购物袋。损坏数据和存储不可用时可降级使用。
- 实测范围及设备限制见 [VERIFICATION.md](./VERIFICATION.md)。

## Studio 预览素材

`preview/cover.png` 与 `preview/video.mp4` 来自此提交版本的真实浏览器呈现。封面为独立 PNG；视频展示首屏、九款菜单、食材小票、加购和本地订单预览，格式为无音轨、faststart H.264 MP4。录制与解码数据见 [VERIFICATION.md](./VERIFICATION.md)。

根 `catalog.json` 将 `super-salad` 登记到 `marketing`，色调 `forest`；未提供公开 demo，因此不填写 `previewUrl`。

PR 合并后，由目标 Studio 环境负责人选择包含源码、清单和媒体的已合并完整 SHA，更新服务端 `STUDIO_TEMPLATE_REF`，再验收真实画廊播放与失败回退。提交 PR 或通过本地校验不等于自动上架。

## 许可与署名

- 自有代码与概念品牌未另行指定开源许可证，不将整套模板声明为 MIT 或无限制商用。
- Barlow Condensed 字体：SIL OFL 1.1，完整许可在 `licenses/OFL-BarlowCondensed.txt`；中文使用设备字体。
- Vite 生成的模块预加载辅助代码：MIT，核心许可保留在 `licenses/Vite-LICENSE.md`。开发工具依赖通过 npm 安装，模板不分发 `node_modules`。
- 新增希腊沙拉照片：zone41，CC BY 2.0；鸡肉沙拉：T. Bjornstad，CC BY-SA 4.0，裁切贡献保持同许可；鲜虾沙拉：Jon Sullivan，来源页记录为公有领域。小票中保留作者、来源、许可与修改说明。
- 原有六张照片及其抠图／裁切版本的个别来源与许可仍未核实，不声称已获商业使用或开放再分发授权。商用复用应补齐来源授权，或换成自有／已授权的餐品照片。
- 具体资产来源、原图链接、处理方法及许可边界见 [source/assets/ASSETS.md](./source/assets/ASSETS.md)。字体和开发工具的许可不扩展到照片。
