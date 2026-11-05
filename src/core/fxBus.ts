/* ==================== 特效调度层（唯一发射入口） ====================
 * 业务层只认这里的同名门面；渲染器（fx.ts / fxStage.ts）只负责本地播放，绝不发射。
 *  - 房主：本地播放一次 + transport 广播 fx_event
 *  - 客人端：仅在 onClientData 收到 fx_event 时播放
 *  - 单机：transport 未注册或守卫为假，不广播
 * 统一闸门：无头模拟 / 特效强度 / 系统减弱动效 / 派生播放去重。
 */
import type { Card } from './types';
import type { FxEvent, FxKind, FxLevel, WinCamp } from './fxEvent';
import { FX_DEDUPE_MS, fxEventKey } from './fxEvent';
import { isSim } from './dom';
import {
  FX as RenderFX,
  floatTextFx as renderFloatText,
  trickCast as renderTrickCast,
  aoeFx as renderAoe,
  equipFx as renderEquip,
  drawFx as renderDraw,
  discardFx as renderDiscard,
  comboFx as renderCombo,
  resultBanner as renderResult,
  victoryFx as renderVictory,
} from './fx';
import { castFx, setStageLevel, mountFxStage } from './fxStage';

export type { FxLevel, WinCamp } from './fxEvent';
export type { FxEvent, FxKind } from './fxEvent';

const STORAGE_KEY = 'xuetangsha_fx_v1';
const LEVELS: FxLevel[] = ['full', 'lite', 'off'];

type FxTransport = (event: FxEvent) => void;

let transport: FxTransport | null = null;
let level: FxLevel | null = null;
let seq = 0;

const dedupe = new Map<string, number>();
const debug = { emitted: 0, received: 0, played: 0, skipped: 0 };

function loadLevel(): FxLevel {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'full' || v === 'lite' || v === 'off') return v;
  } catch (e) {
    /* 隐私模式 / 无 localStorage：用默认值 */
  }
  return 'lite';
}

export function getFxLevel(): FxLevel {
  if (!level) level = loadLevel();
  return level;
}

/** 主题面板的特效强度按钮高亮 */
export function refreshFxLevelUI(): void {
  const cur = getFxLevel();
  document.querySelectorAll<HTMLElement>('#themePanel .fx-level').forEach((b) => {
    b.classList.toggle('active', b.dataset.level === cur);
  });
}

export function setFxLevel(next: string): void {
  if (!LEVELS.includes(next as FxLevel)) return;
  level = next as FxLevel;
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch (e) {
    /* ignore */
  }
  setStageLevel(level);
  refreshFxLevelUI();
}

/** 由 main.ts 在 init() 中注册；内部自行守卫「仅联机房主」 */
export function setFxTransport(t: FxTransport | null): void {
  transport = t;
}

/** 懒挂载 Canvas（读取强度偏好后调用，避免在 import 阶段创建 DOM） */
export function initFxStage(): void {
  const lv = getFxLevel();
  setStageLevel(lv);
  if (lv !== 'off') mountFxStage();
  refreshFxLevelUI();
}

export function getFxDebug(): { emitted: number; received: number; played: number; skipped: number } {
  return { ...debug };
}

