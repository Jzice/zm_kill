/* ==================== 掌门路原著角色池（48 人 · 每人 2~3 技能） ====================
 * 数据来源：docs/md/角色/（楚秦门 / 齐云 / 白山 / 御兽门 / 大周书院 / 青莲剑宗 / 南林寺 / 天理门）
 *           与 docs/md/势力/008.外海/人物/（外海 3 人）。
 * 门派、境界、本命、家族、事迹均按原文填写；技能名取自原著功法(B) / 技能(K) / 符箓(C) / 本命天赋 / 设定(L)。
 *
 * 技能密度：核心 12 人各 3 技能，其余各 2 技能（技能定义见 talentdefs.zml.ts）。
 * 本表是**唯一角色池**：经典模式与掌门路模式共用（经典模式不注入修真资源）。
 */
import type { Character, Realm, Taoism } from '../../core/types';
import { talentOf } from '../talentdefs';

export interface ZmlCharacter extends Character {
  /** 境界：练气 / 筑基 / 金丹 / 元婴 / 化神（局内上限炼虚） */
  realm: Realm;
  /** 本命之物（对他人隐藏，被【全知天眼】探查或阵亡后公开） */
  benming: string[];
  /** 家族（齐 / 秦 / 楚 / 展 / 熊 / 莫 / 南宫 / 龙 / 霍 …） */
  family?: string;
  /** docs 出处 */
  src: string;
}

/** 境界 → 体力上限基准（掌门 +1 由 setup 统一处理）
 *  后 4 阶为账号成长线专用，局内角色池当前未使用，仅保证类型完备。 */
export const REALM_HP: Record<Realm, number> = {
  lianqi: 3,
  zhuji: 3,
  jindan: 4,
  yuanying: 4,
  huashen: 5,
  lianxu: 6,
  heti: 6,
  dacheng: 7,
  dujie: 7,
};

