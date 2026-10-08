# P2 小街角样片实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将已认可酒馆置入两栋建筑组成的小街角，交付本地浏览器中的人物尺度观察与最小行走，不扩大为完整小镇。

**Architecture:** 新建 `/street/` 多页面入口，现有资产检查台与已认可资产字节保持不变。新增配楼独立台账；纯数据布局和无框架移动/碰撞函数与 Three.js 场景分离。场景为固定晴天侧光，保留来源披露、失败禁用行走、失焦暂停和低端 GPU 的帧时记录。

**Tech Stack:** TypeScript / Three.js / Vite 多页面；Node test；Blender 4.5.14 禁用自动脚本离线转换；Chrome DevTools MCP。

## 设计选择与边界

用户已批准“小街角优先”并要求开始。继续仅打磨单栋会推迟空间体验，直接扩整镇会放大资产与性能问题；选择两栋建筑的小样片。配楼优先同作者 Daniel Andersson 的 Medieval House Pack（OpenGameArt CC0），不强用既有茅草屋，也不从零程序生成主建筑。下载后检查真实几何与许可，若不合适便不纳入。

入口视线对准酒馆与左侧配楼形成的转角。道路、低院墙、石阶和有限木箱/桶形成尺度参照，避免空展台；建筑约束取实际包围盒的保守碰撞范围，暂不进入室内/爬楼。屋瓦/木梁采用场景专属材质参数协调，原资产不改；不声称旧图凭参数变成完整 PBR。暂不加入植物包、NPC、天气循环或新引擎。

UI 为克制的场景手记：大幅实时画面，少量纸色浮层、墨绿按钮，入口/门前/街角预设和可展开来源/性能说明。键盘 WASD / 方向键移动，拖动转头，无需强制 Pointer Lock；触屏提供按住移动按钮。Esc、窗口失焦、标签页隐藏暂停并清空输入。加载失败不允许进入缺失场景。

## 任务 1：配楼获取、转换与台账

文件：`asset-sources/street-house.json`、`scripts/prepare-street-house.py`、`scripts/convert-street-house.py`、`scripts/register-street-house.mjs`、`public/assets/town/street/`、`tests/street-assets.test.mjs`。

1. 从官方来源页取公开 zip；HTTPS 固定主机、大小限制、安全枚举、只提取 blend/许可，不执行来源代码；首次取得后固定 SHA256 与字节数。
2. 先写文件哈希、原件冻结、依赖完整测试；`node --test tests/street-assets.test.mjs` 确认红灯。
3. Blender 隐藏后台 `--factory-startup --disable-autoexec --python-exit-code 1`，原几何/UV迁移，蓝窗降饱和、旧材质明确近似，导出独立 glTF。核验材质映射、尺寸、三角面与许可，不覆盖旧目录。
4. 运行登记及测试，记录来源/修改范围。提交本批来源与计划（作者 lynch）。

## 任务 2：布局与最小行走

文件：`src/street/layout.ts`、`src/street/movement.ts`、`tests/street-movement.test.mjs`。

1. 先测出生点可达、建筑不相交、相机/路线不穿墙、斜向速度不加速、dt 限幅、圆形玩家半径、墙边滑动和全场边界。
2. 函数 `movePlayer(position,input,yaw,dt,obstacles,bounds)` 将本地输入归一化，旋转到世界坐标，每小步分别解 X/Z 碰撞；拒绝 NaN/Infinity，长帧限制 0.05 秒，不穿越薄墙。
3. 世界坐标以米为单位，眼高 1.65m，半径 .28m，速度 2.4m/s；碰撞是保守二维障碍，不宣称复杂物理/台阶系统。
4. 静态布局数据包含建筑位置旋转、道具及出生/门前/街角视点，供渲染和测试共用。先验证测试再接输入。

## 任务 3：独立场景页、实景与异常验证

文件：`street/index.html`、`src/street/main.ts`、`src/street/scene.ts`、`src/street/style.css`、`vite.config.ts`；首页仅加新入口链接；`scripts/check-street-browser.mjs`、`docs/reviews/2026-10-08-town-street-qa.md`、README。

1. 两栋建筑保留尺度落地，复用原石路/HDR/桶，墙/石阶/箱为辅助几何；同套旧木材/屋瓦只做场景参数协调。阴影按场景区域设置，静态阴影按需更新。资源缺失必须明确报错，不能白材质假成功。
2. UI 与行走就绪状态关联；只在行走且焦点允许时持续更新，拖动备用转头；退出/重置/失焦清空输入。页面离开清理事件、纹理、几何与 RAF。
3. `node --test tests/*.test.mjs scripts/check-town-p0.mjs`、`npm run build`。旧资产检查台回归；独立隐藏服务只监听 127.0.0.1，记录 PID、实际端口与日志。
4. 本任务独立浏览器页，桌面和窄屏实际截图：入口、门前、转角、鸟瞰；至少验证加载失败、失焦、移动与边界、暂停/重置、来源和无横向溢出。记录实机连续帧时，不以按需刷新次数冒充 FPS。
5. 最多两轮针对性视觉修正。若仍不能作为正式品质基线，标为 P2 首版待评审，不宣称最终验收。更新来源和证据，作者 lynch 本地提交；不自动推送本轮新效果。

## 当前状态
- [x] 任务 1：同作者配楼，来源/包内许可/哈希核验，独立转换与台账。
- [x] 任务 2：米制布局、圆形玩家、分步碰撞、路线测试。
- [x] 任务 3：独立页面、实际渲染和移动、桌面/窄屏各 23 断言、旧检查台回归 86 断言、6 个异常场景。详见 QA，效果待用户评审。
