/* ==================== 角色升级天赋（装备 / 丹药 / 悟道 解锁） ====================
 * 角色升级机制：角色默认只拥有天赋池里的本命天赋；装备与其本命相配的专属法宝后，
 * 解锁本来不具备的进阶技能；法宝离身（被替换 / 被拆 / 被夺）即失去该技能。
 *
 * 设计要点：
 * 1. 升级天赋**不属于任何角色的天赋池**（Character.talents / POOL_EXTRA 均不得引用），
 *    因此不会被开局随机激活抽到，也不占破境机缘名额；
 * 2. 解锁条件写在定义上（TalentDef.unlock，单一数据源），由
 *    `src/game/zml/upgrades.ts` 的 syncEquipmentUpgrades 在装备变动时按条件授予 / 收回；
 * 3. 本期只实现 kind='equip'；'item'（丹药）/ 'realm'（悟道 / 境界）为后续扩展预留。
 *
 * 原著依据：
 * - 莫剑心以身饲剑铸「日 / 月 / 星 / 影」四把四阶无形剑，分赠齐休、齐妆、秦长风、楚无影
 *   —— docs/md/角色/楚秦门/02.筑基/莫剑心.md:120-155
 * - 四阶无形剑属性 —— docs/md/物事/法器.md:10 / :59（幻日无形：需先有幻日照耀方入无形）
 * - 五感剥夺（六识禅枪）—— docs/md/角色/楚秦门/03.金丹/齐休.md:393
 * - 星遁（遥及闪 → 星闪 → 星遁）—— docs/md/势力/000.楚秦门/功法传承.md:117
 */
import type { TalentDef } from '../../core/types';

/** 四柄四阶无形剑的卡名（与 cards.zml.ts 的 ZML_EQUIP 保持一致，供自检探针校验） */
export const ZML_UPGRADE_EQUIP_NAMES = ['幻日无形剑', '幻月无形剑', '幻星无形剑', '幻影无形剑'] as const;

export const ZML_UPGRADE_TALENT_LIST: TalentDef[] = [
  /* ---------------- 齐休 · 幻日无形剑（日剑） → 五感剥夺 ---------------- */
  {
    id: 'zml_qixiu_wuganboduo',
    name: '五感剥夺',
    kind: 'active',
    timing: 'active',
    limit: 'perTurn',
    cost: { hand: 1 },
    desc: '出牌阶段限一次：弃 1 张手牌，令一名其他角色翻面（五感尽失，浑噩一回合，跳过其下个回合）。出处：docs/md/角色/楚秦门/03.金丹/齐休.md · 六识禅枪',
    effects: [{ kind: 'targetFlip' }],
    unlock: { kind: 'equip', equip: '幻日无形剑', charId: 'zml_qixiu' },
  },

  /* ---------------- 秦长风 · 幻星无形剑（星剑） → 星遁 ---------------- */
  {
    id: 'zml_qinchangfeng_xingdun',
    name: '星遁',
    kind: 'passive',
    timing: 'passive',
    desc: '你的攻击范围 +2，且其他角色计算与你的距离 +1（星遁入虚空：攻可及远、守则难近）。出处：docs/md/势力/000.楚秦门/功法传承.md · 遥及闪→星闪→星遁；docs/raw 第014卷「星遁挫武痴」',
    effects: [
      { kind: 'rangePlus', n: 2 },
      { kind: 'distPlusToMe', n: 1 },
    ],
    unlock: { kind: 'equip', equip: '幻星无形剑', charId: 'zml_qinchangfeng' },
  },

  /* ---------------- 齐妆 · 幻月无形剑（月剑） → 月华 ---------------- */
  {
    id: 'zml_qizhuang_yuehua',
    name: '月华',
    kind: 'passive',
    timing: 'passive',
    desc: '你的手牌上限 +1；你不能成为【破阵符】【敛息诀】的目标（月华罩体，剑身无形，无从夺取）。出处：docs/md/角色/楚秦门/02.筑基/莫剑心.md · 月剑归齐妆',
    effects: [
      { kind: 'handLimit', n: 1 },
      { kind: 'cardImmune', names: ['破阵符', '敛息诀'] },
    ],
    unlock: { kind: 'equip', equip: '幻月无形剑', charId: 'zml_qizhuang' },
  },

  /* ---------------- 楚无影 · 幻影无形剑（影剑） → 影遁 ---------------- */
  {
    id: 'zml_chuwuying_yingdun',
    name: '影遁',
    kind: 'passive',
    timing: 'passive',
    desc: '你计算与其他角色的距离 -1；你的手牌上限 +1（影剑随身，行迹无痕，影中自有余裕）。出处：docs/md/角色/楚秦门/03.金丹/楚无影.md · 影剑',
    effects: [
      { kind: 'distMod', delta: -1 },
      { kind: 'handLimit', n: 1 },
    ],
    unlock: { kind: 'equip', equip: '幻影无形剑', charId: 'zml_chuwuying' },
  },
];

/**
 * 按角色预建索引（模块加载时构建一次，供装备变动时 O(该角色升级天赋数) 查表）。
 * 条件里没写 charId 的通用解锁天赋单列到 GENERIC_UPGRADES，两表合计即全量。
 */
const { UPGRADE_BY_CHAR, GENERIC_UPGRADES } = (() => {
  const m = new Map<string, TalentDef[]>();
  const generic: TalentDef[] = [];
  for (const d of ZML_UPGRADE_TALENT_LIST) {
    const cid = d.unlock?.charId;
    if (!cid) {
      generic.push(d);
      continue;
    }
    const arr = m.get(cid);
    if (arr) arr.push(d);
    else m.set(cid, [d]);
  }
  return { UPGRADE_BY_CHAR: m, GENERIC_UPGRADES: generic };
})();

/** 该角色的全部升级天赋定义（不受当前装备影响，供 UI / 自检使用） */
export function upgradeDefsOfChar(charId: string): TalentDef[] {
  return UPGRADE_BY_CHAR.get(charId) || [];
}

/** 解锁条件对应的装备卡名（非装备条件返回 ''） */
export function unlockEquipNameOf(d: TalentDef): string {
  return d.unlock && d.unlock.kind === 'equip' ? d.unlock.equip : '';
}

/** 解锁条件文案：「装备【幻星无形剑】后解锁」 */
export function unlockTextOf(d: TalentDef): string {
  const u = d.unlock;
  if (!u) return '';
  if (u.kind === 'equip') return `装备【${u.equip}】后解锁`;
  if (u.kind === 'item') return `服用【${u.itemId}】后解锁`;
  return `修为达【${u.realm}】后解锁`;
}

/** 某张装备卡能解锁哪些升级天赋（供装备提示 / 卡牌大全反查） */
export function upgradesByEquipName(equipName: string): TalentDef[] {
  return ZML_UPGRADE_TALENT_LIST.filter((d) => unlockEquipNameOf(d) === equipName);
}

/**
 * 某角色持有该装备时能解锁的升级天赋（角色 + 卡名双重匹配）。
 * charId 缺省的条件视为「任意角色装备均可解锁」。
 */
export function unlockableUpgrades(charId: string, equipNames: string[]): TalentDef[] {
  const out: TalentDef[] = [];
  const push = (d: TalentDef) => {
    const u = d.unlock;
    if (u && u.kind === 'equip' && equipNames.includes(u.equip)) out.push(d);
  };
  for (const d of UPGRADE_BY_CHAR.get(charId) || []) push(d);
  for (const d of GENERIC_UPGRADES) push(d);
  return out;
}
