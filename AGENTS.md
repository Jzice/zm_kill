# AGENTS

This file provides guidance to agents when working with code in this repository.

## Repository Overview

掌门杀 (Zhangmensha) is a browser-based, Sanguosha-like identity card game themed on the 修真 (cultivation) world of 《修真门派掌门路》. It was forked from 「学堂杀」 and refactored: the original single-file HTML game became a modular TypeScript project that builds back to a **single self-contained HTML file**. **Phase 1 removed the entire quiz / grade / subject system**; the engine is now a clean card-battle kernel with a 修真 faction layer, ready for cultivation mechanics (修为 / 本命 / 法器 / 灵石) to be layered on later. The default rule mode is now **掌门路 (zml)**; the original 「学堂杀」 classic Sanguosha mode is retained as an optional legacy mode in the lobby picker (may be removed later).

Stack: TypeScript (strict) + Vite + `vite-plugin-singlefile`. No runtime framework; the UI is string-templated `innerHTML` re-rendered from a single state object.

## Commands

```bash
npm install          # first time only
npm run dev          # dev server with HMR (PeerJS CDN mode)
npm run dev:bundled  # dev server with bundled PeerJS
npm run build        # build BOTH modes into dist/
npm run build:cdn        # dist/掌门杀.html          (PeerJS via CDN <script>)
npm run build:bundled    # dist/掌门杀.bundled.html  (peerjs npm pkg inlined, offline-ready)
npm run typecheck     # tsc --noEmit (must pass with zero errors)
npm run clean         # remove dist/
```

Smoke tests (headless Chromium via playwright-core, auto-starts a static server):

```bash
npm run smoke          # node scripts/smoke.mjs "掌门杀.html"      大厅 → 单机开局 → 出牌/AI
npm run smoke:net      # node scripts/smoke-net.mjs "掌门杀.html"  双标签联机：建房/加入/同步/接管
npm run smoke:skills   # 角色/技能定义完整性 + 无头 AI 对局自检
npm run smoke:cards    # 牌堆构成与牌库扩展包回归
npm run verify:dist    # 校验产物为自包含单文件 + CDN/bundled 双模式差异
```

## Build Architecture (read before changing build config)

- `vite.config.ts` reads `VITE_PEERJS_MODE` (`cdn` | `bundled`, set by `scripts/build.mjs` / `scripts/dev.mjs`). It controls three things via small local plugins: (1) alias `#peer` to either `src/net/peer.cdn.ts` (reads global `window.Peer` from a CDN script tag injected into `index.html`) or `src/net/peer.bundled.ts` (`import Peer from 'peerjs'`); (2) `transformIndexHtml` injects the PeerJS CDN script tag in cdn mode only; (3) `closeBundle` renames `dist/index.html` to `掌门杀.html` / `掌门杀.bundled.html`. `emptyOutDir:false` lets both artifacts coexist.
- `vite.config.ts` sets `root: src/`, so `index.html` references `/main.ts` (not `/src/main.ts`).
- `src/types/peerjs.d.ts` is a hand-written minimal declaration covering both the global `window.Peer` and `module 'peerjs'`.
- **No question bank / grades / banks are generated anymore** (Phase 1 removed them). Do not reintroduce `build:banks` / `audit:banks` / `verify:lazy` scripts or `data/questions/**`.

## Source Layout (`src/`)

