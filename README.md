# 掌门杀 · 修真门派

一款运行在浏览器中的**修真门派主题身份竞技卡牌游戏**（类三国杀规则），基于玄幻小说《修真门派掌门路》的世界观构建。

> 本工程复用自「学堂杀」的三国杀式内核（身份局 + 卡牌 + 技能引擎 + 房主权威联机 + 单文件构建），
> **第一阶段已完成**：移除「答题 / 年级 / 科目」体系，改造为可承载修真设定（修为 / 本命 / 法器 / 灵石）的基础内核；
> 楚秦门角色技能与修真机制将在此基础上逐步叠加。

## 当前状态（第一阶段）

- ✅ 身份局（主公 / 忠臣 / 反贼 / 内奸）+ 基础卡牌引擎完整可用（掌门路模式中 杀 / 闪 / 桃 / 酒 由功法·符箓·身法·丹药等修真变体承载，引擎 key 不变）
- ✅ 修真势力骨架：楚秦门、齐云、白山、御兽门、大周书院、青莲剑宗、南林寺、外海、天理门（9 势力，角色已按势力归类）
- ✅ 保留 AI 对手、房主权威联机（断线转 AI、中途接管）、单文件 HTML 双模式构建
- ✅ 已彻底移除：答题弹窗、题库（5,700+ 题）、年级 / 学期、出题范围、学分商店、战令 / 任务 / 错题本等学习生态
- 🚧 后续：修为 / 本命之物 / 法器 / 灵石等修真机制，以及楚秦门专属角色与技能

## 技术栈

- TypeScript 5.6（strict）+ Vite 5 + vite-plugin-singlefile + PeerJS 1.5
- UI 沿用 `innerHTML` 字符串模板 + 单一 `render()` 全量重绘架构
- 构建为**自包含单文件 HTML**，双击即玩

## 快速开始

```bash
npm install        # 首次安装依赖
npm run dev        # 开发服务器（HMR）
npm run build      # 构建两种模式到 dist/
```

| 产物 | PeerJS 方式 | 适用场景 |
|---|---|---|
| `dist/掌门杀.html` | CDN script 标签 | 体积较小，联机需联网 |
| `dist/掌门杀.bundled.html` | 内嵌 peerjs 包 | 完全自包含，联机可离线 |

## 命令一览

| 命令 | 说明 |
|---|---|
| `npm run dev` / `npm run dev:bundled` | 开发服务器（对应两种 PeerJS 模式） |
| `npm run build` | 同时构建两种模式 |
| `npm run build:cdn` / `npm run build:bundled` | 单独构建某一模式 |
| `npm run typecheck` | TypeScript 严格模式检查（`tsc --noEmit`） |
| `npm run smoke` | 单机冒烟（大厅 → 开局 → 出牌 / AI 推进） |
| `npm run smoke:net` | 联机冒烟（建房 / 加入 / 座位同步 / 中途接管） |
| `npm run smoke:skills` | 角色 / 技能定义完整性 + 无头 AI 对局自检 |
| `npm run smoke:cards` | 牌堆构成与牌库扩展包回归 |
| `npm run verify:dist` | 校验产物是否为自包含单文件 + 双模式差异 |
| `npm run clean` | 清空 `dist/` |

## 目录结构

```
src/
├── main.ts            # 入口：挂载 window 全局 + 初始化（无游戏逻辑）
├── core/              # 领域类型 / DOM / 音效 / 特效
├── data/              # 势力 / 角色 / 技能定义 / 卡牌 / 扩展包
├── profile/           # 本地档案（积分 / 段位 / 成就 / 个性化 / 配装）
├── game/              # 引擎：state / turn / rules / actions / skills / damage / ai / loop
├── net/               # 联机：房主权威协议 / PeerJS 双模式
└── ui/                # 渲染 / 大厅 / 手牌 / 战报 / 结算 / 弹窗
```

## 设计约束

详见 `AGENTS.md`（架构不变量：`G` 字段形状、内联事件全局挂载、模块无顶层副作用、产物必须自包含单文件等）。
