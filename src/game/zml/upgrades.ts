/* ==================== 角色升级天赋运行时层 ====================
 * 职责：把「装备 / 丹药 / 悟道」等解锁条件翻译成 Player.talents 的增删。
 *
 * 为什么写进 p.talents 而不是在 defsOf 里动态合成：
 *   - 出牌按钮（turn.ts）只遍历 p.talents 生成主动技选项；
 *   - 主动技查找（skills.ts useActiveTalent）只查 p.talents；
 *   - 诡代 / 本命代征（actions.ts / talentEngine copyTalent）同样只读 p.talents；
 *   - state_sync 直接序列化 players，写入后联机零改动。
 *
 * 约束：
 *   - 幂等、无随机，可重复调用（房主结算后随 state_sync 下发，客人端不重算）；
 *   - 只移除带 grantedBy 的条目，诡代复制来的同名天赋（copied: true）不受影响；
 *   - 不在热路径：仅装备变动 / 开局配装时调用。
 */
import type { Player, Talent, TalentDef } from '../../core/types';
import { G } from '../state';
import { addLog } from '../log';
import { defOf, talentOf } from '../../data/talentdefs';
import { zmlCharById } from '../../data/zml/characters.zml';
import { unlockableUpgrades, unlockEquipNameOf, upgradesByEquipName } from '../../data/zml/upgradeTalents.zml';

/** 玩家装备区中所有装备卡的卡名（四槽，空槽忽略） */
export function equipNamesOf(p: Player): string[] {
  const out: string[] = [];
  const e = p.equip;
  if (!e) return out;
  for (const slot of ['weapon', 'armor', 'horsePlus', 'horseMinus'] as const) {
    const c = e[slot];
    if (c) out.push(c.name);
  }
  return out;
}

/** 该玩家当前应持有的升级天赋（按「角色 id + 装备卡名」双重匹配） */
export function wantedUpgradesOf(p: Player): TalentDef[] {
  return unlockableUpgrades(p.charId || '', equipNamesOf(p));
}

/**
 * 同步升级天赋：条件满足则授予，条件消失则收回。幂等。
 * @returns 本次发生变化的条目数（0 表示无变化）
 */
export function syncEquipmentUpgrades(idx: number): number {
  const p = G.players[idx];
  if (!p) return 0;

  const wanted = wantedUpgradesOf(p);
  const wantedIds = new Set(wanted.map((d) => d.id));
  let changed = 0;

  // 1) 收回：带 grantedBy 且当前条件已不满足的条目
  const kept: Talent[] = [];
  for (const t of p.talents) {
    if (t.grantedBy && !wantedIds.has(t.id)) {
      addLog(`🗡️ ${p.name} 失去法宝加持，【${t.name}】失效`, 'hl');
      changed++;
      continue;
    }
    kept.push(t);
  }
  p.talents = kept;

  // 2) 授予：条件满足但尚未持有（诡代复制项不重复授予）
  for (const d of wanted) {
    if (p.talents.some((t) => t.id === d.id && !t.copied)) continue;
    const t: Talent = { ...talentOf(d.id), grantedBy: unlockEquipNameOf(d) || 'upgrade' };
    p.talents.push(t);
    addLog(`🗡️ ${p.name} 得法宝之助，解锁【${d.name}】`, 'hl');
    changed++;
  }

  return changed;
}

/** 是否已持有某升级天赋（UI 标记「已解锁」用） */
export function hasUpgrade(p: Player, talentId: string): boolean {
  return p.talents.some((t) => t.id === talentId);
}

/**
 * 装备提示文案：该装备卡被对应角色装备后能解锁哪些技能。
 * 例：`齐休装备后解锁【五感剥夺】`；无解锁关系时返回 ''。
 */
export function equipUnlockHint(equipName: string): string {
  const defs = upgradesByEquipName(equipName);
  if (!defs.length) return '';
  return defs
    .map((d) => {
      const cid = d.unlock && 'charId' in d.unlock ? d.unlock.charId : undefined;
      const who = cid ? zmlCharById(cid)?.name || '' : '';
      return `${who ? who + '装备后' : '装备后'}解锁【${d.name}】`;
    })
    .join('；');
}

/** 升级天赋定义（按 id 取，供 UI 展示条件文案） */
export function upgradeDefOf(id: string): TalentDef | undefined {
  const d = defOf(id);
  return d?.unlock ? d : undefined;
}
