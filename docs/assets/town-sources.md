# 小镇 P1：运行资产来源台账

更新：2026-10-08（第一轮历史记录；后续建筑获取见文末新增章节）。本节仅包含已经存在于本机、通过哈希检查并在浏览器实际渲染的资产；主建筑尚未取得，`p1Accepted` 保持 `false`。

## 来源与文件

本节四项运行资产来自 Poly Haven，台账标记为 CC0-1.0。2026-10-08 复核其官方许可页，资产采用 CC0；站点宣传图、标志和网页文案不自动包含在资产许可内。[官方许可说明](https://polyhaven.com/license)

| 资产 | 作者 | 本地文件 | 合计字节 | 本轮结论 |
|---|---|---:|---:|---|
| [Wine Barrel 01](https://polyhaven.com/a/wine_barrel_01) | James Ray Cock | 5 | 2,232,743 | 保留：木条、铁箍与桶口可近看；等待用户视觉认可 |
| [Large Castle Door](https://polyhaven.com/a/large_castle_door) | Tina | 5 | 11,539,413 | 保留为细部检查基准，不作为酒馆门定稿 |
| [Cobblestone Floor 08](https://polyhaven.com/a/cobblestone_floor_08) | Rob Tuytel | 4 | 7,581,428 | 保留为材质候选；重复与掠射角仍是场景制作限制 |
| [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | Greg Zaal、Jarod Guest | 1 | 1,435,119 | 保留为 1K 环境照明，不作为背景照片 |

合计 15 个资产文件，22,788,703 字节（约 21.73 MiB）。下载日期：2026-10-07。本轮没有下载新增资产或修改原始资产字节。

逐文件下载地址、SHA-256、字节数及修改说明以 [manifest.json](../../public/assets/town/manifest.json) 为准；原始下载清单为 [polyhaven-downloads.json](../../asset-sources/polyhaven-downloads.json)。运行文件位于 `public/assets/town/`，构建时复制至 `dist/assets/town/`。

## 运行时处理

- 酒桶与门：原 glTF、bin、贴图不改写；平移居中落地，不更改米制尺寸。使用已有 ARM 贴图 R 通道补接 AO，强度 0.85，纹理各向异性上限 8。
- 石路：6 × 6 米测试平面，192 × 192 分段、73,728 三角面；2 米平铺尺度，3 × 3 次重复。颜色图采用 sRGB，其余贴图为线性数据。位移尺度／偏置为 0.018／-0.018 米，法线强度 0.7；均为检查初值，不是实地测量。
- HDR：生成 PMREM 环境照明，配合程序方向光；非实地光照重建。
- 2026-10-08 只修改检查台交互与地面整体机位，不改模型、贴图、材质初值或许可台账。

## 主建筑与未取得候选

当前 `asset-sources/inbox/` 只有说明文件，没有可导入建筑包。此前优先候选是 Pedro de Santi 的 [Medieval Building with interior](https://sketchfab.com/3d-models/medieval-building-with-interior-2d995df46dd4420093925736f411077b)。该链接仅为来源线索，不代表文件已取得或质量已通过；取得完整原包后，仍需核对随包许可、贴图、完整四面与近景表现。

按用户本轮选择，不继续获取建筑、不绕过登录、不从网页缓存提取受限资源，也不以程序建筑代替。其他候选的历史筛选情况见 [筛选说明](../../public/p1-notes.html)，其条款与下载状态在正式采用前须重新核验。

## 2026-10-08 后续开发：自主获取两栋建筑

用户随后授权继续推进，并明确素材主要由助手获取，风格不限于特定真实小镇。上述“暂不获取”仅为上一轮历史状态，现已更新。

| 建筑 | 作者与许可 | 实物数据 | 当前结论 |
|---|---|---|---|
| [Medieval Tavern](https://opengameart.org/content/medieval-tavern) | Daniel Andersson / Daniel74，hreikin 上传；CC0，随包说明一致 | 17.80 × 8.32 × 13.91m；8,017 三角面；55 网格；约 2.7 MiB | 结构与改造评估样本，不能原样成为近景主角：480px 石墙、蓝色窗面、贴片门窗 |
| [Old Medieval House](https://opengameart.org/content/old-medieval-house) | Spiral / Spiral Softworks；来源页 CC0 | 6.95 × 4.50 × 4.87m；1,206 三角面；2 网格；约 10.7 MiB | 只保留为乡村附属建筑候选，不替代街角酒馆 |

- 原包下载地址、字节数、SHA-256、许可证据：[`building-sources.json`](../../asset-sources/building-sources.json)。两包来自来源页直接公开下载链接，没有登录绕过或缓存提取。
- 转换产物、逐文件哈希及限制：[`buildings/manifest.json`](../../public/assets/town/buildings/manifest.json)。两个清单独立，原 Poly Haven 获取脚本不会删除建筑。
- 使用官方 Blender 4.5.14 LTS Windows 便携版；官方 SHA256 校验 `b9533d2397ac1984db4466fb23a7a4649391cca93f6e84209f9bcc60d071c8b9`。禁用自动脚本，运行本仓库自编转换脚本。
- 酒馆重建旧 Blender Internal 颜色图连接，保留几何和 UV；固定粗糙度 0.88、铁件 0.75、金属度 0，是保守近似，不是原生 PBR。
- 小屋保留 FBX 原尺度和两张 2K PNG，轴系转换为 glTF Y-up；屋檐 Alpha 使用 MASK 0.5，没有执行 Unity 包。
- 建筑检查地面分别扩大到 22m、12m，保持 2m 材质平铺。原酒桶、木门、地面仍使用 6m 检查平面。
- `p1Accepted` 仍为 `false`，主建筑状态为 `candidate-review`。网站可运行、模型可加载与视觉基线是不同关口。

当前结果和后续质量关见 [建筑检查记录](../reviews/2026-10-08-town-building-qa.md)。

## 2026-10-08 酒馆立面独立变体

第一批效果获用户阶段认可，已认可版本推送到 GitHub `main`（`766ca84`）。本轮保留原件，只新增 `facade/tavern-v1/`，不把阶段认可扩大为完整街角验收。

- 石墙：[Castle Wall Slates](https://polyhaven.com/a/castle_wall_slates)，Rob Tuytel，CC0；官方 2.5 × 2.5m 尺度。通过 Poly Haven 官方 API 获取 2K Diffuse、OpenGL Normal、ARM；原字节 MD5/大小与运行文件 SHA256 都已校验，未修改位图。
- 获取清单：[`facade-materials.json`](../../asset-sources/facade-materials.json)；模型原作者仍为 Daniel Andersson，保留 OpenGameArt 来源。
- 升级墙面仅 Level1/Level2 的 StoneWall，颜色 sRGB、法线与 ARM 为数据图；法线 0.65、AO 0.8、metallic 0。世界坐标投影 UV，避免用一张小图拉满整面墙。
- 20 扇矩形窗改为低饱和不透明玻璃近似，补 720 三角面的实体细格栅，合并一个网格；圆/半圆窗不强加矩形格栅。四门增加 0.06m 厚度、0.006m 倒角，保留原木图。
- 变体合计 9,161 三角面 / 56 运行网格，14 个文件、10,089,073 bytes（约 9.62 MiB）；原版 8,017 / 55。建筑包围盒在 1e-7m 容差内一致。
- [`facade/manifest.json`](../../public/assets/town/facade/manifest.json) 独立登记来源、哈希、修改范围与 `accepted:false`。屋瓦/木梁/基础/砖烟囱仍为旧图；没有室内、真实开窗或自由行走，不是整栋完整 PBR。

本轮视觉、失败降级和自动检查见 [立面升级检查记录](../reviews/2026-10-08-tavern-facade-qa.md)。
