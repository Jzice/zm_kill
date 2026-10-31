/* ==================== 全局领域类型 ==================== */

import type { PacketId } from '../data/packets';
import type { CardPackId } from '../data/cardPacks';

export type Suit = '♠' | '♥' | '♣' | '♦';
export type CardType = 'basic' | 'skill' | 'equip';
export type Role = 'lord' | 'loyal' | 'rebel' | 'spy';
/** 修真势力（首版以楚秦门为主，其余为后续扩展预留骨架） */
export type FactionId =
  | 'chuqin'         // 楚秦门
  | 'qiyun'          // 齐云
  | 'baishan'        // 白山
  | 'yushou'         // 御兽门
  | 'dazhoushuyuan'  // 大周书院
  | 'qinglian'       // 青莲剑宗
  | 'nanlin'         // 南林寺
  | 'waihai'         // 外海
  | 'tianli'         // 天理门
  | 'manhuang';      // 蛮荒（醒狮谷 / 蛮牛荒原等化神古兽领地，非人类宗门）
export type SkillType = 'active' | 'trigger';
export type PendingType = 'list' | 'play' | 'discard' | 'rescue' | 'shan' | 'target';
export type LogAction =
  | 'log'
  | 'use'
  | 'damage'
  | 'heal'
  | 'skill'
  | 'reward'
  | 'faction'
  | 'kp'
  | 'sys';
export type ChatKind = 'ai' | 'self' | 'sys';
export type NetMode = 'single' | 'host' | 'join';
/**
 * 装备槽位（掌门路四槽制）：
 *   weapon 武器（进攻） / armor 防具（防守，含阵法）
 *   horsePlus +1 载具（载具法宝或灵兽） / horseMinus -1 载具
 * 法宝不是独立槽位：法宝卡按攻防特性装备进 weapon 或 armor 槽（见 Card.equipSlot）。
 */
export type EquipSlot = 'weapon' | 'armor' | 'horsePlus' | 'horseMinus';
/** 玩家自选性别（仅用于个性化展示，不影响玩法） */
export type Gender = 'male' | 'female' | 'hidden';

/** 玩家个性化身份信息（昵称/头像/性别/心情），联机时同步给其他玩家 */
export interface PlayerIdentity {
  name: string;
  avatar: string;
  gender: Gender;
  mood: string;
  moodIcon: string;
}

/* ---------------- 声明式技能（TalentDef） ----------------
 * 46 名基础角色共 93 个技能全部由「时机 + 费用 + 限制 + 效果原语」声明，
 * 由 src/game/talentEngine.ts 统一分派，避免 talents.ts 出现上百个 switch 分支。
 * 新增字段全部可选：108 个扩展包角色（纯 SkillEffect 原语制）零改动继续工作。
 */

/** 技能时机：决定引擎在哪个规则钩子上派发该技能 */
export type SkillTiming =
  | 'active' // 出牌阶段主动发动
  | 'passive' // 常驻状态技：距离 / 手牌上限 / 免疫 / 转化 / 无双 / 咆哮
  | 'onTurnStart' // 准备阶段（判定前）：观星、觉醒判定
  | 'onDraw' // 摸牌阶段：额外摸牌、突袭替代摸牌
  | 'onTurnEnd' // 回合结束：据守翻面、军令状结算、顺序奖励
  | 'beforeJudge' // 判定牌生效前：改判
  | 'beforeDamage' // 伤害结算前：减伤 / 免伤
  | 'onDamaged' // 受到伤害后
  | 'onTargetSha' // 成为【杀】的目标时：点数对抗免伤
  | 'onUseShan' // 使用或打出【闪】后
  | 'onShaHit' // 使用【杀】造成伤害后
  | 'onUseSkill' // 使用锦囊牌后
  | 'onSkillCountered' // 自己的锦囊被【无懈可击】抵消后
  | 'onLoseHand' // 失去最后一张手牌时
  | 'onEquip' // 装备一张装备牌后
  | 'onLoseEquip' // 失去装备区的牌后
  | 'onDiscard' // 弃牌阶段结束后
  | 'onDying' // 进入濒死状态时（限定技自救）
  | 'onDeath' // 阵亡时
  | 'awaken'; // 觉醒技（在 onTurnStart 判定）

/** 发动费用 */
export interface SkillCost {
  hand?: number;
  hp?: number;
  equip?: number;
}

/** 使用限制：perTurn 每回合限一次 / perGame 整局限一次（限定技、觉醒技） */
export type SkillLimit = 'perTurn' | 'perGame' | 'none';

/** 展示类型标签，UI 与规则书据此分组渲染 */
export type SkillKind = 'active' | 'trigger' | 'passive' | 'limit' | 'awaken' | 'lord' | 'convert';