function reducedMotion(): boolean {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** 本地播放闸门：关闭强度 / 无头模拟 / 系统减弱动效时不播任何动画，仅保留出牌区静态牌面 */
function locallyDisabled(): boolean {
  return getFxLevel() === 'off' || isSim() || reducedMotion();
}

function prune(now: number): void {
  for (const [k, t] of dedupe) if (now - t > FX_DEDUPE_MS) dedupe.delete(k);
}

export function recentFx(kind: FxKind, key: string): boolean {
  const now = Date.now();
  prune(now);
  return dedupe.has(`${kind}|${key}`) && now - (dedupe.get(`${kind}|${key}`) ?? 0) <= FX_DEDUPE_MS;
}

export function markFx(kind: FxKind, key: string): void {
  const now = Date.now();
  prune(now);
  dedupe.set(`${kind}|${key}`, now);
}

/** 派生播放点专用：未被广播事件覆盖则认领并播放一次 */
export function claimFx(kind: FxKind, key: string): boolean {
  if (recentFx(kind, key)) return false;
  markFx(kind, key);
  return true;
}

function makeEvent(kind: FxKind, fields: Omit<FxEvent, 'seq' | 'kind'> = {}): FxEvent {
  return { seq: ++seq, kind, ...fields };
}

/** 事件 → 本地渲染器（DOM + Canvas），单一职责：不发射、不广播、不去重 */
async function playLocal(e: FxEvent): Promise<void> {
  const from = e.from ?? 0;
  const to = e.to ?? from;
  castFx(e);
  switch (e.kind) {
    case 'flyCard':
      await RenderFX.flyCard(from, to, e.text ?? '', e.sub ?? 'basic', e.n ?? 520);
      break;
    case 'attackLunge':
      RenderFX.attackLunge(from);
      break;
    case 'hitShake':
      RenderFX.hitShake(from);
      break;
    case 'slash':
      await RenderFX.slash(from);
      break;
    case 'shield':
      await RenderFX.shield(from);
      break;
    case 'healGlow':
      RenderFX.healGlow(from);
      break;
    case 'skillWave':
      RenderFX.skillWave(from);
      break;
    case 'judge':
      if (e.card) await RenderFX.judge(from, e.card);
      break;
    case 'death':
      await RenderFX.death(from, e.roleText, e.killerText);
      break;
    case 'floatText':
      renderFloatText(from, e.text ?? '', e.color ?? '#f5c542');
      break;
    case 'trickCast':
      await renderTrickCast(from, e.text ?? '', e.sub ?? '', e.color, e.n ?? 900);
      break;
    case 'aoe':
      await renderAoe(from, e.toList ?? [], e.color);
      break;
    case 'equip':
      await renderEquip(from, e.text ?? '');
      break;
    case 'draw':
      renderDraw(from, e.n ?? 1);
      break;
    case 'discard':
      renderDiscard(from);
      break;
    case 'combo':
      renderCombo(from, e.n ?? 1);
      break;
    case 'result':
      await renderResult(e.text ?? '', e.win ?? false);
      break;
    case 'victory':
      renderVictory(e.camp ?? 'lose', e.mountId ?? 'settleHero');
      break;
  }
  debug.played++;
}

function report(err: unknown): void {
  try {
    console.error('[fxBus] 特效播放失败', err);
  } catch (e) {
    /* ignore */
  }
}

/** 房主/单机逻辑调用：广播在先（客人端几乎同时起效），随后本地按原节奏 await */
export async function emitFx(event: FxEvent): Promise<void> {
  debug.emitted++;
  if (isSim()) {
    debug.skipped++;
    return;
  }
  if (transport) {
    try {
      transport(event);
    } catch (err) {
      report(err);
    }
  }
  // 系统减弱动效时仍保留 DOM 基础光效（位移由 CSS 媒体查询禁用），Canvas 由 fxStage 自行停用
  if (locallyDisabled()) {
    debug.skipped++;
    return;
  }
  try {
    await playLocal(event);
  } catch (err) {
    report(err);
  }
}

/** 客人端收到 fx_event：只本地播放，不回播；与 state_sync 派生播放短时去重 */
export async function playFxEvent(event: FxEvent): Promise<void> {
  debug.received++;
  if (isSim() || locallyDisabled()) {
    debug.skipped++;
    return;
  }
  if (!claimFx(event.kind, fxEventKey(event))) {
    debug.skipped++;
    return;
  }
  try {
    await playLocal(event);
  } catch (err) {
    report(err);
  }
}

/* ---------------- 与 fx.ts 完全同名的门面 ---------------- */

export const FX = {
  anchor(idx: number): { x: number; y: number } {
    return RenderFX.anchor(idx);
  },
  attackLunge(idx: number): void {
    void emitFx(makeEvent('attackLunge', { from: idx }));
  },
  hitShake(idx: number): void {
    void emitFx(makeEvent('hitShake', { from: idx }));
  },
  flyCard(fi: number, ti: number, text: string, type = 'basic', dur = 520): Promise<void> {
    return emitFx(makeEvent('flyCard', { from: fi, to: ti, text, sub: type, n: dur }));
  },
  slash(idx: number): Promise<void> {
    return emitFx(makeEvent('slash', { from: idx }));
  },
  shield(idx: number): Promise<void> {
    return emitFx(makeEvent('shield', { from: idx }));
  },
  healGlow(idx: number): void {
    void emitFx(makeEvent('healGlow', { from: idx }));
  },
  skillWave(idx: number): void {
    void emitFx(makeEvent('skillWave', { from: idx }));
  },
  judge(idx: number, card: Card): Promise<void> {
    return emitFx(makeEvent('judge', { from: idx, card }));
  },
  death(idx: number, roleText?: string, killerText?: string): Promise<void> {
    return emitFx(makeEvent('death', { from: idx, roleText, killerText }));
  },
};

export function floatTextFx(idx: number, text: string, color: string): void {
  void emitFx(makeEvent('floatText', { from: idx, text, color }));
}

export function trickCast(
  idx: number,
  cardName: string,
  sub: string,
  color = '#b57fff',
  dur = 900,
): Promise<void> {
  return emitFx(makeEvent('trickCast', { from: idx, text: cardName, sub, color, n: dur }));
}

export function aoeFx(fromIdx: number, targetIdx: number[], color = '#e74c3c'): Promise<void> {
  return emitFx(makeEvent('aoe', { from: fromIdx, toList: [...targetIdx], color }));
}

export function equipFx(idx: number, cardName: string): Promise<void> {
  return emitFx(makeEvent('equip', { from: idx, text: cardName }));
}

export function drawFx(idx: number, n: number): void {
  void emitFx(makeEvent('draw', { from: idx, n }));
}

export function discardFx(idx: number): void {
  void emitFx(makeEvent('discard', { from: idx }));
}

export function comboFx(idx: number, combo: number): void {
  void emitFx(makeEvent('combo', { from: idx, n: combo }));
}

export function resultBanner(text: string, win: boolean): Promise<void> {
  return emitFx(makeEvent('result', { text, win }));
}

export function victoryFx(camp: WinCamp, mountId = 'settleHero'): void {
  void emitFx(makeEvent('victory', { camp, mountId }));
}
