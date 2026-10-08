# 主建筑实物筛选与街角样片实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 自主获取许可明确的免费建筑，将真实建筑接入现有检查台；合格后再制作小镇街角，不以占位物替代质量验收。

**Architecture:** 保留现有 P1 资产台；新增独立建筑资产清单和离线转换脚本，统一为本地 glTF。建筑导入、尺度与检查相机分离；清单分别记录“已获取”“技术验证”“视觉评审”，不能把下载成功当作主建筑通过。

**Tech Stack:** TypeScript、Three.js、Vite、Node test；Blender 4.5 LTS 仅用于本地离线转换，禁用源文件脚本。

---

## 范围与决定

- 用户已认可继续开发，允许泛中世纪欧式小镇，不限定特定城镇/模型；首轮免费。
- 三种选择：继续等待登录素材、从零程序建模、直接验证公开许可建筑。选第三种，不再依赖用户下载；原优质候选保留待选，不绕过登录。
- 第一次检查点只做建筑实物验证。若候选不足以近看，则记录具体缺陷，不拼一个貌似完成的低质量街区。
- 第二批（需第一批结果支持）：2–4 栋协调建筑、小街转角、地面与酒桶布置、固定机位和最小行走。暂不做 NPC、室内或天气。
- 在 `.preview/p2-worktree` 独立工作树实施，分支 `feat/town-p2-assets`；验证后合并回主工作区供本地预览，不自动推送。

## 任务 1：可追溯的建筑获取与转换

**文件：**新增 `asset-sources/building-sources.json`、`scripts/convert-buildings.py`、`scripts/register-buildings.mjs`、`public/assets/town/buildings/manifest.json`；测试 `tests/buildings.test.mjs`。

1. 下载 OpenGameArt 的 CC0 酒馆 Daniel Andersson 与小屋 Spiral，记录来源、归档 SHA256、作者、许可。预览素材不当作实物验收证据。
2. 写失败测试：建筑文件、哈希、所有 glTF 引用须存在且只引用自身目录；未评审不可 `accepted`。
3. 执行 `node --test tests/buildings.test.mjs`，预期在未生成 manifest 时失败。
4. 安全检查归档路径、文件大小，仅提取模型/贴图；不执行 unitypackage 或 blend 脚本。便携 Blender 从官方获取并核 SHA256。
5. 转换时 `--background --factory-startup --disable-autoexec`，只运行自己编写的转换脚本。保留原 UV/几何，不凭空补造建筑。旧材质显式重建并写清“近似迁移”，不能虚称原生 PBR。
6. 输出独立 JSON glTF 与纹理，记录尺度、网格/三角数、材质和局限；运行测试通过。

## 任务 2：建筑检查入口（不破坏现有样本）

**文件：**修改 `src/assets/catalog.ts`、`src/engine/renderer.ts`、`src/engine/inspection.ts`、`src/main.ts`、`index.html`、`src/style.css`；测试 `tests/inspection.test.mjs`。

1. 新增建筑尺寸的相机/地面测试，包括窄屏全景、近景及大建筑地面覆盖。
2. 跑 `node --test tests/inspection.test.mjs`，确认新增测试失败。
3. 增加酒馆/小屋选择，显示真实尺寸、三角数、原贴图规格和来源；加载态/异常不能提前启用。
4. 大建筑调整阴影与地面尺寸、最近/最远距离，重置后返回正确模型视图；小样本行为不变。
5. 新增建筑独立失败不影响原来的酒桶/木门/地面；记录候选待评审，不能宣称 P1 全部通过。
6. 重跑单测、类型检查和 build。

## 任务 3：浏览器实物验收与文档

**文件：**新增 `docs/reviews/2026-10-08-town-building-qa.md`，更新 `README.md`、`docs/assets/town-sources.md` 和阶段计划。

1. 构建后复用已确认属于本任务的 loopback 预览，记录实际端口、PID 和日志；不打开可见终端。
2. 新建自己的 Chrome DevTools 页面，桌面与 390px 窄屏测试选择/前后/近景/线框/光照/重置/失败；快照和截图实际检查。
3. 记录门窗厚度、正背面贴图、接地、材质与近景不足；决定主角、辅助建筑或淘汰。未达到标准保留不通过状态。
4. 运行 `node --test tests/*.test.mjs scripts/check-town-p0.mjs`，`node node_modules/typescript/bin/tsc --noEmit`，`node node_modules/vite/bin/vite.js build`。
5. 本地提交（作者 lynch），合并回主工作区，重新构建并验证入口。汇报检查点结果等待反馈，不自行推送。

## 后续任务（不抢跑）

通过建筑关后另列街角布局、移动/碰撞纯函数测试及场景页面计划。若两候选均不适合主角，下一步是升级实际美术资产或对优质候选完成正规登录获取，不扩地图掩盖问题。

## 第一批执行结果 · 2026-10-08

- [x] 任务 1：两栋原件获取、转换、许可与哈希登记完成。
- [x] 任务 2：五项检查台、大建筑机位、真实表面近景、失败隔离完成。
- [x] 任务 3：23 项自动检查、桌面/窄屏各 48 项浏览器断言和 5 种加载异常验证完成；已更新说明。
- [ ] 主建筑视觉关：不通过。酒馆的低密度墙面和贴片门窗需改造评估，小屋仅辅助候选。
- [ ] 街角场景与行走：未开始，不把本轮资产实检标为完整 P2。

当前检查点可供反馈；后续先做单立面材质/门窗升级对照，或更换主资产。
