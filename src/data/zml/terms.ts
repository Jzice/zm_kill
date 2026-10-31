/* ==================== 掌门路修真术语 ====================
 * 把引擎结算键（sub / 装备 skill / 基础牌 sub）映射为玩家可见的修真显示名，
 * 供出牌提示、响应按钮、转化选项与规则书使用，保证 UI 文案与牌面一致。
 * 纯数据 + 派生表，无顶层副作用。
 */
import { ZML_TRICK, ZML_EQUIP } from './cards.zml';

/** 锦囊 sub → 修真牌名（同 sub 唯一；扩展包锦囊不在本表，回退见 trickName） */
export const TRICK_NAME: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const d of ZML_TRICK) if (!(d.sub in m)) m[d.sub] = d.name;
  return m;
})();

/** 装备 skill → 修真装备名（同 skill 取首件） */
export const EQUIP_NAME: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const d of ZML_EQUIP) {
    const sk = d.extra?.skill;
    if (sk && !(sk in m)) m[sk] = d.name;
  }
  return m;
})();

/** 基础牌 sub → 修真玩法概念名（杀/闪/桃/酒 无唯一修真名，用概念术语） */
export const BASE_TERM: Record<string, string> = {
  sha: '攻击',
  huo: '烈火攻击',
  lei: '雷霆攻击',
  shan: '防御',
  tao: '恢复',
  jiu: '增益',
};

/** 扩展包锦囊的卡名（沿用卡面通用命名，与 cardCatalog 一致） */
const EXTRA_TRICK_NAME: Record<string, string> = {
  bingliang: '哼哈真言',
  zhiji: '知己知彼',
  shuishui: '水淹七军',
  caomu: '草木皆兵',
  yuanjiao: '远交近攻',
  yiyi: '以逸待劳',
  huoshao: '火烧连营',
  diaohu: '调虎离山',
  lianjun: '联军盛宴',
  chiling: '敕令',
  wuxieguo: '不在算中·国',
};

/** 锦囊 sub → 修真显示名（扩展/未知回退为通用名「锦囊」） */
export function trickName(sub: string): string {
  return TRICK_NAME[sub] || EXTRA_TRICK_NAME[sub] || '锦囊';
}

/** 装备 skill → 修真显示名（未知回退原 skill 名） */
export function equipName(skill: string): string {
  return EQUIP_NAME[skill] || skill;
}

/** 基础牌 sub → 修真概念名（未知回退「攻击」） */
export function baseTerm(sub: string): string {
  return BASE_TERM[sub] || '攻击';
}