- `main.ts` — the ONLY place with init side effects: mounts window globals for inline `onclick` handlers, then runs the init sequence. No game logic here.
- `core/` — `types.ts` (all domain types incl. the `NetMessage` union), `dom.ts` (escapeHtml/sleep/inputValue/togglePanel), `sound.ts` (WebAudio SFX), `fx.ts` (DOM animation layer).
- `data/` — pure data + derivation: `factions.ts` (**九大门派** + 主公技 `zml_lord_*`), `characters.ts` (**原著角色池 48 人**，`CHARACTERS` 直接引用 `zml/characters.zml.ts`；同时导出 `ROLES`/`ROLE_CONFIG`/`EQUIP_SHORT`/`CHAR_GENDER`/`charPool`), `zml/` (掌门路数据层：`cards.zml.ts` 234 张修真牌堆（基本牌 sub 保留、卡名为修真变体）、`characters.zml.ts` 48 人（含 `TAOISM_MAP` 道统映射与灵兽标签）、`skilldefs.zml.ts` 原著技能与主公技、`attr.ts` 属性攻防（道统 6 环 / 五行 5 环 / `taoismRelation` / `attrRelation` / 徽标 HTML，仅掌门路生效）), `cards.ts` (deck construction, `buildDeck({mode})`), `skilldefs.ts` (all skill definitions，含合并的 `ZML_SKILL_LIST`), `packets.ts` (仅兼容用的单一「全部角色」), `packRegistry.ts` (自定义扩展包), `knowledgeTricks.ts` (策略型锦囊).
- `profile/` — localStorage profile (`xuetangsha_profile_v1`): score/levels/achievements + personalization + loadout; `packMeter.ts` (首版恒免费).
- `game/` — engine: `state.ts` (the `G` object), `rules.ts`, `damage.ts`, `actions.ts` (card resolution), `skills.ts` / `skillEngine.ts` (active-skill dispatch + effect primitives), `turn.ts` (runTurn phases), `ai.ts`, `loop.ts`, `choice.ts` (Promise bridge for local/remote choices), `marks.ts`, `log.ts`, `chat.ts`, `setup.ts` (player assembly + startSingle/hostStartGame/exitGame).
- `net/` — `network.ts` (NET object, host-authoritative sync), `protocol.ts` (typed message union — extend this first when adding networked features), `rooms.ts`, `peer.cdn.ts` / `peer.bundled.ts`.
- `ui/` — `render.ts` (single top-level `render()`), `hand.ts`, `lobby.ts` (pickers, SELECTED_* state, room member lists, pack management), `modals.ts` (rules), `settle.ts` (结算), `reveal.ts` (亮将), `packEditor.ts`, `dock.ts`/`playzone.ts`.

## Critical Invariants

1. **`G` (game/state.ts) field names/shape must not change casually** — `state_sync` serializes it directly and clients unpack it structurally. If you must change it, update the host and client unpacking in the same commit.
2. **Inline handlers**: generated HTML (seats, action buttons, mark menu) calls `openMarkMenu(i)`, `handleLocalChoice(v)`, `clickTargetSeat(i)`, etc. Any new function referenced from a template string must be mounted on `window` in `main.ts` and declared in `globals.d.ts`.
3. **Module cycles are intentional** (ui ↔ game ↔ net). They are safe ONLY because no module has top-level side effects except `main.ts`; all cross-module calls happen inside function bodies. Never add top-level code that touches another module's bindings.
4. **Mutable shared state ownership**: `playLog` (log.ts), `chatMessages` (chat.ts), `ROLE_MARKS` (marks.ts), `SELECTED_*` (ui/lobby.ts), unread counters (ui/dock.ts) are `let`/objects owned by one module; other modules read via live bindings or call exported mutators. Do not assign to imported bindings.
5. **Magic numbers are load-bearing**: 80ms sync debounce, 100/60 log caps, deck composition (30 sha / 15 shan / 8 tao / 5 jiu / tricks / equips), `xts-` peer ID prefix, 6-digit room codes, AI probabilities.
6. `dist/掌门杀.html` must remain a drop-in single-file game — verify with `npm run verify:dist` and the smoke scripts above after any change.

## Release Convention（发布规范）

发版走「打 `vX.Y.Z` 标签 → 推送 → GitHub Actions 自动构建并发布 Release（含 Gitee 镜像）」流程（`.github/workflows/release.yml`）。**发布时 `package.json` 的 `version` 必须与标签号保持一致**：

1. **发版前先把 `package.json` 的 `version` 改为目标版本号**（`0.1.2` → `0.1.3`），与即将打的 `v0.1.3` 标签完全对应（去掉 `v` 前缀）。
2. 单独提交该版本号变更（`chore(release): 同步 package.json version 至 vX.Y.Z`），再合并 / 推到 `main`。
3. 打标签并推送：`git tag -a vX.Y.Z -m "vX.Y.Z —— <一句话说明>" && git push origin main --tags`。
4. CI 在发布流程中会自动校验并把 `package.json` 版本号同步到标签（若忘记手动改，CI 会回写并提交到 `main`，不会因此阻断发版）——但**人工发版仍应主动改对**，避免 `main` 上出现多余的回写提交。

> 版本号是给用户 / 下游识别发布内容的唯一元数据；遗漏会导致「已发布」却显示旧版本。这是发布清单的硬性第一步，不可跳过。
