# 素材与依赖说明

此模板包含概念应用代码、第三方摄影参考和 AI 编辑演示结果；下列许可分别适用，不将全部内容统一重新许可。

## 人物与场景

| 文件 | 来源与处理 | 权利说明 |
|---|---|---|
| `images/model-alternate.jpg` | [Andrea Musto / Pexels](https://www.pexels.com/photo/a-woman-in-a-beige-leather-jacket-and-white-pants-27383816/)；公开示例全身照片 | [Pexels License](https://www.pexels.com/license/)；不表示人物背书 |
| `images/model.webp` | 上述公开照片的裁切、人物前景提取和 WebP 转换 | 原图许可及人物相关权利仍适用 |
| `images/look-pink-full.webp`, `images/look-pink-top.webp` | 以同一公开示例人物和下表商品参考经 `gpt-image-2` 图像编辑，再提取人物前景；在页面明确标为预生成示例 | AI 输出不是精确试衣或品牌授权；不包含用户私人上传照片 |
| `images/city-window.jpg` | [Unsplash photo-1480714378408-67cf0d13bc1b](https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b)；窗景裁切 | [Unsplash License](https://unsplash.com/license)；未随源文件获得摄影师字段，不虚构署名 |
| `images/wood-floor-soft.jpg` | [Three.js 示例 hardwood2_diffuse](https://github.com/mrdoob/three.js/blob/dev/examples/textures/hardwood2_diffuse.jpg)；降低饱和度 | 保留 Three.js MIT 许可；源纹理没有单独随附的作者/许可字段 |

## 商品参考

逐项 URL 和商品名称见 `ASSET-SOURCES.json`。图片进行了裁切/尺寸调整/格式转换以配合界面展示。

- Colorful Standard：`knit-pink.webp`、`knit-beige.webp`、`cardigan-brown.webp`、`pants-beige.webp`、`shirt-white.webp`、`overshirt-brown.webp`、`pants-black.webp`、`scarf-pink.webp`。
- Shopify Dawn 演示店 / Mlouye：`bag-brown.webp`、`boots-beige.webp`、`bag-cream.webp`、`sandals.webp`。

商品摄影的版权属于相应权利人，来源未附开放再许可。此处记录其演示参考用途，不作额外权利授予；商用或再分发需确认权限或替换为自有/明确授权素材。应用内中文名称和推荐标签是搭配演示标注，不是品牌的准确商品数据或销售承诺。

## 代码、字体、数据

- 应用与 MUSE 概念标志：用户确认的模板代码，未另行指定开源许可证。
- React、React DOM、Scheduler、Three.js：MIT，许可原文在 `licenses/`。
- Lucide React：ISC；Feather 衍生图标的 MIT 说明保留在发行包许可中。
- Sharp：Apache-2.0；仅作为 Node 端依赖，原生二进制和其依赖没有随本仓库打包，安装时由 npm 获取。
- 中文/拉丁字体使用系统字体栈，没有再分发字体文件。
- 天气查询：[Open-Meteo](https://open-meteo.com/)，数据 CC BY 4.0；免费 API 限非商业使用，实际使用遵守其 [Terms](https://open-meteo.com/en/terms)。默认上海 22°C 是可编辑演示值。
- 服务端模型由部署方配置，使用和费用遵循所选提供商条款。预生成输出仅用于展示交互；模板代码不会附带服务密钥。
