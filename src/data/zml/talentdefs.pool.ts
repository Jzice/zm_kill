/* ==================== 天赋池扩展（为每名角色补足 >3 门天赋） ====================
 * 目的：让「天赋池 → 开局随机激活 2~3 门」机制真正生效。
 * 现有角色多只有 2~3 门天赋（≤3 时全激活，不触发随机），故在此为每位角色补充 1~2 门
 * 原著向天赋（取自其本命 / 功法 / 门派身份 / 事迹），使天赋池达到 4 门左右。
 * 另有一部分角色天赋早已定义于 talentdefs.zml.ts 却未接入角色池，由 characters.zml.ts 直接引用。
 *
 * 效果一律复用现有 SkillEffect 原语（见 core/types.ts），由 game/talentEngine.ts 统一分派，
 * 因此无需新增任何引擎分支。本表经 talentdefs.ts 合并进 TALENT_DEFS（编译期数据，无运行时副作用）。
 * 出处代号码同 talentdefs.zml.ts：B=功法 C=符箓 D=丹药 K=技能 L=设定 J=法宝/器灵。
 */
import type { TalentDef } from '../../core/types';

export const ZML_POOL_TALENT_LIST: TalentDef[] = [
  /* ==================== 楚秦门 ==================== */
  /* 齐休（补 1：明己心 / 见人性 / 不在算中 → 4） */
  { id: 'zml_qixiu_qiaoxin', name: '七窍玲珑', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：观看牌堆顶 3 张，取其中 1 张加入手牌（七窍玲珑心，算无遗策）。出处：docs/md/角色/楚秦门/03.金丹/齐休.md', effects: [{ kind: 'deckPeek', n: 3, then: 'pickOne' }] },
  /* 楚无影（补 1：万幻 / 影身 / 万影阁 → 4） */
  { id: 'zml_chuwuying_yingxi', name: '影袭', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（影中突袭，防不胜防）。出处：docs/md/角色/楚秦门/03.金丹/楚无影.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 多罗森（补 2：三木同心 / 万年榕木心 → 4） */
  { id: 'zml_duoluosen_liandan', name: '炼丹', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（擅炼筑基丹，三木同心济人）。出处：docs/md/物事/丹药.md · 筑基丹（多罗森凝丹）', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_duoluosen_muling', name: '木灵', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（三木同心，木灵自生）。出处：docs/md/角色/楚秦门/03.金丹/多罗森.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  /* 沙诺（补 2：青铜古钟 / 散魂棺 → 4） */
  { id: 'zml_shanuo_baisha', name: '白沙帮', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（白沙帮主，帮众听命）。出处：docs/md/角色/楚秦门/03.金丹/沙诺.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_shanuo_guiqi', name: '鬼气', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（逃入魔井，与鬼修万骨共生）。出处：docs/md/角色/楚秦门/03.金丹/沙诺.md', effects: [{ kind: 'selfDraw', n: 1 }] },
  /* 明真（补 1：檀香针囊 / 言魅之术 / 清心 → 4） */
  { id: 'zml_mingzhen_jinzhen', name: '牛毛金针', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（一囊御群针，针出如雨）。出处：docs/md/角色/楚秦门/03.金丹/明真.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 莫剑心（补 1：成剑 / 以身饲剑 / 冰源岛 → 4） */
  { id: 'zml_mojianxin_yueying', name: '月影', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（本命幻月灵剑，月影随行）。出处：docs/md/角色/楚秦门/02.筑基/莫剑心.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 秦唯喻（补 2：毒木 / 乌茎泽兰 → 4） */
  { id: 'zml_qinweiyu_tongcan', name: '同参', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：将 1 张手牌交给一名其他角色（外门逆袭，结同参之谊）。出处：docs/md/角色/楚秦门/02.筑基/秦唯喻.md', effects: [{ kind: 'giveHand', n: 1 }] },
  { id: 'zml_qinweiyu_nixi', name: '逆袭', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（外门出身，绝境逆袭）。出处：docs/md/角色/楚秦门/02.筑基/秦唯喻.md', effects: [{ kind: 'selfDraw', n: 1 }] },
  /* 张世石（补 2：忠仆 / 勤勉 → 4） */
  { id: 'zml_zhangshishi_cangjing', name: '藏经', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（管藏经阁数十年，胸藏万卷）。出处：docs/md/角色/楚秦门/01.练气/张世石.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_zhangshishi_zhuji', name: '筑基', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：观看牌堆顶 2 张，取其中 1 张加入手牌（以勤补拙，筑基有成）。出处：docs/md/角色/楚秦门/01.练气/张世石.md', effects: [{ kind: 'deckPeek', n: 2, then: 'pickOne' }] },
  /* 展仇（补 2：复仇 / 灭门之恨 → 4） */
  { id: 'zml_zhanchou_pingzhong', name: '瓶中水', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（本命瓶中水，润物无声）。出处：docs/md/角色/楚秦门/01.练气/展仇.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_zhanchou_yigu', name: '遗孤', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（展元遗腹子，孤身复仇）。出处：docs/md/角色/楚秦门/01.练气/展仇.md', effects: [{ kind: 'selfDraw', n: 1 }] },
  /* 熊黛儿（补 2：北烈 / 熊氏血脉 → 4） */
  { id: 'zml_xiongdai_zengdan', name: '筑基赠丹', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（父赠筑基丹药，济助同门）。出处：docs/md/角色/楚秦门/01.练气/熊黛儿.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_xiongdai_lingzhi', name: '灵植', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（北烈山熊氏，善灵植）。出处：docs/md/角色/楚秦门/01.练气/熊黛儿.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  /* 何玉（补 1：冰棱地刺 / 神傀化身 / 水土双本命 → 4） */
  { id: 'zml_heyu_tongcan', name: '同参流水', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（同参流水菩提串，济度同门）。出处：docs/md/角色/散修/03.金丹/何玉.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  /* 熊十四（补 2：北烈山 / 首位金丹 → 4） */
  { id: 'zml_xiongshisi_zhongjia', name: '熊氏重甲', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：获得 2 点护盾（北烈山熊氏重甲，护体如城）。出处：docs/md/角色/楚秦门/03.金丹/熊十四.md', effects: [{ kind: 'shield', n: 2 }] },
  { id: 'zml_xiongshisi_fuyong', name: '附庸', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：将 1 张手牌交给一名其他角色（熊家附庸，结好同门）。出处：docs/md/角色/楚秦门/03.金丹/熊十四.md', effects: [{ kind: 'giveHand', n: 1 }] },
  /* 赵瑶（补 2：以杀证道 / 入魔 / 魔化 → 4） */
  { id: 'zml_zhaoyao_guifan', name: '鬼幡', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点鬼物属性伤害（鬼幡内含霍虎魂魄）。出处：docs/md/角色/楚秦门/02.筑基/赵瑶.md', attr: 'guiwu', effects: [{ kind: 'targetDamage', n: 1, attr: 'guiwu' }] },
  { id: 'zml_zhaoyao_xiaohong', name: '小红', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，令伤害来源弃置 1 张手牌（化名小红，魔威反噬）。出处：docs/md/角色/楚秦门/02.筑基/赵瑶.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* 展剑锋（补 2：一指奔雷 / 入劫见真 → 4） */
  { id: 'zml_zhanjianfeng_junzhen', name: '军阵', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（总理楚秦军阵，调度有方）。出处：docs/md/角色/楚秦门/02.筑基/展剑锋.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_zhanjianfeng_leiyin', name: '雷印', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点雷属性伤害（雷系指法，雷印追光）。出处：docs/md/角色/楚秦门/02.筑基/展剑锋.md', effects: [{ kind: 'targetDamage', n: 1, damageType: 'thunder', attr: 'lei' }] },
  /* 白晓生（补 2：北方风物志 / 传功教习 → 4） */
  { id: 'zml_baixiaosheng_cangjingge', name: '藏经阁', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（掌楚秦藏经阁，典籍盈架）。出处：docs/md/角色/楚秦门/02.筑基/白晓生.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_baixiaosheng_menzhu', name: '门规', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（定楚秦五级身份制，门规森严）。出处：docs/md/角色/楚秦门/02.筑基/白晓生.md', effects: [{ kind: 'targetDiscard', n: 1 }] },

  /* ==================== 齐云 ==================== */
  /* 楚红裳（补 1：不灭炼火 / 天火 / 炼火霓裳 → 4） */
  { id: 'zml_chuhongshang_huoyu', name: '火羽', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点火属性伤害（炼火霓裳，火羽焚敌）。出处：docs/md/角色/齐云/04.元婴/楚红裳.md', effects: [{ kind: 'targetDamage', n: 1, damageType: 'fire', attr: 'fire' }] },
  /* 楚震（补 1：楚老祖 / 开宗之恩 / 护持楚秦 → 4） */
  { id: 'zml_chuzhen_weiyan', name: '元婴威压', kind: 'passive', timing: 'passive', desc: '其他角色计算与你的距离 +1（元婴后期威压，震齐云近两千年）。出处：docs/md/角色/齐云/04.元婴/楚震.md', effects: [{ kind: 'distPlusToMe', n: 1 }] },
  /* 南宫止（补 2：赤莲 / 南宫家势 → 4） */
  { id: 'zml_nangongzhi_bihu', name: '碧湖有余', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色摸 1 张牌，然后你摸 1 张（南宫家碧湖之利，惠及同盟）。出处：docs/md/角色/齐云/04.元婴/南宫止.md', effects: [{ kind: 'targetDraw', n: 1 }, { kind: 'selfDraw', n: 1 }] },
  { id: 'zml_nangongzhi_yuping', name: '玉屏风', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（效仿芩老祖玉屏风，藏器于身）。出处：docs/md/角色/齐云/04.元婴/南宫止.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 姜炎（补 1：红莲业火 / 必杀十人 / 冲婴在即 → 4） */
  { id: 'zml_jiangyan_fenxin', name: '焚心', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点火属性伤害（红莲业火焚心，火系兼心神）。出处：docs/md/角色/齐云/03.金丹/姜炎.md', effects: [{ kind: 'targetDamage', n: 1, damageType: 'fire', attr: 'fire' }] },
  /* 楚夺（补 1：威压 / 盗婴 / 蝎尾夺 → 4；寒毒 zml_chuduo_handu 已在 talentdefs.zml.ts 定义，直接引用） */
  /* 楚神通（补 2：水墨山河阵 / 采补双修 → 4） */
  { id: 'zml_chushentong_moulve', name: '谋略', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：观看牌堆顶 3 张，取其中 1 张加入手牌（南楚幕后谋主，算无遗策）。出处：docs/md/角色/齐云/04.元婴/楚神通.md', effects: [{ kind: 'deckPeek', n: 3, then: 'pickOne' }] },
  { id: 'zml_chushentong_zhenfa', name: '阵法', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（以智谋与阵法见长，藏阵于身）。出处：docs/md/角色/齐云/04.元婴/楚神通.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 楚问（补 2：七星剑诀 / 唯杀可解 → 4） */
  { id: 'zml_chuwen_jianzhen', name: '七星剑阵', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（七星剑阵护体，剑意内敛）。出处：docs/md/角色/齐云/04.元婴/楚问.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_chuwen_zhanxing', name: '斩元星', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（七星剑诀·斩元星，剑出必斩）。出处：docs/md/角色/齐云/04.元婴/楚问.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 刑铣（补 2：执法 / 公平 → 4） */
  { id: 'zml_xingxi_zhifa2', name: '执法如山', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（执法峰座主，铁面无私）。出处：docs/md/角色/齐云/05.化神/刑铣.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_xingxi_guiju', name: '规矩', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（「照规矩办就是公平」，依规而行）。出处：docs/md/角色/齐云/05.化神/刑铣.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 天地峰座主（补 2：千丈法相 / 唯我独尊 → 4） */
  { id: 'zml_tiandifeng_yizhang', name: '一掌', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 2 点伤害（化神一掌，势不可挡）。出处：docs/md/角色/齐云/05.化神/天地峰座主.md', effects: [{ kind: 'costThenDamage', cost: 1, dmg: 2 }] },
  { id: 'zml_tiandifeng_weiyan', name: '天地峰威压', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（天上天下唯我独尊，威压一界）。出处：docs/md/角色/齐云/05.化神/天地峰座主.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 南宫木（补 2：青木为龙 / 追缉 → 4） */
  { id: 'zml_nangongmu_muda', name: '木之大道', kind: 'passive', timing: 'passive', desc: '你受到的雷属性伤害 -1（木之大道护持）。出处：docs/md/角色/齐云/05.化神/南宫木.md', effects: [{ kind: 'reduceDamage', types: ['thunder'], n: 1 }] },
  { id: 'zml_nangongmu_longzhu', name: '青木龙珠', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（青木为龙，龙珠吐威）。出处：docs/md/角色/齐云/05.化神/南宫木.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 南宫梦（补 2：共管 / 分庭抗礼 → 4） */
  { id: 'zml_nangongmeng_bihu', name: '碧湖', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（碧湖共管，泽被同门）。出处：docs/md/角色/齐云/04.元婴/南宫梦.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_nangongmeng_konggu', name: '空谷幽兰', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（空谷幽兰，静水深流）。出处：docs/md/角色/齐云/04.元婴/南宫梦.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 南宫嫣然（补 2：联姻 / 护身项链 → 4） */
  { id: 'zml_nangongyanran_weiliu', name: '伪六道', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（黑河峰底伪六道空间，困敌于阵）。出处：docs/md/角色/齐云/02.筑基/南宫嫣然.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_nangongyanran_hulian', name: '护身项链', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（护身项链护体，反噬未成）。出处：docs/md/角色/齐云/02.筑基/南宫嫣然.md', effects: [{ kind: 'selfDraw', n: 1 }] },
  /* 刑剑（补 2：执法 / 追缉 → 4） */
  { id: 'zml_xingjian_zhifa2', name: '执法峰', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（执法峰弟子，依律行事）。出处：docs/md/角色/齐云/03.金丹/刑剑.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_xingjian_xingjia', name: '刑家', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（邢家子弟，根基深厚）。出处：docs/md/角色/齐云/03.金丹/刑剑.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 姜焕（补 2：碧湖 / 碧湖宫 → 4） */
  { id: 'zml_jianghuan_gongzhu', name: '宫主', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（碧湖宫主，蓄养死士）。出处：docs/md/角色/齐云/04.元婴/姜焕.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_jianghuan_bihu2', name: '碧湖密藏', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（碧湖密藏，蓄宝于身）。出处：docs/md/角色/齐云/04.元婴/姜焕.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 冯甄（补 2：断劫雷 / 阴阳大道 → 4） */
  { id: 'zml_fengzhen_leijie', name: '断劫雷', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点雷属性伤害（断劫雷法，雷落如劫）。出处：docs/md/角色/齐云/04.元婴/冯甄.md', effects: [{ kind: 'targetDamage', n: 1, damageType: 'thunder', attr: 'lei' }] },
  { id: 'zml_fengzhen_mingyun', name: '命运大道', kind: 'passive', timing: 'passive', desc: '你始终可见牌堆顶 1 张（命运大道，前路可窥）。出处：docs/md/角色/齐云/04.元婴/冯甄.md', effects: [{ kind: 'peekTopDeck', n: 1 }] },
  /* 裴雯（补 2：水之润泽 / 连水盟 → 4） */
  { id: 'zml_peiwen_shuilian', name: '水炼', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（连水盟水炼术，蓄水于身）。出处：docs/md/角色/齐云/04.元婴/裴雯.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_peiwen_runze', name: '润泽', kind: 'trigger', timing: 'onDamaged', desc: '你受到伤害后，摸 1 张牌（水之润泽，柔能克刚）。出处：docs/md/角色/齐云/04.元婴/裴雯.md', effects: [{ kind: 'selfDraw', n: 1 }] },

  /* ==================== 白山 ==================== */
  /* 贾长庚（补 1：双星 / 转世轮回 / 双星 → 4） */
  { id: 'zml_jiachanggeng_guangzhu', name: '长庚光柱', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（长庚星光柱分化，一化二、二化四）。出处：docs/md/角色/白山/05.化神/贾长庚.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 法引（补 2：巡察使 / 大宏愿 → 4） */
  { id: 'zml_fayin_chanzhang', name: '八音禅杖', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（八音祛邪佛光仗，禅杖降魔）。出处：docs/md/角色/白山/03.金丹/法引.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_fayin_jiasha', name: '多宝袈裟', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（多宝眩光袈裟，诸宝护身）。出处：docs/md/角色/白山/03.金丹/法引.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 古熔（补 2：铸剑 / 器符城 → 4） */
  { id: 'zml_gurong_lianqi', name: '炼器', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（器符城炼器宗师，器成自得）。出处：docs/md/角色/白山/03.金丹/古熔.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_gurong_duanzao', name: '锻造', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（铸剑为兵，锋锐伤人）。出处：docs/md/角色/白山/03.金丹/古熔.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 柴艺（补 2：灵木 / 灵木盟主 → 4） */
  { id: 'zml_chaiyi_lingzhi', name: '灵植', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（灵木盟，草木自生）。出处：docs/md/角色/白山/03.金丹/柴艺.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_chaiyi_muling', name: '木灵', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：获得 1 点护盾（草木为障，木灵护体）。出处：docs/md/角色/白山/03.金丹/柴艺.md', effects: [{ kind: 'shield', n: 1 }] },
  /* 司空寿（补 2：摘星 / 摘星阁 → 4） */
  { id: 'zml_sikongshou_xingchen', name: '星辰', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（星辰本命，星力凝身）。出处：docs/md/角色/白山/03.金丹/司空寿.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_sikongshou_zhaixing2', name: '摘星', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：观看牌堆顶 3 张，取其中 1 张加入手牌（摘星阁主，手可摘星）。出处：docs/md/角色/白山/03.金丹/司空寿.md', effects: [{ kind: 'deckPeek', n: 3, then: 'pickOne' }] },
  /* 英伯（补 2：丹盟 / 丹盟客卿 → 4） */
  { id: 'zml_yingbo_qingtong', name: '青铜长戟', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（本命青铜长戟，戟出破阵）。出处：docs/md/角色/白山/03.金丹/英伯.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_yingbo_dandao', name: '丹道', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（丹盟客卿，丹药随身）。出处：docs/md/角色/白山/03.金丹/英伯.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 韩天青（补 2：丹盟 / 丹盟调度 → 4） */
  { id: 'zml_hantianqing_yuanyingdan', name: '元婴丹', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（丹盟元婴，丹药济人）。出处：docs/md/角色/白山/04.元婴/韩天青.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_hantianqing_dandao', name: '丹道', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（丹道精深，药到自成）。出处：docs/md/角色/白山/04.元婴/韩天青.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  /* 血刀（补 2：血影邪功 / 血影遁 → 4） */
  { id: 'zml_xuedao_xuedun', name: '血遁', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点鬼物属性伤害（血遁伤人，鬼物侵体）。出处：docs/md/角色/魔修/血刀.md', attr: 'guiwu', effects: [{ kind: 'targetDamage', n: 1, attr: 'guiwu' }] },
  { id: 'zml_xuedao_shiyan', name: '嗜血', kind: 'trigger', timing: 'onShaHit', desc: '你用【攻击】造成伤害后，摸 1 张牌（血影邪修，嗜血而强）。出处：docs/md/角色/魔修/血刀.md', effects: [{ kind: 'selfDraw', n: 1 }] },

  /* ==================== 御兽门 ==================== */
  /* 喀尔威明（补 2：光明大道 / 光明护体 → 4） */
  { id: 'zml_kaerweiming_kongque', name: '金冠孔雀', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（伴兽金冠孔雀，灵禽相随）。出处：docs/md/角色/御兽门/05.化神/喀尔威明.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_kaerweiming_yushou', name: '御兽', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（御兽门老祖，灵兽夺物）。出处：docs/md/角色/御兽门/05.化神/喀尔威明.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* 老种（补 2：摩云鬣 / 灵兽化形 → 4） */
  { id: 'zml_laozhong_shouxing', name: '兽形', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（摩云鬣化形，巨兽扑击）。出处：docs/md/角色/御兽门/04.元婴/老种.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_laozhong_linjia', name: '鳞甲', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（摩云鬣鳞甲，坚韧耐战）。出处：docs/md/角色/御兽门/04.元婴/老种.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 丰绪（补 2：跳亭 / 海门 → 4） */
  { id: 'zml_fengxu_jingyu', name: '鲸御', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（海门岛主，巨鲸载物）。出处：docs/md/角色/御兽门/04.元婴/丰绪.md', effects: [{ kind: 'targetHeal', n: 1 }] },
  { id: 'zml_fengxu_daozhu', name: '岛主', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（海门岛主，坐拥一岛之资）。出处：docs/md/角色/御兽门/04.元婴/丰绪.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 霍鹳（补 2：五虎拍门 / 守门 → 4） */
  { id: 'zml_huoguan_xunshou', name: '驯兽', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（霍家驯兽，五虎听令）。出处：docs/md/角色/御兽门/04.元婴/霍鹳.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_huoguan_huojia', name: '霍家', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（霍家家传，底蕴深厚）。出处：docs/md/角色/御兽门/04.元婴/霍鹳.md', effects: [{ kind: 'handLimit', n: 1 }] },

  /* ==================== 大周书院 ==================== */
  /* 姬信隆（补 2：剑锋 / 贪墨 → 4） */
  { id: 'zml_jixinlong_shuyuan', name: '书院', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（大周书院金丹，满腹经纶）。出处：docs/md/角色/大周书院/03.金丹/姬信隆.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_jixinlong_tanhe', name: '弹劾', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（书院清流，弹劾不法）。出处：docs/md/角色/大周书院/03.金丹/姬信隆.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* 闻心（补 2：金身 / 卧底 → 4） */
  { id: 'zml_wenxin_rufa', name: '儒法', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（大周书院，儒法护身）。出处：docs/md/角色/大周书院/03.金丹/闻心.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_wenxin_qianfu', name: '潜伏', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：观看一名其他角色的手牌，然后将其一张牌置于牌堆顶（曾卧底楚秦门，窥探虚实）。出处：docs/md/角色/大周书院/03.金丹/闻心.md', effects: [{ kind: 'peekHand', then: 'toDeckTop' }] },
  /* 姬兴德（补 2：雷力 / 北路军 → 4） */
  { id: 'zml_jixingde_junzhen', name: '军阵', kind: 'passive', timing: 'onDraw', desc: '摸牌阶段额外摸 1 张（北路军指挥，调度有方）。出处：docs/md/角色/大周书院/04.元婴/姬兴德.md', effects: [{ kind: 'extraDraw', n: 1 }] },
  { id: 'zml_jixingde_leiting', name: '雷庭', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点雷属性伤害（雷法加身，雷庭震怒）。出处：docs/md/角色/大周书院/04.元婴/姬兴德.md', effects: [{ kind: 'targetDamage', n: 1, damageType: 'thunder', attr: 'lei' }] },
  /* 姬羽梁（补 2：巡察使 / 巡察 → 4） */
  { id: 'zml_jiyuliang_ruyi', name: '儒仪', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（大周书院儒仪，端方自持）。出处：docs/md/角色/大周书院/04.元婴/姬羽梁.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_jiyuliang_xunshi', name: '巡察使', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（巡察使，一言定宗门生死）。出处：docs/md/角色/大周书院/04.元婴/姬羽梁.md', effects: [{ kind: 'targetDiscard', n: 1 }] },

  /* ==================== 青莲剑宗 ==================== */
  /* 聂疯子（补 1：剑锋 / 剑心通明 / 飞剑 → 4） */
  { id: 'zml_niefengzi_fengdian', name: '疯剑', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（剑疯合一，出剑不顾身）。出处：docs/md/角色/青莲剑宗/05.化神/聂疯子.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 李元瑛（补 2：剑宗 / 青莲 → 4） */
  { id: 'zml_liyuanying_qinglianjian', name: '青莲剑', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（青莲剑意，剑出如莲绽）。出处：docs/md/角色/青莲剑宗/05.化神/李元瑛.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  { id: 'zml_liyuanying_lianhua', name: '莲花', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（青莲剑宗化神，莲心不染）。出处：docs/md/角色/青莲剑宗/05.化神/李元瑛.md', effects: [{ kind: 'handLimit', n: 1 }] },

  /* ==================== 南林寺 ==================== */
  /* 枯荣（补 1：佛门 / 枯荣禅意 / 南林佛门 → 4） */
  { id: 'zml_kurong_puti', name: '菩提', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（枯荣禅意，菩提本无树）。出处：docs/md/角色/南林寺/05.化神/枯荣.md', effects: [{ kind: 'handLimit', n: 1 }] },
  /* 妙清（补 2：庵堂 / 庵堂 → 4） */
  { id: 'zml_miaoqing_fomen', name: '佛门', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（南林寺庵堂主持，佛法护持）。出处：docs/md/角色/南林寺/03.金丹/妙清.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_miaoqing_lianhua', name: '莲花', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名已受伤角色回复 1 点体力（庵堂主持，慈悲济人）。出处：docs/md/角色/南林寺/03.金丹/妙清.md', effects: [{ kind: 'targetHeal', n: 1 }] },

  /* ==================== 外海 ==================== */
  /* 龙越云（补 2：龙家血脉 / 龙家 → 4） */
  { id: 'zml_longyueyun_longwei', name: '龙威', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（外海龙家，血脉威压）。出处：docs/md/势力/008.外海/人物/03.金丹/龙越云.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_longyueyun_haiyu', name: '海御', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（外海龙家，驭海夺物）。出处：docs/md/势力/008.外海/人物/03.金丹/龙越云.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* 芩熙照（补 2：军务 / 军务 → 4） */
  { id: 'zml_qinxizhao_haidong', name: '海东', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（海东城芩家，军务在身）。出处：docs/md/势力/008.外海/人物/04.元婴/芩熙照.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_qinxizhao_junwu2', name: '军务', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（海东城军务，缉拿违纪）。出处：docs/md/势力/008.外海/人物/04.元婴/芩熙照.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  /* 芩老祖（补 1：白玉屏风 / 白玉 / 屏风 → 4） */
  { id: 'zml_qinlaozu_haidongcheng', name: '海东城', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（海东城化神老祖，坐拥一城）。出处：docs/md/势力/008.外海/人物/05.化神/芩老祖.md', effects: [{ kind: 'handLimit', n: 1 }] },

  /* ==================== 天理门 / 黑风谷 ==================== */
  /* 屠风（补 1：黑风 / 黑风 / 黑风谷主 → 4） */
  { id: 'zml_tufeng_yinfeng', name: '阴风', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（黑风谷阴风卷地，伤人无形）。出处：docs/md/角色/黑风谷/05.化神/屠风.md', effects: [{ kind: 'targetDamage', n: 1 }] },
  /* 天理门化神（补 2：崇理 / 天理 → 4） */
  { id: 'zml_tianli_shenpan', name: '审判', kind: 'active', timing: 'active', limit: 'perTurn', desc: '出牌阶段限一次：令一名其他角色弃置 1 张手牌（天理森严，审判有罪）。出处：docs/md/角色/天理门/05.化神/天理门化神.md', effects: [{ kind: 'targetDiscard', n: 1 }] },
  { id: 'zml_tianli_fali', name: '法理', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（崇理一脉，法理护身）。出处：docs/md/角色/天理门/05.化神/天理门化神.md', effects: [{ kind: 'handLimit', n: 1 }] },

  /* ==================== 蛮荒 ==================== */
  /* 醒狮（补 2：昏睡 / 嗅魂 → 4） */
  { id: 'zml_xingshi_yuanhou', name: '元犼', kind: 'passive', timing: 'passive', desc: '你的手牌上限 +1（化神元犼真身，躯如小山）。出处：docs/md/角色/蛮荒/05.化神/醒狮.md', effects: [{ kind: 'handLimit', n: 1 }] },
  { id: 'zml_xingshi_shihou', name: '狮吼', kind: 'active', timing: 'active', limit: 'perTurn', cost: { hand: 1 }, desc: '出牌阶段限一次：弃 1 张手牌，对一名其他角色造成 1 点伤害（狮吼震魂，向九星坊示威）。出处：docs/md/角色/蛮荒/05.化神/醒狮.md', effects: [{ kind: 'targetDamage', n: 1 }] },
];
