# 更新日志

本项目的所有重要变更都记录在此文件中。

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范与[语义化版本](https://semver.org/lang/zh-CN/)。

> 说明：本工程由「学堂杀 · 九科争鸣」派生（复用其三国杀式身份局 + 卡牌 + 技能引擎 + 房主权威联机 + 单文件构建框架）。
> 自 `0.0.1` 起为**掌门杀**独立版本线，历史学堂杀版本记录不再延续。

## [Unreleased]

### 计划中
- 修真机制：修为（体力 / 进阶）、本命之物、法器（装备体系）、灵石（资源）
- 楚秦门专属角色与技能，随后扩展上八门等势力
- 接入 `docs/` 立绘 / 美术资源

## [0.0.1] - 2026-10-29

首个掌门杀基础内核版本：在学堂杀框架上移除答题 / 年级 / 科目体系，改造为可承载修真设定的纯卡牌博弈内核。

### 新增
- 修真势力骨架（9 势力）：楚秦门、齐云、白山、御兽门、大周书院、青莲剑宗、南林寺、外海、天理门；现有角色按势力重新归类
- 类型层预留修真扩展字段（`cultivation` / `benming` / `fagi` / `lingqi`），供后续机制填充
- 掌门杀品牌与产物：`dist/掌门杀.html`（CDN）/ `dist/掌门杀.bundled.html`（内嵌 PeerJS 离线）

### 变更
- 工程更名 `xuetangsha` → `zhangmensha`；版本号定为 `0.0.1`
- 大厅改为「模式 → 设置」流程：保留势力 / 角色 / 身份 / 扩展包 / 牌库扩展包 / 回合限时 / 人数 / 座位 / 个性化 / 自定义扩展包管理
- 技能去答题化：主动技不再需要答题发动；华罗庚·统筹、高斯·算术研究改为「拼点」；居里夫人、施旺、马克思、亚当·斯密、王阳明等学识 / 学科类技能改写为纯机制技能
- 结算面板、座位卡、武将卡移除学识 / 连击 / 科目 / 年级展示
- 扩展包改为免费并列选项（无学分门槛），`packMeter` 简化为恒免费

### 移除
- 答题系统：`game/quiz.ts`、答题 / 复习 / 刷题弹窗、`参悟答题` 回合阶段、学识抵伤 / 当闪 / 濒死自救
- 题库与年级：`data/banks/**`、`bankLoader.ts`、`questionBank.ts`、`grades.ts`、`data/questions/**`（5,700+ 题）
- 学习生态：`ui/{study,drill,knowledge,bank,shop}.ts`、`profile/{credits,pass,missions,quizbook,learningAch,unlockCondition}.ts`、学分商店 / 战令 / 每日任务 / 错题本
- 联机协议中的 `quiz_response` / `ask_quiz_request` 消息与 `start_game.grade`、`room_state.grade` 字段
- 相关 npm scripts：`build:banks` / `audit:banks` / `verify:lazy`

### 修复
- 修复移除答题后各处的空引用与类型错误（`Player` / `GameState` / `Profile` / 技能效果原语 / 联机协议）

### 验证
- `npm run typecheck` 零错误
- `npm run build` 双模式构建成功；`npm run verify:dist` 自包含单文件校验通过
- `npm run smoke` 30/30（大厅 → 单机开局 → 出牌 / AI 推进），控制台零错误
- `npm run smoke:net` 22/22（建房 / 加入 / 座位同步 / 中途接管）
- `npm run smoke:skills` 12/12（角色 / 技能定义完整性 + 无头 AI 对局）

[Unreleased]: https://example.com/compare/v0.0.1...HEAD
[0.0.1]: https://example.com/releases/tag/v0.0.1