/* 楚秦门（14） */
const CHUQIN: ZmlCharacter[] = [
  { id: 'zml_qixiu', name: '齐休', title: '第五代掌门', faction: 'chuqin', hp: 4, avatar: '🏯', realm: 'jindan', benming: ['赤尻马猴', '七窍玲珑心'], family: '齐', talents: [talentOf('zml_qixiu_mingjixin'), talentOf('zml_qixiu_jianrenxing')], src: 'docs/md/角色/楚秦门/03.金丹/齐休.md' },
  { id: 'zml_qizhuang', name: '齐妆', title: '白山剑魔', faction: 'chuqin', hp: 3, avatar: '🗡️', realm: 'zhuji', benming: ['鎏花幻月剑匣'], family: '齐', talents: [talentOf('zml_qizhuang_xiazhong'), talentOf('zml_qizhuang_guizhen')], src: 'docs/md/角色/楚秦门/03.金丹/齐妆.md' },
  { id: 'zml_chuwuying', name: '楚无影', title: '影剑', faction: 'chuqin', hp: 4, avatar: '🌑', realm: 'jindan', benming: ['黑白气团', '万影阁'], family: '楚', talents: [talentOf('zml_chuwuying_wanhuan'), talentOf('zml_chuwuying_yingshen')], src: 'docs/md/角色/楚秦门/03.金丹/楚无影.md' },
  { id: 'zml_qinchangfeng', name: '秦长风', title: '星剑', faction: 'chuqin', hp: 4, avatar: '⭐', realm: 'jindan', benming: ['参宿星'], family: '秦', talents: [talentOf('zml_qinchangfeng_xingdun'), talentOf('zml_qinchangfeng_xingzhi')], src: 'docs/md/角色/楚秦门/03.金丹/秦长风.md' },
  { id: 'zml_gutan', name: '顾叹', title: '楚秦谋主', faction: 'chuqin', hp: 4, avatar: '📜', realm: 'jindan', benming: [], talents: [talentOf('zml_gutan_hezong'), talentOf('zml_gutan_shezhan')], src: 'docs/md/角色/楚秦门/03.金丹/顾叹.md' },
  { id: 'zml_duoluosen', name: '多罗森', title: '三木同心', faction: 'chuqin', hp: 4, avatar: '🌳', realm: 'jindan', benming: ['三木同心'], talents: [talentOf('zml_duoluosen_sanmu'), talentOf('zml_duoluosen_rongxin')], src: 'docs/md/角色/楚秦门/03.金丹/多罗森.md' },
  { id: 'zml_shanuo', name: '沙诺', title: '白沙帮主', faction: 'chuqin', hp: 4, avatar: '🔔', realm: 'jindan', benming: ['青铜古钟'], talents: [talentOf('zml_shanuo_guzhong'), talentOf('zml_shanuo_sanhun')], src: 'docs/md/角色/楚秦门/03.金丹/沙诺.md' },
  { id: 'zml_mingzhen', name: '明真', title: '针魔', faction: 'chuqin', hp: 4, avatar: '🌿', realm: 'jindan', benming: ['檀香针囊'], family: '明', talents: [talentOf('zml_mingzhen_zhennang'), talentOf('zml_mingzhen_yanmei')], src: 'docs/md/角色/楚秦门/03.金丹/明真.md' },
  { id: 'zml_mojianxin', name: '莫剑心', title: '以身饲剑', faction: 'chuqin', hp: 3, avatar: '❄️', realm: 'zhuji', benming: ['幻月灵剑', '冰泉水', '三相精金'], family: '莫', talents: [talentOf('zml_mojianxin_chengjian'), talentOf('zml_mojianxin_sijian')], src: 'docs/md/角色/楚秦门/02.筑基/莫剑心.md' },
  { id: 'zml_qinweiyu', name: '秦唯喻', title: '外门逆袭', faction: 'chuqin', hp: 3, avatar: '🍀', realm: 'zhuji', benming: ['乌茎泽兰'], family: '秦', talents: [talentOf('zml_qinweiyu_dumu'), talentOf('zml_qinweiyu_wujing')], src: 'docs/md/角色/楚秦门/02.筑基/秦唯喻.md' },
  { id: 'zml_zhangshishi', name: '张世石', title: '掌门旧部', faction: 'chuqin', hp: 3, avatar: '🧹', realm: 'lianqi', benming: ['废本命'], talents: [talentOf('zml_zhangshishi_zhongpu'), talentOf('zml_zhangshishi_qinmian')], src: 'docs/md/角色/楚秦门/01.练气/张世石.md' },
  { id: 'zml_zhanchou', name: '展仇', title: '展元遗腹子', faction: 'chuqin', hp: 3, avatar: '💧', realm: 'lianqi', benming: ['瓶中水'], family: '展', talents: [talentOf('zml_zhanchou_fuchou'), talentOf('zml_zhanchou_mienmen')], src: 'docs/md/角色/楚秦门/01.练气/展仇.md' },
  { id: 'zml_xiongdai', name: '熊黛儿', title: '北烈山熊氏', faction: 'chuqin', hp: 3, avatar: '🐻', realm: 'lianqi', benming: [], family: '熊', talents: [talentOf('zml_xiongdai_beilie'), talentOf('zml_xiongdai_xiongshi')], src: 'docs/md/角色/楚秦门/01.练气/熊黛儿.md' },
  { id: 'zml_heyu', name: '何玉', title: '神傀化身', faction: 'chuqin', hp: 4, avatar: '🪆', realm: 'jindan', benming: ['水土双本命'], talents: [talentOf('zml_heyu_bingleng'), talentOf('zml_heyu_shenkui')], src: 'docs/md/角色/散修/03.金丹/何玉.md' },
  { id: 'zml_xiongshisi', name: '熊十四', title: '熊氏首位金丹', faction: 'chuqin', hp: 4, avatar: '🐻', realm: 'jindan', benming: [], family: '熊', talents: [talentOf('zml_xiongshisi_beilie'), talentOf('zml_xiongshisi_shouwei')], src: 'docs/md/角色/楚秦门/03.金丹/熊十四.md' },
  { id: 'zml_zhaoyao', name: '赵瑶', title: '醒狮魔修', faction: 'chuqin', hp: 3, avatar: '🔴', realm: 'zhuji', benming: [], family: '秦', talents: [talentOf('zml_zhaoyao_yisha'), talentOf('zml_zhaoyao_rumo')], src: 'docs/md/角色/楚秦门/02.筑基/赵瑶.md' },
  { id: 'zml_zhanjianfeng', name: '展剑锋', title: '楚秦军阵总理', faction: 'chuqin', hp: 3, avatar: '⚡', realm: 'zhuji', benming: ['霹雳追光剑'], family: '展', talents: [talentOf('zml_zhanjianfeng_yizhi'), talentOf('zml_zhanjianfeng_rujie')], src: 'docs/md/角色/楚秦门/02.筑基/展剑锋.md' },
  { id: 'zml_baixiaosheng', name: '白晓生', title: '百晓生', faction: 'chuqin', hp: 3, avatar: '📖', realm: 'zhuji', benming: [], family: '白', talents: [talentOf('zml_baixiaosheng_fengwu'), talentOf('zml_baixiaosheng_chuangong')], src: 'docs/md/角色/楚秦门/02.筑基/白晓生.md' },
];