/** 触发条件：钩子内据此判定是否执行（纯数据，便于联机同步与规则书展示） */
export type SkillCond =
  | { k: 'hpAtMost'; n: number }
  | { k: 'hpLowest' }
  | { k: 'isHurt' }
  | { k: 'dmgTakenAtLeast'; n: number }
  | { k: 'srcIsLord' }
  | { k: 'srcHandMoreThanMe' }
  | { k: 'srcHandGeMe' }
  | { k: 'playedThisTurnAtLeast'; n: number }
  | { k: 'playedNothingThisTurn' }
  | { k: 'noShaThisTurn' }
  | { k: 'noDamageDealtThisTurn' }
  | { k: 'noSkillThisTurn' }
  | { k: 'lastCardIsSkill' }
  | { k: 'hasNumPair' }
  | { k: 'handAtMost'; n: number }
  | { k: 'outsideTurn' }
  | { k: 'roleIn'; roles: Role[] }
  | { k: 'targetHasNoEquip' }
  | { k: 'targetChained' }
  | { k: 'targetIsLord' }
  /** 上下文最近一张牌（刚弃置 / 使用 / 判定）的花色与点数判定 */
  | { k: 'lastCardBlack' }
  | { k: 'lastCardRed' }
  | { k: 'lastCardEven' }
  | { k: 'lastCardOdd' }
  | { k: 'lastCardPrime' }
  | { k: 'lastCardNumGe'; n: number }
  | { k: 'lastCardNumLe'; n: number }
  /** 最近一次受到的伤害为雷 / 火属性（法拉第·避雷针） */
  | { k: 'lastDamageThunder' }
  | { k: 'lastDamageFire' };

/**
 * 带可选「生效时机」的效果。默认跟随技能自身的 timing；
 * 指定 at 后可让同一技能在不同时机各挂一条效果（如觉醒后的【诗史】：
 * 常驻手牌上限 + 受伤后摸牌）。
 */
export type SkillE = SkillEffect & { at?: SkillTiming };

export interface TalentDef {
  id: string;
  name: string;
  kind: SkillKind;
  timing: SkillTiming;
  desc: string;
  cost?: SkillCost;
  limit?: SkillLimit;
  cond?: SkillCond;
  effects: SkillE[];
  /** 该技能的伤害属性（掌门路；效果级 attr 缺省时作为兜底） */
  attr?: Attr;
  /** 灵兽标签（兽属性判定对象） */
  lingshou?: boolean;
  /** 道统标签（雷属性判定对象） */
  taoism?: Taoism;
}

export interface Talent {
  id: string;
  name: string;
  type: SkillType;
  desc: string;
  /** 扩展包技能的原语组合（仅扩展包技能有；基础技能走 talents.ts 的 switch 分发） */
  effects?: SkillEffect[];
  /** 声明式扩展（基础角色技能）：与 TalentDef 同构，由 talentEngine 分派 */
  kind?: SkillKind;
  timing?: SkillTiming;
  cost?: SkillCost;
  limit?: SkillLimit;
  cond?: SkillCond;
  /** 由【诡代】/【神傀化身】/【本命代征】复制而来（回合结束清理用） */
  copied?: boolean;
  /** 复制来的天赋持续时间：'turn' 持到本回合结束，'game' 持到本局结束 */
  copiedUntil?: 'turn' | 'game';
  /** 该技能的伤害属性（掌门路；随 talentOf 从 TalentDef 透传） */
  attr?: Attr;
  /** 灵兽标签（随 talentOf 透传） */
  lingshou?: boolean;
  /** 道统标签（随 talentOf 透传） */
  taoism?: Taoism;
}

/**
 * 技能效果原语：技能均由有限原语组合声明，避免上百个独立分支。
 * 由 src/game/talentEngine.ts 统一分派执行；
 * 扩展包角色沿用旧的 14 个原语，由 src/game/skillfx.ts 分派，两者加法式共存。
 */
