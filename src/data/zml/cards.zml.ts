/* ==================== 掌门路修真牌堆（144 张） ====================
 * 选词规则：所有卡名均出自 docs/（详见 docs/掌门路规则设计.md 的出处审计表）。
 *   - 基本牌沿用三国杀原名「杀 / 火杀 / 雷杀 / 闪」，桃 → 回春丹、酒 → 真源丹
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

/* ---------------- 基本牌 58 张 ---------------- */
export const ZML_BASIC: ZmlCardDef[] = [
  { sub: 'sha', name: '杀', subtitle: '御剑', type: 'basic', count: 20, extra: { damageType: 'normal' }, desc: '对攻击范围内的一名角色造成 1 点伤害', src: '通用攻击（docs/md/物事/法器.md 飞剑类高频词）' },
  { sub: 'huo', name: '火杀', subtitle: '碧磷斩', type: 'basic', count: 5, extra: { damageType: 'fire' }, desc: '火属性伤害 1（碧磷冷火）', src: 'docs/md/物事/功法.md · 碧磷斩（二阶法术，斯温家）' },
  { sub: 'lei', name: '雷杀', subtitle: '五雷焚心符', type: 'basic', count: 5, extra: { damageType: 'thunder' }, desc: '雷属性伤害 1', src: 'docs/md/物事/符篆.md · 五雷焚心符（二阶极品攻击符）' },
  { sub: 'shan', name: '闪', subtitle: '遥及闪', type: 'basic', count: 15, desc: '抵消一次【杀】', src: 'docs/md/物事/功法.md · 遥及闪（二阶中品身法）' },
  { sub: 'tao', name: '回春丹', subtitle: '桃', type: 'basic', count: 8, desc: '回复 1 点体力；濒死时可自救', src: 'docs/md/物事/丹药.md · 回春丹（一阶，治疗元素法术伤害）' },
  { sub: 'jiu', name: '真源丹', subtitle: '酒', type: 'basic', count: 5, desc: '本回合下一张【杀】伤害 +1；濒死时可当【回春丹】', src: 'docs/md/物事/丹药.md · 真源丹（二阶上品，筑基修士顶级修为丹）' },
];

