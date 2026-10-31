/* ==================== 掌门路原著角色技能 ====================
 * 技能名全部取自 docs/ 的功法(B) / 技能(K) / 符箓(C) / 本命天赋 / 设定(L)。
 * 效果一律复用现有 SkillEffect 原语（见 core/types.ts），由 game/talentEngine.ts 统一分派，
 * 因此无需新增任何引擎分支；本表经 talentdefs.ts 合并进 TALENT_DEFS（编译期数据，无运行时副作用）。
 *
 * 出处代号：B=物事/功法.md  C=物事/符篆.md  D=物事/丹药.md  K=技能/*.md  L=设定/*.md
 */
import type { TalentDef } from '../../core/types';

/** 技能定义列表（由 talentdefs.ts 展开进 TALENT_DEFS） */
export const ZML_TALENT_LIST: TalentDef[] = [
  /* ---------------- 楚秦门 ---------------- */
  {
    id: 'zml_qixiu_mingjixin',
    name: '明己心',
    kind: 'trigger',
    timing: 'onDamaged',
    desc: '你受到伤害后，可摸 1 张牌（万碍不侵，直明本心）。出处：K-齐休本命天赋',
    effects: [{ kind: 'selfDraw', n: 1 }],
  },
  {
    id: 'zml_qixiu_jianrenxing',
    name: '见人性',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：观看一名其他角色的手牌，然后将其一张牌置于牌堆顶（直见人性、洞悉意图）。出处：K-齐休本命天赋【见人性】',
    limit: 'perTurn',
    effects: [{ kind: 'peekHand', then: 'toDeckTop' }],
  },
  {
    id: 'zml_qizhuang_jianmo',
    name: '剑魔',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害。出处：齐妆「越阶斩金丹」',
    limit: 'perTurn',
    cost: { hand: 1 },
    effects: [{ kind: 'targetDamage', n: 1 }],
  },
  {
    id: 'zml_chuwuying_wanying',
    name: '万影阁',
    kind: 'trigger',
    timing: 'onDamaged',
    desc: '你受到伤害后，可令来源弃置 1 张手牌（【万幻】【影身】，含五阶影木妖器灵）。出处：J-万影阁',
    effects: [{ kind: 'targetDiscard', n: 1 }],
  },
  {
    id: 'zml_qinchangfeng_xingdun',
    name: '星遁',
    kind: 'passive',
    timing: 'onDraw',
    desc: '摸牌阶段额外摸 1 张（参宿星本命，星遁配合法宝）。出处：J-星雪秘蛇胸针',
    effects: [{ kind: 'extraDraw', n: 1 }],
  },
  {
    id: 'zml_gutan_zhinang',
    name: '智囊',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：摸 2 张牌（楚秦门第一谋士，长于合纵连横）。出处：齐休·顾叹条目',
    limit: 'perTurn',
    effects: [{ kind: 'selfDraw', n: 2 }],
  },
  {
    id: 'zml_duoluosen_sanmu',
    name: '三木同心',
    kind: 'passive',
    timing: 'passive',
    desc: '准备阶段若你已受伤，回复 1 点体力（三木同心本命）。出处：K-三木回心阵',
    effects: [{ kind: 'selfHeal', n: 1, cond: { k: 'isHurt' } }],
  },
  {
    id: 'zml_shanuo_guidai',
    name: '诡代',
    kind: 'convert',
    timing: 'passive',
    desc: '你可将一张锦囊牌当【杀】使用或打出，每回合限一次（诡代本命：以假代真）。出处：L-诡代法.md',
    effects: [{ kind: 'convert', from: { type: 'skill' }, to: 'sha', limit: 'perTurn' }],
  },
  {
    id: 'zml_mingzhen_yixiu',
    name: '檀香针囊',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（医修，齐妆亲传弟子）。出处：楚秦门·明真条目',
    limit: 'perTurn',
    effects: [{ kind: 'targetHeal', n: 1 }],
  },
  {
    id: 'zml_mojianxin_sijian',
    name: '以身饲剑',
    kind: 'trigger',
    timing: 'onDamaged',
    desc: '你受到伤害后，摸 1 张牌（三本命剑修，以身饲剑）。出处：楚秦门·莫剑心条目',
    effects: [{ kind: 'selfDraw', n: 1 }],
  },
  {
    id: 'zml_qinweiyu_dumu',
    name: '毒木诀',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（一阶上品毒木诀，毒属性）。出处：B-毒木诀',
    limit: 'perTurn',
    effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1, attr: 'du' }],
  },
  {
    id: 'zml_zhangshishi_zhongpu',
    name: '掌门旧部',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：将 1 张手牌交给一名其他角色。出处：楚秦门·张世石条目',
    limit: 'perTurn',
    effects: [{ kind: 'giveHand', n: 1 }],
  },
  {
    id: 'zml_zhanchou_fuchou',
    name: '血仇',
    kind: 'trigger',
    timing: 'onDamaged',
    desc: '你被【杀】造成伤害后，对来源造成 1 点伤害（展元遗腹子，手刃血刀）。出处：楚秦门·展仇条目',
    effects: [{ kind: 'reflect', n: 1, when: 'hurtBySha' }],
  },
  {
    id: 'zml_xiongdai_beilie',
    name: '北烈山',
    kind: 'trigger',
    timing: 'onUseSkill',
    desc: '你使用锦囊牌后，摸 1 张牌（北烈山熊氏，齐休之妻）。出处：楚秦门·熊黛儿条目',
    effects: [{ kind: 'skillDraw', n: 1 }],
  },
  {
    id: 'zml_heyu_shenkui',
    name: '神傀化身',
    kind: 'passive',
    timing: 'passive',
    desc: '你的手牌上限 +2（水土双本命，后投南宫家化身神傀）。出处：散修·何玉条目',
    effects: [{ kind: 'handLimit', n: 2 }],
  },

  /* ---------------- 齐云 ---------------- */
  {
    id: 'zml_chuhongshang_tianhuo',
    name: '九天不灭炼火',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点火属性伤害。出处：齐云·楚红裳条目',
    limit: 'perTurn',
    cost: { hand: 1 },
    effects: [{ kind: 'targetDamage', n: 1, damageType: 'fire' }],
  },
  {
    id: 'zml_chuzhen_nianjiu',
    name: '楚老祖',
    kind: 'passive',
    timing: 'onDraw',
    desc: '摸牌阶段额外摸 1 张（元婴后期，念旧护持楚秦）。出处：齐云·楚震条目',
    effects: [{ kind: 'extraDraw', n: 1 }],
  },
  {
    id: 'zml_nangongzhi_chilian',
    name: '南宫家势',
    kind: 'passive',
    timing: 'passive',
    desc: '准备阶段若你已受伤，回复 1 点体力（南宫家元婴，痴恋楚红裳）。出处：齐云·南宫止条目',
    effects: [{ kind: 'selfHeal', n: 1, cond: { k: 'isHurt' } }],
  },
  {
    id: 'zml_jiangyan_tiancai',
    name: '姜家天才',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：摸 2 张牌（金丹圆满，冲婴在即）。出处：齐云·姜炎条目',
    limit: 'perTurn',
    effects: [{ kind: 'selfDraw', n: 2 }],
  },
  {
    id: 'zml_chuduo_handu',
    name: '寒毒',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（七芯蝎尾夺·寒毒，毒属性）。出处：J-七芯蝎尾夺',
    limit: 'perTurn',
    effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1, attr: 'du' }],
  },
  {
    id: 'zml_xingjian_zhifa',
    name: '执法',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（执法峰修士，追缉姜炎）。出处：齐云·刑剑条目',
    limit: 'perTurn',
    effects: [{ kind: 'targetDiscard', n: 1 }],
  },
  {
    id: 'zml_jianghuan_bihu',
    name: '碧湖宫主',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：观看一名其他角色的手牌，将其一张置于牌堆顶。出处：齐云·姜焕条目',
    limit: 'perTurn',
    effects: [{ kind: 'peekHand', then: 'toDeckTop' }],
  },
  {
    id: 'zml_fengzhen_duanjie',
    name: '断劫雷',
    kind: 'passive',
    timing: 'beforeJudge',
    desc: '判定牌生效前，你可用一张手牌替换之（以阴阳之气断掉劫雷）。出处：齐云·冯甄条目',
    effects: [{ kind: 'replaceJudge' }],
  },
  {
    id: 'zml_peiwen_shuirun',
    name: '水之润泽',
    kind: 'passive',
    timing: 'passive',
    desc: '准备阶段若你已受伤，回复 1 点体力（连水盟元婴，水之润泽本命）。出处：齐云·裴雯条目',
    effects: [{ kind: 'selfHeal', n: 1, cond: { k: 'isHurt' } }],
  },

  /* ---------------- 白山 ---------------- */
  {
    id: 'zml_jiachanggeng_shuangxing',
    name: '双星化神',
    kind: 'passive',
    timing: 'passive',
    desc: '你的攻击范围 +1，且摸牌阶段额外摸 1 张（白山之主，唯一双星化神）。出处：白山·贾长庚条目',
    effects: [
      { kind: 'rangePlus', n: 1 },
      { kind: 'extraDraw', n: 1 },
    ],
  },
  {
    id: 'zml_gurong_zhujian',
    name: '器符城铸剑',
    kind: 'convert',
    timing: 'passive',
    desc: '你可将一张装备牌当【杀】使用或打出，每回合限一次（离火盟出身，器符城主）。出处：白山·古熔条目',
    effects: [{ kind: 'convert', from: { type: 'equip' }, to: 'sha', limit: 'perTurn' }],
  },
  {
    id: 'zml_chaiyi_lingmu',
    name: '灵木盟',
    kind: 'trigger',
    timing: 'onUseSkill',
    desc: '你使用锦囊牌后，摸 1 张牌（灵木盟金丹，柴冠晚辈）。出处：白山·柴艺条目',
    effects: [{ kind: 'skillDraw', n: 1 }],
  },
  {
    id: 'zml_sikongshou_zhaixing',
    name: '摘星',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：观看牌堆顶 2 张，任意分配置顶 / 置底（摘星阁主，星辰本命）。出处：白山·司空寿条目',
    limit: 'perTurn',
    effects: [{ kind: 'star', n: 2 }],
  },
  {
    id: 'zml_yingbo_danmeng',
    name: '丹盟客卿',
    kind: 'passive',
    timing: 'passive',
    desc: '准备阶段若你已受伤，回复 1 点体力（丹盟客卿，本命青铜长戟）。出处：J-青铜长戟',
    effects: [{ kind: 'selfHeal', n: 1, cond: { k: 'isHurt' } }],
  },
  {
    id: 'zml_hantianqing_danmeng',
    name: '丹盟元婴',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：令所有其他角色各摸 1 张牌（丹盟元婴，调度有方）。出处：白山·韩天青条目',
    limit: 'perTurn',
    effects: [{ kind: 'multiDraw', max: 3, n: 1 }],
  },
  {
    id: 'zml_xuedao_xueying',
    name: '血影邪功',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（血影邪修，血引遁，鬼物属性）。出处：魔修·血刀条目',
    attr: 'guiwu',
    limit: 'perTurn',
    effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1, attr: 'guiwu' }],
  },

  /* ---------------- 御兽门 ---------------- */
  {
    id: 'zml_yuhe_qingfeng',
    name: '清风大道',
    kind: 'passive',
    timing: 'passive',
    desc: '你计算与其他角色的距离 -1（清风无形，鹤乃有相）。出处：L-本命代征.md',
    effects: [{ kind: 'distMod', delta: -1 }],
  },
  {
    id: 'zml_kaerweiming_guangming',
    name: '光明大道',
    kind: 'passive',
    timing: 'passive',
    desc: '你受到的火 / 雷属性伤害 -1（御兽门化神老祖，光明大道）。出处：御兽门·喀尔威明条目',
    effects: [{ kind: 'reduceDamage', types: ['fire', 'thunder'], n: 1 }],
  },
  {
    id: 'zml_laozhong_moyun',
    name: '摩云鬣',
    kind: 'passive',
    timing: 'onDraw',
    desc: '摸牌阶段额外摸 1 张（灵兽化形，智谋深沉）。出处：御兽门·老种条目',
    effects: [{ kind: 'extraDraw', n: 1 }],
  },
  {
    id: 'zml_fengxu_tiaoting',
    name: '海门调停',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：令一名其他角色摸 1 张牌（海门岛主，调停魔灾）。出处：御兽门·丰绪条目',
    limit: 'perTurn',
    effects: [{ kind: 'multiDraw', max: 1, n: 1 }],
  },
  {
    id: 'zml_huoguan_wuhu',
    name: '五虎拍门',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（霍家元婴）。出处：御兽门·霍鹳条目',
    limit: 'perTurn',
    effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1 }],
  },

  /* ---------------- 大周书院 ---------------- */
  {
    id: 'zml_jixinlong_jianfeng',
    name: '见风使舵',
    kind: 'trigger',
    timing: 'onTurnStart',
    desc: '准备阶段，你可摸 1 张牌（受贿装不知的书院金丹）。出处：大周书院·姬信隆条目',
    effects: [{ kind: 'selfDraw', n: 1 }],
  },
  {
    id: 'zml_wenxin_jinshen',
    name: '机敏谨慎',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：获得 1 点护盾（书院金丹，曾在楚秦门卧底）。出处：大周书院·闻心条目',
    limit: 'perTurn',
    effects: [{ kind: 'shield', n: 1 }],
  },
  {
    id: 'zml_jixingde_leili',
    name: '雷厉风行',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：你本回合下一张【杀】伤害 +1（北路军指挥）。出处：大周书院·姬兴德条目',
    limit: 'perTurn',
    effects: [{ kind: 'nextShaBonus', n: 1 }],
  },
  {
    id: 'zml_jiyuliang_xuncha',
    name: '巡察使',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：观看一名其他角色的手牌，将其一张置于牌堆顶（一言定宗门生死）。出处：L-通天令.md',
    limit: 'perTurn',
    effects: [{ kind: 'peekHand', then: 'toDeckTop' }],
  },

  /* ---------------- 青莲剑宗 / 南林寺 ---------------- */
  {
    id: 'zml_niefengzi_jianfeng',
    name: '剑疯',
    kind: 'passive',
    timing: 'passive',
    desc: '你使用【杀】无次数限制，每回合最多额外 1 张，每张额外杀弃 1 张手牌（战力前五）。出处：青莲剑宗·聂疯子条目',
    effects: [{ kind: 'shaUnlimited', maxExtra: 1, extraCostHand: 1 }],
  },
  {
    id: 'zml_liyuanying_jianzong',
    name: '青莲剑意',
    kind: 'passive',
    timing: 'passive',
    desc: '你的攻击范围 +1（聂疯子师妹，青莲剑宗化神）。出处：青莲剑宗·李元瑛条目',
    effects: [{ kind: 'rangePlus', n: 1 }],
  },
  {
    id: 'zml_kurong_fomen',
    name: '枯荣',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：所有已受伤的角色各回复 1 点体力（天地峰座主师弟）。出处：南林寺·枯荣条目',
    limit: 'perTurn',
    effects: [{ kind: 'allHeal', n: 1 }],
  },
  {
    id: 'zml_miaoqing_antang',
    name: '庵堂主持',
    kind: 'passive',
    timing: 'passive',
    desc: '准备阶段若你已受伤，回复 1 点体力（南林寺庵堂主持）。出处：南林寺·妙清条目',
    effects: [{ kind: 'selfHeal', n: 1, cond: { k: 'isHurt' } }],
  },

  /* ---------------- 外海 ---------------- */
  {
    id: 'zml_longyueyun_longjia',
    name: '龙家',
    kind: 'passive',
    timing: 'passive',
    desc: '你计算与其他角色的距离 -1（外海龙家，被齐妆击杀）。出处：势力/008.外海·龙越云条目',
    effects: [{ kind: 'distMod', delta: -1 }],
  },
  {
    id: 'zml_qinxizhao_junwu',
    name: '海东军务',
    kind: 'trigger',
    timing: 'onUseSkill',
    desc: '你使用锦囊牌后，摸 1 张牌（海东城芩家，主持军务）。出处：势力/008.外海·芩熙照条目',
    effects: [{ kind: 'skillDraw', n: 1 }],
  },
  {
    id: 'zml_qinlaozu_pingfeng',
    name: '白玉屏风',
    kind: 'passive',
    timing: 'passive',
    desc: '你不能成为【魔灾泛起】【万剑钻心】的目标（海东城化神，白玉屏风护体）。出处：势力/008.外海·芩老祖条目',
    effects: [{ kind: 'cardImmune', names: ['魔灾泛起', '万剑钻心'] }],
  },

  /* ---------------- 天理门 ---------------- */
  {
    id: 'zml_tufeng_heifeng',
    name: '黑风谷',
    kind: 'active',
    timing: 'active',
    desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（黑风谷创派祖师）。出处：黑风谷·屠风条目',
    limit: 'perTurn',
    effects: [{ kind: 'targetDiscard', n: 1 }],
  },
  {
    id: 'zml_tianli_chongli',
    name: '崇理',
    kind: 'passive',
    timing: 'beforeJudge',
    desc: '判定牌生效前，你可用一张手牌替换之（天理门老祖，崇理一脉）。出处：天理门·天理门化神条目',
    effects: [{ kind: 'replaceJudge' }],
  },

  /* ==================== 第二技能（每人一个，48 条） ==================== */
  /* —— 楚秦门 —— */
  { id: 'zml_qizhuang_fengyun', name: '蜂云剑阵', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（一百零八柄飞剑罩定）。出处：B-蜂云剑阵', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_chuwuying_wanhuan', name: '万幻', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（万影阁器灵【万幻】）。出处：J-万影阁', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_qinchangfeng_canxiu', name: '参宿星', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（参宿星本命，星力加持）。出处：J-星雪秘蛇胸针', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_gutan_hezong', name: '合纵连横', kind: 'active', timing: 'active', desc: '出牌阶段限一次：将 1 张手牌交给一名其他角色（游走诸派、纵横捭阖）。出处：楚秦门·顾叹条目', limit: 'perTurn', effects: [{ kind: 'giveHand', n: 1 }] },
  { id: 'zml_duoluosen_rongxin', name: '万年榕木心', kind: 'passive', timing: 'passive', desc: '准备阶段若你已受伤，回复 1 点体力（五阶木心，留作法宝器灵）。出处：K-万年榕木心', effects: [{ kind: 'selfHeal', n: 1, cond: { k: 'isHurt' } }] },
  { id: 'zml_shanuo_guzhong', name: '青铜古钟', kind: 'passive', timing: 'passive', desc: '你造成的伤害 +1（青铜古钟本命，诡代之术）。出处：楚秦门·沙诺条目', effects: [{ kind: 'damageMod', delta: 1 }] },
  { id: 'zml_mingzhen_qingxin', name: '清心', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（医修清心，檀香入定）。出处：楚秦门·明真条目', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_mojianxin_bingyuan', name: '冰源岛', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +2（冰源岛潜修三十年，炼成伪无形剑）。出处：A-伪无形剑', effects: [{ kind: 'handLimit', n: 2 }] },
  { id: 'zml_qinweiyu_wujing', name: '乌茎泽兰', kind: 'active', timing: 'active', desc: '出牌阶段限一次：获得 1 点护盾（乌茎泽兰本命，守门迷阵）。出处：K-乌茎泽兰', limit: 'perTurn', effects: [{ kind: 'shield', n: 1 }] },
  { id: 'zml_zhangshishi_qinmian', name: '勤勉', kind: 'trigger', timing: 'onTurnStart', desc: '准备阶段，你可摸 1 张牌（废本命者以勤补拙，楚秦门总管）。出处：楚秦门·张世石条目', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_zhanchou_mienmen', name: '灭门之恨', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（展家灭门，血仇不共）。出处：楚秦门·展仇条目', limit: 'perTurn', effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1 }] },
  { id: 'zml_xiongdai_xiongshi', name: '熊氏血脉', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（北烈山熊氏，齐休之妻）。出处：楚秦门·熊黛儿条目', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_heyu_shuitu', name: '水土双本命', kind: 'passive', timing: 'passive', desc: '你受到的雷属性伤害 -1（水土双本命，神傀化身）。出处：散修·何玉条目', effects: [{ kind: 'reduceDamage', types: ['thunder'], n: 1 }] },
  /* —— 齐云 —— */
  { id: 'zml_chuhongshang_huoni', name: '炼火霓裳', kind: 'passive', timing: 'passive', desc: '你造成的伤害 +1（九天不灭炼火霓裳，元婴老祖）。出处：齐云·楚红裳条目', effects: [{ kind: 'damageMod', delta: 1 }] },
  { id: 'zml_chuzhen_huchi', name: '护持楚秦', kind: 'trigger', timing: 'onTurnStart', desc: '准备阶段，你可摸 1 张牌（念旧护持，暗中照拂楚秦门）。出处：齐云·楚震条目', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_nangongzhi_jiazhu', name: '南宫家势', kind: 'active', timing: 'active', desc: '出牌阶段限一次：将 1 张手牌交给一名其他角色（南宫家元婴，势大根深）。出处：齐云·南宫止条目', limit: 'perTurn', effects: [{ kind: 'giveHand', n: 1 }] },
  { id: 'zml_jiangyan_chongying', name: '冲婴在即', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（金丹圆满，冲击元婴）。出处：齐云·姜炎条目', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_chuduo_duo', name: '蝎尾夺', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（七芯蝎尾夺，寒毒破甲）。出处：J-七芯蝎尾夺', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_xingjian_zhuiji', name: '追缉', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（执法峰追缉叛徒）。出处：齐云·刑剑条目', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_jianghuan_bihugong', name: '碧湖宫', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +2（碧湖宫主，蓄养死士）。出处：齐云·姜焕条目', effects: [{ kind: 'handLimit', n: 2 }] },
  { id: 'zml_fengzhen_yinyang', name: '阴阳大道', kind: 'passive', timing: 'passive', desc: '你受到的火 / 雷属性伤害 -1（阴阳大道，断劫雷）。出处：齐云·冯甄条目', effects: [{ kind: 'reduceDamage', types: ['fire', 'thunder'], n: 1 }] },
  { id: 'zml_peiwen_lianmeng', name: '连水盟', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（水之润泽，连水盟主）。出处：齐云·裴雯条目', limit: 'perTurn', effects: [{ kind: 'targetHeal', n: 1 }] },
  /* —— 白山 —— */
  { id: 'zml_jiachanggeng_zhuanshi', name: '转世轮回', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，回复 1 点体力（双星化神，转世轮回之功）。出处：白山·贾长庚条目', effects: [{ kind: 'selfHeal', n: 1 }] },
  { id: 'zml_gurong_qifucheng', name: '器符城', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +2（器符城主，离火盟出身，藏器于身）。出处：白山·古熔条目', effects: [{ kind: 'handLimit', n: 2 }] },
  { id: 'zml_chaiyi_lingmu2', name: '灵木盟主', kind: 'active', timing: 'active', desc: '出牌阶段限一次：获得 1 点护盾（灵木盟金丹，草木为障）。出处：白山·柴艺条目', limit: 'perTurn', effects: [{ kind: 'shield', n: 1 }] },
  { id: 'zml_sikongshou_zhaixingge', name: '摘星阁', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（摘星阁主，星辰本命）。出处：白山·司空寿条目', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_yingbo_danmeng2', name: '丹盟', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（丹盟客卿，青铜长戟）。出处：白山·英伯条目', limit: 'perTurn', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_hantianqing_dan2', name: '丹盟调度', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色摸 1 张牌（丹盟元婴，调度诸家）。出处：白山·韩天青条目', limit: 'perTurn', effects: [{ kind: 'multiDraw', max: 1, n: 1 }] },
  { id: 'zml_xuedao_xueying2', name: '血影遁', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（血影邪修，血遁伤人，鬼物属性）。出处：魔修·血刀条目', limit: 'perTurn', attr: 'guiwu', effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1, attr: 'guiwu' }] },
  /* —— 御兽门 —— */
  { id: 'zml_yuhe_wuxing', name: '无形鹤', kind: 'passive', timing: 'passive', desc: '你计算与其他角色的距离 -1（清风无形，鹤乃有相）。出处：L-本命代征.md', effects: [{ kind: 'distMod', delta: -1 }] },
  { id: 'zml_kaerweiming_ming2', name: '光明护体', kind: 'active', timing: 'active', desc: '出牌阶段限一次：获得 2 点护盾（光明大道护体）。出处：御兽门·喀尔威明条目', limit: 'perTurn', effects: [{ kind: 'shield', n: 2 }] },
  { id: 'zml_laozhong_ling', name: '灵兽化形', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（摩云鬣化形，巨兽之躯）。出处：御兽门·老种条目', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_fengxu_haimenting', name: '海门', kind: 'active', timing: 'active', desc: '出牌阶段限一次：将 1 张手牌交给一名其他角色（海门岛主，互通有无）。出处：御兽门·丰绪条目', limit: 'perTurn', effects: [{ kind: 'giveHand', n: 1 }] },
  { id: 'zml_huoguan_shoumen', name: '守门', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，令来源弃置 1 张手牌（霍家五虎拍门）。出处：御兽门·霍鹳条目', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* —— 大周书院 —— */
  { id: 'zml_jixinlong_tan', name: '贪墨', kind: 'active', timing: 'active', desc: '出牌阶段限一次：摸 2 张牌（受贿装不知，书院金丹）。出处：大周书院·姬信隆条目', limit: 'perTurn', effects: [{ kind: 'selfDraw', n: 2 }] },
  { id: 'zml_wenxin_wodi', name: '卧底', kind: 'active', timing: 'active', desc: '出牌阶段限一次：观看一名其他角色的手牌（曾卧底楚秦门，长于窥探）。出处：大周书院·闻心条目', limit: 'perTurn', effects: [{ kind: 'peekHand', then: 'toDeckTop' }] },
  { id: 'zml_jixingde_beilu', name: '北路军', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（北路军指挥，雷厉风行）。出处：大周书院·姬兴德条目', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_jiyuliang_xun2', name: '巡察', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（巡察使，一言定宗门生死）。出处：L-通天令.md', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* —— 青莲剑宗 / 南林寺 —— */
  { id: 'zml_niefengzi_jianxin', name: '剑心通明', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（剑心通明，飞剑千里取首）。出处：青莲剑宗·聂疯子条目', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_liyuanying_lian', name: '青莲', kind: 'passive', timing: 'passive', desc: '你造成的伤害 +1（青莲剑意，剑出无悔）。出处：青莲剑宗·李元瑛条目', effects: [{ kind: 'damageMod', delta: 1 }] },
  { id: 'zml_kurong_chan', name: '枯荣禅意', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（枯荣禅意，荣枯一念）。出处：南林寺·枯荣条目', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_miaoqing_antang2', name: '庵堂', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（庵堂主持，慈悲济人）。出处：南林寺·妙清条目', limit: 'perTurn', effects: [{ kind: 'targetHeal', n: 1 }] },
  /* —— 外海 / 天理门 —— */
  { id: 'zml_longyueyun_long2', name: '龙家血脉', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +1（外海龙家，血脉之力）。出处：势力/008.外海·龙越云条目', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_qinxizhao_jun2', name: '军务', kind: 'trigger', timing: 'onTurnStart', desc: '准备阶段，你可摸 1 张牌（海东城芩家军务在身）。出处：势力/008.外海·芩熙照条目', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_qinlaozu_pingfeng2', name: '白玉', kind: 'passive', timing: 'passive', desc: '你受到的火 / 雷属性伤害 -1（白玉屏风护体）。出处：势力/008.外海·芩老祖条目', effects: [{ kind: 'reduceDamage', types: ['fire', 'thunder'], n: 1 }] },
  { id: 'zml_tufeng_heifeng2', name: '黑风', kind: 'passive', timing: 'passive', desc: '你计算与其他角色的距离 -1（黑风谷阴风裹身）。出处：黑风谷·屠风条目', effects: [{ kind: 'distMod', delta: -1 }] },
  { id: 'zml_tianli_chongli2', name: '天理', kind: 'active', timing: 'active', desc: '出牌阶段限一次：获得 1 点护盾（天理森严，法理护身）。出处：天理门·天理门化神条目', limit: 'perTurn', effects: [{ kind: 'shield', n: 1 }] },

  /* ==================== 第三技能（12 名核心角色，12 条） ==================== */
  { id: 'zml_qizhuang_hunyuan', name: '混元剑冢', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 2 张手牌（三阶中品剑阵，万剑归冢）。出处：B-混元剑冢', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 2 }] },
  { id: 'zml_chuwuying_yingshen', name: '影身', kind: 'active', timing: 'active', desc: '出牌阶段限一次：获得 1 点护盾（【影身】化影分身）。出处：J-万影阁', limit: 'perTurn', effects: [{ kind: 'shield', n: 1 }] },
  { id: 'zml_qinchangfeng_xingxue', name: '星雪', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（星雪秘蛇胸针器灵）。出处：J-星雪秘蛇胸针', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_gutan_mouzhu', name: '谋主', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（楚秦谋主，算计人心）。出处：楚秦门·顾叹条目', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_chuhongshang_bumie', name: '不灭炼火', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 2 张手牌，对一名其他角色造成 2 点火属性伤害（九天不灭炼火）。出处：齐云·楚红裳条目', limit: 'perTurn', effects: [{ kind: 'costThenDamage', cost: 2, dmg: 2 }] },
  { id: 'zml_jiachanggeng_shuang', name: '双星', kind: 'active', timing: 'active', desc: '出牌阶段限一次：摸 2 张牌（长庚星与大火星双本命）。出处：白山·贾长庚条目', limit: 'perTurn', effects: [{ kind: 'selfDraw', n: 2 }] },
  { id: 'zml_yuhe_dao', name: '清风大道', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（清风大道，鹤鸣九天）。出处：御兽门·玉鹤条目', limit: 'perTurn', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_niefengzi_fei', name: '飞剑', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（飞剑千里，取首如探囊）。出处：青莲剑宗·聂疯子条目', limit: 'perTurn', effects: [{ kind: 'costThenDamage', cost: 1, dmg: 1 }] },
  { id: 'zml_kurong_fomen2', name: '南林佛门', kind: 'active', timing: 'active', desc: '出牌阶段限一次：所有已受伤角色各回复 1 点体力（佛门枯荣，普度众生）。出处：南林寺·枯荣条目', limit: 'perTurn', effects: [{ kind: 'allHeal', n: 1 }] },
  { id: 'zml_qinlaozu_baiyu', name: '屏风', kind: 'active', timing: 'active', desc: '出牌阶段限一次：获得 2 点护盾（白玉屏风，化神护体）。出处：势力/008.外海·芩老祖条目', limit: 'perTurn', effects: [{ kind: 'shield', n: 2 }] },
  { id: 'zml_tufeng_heigu', name: '黑风谷主', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 2 张手牌（黑风谷主，阴风卷物）。出处：黑风谷·屠风条目', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 2 }] },
  { id: 'zml_qixiu_buzai', name: '不在算中', kind: 'passive', timing: 'passive', desc: '你不能成为【全知天眼】【命演术】的目标（本命天赋，命运之术不可测）。出处：角色/楚秦门/03.金丹/齐休.md', effects: [{ kind: 'cardImmune', names: ['全知天眼', '命演术'] }] },

  /* ==================== 28 位主要角色·核心天赋（按 docs 重做） ====================
   * 每人只保留 2~3 个本命天赋；其余天赋已拆为通用「技能」与「法宝」卡（见 cards.zml.ts）。
   * 天赋名一律避开牌堆已有词条：不在算中 / 命演术 / 诡代之法 / 本命代征 / 通明身识 / 敛息诀。
   */

  /* ---- 齐妆 ---- */
  { id: 'zml_qizhuang_xiazhong', name: '匣中万剑', kind: 'passive', timing: 'passive', desc: '你的【杀】无次数限制，每多出一张须弃 1 张手牌，每回合最多额外 2 张（本命【鎏花幻月剑匣】天赋）。出处：docs/md/角色/楚秦门/03.金丹/齐妆.md', effects: [{ kind: 'shaUnlimited', maxExtra: 2, extraCostHand: 1 }] },
  { id: 'zml_qizhuang_guizhen', name: '归真经', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，可弃 1 张手牌摸 2 张（返璞归真，剑心不乱）。出处：B-归真经（齐妆所修功法）', effects: [{ kind: 'costCard', n: 1 }, { kind: 'selfDraw', n: 2 }] },

  /* ---- 秦长风 ---- */
  { id: 'zml_qinchangfeng_xingzhi', name: '星之无垠', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，观看牌堆顶 2 张并获得其中 1 张（丹论「星之无垠」，众星皆可为我所用）。出处：docs/md/角色/楚秦门/03.金丹/秦长风.md', limit: 'perTurn', cost: { hand: 1 }, effects: [{ kind: 'deckPeek', n: 2, then: 'pickOne' }] },

  /* ---- 顾叹 ---- */
  { id: 'zml_gutan_hezong', name: '合纵连横', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令至多 2 名其他角色各摸 1 张，然后你摸 1 张（楚秦谋主长于合纵连横）。出处：docs/md/角色/楚秦门/03.金丹/顾叹.md', limit: 'perTurn', effects: [{ kind: 'multiDraw', max: 2, n: 1 }, { kind: 'selfDraw', n: 1 }] },
  { id: 'zml_gutan_shezhan', name: '舌战', kind: 'active', timing: 'active', desc: '出牌阶段限一次：与一名其他角色拼点，赢的你夺取其 1 张手牌（九星坊舌战群修，一夫当关）。出处：docs/md/角色/楚秦门/03.金丹/顾叹.md', limit: 'perTurn', effects: [{ kind: 'pointDuel', win: [{ kind: 'stealFrom', max: 1 }], lose: [] }] },

  /* ---- 沙诺 ---- */
  { id: 'zml_shanuo_guzhong', name: '青铜古钟', kind: 'passive', timing: 'onTargetSha', desc: '每回合限一次：你成为【杀】的目标时，可展示一张手牌，若其点数不小于该【杀】的点数则该【杀】无效（废本命【青铜古钟】钟鸣护体）。出处：docs/md/角色/楚秦门/03.金丹/沙诺.md', limit: 'perTurn', effects: [{ kind: 'numGuard', op: 'ge', against: 'shaNum', limit: 'perTurn' }] },
  { id: 'zml_shanuo_sanhun', name: '散魂棺', kind: 'trigger', timing: 'onDeath', desc: '每当一名角色阵亡，你摸 3 张牌（散魂棺聚敛魂魄；曾以此湮灭齐妆的聚魂棺）。出处：docs/md/角色/楚秦门/03.金丹/沙诺.md', attr: 'guiwu', effects: [{ kind: 'soulSeize', on: 'death', draw: 3 }] },

  /* ---- 明真 ---- */
  { id: 'zml_mingzhen_zhennang', name: '檀香针囊', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名已受伤的角色回复 1 点体力（一囊御群针，医修仁心）。出处：docs/md/角色/楚秦门/03.金丹/明真.md', limit: 'perTurn', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_mingzhen_yanmei', name: '言魅之术', kind: 'active', timing: 'active', desc: '出牌阶段限一次：与一名其他角色拼点，赢的你令其弃 1 张牌并摸 1 张（言魅安抚心神、制止自爆，融佛门手段）。出处：K-言魅之术；docs/md/角色/楚秦门/03.金丹/明真.md', limit: 'perTurn', effects: [{ kind: 'pointDuel', win: [{ kind: 'targetDiscard', n: 1 }, { kind: 'selfDraw', n: 1 }], lose: [] }] },

  /* ---- 莫剑心 ---- */
  { id: 'zml_mojianxin_chengjian', name: '成剑', kind: 'trigger', timing: 'onEquip', desc: '你装备一张装备牌后，可摸 1 张牌（本命天赋「成剑」，器修铸器即得）。出处：K-成剑；docs/md/角色/楚秦门/02.筑基/莫剑心.md', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_mojianxin_sijian', name: '以身饲剑', kind: 'limit', timing: 'onDeath', desc: '限定技：你阵亡时，可令一名其他角色摸 3 张牌并回复 1 点体力（冰源岛以身饲剑，铸成日、月、星、影四剑分赠同门）。出处：docs/md/角色/楚秦门/02.筑基/莫剑心.md', limit: 'perGame', effects: [{ kind: 'targetDraw', n: 3 }, { kind: 'targetHeal', n: 1 }] },

  /* ---- 何玉 ---- */
  { id: 'zml_heyu_bingleng', name: '冰棱地刺', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（本命天赋，黑河蜥之战领悟）。出处：K-冰棱地刺；docs/md/角色/散修/03.金丹/何玉.md', limit: 'perTurn', cost: { hand: 1 }, effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_heyu_shenkui', name: '神傀化身', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 2 张手牌，获得一名其他角色的一个天赋，直到你的下个回合开始（白山密宗秘法，斩出恶念成邪恶化身）。出处：B-神傀化身；docs/md/角色/散修/03.金丹/何玉.md', limit: 'perTurn', cost: { hand: 2 }, effects: [{ kind: 'copyTalent', duration: 'turn' }] },

  /* ---- 熊十四 ---- */
  { id: 'zml_xiongshisi_beilie', name: '北烈山', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +2（北烈山熊氏厚积薄发，熊家附庸中的中流砥柱）。出处：docs/md/角色/楚秦门/03.金丹/熊十四.md', effects: [{ kind: 'handLimit', n: 2 }] },
  { id: 'zml_xiongshisi_shouwei', name: '首位金丹', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，可弃 1 张手牌摸 2 张（熊氏首位金丹，结丹后底气自生）。出处：docs/md/角色/楚秦门/03.金丹/熊十四.md', effects: [{ kind: 'costCard', n: 1 }, { kind: 'selfDraw', n: 2 }] },

  /* ---- 赵瑶 ---- */
  { id: 'zml_zhaoyao_yisha', name: '以杀证道', kind: 'trigger', timing: 'onShaHit', desc: '你用【杀】造成伤害后，可摸 1 张牌（白山深处独杀上千凶兽以杀证道）。出处：docs/md/角色/楚秦门/02.筑基/赵瑶.md', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_zhaoyao_rumo', name: '入魔', kind: 'awaken', timing: 'awaken', desc: '觉醒技：准备阶段若你已受伤，减 1 点体力上限并获得【魔化】。出处：赵瑶魔筑基、化名小红；docs/md/角色/楚秦门/02.筑基/赵瑶.md', effects: [{ kind: 'awaken', replaceWith: 'zml_zhaoyao_mohua', minusMaxHp: 1 }] },
  { id: 'zml_zhaoyao_mohua', name: '魔化', kind: 'passive', timing: 'passive', desc: '你造成的伤害 +1（魔筑基，双瞳变红）。出处：docs/md/角色/楚秦门/02.筑基/赵瑶.md', effects: [{ kind: 'damageMod', delta: 1 }] },

  /* ---- 展剑锋 ---- */
  { id: 'zml_zhanjianfeng_yizhi', name: '一指奔雷', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点雷属性伤害（本命天赋，号「楚秦金丹以下第一人」）。出处：K-一指奔雷；docs/md/角色/楚秦门/02.筑基/展剑锋.md', limit: 'perTurn', cost: { hand: 1 }, effects: [{ kind: 'targetDamage', n: 1, damageType: 'thunder' }] },
  { id: 'zml_zhanjianfeng_rujie', name: '入劫见真', kind: 'awaken', timing: 'awaken', desc: '觉醒技：准备阶段若你已受伤，减 1 点体力上限并获得【劫真】。出处：丹论「入劫见真」，碎丹为斩；docs/md/角色/楚秦门/02.筑基/展剑锋.md', effects: [{ kind: 'awaken', replaceWith: 'zml_zhanjianfeng_jiezhen', minusMaxHp: 1 }] },
  { id: 'zml_zhanjianfeng_jiezhen', name: '劫真', kind: 'passive', timing: 'passive', desc: '你造成的伤害 +1（本命剑觉醒，以剑劫渡劫）。出处：docs/md/角色/楚秦门/02.筑基/展剑锋.md', effects: [{ kind: 'damageMod', delta: 1 }] },

  /* ---- 白晓生（外号百晓生） ---- */
  { id: 'zml_baixiaosheng_fengwu', name: '北方风物志', kind: 'active', timing: 'active', desc: '出牌阶段限一次：观看一名其他角色的手牌，然后将其一张牌置于牌堆顶（著《百晓生北方风物志》，知天下事）。出处：docs/md/角色/楚秦门/02.筑基/白晓生.md', limit: 'perTurn', effects: [{ kind: 'peekHand', then: 'toDeckTop' }] },
  { id: 'zml_baixiaosheng_chuangong', name: '传功教习', kind: 'active', timing: 'active', desc: '出牌阶段限一次：交给一名其他角色 1 张手牌，然后你摸 1 张（任楚秦传功教习数十年，为赵瑶、秦长风等打基础）。出处：docs/md/角色/楚秦门/02.筑基/白晓生.md', limit: 'perTurn', effects: [{ kind: 'giveHand', n: 1 }, { kind: 'selfDraw', n: 1 }] },

  /* ---- 楚震 ---- */
  { id: 'zml_chuzhen_laozu', name: '楚老祖', kind: 'passive', timing: 'passive', desc: '其他角色计算与你的距离 +1（元婴后期威压震齐云近两千年）。出处：docs/md/角色/齐云/04.元婴/楚震.md', effects: [{ kind: 'distPlusToMe', n: 1 }] },
  { id: 'zml_chuzhen_kaizong', name: '开宗之恩', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，可令一名其他角色摸 1 张牌，然后你摸 1 张（曾为弟子秦烈儿争得楚秦山开宗立派）。出处：docs/md/角色/齐云/04.元婴/楚震.md', effects: [{ kind: 'targetDraw', n: 1 }, { kind: 'selfDraw', n: 1 }] },

  /* ---- 姜炎 ---- */
  { id: 'zml_jiangyan_honglian', name: '红莲业火', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点火属性伤害（火系兼心神攻击，曾以此焚杀南宫嫣然）。出处：B-红莲业火；docs/md/角色/齐云/03.金丹/姜炎.md', limit: 'perTurn', cost: { hand: 1 }, effects: [{ kind: 'targetDamage', n: 1, damageType: 'fire' }] },
  { id: 'zml_jiangyan_bisha', name: '必杀十人', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色获得 1 枚「必杀」标记，你对其造成的伤害 +1（山都山刻必杀十人名单）。出处：docs/md/角色/齐云/03.金丹/姜炎.md', limit: 'perTurn', effects: [{ kind: 'markBonus', mark: '必杀', dmgBonus: 1 }] },

  /* ---- 楚夺 ---- */
  { id: 'zml_chuduo_weiya', name: '威压', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（金丹修士威压震慑，曾斥齐休为「废物」）。出处：docs/md/角色/齐云/03.金丹/楚夺.md', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_chuduo_daoying', name: '盗婴', kind: 'active', timing: 'active', desc: '出牌阶段限一次：观看一名其他角色的手牌并夺取其中 1 张（白山盗婴案真凶，借楚秦商队偷运婴儿）。出处：docs/md/角色/齐云/03.金丹/楚夺.md', limit: 'perTurn', effects: [{ kind: 'peekHand', then: 'steal' }] },

  /* ---- 楚神通 ---- */
  { id: 'zml_chushentong_shuimo', name: '水墨山河阵', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色弃置 1 张牌，然后你摸 1 张（南楚幕后谋主，以智谋与阵法见长）。出处：K-水墨山河阵；docs/md/角色/齐云/04.元婴/楚神通.md', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 1 }, { kind: 'selfDraw', n: 1 }] },
  { id: 'zml_chushentong_caibu', name: '采补双修', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，若来源的手牌多于你，你夺取其 1 张手牌（采补双修炉鼎邪法，黑风谷窦买所授）。出处：B-采补双修；docs/md/角色/齐云/04.元婴/楚神通.md', cond: { k: 'srcHandMoreThanMe' }, effects: [{ kind: 'stealFrom', max: 1 }] },

  /* ---- 楚问 ---- */
  { id: 'zml_chuwen_qixing', name: '七星剑诀', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（本命【七星剑诀】，青元星 / 琉璃星 / 斩元星）。出处：B-七星剑诀；docs/md/角色/齐云/04.元婴/楚问.md', limit: 'perTurn', cost: { hand: 1 }, effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_chuwen_weisha', name: '唯杀可解', kind: 'passive', timing: 'passive', desc: '当你已受伤时，你造成的伤害 +1（「世间许多事，唯『杀』字一法可解」，山都山以一敌四）。出处：docs/md/角色/齐云/04.元婴/楚问.md', cond: { k: 'isHurt' }, effects: [{ kind: 'damageMod', delta: 1 }] },

  /* ---- 刑铣 ---- */
  { id: 'zml_xingxi_zhifa', name: '执法', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色选择：弃置 1 张手牌，或令你摸 1 张牌（执法峰座主行事，依法依规）。出处：docs/md/角色/齐云/05.化神/刑铣.md', limit: 'perTurn', effects: [{ kind: 'targetChoose', maxTargets: 1, options: [[{ kind: 'targetDiscard', n: 1 }], [{ kind: 'selfDraw', n: 1 }]] }] },
  { id: 'zml_xingxi_gongping', name: '公平', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，令来源弃置 1 张手牌（「照规矩办就是公平」）。出处：docs/md/角色/齐云/05.化神/刑铣.md', effects: [{ kind: 'targetDiscard', n: 1 }] },

  /* ---- 天地峰座主 ---- */
  { id: 'zml_tiandifeng_qianzhang', name: '千丈法相', kind: 'passive', timing: 'passive', desc: '你的攻击范围 +2（千丈巨人法相化身，一掌击开聂疯子飞剑）。出处：K-千丈巨人法相；docs/md/角色/齐云/05.化神/天地峰座主.md', effects: [{ kind: 'rangePlus', n: 2 }] },
  { id: 'zml_tiandifeng_weiwo', name: '唯我独尊', kind: 'passive', timing: 'passive', desc: '你每次受到的伤害 -1（此界战力第二，天上天下唯我独尊）。出处：docs/md/角色/齐云/05.化神/天地峰座主.md', effects: [{ kind: 'reduceDamage', types: ['normal', 'fire', 'thunder'], n: 1 }] },

  /* ---- 南宫木 ---- */
  { id: 'zml_nangongmu_qingmu', name: '青木为龙', kind: 'active', timing: 'active', desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（木灵力凝成青色龙头虚影，化神之威）。出处：docs/md/角色/齐云/05.化神/南宫木.md', limit: 'perTurn', cost: { hand: 1 }, effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_nangongmu_zhuiji', name: '追缉', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色获得 1 枚「追缉」标记，你对其造成的伤害 +1（追捕何玉数十年，不惜借外力耗损阳寿）。出处：docs/md/角色/齐云/05.化神/南宫木.md', limit: 'perTurn', effects: [{ kind: 'markBonus', mark: '追缉', dmgBonus: 1 }] },

  /* ---- 南宫梦（无独立档案，据 docs 多处提及整理） ---- */
  { id: 'zml_nangongmeng_gongguan', name: '共管', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色摸 1 张牌，然后你观看其一张手牌（与姜焕共管碧湖密藏探宝秩序）。出处：docs/md/事件/M-03 碧湖密藏崩塌事件.md；docs/md/角色/齐云/04.元婴/姜焕.md', limit: 'perTurn', effects: [{ kind: 'targetDraw', n: 1 }, { kind: 'peekHand', then: 'toDeckTop' }] },
  { id: 'zml_nangongmeng_fenting', name: '分庭抗礼', kind: 'active', timing: 'active', desc: '出牌阶段限一次：与一名其他角色拼点，赢的你令其弃 1 张牌并摸 1 张（与姜焕因碧湖之争对峙，势同水火）。出处：docs/md/角色/齐云/04.元婴/姜焕.md；docs/md/角色/齐云/04.元婴/南宫止.md', limit: 'perTurn', effects: [{ kind: 'pointDuel', win: [{ kind: 'targetDiscard', n: 1 }, { kind: 'selfDraw', n: 1 }], lose: [] }] },

  /* ---- 南宫嫣然 ---- */
  { id: 'zml_nangongyanran_lianyin', name: '联姻', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色摸 1 张牌，然后你摸 1 张（南宫家以联姻换取楚秦门参与探宝）。出处：docs/md/角色/齐云/02.筑基/南宫嫣然.md', limit: 'perTurn', effects: [{ kind: 'targetDraw', n: 1 }, { kind: 'selfDraw', n: 1 }] },
  { id: 'zml_nangongyanran_hushen', name: '护身项链', kind: 'trigger', timing: 'onDamaged', desc: '你被【杀】造成伤害后，对伤害来源造成 1 点伤害（伪六道空间中护身项链反击，杀死秦思瑶）。出处：docs/md/角色/齐云/02.筑基/南宫嫣然.md', effects: [{ kind: 'reflect', n: 1, when: 'hurtBySha' }] },

  /* ---- 法引 ---- */
  { id: 'zml_fayin_xuncha', name: '巡察使', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色选择：弃置 1 张手牌，或令你观看其手牌（受齐休安置为楚秦巡察使，立誓震慑众家主）。出处：docs/md/角色/白山/03.金丹/法引.md', limit: 'perTurn', effects: [{ kind: 'targetChoose', maxTargets: 1, options: [[{ kind: 'targetDiscard', n: 1 }], [{ kind: 'peekHand', then: 'toDeckTop' }]] }] },
  { id: 'zml_fayin_hongyuan', name: '大宏愿', kind: 'active', timing: 'active', desc: '出牌阶段限一次：令一名其他角色本回合结束时若未使用过【杀】，则你摸 2 张牌（「一日不清和太平，一日不归本寺，不登极乐」）。出处：docs/md/角色/白山/03.金丹/法引.md', limit: 'perTurn', effects: [{ kind: 'pledge', onTurnEnd: [{ kind: 'selfDraw', n: 2 }] }] },

  /* ---- 玉鹤 ---- */
  { id: 'zml_yuhe_qingxin', name: '清心寡欲', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +2（证道元婴后踏上清心寡欲无情道）。出处：docs/md/角色/御兽门/04.元婴/玉鹤.md', effects: [{ kind: 'handLimit', n: 2 }] },

  /* ---- 醒狮 ---- */
  { id: 'zml_xingshi_hunshui', name: '昏睡', kind: 'limit', timing: 'active', desc: '限定技：出牌阶段，你可翻面并摸 3 张牌、回复 2 点体力（多数时候处于昏睡，沉睡中积蓄力量）。出处：docs/md/角色/蛮荒/05.化神/醒狮.md', limit: 'perGame', effects: [{ kind: 'turnFace', draw: 3 }, { kind: 'selfHeal', n: 2 }] },
  { id: 'zml_xingshi_xiuhun', name: '嗅魂', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，令伤害来源失去 1 点体力（昏睡中凭鼻子一嗅即可吸走修士灵魂，潜意识扑击瞬杀元婴）。出处：docs/md/角色/蛮荒/05.化神/醒狮.md', effects: [{ kind: 'targetLoseHp', n: 1 }] },

  /* ==================== 十大门派主公技（掌门路） ==================== */
  { id: 'zml_lord_chuqin', name: '开山立派', kind: 'lord', timing: 'passive', desc: '主公技：你的手牌上限 +2（楚秦门自白山北部开山立派，门人归附）。出处：L-大周书院宗法制.md · 开辟之功', effects: [{ kind: 'handLimit', n: 2 }] },
  { id: 'zml_lord_qiyun', name: '天地峰令', kind: 'lord', timing: 'active', desc: '主公技：出牌阶段限一次，令一名其他角色弃置 1 张手牌（齐云天地峰座主号令诸派）。出处：势力·齐云条目', limit: 'perTurn', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_lord_baishan', name: '转世轮回', kind: 'lord', timing: 'onDamaged', desc: '主公技：你受到伤害后，回复 1 点体力（白山之主双星化神，转世轮回）。出处：白山·贾长庚条目', effects: [{ kind: 'selfHeal', n: 1 }] },
  { id: 'zml_lord_yushou', name: '开辟特权', kind: 'lord', timing: 'onTurnStart', desc: '主公技：准备阶段，你可摸 1 张牌（御兽门可独立发动开辟战争之特权）。出处：势力·御兽门条目', effects: [{ kind: 'selfDraw', n: 1 }] },
  { id: 'zml_lord_dazhou', name: '三代掌门制', kind: 'lord', timing: 'onDraw', desc: '主公技：摸牌阶段额外摸 1 张（大周书院三代掌门制，制度之利）。出处：L-大周书院宗法制.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_lord_qinglian', name: '剑心通明', kind: 'lord', timing: 'passive', desc: '主公技：你的攻击范围 +1（青莲剑宗，剑修圣地）。出处：青莲剑宗·聂疯子条目', effects: [{ kind: 'rangePlus', n: 1 }] },
  { id: 'zml_lord_nanlin', name: '枯荣禅意', kind: 'lord', timing: 'onDamaged', desc: '主公技：你受到伤害后，令来源弃置 1 张手牌（佛门禅意反震）。出处：南林寺·枯荣条目', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_lord_waihai', name: '海东军务', kind: 'lord', timing: 'passive', desc: '主公技：你造成的伤害 +1（外海芩家主持海东军务）。出处：势力/008.外海·芩熙照条目', effects: [{ kind: 'damageMod', delta: 1 }] },
  { id: 'zml_lord_tianli', name: '崇理', kind: 'lord', timing: 'beforeJudge', desc: '主公技：判定牌生效前，你可用一张手牌替换之（天理门崇理一脉）。出处：天理门·天理门化神条目', effects: [{ kind: 'replaceJudge' }] },
  { id: 'zml_lord_manhuang', name: '兽王领地', kind: 'lord', timing: 'onTurnStart', desc: '主公技：其他角色计算与你的距离 +1；准备阶段你可摸 1 张牌（蛮荒古兽领地辽阔，外人难以深入）。出处：docs/md/角色/蛮荒/05.化神/醒狮.md；docs/md/势力/009.蛮荒/醒狮谷.md', effects: [{ kind: 'distPlusToMe', n: 1 }, { kind: 'selfDraw', n: 1 }] },
];