export type SkillEffect =
  /* ---- 既有 14 个原语（扩展包依赖；新增字段全部可选，不影响扩展包） ---- */
  /** 自己摸牌。cond 为可选触发条件；damageType 仅 targetDamage 有意义 */
  | { kind: 'selfDraw'; n: number; cond?: SkillCond }
  /** 令目标弃牌。cond 为可选触发条件（受伤后反制类技能） */
  | { kind: 'targetDiscard'; n: number; cond?: SkillCond }
  | { kind: 'targetLoseHp'; n: number }
  /** attr：极寒碧火诀 / 血影邪功等天赋伤害的卡牌属性（掌门路） */
  | { kind: 'targetDamage'; n: number; damageType?: DamageType; attr?: Attr }
  | { kind: 'targetHeal'; n: number }
  | { kind: 'targetDraw'; n: number }
  | { kind: 'gainHand'; n: number }
  | { kind: 'allDiscard'; n: number }
  | { kind: 'allDraw'; n: number }
  | { kind: 'extraDraw'; n: number; cond?: SkillCond }
  | { kind: 'handLimit'; n: number; cond?: SkillCond }
  | { kind: 'distMod'; delta: number }
  | { kind: 'damageMod'; delta: number }
  | { kind: 'shield'; n: number }
  /**
   * 弃置自己 n 张手牌。require='sameNum'/'sameSuit' 时须弃置点数 / 花色相同的牌
   *（孟德尔·分离定律、莎士比亚·十四行诗），否则技能不可发动。
   */
  | { kind: 'costCard'; n: number; require?: 'sameNum' | 'sameSuit' }
  /* ---- 牌堆操控 ---- */
  /** 观星：观看牌堆顶 n 张（'alive' = 存活人数，至多 5），任意分配置顶 / 置底 */
  | { kind: 'star'; n: number | 'alive' }
  /** 排序式观星（门捷列夫·周期律）：按点数排序后放回牌堆顶 */
  | { kind: 'starSort'; n: number; dir: 'asc' | 'desc' }
  /** 观看牌堆顶 n 张：pickOne 取 1 / pickTwo 取 2 / toBottomOne 把 1 张置底；match 优先取同花色 */
  | { kind: 'deckPeek'; n: number; then: 'pickOne' | 'pickTwo' | 'toBottomOne'; match?: 'sameSuit' }
  /** 牌堆底：peek 取 1 张并把另 1 张置顶；digEquip 展示并获取全部装备牌 */
  | { kind: 'deckBottom'; n: number; then: 'peek' | 'digEquip' }
  /** 将一张牌置于牌堆顶（hand 自己手牌 / targetHand 目标手牌） */
  | { kind: 'toDeckTop'; from: 'hand' | 'targetHand' }
  /** 弃牌阶段把符合 pick 的牌置于牌堆顶而非弃牌堆 */
  | { kind: 'discardToTop'; pick: 'min' | 'prime' }
  /** 常驻预知：牌堆顶 n 张对你可见（伽利略·望远镜，仅 UI） */
  | { kind: 'peekTopDeck'; n: number }
  /* ---- 转化技 ---- */
  /** 满足条件的手牌可当目标牌使用；outsideTurn=true 表示仅回合外可用（李时珍·急救） */
  | {
      kind: 'convert';
      from: { suit?: string; color?: 'red' | 'black'; sub?: string; type?: string; maxNum?: number; minNum?: number };
      to: 'sha' | 'shan' | 'tao' | 'jiu' | 'guohe';
      damageType?: DamageType;
      limit?: 'perTurn';
      outsideTurn?: boolean;
    }
  /* ---- 杀 / 闪交互 ---- */
  /** 无双：每回合第一张【杀】需 n 张【闪】才能抵消 */
  | { kind: 'shaNeedShan'; n: number; perTurnFirst: boolean }
  /** 咆哮：使用【杀】无次数限制，每回合最多额外 maxExtra 张，每张额外杀弃 extraCostHand 张 */
  | { kind: 'shaUnlimited'; maxExtra: number; extraCostHand: number }
  /** 点数对抗：展示手牌点数 ≥ 该【杀】点数则该杀无效 */
  | { kind: 'numGuard'; op: 'ge'; against: 'shaNum'; limit?: 'perTurn' }
  /** 反伤：被【杀】造成伤害后对来源造成 n 点伤害 */
  | { kind: 'reflect'; n: number; when: 'hurtBySha' }
  /** 无视防具造成伤害；目标无防具时改为执行 noArmor */
  | { kind: 'armorPierceDamage'; n: number; noArmor?: SkillEffect[] }
  /** 用【杀】造成伤害时可防止此伤害，改为执行 then */
  | { kind: 'preventShaDamage'; then: SkillEffect[] }
  /* ---- 点数与花色 ---- */
  | { kind: 'pointDuel'; win: SkillEffect[]; lose: SkillEffect[] }
  /** 判定并按点数 / 颜色条件分支（hit = 条件成立） */
  | {
      kind: 'judgeIf';
      test: 'prime' | 'odd' | 'even' | 'ge' | 'le' | 'sameNum' | 'black' | 'red';
      n?: number;
      hit: SkillEffect[];
      miss: SkillEffect[];
    }
  /** 连续判定直到出现偶数点数，获得全部判定牌；达 bonusAt 张追加 bonus */
  | { kind: 'chainJudge'; stopWhen: 'even'; takeAll: boolean; bonusAt?: number; bonus?: SkillEffect[] }
  /** 花色收集连锁：本回合使用过 n 种不同花色则触发 */
  | { kind: 'suitCollect'; n: number; reward: SkillEffect[] }
  /** 反间：令其猜花色，猜中 / 猜错 */
  | { kind: 'guessSuit'; hit: SkillEffect[]; miss: SkillEffect[] }
  /** 弃 c 张牌造成 d 点伤害；弃置牌点数满足 bonusTest 时伤害 +bonus（柯西·极限） */
  | { kind: 'costThenDamage'; cost: number; dmg: number; bonusTest?: { op: 'ge' | 'le'; n: number }; bonus?: number; attr?: Attr }
  /** 连续两次判定，颜色相同时执行 sameColor（笛卡尔·坐标系） */
  | { kind: 'doubleJudge'; sameColor: SkillEffect[] }
  /** 摸 draw 张后弃置点数最小的 discard 张；其和 ≤ sumAtMost 时追加 bonus（达尔文·进化论） */
  | {
      kind: 'drawDiscardMin';
      draw: number;
      discard: number;
      bonusTest?: { sumAtMost: number };
      bonus?: SkillEffect[];
    }
  /** 摸牌阶段额外摸 n 张后弃 1 张；弃置牌为奇数则改为不弃（华罗庚·优选法） */
  | { kind: 'extraDrawDiscardOdd'; n: number }
  /* ---- 交互与博弈 ---- */
  /** 观看一名角色手牌后：交换一张 / 夺取一张 / 将其一张置于牌堆顶 */
  | { kind: 'peekHand'; then: 'exchange' | 'steal' | 'toDeckTop' }
  /** 突袭：摸牌阶段改为执行 effects（替代常规摸牌） */
  | { kind: 'replaceDraw'; effects: SkillEffect[] }
  /** 令一至 maxTargets 名角色各从 options 中选择一项 */
  | { kind: 'targetChoose'; maxTargets?: number; options: SkillEffect[][] }
  /** 交换体力值（爱因斯坦·相对论） */
  | { kind: 'swapHp' }
  /** 据守：翻面并摸 n 张牌 */
  | { kind: 'turnFace'; draw: number }
  /** 将 n 张手牌交给一名角色；交给 ≥healIfSpread 名不同角色时自己回复 1 点体力 */
  | { kind: 'giveHand'; n: number; healIfSpread?: number }
  /** 交给一名角色 1 张手牌，若为【闪】则自己摸 selfDraw 张（朱自清·背影） */
  | { kind: 'giveHandIfShan'; selfDraw: number }
  /** 与一名角色各交换一张手牌 */
  | { kind: 'exchangeHand'; n: number }
  /** 令至多 max 名其他角色各摸 n 张牌 */
  | { kind: 'multiDraw'; max: number; n: number }
  /** 从至多 max 名其他角色处各夺取一张手牌（孙子·兵法 突袭） */
  | { kind: 'stealFrom'; max: number }
  /** 令所有其他角色各展示一张手牌，你获得其中一张（老舍·茶馆） */
  | { kind: 'revealAllPickOne' }
  /** 展示自己的一张手牌，按花色分支 */
  | { kind: 'showHand'; black?: SkillEffect[]; red?: SkillEffect[] }
  /** 弃至多 max 张手牌，令一名角色回复等量体力（拉瓦锡·质量守恒） */
  | { kind: 'discardToHeal'; max: number }
  /** 获得拼点 / 反间展示的那张牌 */
  | { kind: 'takeDuelCard' }
  /** 把拼点 / 反间展示的那张牌交给对方 */
  | { kind: 'giveDuelCard' }
  /** 弃置 n 张与上下文参照牌花色相同的手牌 */
  | { kind: 'discardSuitMatch'; n: number; suit?: string }
  /** 使用锦囊后摸牌：minSeq / blackOnly 限定触发范围，redExtra / richestExtra 为额外摸牌 */
  | {
      kind: 'skillDraw';
      n: number;
      /** 本回合第 minSeq 张及之后的锦囊牌才触发 */
      minSeq?: number;
      /** 锦囊为红色时额外摸 redExtra 张 */
      redExtra?: number;
      /** 仅黑色锦囊触发 */
      blackOnly?: boolean;
      /** 目标中含手牌最多的角色时额外摸 richestExtra 张 */
      richestExtra?: number;
    }
  /* ---- 状态与标记 ---- */
  | { kind: 'addMark'; mark: string; n: number }
  /** 回合开始结算标记：移除 1 枚并造成 damage 点伤害 */
  | { kind: 'tickMark'; mark: string; damage: number }
  /** 军令状：目标本回合结束时若未使用过【杀】则执行 onTurnEnd */
  | { kind: 'pledge'; onTurnEnd: SkillEffect[] }
  /** 免疫：不能成为某类牌的目标 */
  | { kind: 'immune'; scope: 'skill' | 'shaAndJuedou' | 'equip' }
  /** 空城：没有手牌时不能成为【杀】或【决斗】的目标 */
  | { kind: 'noHandImmune' }
  /** 指定牌名免疫：不能成为这些牌的目标（诸葛亮·东风 免疫万箭齐发；法拉第 免疫闪电；墨子·非攻 免疫万箭/南蛮） */
  | { kind: 'cardImmune'; names: string[] }
  /** 指定花色的牌对你无效（黑牌/红牌免疫） */
  | { kind: 'suitImmune'; suits: ('♠' | '♥' | '♣' | '♦')[] }
  /** 距离陷阱：计算距离大于 min 的角色不能对你使用【杀】 */
  | { kind: 'distTrap'; min: number }
  /** 转移锦囊：你成为锦囊牌目标时，可将其转移给另一名角色（墨子·兼爱） */
  | { kind: 'skillRedirect' }
  /** 转移杀：你成为【杀】目标时，可将其转移给另一名角色（卢瑟福·散射偏转） */
  | { kind: 'shaRedirect' }
  /** 装备失效：其他角色装备区中指定槽位的牌对你无效（墨子·非攻：收缴兵器） */
  | { kind: 'enemyEquipVoid'; slots: ('weapon' | 'armor' | 'horsePlus' | 'horseMinus')[] }
  /** 马政：装备区每有一张马，你计算距离额外 −n（郑和·航海图） */
  | { kind: 'horseDist'; n: number }
  | { kind: 'reduceDamage'; types: DamageType[]; n: number }
  /** 改判：判定牌生效前用一张手牌替换之 */
  | { kind: 'replaceJudge' }
  /** 觉醒：减 minusMaxHp 点体力上限并把本技能替换为 replaceWith */
  | { kind: 'awaken'; replaceWith: string; minusMaxHp: number }
  /** 限定技复活：将体力回复至 hp 并摸 1 张牌 */
  | { kind: 'revive'; hp: number }
  /** 自损：失去 n 点体力 */
  | { kind: 'selfLoseHp'; n: number }
  /** 自愈：回复 n 点体力 */
  | { kind: 'selfHeal'; n: number; cond?: SkillCond }
  /** 群体回复：所有已受伤角色各回复 n 点体力 */
  | { kind: 'allHeal'; n: number }
  /** 本回合下一张【杀】伤害 +n */
  | { kind: 'nextShaBonus'; n: number }
  /** 本回合下一张【杀】不可被闪避 */
  | { kind: 'nextShaUnblockable' }
  /** 攻击范围 +n */
  | { kind: 'rangePlus'; n: number }
  /** 其他角色计算与你的距离 +n */
  | { kind: 'distPlusToMe'; n: number }
  /** 计算距离时无视其他角色的 +1 马 */
  | { kind: 'ignoreHorsePlus' }
  /** 使用【顺手牵羊】无距离限制 */
  | { kind: 'shunshouNoDist' }
  /* ---- 掌门路原著机制（齐休 / 楚无影 / 玉鹤 / 姜炎 / 南宫木 / 沙诺 / 醒狮 等共用） ---- */
  /**
   * 诡代 / 神傀化身 / 本命代征：获得目标的一个天赋。
   * duration='turn' 持续到你的下个回合开始；'game' 持续到本局结束。
   * 出处：L-诡代法.md（楚秦门核心传承）、L-本命代征.md（御兽门玉鹤所悟）、白山密宗神傀化身。
   */
  | { kind: 'copyTalent'; duration: 'turn' | 'game' }
  /**
   * 必杀十人 / 追缉：令目标获得一枚标记，你对其造成的伤害 +dmgBonus。
   * 出处：姜炎「山都山刻必杀十人名单」、南宫木追捕何玉数十年。
   */
  | { kind: 'markBonus'; mark: string; dmgBonus: number }
  /**
   * 散魂棺 / 嗅魂 / 鬼幡：摄魂。on='kill' 你击杀目标时触发；on='death' 任意角色阵亡时触发。
   * 出处：沙诺散魂棺、醒狮昏睡中一嗅吸魂、赵瑶鬼幡（内含霍虎魂魄）。
   */
  | { kind: 'soulSeize'; on: 'kill' | 'death'; draw?: number; heal?: number };

