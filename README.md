# 3D Scenes · 中世纪欧式小镇

使用 TypeScript、Vite 与 Three.js 制作自然写实的欧式小镇场景。当前包含 **资产检查台 + P2 小街角首版**；有最小室外漫游，不是已经完成的整镇或第一人称游戏。

## 当前内容

- 本地石砌酒馆、茅草小屋、酒桶、拱形木门、铺石地面及 HDR 环境光。
- 模型旋转、缩放、正反面和近景机位、光照切换、线框检查。
- P0 视觉参考板、资产来源与许可记录、自动测试及浏览器验证记录。
- 已自主取得两栋 CC0 建筑并转换为 glTF；第一批已获用户阶段认可，原件冻结。小屋仍仅作辅助候选。
- 新增酒馆立面升级：2K 石墙 PBR、实际尺度 UV、20 扇窗实体格栅和 4 扇门厚；原始版 / 升级版切换保留机位与光照。`4c35bbe` 的立面效果已获用户认可并授权推送，不等于整栋 PBR 或完整街区验收；详见检查记录末尾的用户确认。
- `/street/` 新增独立街角：已认可酒馆、同作者联排配楼、石路/院墙/桶箱、人物高度观察、WASD/方向键与触屏按钮、拖动转头、保守碰撞、失焦暂停和重置。木梁/屋瓦仅做场景材质参数协调，不改写已认可资产，也不是新增完整 PBR。
- 街角首版 `2869e21` 已于 2026-10-08 获用户效果认可，作为后续迭代基线；屋瓦/木梁近景、配楼窗面、铺地重复、场景边缘和更长期性能仍有提升空间。认可范围见[街角检查记录](docs/reviews/2026-10-08-town-street-qa.md#用户效果认可)。

## 本地运行

已验证环境：Node.js 24.14.0。测试直接导入 TypeScript，使用支持原生 TypeScript 类型剥离的 Node.js 版本。

```sh
npm ci
npm run dev
```

开发服务仅监听 `127.0.0.1`，实际地址以启动输出为准。首页是检查台，**`/street/` 是街角漫游**，`/p0/` 是参考板，`/building-notes.html` 与 `/p1-notes.html` 保留资产制作时的历史检查记录。最新效果认可记录见文档末尾；不覆盖历史模型与纹理。

```sh
# 资产与逻辑测试
npm test

# P0 资料检查
node --test scripts/check-town-p0.mjs

# 类型检查与生产构建
npm run build

# 本地预览构建结果
npm run preview
```

2026-10-08 街角首版：33 项自动检查通过；街角桌面/窄屏各 23 项浏览器断言，旧检查台桌面回归 86 项；另覆盖街角 6 种加载/失败场景。Intel UHD / 1920×1080 / DPR 1，10 秒连续移动采样 561 帧，均值约 56.1 FPS、P95 33.2ms，仅为本次短路线，不代表所有视角或设备保证。多页面共享渲染依赖约 618.40 kB，仍有 >500 kB 打包警告。

## 建筑离线转换（仅重新制作资产时需要）

运行网站不需要 Python 或 Blender；glTF 产物已随仓库提供。重新转换需要 Python 3、`py7zr` 和官方 Blender 4.5.14 LTS：

```sh
python scripts/prepare-building-sources.py
# 将下列 blender 替换为本机已验证的 Blender 可执行文件路径；Windows 后台运行须显式隐藏窗口。
blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/convert-buildings.py -- .preview/building-sources
node scripts/register-buildings.mjs
node --test tests/buildings.test.mjs
```

下载脚本固定原包 SHA-256、拒绝重定向及越界路径，仅提取模型/纹理，不执行源包脚本或 Unity 内容。转换保留原几何/UV/颜色图，旧材质固定粗糙度只是近似迁移，不是凭空获得真实 PBR。脚本不会自动安装 Blender、Python 包或购买素材。原件、工具和转换日志留在 `.preview/`，不提交。

## 项目结构

### 酒馆立面变体的离线重建

运行网站已包含产物，不需要执行这些命令。仅在重新制作时：

```sh
node scripts/fetch-facade-materials.mjs
blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/upgrade-tavern.py
node scripts/register-facade.mjs
node --test tests/facade.test.mjs tests/variants.test.mjs
```

同样使用已验证的 Blender 4.5.14 LTS，Windows 独立运行须显式隐藏并记录输出。脚本核对来源哈希，不覆盖 `buildings/` 原件；独立产物在 `facade/tavern-v1/`。石墙图来自 Poly Haven / Rob Tuytel，CC0，按官方 2.5m 平铺尺度投影；不修改图片像素。木梁、屋瓦、基础与烟囱仍用原图，窗玻璃为不透明近似，没有室内。

### 目录

配楼重建（仅重新制作时）：`python scripts/prepare-street-house.py` → 使用上述安全后台参数运行 `scripts/convert-street-house.py` → `node scripts/register-street-house.mjs`。源包及 Blender 留在 `.preview/`，不提交；运行网页不需要这些工具。

| 目录 | 内容 |
|---|---|
| `src/` | 渲染、检查交互和资产目录 |
| `src/street/`、`street/` | 独立街角页面、场景、布局、移动与碰撞 |
| `public/assets/town/` | 运行资产与逐文件哈希台账 |
| `public/p0/` | 可直接访问的 P0 参考板 |
| `docs/` | 设计、来源与验收记录 |
| `scripts/` | 素材获取、本地服务及资料检查脚本 |
| `tests/` | 资产完整性和检查逻辑测试 |
| `asset-sources/` | 下载清单与待导入原包说明 |

`node_modules/`、`dist/`、`.preview/`、运行日志和待审核原包不进入版本库。历史验收文档中的本机 PID、绝对路径与临时端口仅用于记录，不能直接作为当前启动参数。

## 资料与素材许可

- [开发路线图](docs/plans/2026-10-07-medieval-town-plan.md)
- [P1 资产来源与运行时处理](docs/assets/town-sources.md)
- [P1 检查记录](docs/reviews/2026-10-08-town-p1-qa.md)
- [建筑实物检查记录](docs/reviews/2026-10-08-town-building-qa.md)
- [立面升级实施计划](docs/plans/2026-10-08-tavern-facade.md)
- [立面升级检查记录](docs/reviews/2026-10-08-tavern-facade-qa.md)
- [街角首版实施计划](docs/plans/2026-10-08-town-street.md)
- [街角首版检查记录](docs/reviews/2026-10-08-town-street-qa.md)
- [P0 参考图片来源与许可](docs/p0-town/sources.md)

第三方模型、贴图、HDR 和参考照片分别遵循其来源台账中的许可，保留原作者与许可链接；不要将素材许可理解为整个代码仓库的统一许可。
