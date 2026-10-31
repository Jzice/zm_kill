/* ==================== AI 牌堆 / 手牌推断（信息集建模） ====================
 * 博弈论意义：本游戏是「不完全信息博弈」，AI 的信息集 = 自己手牌 + 全部公开信息。
 * 牌堆构成是**固定且已知**的，因此可以用「总数 − 已公开」推出未见牌分布，
 * 进而估算「对手手里有没有闪」「决斗能不能赢」这类概率——这是所有 EV 计算的分母。
 *
 * 合法性：只使用 AI 视角可见的信息（自己手牌 / 全场装备 / 弃牌堆 / 判定区 / 他人手牌**数量**），
 * 绝不读取他人手牌内容。
 *
 * 模块级状态不入 G（与 beliefs / grudges 一致），不随 state_sync 下发。
 */
import type { Card } from '../core/types';
import { G } from './state';
import { ZML_ALL } from '../data/zml/cards.zml';
import type { CardPackId } from '../data/cardPacks';

/**
 * 基础牌堆构成（与 data/cards.ts::buildDeck 无参调用一一对应）。
 * 直接由修真牌堆定义派生，避免硬编码张数与实际牌堆漂移（当前 229 张）。
 */
export const BASE_DECK_TOTAL: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const d of ZML_ALL) m[d.sub] = (m[d.sub] || 0) + d.count;
  return m;
})();

/**
 * 当前牌堆构成 = 修真牌堆构成（229 张）。
 * 由 game/setup.ts 在 buildDeck 之后调用 applyDeckComposition() 刷新，
 * 使 AI 的概率分母与实际牌堆严格一致。
 * 注：经典扩展包卡尚未修真化，`buildDeck` 不投放它们，故分母只取基础牌堆构成；
 * 待扩展包完成修真化后，再按 packs 累加投放量。
 */
export const DECK_TOTAL: Record<string, number> = { ...BASE_DECK_TOTAL };
export let DECK_SIZE = Object.values(DECK_TOTAL).reduce((s, n) => s + n, 0);

/** 按牌堆实际投放重算牌堆构成（幂等，可重复调用） */
export function applyDeckComposition(_packs: CardPackId[]): void {
  for (const k of Object.keys(DECK_TOTAL)) delete DECK_TOTAL[k];
  Object.assign(DECK_TOTAL, BASE_DECK_TOTAL);
  DECK_SIZE = Object.values(DECK_TOTAL).reduce((s, n) => s + n, 0);
  pubVer = -1; // 强制重算公开牌池缓存
}

/** 局前配装注入的装备不来自牌堆（id ≥ 90000、花色 '✦'），计数时排除 */
function fromDeck(c: Card | null | undefined): boolean {
  return !!c && c.suit !== '✦' && c.id < 90000;
}

let pubVer = -1;
let pubCounts: Record<string, number> = {};
let pubTotal = 0;

/** 公开局面版本号（与具体座位无关：弃牌堆 + 牌堆 + 判定区 + 全场装备） */
function publicVersion(): number {
  let v = G.discard.length + G.deck.length;
  for (let i = 0; i < G.players.length; i++) {
    const p = G.players[i];
    v += p.judge.length;
    if (fromDeck(p.equip.weapon)) v++;
    if (fromDeck(p.equip.armor)) v++;
    if (fromDeck(p.equip.horsePlus)) v++;
    if (fromDeck(p.equip.horseMinus)) v++;
  }
  return v;
}

/**
 * 公开牌池（与「我方是谁」无关）：牌堆构成 − 弃牌堆 − 判定区 − 全场装备。
 * 缓存按 publicVersion 命中；多个座位轮流决策时不再因 me 不同而抖动重算。
 */
function publicPool(): { counts: Record<string, number>; total: number } {
  const v = publicVersion();
  if (v === pubVer) return { counts: pubCounts, total: pubTotal };
  const counts: Record<string, number> = { ...DECK_TOTAL };
  let removed = 0;
  const drop = (c: Card | null | undefined): void => {
    if (!fromDeck(c)) return;
    if (counts[c!.sub] === undefined) return;
    if (counts[c!.sub] > 0) counts[c!.sub]--;
    removed++;
  };
  for (const c of G.discard) drop(c);
  for (const p of G.players) {
    for (const c of p.judge) drop(c);
    drop(p.equip.weapon);
    drop(p.equip.armor);
    drop(p.equip.horsePlus);
    drop(p.equip.horseMinus);
  }
  const total = Math.max(0, DECK_SIZE - removed);
  pubVer = v;
  pubCounts = counts;
  pubTotal = total;
  return { counts, total };
}

/**
 * 未见牌分布（AI 视角）：公开牌池 − 自己手牌。
 * 结果既包含「牌堆剩余」也包含「他人手牌」，正是估计他人手牌的正确抽样池。
 */
function unseen(me: number): { counts: Record<string, number>; total: number } {
  const { counts, total } = publicPool();
  const counts2: Record<string, number> = { ...counts };
  let removed = 0;
  const mine = G.players[me];
  if (mine) {
    for (const c of mine.hand) {
      if (fromDeck(c) && counts2[c.sub] !== undefined && counts2[c.sub] > 0) {
        counts2[c.sub]--;
        removed++;
      }
    }
  }
  return { counts: counts2, total: total - removed };
}

/** 未见池中某（些）子类的张数 */
export function unseenCountOf(me: number, subs: string | string[]): number {
  const list = Array.isArray(subs) ? subs : [subs];
  const { counts } = unseen(me);
  let n = 0;
  for (const s of list) n += counts[s] || 0;
  return n;
}

/** 未见池中随机一张牌属于该（些）子类的概率 */
export function pUnseen(me: number, subs: string | string[]): number {
  const { total } = unseen(me);
  if (total <= 0) return 0;
  return unseenCountOf(me, subs) / total;
}

/** 目标 t 的 n 张手牌中「至少一张属于该子类」的概率（独立近似，足够稳） */
export function pAtLeastOne(me: number, t: number, subs: string | string[]): number {
  const tp = G.players[t];
  if (!tp) return 0;
  const n = tp.hand.length;
  if (n <= 0) return 0;
  const q = pUnseen(me, subs);
  return 1 - Math.pow(1 - q, n);
}

/** 目标 t 手牌中该类牌的**期望张数**（用于决斗等需要数量而非存在性的场合） */
export function expectedCount(me: number, t: number, subs: string | string[]): number {
  const tp = G.players[t];
  if (!tp) return 0;
  return tp.hand.length * pUnseen(me, subs);
}

/** 我方手牌中可当【攻击】使用的张数（含转化技由调用方自行叠加） */
export function countSub(pIdx: number, subs: string | string[]): number {
  const p = G.players[pIdx];
  if (!p) return 0;
  const list = Array.isArray(subs) ? subs : [subs];
  return p.hand.filter((c) => list.includes(c.sub)).length;
}

/** 二项分布 CDF：P(K ≤ k)，K ~ Bin(n, p) —— 决斗子博弈的闭式解需要 */
export function binomCdf(k: number, n: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  let s = 0;
  let c = 1; // C(n, 0)
  for (let i = 0; i <= k; i++) {
    s += c * Math.pow(p, i) * Math.pow(1 - p, n - i);
    c = (c * (n - i)) / (i + 1);
  }
  return Math.max(0, Math.min(1, s));
}

/** 新对局：清空缓存（由 resetBrain 一并调用） */
export function resetCounts(): void {
  pubVer = -1;
  pubCounts = {};
  pubTotal = 0;
}
