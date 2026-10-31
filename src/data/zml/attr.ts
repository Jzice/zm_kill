/* ==================== 属性攻防体系（仅掌门路 / 开辟战争生效） ====================
 * 两层属性：
 *   1) 角色道统 Taoism：道 / 佛 / 儒 / 魔 / 鬼 / 外道，6 环相克
 *      道 → 鬼 → 儒 → 外道 → 佛 → 魔 → 道
 *   2) 卡牌属性 Attr：五行（金木水火土）+ 雷 / 兽 / 道德 / 鬼物 / 风 / 毒
 *      金克木、木克土、土克水、水克火、火克金；道德 ↔ 鬼物；风 ↔ 毒；
 *      雷对魔 / 鬼判定；兽对灵兽 / 载具判定。
 *
 * 本模块是**纯数据 + 纯函数**（无可变状态、无顶层副作用），供：
 *   - game/damage.ts 结算加成（道统 / 卡牌属性）
 *   - ui/render.ts、ui/playzone.ts 渲染徽标
 * 角色道统与灵兽标签的唯一数据源在 data/zml/characters.zml.ts。
 */
import type { Attr, Card, Element, Taoism } from '../../core/types';
import { charLingshouOf, charTaoismOf } from './characters.zml';

/** 克制关系结果：win 攻克 +1 / lose 被克 -1 / judge 判定（红 +1、黑 +0 或同五行红 0、黑 -1）/ none 无关系 */
export type Relation = 'win' | 'lose' | 'judge' | 'none';

/* ---------------- 道统 ---------------- */

export const TAOISM_LABEL: Record<Taoism, string> = {
  dao: '道',
  fo: '佛',
  ru: '儒',
  mo: '魔',
  gui: '鬼',
  waidao: '外道',
};

/** 徽标配色（与 style.css 的 .taoism-* 保持一致） */
export const TAOISM_COLOR: Record<Taoism, string> = {
  dao: '#6b8e23',
  fo: '#d4a017',
  ru: '#4a6fa5',
  mo: '#a83232',
  gui: '#5b5b7a',
  waidao: '#6e4b1f',
};

/** 6 环相克：key 克制 value（道克鬼、鬼克儒、儒克外道、外道克佛、佛克魔、魔克道） */
export const TAOISM_KE: Record<Taoism, Taoism> = {
  dao: 'gui',
  gui: 'ru',
  ru: 'waidao',
  waidao: 'fo',
  fo: 'mo',
  mo: 'dao',
};

/** 该道统是否为邪魔（雷属性判定对象：魔 / 鬼） */
export function isEvilTaoism(t?: Taoism): boolean {
  return t === 'mo' || t === 'gui';
}

/** 道统相克：攻方克制守方 = win；守方克制攻方 = lose；同道统或无从属 = none */
export function taoismRelation(atk?: Taoism, def?: Taoism): Relation {
  if (!atk || !def) return 'none';
  if (TAOISM_KE[atk] === def) return 'win';
  if (TAOISM_KE[def] === atk) return 'lose';
  return 'none';
}

/* ---------------- 五行 / 卡牌属性 ---------------- */

export const ELEMENT_LABEL: Record<Element, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

/** 五行配色（与 style.css 的 .attr-* 保持一致） */
export const ELEMENT_COLOR: Record<Element, string> = {
  metal: '#c9a227',
  wood: '#2e8b57',
  water: '#2176c7',
  fire: '#c0392b',
  earth: '#8a6d3b',
};

/** 五行相克：key 克制 value（金克木、木克土、土克水、水克火、火克金） */
export const ELEMENT_KE: Record<Element, Element> = {
  metal: 'wood',
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
};

export const ATTR_LABEL: Record<Attr, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
  lei: '雷',
  shou: '兽',
  daode: '道德',
  guiwu: '鬼物',
  feng: '风',
  du: '毒',
};

/** 非五行属性的徽标配色 */
export const ATTR_COLOR: Record<Attr, string> = {
  ...ELEMENT_COLOR,
  lei: '#7b4fd0',
  shou: '#b5651d',
  daode: '#e0c15a',
  guiwu: '#6b3fa0',
  feng: '#5bc0be',
  du: '#7d9b3a',
};

const ELEMENTS: Element[] = ['metal', 'wood', 'water', 'fire', 'earth'];

export function isElementAttr(a?: Attr): a is Element {
  return !!a && (ELEMENTS as string[]).includes(a);
}

/** 对称属克对：攻方在前 = 攻克防 +1；攻方在后 = 防克攻 -1 */
const SYMMETRIC_PAIRS: [Attr, Attr][] = [
  ['daode', 'guiwu'],
  ['feng', 'du'],
];

/**
 * 卡牌属性关系（攻方属性 vs 守方护身法器属性）：
 *   五行：攻克防 win / 防克攻 lose / 同五行 judge / 其余 none
 *   道德 ↔ 鬼物、风 ↔ 毒：对称 win / lose
 *   跨族或缺属性：none（按普通攻击结算）
 * 注意：雷 / 兽 不是「属性对属性」，由 damage.ts 结合目标道统 / 灵兽标签单独判定。
 */
export function attrRelation(atk?: Attr, def?: Attr): Relation {
  if (!atk || !def) return 'none';
  if (isElementAttr(atk) && isElementAttr(def)) {
    if (atk === def) return 'judge';
    if (ELEMENT_KE[atk] === def) return 'win';
    if (ELEMENT_KE[def] === atk) return 'lose';
    return 'none';
  }
  for (const [a, b] of SYMMETRIC_PAIRS) {
    if (atk === a && def === b) return 'win';
    if (atk === b && def === a) return 'lose';
  }
  return 'none';
}

/* ---------------- 取值helper（角色 / 卡牌） ---------------- */

/** 角色道统（由 charId 查角色表，Player 不新增字段，减小 state_sync 体积） */
export function charTaoism(charId: string): Taoism | undefined {
  return charTaoismOf(charId);
}

/** 角色是否灵兽之躯 */
export function charLingshou(charId: string): boolean {
  return charLingshouOf(charId);
}

/** 卡牌属性（掌门路牌堆在 cards.zml.ts 的 extra 中声明） */
export function cardAttr(c?: Card | null): Attr | undefined {
  return c?.attr;
}

/** 卡牌道统标签（小红 / 五烟绮罗纱 = 魔，万骨共生 = 鬼 …） */
export function cardTaoism(c?: Card | null): Taoism | undefined {
  return c?.taoism;
}

/** 卡牌灵兽标签（元犼真身 / 银白鬃毛 …） */
export function cardLingshou(c?: Card | null): boolean {
  return !!c?.lingshou;
}

/* ---------------- 徽标 HTML ---------------- */

/** 属性徽标（手牌 / 出牌区 / 规则书共用） */
export function attrChip(a: Attr): string {
  return `<span class="attr-chip attr-${a}" title="属性：${ATTR_LABEL[a]}">${ATTR_LABEL[a]}</span>`;
}

/** 道统徽标 */
export function taoismChip(t: Taoism): string {
  return `<span class="attr-chip taoism-chip taoism-${t}" title="道统：${TAOISM_LABEL[t]}">${TAOISM_LABEL[t]}</span>`;
}

/** 按卡牌自动出徽标（无属性 / 无道统标签时返回空串） */
export function cardChips(c?: Card | null): string {
  if (!c) return '';
  let html = '';
  if (c.attr) html += attrChip(c.attr);
  if (c.taoism) html += taoismChip(c.taoism);
  return html;
}