/* 齐云（9 → 16：重做 5 + 新增 6，另保留南宫止/姜焕/冯甄/裴雯） */
const QIYUN: ZmlCharacter[] = [
  { id: 'zml_chuhongshang', name: '楚红裳', title: '南楚老祖', faction: 'qiyun', hp: 4, avatar: '🔥', realm: 'yuanying', benming: ['九天不灭炼火霓裳'], family: '楚', talents: [talentOf('zml_chuhongshang_bumie'), talentOf('zml_chuhongshang_tianhuo')], src: 'docs/md/角色/齐云/04.元婴/楚红裳.md' },
  { id: 'zml_chuzhen', name: '楚震', title: '楚家老祖', faction: 'qiyun', hp: 4, avatar: '⛰️', realm: 'yuanying', benming: [], family: '楚', talents: [talentOf('zml_chuzhen_laozu'), talentOf('zml_chuzhen_kaizong')], src: 'docs/md/角色/齐云/04.元婴/楚震.md' },
  { id: 'zml_nangongzhi', name: '南宫止', title: '南宫元婴', faction: 'qiyun', hp: 4, avatar: '🏛️', realm: 'yuanying', benming: [], family: '南宫', talents: [talentOf('zml_nangongzhi_chilian'), talentOf('zml_nangongzhi_jiazhu')], src: 'docs/md/角色/齐云/04.元婴/南宫止.md' },
  { id: 'zml_jiangyan', name: '姜炎', title: '必杀十人', faction: 'qiyun', hp: 4, avatar: '🎯', realm: 'jindan', benming: [], family: '姜', talents: [talentOf('zml_jiangyan_honglian'), talentOf('zml_jiangyan_bisha')], src: 'docs/md/角色/齐云/03.金丹/姜炎.md' },
  { id: 'zml_chuduo', name: '楚夺', title: '南楚长老', faction: 'qiyun', hp: 4, avatar: '🦂', realm: 'jindan', benming: [], family: '楚', talents: [talentOf('zml_chuduo_weiya'), talentOf('zml_chuduo_daoying')], src: 'docs/md/角色/齐云/03.金丹/楚夺.md' },
  { id: 'zml_chushentong', name: '楚神通', title: '南楚谋主', faction: 'qiyun', hp: 4, avatar: '🖌️', realm: 'yuanying', benming: [], family: '楚', talents: [talentOf('zml_chushentong_shuimo'), talentOf('zml_chushentong_caibu')], src: 'docs/md/角色/齐云/04.元婴/楚神通.md' },
  { id: 'zml_chuwen', name: '楚问', title: '海楚门主', faction: 'qiyun', hp: 4, avatar: '🍶', realm: 'yuanying', benming: ['七星剑诀'], family: '楚', talents: [talentOf('zml_chuwen_qixing'), talentOf('zml_chuwen_weisha')], src: 'docs/md/角色/齐云/04.元婴/楚问.md' },
  { id: 'zml_xingxi', name: '刑铣', title: '执法峰座主', faction: 'qiyun', hp: 5, avatar: '⚖️', realm: 'huashen', benming: [], talents: [talentOf('zml_xingxi_zhifa'), talentOf('zml_xingxi_gongping')], src: 'docs/md/角色/齐云/05.化神/刑铣.md' },
  { id: 'zml_tiandifeng', name: '天地峰座主', title: '天上天下唯我独尊', faction: 'qiyun', hp: 5, avatar: '🌌', realm: 'huashen', benming: [], talents: [talentOf('zml_tiandifeng_qianzhang'), talentOf('zml_tiandifeng_weiwo')], src: 'docs/md/角色/齐云/05.化神/天地峰座主.md' },
  { id: 'zml_nangongmu', name: '南宫木', title: '南宫家老祖', faction: 'qiyun', hp: 5, avatar: '🌳', realm: 'huashen', benming: ['木之大道'], family: '南宫', talents: [talentOf('zml_nangongmu_qingmu'), talentOf('zml_nangongmu_zhuiji')], src: 'docs/md/角色/齐云/05.化神/南宫木.md' },
  { id: 'zml_nangongmeng', name: '南宫梦', title: '碧湖共管', faction: 'qiyun', hp: 4, avatar: '🪷', realm: 'yuanying', benming: [], family: '南宫', talents: [talentOf('zml_nangongmeng_gongguan'), talentOf('zml_nangongmeng_fenting')], src: 'docs 无独立档案：据 势力/本届势力.md、角色/齐云/04.元婴/{陆云,陆崆,姜焕,南宫止}.md、03.金丹/楚神苍.md、02.筑基/南宫湘.md、事件/M-03 碧湖密藏崩塌事件.md 多处提及整理' },
  { id: 'zml_nangongyanran', name: '南宫嫣然', title: '南宫联姻', faction: 'qiyun', hp: 3, avatar: '💍', realm: 'zhuji', benming: [], family: '南宫', talents: [talentOf('zml_nangongyanran_lianyin'), talentOf('zml_nangongyanran_hushen')], src: 'docs/md/角色/齐云/02.筑基/南宫嫣然.md' },
  { id: 'zml_xingjian', name: '刑剑', title: '执法峰', faction: 'qiyun', hp: 4, avatar: '⚖️', realm: 'jindan', benming: [], talents: [talentOf('zml_xingjian_zhifa'), talentOf('zml_xingjian_zhuiji')], src: 'docs/md/角色/齐云/03.金丹/刑剑.md' },
  { id: 'zml_jianghuan', name: '姜焕', title: '碧湖宫主', faction: 'qiyun', hp: 4, avatar: '💠', realm: 'yuanying', benming: [], talents: [talentOf('zml_jianghuan_bihu'), talentOf('zml_jianghuan_bihugong')], src: 'docs/md/角色/齐云/04.元婴/姜焕.md' },
  { id: 'zml_fengzhen', name: '冯甄', title: '断劫雷', faction: 'qiyun', hp: 4, avatar: '☯️', realm: 'yuanying', benming: ['命运大道', '阴阳大道'], talents: [talentOf('zml_fengzhen_duanjie'), talentOf('zml_fengzhen_yinyang')], src: 'docs/md/角色/齐云/04.元婴/冯甄.md' },
  { id: 'zml_peiwen', name: '裴雯', title: '连水盟', faction: 'qiyun', hp: 4, avatar: '🌊', realm: 'yuanying', benming: ['水之润泽'], talents: [talentOf('zml_peiwen_shuirun'), talentOf('zml_peiwen_lianmeng')], src: 'docs/md/角色/齐云/04.元婴/裴雯.md' },
];