/** 消耗类道具定义（局末清空，不进牌堆，不可被顺手牵羊等卡牌影响） */
export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** 携带上限 */
  maxCarry: number;
  effects: SkillEffect[];
}

/** 局前配装：携带的装备（按槽位）与道具（id → 数量） */
export interface Loadout {
  weapon: string | null;
  armor: string | null;
  horsePlus: string | null;
  horseMinus: string | null;
  items: Record<string, number>;
}

export interface Faction {
  name: string;
  color: string;
  icon: string;
  desc: string;
  lordSkill: Talent;
  /** 预留修真机制扩展点（首版不实现，仅占位） */
  cultivation?: string;
  benming?: string;
  fagi?: string[];
}

export interface Character {
  id: string;
  name: string;
  title: string;
  faction: FactionId;
  hp: number;
  avatar: string;
  talents: Talent[];
  /** 预留修真机制扩展点（首版不实现，仅占位） */
  cultivation?: '练气' | '筑基' | '金丹' | '元婴' | '化神';
  /** 本命之物（可多个：本命越多灵根越杂，修炼越慢但天赋更强） */
  benming?: string[];
  fagi?: string[];
  lingqi?: number;
  /** 道统（掌门路：道 / 佛 / 儒 / 魔 / 鬼 / 外道，6 环相克）；经典模式不参与结算 */
  taoism?: Taoism;
  /** 灵兽之躯（兽属性攻击的判定对象） */
  lingshou?: boolean;
}

