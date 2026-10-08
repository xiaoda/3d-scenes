# 酒馆立面升级与原版对照实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 保留用户已认可的酒馆轮廓和原版，完成可公平对照的石墙/窗面/门扇升级，为街角制作验证近景材料。

**Architecture:** 从已核验的原 glTF 离线生成独立变体，原文件不改动；新增 CC0 墙面 PBR 材质清单和变体台账。浏览器在同一个检查视口切换两个对象，保留相机、光照及检查状态；变体失败可退回原版，不把旧材质全部声称为 PBR。

**Tech Stack:** Blender 4.5.14 LTS 后台离线处理；TypeScript、Three.js、Node test、Vite、Chrome DevTools MCP。

---

## 设计决定

用户满意第一批并要求开始下一步。比较：换完整主资产会再次受下载和风格影响；直接扩街会放大近景缺陷；**本轮选现有酒馆的局部美术升级**，保留已认可结构并可一键还原比较。

- 石墙：合法获取 Poly Haven Castle Wall Slates 的 2K 颜色、OpenGL 法线、ARM；按官方 2.5m 尺度重新投影墙面 UV，消除原图拉伸。平面仍用法线而非夸大位移，不掩盖轮廓限制。
- 窗面：改为低饱和深灰绿、不透视的玻璃近似（没有室内），矩形窗补简洁实体格栅；不生成或修改位图，不用发光蓝片。
- 门扇：原几何加约 6cm 厚度和小倒角，保留原木纹；门不打开，不虚构室内。
- 木梁、屋瓦、砖烟囱暂保留原图。新增几何须有限制并计数，不能以程序建筑替代原建筑。
- UI 延续纸色/墨绿手记风格，仅增加“原始版 / 立面升级”切换与准确的改造说明。不做新首页、分屏双渲染器或无关动画。
- 本轮仍不是完整街角、自由行走或最终画质通过。原件作为阶段认可版本冻结，升级版另验。

## 任务 1：材质获取与离线变体

**文件：**新增 `asset-sources/facade-materials.json`、`scripts/fetch-facade-materials.mjs`、`scripts/upgrade-tavern.py`、`scripts/register-facade.mjs`、`public/assets/town/facade/manifest.json`；测试 `tests/facade.test.mjs`。

1. 写失败测试：原版 SHA256 不变；变体存在、来源与哈希完整；glTF 所有依赖已列入台账；石墙同时接颜色/法线/ARM，尺寸/门厚/格栅数量有转换记录。
2. `node --test tests/facade.test.mjs` 应在台账不存在时失败。
3. 使用官方 API 获得确定的下载 URL/MD5/大小。白名单、大小/哈希校验、原子写入，不从任意 URL 下载。所有文件留在项目，离线运行。
4. Blender `--background --factory-startup --disable-autoexec --python-exit-code 1` 导入原 glTF，仅执行仓库自写脚本。石墙世界尺度 UV、材质更新，新增门厚与矩形窗细格栅（合并为单网格）。导出到独立目录。
5. 清单记录原作者和新增材质作者、CC0、变更范围、原 glTF SHA256、转换统计；不覆盖原文件、不抹去质量限制。
6. 跑测试通过，核对三角数与原始包围盒，不改变整栋比例。

## 任务 2：同机位 A/B 检查

**文件：**修改 `src/assets/catalog.ts`、`src/engine/renderer.ts`、`src/main.ts`、`index.html`、`src/style.css`；新增 `src/engine/variants.ts`、`tests/variants.test.mjs`。

1. 先测版本选择和失败降级：`resolveTavernVariant('upgraded', false, true)` 应选择原版；两个均缺则不可用。布局尺寸基准必须一致，原版不受升级状态影响。
2. 引入升级版独立加载和资源释放；UI 仅在酒馆选择时显示版本切换；加载中/失败版本禁用。
3. 切换必须保留 camera/target、当前检查机位、光照、地面偏好与线框，不偷偷拉远或增强升级版光照。重置仍符合现有约定。
4. 标注“墙面 PBR，屋瓦/木梁仍为原图”；来源同时保留模型与墙材质，不只写其中之一。
5. 回归 `node --test tests/*.test.mjs scripts/check-town-p0.mjs`；类型检查与 Vite build。

## 任务 3：视觉与异常验证

**文件：**更新 `scripts/check-town-browser.mjs`、`README.md`、`public/building-notes.html`；新增 `docs/reviews/2026-10-08-tavern-facade-qa.md`。

1. 独立工作树 `.preview/facade-worktree` 内开发；只启动隐藏 loopback 服务，记录 PID/cwd/端口/日志。
2. 浏览器实际查看原/升级整体、正面、近景、背面，同机位同光照。检查石块尺度、接缝、窗格穿插、门厚、阴影，不凭代码成功判断画质。
3. 桌面1440×1000与窄屏390×844：切换状态、相机不跳、其他资产不退化；变体 glTF/材质缺失应只禁用升级版，原件可用。
4. 最多两轮针对性修正，若改造仍不值得则记录结论，不扩地图。
5. 自动测试与构建全部通过后提交（作者 lynch），合并主工作区并复用已有预览。新升级版待用户审阅，不擅自标为最终验收或推送未经要求的新版本。

## 状态

- [x] 任务 1：原件冻结、CC0 三图核验、独立 glTF 与台账完成。
- [x] 任务 2：版本切换和失败降级完成；同机位、同光照验证通过。
- [x] 任务 3：桌面/窄屏各 86 断言、6 个异常场景、实际截图检查通过；详见本轮 QA。升级效果仍等待用户评审。