/* 白山（7） */
const BAISHAN: ZmlCharacter[] = [
  { id: 'zml_jiachanggeng', name: '贾长庚', title: '白山之主', faction: 'baishan', hp: 5, avatar: '🌟', realm: 'huashen', benming: ['长庚星', '大火星'], talents: [talentOf('zml_jiachanggeng_shuangxing'), talentOf('zml_jiachanggeng_zhuanshi')], src: 'docs/md/角色/白山/05.化神/贾长庚.md' },
  { id: 'zml_fayin', name: '法引', title: '天引寺主持', faction: 'baishan', hp: 4, avatar: '🪷', realm: 'jindan', benming: [], talents: [talentOf('zml_fayin_xuncha'), talentOf('zml_fayin_hongyuan')], src: 'docs/md/角色/白山/03.金丹/法引.md' },
  { id: 'zml_gurong', name: '古熔', title: '器符城主', faction: 'baishan', hp: 4, avatar: '🔨', realm: 'jindan', benming: [], talents: [talentOf('zml_gurong_zhujian'), talentOf('zml_gurong_qifucheng')], src: 'docs/md/角色/白山/03.金丹/古熔.md' },
  { id: 'zml_chaiyi', name: '柴艺', title: '灵木盟', faction: 'baishan', hp: 4, avatar: '🌲', realm: 'jindan', benming: [], talents: [talentOf('zml_chaiyi_lingmu'), talentOf('zml_chaiyi_lingmu2')], src: 'docs/md/角色/白山/03.金丹/柴艺.md' },
  { id: 'zml_sikongshou', name: '司空寿', title: '摘星阁主', faction: 'baishan', hp: 4, avatar: '✨', realm: 'jindan', benming: ['星辰'], talents: [talentOf('zml_sikongshou_zhaixing'), talentOf('zml_sikongshou_zhaixingge')], src: 'docs/md/角色/白山/03.金丹/司空寿.md' },
  { id: 'zml_yingbo', name: '英伯', title: '丹盟客卿', faction: 'baishan', hp: 4, avatar: '🔱', realm: 'jindan', benming: [], talents: [talentOf('zml_yingbo_danmeng'), talentOf('zml_yingbo_danmeng2')], src: 'docs/md/角色/白山/03.金丹/英伯.md' },
  { id: 'zml_hantianqing', name: '韩天青', title: '丹盟元婴', faction: 'baishan', hp: 4, avatar: '💊', realm: 'yuanying', benming: [], talents: [talentOf('zml_hantianqing_danmeng'), talentOf('zml_hantianqing_dan2')], src: 'docs/md/角色/白山/04.元婴/韩天青.md' },
  { id: 'zml_xuedao', name: '血刀', title: '血影邪修', faction: 'baishan', hp: 4, avatar: '🩸', realm: 'jindan', benming: ['血影邪功'], talents: [talentOf('zml_xuedao_xueying'), talentOf('zml_xuedao_xueying2')], src: 'docs/md/角色/魔修/血刀.md' },
];

/* 御兽门（5） */
const YUSHOU: ZmlCharacter[] = [
  { id: 'zml_yuhe', name: '玉鹤', title: '双大道', faction: 'yushou', hp: 4, avatar: '🕊️', realm: 'yuanying', benming: ['九头玉种', '无形鹤'], talents: [talentOf('zml_yuhe_qingfeng'), talentOf('zml_yuhe_qingxin')], src: 'docs/md/角色/御兽门/04.元婴/玉鹤.md' },
  { id: 'zml_kaerweiming', name: '喀尔威明', title: '御兽老祖', faction: 'yushou', hp: 5, avatar: '☀️', realm: 'huashen', benming: ['光明大道'], talents: [talentOf('zml_kaerweiming_guangming'), talentOf('zml_kaerweiming_ming2')], src: 'docs/md/角色/御兽门/05.化神/喀尔威明.md' },
  { id: 'zml_laozhong', name: '老种', title: '摩云鬣', faction: 'yushou', hp: 4, avatar: '🦁', realm: 'yuanying', benming: ['摩云鬣'], talents: [talentOf('zml_laozhong_moyun'), talentOf('zml_laozhong_ling')], src: 'docs/md/角色/御兽门/04.元婴/老种.md' },
  { id: 'zml_fengxu', name: '丰绪', title: '海门岛主', faction: 'yushou', hp: 4, avatar: '🐋', realm: 'yuanying', benming: [], talents: [talentOf('zml_fengxu_tiaoting'), talentOf('zml_fengxu_haimenting')], src: 'docs/md/角色/御兽门/04.元婴/丰绪.md' },
  { id: 'zml_huoguan', name: '霍鹳', title: '五虎拍门', faction: 'yushou', hp: 4, avatar: '🦅', realm: 'yuanying', benming: [], family: '霍', talents: [talentOf('zml_huoguan_wuhu'), talentOf('zml_huoguan_shoumen')], src: 'docs/md/角色/御兽门/04.元婴/霍鹳.md' },
];

