/* ==================== 修真势力（九大门派） ====================
 * 门派与主公技均按《修真门派掌门路》原著设定：
 *   楚秦门（齐休开山）· 齐云（天地峰）· 白山（贾长庚）· 御兽门（喀尔威明）· 大周书院（三代掌门制）
 *   青莲剑宗（聂疯子）· 南林寺（枯荣）· 外海（芩家海东城）· 天理门（崇理）
 * 主公技定义见 src/data/zml/skilldefs.zml.ts（zml_lord_*）。
 */
import type { Faction, FactionId } from '../core/types';
import { skillOf } from './skilldefs';

export const FACTIONS: Record<FactionId, Faction> = {
  chuqin: {
    name: '楚秦门',
    color: '#e74c3c',
    icon: '⚔️',
    desc: '齐休于白山北部开山立派的新晋门派，以勤勉立身、秦楚展罗诸家合流。',
    lordSkill: skillOf('zml_lord_chuqin'),
  },
  qiyun: {
    name: '齐云',
    color: '#3498db',
    icon: '⛰️',
    desc: '此界最强宗门之一，天地峰座主坐镇，上八门之首。',
    lordSkill: skillOf('zml_lord_qiyun'),
  },
  baishan: {
    name: '白山',
    color: '#16a085',
    icon: '🏔️',
    desc: '白山之主贾长庚双星化神，坐拥转世轮回之功。',
    lordSkill: skillOf('zml_lord_baishan'),
  },
  yushou: {
    name: '御兽门',
    color: '#f39c12',
    icon: '🐾',
    desc: '超级宗门，可独立发动开辟战争之特权。',
    lordSkill: skillOf('zml_lord_yushou'),
  },
  dazhoushuyuan: {
    name: '大周书院',
    color: '#8e44ad',
    icon: '📜',
    desc: '本界管理者、上八门之一，行三代掌门制与宗法分封。',
    lordSkill: skillOf('zml_lord_dazhou'),
  },
  qinglian: {
    name: '青莲剑宗',
    color: '#2980b9',
    icon: '🗡️',
    desc: '剑修圣地，化神聂疯子实力前五，剑心通明。',
    lordSkill: skillOf('zml_lord_qinglian'),
  },
  nanlin: {
    name: '南林寺',
    color: '#27ae60',
    icon: '🛕',
    desc: '佛门超级宗门，枯荣为天地峰座主师兄弟。',
    lordSkill: skillOf('zml_lord_nanlin'),
  },
  waihai: {
    name: '外海',
    color: '#1abc9c',
    icon: '🌊',
    desc: '海外诸岛，海东城芩家主持军务，魔灾频仍。',
    lordSkill: skillOf('zml_lord_waihai'),
  },
  tianli: {
    name: '天理门',
    color: '#c0392b',
    icon: '☯️',
    desc: '超级宗门、上八门之一，法理森严，崇理一脉坐镇。',
    lordSkill: skillOf('zml_lord_tianli'),
  },
};

export const FACTION_ICON: Record<FactionId, string> = {
  chuqin: '⚔️',
  qiyun: '⛰️',
  baishan: '🏔️',
  yushou: '🐾',
  dazhoushuyuan: '📜',
  qinglian: '🗡️',
  nanlin: '🛕',
  waihai: '🌊',
  tianli: '☯️',
};

export const FACTION_LIST: FactionId[] = [
  'chuqin', 'qiyun', 'baishan', 'yushou', 'dazhoushuyuan',
  'qinglian', 'nanlin', 'waihai', 'tianli',
];
