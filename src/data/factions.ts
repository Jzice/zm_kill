/* ==================== 修真势力 ====================
 * 掌门杀的势力（门派）定义；主公技集中在 src/data/skilldefs.ts。
 * 首版以楚秦门为主，其余势力为后续扩展预留骨架。
 */
import type { Faction, FactionId } from '../core/types';
import { skillOf } from './skilldefs';

export const FACTIONS: Record<FactionId, Faction> = {
  chuqin: {
    name: '楚秦门',
    color: '#e74c3c',
    icon: '⚔️',
    desc: '修真界新晋门派，主角齐休所创，以勤勉立身。',
    lordSkill: skillOf('shishu'),
  },
  qiyun: {
    name: '齐云',
    color: '#3498db',
    icon: '⛰️',
    desc: '此界最强宗门之一，天地峰座主坐镇。',
    lordSkill: skillOf('tuiyan'),
  },
  baishan: {
    name: '白山',
    color: '#16a085',
    icon: '🏔️',
    desc: '白山之主贾长庚坐拥转世轮回之功。',
    lordSkill: skillOf('yinli'),
  },
  yushou: {
    name: '御兽门',
    color: '#f39c12',
    icon: '🐾',
    desc: '超级宗门，可独立发动开辟战争之特权。',
    lordSkill: skillOf('cuihua'),
  },
  dazhoushuyuan: {
    name: '大周书院',
    color: '#8e44ad',
    icon: '📜',
    desc: '本界管理者，上八门之一。',
    lordSkill: skillOf('mingjian'),
  },
  qinglian: {
    name: '青莲剑宗',
    color: '#2980b9',
    icon: '🗡️',
    desc: '剑修圣地，化神聂疯子实力前五。',
    lordSkill: skillOf('tansuo'),
  },
  nanlin: {
    name: '南林寺',
    color: '#27ae60',
    icon: '🛕',
    desc: '佛门超级宗门，枯荣为齐云座主师兄弟。',
    lordSkill: skillOf('jinhualun'),
  },
  waihai: {
    name: '外海',
    color: '#1abc9c',
    icon: '🌊',
    desc: '海外诸岛，龙家、海楚门盘踞之地。',
    lordSkill: skillOf('yishu'),
  },
  tianli: {
    name: '天理门',
    color: '#c0392b',
    icon: '☯️',
    desc: '超级宗门，上八门之一，法理森严。',
    lordSkill: skillOf('xunjie'),
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