/* 大周书院（4） */
const DAZHOU: ZmlCharacter[] = [
  { id: 'zml_jixinlong', name: '姬信隆', title: '书院金丹', faction: 'dazhoushuyuan', hp: 4, avatar: '🎋', realm: 'jindan', benming: [], talents: [talentOf('zml_jixinlong_jianfeng'), talentOf('zml_jixinlong_tan')], src: 'docs/md/角色/大周书院/03.金丹/姬信隆.md' },
  { id: 'zml_wenxin', name: '闻心', title: '卧底金丹', faction: 'dazhoushuyuan', hp: 4, avatar: '👁️', realm: 'jindan', benming: [], talents: [talentOf('zml_wenxin_jinshen'), talentOf('zml_wenxin_wodi')], src: 'docs/md/角色/大周书院/03.金丹/闻心.md' },
  { id: 'zml_jixingde', name: '姬兴德', title: '北路军指挥', faction: 'dazhoushuyuan', hp: 4, avatar: '⚡', realm: 'yuanying', benming: [], talents: [talentOf('zml_jixingde_leili'), talentOf('zml_jixingde_beilu')], src: 'docs/md/角色/大周书院/04.元婴/姬兴德.md' },
  { id: 'zml_jiyuliang', name: '姬羽梁', title: '巡察使', faction: 'dazhoushuyuan', hp: 4, avatar: '🪶', realm: 'yuanying', benming: [], talents: [talentOf('zml_jiyuliang_xuncha'), talentOf('zml_jiyuliang_xun2')], src: 'docs/md/角色/大周书院/04.元婴/姬羽梁.md' },
];

/* 青莲剑宗（2） */
const QINGLIAN: ZmlCharacter[] = [
  { id: 'zml_niefengzi', name: '聂疯子', title: '剑宗化神', faction: 'qinglian', hp: 5, avatar: '🌀', realm: 'huashen', benming: ['飞剑'], talents: [talentOf('zml_niefengzi_jianfeng'), talentOf('zml_niefengzi_jianxin'), talentOf('zml_niefengzi_fei')], src: 'docs/md/角色/青莲剑宗/05.化神/聂疯子.md' },
  { id: 'zml_liyuanying', name: '李元瑛', title: '青莲化神', faction: 'qinglian', hp: 5, avatar: '🪷', realm: 'huashen', benming: [], talents: [talentOf('zml_liyuanying_jianzong'), talentOf('zml_liyuanying_lian')], src: 'docs/md/角色/青莲剑宗/05.化神/李元瑛.md' },
];

/* 南林寺（2） */
const NANLIN: ZmlCharacter[] = [
  { id: 'zml_kurong', name: '枯荣', title: '南林化神', faction: 'nanlin', hp: 5, avatar: '🛕', realm: 'huashen', benming: [], talents: [talentOf('zml_kurong_fomen'), talentOf('zml_kurong_chan'), talentOf('zml_kurong_fomen2')], src: 'docs/md/角色/南林寺/05.化神/枯荣.md' },
  { id: 'zml_miaoqing', name: '妙清', title: '庵堂主持', faction: 'nanlin', hp: 4, avatar: '📿', realm: 'jindan', benming: [], talents: [talentOf('zml_miaoqing_antang'), talentOf('zml_miaoqing_antang2')], src: 'docs/md/角色/南林寺/03.金丹/妙清.md' },
];

/* 外海（3） */
const WAIHAI: ZmlCharacter[] = [
  { id: 'zml_longyueyun', name: '龙越云', title: '外海龙家', faction: 'waihai', hp: 4, avatar: '🐉', realm: 'jindan', benming: [], family: '龙', talents: [talentOf('zml_longyueyun_longjia'), talentOf('zml_longyueyun_long2')], src: 'docs/md/势力/008.外海/人物/03.金丹/龙越云.md' },
  { id: 'zml_qinxizhao', name: '芩熙照', title: '海东军务', faction: 'waihai', hp: 4, avatar: '🗺️', realm: 'yuanying', benming: [], talents: [talentOf('zml_qinxizhao_junwu'), talentOf('zml_qinxizhao_jun2')], src: 'docs/md/势力/008.外海/人物/04.元婴/芩熙照.md' },
  { id: 'zml_qinlaozu', name: '芩老祖', title: '白玉屏风', faction: 'waihai', hp: 5, avatar: '🪭', realm: 'huashen', benming: ['白玉屏风'], talents: [talentOf('zml_qinlaozu_pingfeng'), talentOf('zml_qinlaozu_pingfeng2'), talentOf('zml_qinlaozu_baiyu')], src: 'docs/md/势力/008.外海/人物/05.化神/芩老祖.md' },
];

