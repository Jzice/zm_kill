/* ==================== 卡牌 ==================== */
import type { Card, CardType, GameMode } from '../core/types';
import type { CardPackId } from './cardPacks';
import { ZML_ALL } from './zml/cards.zml';

export const SUITS: string[] = ['♠', '♥', '♣', '♦'];
let cid = 0;

export function C(
  name: string,
  type: CardType,
  sub: string,
  suit: string,
  num: string | number,
  extra: Partial<Card> = {},
): Card {
  return { id: ++cid, name, type, sub, suit, num, ...extra };
}

/** 【攻击】的三种子类（普通杀 / 火杀 / 雷杀），出牌与手牌点击判定共用 */
export const SHA_SUBS: string[] = ['sha', 'huo', 'lei'];

/**
 * 构建牌堆。
 *
 * 掌门路（zml）/ 开辟战争（war）统一走修真牌堆 `buildZmlDeck`（见 src/data/zml/cards.zml.ts）。
 * 原版三国杀 classic 模式已移除，本函数不再分支。
 */
export function buildDeck(_opts?: { packs?: CardPackId[]; mode?: GameMode }): Card[] {
  return buildZmlDeck();
}

/**
 * 掌门路修真牌堆（234 张）：按 src/data/zml/cards.zml.ts 的定义投放。
 * 所有 sub 复用现有引擎 key，因此结算 / 判定 / AI 分支无需任何改动；
 * 仅 name（修真卡名）与 subtitle（卡面副题）不同。
 */
export function buildZmlDeck(): Card[] {
  const d: Card[] = [];
  let i = 0;
  for (const def of ZML_ALL) {
    for (let k = 0; k < def.count; k++) {
      d.push(
        C(def.name, def.type, def.sub, SUITS[i % 4], (i % 13) + 1, {
          ...(def.extra || {}),
          subtitle: def.subtitle,
        }),
      );
      i++;
    }
  }
  for (let j = d.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [d[j], d[k]] = [d[k], d[j]];
  }
  return d;
}

export function shuffle<T>(a: T[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
