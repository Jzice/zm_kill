/* ==================== 掌门路资源层：灵石 / 修为 / 境界突破 / 灵地 ====================
 * 出处：docs/md/设定/灵石.md（一般等价物）、docs/md/设定/修行体系.md（进阶须灵地）、
 *       docs/md/设定/大周书院宗法制.md（开辟之功方得灵地）
 *
 * 仅在掌门路模式生效；经典模式下 Player.cult 为 undefined，所有函数直接返回，零副作用。
 */
import type { Player, Realm, SpiritGround } from '../../core/types';
import {
  BREAKTHROUGH,
  GROUND_CLAIM_COST,
  LINGSHI_CAP,
  LINGSHI_PER_TURN,
  MARKET_COST,
  MAX_BREAKTHROUGH,
  REALM_LABEL,
  REALM_NEXT,
  groundYieldOf,
  groundsOf,
  isZml,
} from '../../core/mode';
import { G } from '../state';
import { addLog } from '../log';
import { discardCard, drawCards } from '../rules';
import { render } from '../../ui/render';
import { waitChoice } from '../choice';
import { defOf, talentOf } from '../../data/talentdefs';

/** 取玩家的修真状态（经典模式为 undefined） */
export function cultOf(p: Player) {
  return p.cult;
}

/** 灵石收入（超出上限作废） */
export function gainLingShi(idx: number, n: number, reason: string): void {
  const p = G.players[idx];
  if (!p?.cult) return;
  const before = p.cult.lingShi;
  p.cult.lingShi = Math.min(LINGSHI_CAP, before + n);
  if (p.cult.lingShi !== before) addLog(`💠${p.name} 获得 ${p.cult.lingShi - before} 灵石（${reason}）`, 'hl');
}

/** 支付灵石；不足则返回 false */
export function spendLingShi(idx: number, n: number): boolean {
  const p = G.players[idx];
  if (!p?.cult || p.cult.lingShi < n) return false;
  p.cult.lingShi -= n;
  return true;
}

/** 修为积累 */
export function gainExp(idx: number, n: number): void {
  const p = G.players[idx];
  if (!p?.cult || n <= 0) return;
  p.cult.exp += n;
}

/* ---------------- 境界突破 ---------------- */

export interface BreakthroughCheck {
  ok: boolean;
  next: Realm | null;
  reason: string;
}

/** 是否可突破下一阶（需 灵地 + 灵石 + 修为 三者齐备） */
export function checkBreakthrough(idx: number): BreakthroughCheck {
  const p = G.players[idx];
  if (!p?.cult) return { ok: false, next: null, reason: '' };
  const c = p.cult;
  const next = REALM_NEXT[c.realm];
  if (!next) return { ok: false, next: null, reason: '已至炼虚，无法再进' };
  if (c.breakthroughs >= MAX_BREAKTHROUGH) return { ok: false, next, reason: '本局突破次数已尽' };
  const req = BREAKTHROUGH[c.realm];
  const owned = groundsOf(G.grounds, idx);
  if (!owned.some((g) => g.tier >= req.tier)) return { ok: false, next, reason: `需占领 ${req.tier} 阶以上灵地` };
  if (c.lingShi < req.lingShi) return { ok: false, next, reason: `灵石不足（需 ${req.lingShi}）` };
  if (c.exp < req.exp) return { ok: false, next, reason: `修为不足（需 ${req.exp}）` };
  return { ok: true, next, reason: '' };
}

/** 执行突破：涨上限、回体力、解锁下一阶；成功后给一次「破境机缘」（觉醒天赋 / 涨上限） */
export async function doBreakthrough(idx: number): Promise<boolean> {
  const p = G.players[idx];
  const chk = checkBreakthrough(idx);
  if (!p?.cult || !chk.ok || !chk.next) return false;
  const c = p.cult;
  const req = BREAKTHROUGH[c.realm];
  c.lingShi -= req.lingShi;
  c.exp -= req.exp;
  const next = chk.next;
  // 本命越多 → 灵根越杂 → 修炼越慢（已在修为需求量上体现：此处按本命数微调返还）
  c.realm = next;
  c.breakthroughs += 1;
  p.maxHp += req.hpUp;
  p.hp = Math.min(p.maxHp, p.hp + req.heal);
  addLog(`🆙${p.name} 突破至【${REALM_LABEL[next]}】！体力上限 +${req.hpUp}，回复 ${req.heal} 点`, 'hl');
  render();
  await grantBreakthroughReward(idx);
  return true;
}

/** 破境机缘：从「再觉醒 1 个天赋池天赋 / 体力上限 +1」中二选一（AI 自动择优，无剩余则直接涨上限） */
async function grantBreakthroughReward(idx: number): Promise<void> {
  const p = G.players[idx];
  if (!p?.cult) return;
  const pool = p.talentPool || [];
  if (!pool.length) {
    addMaxHp(idx, 1);
    return;
  }
  const opts = [
    { label: `📜再悟一门天赋（池中剩 ${pool.length} 门）`, value: 'talent' },
    { label: '❤ 体力上限 +1（并回 1 点体力）', value: 'maxhp' },
  ];
  const pick =
    p.isAI ? 'talent' : String(await waitChoice(idx, opts, 'list'));
  if (pick === 'talent') {
    let id = pool[0];
    if (pool.length > 1) {
      if (p.isAI) {
        id = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const tops = pool.map((tid) => ({ label: talentNameOf(tid), value: tid }));
        id = String(await waitChoice(idx, tops, 'list'));
      }
    }
    activatePoolTalent(idx, id);
  } else {
    addMaxHp(idx, 1);
  }
}

