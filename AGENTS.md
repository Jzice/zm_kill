# AGENTS

This file provides guidance to agents when working with code in this repository.

## Repository Overview

掌门杀 (Zhangmensha) is a browser-based, Sanguosha-like identity card game themed on the 修真 (cultivation) world of 《修真门派掌门路》. It was forked from 「学堂杀」 and refactored: the original single-file HTML game became a modular TypeScript project that builds back to a **single self-contained HTML file**. **Phase 1 removed the entire quiz / grade / subject system**; the engine is now a clean card-battle kernel with a 修真 faction layer, ready for cultivation mechanics (修为 / 本命 / 法器 / 灵石) to be layered on later.

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
- `data/` — pure data + derivation: `factions.ts` (**修真势力** + 主公技), `characters.ts` (roles/ROLE_CONFIG + characters mapped to factions), `cards.ts` (deck construction), `skilldefs.ts` (all skill definitions), `packets.ts` (角色池范围), `packRegistry.ts` (自定义扩展包), `knowledgeTricks.ts` (策略型锦囊).
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