/** 伤害属性：普通 / 火 / 雷（属性伤害可被【藤甲】放大，并触发【铁索连环】传导） */
export type DamageType = 'normal' | 'fire' | 'thunder';

/* ---------------- 属性攻防体系（仅掌门路模式生效） ----------------
 * 角色道统（Taoism）：道/佛/儒/魔/鬼/外道，6 环相克。
 * 卡牌属性（Attr）：五行（金木水火土）+ 雷/兽/道德/鬼物/风/毒。
 * 出处：用户设定（五行相克 / 雷克邪魔鬼 / 兽克灵兽载具 / 道德克鬼物 / 风克毒）。
 */
/** 角色道统 */
export type Taoism = 'dao' | 'fo' | 'ru' | 'mo' | 'gui' | 'waidao';
/** 五行元素 */
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'earth';
/** 卡牌属性：五行 + 雷 / 兽 / 道德 / 鬼物 / 风 / 毒 */
export type Attr = Element | 'lei' | 'shou' | 'daode' | 'guiwu' | 'feng' | 'du';

/* ---------------- 掌门路（修真规则层） ----------------
 * 仅在「掌门路模式」下生效；经典模式所有字段均为空，结构与序列化完全不变。
 * 出处：docs/md/设定/修行体系.md、本命.md、灵石.md；docs/md/物事/ 各词表。
 */

