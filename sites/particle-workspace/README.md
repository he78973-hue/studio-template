# 粒子 Particle · 设计师灵感工作台

纸白、墨黑与细线组成的本地优先素材库。图片、网页书签、项目和笔记集中在同一个响应式工作空间。原生 HTML/CSS/JavaScript，无依赖安装或构建步骤。

## 启动

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/particle-workspace/>。也可单独托管本模板目录。备份校验需要 HTTPS 或 localhost 安全上下文；推荐通过服务器访问，不使用 `file://`。

网站运行文件：`index.html`、`styles.css`、`app.js`、`storage.js`、`backup.js`、`assets/`、`particle-extension.zip`。`preview/` 只供 Studio 画廊使用，网站代码不依赖该目录。

## 功能

- 上传、拖放、粘贴 JPG/PNG/WebP/GIF/AVIF，每张最多 12 MB；保存 HTTP(S) 网页链接及可选封面。
- 搜索、项目/标签/类型/收藏筛选、瀑布流或列表；近期项目、重命名、笔记和标签整理。
- 根据文件名和 URL 的本地规则建议标签。点击建议后才保存。
- 本地图像工作室：亮度、对比度、饱和度、黑白与预设；保存新副本或导出 PNG，保留原图。输出单边最多 2400px，GIF 导出静态帧。
- IndexedDB 逐条事务保存；同源窗口更新通知、同字段冲突核对、保存失败保留输入并重试。
- JSON 整库备份与原子合并恢复：包含图片字节、书签、项目、标签、笔记、收藏、Figma 链接和回收站。
- 回收站支持搜索、类型筛选、只读预览、恢复及确认永久删除。
- 保存并打开 Figma 文件链接，下载素材后手动拖入 Figma。
- `extension/` 提供 Chrome/Edge MV3 采集助手源码，下载包与源码同时保留。使用仓库子路径时，在扩展弹窗中设置完整工作台地址。

## 数据与恢复约定

资料库按当前 origin 和规范化模板路径隔离；目录入口与 `index.html` 共用同一份库，其他部署路径不会意外共用。更换地址时可以通过备份迁移。

先生成备份，再点击下载。恢复前检查 SHA-256、字段类型、项目引用和内嵌图片解码；之后展示新增/重复/冲突数量，由用户确认写入。备份是普通 JSON，完整性校验不认证来源。

恢复保留当前记录和已有设置；同 ID 不同内容另建确定性恢复副本，并改写项目引用。同 URL 的不同笔记不会丢弃。重复恢复同一文件且资料库未变化时不再新增。仅有相同图片地址不能证明字节相同，因此已有相对路径示例与备份内嵌图片可能分别保留。

上限：256 MB 文件、10,000 个素材（含回收站）、10,000 个项目；内嵌单张图片最多 64 MB。本地图片无法读取时停止生成；无法下载的远程图片保留引用并明确计数。离线恢复要求页面已载入；不支持离线冷启动。

永久删除会清理回收站和内部迁移快照中的对应素材，并保留不含图片/笔记的 ID 标记以阻止旧窗口重试复活记录。用户主动恢复旧备份时，使用新的恢复 ID。已下载的备份不随之删除。

## 演示边界

- 初始 12 份素材、三个项目及笔记方向为示例。工作空间使用通用称呼，没有提交个人资料库或导出的用户备份。
- 云账号、跨设备同步、视觉理解、语义检索、生成式图像编辑、自动网页截图及 Figma 自动插入尚未接入。界面明确显示状态。
- 浏览器扩展的接收确认页面可用；原生扩展安装及物理 iOS/Android 设备没有纳入本次验收。
- 保存重试队列位于当前页面内存中，关闭页面后不是后台离线任务。
- 浏览器清理站点数据会删除本地库，应自行保留导出的备份。

## 检查

在仓库根目录执行：

```bash
node --check sites/particle-workspace/app.js
node --check sites/particle-workspace/storage.js
node --check sites/particle-workspace/backup.js
python3 scripts/validate-catalog.py
```

运行本地服务器后打开：

- `sites/particle-workspace/tests/storage.html`：13 项原生 IndexedDB 回归。
- `sites/particle-workspace/tests/backup.html`：23 项备份、恢复、回收站回归。

这些测试建立并清理随机命名的数据库，不操作应用资料库。浏览器、媒体与清单验收记录见 [VALIDATION.md](./VALIDATION.md)。

## Studio 预览与发布

模板 ID 为 `particle-workspace`，在根 `catalog.json` 的 `tools` 分类登记，配色为 `ink`。预览固定使用独立 `preview/cover.png` 和实际浏览器录制的 `preview/video.mp4`。视频为无音轨、faststart 的 H.264 MP4，录制内容与模板相同；媒体参数与解码结果见验收记录。

封面为 1280×900、约 297 KiB；视频保持相同比例，30 fps、9.3 秒、约 610 KiB，展示工作台、素材库和素材详情。

本次提交仅登记模板，不修改 Studio 环境配置。PR 合并后，由目标 Studio 环境负责人选择包含源码、清单、媒体的同一个完整已合并 SHA，设置 `STUDIO_TEMPLATE_REF`，再验收封面、hover/focus、选中/详情播放及失败回退。没有提供可验证的公网 demo，因此未填写 `previewUrl`。

## 许可与署名

整体应用代码未声明独立开源许可证，不额外承诺 MIT 或无限制商用授权。SVG 研究封面为原创演示素材；Lucide、Unsplash 示例照片及品牌 token 来源见 [CREDITS.md](./CREDITS.md)，图标许可见 `assets/lucide-LICENSE`。仅使用系统字体回退，不分发字体二进制。
