/* ==================== 角色池（掌门路原著 48 人） ====================
 * 已彻底移除学堂杀遗留的 82 名名人角色（鲁迅 / 李白 / 诸葛亮 …）与 108 名生成扩展角色。
 * 角色数据本体位于 src/data/zml/characters.zml.ts（门派 / 境界 / 本命 / 家族 / 技能均按 docs 原著填写）。
 * 本文件保留身份表、装备短名、性别表与角色池访问器，供全局 12 处 import 继续使用。
 */
import type { Character, Gender, Role } from '../core/types';
import { ZML_CHARACTERS } from './zml/characters.zml';

/** 角色池：即为掌门路原著角色池（经典模式与掌门路模式共用同一套角色） */
export const CHARACTERS: Character[] = ZML_CHARACTERS;

export const ROLES: Record<Role, { name: string; color: string }> = {
  lord: { name: '掌门', color: '#f5c542' },
  loyal: { name: '弟子', color: '#27ae60' },
  rebel: { name: '邪修', color: '#e74c3c' },
  spy: { name: '黑手', color: '#9b59b6' },
};

export const ROLE_ICON: Record<Role, string> = {
  lord: '🏯',
  loyal: '🧘',
  rebel: '👹',
  spy: '🖤',
};

export const ROLE_CONFIG: Record<number, Role[]> = {
  2: ['lord', 'rebel'],
  3: ['lord', 'rebel', 'spy'],
  4: ['lord', 'loyal', 'rebel', 'spy'],
  5: ['lord', 'loyal', 'rebel', 'rebel', 'spy'],
  6: ['lord', 'loyal', 'rebel', 'rebel', 'rebel', 'spy'],
  7: ['lord', 'loyal', 'loyal', 'rebel', 'rebel', 'rebel', 'spy'],
  8: ['lord', 'loyal', 'loyal', 'rebel', 'rebel', 'rebel', 'rebel', 'spy'],
};

/** 装备短名：卡面槽位只显示 1 个字，避免长名溢出（原版 + 掌门路修真装备） */
export const EQUIP_SHORT: Record<string, string> = {
  // 原版（经典模式）
  诸葛连弩: '弩',
  青龙偃月刀: '刀',
  丈八蛇矛: '矛',
  青釭剑: '釭',
  雌雄双股剑: '雌',
  贯石斧: '斧',
  方天画戟: '戟',
  寒冰剑: '冰',
  古锭刀: '锭',
  八卦阵: '卦',
  仁王盾: '盾',
  藤甲: '藤',
  白银狮子: '狮',
  '+1马': '+1',
  '-1马': '-1',
  // 掌门路 · 兵器法宝
  灵狐剑匣: '匣',
  伪无形剑: '无',
  月影玄冰剑: '影',
  心生蜂云剑: '蜂',
  洼角云刀: '洼',
  七芯蝎尾夺: '夺',
  碧火幽魂刀: '魂',
  青铜长戟: '戟',
  一剑碧环星: '环',
  七剑斩元星: '元',
  // 掌门路 · 护身法器（阵法可作防具）
  猴面金身法像: '像',
  清风法袍: '袍',
  映雪冰风阵: '阵',
  玄水归土阵: '水',
  广开道德金光大阵: '德',
  // 掌门路 · 载具
  乙木御风梭: '梭',
  幻木灵梭: '木',
  灵竹纸鸢: '鸢',
  无形鹤: '鹤',
  虾驼兽: '驼',
  陆行驮兽: '驮',
  银背驮鳐: '鳐',
  风阵灵舟: '舟',
  飞蟹: '蟹',
  // 掌门路 · 宝物
  青灵石蒲团: '蒲',
  储物袋: '袋',
  红玉阵盘: '盘',
  通天令: '令',
  通明幻镜: '镜',
};

/** 角色性别：仅【雌雄双股剑 / 心生蜂云剑】判定异性时使用；未列出者按「男」处理 */
export const CHAR_GENDER: Record<string, Gender> = {
  zml_qizhuang: 'female',
  zml_chuhongshang: 'female',
  zml_peiwen: 'female',
  zml_xiongdai: 'female',
  zml_mingzhen: 'female',
  zml_miaoqing: 'female',
  zml_liyuanying: 'female',
  zml_qinxizhao: 'female',
};

/** 角色池：返回全部原著角色 */
export function charPool(): Character[] {
  return CHARACTERS;
}
