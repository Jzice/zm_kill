/* ==================== 掌门路修真牌堆（237 张） ====================
 * 选词规则：所有卡名均出自 docs/（详见 docs/掌门路规则设计.md 的出处审计表）。
 *   - 基本牌按功能拆为修真变体（杀/火杀/雷杀/闪/桃/酒 各由功法、符箓、身法、丹药代替），sub 沿用引擎 key
 *   - 锦囊取自 功法(B) / 技能(K) / 符箓(C) / 本命天赋 / 原著灾劫
 *   - 兵器词条仅作装备；阵法可作防具；载具取代 ±1 马
 *
 * 实现要点：`sub` **全部复用现有引擎 key**，因此出牌 / 判定 / 无懈响应链 / AI 分支零改动；
 * 仅改 `name`（修真卡名）与 `subtitle`（卡面副题）。新增的 5 种修真锦囊有独立 sub，
 * 在 game/actions.ts 中新增 case 结算。
 */
import type { Card, CardType } from '../../core/types';

export interface ZmlCardDef {
  /** 引擎内部 key（复用现有 sub，保证结算逻辑不变） */
  sub: string;
  /** 修真卡名 */
  name: string;
  /** 卡面副题（原版对应名 / 修真设定） */
  subtitle?: string;
  type: CardType;
  count: number;
  /** range / skill / dist / judgeType / damageType */
  extra?: Partial<Card>;
  /** 出牌提示与规则书文案 */
  desc: string;
  /** docs 出处 */
  src: string;
}

/* ---------------- 基本牌 58 张 ----------------
 * 同一 sub 拆成多个修真变体：sub / type / damageType 全部不变，仅卡名与副题不同，
 * 因此出牌 / 判定 / 无懈响应链 / AI 分支零改动。
 * 各 sub 张数保持不变：杀 20 / 火杀 5 / 雷杀 5 / 闪 15 / 桃 8 / 酒 5。
 */
