/* ==================== 掌门路模式配置（纯数据 / 纯函数，无可变状态） ====================
 * 出处：
 *  - 灵地阶位与进阶要求：docs/md/设定/修行体系.md、docs/md/设定/力量体系.md
 *  - 灵石（一般等价物）：docs/md/设定/灵石.md
 *  - 身份：docs/md/设定/大周书院宗法制.md（三代掌门制）、
 *          docs/md/设定/修行体系.md（内门 / 外门弟子）、
 *          docs/raw 第 021 卷「魔修、鬼修、邪修、凶人」、
 *          docs/md/势力/势力列表.md（组织 · 黑手）
 *
 * 模式开关 SELECTED_MODE 位于 ui/lobby.ts（与其他 SELECTED_* 一致），本模块不持有可变状态，
 * 以保证 ui ↔ game ↔ net 的循环依赖安全（AGENTS.md 不变量 3）。
 */
import type { GameMode, Realm, Role, SpiritGround } from './types';

/** 模式显示名 */
export const MODE_LABEL: Record<GameMode, string> = {
  classic: '经典',
  zml: '掌门路',
  war: '开辟战争',
};

export const MODE_DESC: Record<GameMode, string> = {
  classic: '原版三国杀牌堆与角色，规则完全不变',
  zml: '掌门路修真牌堆 + 原著角色：灵石 / 境界 / 灵地 / 本命 / 家族 / 器灵 / 载具',
  war: '在掌门路基础上按门派分队，以灵地占领为唯一胜负目标',
};

/** 是否为修真规则层生效的模式 */
export function isZml(mode?: GameMode): boolean {
  return mode === 'zml' || mode === 'war';
}

/* ---------------- 身份 ---------------- */

/** 掌门路身份显示名（掌门 / 弟子 / 邪修 / 黑手）；经典模式返回 undefined 由调用方沿用原名 */
export const ZML_ROLE_LABEL: Record<Role, string> = {
  lord: '掌门',
  loyal: '弟子',
  rebel: '邪修',
  spy: '黑手',
};

export const ZML_ROLE_ICON: Record<Role, string> = {
  lord: '🏯',
  loyal: '🧘',
  rebel: '👹',
  spy: '🖤',
};

export function zmlRoleLabel(role: Role, mode?: GameMode): string | undefined {
  return isZml(mode) ? ZML_ROLE_LABEL[role] : undefined;
}

/* ---------------- 境界 ---------------- */

export const REALM_LABEL: Record<Realm, string> = {
  lianqi: '练气',
  zhuji: '筑基',
  jindan: '金丹',
  yuanying: '元婴',
  huashen: '化神',
  lianxu: '炼虚',
  heti: '合体',
  dacheng: '大乘',
  dujie: '渡劫',
};

/** 突破的下一阶（局内开放至炼虚，炼虚为顶点返回 null） */
export const REALM_NEXT: Record<Realm, Realm | null> = {
  lianqi: 'zhuji',
  zhuji: 'jindan',
  jindan: 'yuanying',
  yuanying: 'huashen',
  huashen: 'lianxu',
  lianxu: null,
  heti: null,
  dacheng: null,
  dujie: null,
};

/** 局内境界序列（前 6 阶：练气 → 炼虚） */
export const REALM_ORDER: Realm[] = ['lianqi', 'zhuji', 'jindan', 'yuanying', 'huashen', 'lianxu'];

export interface BreakthroughReq {
  /** 所需灵地阶位（筑基一阶 / 结丹三阶 / 结婴五阶） */
  tier: 1 | 3 | 5;
  /** 灵石 */
  lingShi: number;
  /** 修为 */
  exp: number;
  /** 体力上限 +n */
  hpUp: number;
  /** 突破时回复体力 */
  heal: number;
}

export const BREAKTHROUGH: Record<Realm, BreakthroughReq> = {
  lianqi: { tier: 1, lingShi: 3, exp: 4, hpUp: 1, heal: 1 }, // → 筑基
  zhuji: { tier: 3, lingShi: 6, exp: 8, hpUp: 1, heal: 1 }, // → 金丹
  jindan: { tier: 5, lingShi: 10, exp: 12, hpUp: 2, heal: 2 }, // → 元婴
  yuanying: { tier: 5, lingShi: 14, exp: 16, hpUp: 2, heal: 2 }, // → 化神
  huashen: { tier: 5, lingShi: 18, exp: 20, hpUp: 2, heal: 2 }, // → 炼虚
  lianxu: { tier: 5, lingShi: 99, exp: 99, hpUp: 0, heal: 0 }, // 局内顶点，不可突破
  heti: { tier: 5, lingShi: 99, exp: 99, hpUp: 0, heal: 0 },
  dacheng: { tier: 5, lingShi: 99, exp: 99, hpUp: 0, heal: 0 },
  dujie: { tier: 5, lingShi: 99, exp: 99, hpUp: 0, heal: 0 },
};

/** 每局突破次数上限（3 次：金丹起步者可一路破至炼虚） */
export const MAX_BREAKTHROUGH = 3;

/* ---------------- 灵石 ---------------- */

export const LINGSHI_CAP = 8;
/** 回合开始基础产出 */
export const LINGSHI_PER_TURN = 1;
/** 击杀产出 */
export const LINGSHI_PER_KILL = 2;
/** 坊市换牌：3 灵石摸 1 张，每回合限 1 次 */
export const MARKET_COST = 3;
/** 开辟灵地（无主）费用 */
export const GROUND_CLAIM_COST = 2;

/* ---------------- 灵地 ---------------- */

/** 真实山门地名（docs/md/物事/法阵.md、各势力条目） */
const GROUND_POOL: { name: string; tier: 1 | 2 | 3 }[] = [
  { name: '楚秦山', tier: 1 },
  { name: '黑河峰', tier: 1 },
  { name: '思过坊', tier: 1 },
  { name: '剑影山', tier: 2 },
  { name: '流花山', tier: 2 },
  { name: '仙林坳', tier: 2 },
  { name: '元和山', tier: 2 },
  { name: '思过山', tier: 3 },
  { name: '白塔城', tier: 3 },
  { name: '栖霞山', tier: 3 },
];

/** 按人数生成开局灵地盘（4~5 人 3 块；6~8 人 5 块；2~3 人 2 块） */
export function groundSetupFor(playerCount: number): SpiritGround[] {
  const n = playerCount >= 6 ? 5 : playerCount >= 4 ? 3 : 2;
  const byTier = (t: 1 | 2 | 3) => GROUND_POOL.filter((g) => g.tier === t);
  const picked: typeof GROUND_POOL = [];
  const seq: (1 | 2 | 3)[] = n >= 5 ? [1, 2, 2, 3, 3] : n === 3 ? [1, 2, 3] : [1, 2];
  for (const t of seq) {
    const pool = byTier(t).filter((g) => !picked.includes(g));
    if (pool.length) picked.push(pool[0]);
  }
  return picked.map((g, i) => ({ id: `ground${i}`, name: g.name, tier: g.tier, owner: null }));
}

/** 灵地每回合产出：阶位；该玩家占领超过 2 块后每块 -1（防滚雪球，最低 1） */
export function groundYieldOf(tier: number, ownedCount: number): number {
  const penalty = ownedCount > 2 ? 1 : 0;
  return Math.max(1, tier - penalty);
}

/** 该玩家占领的灵地列表 */
export function groundsOf(grounds: SpiritGround[] | undefined, seat: number): SpiritGround[] {
  return (grounds || []).filter((g) => g.owner === seat);
}