/** 对局模式：classic=经典（原版三国杀，零改动）；zml=掌门路身份局；war=开辟战争 */
export type GameMode = 'classic' | 'zml' | 'war';

/**
 * 修真境界（唯一序列，两套成长线共用）：
 *   练气 → 筑基 → 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 大乘 → 渡劫
 * - 局内（Player.cult.realm）：开放至「炼虚」封顶（见 core/mode.ts REALM_NEXT）
 * - 账号档案（Profile.realm）：走满 9 阶（见 profile/realm.ts REALM_TIERS）
 */
export type Realm =
  | 'lianqi'
  | 'zhuji'
  | 'jindan'
  | 'yuanying'
  | 'huashen'
  | 'lianxu'
  | 'heti'
  | 'dacheng'
  | 'dujie';

/** 灵地：开局布置在场上，可开辟 / 攻夺，按阶产灵石 */
export interface SpiritGround {
  id: string;
  /** 真实山门地名（楚秦山 / 黑河峰 / 思过坊 …） */
  name: string;
  /** 阶位：一 / 二 / 三 / 五阶（进阶筑基须一阶、结丹三阶、结婴五阶） */
  tier: 1 | 2 | 3 | 5;
  /** 占领者座位号；null = 无主 */
  owner: number | null;
}

/** 修真资源与身份状态（挂载在 Player.cult） */
export interface CultivationState {
  /** 当前境界 */
  realm: Realm;
  /** 修为（造成伤害 / 击杀 / 救人 / 占地积累） */
  exp: number;
  /** 灵石：一般等价物，上限 8 */
  lingShi: number;
  /** 本命之物（对他人隐藏，被【全知天眼】探查或阵亡后公开） */
  benming: string[];
  benmingShown: boolean;
  /** 家族（秦 / 楚 / 展 / 罗 …） */
  family?: string;
  /** 本局已突破次数（≤2） */
  breakthroughs: number;
  /** 是否已使用过「夺舍」（黑手专属，每局限 1 次） */
  duosheUsed?: boolean;
}

export interface Card {
  id: number;
  name: string;
  type: CardType;
  sub: string;
  suit: string;
  num: string | number;
  range?: number;
  skill?: string;
  dist?: number;
  judgeType?: 'lebu' | 'shandian' | 'bingliang';
  /** 该牌造成的伤害属性（火杀/雷杀/火攻/闪电），缺省按普通伤害处理 */
  damageType?: DamageType;
  /** 掌门路模式：卡面副题（修真设定，如 火杀＝「碧磷斩」）；经典模式为空 */
  subtitle?: string;
  /** 掌门路模式：法器器灵层数（兵器法宝累积战果成长） */
  qiling?: number;
  /**
   * 法宝卡（sub === 'fabao'）装备进哪个槽：进攻型 → 'weapon'，防守型 → 'armor'。
   * 法宝不是独立槽位，必须靠本字段复用四槽之一；仅 fabao 有意义。
   */
  equipSlot?: 'weapon' | 'armor';
  /** 子类标签，供规则书分组展示：'fabao' 法宝 / 'fulu' 符箓 / 'zai ju' 载具 … */
  category?: string;
  /** 卡牌属性（掌门路：五行 / 雷 / 兽 / 道德 / 鬼物 / 风 / 毒）；经典模式为空 */
  attr?: Attr;
  /** 灵兽标签（兽属性攻击的判定对象：灵兽之躯 / 载具） */
  lingshou?: boolean;
  /** 道统标签（防具 / 法宝 / 锦囊可携带，供雷属性对魔 / 鬼判定）；经典模式为空 */
  taoism?: Taoism;
}