function talentNameOf(id: string): string {
  return defOf(id)?.name || id;
}

/** 从天赋池再觉醒一个天赋（加入已激活列表并从剩余池移除） */
function activatePoolTalent(idx: number, id: string): void {
  const p = G.players[idx];
  if (!p) return;
  const pool = p.talentPool || [];
  const pos = pool.indexOf(id);
  if (pos < 0) return;
  if (p.talents.some((t) => t.id === id && !t.copied)) return;
  p.talents.push(talentOf(id));
  pool.splice(pos, 1);
  p.talentPool = pool;
  addLog(`📜${p.name} 破境悟道，觉醒天赋【${talentNameOf(id)}】`, 'hl');
  render();
}

/** 体力点数上限 +n 并回血 */
function addMaxHp(idx: number, n: number): void {
  const p = G.players[idx];
  if (!p) return;
  p.maxHp += n;
  p.hp = Math.min(p.maxHp, p.hp + n);
  addLog(`❤${p.name} 破境强身，体力上限 +${n}（回 ${n} 点）`, 'hl');
  render();
}

/* ---------------- 悟道（出牌阶段修为行动） ---------------- */

/** 悟道：出牌阶段限一次，静心参悟 +1 修为（可借此凑够突破条件） */
export function canWudao(idx: number): boolean {
  const p = G.players[idx];
  if (!p?.cult || !isZml(G.mode)) return false;
  return !p.skillUse?.['zml_wudao'];
}

export function doWudao(idx: number): boolean {
  const p = G.players[idx];
  if (!p || !canWudao(idx)) return false;
  p.skillUse = p.skillUse || {};
  p.skillUse['zml_wudao'] = 1;
  gainExp(idx, 1);
  addLog(`🧘${p.name} 静心悟道，修为 +1`, 'hl');
  render();
  return true;
}


/* ---------------- 灵地 ---------------- */

/** 可开辟的灵地（首版：仅无主灵地，且灵石足够） */
export function claimableGrounds(idx: number): SpiritGround[] {
  const p = G.players[idx];
  if (!p?.cult || !isZml(G.mode)) return [];
  if (p.cult.lingShi < GROUND_CLAIM_COST) return [];
  return (G.grounds || []).filter((g) => g.owner === null);
}

/** 开辟灵地：付灵石 → 占领 → 得修为 */
export function doClaimGround(idx: number, groundId: string): boolean {
  const p = G.players[idx];
  const g = (G.grounds || []).find((x) => x.id === groundId);
  if (!p?.cult || !g || g.owner !== null) return false;
  if (!spendLingShi(idx, GROUND_CLAIM_COST)) return false;
  g.owner = idx;
  gainExp(idx, 1);
  addLog(`⛰️${p.name} 开辟灵地【${g.name}】（${g.tier} 阶）`, 'hl');
  render();
  return true;
}

/** 回合开始：基础产出 + 灵地产出 */
export function zmlTurnStart(idx: number): void {
  const p = G.players[idx];
  if (!p?.cult || !isZml(G.mode)) return;
  gainLingShi(idx, LINGSHI_PER_TURN, '打坐吐纳');
  const owned = groundsOf(G.grounds, idx);
  for (const g of owned) {
    gainLingShi(idx, groundYieldOf(g.tier, owned.length), `灵地·${g.name}`);
  }
}

/* ---------------- 坊市 ---------------- */

/** 坊市：付 3 灵石摸 1 张，每回合限 1 次 */
export function canMarket(idx: number): boolean {
  const p = G.players[idx];
  if (!p?.cult || !isZml(G.mode)) return false;
  if (p.skillUse?.['zml_market']) return false;
  return p.cult.lingShi >= MARKET_COST;
}

export function doMarket(idx: number): boolean {
  const p = G.players[idx];
  if (!canMarket(idx) || !p) return false;
  if (!spendLingShi(idx, MARKET_COST)) return false;
  p.skillUse = p.skillUse || {};
  p.skillUse['zml_market'] = 1;
  drawCards(p, 1);
  addLog(`🏪${p.name} 于坊市交易：付 ${MARKET_COST} 灵石摸 1 张牌`, 'hl');
  render();
  return true;
}

/* ---------------- 初始化 ---------------- */

/** 开局为玩家注入修真状态 */
export function initCult(idx: number, realm: Realm, benming: string[], family?: string): void {
  const p = G.players[idx];
  if (!p) return;
  p.cult = {
    realm,
    exp: 0,
    lingShi: 0,
    benming: benming || [],
    benmingShown: false,
    family: family || undefined,
    breakthroughs: 0,
  };
}

/** 击杀奖励：+2 灵石、+2 修为 */
export function onKillGain(idx: number): void {
  if (!isZml(G.mode)) return;
  if (idx < 0 || idx >= G.players.length) return;
  gainLingShi(idx, 2, '战利');
  gainExp(idx, 2);
}

/** 造成伤害：+1 修为 */
export function onDamageGain(idx: number, n: number): void {
  if (!isZml(G.mode)) return;
  if (idx < 0 || idx >= G.players.length) return;
  gainExp(idx, n);
}

/** 弃牌兜底：突破不消耗手牌，仅消耗灵石与修为（保留此函数以便后续扩展） */
export function discardForGround(idx: number): void {
  const p = G.players[idx];
  if (!p) return;
  const c = p.hand[0];
  if (c) discardCard(p, c);
}
