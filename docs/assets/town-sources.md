# 小镇 P1：运行资产来源台账

更新：2026-10-08。当前仅包含已经存在于本机、通过哈希检查并在浏览器实际渲染的资产；主建筑尚未取得，`p1Accepted` 保持 `false`。

## 来源与文件

全部运行资产来自 Poly Haven，台账标记为 CC0-1.0。2026-10-08 复核其官方许可页，资产采用 CC0；站点宣传图、标志和网页文案不自动包含在资产许可内。[官方许可说明](https://polyhaven.com/license)

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