/** 出牌区展示用的轻量卡牌视图（允许 num 为 '?' 等占位） */
export interface PlayCardView {
  name: string;
  suit: string;
  num: string | number;
  type: CardType;
  /** 卡牌属性徽标（掌门路；经典模式为空） */
  attr?: Attr;
  /** 道统徽标（掌门路；经典模式为空） */
  taoism?: Taoism;
}

export interface Equips {
  weapon: Card | null;
  armor: Card | null;
  horsePlus: Card | null;
  horseMinus: Card | null;
}

export interface PlayerFlags {
  shaUsed: number;
  skillUsed: boolean;
  extraDamage: number;
  skipPlay: boolean;
  noSha: boolean;
  /** 本回合是否已使用过【酒】（每回合限一次，与额外伤害一起在回合初重置） */
  jiuUsed: boolean;
  /** 局前装备加成（由配装注入，整局有效）：护甲减伤次数 */
  dmgReduce?: number;
  /** 局前武器加成：出杀/伤害 +n（整局） */
  bonusDmg?: number;
  /** 【出师表】军令状：回合结束时若本回合未使用过【杀】则失去 1 点体力 */
  pledge?: boolean;
  /** 本回合使用牌数（顺序连锁 / 军令状判据），回合初清零 */
  playedCount?: number;
  /** 本回合是否造成过伤害（孟子·王道「据守」判据），回合初清零 */
  dealtDamage?: boolean;
  /** 本回合是否使用过锦囊（墨子·兼爱判据），回合初清零 */
  usedSkill?: boolean;
  /** 本回合已使用的锦囊张数（李白·诗成「第二张及之后」判据），回合初清零 */
  skillCount?: number;
  /** 本回合使用的最后一张牌类型（朱自清·荷塘月色判据） */
  lastCardType?: CardType | null;
  /** 【兵粮寸断】生效：跳过本回合的摸牌阶段（回合初随 skipPlay 一并清零） */
  skipDraw?: boolean;
  /** 【银月枪】封锁花色：本角色不能使用或打出该花色的手牌，直到其下个回合开始 */
  blockSuit?: string | null;
}

export interface Player {
  id: number;
  name: string;
  /** 角色头像（AI 用；真人若设置了自定义头像则优先展示自定义） */
  avatar: string;
  /** 个性化身份（真人玩家有值，AI 为 null） */
  identity: PlayerIdentity | null;
  charId: string;
  faction: FactionId;
  role: Role;
  roleRevealed: boolean;
  /** 击杀者名字（阵亡时记录，联机下随状态同步，供客人端播放阵亡动画显示「被谁所杀」） */
  killedBy?: string;
  hp: number;
  maxHp: number;
  hand: Card[];
  equip: Equips;
  judge: Card[];
  shield: number;
  alive: boolean;
  isAI: boolean;
  /** 决策提供者：'heuristic' = 原启发式 AI；'llm' = 由大模型接管（仅当 isAI 时生效） */
  aiMode?: 'heuristic' | 'llm';
  talents: Talent[];
  peerId: string | null;
  flags: PlayerFlags;
  /** 铁索连环·横置：处于连环状态，受到属性伤害时传导给所有连环角色并各自重置 */
  chained?: boolean;
  /** 翻面：跳过一个回合（严格原版：与连环相互独立，不由铁索连环触发） */
  turned?: boolean;
  /** 局内携带的消耗类道具：道具 id → 数量（局末清空，不进牌堆） */
  items?: Record<string, number>;
  /** 技能每回合使用计数（技能 id → 本回合已用次数），回合初清空 */
  skillUse?: Record<string, number>;
  /** 限定技 / 觉醒技整局使用记录（技能 id → 1），随 state_sync 下发 */
  skillGame?: Record<string, number>;
  /** 自定义标记（居里夫人「辐射」等），回合开始结算 */
  marks?: Record<string, number>;
  /** 本回合已使用过的牌花色集合（门捷列夫·元素「三花色收集」判据），回合初清空 */
  turnSuits?: string[];
  /** 掌门路模式：修真资源与身份状态（境界 / 修为 / 灵石 / 本命 / 家族）；经典模式为 undefined */
  cult?: CultivationState;
}