/* ---------------- 锦囊牌 55 张 ---------------- */
export const ZML_TRICK: ZmlCardDef[] = [
  { sub: 'wuxie', name: '不在算中', subtitle: '无懈可击', type: 'skill', count: 4, desc: '抵消一张锦囊：对方推演落空、算计不着', src: 'docs/md/角色/楚秦门/03.金丹/齐休.md【不在算中】；docs/md/技能/命隐符.md' },
  { sub: 'wuzhong', name: '趋吉避凶诀', subtitle: '无中生有', type: 'skill', count: 4, desc: '摸 2 张牌', src: 'docs/md/物事/功法.md · 趋吉避凶诀楚慧心改（一阶上品）' },
  { sub: 'guohe', name: '破阵符', subtitle: '过河拆桥', type: 'skill', count: 6, desc: '弃置目标一张牌（装备优先）—— 破阵即破其护持', src: 'docs/md/物事/符篆.md · 一阶/二阶/高阶破阵符' },
  { sub: 'shunshou', name: '敛息诀', subtitle: '顺手牵羊', type: 'skill', count: 5, desc: '获得距离 1 内目标一张牌 —— 敛息潜近、悄然取物', src: 'docs/md/物事/功法.md · 敛息诀（敛息术，楚夺、齐休所修）' },
  { sub: 'juedou', name: '决斗', subtitle: '金刚真言棒法', type: 'skill', count: 3, desc: '双方轮流打出【杀】，败者受伤', src: 'docs/md/物事/功法.md · 金刚真言棒法（二阶下品佛门近战法术）' },
  { sub: 'nanman', name: '魔灾泛起', subtitle: '南蛮入侵', type: 'skill', count: 3, desc: '群攻（魔物灾祸席卷），需打出【杀】抵御', src: 'docs/raw 第022卷第557章「魔灾的全貌」；外海魔灾' },
  { sub: 'wanjian', name: '万剑钻心', subtitle: '万箭齐发', type: 'skill', count: 1, desc: '群攻（数百飞剑攒刺），需打出【闪】抵御', src: 'docs/md/技能/万剑钻心.md' },
  { sub: 'taoyuan', name: '三木回心阵', subtitle: '桃园结义', type: 'skill', count: 1, desc: '所有存活角色各回复 1 点体力', src: 'docs/md/技能/三木回心阵.md（多罗森三木同心本命衍生疗伤阵法）' },
  { sub: 'lebu', name: '七星定身阵', subtitle: '乐不思蜀', type: 'skill', count: 3, extra: { judgeType: 'lebu' }, desc: '延时：判定若不为♥红桃，则跳过其出牌阶段', src: 'docs/md/技能/七星定身阵.md（七柄飞剑布阵锁定气机）' },
  { sub: 'bingliang', name: '藤蔓符', subtitle: '兵粮寸断', type: 'skill', count: 2, extra: { judgeType: 'bingliang' }, desc: '延时：判定若不为♣梅花，则跳过其摸牌阶段 —— 藤蔓缠身、无从取物', src: 'docs/md/物事/符篆.md · 藤蔓符（一阶攻击符，木系）' },
  { sub: 'shandian', name: '天劫', subtitle: '闪电', type: 'skill', count: 2, extra: { judgeType: 'shandian', damageType: 'thunder' }, desc: '延时：判定若为♠黑桃 2~9，受到 3 点雷属性伤害', src: 'docs/md/设定/修行体系.md（九道雷劫 / 大道劫雷）；角色篇「天劫设定」' },
  { sub: 'jiedao', name: '银甲乐傀召唤符', subtitle: '借刀杀人', type: 'skill', count: 2, desc: '令一名角色对另一名角色打出【杀】—— 驱傀儡代你出手', src: 'docs/md/物事/符篆.md · 银甲乐傀召唤符；docs/md/技能/银甲乐傀.md' },
  { sub: 'wugu', name: '同参木阵', subtitle: '五谷丰登', type: 'skill', count: 2, desc: '亮出若干张牌，存活者轮流各取 1 张 —— 同参共修、共享其利', src: 'docs/md/物事/功法.md · 同参木阵（一阶中品阵法，秦唯喻/阚缺/多罗森）' },
  { sub: 'tiesuo', name: '混元剑狱', subtitle: '铁索连环', type: 'skill', count: 6, desc: '横置连环；属性伤害在所有连环角色间传导', src: 'docs/md/物事/功法.md · 混元剑狱（剑阵，齐妆）' },
  { sub: 'huogong', name: '极寒碧火诀', subtitle: '火攻', type: 'skill', count: 3, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害', src: 'docs/md/物事/功法.md · 极寒碧火诀（二阶道书，斯温家）' },
  /* ---- 原著机制卡（新增 sub，由 actions.ts 专属 case 结算） ---- */
  { sub: 'guidai', name: '诡代之法', type: 'skill', count: 2, desc: '弃 1 张手牌，复制目标一个非限定技能直到你的下个回合开始', src: 'docs/md/设定/诡代法.md（楚秦门核心传承功法，以假代真）' },
  { sub: 'daizheng', name: '本命代征', type: 'skill', count: 1, desc: '弃 2 张手牌，本回合视为拥有目标的一个技能（超越代征物、显其本相）', src: 'docs/md/设定/本命代征.md（御兽门玉鹤所悟）' },
  { sub: 'mingyan', name: '命演术', type: 'skill', count: 2, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回', src: 'docs/md/技能/命演术.md（以十年阳寿推演命运之问）' },
  { sub: 'tongshi', name: '通明身识', type: 'skill', count: 2, desc: '本回合内你不能成为锦囊牌的目标', src: 'docs/md/技能/通明身识.md（融伪装、防御、隐匿为一体）' },
  { sub: 'quanzhi', name: '全知天眼', type: 'skill', count: 1, desc: '观看目标手牌并公开其本命；目标对你 +1 敌意（探听本命即结怨）', src: 'docs/md/物事/法器.md · 通明幻镜【全知天眼】；docs/md/设定/本命.md' },
];

/** 新增修真锦囊的 sub（需在 actions.ts 中结算） */
export const ZML_NEW_TRICK_SUBS: string[] = ['guidai', 'daizheng', 'mingyan', 'tongshi', 'quanzhi'];

/* ---------------- 装备牌 31 张 ---------------- */
export const ZML_EQUIP: ZmlCardDef[] = [
  /* 兵器法宝 10（品阶映射攻击范围；仅作装备） */
  { sub: 'weapon', name: '灵狐剑匣', type: 'equip', count: 2, extra: { range: 1, skill: 'liannu' }, desc: '攻击范围 1；【匣中万剑】你使用【杀】无次数限制', src: 'docs/md/物事/法宝/法宝列表.md（齐妆本命法宝）' },
  { sub: 'weapon', name: '伪无形剑', type: 'equip', count: 1, extra: { range: 4 }, desc: '攻击范围 4；【无形】不可被【破阵符】/【敛息诀】指定', src: 'docs/md/物事/法器.md（莫剑心冰源岛炼制三十年）' },
  { sub: 'weapon', name: '月影玄冰剑', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing' }, desc: '攻击范围 2；命中后改为弃置目标 2 张牌', src: 'docs/md/技能/月影玄冰剑.md（二阶上品，【冰封刃】）' },
  { sub: 'weapon', name: '心生蜂云剑', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong' }, desc: '攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/技能/心生蜂云剑.md（三十六把二阶极品飞剑）' },
  { sub: 'weapon', name: '洼角云刀', type: 'equip', count: 1, extra: { range: 3, skill: 'qinglong' }, desc: '攻击范围 3；目标打出【闪】后你可再出【杀】', src: 'docs/md/技能/洼角云刀.md（三阶极品，内有电光）' },
  { sub: 'weapon', name: '七芯蝎尾夺', type: 'equip', count: 1, extra: { range: 2, skill: 'qinggang' }, desc: '攻击范围 2；【破甲】无视目标护身法器', src: 'docs/md/物事/法宝/法宝列表.md（楚夺本命法宝，寒毒）' },
  { sub: 'weapon', name: '碧火幽魂刀', type: 'equip', count: 1, extra: { range: 2, skill: 'zhuque' }, desc: '攻击范围 2；可将一张普通【杀】当【火杀】使用', src: 'docs/md/技能/碧火幽魂刀.md（二阶，碧磷冷火成套）' },
  { sub: 'weapon', name: '青铜长戟', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi' }, desc: '攻击范围 3；【沉重】可弃 2 张牌令【杀】强制命中', src: 'docs/md/物事/法宝/法宝列表.md（英伯本命法宝）' },
  { sub: 'weapon', name: '一剑碧环星', type: 'equip', count: 1, extra: { range: 3, skill: 'guding' }, desc: '攻击范围 3；目标无手牌时伤害 +1', src: 'docs/md/技能/一剑碧环星.md' },
  { sub: 'weapon', name: '七剑斩元星', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba' }, desc: '攻击范围 2；可弃 2 张牌当【杀】使用', src: 'docs/md/技能/七剑斩元星.md' },

  /* 护身法器 6（法袍 / 法像 / 阵法） */
  { sub: 'armor', name: '猴面金身法像', type: 'equip', count: 1, extra: { skill: 'bagua' }, desc: '护身：手中无【闪】时判定，红色视为打出【闪】（【极坚固】+ 三花防御罩）', src: 'docs/md/技能/猴面金身法像.md（三阶成对，抵挡飞剑）' },
  { sub: 'armor', name: '清风法袍', type: 'equip', count: 1, extra: { skill: 'renwang' }, desc: '护身：黑色【杀】对你无效（【风罩】符阵）', src: 'docs/md/技能/清风法袍.md（一阶中品道袍）' },
  { sub: 'armor', name: '映雪冰风阵', type: 'equip', count: 2, extra: { skill: 'tengjia' }, desc: '护身：普通【杀】与群攻锦囊对你无效；受到火属性伤害 +1（冰惧火）', src: 'docs/md/物事/法阵.md（二阶下品防护法阵，楚秦山）' },
  { sub: 'armor', name: '玄水归土阵', type: 'equip', count: 1, extra: { skill: 'xuanshui' }, desc: '护身：雷属性伤害（【天劫】/【雷杀】）对你无效', src: 'docs/md/物事/法阵.md（三阶下品护山大阵，水土）' },
  { sub: 'armor', name: '广开道德金光大阵', type: 'equip', count: 1, extra: { skill: 'mingguang' }, desc: '护身：你每次受到的伤害 -1（最低 1 点）', src: 'docs/md/技能/广开道德金光大阵.md（一阶上品，黑河峰）' },

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
  { sub: 'fabao', name: '通天令', type: 'equip', count: 1, extra: { skill: 'tongtian', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：你使用的【杀】无视目标的护身法器', src: 'docs/md/设定/通天令.md（向大周书院告发的秘宝）' },
  { sub: 'fabao', name: '通明幻镜', type: 'equip', count: 1, extra: { skill: 'tongming', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：每局限 1 次，判定牌生效前可用一张手牌替换之', src: 'docs/md/物事/法器.md · 通明幻镜（四阶→五阶，含【全知天眼】）' },

  /* 阵法类防具 1（原宝物，按防护特性归入防具槽） */
  { sub: 'armor', name: '红玉阵盘', type: 'equip', count: 1, extra: { skill: 'hongyu' }, desc: '防具·阵法：受到伤害时可支付 1 灵石，令该伤害 -1', src: 'docs/md/技能/红玉阵盘.md（十方风火归元大阵控制阵盘）' },
];

/* ---------------- 原著技能卡（打出即结算） ----------------
 * 沿用现有锦囊结算 key（wuzhong 摸2 / mingyan 观顶3取1 / huogong 火攻 / jiedao 借刀 …），
 * 仅换修真卡名与副题，故结算 / 响应链 / AI 分支零改动。
 */
export const ZML_SKILL_EXTRA: ZmlCardDef[] = [
  { sub: 'wuzhong', name: '心血来潮', type: 'skill', count: 1, desc: '摸 2 张牌（心有所感，福至心灵）', src: 'K-齐休本命天赋【心血来潮】' },
  { sub: 'mingyan', name: '料敌机先', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回', src: 'K-齐休本命天赋【料敌机先】' },
  { sub: 'wanjian', name: '心生蜂云剑', type: 'skill', count: 1, desc: '群攻（三十六柄飞剑攒刺），需打出【闪】抵御', src: 'K-心生蜂云剑；docs/md/角色/楚秦门/03.金丹/齐妆.md' },
  { sub: 'huogong', name: '幻影夺心刺', type: 'skill', count: 1, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害（幻影迷惑、一刺夺心）', src: 'K-幻影夺心刺；docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { sub: 'mingyan', name: '明月高悬', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回（幻月高悬，照见前路）', src: 'K-明月高悬；docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { sub: 'taoyuan', name: '万影渡生', type: 'skill', count: 1, desc: '所有存活角色各回复 1 点体力（三千分身渡同门于危难）', src: 'K-万影渡生；docs/md/角色/楚秦门/03.金丹/楚无影.md' },
  { sub: 'wuzhong', name: '明心见性诀', type: 'skill', count: 1, desc: '摸 2 张牌（明心见性，佛门手段）', src: 'B-明心见性诀楚慧心改；docs/md/角色/楚秦门/03.金丹/明真.md' },
  { sub: 'mingyan', name: '通明剑诀并注', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回', src: 'B-通明剑诀并注；docs/md/角色/楚秦门/03.金丹/秦长风.md' },
  { sub: 'jiedao', name: '驱虎吞狼', type: 'skill', count: 1, desc: '令一名角色对另一名角色打出【杀】—— 谋主借力打力', src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md（献计借黑手搅乱陵梁宗）' },
  { sub: 'nanman', name: '魔化', type: 'skill', count: 1, desc: '群攻（堕入魔道，魔气席卷），需打出【杀】抵御', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（逃入魔井遇元婴魔蛇）' },
  { sub: 'guohe', name: '传送阵', type: 'skill', count: 1, desc: '弃置目标一张牌（装备优先）—— 传送阵法截断其护持', src: 'docs/md/角色/散修/03.金丹/何玉.md（北丁申山传送遁走）' },
  { sub: 'nanman', name: '楚秦军阵', type: 'skill', count: 1, desc: '群攻（楚秦军阵压境），需打出【杀】抵御', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md（总理楚秦军阵）' },
  { sub: 'lebu', name: '楚秦门规', type: 'skill', count: 1, extra: { judgeType: 'lebu' }, desc: '延时：判定若不为♥红桃，则跳过其出牌阶段（五级身份制，门规森严）', src: 'docs/md/角色/楚秦门/02.筑基/白晓生.md（定楚秦五级身份制）' },
  { sub: 'wuzhong', name: '明心见性诀楚慧心改', type: 'skill', count: 1, desc: '摸 2 张牌（楚慧心改版，南楚传承）', src: 'B-明心见性诀楚慧心改；docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'nanman', name: '七元婴合围', type: 'skill', count: 1, desc: '群攻（七位元婴合围之势），需打出【杀】抵御', src: 'docs/md/角色/齐云/04.元婴/楚神通.md（参与七元婴围攻战）' },
  { sub: 'guohe', name: '本家孤女', type: 'skill', count: 1, desc: '弃置目标一张牌（装备优先）—— 以「本家孤女」名义掩人耳目', src: 'docs/md/角色/齐云/03.金丹/楚夺.md（盗婴案掩饰手法）' },
  { sub: 'huogong', name: '业火焚心', type: 'skill', count: 1, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害', src: 'docs/md/角色/齐云/03.金丹/姜炎.md（红莲业火焚心）' },
  { sub: 'wanjian', name: '一掌', type: 'skill', count: 1, desc: '群攻（化神一掌，势不可挡），需打出【闪】抵御', src: 'docs/md/角色/齐云/05.化神/天地峰座主.md（一掌击开聂疯子飞剑）' },
  { sub: 'mingyan', name: '命演借力', type: 'skill', count: 1, desc: '观看牌堆顶 3 张，将其中 1 张加入手牌，其余按原顺序放回（借赤尻马猴施命演术）', src: 'docs/md/角色/齐云/05.化神/南宫木.md' },
  { sub: 'lebu', name: '伪六道', type: 'skill', count: 1, extra: { judgeType: 'lebu' }, desc: '延时：判定若不为♥红桃，则跳过其出牌阶段（黑河峰底伪六道空间）', src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md' },
  { sub: 'huogong', name: '星陨火球', type: 'skill', count: 1, extra: { damageType: 'fire' }, desc: '目标展示一张手牌，你弃置同花色手牌则其受到 1 点火属性伤害（大火星陨）', src: 'K-星陨火球；docs/md/角色/白山/05.化神/贾长庚.md' },
  { sub: 'nanman', name: '潜意识扑击', type: 'skill', count: 1, desc: '群攻（昏睡中的本能扑击，瞬杀元婴），需打出【杀】抵御', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md' },
];

/* ---------------- 法宝·进攻（装备进武器槽） ----------------
 * 法宝不是独立槽位：sub='fabao' 分类 + extra.equipSlot 决定落武器槽 / 防具槽。
 * 效果沿用现有装备结算 key（liannu / hanbing / cixiong …），故引擎零改动。
 */
export const ZML_FABAO_ATK: ZmlCardDef[] = [
  { sub: 'fabao', name: '破幻之眼', type: 'equip', count: 1, extra: { range: 2, skill: 'qinggang', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；【破幻】你使用的【杀】无视目标护身法器', src: 'K-齐休本命天赋【破幻之眼】' },
  { sub: 'fabao', name: '鎏花幻月剑匣', type: 'equip', count: 1, extra: { range: 1, skill: 'liannu', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 1；【匣中万剑】你使用【杀】无次数限制', src: 'docs/md/角色/楚秦门/03.金丹/齐妆.md（本命，由鎏花妆匣进化）' },
  { sub: 'fabao', name: '月影剑', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌', src: 'docs/md/角色/楚秦门/03.金丹/齐妆.md（继承莫剑心四阶无形月影剑）' },
  { sub: 'fabao', name: '三相精金', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【杀】使用', src: 'docs/md/角色/楚秦门/02.筑基/莫剑心.md（三本命之一）' },
  { sub: 'fabao', name: '幽影万幻刀', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md（诡代所得）' },
  { sub: 'fabao', name: '幽暗影刀', type: 'equip', count: 1, extra: { range: 2, skill: 'qinglong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标打出【闪】后你可再出【杀】', src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md（同参多影阁→幽暗影刀）' },
  { sub: 'fabao', name: '慈悲普度剑', type: 'equip', count: 1, extra: { range: 3, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；目标无手牌时伤害 +1（专克邪魔）', src: 'docs/md/角色/楚秦门/03.金丹/明真.md；docs/md/角色/白山/03.金丹/法引.md' },
  { sub: 'fabao', name: '星剑', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/角色/楚秦门/03.金丹/秦长风.md（莫剑心所铸四阶无形星剑）' },
  { sub: 'fabao', name: '楚秦盟令', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【杀】使用', src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md（楚秦盟）' },
  { sub: 'fabao', name: '聚魂棺', type: 'equip', count: 1, extra: { range: 2, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标无手牌时伤害 +1', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（散魂棺之对）' },
  { sub: 'fabao', name: '神傀法器', type: 'equip', count: 1, extra: { range: 2, skill: 'qinglong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标打出【闪】后你可再出【杀】', src: 'docs/md/角色/散修/03.金丹/何玉.md（白山密宗神傀化身）' },
  { sub: 'fabao', name: '鬼幡', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌（内含霍虎魂魄）', src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md' },
  { sub: 'fabao', name: '霹雳追光剑', type: 'equip', count: 1, extra: { range: 2, skill: 'qinggang', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你使用的【杀】无视目标护身法器（雷系本命）', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md（本命）' },
  { sub: 'fabao', name: '劫真剑', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；【沉重】可弃 2 张牌令【杀】强制命中', src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md（本命剑觉醒名「劫真」）' },
  { sub: 'fabao', name: '念力黑珠', type: 'equip', count: 1, extra: { range: 3, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；目标无手牌时伤害 +1（冲击识海）', src: 'docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'fabao', name: '红莲业火符', type: 'equip', count: 1, extra: { range: 2, skill: 'zhuque', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；可将一张普通【杀】当【火杀】使用', src: 'docs/md/角色/齐云/03.金丹/姜炎.md' },
  { sub: 'fabao', name: '七芯寒毒', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌（寒毒）', src: 'docs/md/角色/齐云/03.金丹/楚夺.md（七芯蝎尾夺寒毒）' },
  { sub: 'fabao', name: '七星宝剑', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；【沉重】可弃 2 张牌令【杀】强制命中', src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { sub: 'fabao', name: '斩元星', type: 'equip', count: 1, extra: { range: 2, skill: 'guding', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；目标无手牌时伤害 +1', src: 'docs/md/角色/齐云/04.元婴/楚问.md（七星剑诀·斩元星）' },
  { sub: 'fabao', name: '执法峰令', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【杀】使用', src: 'docs/md/角色/齐云/05.化神/刑铣.md' },
  { sub: 'fabao', name: '青木龙珠', type: 'equip', count: 1, extra: { range: 3, skill: 'cixiong', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；命中后可令目标弃 1 张牌', src: 'docs/md/角色/齐云/05.化神/南宫木.md（青木为龙）' },
  { sub: 'fabao', name: '南宫聘礼', type: 'equip', count: 1, extra: { range: 2, skill: 'zhangba', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；你可弃 2 张牌当【杀】使用', src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md（南宫家联姻聘礼）' },
  { sub: 'fabao', name: '长庚星光柱', type: 'equip', count: 1, extra: { range: 1, skill: 'liannu', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 1；【光柱分化】你使用【杀】无次数限制（一化二、二化四）', src: 'docs/md/角色/白山/05.化神/贾长庚.md' },
  { sub: 'fabao', name: '大火星陨', type: 'equip', count: 1, extra: { range: 2, skill: 'zhuque', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；可将一张普通【杀】当【火杀】使用', src: 'docs/md/角色/白山/05.化神/贾长庚.md（前世本命大火星）' },
  { sub: 'fabao', name: '八音祛邪佛光仗', type: 'equip', count: 1, extra: { range: 2, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；【沉重】可弃 2 张牌令【杀】强制命中（二阶极品禅杖）', src: 'docs/md/角色/白山/03.金丹/法引.md（齐休所赠）' },
  { sub: 'fabao', name: '九头玉种', type: 'equip', count: 1, extra: { range: 1, skill: 'liannu', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 1；你使用【杀】无次数限制', src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md（本命）' },
  { sub: 'fabao', name: '银白鬃毛', type: 'equip', count: 1, extra: { range: 3, skill: 'guanshi', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 3；【沉重】可弃 2 张牌令【杀】强制命中', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md（银白色长鬃）' },
  { sub: 'fabao', name: '狮吼', type: 'equip', count: 1, extra: { range: 2, skill: 'hanbing', equipSlot: 'weapon', category: 'fabao' }, desc: '法宝·进攻：攻击范围 2；命中后改为弃置目标 2 张牌（吼声震魂）', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md（向九星坊示威吼叫）' },
];

/* ---------------- 法宝·防守（装备进防具槽） ---------------- */
export const ZML_FABAO_DEF: ZmlCardDef[] = [
  { sub: 'fabao', name: '身随意动', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】', src: 'K-齐休本命天赋【身随意动】' },
  { sub: 'fabao', name: '蜂云剑阵', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（三十六柄飞剑护体）', src: 'B-蜂云剑阵；docs/md/角色/楚秦门/03.金丹/齐妆.md' },
  { sub: 'fabao', name: '幻月盖体', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效（幻月盖体）', src: 'K-幻月盖体；docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { sub: 'fabao', name: '影遁', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效（影遁身法）', src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md' },
  { sub: 'fabao', name: '牛毛金针', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（一囊御群针）', src: 'docs/md/角色/楚秦门/03.金丹/明真.md（破【血罟根】）' },
  { sub: 'fabao', name: '流水菩提串', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（同参之物）', src: 'docs/md/角色/散修/03.金丹/何玉.md（同参流水菩提串）' },
  { sub: 'fabao', name: '星闪', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（自遥及闪悟出）', src: 'docs/md/角色/楚秦门/03.金丹/秦长风.md（星闪→星遁）' },
  { sub: 'fabao', name: '星雪秘蛇胸针', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'J-星雪秘蛇胸针；docs/md/角色/楚秦门/03.金丹/秦长风.md' },
  { sub: 'fabao', name: '谋主', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（运筹帷幄）', src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md（楚秦谋主）' },
  { sub: 'fabao', name: '甘家灵药', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（灵药阁甘家）', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（妻甘舞儿、甘怜儿）' },
  { sub: 'fabao', name: '白沙帮令', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效', src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md（白沙帮主）' },
  { sub: 'fabao', name: '水土双本命', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效（水土护持）', src: 'docs/md/角色/散修/03.金丹/何玉.md（本命）' },
  { sub: 'fabao', name: '熊氏重甲', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（北烈山熊氏）', src: 'docs/md/角色/楚秦门/03.金丹/熊十四.md' },
  { sub: 'fabao', name: '五烟绮罗纱', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效', src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md' },
  { sub: 'fabao', name: '小红', type: 'equip', count: 1, extra: { skill: 'tengjia', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：普通【杀】与群攻技能对你无效；受到火属性伤害 +1（魔化之躯）', src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md（化名小红）' },
  { sub: 'fabao', name: '神霄五雷正法', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效（雷法护体）', src: 'B-神霄五雷正法；docs/md/角色/楚秦门/02.筑基/展剑锋.md' },
  { sub: 'fabao', name: '泼风盾舞', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（楚秦六本秘传之一）', src: 'B-泼风盾舞；docs/md/角色/楚秦门/02.筑基/白晓生.md' },
  { sub: 'fabao', name: '藏经阁钥匙', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效', src: 'docs/md/角色/楚秦门/02.筑基/白晓生.md（管藏经阁数十年）' },
  { sub: 'fabao', name: '红玉屏风', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'fabao', name: '万丈天火', type: 'equip', count: 1, extra: { skill: 'tengjia', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：普通【杀】与群攻技能对你无效；受到火属性伤害 +1', src: 'K-万丈天火；docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { sub: 'fabao', name: '元婴威压', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效（元婴后期威压）', src: 'docs/md/角色/齐云/04.元婴/楚震.md' },
  { sub: 'fabao', name: '楚云峰令', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效', src: 'docs/md/角色/齐云/04.元婴/楚神通.md' },
  { sub: 'fabao', name: '七星剑鞘', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（曾硬抗司空宙星空大道）', src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { sub: 'fabao', name: '七星剑阵', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { sub: 'fabao', name: '楚家玉简', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效', src: 'docs/md/角色/齐云/03.金丹/楚夺.md（赐齐休玉简）' },
  { sub: 'fabao', name: '万骨共生', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（与金丹鬼修万骨共生）', src: 'docs/md/角色/齐云/03.金丹/姜炎.md' },
  { sub: 'fabao', name: '空间束缚', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效', src: 'K-空间束缚之力；docs/md/角色/齐云/03.金丹/姜炎.md' },
  { sub: 'fabao', name: '照规矩办', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（「照规矩办就是公平」）', src: 'docs/md/角色/齐云/05.化神/刑铣.md' },
  { sub: 'fabao', name: '天地峰威压', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1', src: 'docs/md/角色/齐云/05.化神/天地峰座主.md' },
  { sub: 'fabao', name: '木之大道', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效（木之大道护持）', src: 'docs/md/角色/齐云/05.化神/南宫木.md（本命）' },
  { sub: 'fabao', name: '南宫家令', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效', src: 'docs/md/角色/齐云/05.化神/南宫木.md（南宫家）' },
  { sub: 'fabao', name: '空谷幽兰', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（空谷幽兰之美）', src: 'docs/md/角色/齐云/02.筑基/南宫湘.md（相貌与南宫梦相像）' },
  { sub: 'fabao', name: '玉屏风', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（效仿芩老祖的玉屏风）', src: 'docs/md/角色/齐云/04.元婴/南宫止.md；docs/md/势力/008.外海/人物/05.化神/芩老祖.md' },
  { sub: 'fabao', name: '护身项链', type: 'equip', count: 1, extra: { skill: 'tengjia', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：普通【杀】与群攻技能对你无效；受到火属性伤害 +1', src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md（伪六道空间反击杀秦思瑶）' },
  { sub: 'fabao', name: '人祭强化', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（人祭强化双星）', src: 'docs/md/角色/白山/05.化神/贾长庚.md' },
  { sub: 'fabao', name: '多宝眩光袈裟', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（三阶下品，诸宝石各有妙用）', src: 'docs/md/角色/白山/03.金丹/法引.md（齐休所赠）' },
  { sub: 'fabao', name: '精华内敛', type: 'equip', count: 1, extra: { skill: 'bagua', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：手中无【闪】时判定，红色视为打出【闪】（酆水战后判若两人）', src: 'docs/md/角色/白山/03.金丹/法引.md' },
  { sub: 'fabao', name: '水滴形玉玦', type: 'equip', count: 1, extra: { skill: 'xuanshui', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：雷属性伤害对你无效', src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md' },
  { sub: 'fabao', name: '无形鹤伴兽', type: 'equip', count: 1, extra: { skill: 'renwang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：黑色【杀】对你无效', src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md（代征五阶无形鹤）' },
  { sub: 'fabao', name: '元犼真身', type: 'equip', count: 1, extra: { skill: 'mingguang', equipSlot: 'armor', category: 'fabao' }, desc: '法宝·防守：你每次受到的伤害 -1（化神元犼之躯）', src: 'docs/md/角色/蛮荒/05.化神/醒狮.md（本命）' },
];

export const ZML_ALL: ZmlCardDef[] = [...ZML_BASIC, ...ZML_TRICK, ...ZML_EQUIP, ...ZML_FABAO_ATK, ...ZML_FABAO_DEF, ...ZML_SKILL_EXTRA];

/** 掌门路牌堆总张数（144） */
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