export const ZML_BASIC: ZmlCardDef[] = [
  /* 杀（普通攻击，共 20） */
  { sub: 'sha', name: '蔓藤符', subtitle: '攻击', type: 'basic', count: 4, extra: { damageType: 'normal', attr: 'wood' }, desc: '对攻击范围内的一名角色造成 1 点伤害（木系藤蔓缠缚）', src: 'docs/md/物事/符篆.md · 藤蔓符（一阶攻击符，木系；本作写作蔓藤符）' },
  { sub: 'sha', name: '碧磷斩', subtitle: '攻击', type: 'basic', count: 4, extra: { damageType: 'normal', attr: 'fire' }, desc: '对攻击范围内的一名角色造成 1 点伤害（碧磷冷火斩击）', src: 'docs/md/物事/功法.md · 碧磷斩（二阶法术，斯温家）' },
  { sub: 'sha', name: '伏虎夺法', subtitle: '攻击', type: 'basic', count: 4, extra: { damageType: 'normal', attr: 'shou' }, desc: '对攻击范围内的一名角色造成 1 点伤害（近身夺法重击）', src: 'docs/md/物事/功法.md · 伏虎夺法（四阶近战法术，霍家家传）' },
  { sub: 'sha', name: '金剑封绝阵', subtitle: '攻击', type: 'basic', count: 4, extra: { damageType: 'normal', attr: 'metal' }, desc: '对攻击范围内的一名角色造成 1 点伤害（剑阵封锁）', src: 'docs/md/物事/符篆.md · 金剑封绝阵（三阶攻击符）' },
  { sub: 'sha', name: '万森惊木诀', subtitle: '攻击', type: 'basic', count: 4, extra: { damageType: 'normal', attr: 'wood' }, desc: '对攻击范围内的一名角色造成 1 点伤害（木系法术）', src: 'docs/md/物事/功法.md · 万森惊木诀（二阶木系功法）' },
  /* 火杀（火属性，共 5） */
  { sub: 'huo', name: '黑炎凤凰符宝', subtitle: '烈火攻击', type: 'basic', count: 2, extra: { damageType: 'fire', attr: 'fire' }, desc: '火属性伤害 1（黑炎凤凰灵兽之力）', src: 'docs/md/物事/符篆.md · 黑炎凤凰符宝' },
  { sub: 'huo', name: '澄蓝火焰符宝', subtitle: '烈火攻击', type: 'basic', count: 2, extra: { damageType: 'fire', attr: 'fire' }, desc: '火属性伤害 1（澄蓝烈焰）', src: 'docs/md/物事/符篆.md · 澄蓝火焰符宝' },
  { sub: 'huo', name: '熔岩火人召唤符', subtitle: '烈火攻击', type: 'basic', count: 1, extra: { damageType: 'fire', attr: 'fire' }, desc: '火属性伤害 1（召熔岩火人灼烧）', src: 'docs/md/物事/符篆.md · 熔岩火人召唤符（三阶召唤符）' },
  /* 雷杀（雷属性，共 5） */
  { sub: 'lei', name: '五雷焚心符', subtitle: '雷霆攻击', type: 'basic', count: 2, extra: { damageType: 'thunder', attr: 'lei' }, desc: '雷属性伤害 1（五雷轰心）', src: 'docs/md/物事/符篆.md · 五雷焚心符（二阶极品攻击符）' },
  { sub: 'lei', name: '神霄五雷正法', subtitle: '雷霆攻击', type: 'basic', count: 2, extra: { damageType: 'thunder', attr: 'lei' }, desc: '雷属性伤害 1（道家根本雷法）', src: 'docs/md/物事/功法.md · 神霄五雷正法（三阶雷法，大周书院）' },
  { sub: 'lei', name: '一指奔雷', subtitle: '雷霆攻击', type: 'basic', count: 1, extra: { damageType: 'thunder', attr: 'lei' }, desc: '雷属性伤害 1（雷系指法神通）', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md · 【一指奔雷】（雷系指法）' },
  /* 闪（防御，共 15） */
  { sub: 'shan', name: '遥及闪', subtitle: '防御', type: 'basic', count: 3, desc: '抵消一次【攻击】（遥及身法）', src: 'docs/md/物事/功法.md · 遥及闪（二阶中品身法）' },
  { sub: 'shan', name: '极空闪', subtitle: '防御', type: 'basic', count: 3, desc: '抵消一次【攻击】（极空身法残卷）', src: 'docs/md/物事/功法.md · 极空闪残卷（一阶极品身法）' },
  { sub: 'shan', name: '泼风盾舞', subtitle: '防御', type: 'basic', count: 3, desc: '抵消一次【攻击】（运盾之法，泼风难近）', src: 'docs/md/物事/功法.md · 泼风盾舞（一阶运盾之法）' },
  { sub: 'shan', name: '灵猴身法', subtitle: '防御', type: 'basic', count: 3, desc: '抵消一次【攻击】（灵猴腾挪）', src: 'docs/md/技能/灵猴身法.md · 灵猴身法' },
  { sub: 'shan', name: '幻珑闪', subtitle: '防御', type: 'basic', count: 3, desc: '抵消一次【攻击】（金丹自创身法）', src: 'docs/md/角色/楚秦门/03.金丹/齐休.md · 幻珑闪' },
  /* 桃（恢复，共 8） */
  { sub: 'tao', name: '回春丹', subtitle: '恢复', type: 'basic', count: 2, desc: '回复 1 点体力；濒死时可自救', src: 'docs/md/物事/丹药.md · 回春丹（一阶，治疗元素法术伤害）' },
  { sub: 'tao', name: '回血丹', subtitle: '恢复', type: 'basic', count: 2, desc: '回复 1 点体力；濒死时可自救', src: 'docs/md/物事/丹药.md · 回血丹（一阶下品，廉价回血丹）' },
  { sub: 'tao', name: '大还丹', subtitle: '恢复', type: 'basic', count: 2, desc: '回复 1 点体力；濒死时可自救', src: 'docs/md/物事/丹药.md · 大还丹（四阶，齐云特产）' },
  { sub: 'tao', name: '小还丹', subtitle: '恢复', type: 'basic', count: 2, desc: '回复 1 点体力；濒死时可自救', src: 'docs/md/物事/丹药.md · 小还丹（三阶，齐云特产）' },
  /* 酒（增益，共 5） */
  { sub: 'jiu', name: '真源丹', subtitle: '增益', type: 'basic', count: 2, desc: '本回合下一张【攻击】伤害 +1；濒死时可当【回春丹】', src: 'docs/md/物事/丹药.md · 真源丹（二阶上品，筑基顶级修为丹）' },
  { sub: 'jiu', name: '豹胎玄极丹', subtitle: '增益', type: 'basic', count: 2, desc: '本回合下一张【攻击】伤害 +1；濒死时可当【回春丹】', src: 'docs/md/物事/丹药.md · 豹胎玄极丹（二阶中品，辅助筑基）' },
  { sub: 'jiu', name: '三才培元丹', subtitle: '增益', type: 'basic', count: 1, desc: '本回合下一张【攻击】伤害 +1；濒死时可当【回春丹】', src: 'docs/md/物事/丹药.md · 三才培元丹（增金丹修为）' },
];

/* ---------------- 锦囊牌 55 张 ---------------- */
export const ZML_TRICK: ZmlCardDef[] = [
  { sub: 'wuxie', name: '不在算中', type: 'skill', count: 4, desc: '抵消一张锦囊：对方推演落空、算计不着', src: 'docs/md/角色/楚秦门/03.金丹/齐休.md【不在算中】；docs/md/技能/命隐符.md' },
  { sub: 'wuzhong', name: '趋吉避凶诀', subtitle: '趋吉避凶诀', type: 'skill', count: 4, desc: '摸 2 张牌', src: 'docs/md/物事/功法.md · 趋吉避凶诀楚慧心改（一阶上品）' },
  { sub: 'guohe', name: '破阵符', subtitle: '破阵符', type: 'skill', count: 6, desc: '弃置目标一张牌（装备优先）—— 破阵即破其护持', src: 'docs/md/物事/符篆.md · 一阶/二阶/高阶破阵符' },
  { sub: 'shunshou', name: '敛息诀', subtitle: '敛息诀', type: 'skill', count: 5, desc: '获得距离 1 内目标一张牌 —— 敛息潜近、悄然取物', src: 'docs/md/物事/功法.md · 敛息诀（敛息术，楚夺、齐休所修）' },
  { sub: 'juedou', name: '决斗', subtitle: '金刚真言棒法', type: 'skill', count: 3, desc: '双方轮流打出【攻击】，败者受伤', src: 'docs/md/物事/功法.md · 金刚真言棒法（二阶下品佛门近战法术）' },
  { sub: 'nanman', name: '魔灾泛起', subtitle: '魔灾泛起', type: 'skill', count: 3, extra: { taoism: 'mo' }, desc: '群攻（魔物灾祸席卷），需打出【攻击】抵御', src: 'docs/raw 第022卷第557章「魔灾的全貌」；外海魔灾' },
  { sub: 'wanjian', name: '万剑钻心', subtitle: '万剑钻心', type: 'skill', count: 1, desc: '群攻（数百飞剑攒刺），需打出【防御】抵御', src: 'docs/md/技能/万剑钻心.md' },
  { sub: 'taoyuan', name: '三木回心阵', subtitle: '三木回心阵', type: 'skill', count: 1, desc: '所有存活角色各回复 1 点体力', src: 'docs/md/技能/三木回心阵.md（多罗森三木同心本命衍生疗伤阵法）' },
  { sub: 'lebu', name: '七星定身阵', subtitle: '七星定身阵', type: 'skill', count: 3, extra: { judgeType: 'lebu' }, desc: '延时：判定若不为♥红桃，则跳过其出牌阶段', src: 'docs/md/技能/七星定身阵.md（七柄飞剑布阵锁定气机）' },
  { sub: 'bingliang', name: '哼哈真言', type: 'skill', count: 2, extra: { judgeType: 'bingliang' }, desc: '延时：判定若不为♣梅花，则跳过其摸牌阶段 —— 真言封喉、无从取物', src: 'docs/md/角色/楚秦门/03.金丹/齐休.md · 哼哈真言（真言破法）' },
  { sub: 'shandian', name: '天劫', subtitle: '天劫', type: 'skill', count: 2, extra: { judgeType: 'shandian', damageType: 'thunder' }, desc: '延时：判定若为♠黑桃 2~9，受到 3 点雷属性伤害', src: 'docs/md/设定/修行体系.md（九道雷劫 / 大道劫雷）；角色篇「天劫设定」' },
  { sub: 'jiedao', name: '银甲乐傀召唤符', subtitle: '银甲乐傀召唤符', type: 'skill', count: 2, desc: '令一名角色对另一名角色打出【攻击】—— 驱傀儡代你出手', src: 'docs/md/物事/符篆.md · 银甲乐傀召唤符；docs/md/技能/银甲乐傀.md' },
  { sub: 'wugu', name: '同参木阵', subtitle: '同参木阵', type: 'skill', count: 2, desc: '亮出若干张牌，存活者轮流各取 1 张 —— 同参共修、共享其利', src: 'docs/md/物事/功法.md · 同参木阵（一阶中品阵法，秦唯喻/阚缺/多罗森）' },
  { sub: 'tiesuo', name: '混元剑狱', subtitle: '混元剑狱', type: 'skill', count: 6, desc: '横置连环；属性伤害在所有连环角色间传导', src: 'docs/md/物事/功法.md · 混元剑狱（剑阵，齐妆）' },
  { sub: 'huogong', name: '极寒碧火诀', subtitle: '极寒碧火诀', type: 'skill', count: 3, extra: { damageType: 'fire', attr: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害', src: 'docs/md/物事/功法.md · 极寒碧火诀（二阶道书，斯温家）' },
  /* ---- 原著机制卡（新增 sub，由 actions.ts 专属 case 结算） ---- */
  { sub: 'guidai', name: '诡代之法', type: 'skill', count: 2, desc: '弃 1 张手牌，复制目标一个非限定技能直到你的下个回合开始', src: 'docs/md/设定/诡代法.md（楚秦门核心传承功法，以假代真）' },
  { sub: 'daizheng', name: '本命代征', type: 'skill', count: 1, desc: '弃 2 张手牌，本回合视为拥有目标的一个技能（超越代征物、显其本相）', src: 'docs/md/设定/本命代征.md（御兽门玉鹤所悟）' },
  { sub: 'mingyan', name: '命演术', type: 'skill', count: 2, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回', src: 'docs/md/技能/命演术.md（以十年阳寿推演命运之问）' },
  { sub: 'tongshi', name: '通明身识', type: 'skill', count: 2, desc: '本回合内你不能成为锦囊牌的目标', src: 'docs/md/技能/通明身识.md（融伪装、防御、隐匿为一体）' },
  { sub: 'quanzhi', name: '全知天眼', type: 'skill', count: 1, desc: '观看目标手牌并公开其本命；目标对你 +1 敌意（探听本命即结怨）', src: 'docs/md/物事/法器.md · 通明幻镜【全知天眼】；docs/md/设定/本命.md' },
  /* ---- 修为丹药（新增 sub 'dan'，服用后提升修为，可借此冲击境界突破） ---- */
  { sub: 'dan', name: '筑基丹', subtitle: '修为丹', type: 'skill', count: 3, desc: '服用后修为 +2（辅助冲击筑基的关键丹药；修为满足时可在出牌阶段突破）', src: 'docs/md/物事/丹药.md · 筑基丹（一阶极品，辅助冲击筑基）；docs/md/技能/筑基丹.md' },
];

/** 新增修真锦囊的 sub（需在 actions.ts 中结算） */
export const ZML_NEW_TRICK_SUBS: string[] = ['guidai', 'daizheng', 'mingyan', 'tongshi', 'quanzhi', 'dan'];

/* ---------------- 装备牌 31 张 ---------------- */
export const ZML_EQUIP: ZmlCardDef[] = [
  /* 兵器法宝 10（品阶映射攻击范围；仅作装备） */
  { sub: 'weapon', name: '灵狐剑匣', type: 'equip', count: 2, extra: { range: 1, skill: 'liannu' }, desc: '攻击范围 1；【匣中万剑】你使用【攻击】无次数限制', src: 'docs/md/物事/法宝/法宝列表.md（齐妆本命法宝）' },
  { sub: 'weapon', name: '伪无形剑', type: 'equip', count: 1, extra: { range: 4 }, desc: '攻击范围 4；【无形】不可被【破阵符】/【敛息诀】指定', src: 'docs/md/物事/法器.md（莫剑心冰源岛炼制三十年）' },
  { sub: 'weapon', name: '月影玄冰剑', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing' }, desc: '攻击范围 2；命中后改为弃置目标 2 张牌', src: 'docs/md/技能/月影玄冰剑.md（二阶上品，【冰封刃】）' },
  { sub: 'weapon', name: '心生蜂云剑', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong' }, desc: '攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/技能/心生蜂云剑.md（三十六把二阶极品飞剑）' },
  { sub: 'weapon', name: '洼角云刀', type: 'equip', count: 1, extra: { range: 3, skill: 'qinglong' }, desc: '攻击范围 3；目标打出【防御】后你可再出【攻击】', src: 'docs/md/技能/洼角云刀.md（三阶极品，内有电光）' },
  { sub: 'weapon', name: '七芯蝎尾夺', type: 'equip', count: 1, extra: { range: 2, skill: 'qinggang', attr: 'du' }, desc: '攻击范围 2；【破甲】无视目标护身法器', src: 'docs/md/物事/法宝/法宝列表.md（楚夺本命法宝，寒毒）' },
  { sub: 'weapon', name: '碧火幽魂刀', type: 'equip', count: 1, extra: { range: 2, skill: 'zhuque', attr: 'fire' }, desc: '攻击范围 2；可将一张普通【攻击】当【烈火攻击】使用', src: 'docs/md/技能/碧火幽魂刀.md（二阶，碧磷冷火成套）' },
  { sub: 'weapon', name: '青铜长戟', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi' }, desc: '攻击范围 3；【沉重】可弃 2 张牌令【攻击】强制命中', src: 'docs/md/物事/法宝/法宝列表.md（英伯本命法宝）' },
  { sub: 'weapon', name: '一剑碧环星', type: 'equip', count: 1, extra: { range: 3, skill: 'guding' }, desc: '攻击范围 3；目标无手牌时伤害 +1', src: 'docs/md/技能/一剑碧环星.md' },
  { sub: 'weapon', name: '七剑斩元星', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba' }, desc: '攻击范围 2；可弃 2 张牌当【攻击】使用', src: 'docs/md/技能/七剑斩元星.md' },

  /* 护身法器 6（法袍 / 法像 / 阵法） */
  { sub: 'armor', name: '猴面金身法像', type: 'equip', count: 1, extra: { skill: 'bagua', attr: 'metal' }, desc: '护身：手中无【防御】时判定，红色视为打出【防御】（【极坚固】+ 三花防御罩）', src: 'docs/md/技能/猴面金身法像.md（三阶成对，抵挡飞剑）' },
  { sub: 'armor', name: '清风法袍', type: 'equip', count: 1, extra: { skill: 'renwang', attr: 'feng' }, desc: '护身：黑色【攻击】对你无效（【风罩】符阵）', src: 'docs/md/技能/清风法袍.md（一阶中品道袍）' },
  { sub: 'armor', name: '映雪冰风阵', type: 'equip', count: 2, extra: { skill: 'tengjia', attr: 'water' }, desc: '护身：普通【攻击】与群攻锦囊对你无效；受到火属性伤害 +1（冰惧火）', src: 'docs/md/物事/法阵.md（二阶下品防护法阵，楚秦山）' },
  { sub: 'armor', name: '玄水归土阵', type: 'equip', count: 1, extra: { skill: 'xuanshui', attr: 'earth' }, desc: '护身：雷属性伤害（【天劫】/【雷霆攻击】）对你无效', src: 'docs/md/物事/法阵.md（三阶下品护山大阵，水土）' },
  { sub: 'armor', name: '广开道德金光大阵', type: 'equip', count: 1, extra: { skill: 'mingguang', attr: 'daode' }, desc: '护身：你每次受到的伤害 -1（最低 1 点）', src: 'docs/md/技能/广开道德金光大阵.md（一阶上品，黑河峰）' },

  /* 载具 10（取代 ±1 马；进 = -1 距离，守 = +1 距离） */
  { sub: 'horse-', name: '乙木御风梭', type: 'equip', count: 2, extra: { dist: 1 }, desc: '载具·进：你计算与其他角色的距离 -1', src: 'docs/md/技能/乙木御风梭.md（三阶极品，可搭载多人）' },
  { sub: 'horse-', name: '幻木灵梭', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·进：你计算与其他角色的距离 -1', src: 'docs/md/物事/法器.md（一阶飞行法器）' },
  { sub: 'horse-', name: '灵竹纸鸢', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·进：你计算与其他角色的距离 -1', src: 'docs/md/物事/法器.md（一阶飞行法器）' },
  { sub: 'horse-', name: '无形鹤', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·进：距离 -1；且不可被【破阵符】弃置', src: 'docs/md/物事/灵兽.md（五阶灵兽，玉鹤伴兽）' },
  { sub: 'horse+', name: '虾驼兽', type: 'equip', count: 2, extra: { dist: 1 }, desc: '载具·守：其他角色计算与你的距离 +1', src: 'docs/md/设定/虾驼兽.md（御兽门特产）' },
  { sub: 'horse+', name: '陆行驮兽', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·守：其他角色计算与你的距离 +1', src: 'docs/md/物事/灵兽.md（二阶驮兽）' },
  { sub: 'horse+', name: '银背驮鳐', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·守：距离 +1；且【万剑钻心】对你无效', src: 'docs/md/物事/灵兽.md（三阶驮兽）' },
  { sub: 'horse+', name: '风阵灵舟', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·守：其他角色计算与你的距离 +1', src: 'docs/md/物事/法器.md（一阶舟）' },
  { sub: 'horse+', name: '飞蟹', type: 'equip', count: 1, extra: { dist: 1 }, desc: '载具·守：距离 +1；相邻同族队友同样视为 +1（兽船载客）', src: 'docs/md/设定/虾驼兽.md（兽船本体：青黑蟹壳、巨大透明翅）' },

  /* 法宝 4（不是独立槽位：按 equipSlot 装备进武器槽＝进攻型 / 防具槽＝防守型） */
  { sub: 'fabao', name: '青灵石蒲团', type: 'equip', count: 1, extra: { skill: 'muyu', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：摸牌阶段额外摸 1 张牌（门派配发内门弟子的同参之物）', src: 'docs/md/技能/青灵石蒲团.md' },
  { sub: 'fabao', name: '储物袋', type: 'equip', count: 1, extra: { skill: 'chuwu', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你的手牌上限 +2', src: 'docs/md/技能/储物袋.md' },
  { sub: 'fabao', name: '通天令', type: 'equip', count: 1, extra: { skill: 'tongtian', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：你使用的【攻击】无视目标的护身法器', src: 'docs/md/设定/通天令.md（向大周书院告发的秘宝）' },
  { sub: 'fabao', name: '通明幻镜', type: 'equip', count: 1, extra: { skill: 'tongming', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：每局限 1 次，判定牌生效前可用一张手牌替换之', src: 'docs/md/物事/法器.md · 通明幻镜（四阶→五阶，含【全知天眼】）' },

  /* 阵法类防具 1（原宝物，按防护特性归入防具槽） */
  { sub: 'armor', name: '红玉阵盘', type: 'equip', count: 1, extra: { skill: 'hongyu' }, desc: '防具·阵法：受到伤害时可支付 1 灵石，令该伤害 -1', src: 'docs/md/技能/红玉阵盘.md（十方风火归元大阵控制阵盘）' },
];

/* ---------------- 原著技能卡（打出即结算） ----------------
 * 沿用现有锦囊结算 key（wuzhong 摸2 / mingyan 观顶3取1 / huogong 极寒碧火诀 / jiedao 借刀 …），
 * 仅换修真卡名与副题，故结算 / 响应链 / AI 分支零改动。
 */
export const ZML_SKILL_EXTRA: ZmlCardDef[] = [
  { sub: 'wuzhong', name: '心血来潮', type: 'skill', count: 1, desc: '摸 2 张牌（心有所感，福至心灵）', src: 'K-齐休本命天赋【心血来潮】' },
  { sub: 'mingyan', name: '料敌机先', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回', src: 'K-齐休本命天赋【料敌机先】' },
  { sub: 'wanjian', name: '心生蜂云剑', type: 'skill', count: 1, desc: '群攻（三十六柄飞剑攒刺），需打出【防御】抵御', src: 'K-心生蜂云剑；docs/md/角色/楚秦门/03.金丹/齐妆.md' },
  { sub: 'huogong', name: '幻影夺心刺', type: 'skill', count: 1, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害（幻影迷惑、一刺夺心）', src: 'K-幻影夺心刺；docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { sub: 'mingyan', name: '明月高悬', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回（幻月高悬，照见前路）', src: 'K-明月高悬；docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { sub: 'taoyuan', name: '万影渡生', type: 'skill', count: 1, desc: '所有存活角色各回复 1 点体力（三千分身渡同门于危难）', src: 'K-万影渡生；docs/md/角色/楚秦门/03.金丹/楚无影.md' },
  { sub: 'wuzhong', name: '明心见性诀', type: 'skill', count: 1, desc: '摸 2 张牌（明心见性，佛门手段）', src: 'B-明心见性诀楚慧心改；docs/md/角色/楚秦门/03.金丹/明真.md' },
  { sub: 'mingyan', name: '通明剑诀并注', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回', src: 'B-通明剑诀并注；docs/md/角色/楚秦门/03.金丹/秦长风.md' },
  { sub: 'jiedao', name: '驱虎吞狼', type: 'skill', count: 1, desc: '令一名角色对另一名角色打出【攻击】—— 谋主借力打力', src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md（献计借黑手搅乱陵梁宗）' },
  { sub: 'nanman', name: '魔化', type: 'skill', count: 1, desc: '群攻（堕入魔道，魔气席卷），需打出【攻击】抵御', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（逃入魔井遇元婴魔蛇）' },
  { sub: 'guohe', name: '传送阵', type: 'skill', count: 1, desc: '弃置目标一张牌（装备优先）—— 传送阵法截断其护持', src: 'docs/md/角色/散修/03.金丹/何玉.md（北丁申山传送遁走）' },
  { sub: 'nanman', name: '楚秦军阵', type: 'skill', count: 1, desc: '群攻（楚秦军阵压境），需打出【攻击】抵御', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md（总理楚秦军阵）' },
  { sub: 'lebu', name: '楚秦门规', type: 'skill', count: 1, extra: { judgeType: 'lebu' }, desc: '延时：判定若不为♥红桃，则跳过其出牌阶段（五级身份制，门规森严）', src: 'docs/md/角色/楚秦门/02.筑基/白晓生.md（定楚秦五级身份制）' },
  { sub: 'wuzhong', name: '明心见性诀楚慧心改', type: 'skill', count: 1, desc: '摸 2 张牌（楚慧心改版，南楚传承）', src: 'B-明心见性诀楚慧心改；docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'nanman', name: '七元婴合围', type: 'skill', count: 1, desc: '群攻（七位元婴合围之势），需打出【攻击】抵御', src: 'docs/md/角色/齐云/04.元婴/楚神通.md（参与七元婴围攻战）' },
  { sub: 'guohe', name: '本家孤女', type: 'skill', count: 1, desc: '弃置目标一张牌（装备优先）—— 以「本家孤女」名义掩人耳目', src: 'docs/md/角色/齐云/03.金丹/楚夺.md（盗婴案掩饰手法）' },
  { sub: 'huogong', name: '业火焚心', type: 'skill', count: 1, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害', src: 'docs/md/角色/齐云/03.金丹/姜炎.md（红莲业火焚心）' },
  { sub: 'wanjian', name: '一掌', type: 'skill', count: 1, desc: '群攻（化神一掌，势不可挡），需打出【防御】抵御', src: 'docs/md/角色/齐云/05.化神/天地峰座主.md（一掌击开聂疯子飞剑）' },
  { sub: 'mingyan', name: '命演借力', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回（借赤尻马猴施命演术）', src: 'docs/md/角色/齐云/05.化神/南宫木.md' },
  { sub: 'lebu', name: '伪六道', type: 'skill', count: 1, extra: { judgeType: 'lebu' }, desc: '延时：判定若不为♥红桃，则跳过其出牌阶段（黑河峰底伪六道空间）', src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md' },
  { sub: 'huogong', name: '星陨火球', type: 'skill', count: 1, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害（大火星陨）', src: 'K-星陨火球；docs/md/角色/白山/05.化神/贾长庚.md' },
  { sub: 'nanman', name: '潜意识扑击', type: 'skill', count: 1, desc: '群攻（昏睡中的本能扑击，瞬杀元婴），需打出【攻击】抵御', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md' },
];

/* ---------------- 法宝·进攻（装备进武器槽） ----------------
 * 法宝不是独立槽位：sub='fabao' 分类 + extra.equipSlot 决定落武器槽 / 防具槽。
 * 效果沿用现有装备结算 key（liannu / hanbing / cixiong …），故引擎零改动。
 */
export const ZML_FABAO_ATK: ZmlCardDef[] = [
  { sub: 'fabao', name: '破幻之眼', type: 'equip', count: 1, extra: { range: 2, skill: 'qinggang', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；【破幻】你使用的【攻击】无视目标护身法器', src: 'K-齐休本命天赋【破幻之眼】' },
  { sub: 'fabao', name: '鎏花幻月剑匣', type: 'equip', count: 1, extra: { range: 1, skill: 'liannu', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 1；【匣中万剑】你使用【攻击】无次数限制', src: 'docs/md/角色/楚秦门/03.金丹/齐妆.md（本命，由鎏花妆匣进化）' },
  { sub: 'fabao', name: '月影剑', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌', src: 'docs/md/角色/楚秦门/03.金丹/齐妆.md（继承莫剑心四阶无形月影剑）' },
  { sub: 'fabao', name: '三相精金', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【攻击】使用', src: 'docs/md/角色/楚秦门/02.筑基/莫剑心.md（三本命之一）' },
  { sub: 'fabao', name: '幽影万幻刀', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md（诡代所得）' },
  { sub: 'fabao', name: '幽暗影刀', type: 'equip', count: 1, extra: { range: 2, skill: 'qinglong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标打出【防御】后你可再出【攻击】', src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md（同参多影阁→幽暗影刀）' },
  { sub: 'fabao', name: '慈悲普度剑', type: 'equip', count: 1, extra: { range: 3, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；目标无手牌时伤害 +1（专克邪魔）', src: 'docs/md/角色/楚秦门/03.金丹/明真.md；docs/md/角色/白山/03.金丹/法引.md' },
  { sub: 'fabao', name: '星剑', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/角色/楚秦门/03.金丹/秦长风.md（莫剑心所铸四阶无形星剑）' },
  { sub: 'fabao', name: '楚秦盟令', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【攻击】使用', src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md（楚秦盟）' },
  { sub: 'fabao', name: '聚魂棺', type: 'equip', count: 1, extra: { range: 2, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标无手牌时伤害 +1', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（散魂棺之对）' },
  { sub: 'fabao', name: '神傀法器', type: 'equip', count: 1, extra: { range: 2, skill: 'qinglong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标打出【防御】后你可再出【攻击】', src: 'docs/md/角色/散修/03.金丹/何玉.md（白山密宗神傀化身）' },
  { sub: 'fabao', name: '鬼幡', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao', attr: 'guiwu' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌（内含霍虎魂魄）', src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md' },
  { sub: 'fabao', name: '霹雳追光剑', type: 'equip', count: 1, extra: { range: 2, skill: 'qinggang', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你使用的【攻击】无视目标护身法器（雷系本命）', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md（本命）' },
  { sub: 'fabao', name: '劫真剑', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；【沉重】可弃 2 张牌令【攻击】强制命中', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md（本命剑觉醒名「劫真」）' },
  { sub: 'fabao', name: '念力黑珠', type: 'equip', count: 1, extra: { range: 3, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；目标无手牌时伤害 +1（冲击识海）', src: 'docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'fabao', name: '红莲业火符', type: 'equip', count: 1, extra: { range: 2, skill: 'zhuque', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；可将一张普通【攻击】当【烈火攻击】使用', src: 'docs/md/角色/齐云/03.金丹/姜炎.md' },
  { sub: 'fabao', name: '七芯寒毒', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao', attr: 'du' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌（寒毒）', src: 'docs/md/角色/齐云/03.金丹/楚夺.md（七芯蝎尾夺寒毒）' },
  { sub: 'fabao', name: '七星宝剑', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；【沉重】可弃 2 张牌令【攻击】强制命中', src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { sub: 'fabao', name: '斩元星', type: 'equip', count: 1, extra: { range: 2, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标无手牌时伤害 +1', src: 'docs/md/角色/齐云/04.元婴/楚问.md（七星剑诀·斩元星）' },
  { sub: 'fabao', name: '执法峰令', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【攻击】使用', src: 'docs/md/角色/齐云/05.化神/刑铣.md' },
  { sub: 'fabao', name: '青木龙珠', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/角色/齐云/05.化神/南宫木.md（青木为龙）' },
  { sub: 'fabao', name: '南宫聘礼', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【攻击】使用', src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md（南宫家联姻聘礼）' },
  { sub: 'fabao', name: '长庚星光柱', type: 'equip', count: 1, extra: { range: 1, skill: 'liannu', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 1；【光柱分化】你使用【攻击】无次数限制（一化二、二化四）', src: 'docs/md/角色/白山/05.化神/贾长庚.md' },
  { sub: 'fabao', name: '大火星陨', type: 'equip', count: 1, extra: { range: 2, skill: 'zhuque', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；可将一张普通【攻击】当【烈火攻击】使用', src: 'docs/md/角色/白山/05.化神/贾长庚.md（前世本命大火星）' },
  { sub: 'fabao', name: '八音祛邪佛光仗', type: 'equip', count: 1, extra: { range: 2, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；【沉重】可弃 2 张牌令【攻击】强制命中（二阶极品禅杖）', src: 'docs/md/角色/白山/03.金丹/法引.md（齐休所赠）' },
  { sub: 'fabao', name: '九头玉种', type: 'equip', count: 1, extra: { range: 1, skill: 'liannu', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 1；你使用【攻击】无次数限制', src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md（本命）' },
  { sub: 'fabao', name: '银白鬃毛', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao', lingshou: true }, desc: '法宝·进攻：攻击范围 3；【沉重】可弃 2 张牌令【攻击】强制命中（灵兽之鬃）', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md（银白色长鬃）' },
  { sub: 'fabao', name: '狮吼', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌（吼声震魂）', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md（向九星坊示威吼叫）' },
];

/* ---------------- 法宝·防守（装备进防具槽） ---------------- */
export const ZML_FABAO_DEF: ZmlCardDef[] = [
  { sub: 'fabao', name: '身随意动', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】', src: 'K-齐休本命天赋【身随意动】' },
  { sub: 'fabao', name: '蜂云剑阵', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（三十六柄飞剑护体）', src: 'B-蜂云剑阵；docs/md/角色/楚秦门/03.金丹/齐妆.md' },
  { sub: 'fabao', name: '幻月盖体', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效（幻月盖体）', src: 'K-幻月盖体；docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { sub: 'fabao', name: '影遁', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效（影遁身法）', src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md' },
  { sub: 'fabao', name: '牛毛金针', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（一囊御群针）', src: 'docs/md/角色/楚秦门/03.金丹/明真.md（破【血罟根】）' },
  { sub: 'fabao', name: '流水菩提串', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（同参之物）', src: 'docs/md/角色/散修/03.金丹/何玉.md（同参流水菩提串）' },
  { sub: 'fabao', name: '星闪', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】（自遥及闪悟出）', src: 'docs/md/角色/楚秦门/03.金丹/秦长风.md（星闪→星遁）' },
  { sub: 'fabao', name: '星雪秘蛇胸针', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'J-星雪秘蛇胸针；docs/md/角色/楚秦门/03.金丹/秦长风.md' },
  { sub: 'fabao', name: '谋主', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】（运筹帷幄）', src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md（楚秦谋主）' },
  { sub: 'fabao', name: '甘家灵药', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（灵药阁甘家）', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（妻甘舞儿、甘怜儿）' },
  { sub: 'fabao', name: '白沙帮令', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（白沙帮主）' },
  { sub: 'fabao', name: '水土双本命', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效（水土护持）', src: 'docs/md/角色/散修/03.金丹/何玉.md（本命）' },
  { sub: 'fabao', name: '熊氏重甲', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（北烈山熊氏）', src: 'docs/md/角色/楚秦门/03.金丹/熊十四.md' },
  { sub: 'fabao', name: '五烟绮罗纱', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao', taoism: 'mo' }, desc: '法宝·防守：黑色【攻击】对你无效（魔修纱衣，雷法难容）', src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md' },
  { sub: 'fabao', name: '小红', type: 'equip', count: 1, extra: { skill: 'tengjia', equipSlot: 'armor', category: 'fabao', taoism: 'mo' }, desc: '法宝·防守：普通【攻击】与群攻技能对你无效；受到火属性伤害 +1（魔化之躯）', src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md（化名小红）' },
  { sub: 'fabao', name: '藏经阁钥匙', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效', src: 'docs/md/角色/楚秦门/02.筑基/白晓生.md（管藏经阁数十年）' },
  { sub: 'fabao', name: '红玉屏风', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'fabao', name: '万丈天火', type: 'equip', count: 1, extra: { skill: 'tengjia', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：普通【攻击】与群攻技能对你无效；受到火属性伤害 +1', src: 'K-万丈天火；docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'fabao', name: '元婴威压', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效（元婴后期威压）', src: 'docs/md/角色/齐云/04.元婴/楚震.md' },
  { sub: 'fabao', name: '楚云峰令', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效', src: 'docs/md/角色/齐云/04.元婴/楚神通.md' },
  { sub: 'fabao', name: '七星剑鞘', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】（曾硬抗司空宙星空大道）', src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { sub: 'fabao', name: '七星剑阵', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { sub: 'fabao', name: '楚家玉简', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效', src: 'docs/md/角色/齐云/03.金丹/楚夺.md（赐齐休玉简）' },
  { sub: 'fabao', name: '万骨共生', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao', taoism: 'gui' }, desc: '法宝·防守：你每次受到的伤害 -1（与金丹鬼修万骨共生）', src: 'docs/md/角色/齐云/03.金丹/姜炎.md' },
  { sub: 'fabao', name: '空间束缚', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效', src: 'K-空间束缚之力；docs/md/角色/齐云/03.金丹/姜炎.md' },
  { sub: 'fabao', name: '照规矩办', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】（「照规矩办就是公平」）', src: 'docs/md/角色/齐云/05.化神/刑铣.md' },
  { sub: 'fabao', name: '天地峰威压', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'docs/md/角色/齐云/05.化神/天地峰座主.md' },
  { sub: 'fabao', name: '木之大道', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效（木之大道护持）', src: 'docs/md/角色/齐云/05.化神/南宫木.md（本命）' },
  { sub: 'fabao', name: '南宫家令', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效', src: 'docs/md/角色/齐云/05.化神/南宫木.md（南宫家）' },
  { sub: 'fabao', name: '空谷幽兰', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】（空谷幽兰之美）', src: 'docs/md/角色/齐云/02.筑基/南宫湘.md（相貌与南宫梦相像）' },
  { sub: 'fabao', name: '玉屏风', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（效仿芩老祖的玉屏风）', src: 'docs/md/角色/齐云/04.元婴/南宫止.md；docs/md/势力/008.外海/人物/05.化神/芩老祖.md' },
  { sub: 'fabao', name: '护身项链', type: 'equip', count: 1, extra: { skill: 'tengjia', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：普通【攻击】与群攻技能对你无效；受到火属性伤害 +1', src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md（伪六道空间反击杀秦思瑶）' },
  { sub: 'fabao', name: '人祭强化', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（人祭强化双星）', src: 'docs/md/角色/白山/05.化神/贾长庚.md' },
  { sub: 'fabao', name: '多宝眩光袈裟', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（三阶下品，诸宝石各有妙用）', src: 'docs/md/角色/白山/03.金丹/法引.md（齐休所赠）' },
  { sub: 'fabao', name: '精华内敛', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【防御】时判定，红色视为打出【防御】（酆水战后判若两人）', src: 'docs/md/角色/白山/03.金丹/法引.md' },
  { sub: 'fabao', name: '水滴形玉玦', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效', src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md' },
  { sub: 'fabao', name: '无形鹤伴兽', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【攻击】对你无效', src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md（代征五阶无形鹤）' },
  { sub: 'fabao', name: '元犼真身', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao', lingshou: true }, desc: '法宝·防守：你每次受到的伤害 -1（化神元犼之躯，灵兽之躯）', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md（本命）' },
];

export const ZML_ALL: ZmlCardDef[] = [...ZML_BASIC, ...ZML_TRICK, ...ZML_EQUIP, ...ZML_FABAO_ATK, ...ZML_FABAO_DEF, ...ZML_SKILL_EXTRA];

/** 掌门路牌堆总张数（237，含新增 3 张筑基丹） */
export const ZML_DECK_TOTAL: number = ZML_ALL.reduce((s, d) => s + d.count, 0);

/** 按 sub 取首条定义（锦囊 / 基本牌文案兜底） */
export function zmlDefOf(sub: string): ZmlCardDef | undefined {
  return ZML_ALL.find((d) => d.sub === sub);
}

/** 按 sub + 卡名取定义（装备同名 sub 需按名字区分） */
export function zmlDefOfCard(c: Card): ZmlCardDef | undefined {
  return ZML_ALL.find((d) => d.sub === c.sub && d.name === c.name);
}

/** 该牌在掌门路模式下的展示名（找不到则沿用原卡名） */
export function zmlCardName(c: Card): string {
  return zmlDefOfCard(c)?.name || c.name;
}

/** 卡面副题 */
export function zmlCardSubtitle(c: Card): string | undefined {
  return zmlDefOfCard(c)?.subtitle;
}