export interface ChoiceOption {
  label: string;
  value: string | number;
  skill?: boolean;
  lord?: boolean;
  /** 置灰且不可点击（技能次数已用尽 / 手牌费用不足） */
  disabled?: boolean;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  discard: Card[];
  current: number;
  started: boolean;
  myPlayerIdx: number;
  pendingOptions: ChoiceOption[] | null;
  pendingType: PendingType;
  pendingResolve: ((v: string | number) => void) | null;
  pendingPlayer: number | null;
  gameOver: boolean;
  winnerText: string;
  playerCount: number;
  settled: boolean;
  myKills: number;
  handClickable?: boolean;
  targetSelectable?: boolean;
  /** 回合限时：是否开启（开局选项，全局生效） */
  timerOn?: boolean;
  /** 回合限时秒数（10 / 20 / 30） */
  timerSec?: number;
  /** 当前决策的截止时间戳（ms，房主权威）；null / undefined = 无进行中的计时；随 state_sync 下发供客人端显示倒计时 */
  timerEnd?: number | null;
  /** 正在「思考中」的大模型座位号（仅 aiMode==='llm' 的座位）；随 state_sync 下发，客人端显示思考指示 */
  thinkingSeat?: number | null;
  /** 房主的大模型接管开关状态（联机由房主下发，客人端只读展示，不用于控制） */
  llmEnabled?: boolean;
  /** 房主的大模型接管范围：是否接管全部 AI 座位（客人端只读展示） */
  llmTakeoverAll?: boolean;
  /** 掌门路模式：对局模式（classic 时该字段为 undefined，经典局零改动） */
  mode?: GameMode;
  /** 掌门路模式：场上灵地盘（开局布置，可开辟 / 攻夺，按阶产灵石） */
  grounds?: SpiritGround[];
}

export interface LogEntry {
  action: LogAction;
  text?: string;
  cls?: string;
  fromName?: string;
  cardName?: string | number;
  toName?: string;
}

export interface ChatMessage {
  name: string;
  text: string;
  kind: ChatKind;
  /** 发送者头像（微信式气泡左侧/右侧人物块） */
  avatar?: string;
  /** 发送者心情图标 + 心情文案（即「一句话」） */
  moodIcon?: string;
  mood?: string;
}

/** 账号境界阶位：修为阈值 + 突破瓶颈（额外条件） */
export interface RealmTier {
  /** 境界 id */
  id: Realm;
  /** 境界名 */
  name: string;
  /** 踏入此境界所需的累计修为 */
  min: number;
  /** 突破瓶颈：除修为外还需满足的条件（全部满足方可突破） */
  req?: {
    /** 累计胜场 */
    wins?: number;
    /** 最高连胜 */
    bestStreak?: number;
    /** 已解锁成就数 */
    achievements?: number;
  };
  /** 瓶颈的「或」条件：任一满足即视为通过（与 req 并列，双方都要通过） */
  reqAny?: {
    wins?: number;
    bestStreak?: number;
    achievements?: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface Profile {
  name: string;
  /** 累计修为（原「积分」） */
  exp: number;
  /** 当前境界（受瓶颈约束，突破成功时才推进） */
  realm: Realm;
  games: number;
  wins: number;
  winStreak: number;
  bestStreak: number;
  achievements: Record<string, number>;
  /** 个性化：头像 / 性别 / 心情 / 心情图标 */
  avatar: string;
  gender: Gender;
  mood: string;
  moodIcon: string;
  /** 界面主题：光线模式（白天/夜晚/黄昏） */
  themeMode: 'day' | 'night' | 'dusk';
  /** 界面主题：内置配色风格 */
  themeStyle: 'gold' | 'teal' | 'red' | 'purple' | 'green' | 'blue';
  /** 已解锁的扩展包角色 id 列表 */
  unlockedChars: string[];
  /** 已解锁（购买）的装备 id 列表 */
  unlockedEquips: string[];
  /** 拥有的消耗类道具：道具 id → 数量 */
  items: Record<string, number>;
  /** 局前配装 */
  loadout: Loadout;
  /** 新手礼包（tier1 装备自选 1 件）是否已发放 */
  newbieGift: boolean;
  /** 扩展包每日免费使用计数（三包共享，每天 3 次；跨日重置） */
  packUsage: { date: string; used: number };
}

export interface PublicProfile extends PlayerIdentity {
  /** 累计修为 */
  exp: number;
  /** 当前境界；旧客户端可能缺省，取用时应兜底 */
  realm?: Realm;
  games: number;
  wins: number;
  achievements: Record<string, number>;
  bestStreak: number;
}

export interface PlayerPref {
  faction: FactionId;
  charId: string | null;
  /** 局前配装：携带的装备（按槽位）与道具（房主据此为远程玩家注入装备） */
  loadout?: Loadout;
  /** 该玩家已解锁的装备 id 列表（房主据此校验其配装合法性，非解锁件一律回退） */
  unlockedEquips?: string[];
  /** 加入方本局「叠加启用的扩展包」（已付费/已用免费额度）；房主据此在基础包之上追加角色池 */
  packets?: PacketId[];
  /** 加入方本局启用的**牌库扩展包**（与角色扩展包相互独立）；房主据此合成牌堆 */
  cardPacks?: CardPackId[];
}

export interface RoomMember {
  peerId: string;
  name: string;
  isHost: boolean;
  profile: PublicProfile | null;
  /** 加入方在设置界面自选的阵营 / 角色偏好（房主开局时优先采纳） */
  pref?: PlayerPref;
}

/** 座位表条目（数组下标即座位号，缺位表示该座位由 AI 补齐） */
export interface SeatSlot {
  peerId: string;
  name: string;
}