/* 天理门（2） */
const TIANLI: ZmlCharacter[] = [
  { id: 'zml_tufeng', name: '屠风', title: '黑风谷祖师', faction: 'tianli', hp: 5, avatar: '🌪️', realm: 'huashen', benming: [], talents: [talentOf('zml_tufeng_heifeng'), talentOf('zml_tufeng_heifeng2'), talentOf('zml_tufeng_heigu')], src: 'docs/md/角色/黑风谷/05.化神/屠风.md' },
  { id: 'zml_tianlihuashen', name: '天理门化神', title: '崇理一脉', faction: 'tianli', hp: 5, avatar: '☯️', realm: 'huashen', benming: [], talents: [talentOf('zml_tianli_chongli'), talentOf('zml_tianli_chongli2')], src: 'docs/md/角色/天理门/05.化神/天理门化神.md' },
];

/* 蛮荒（1 · 第十势力） */
const MANHUANG: ZmlCharacter[] = [
  { id: 'zml_xingshi', name: '醒狮', title: '醒狮谷之王', faction: 'manhuang', hp: 6, avatar: '🦁', realm: 'huashen', benming: ['元犼真身'], talents: [talentOf('zml_xingshi_hunshui'), talentOf('zml_xingshi_xiuhun')], src: 'docs/md/角色/蛮荒/05.化神/醒狮.md' },
];

/** 原始角色定义（未带道统 / 灵兽标签；对外请用 ZML_CHARACTERS） */
const RAW_CHARACTERS: ZmlCharacter[] = [
  ...CHUQIN,
  ...QIYUN,
  ...BAISHAN,
  ...YUSHOU,
  ...DAZHOU,
  ...QINGLIAN,
  ...NANLIN,
  ...WAIHAI,
  ...TIANLI,
  ...MANHUANG,
];

/* ---------------- 道统（原著设定：道 / 佛 / 儒 / 魔 / 鬼 / 外道） ----------------
 * 门派倾向不等于道统：楚秦门以道门功法为宗，佛门（南林寺 / 天引寺 / 何玉）为佛，
 * 大周书院崇理为儒，邪修（赵瑶 / 血刀）为魔，鬼修（沙诺 / 姜炎）为鬼，
 * 黑风谷与蛮荒醒狮不循六道，为外道。
 * 映射集中在本表，避免 61 条角色定义逐条散落（属性结算只查这张表）。
 */
const TAOISM_MAP: Record<string, Taoism> = {
  /* 楚秦门 —— 道 15 / 佛 1 / 魔 1 / 鬼 1 */
  zml_qixiu: 'dao',
  zml_qizhuang: 'dao',
  zml_chuwuying: 'dao',
  zml_qinchangfeng: 'dao',
  zml_gutan: 'dao',
  zml_duoluosen: 'dao',
  zml_mingzhen: 'dao',
  zml_mojianxin: 'dao',
  zml_qinweiyu: 'dao',
  zml_zhangshishi: 'dao',
  zml_zhanchou: 'dao',
  zml_xiongdai: 'dao',
  zml_xiongshisi: 'dao',
  zml_zhanjianfeng: 'dao',
  zml_baixiaosheng: 'dao',
  zml_heyu: 'fo', // 白山密宗神傀化身，佛门手段
  zml_zhaoyao: 'mo', // 醒狮魔修，魔化之躯（化名小红）
  zml_shanuo: 'gui', // 逃入魔井、与鬼修万骨共生

  /* 齐云 —— 道 15 / 鬼 1 */
  zml_chuhongshang: 'dao',
  zml_chuzhen: 'dao',
  zml_nangongzhi: 'dao',
  zml_chuduo: 'dao',
  zml_chushentong: 'dao', // 南楚谋主，道门正统（非外道）
  zml_chuwen: 'dao',
  zml_xingxi: 'dao',
  zml_tiandifeng: 'dao',
  zml_nangongmu: 'dao',
  zml_nangongmeng: 'dao',
  zml_nangongyanran: 'dao',
  zml_xingjian: 'dao',
  zml_jianghuan: 'dao',
  zml_fengzhen: 'dao',
  zml_peiwen: 'dao',
  zml_jiangyan: 'gui', // 金丹鬼修，红莲业火焚心

  /* 白山 —— 道 6 / 佛 1 / 魔 1 */
  zml_jiachanggeng: 'dao',
  zml_gurong: 'dao',
  zml_chaiyi: 'dao',
  zml_sikongshou: 'dao',
  zml_yingbo: 'dao',
  zml_hantianqing: 'dao',
  zml_fayin: 'fo', // 天引寺主持
  zml_xuedao: 'mo', // 血影邪修

  /* 御兽门 —— 道 5 */
  zml_yuhe: 'dao',
  zml_kaerweiming: 'dao',
  zml_laozhong: 'dao',
  zml_fengxu: 'dao',
  zml_huoguan: 'dao',

  /* 大周书院 —— 儒 4 */
  zml_jixinlong: 'ru',
  zml_wenxin: 'ru',
  zml_jixingde: 'ru',
  zml_jiyuliang: 'ru',

  /* 青莲剑宗 —— 道 2 */
  zml_niefengzi: 'dao',
  zml_liyuanying: 'dao',

  /* 南林寺 —— 佛 2 */
  zml_kurong: 'fo',
  zml_miaoqing: 'fo',

  /* 外海 —— 道 3 */
  zml_longyueyun: 'dao',
  zml_qinxizhao: 'dao',
  zml_qinlaozu: 'dao',

  /* 天理门 —— 外道 1 / 儒 1 */
  zml_tufeng: 'waidao', // 黑风谷祖师，不循六道
  zml_tianlihuashen: 'ru', // 崇理一脉，儒门正宗

  /* 蛮荒 —— 外道 1 */
  zml_xingshi: 'waidao', // 醒狮谷之王，非人类宗门
};

