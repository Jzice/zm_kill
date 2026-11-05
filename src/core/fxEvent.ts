/* ==================== 特效事件契约（纯数据 · 可序列化） ====================
 * 房主与客人端共用同一份事件描述：房主逻辑只发射事件，本地播放并广播；
 * 客人端收到 fx_event 后按自身屏幕坐标重放，不参与 state_sync 与任何结算。
 * 本文件不得含 DOM / Canvas / 网络副作用。
 */
import type { Card } from './types';

export type WinCamp = 'lord' | 'rebel' | 'spy' | 'lose';

/** 特效强度：华丽（全粒子）/ 标准（半粒子，默认）/ 关闭（仅牌面文字） */
export type FxLevel = 'full' | 'lite' | 'off';

export type FxKind =
  | 'flyCard'
  | 'attackLunge'
  | 'hitShake'
  | 'slash'
  | 'shield'
  | 'healGlow'
  | 'skillWave'
  | 'judge'
  | 'death'
  | 'floatText'
  | 'trickCast'
  | 'aoe'
  | 'equip'
  | 'draw'
  | 'discard'
  | 'combo'
  | 'result'
  | 'victory';

/** 五套仙侠主题：剑气 / 符箓法阵 / 八卦护罩 / 青碧灵光 / 法宝凝形 */
export type FxTheme = 'blade' | 'talisman' | 'ward' | 'spirit' | 'relic' | 'neutral';

export interface FxEvent {
  /** 房主侧单调递增序号，仅用于调试计数与过期事件识别 */
  seq: number;
  kind: FxKind;
  from?: number;
  to?: number;
  toList?: number[];
  text?: string;
  color?: string;
  /** flyCard 的 type / trickCast 的 card.sub */
  sub?: string;
  /** 数值语义：时长、摸牌数、连击数 */
  n?: number;
  card?: Card;
  camp?: WinCamp;
  win?: boolean;
  roleText?: string;
  killerText?: string;
  mountId?: string;
}

/** 事件 → 主题：决定 CSS class 钩子与 Canvas 笔刷 */
export const FX_THEME_OF: Record<FxKind, FxTheme> = {
  flyCard: 'blade',
  attackLunge: 'blade',
  hitShake: 'blade',
  slash: 'blade',
  trickCast: 'talisman',
  aoe: 'talisman',
  skillWave: 'talisman',
  judge: 'talisman',
  shield: 'ward',
  healGlow: 'spirit',
  equip: 'relic',
  draw: 'relic',
  discard: 'relic',
  combo: 'blade',
  death: 'neutral',
  floatText: 'neutral',
  result: 'neutral',
  victory: 'neutral',
};

/** 仙霞调色板：Canvas 用固定色板，CSS 用语义变量，二者视觉同源 */
export const FX_PALETTE: Record<FxTheme, { main: string; glow: string; spark: string }> = {
  blade: { main: '#ffcf7a', glow: '#ff7a4a', spark: '#fff2c8' },
  talisman: { main: '#c79bff', glow: '#8a5bff', spark: '#f0dcff' },
  ward: { main: '#7fd8ff', glow: '#4a8cff', spark: '#dff4ff' },
  spirit: { main: '#7fe7d2', glow: '#3fbf9a', spark: '#dcfff3' },
  relic: { main: '#f5c542', glow: '#d89a20', spark: '#fff0b8' },
  neutral: { main: '#e8dcc0', glow: '#a89880', spark: '#fff6e0' },
};

/** 去重窗口：派生播放（state_sync 补播 / 结算面板）与广播事件的竞态窗口 */
export const FX_DEDUPE_MS = 1400;

/** 事件去重键（不含 kind，由调用方与 kind 组合）；只保留可跨端一致的字段 */
export function fxEventKey(e: FxEvent): string {
  if (e.kind === 'death') return String(e.from ?? '');
  if (e.kind === 'victory') return String(e.camp ?? '');
  return `${e.from ?? ''}|${e.to ?? ''}|${e.text ?? ''}|${e.sub ?? ''}|${e.n ?? ''}`;
}

export function fxThemeOf(e: FxEvent): FxTheme {
  return FX_THEME_OF[e.kind] || 'neutral';
}