/** 灵兽之躯（兽属性攻击的判定对象；可与道统并存） */
const LINGSHOU_IDS: string[] = [
  'zml_laozhong', // 摩云鬣化形
  'zml_yuhe', // 无形鹤伴兽
  'zml_xingshi', // 元犼真身
  'zml_huoguan', // 五虎拍门
  'zml_kaerweiming', // 御兽门光明大道化神
];

/**
 * 天赋池扩展：为每名角色补充 1~2 门天赋，使天赋池 >3。
 * - 一部分取自 talentdefs.zml.ts 中「已定义但未接入角色池」的既有天赋；
 * - 另一部分为 talentdefs.pool.ts 新增的原著向天赋。
 * 最终天赋池 = 原定义 talents（2~3）∪ 本表，开局再从中随机激活 2~3 门。
 */
const POOL_EXTRA: Record<string, string[]> = {
  /* 楚秦门 */
  zml_qixiu: ['zml_qixiu_buzai', 'zml_qixiu_qiaoxin'],
  zml_qizhuang: ['zml_qizhuang_fengyun', 'zml_qizhuang_hunyuan'],
  zml_chuwuying: ['zml_chuwuying_wanying', 'zml_chuwuying_yingxi'],
  zml_qinchangfeng: ['zml_qinchangfeng_canxiu', 'zml_qinchangfeng_xingxue'],
  zml_gutan: ['zml_gutan_mouzhu', 'zml_gutan_zhinang'],
  zml_duoluosen: ['zml_duoluosen_liandan', 'zml_duoluosen_muling'],
  zml_shanuo: ['zml_shanuo_baisha', 'zml_shanuo_guiqi'],
  zml_mingzhen: ['zml_mingzhen_qingxin', 'zml_mingzhen_jinzhen'],
  zml_mojianxin: ['zml_mojianxin_bingyuan', 'zml_mojianxin_yueying'],
  zml_qinweiyu: ['zml_qinweiyu_tongcan', 'zml_qinweiyu_nixi'],
  zml_zhangshishi: ['zml_zhangshishi_cangjing', 'zml_zhangshishi_zhuji'],
  zml_zhanchou: ['zml_zhanchou_pingzhong', 'zml_zhanchou_yigu'],
  zml_xiongdai: ['zml_xiongdai_zengdan', 'zml_xiongdai_lingzhi'],
  zml_heyu: ['zml_heyu_shuitu', 'zml_heyu_tongcan'],
  zml_xiongshisi: ['zml_xiongshisi_huti', 'zml_xiongshisi_fuyong'],
  zml_zhaoyao: ['zml_zhaoyao_guifan', 'zml_zhaoyao_xiaohong'],
  zml_zhanjianfeng: ['zml_zhanjianfeng_junzhen', 'zml_zhanjianfeng_leiyin'],
  zml_baixiaosheng: ['zml_baixiaosheng_cangjingge', 'zml_baixiaosheng_menzhu'],
  /* 齐云 */
  zml_chuhongshang: ['zml_chuhongshang_huoni', 'zml_chuhongshang_huoyu'],
  zml_chuzhen: ['zml_chuzhen_huchi', 'zml_chuzhen_weiyan'],
  zml_nangongzhi: ['zml_nangongzhi_bihu', 'zml_nangongzhi_yuping'],
  zml_jiangyan: ['zml_jiangyan_chongying', 'zml_jiangyan_fenxin'],
  zml_chuduo: ['zml_chuduo_duo', 'zml_chuduo_handu'],
  zml_chushentong: ['zml_chushentong_moulve', 'zml_chushentong_zhenfa'],
  zml_chuwen: ['zml_chuwen_jianzhen', 'zml_chuwen_zhanxing'],
  zml_xingxi: ['zml_xingxi_zhifa2', 'zml_xingxi_guiju'],
  zml_tiandifeng: ['zml_tiandifeng_shibudang', 'zml_tiandifeng_weiyan'],
  zml_nangongmu: ['zml_nangongmu_muda', 'zml_nangongmu_longzhu'],
  zml_nangongmeng: ['zml_nangongmeng_bihu', 'zml_nangongmeng_konggu'],
  zml_nangongyanran: ['zml_nangongyanran_weiliu', 'zml_nangongyanran_hulian'],
  zml_xingjian: ['zml_xingjian_zhifa2', 'zml_xingjian_xingjia'],
  zml_jianghuan: ['zml_jianghuan_gongzhu', 'zml_jianghuan_bihu2'],
  zml_fengzhen: ['zml_fengzhen_leijie', 'zml_fengzhen_mingyun'],
  zml_peiwen: ['zml_peiwen_shuilian', 'zml_peiwen_runze'],
  /* 白山 */
  zml_jiachanggeng: ['zml_jiachanggeng_shuang', 'zml_jiachanggeng_guangzhu'],
  zml_fayin: ['zml_fayin_chanzhang', 'zml_fayin_jiasha'],
  zml_gurong: ['zml_gurong_lianqi', 'zml_gurong_duanzao'],
  zml_chaiyi: ['zml_chaiyi_lingzhi', 'zml_chaiyi_muling'],
  zml_sikongshou: ['zml_sikongshou_xingchen', 'zml_sikongshou_zhaixing2'],
  zml_yingbo: ['zml_yingbo_qingtong', 'zml_yingbo_dandao'],
  zml_hantianqing: ['zml_hantianqing_yuanyingdan', 'zml_hantianqing_dandao'],
  zml_xuedao: ['zml_xuedao_xuedun', 'zml_xuedao_shiyan'],
  /* 御兽门 */
  zml_yuhe: ['zml_yuhe_wuxing', 'zml_yuhe_dao'],
  zml_kaerweiming: ['zml_kaerweiming_kongque', 'zml_kaerweiming_yushou'],
  zml_laozhong: ['zml_laozhong_shouxing', 'zml_laozhong_linjia'],
  zml_fengxu: ['zml_fengxu_jingyu', 'zml_fengxu_daozhu'],
  zml_huoguan: ['zml_huoguan_xunshou', 'zml_huoguan_huojia'],
  /* 大周书院 */
  zml_jixinlong: ['zml_jixinlong_shuyuan', 'zml_jixinlong_tanhe'],
  zml_wenxin: ['zml_wenxin_rufa', 'zml_wenxin_qianfu'],
  zml_jixingde: ['zml_jixingde_junzhen', 'zml_jixingde_leiting'],
  zml_jiyuliang: ['zml_jiyuliang_ruyi', 'zml_jiyuliang_xunshi'],
  /* 青莲剑宗 */
  zml_niefengzi: ['zml_niefengzi_fengdian'],
  zml_liyuanying: ['zml_liyuanying_qinglianjian', 'zml_liyuanying_lianhua'],
  /* 南林寺 */
  zml_kurong: ['zml_kurong_puti'],
  zml_miaoqing: ['zml_miaoqing_fomen', 'zml_miaoqing_lianhua'],
  /* 外海 */
  zml_longyueyun: ['zml_longyueyun_longwei', 'zml_longyueyun_haiyu'],
  zml_qinxizhao: ['zml_qinxizhao_haidong', 'zml_qinxizhao_junwu2'],
  zml_qinlaozu: ['zml_qinlaozu_haidongcheng'],
  /* 天理门 / 黑风谷 */
  zml_tufeng: ['zml_tufeng_yinfeng'],
  zml_tianlihuashen: ['zml_tianli_shenpan', 'zml_tianli_fali'],
  /* 蛮荒 */
  zml_xingshi: ['zml_xingshi_yuanhou', 'zml_xingshi_shihou'],
};

/** 角色池：在原始定义之上换入道统 / 灵兽标签，并扩充天赋池（声明式，不修改源数组） */
export const ZML_CHARACTERS: ZmlCharacter[] = RAW_CHARACTERS.map((c) => {
  const extra = (POOL_EXTRA[c.id] || []).map((id) => talentOf(id));
  return {
    ...c,
    taoism: TAOISM_MAP[c.id] ?? c.taoism,
    lingshou: LINGSHOU_IDS.includes(c.id) ? true : c.lingshou,
    talents: [...c.talents, ...extra],
  };
});

/** 按 charId 取道统（属性结算 / 徽标共用；未知 id 返回 undefined） */
export function charTaoismOf(id: string): Taoism | undefined {
  return TAOISM_MAP[id];
}

/** 按 charId 判断灵兽之躯 */
export function charLingshouOf(id: string): boolean {
  return LINGSHOU_IDS.includes(id);
}

/** 按 id 取角色 */
export function zmlCharById(id: string): ZmlCharacter | undefined {
  return ZML_CHARACTERS.find((c) => c.id === id);
}

/** 掌门路角色池（Character 视图，供 setup 装配） */
export function zmlCharPool(): Character[] {
  return ZML_CHARACTERS;
}

/** 适合担任掌门（主公位）的角色：元婴 / 化神级掌门或家主 */
export const ZML_LORD_IDS: string[] = [
  'zml_qixiu',
  'zml_chuhongshang',
  'zml_chuzhen',
  'zml_nangongzhi',
  'zml_jiachanggeng',
  'zml_qinlaozu',
  'zml_chushentong',
  'zml_nangongmu',
  'zml_tiandifeng',
];
