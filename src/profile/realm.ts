/* ==================== 账号境界体系（修为 → 境界 / 瓶颈 / 突破演出） ====================
 * 与「局内境界 Player.cult.realm」共用 core/types.ts 的 Realm 序列：
 *   局内开放前 6 阶（练气 → 炼虚，见 core/mode.ts REALM_NEXT）
 *   账号成长走满 9 阶（本表 REALM_TIERS）
 *
 * 突破 = 修为达阈值 + 满足瓶颈条件（高阶才设条件）；未达条件则修为继续累积但卡在瓶颈。
 */
import { isSim, sleep } from '../core/dom';
import type { Profile, PublicProfile, Realm, RealmTier } from '../core/types';
import { REALM_LABEL } from '../core/mode';
import { Sound } from '../core/sound';

/** 九大境界阶位表（min = 踏入该境界所需累计修为；req = 除修为外的瓶颈条件） */
export const REALM_TIERS: RealmTier[] = [
  { id: 'lianqi', name: '练气', min: 0 },
  { id: 'zhuji', name: '筑基', min: 120 },
  { id: 'jindan', name: '金丹', min: 350 },
  { id: 'yuanying', name: '元婴', min: 700, req: { wins: 5 } },
  { id: 'huashen', name: '化神', min: 1200, req: { bestStreak: 3 }, reqAny: { achievements: 4 } },
  { id: 'lianxu', name: '炼虚', min: 1900, req: { wins: 20, achievements: 5 } },
  { id: 'heti', name: '合体', min: 2900, req: { wins: 40, achievements: 6 } },
  { id: 'dacheng', name: '大乘', min: 4300, req: { wins: 60, achievements: 7, bestStreak: 5 } },
  { id: 'dujie', name: '渡劫', min: 6200 },
];

/** 突破赞词（每阶一句） */
const BREAKTHROUGH_WORD: Record<Realm, string> = {
  lianqi: '引气入体，登临仙途',
  zhuji: '灵气灌顶，道基初成',
  jindan: '丹成九转，道基凝实',
  yuanying: '婴现眉心，神魂独立',
  huashen: '神游太虚，念动山河',
  lianxu: '炼神还虚，身外化形',
  heti: '神形合一，法相天地',
  dacheng: '大乘之门，一步登天',
  dujie: '天劫加身，羽化可期',
};

/** 可参与境界判定的最小档案形状（Profile / PublicProfile 均满足） */
export interface RealmLike {
  exp?: number;
  realm?: Realm;
  wins?: number;
  bestStreak?: number;
  achievements?: Record<string, number>;
}

function achN(p: RealmLike): number {
  return Object.keys(p.achievements || {}).length;
}

/** 境界 id → 阶位定义 */
export function tierOf(id: Realm): RealmTier {
  return REALM_TIERS.find((t) => t.id === id) || REALM_TIERS[0];
}

/** 纯按修为推导阶位（用于旧档迁移 / 未携带 realm 字段的联机档案） */
export function tierOfExp(exp: number): RealmTier {
  let t = REALM_TIERS[0];
  for (const x of REALM_TIERS) if ((exp || 0) >= x.min) t = x;
  return t;
}

/** 当前境界（优先取已记录的 realm，缺省由修为回推） */
export function currentTier(p: RealmLike): RealmTier {
  return p.realm ? tierOf(p.realm) : tierOfExp(p.exp || 0);
}

/** 下一阶（渡劫为顶点，返回 null） */
export function nextTier(p: RealmLike): RealmTier | null {
  const i = REALM_TIERS.indexOf(currentTier(p));
  return i >= 0 && i < REALM_TIERS.length - 1 ? REALM_TIERS[i + 1] : null;
}

/** 已解锁成就数（供瓶颈判定与展示复用） */
export function achievementsOf(p: RealmLike): number {
  return achN(p);
}

/**
 * 瓶颈缺口文案：修为已达下一阶阈值但条件不足时返回说明；否则 null。
 * - 条件尚未触及（修为不够）→ null（此时提示「还需 N 修为」更合适）
 */
export function bottleneckText(p: RealmLike): string | null {
  const nx = nextTier(p);
  if (!nx || (p.exp || 0) < nx.min) return null;
  const need: string[] = [];
  const req = nx.req;
  if (req?.wins && (p.wins || 0) < req.wins) need.push(`胜场 ${req.wins}（现 ${p.wins || 0}）`);
  if (req?.bestStreak && (p.bestStreak || 0) < req.bestStreak)
    need.push(`最高连胜 ${req.bestStreak}（现 ${p.bestStreak || 0}）`);
  if (req?.achievements && achN(p) < req.achievements)
    need.push(`成就 ${req.achievements}（现 ${achN(p)}）`);
  // 「或」条件：任一满足即可，整体才算通过
  const any = nx.reqAny;
  if (any) {
    const ok =
      (any.bestStreak ? (p.bestStreak || 0) >= any.bestStreak : false) ||
      (any.achievements ? achN(p) >= any.achievements : false) ||
      (any.wins ? (p.wins || 0) >= any.wins : false);
    if (!ok) {
      const alt: string[] = [];
      if (any.bestStreak) alt.push(`最高连胜 ${any.bestStreak}`);
      if (any.achievements) alt.push(`成就 ${any.achievements}`);
      if (any.wins) alt.push(`胜场 ${any.wins}`);
      need.push(alt.join(' 或 '));
    }
  }
  return need.length ? need.join('、') : null;
}

/** 突破判定：修为 + 瓶颈条件同时满足才可突破 */
export function checkBreakthrough(p: RealmLike): { ok: boolean; next: Realm | null; reason: string } {
  const nx = nextTier(p);
  if (!nx) return { ok: false, next: null, reason: '已至渡劫，羽化可期' };
  if ((p.exp || 0) < nx.min) return { ok: false, next: nx.id, reason: `修为不足（需 ${nx.min}）` };
  const bt = bottleneckText(p);
  if (bt) return { ok: false, next: nx.id, reason: `瓶颈未破：${bt}` };
  return { ok: true, next: nx.id, reason: '' };
}

/** 联机成员境界名（未同步档案则「未同步」） */
export function realmNameOfPublic(p: PublicProfile | null | undefined): string {
  if (!p) return '未同步';
  const t = p.realm ? tierOf(p.realm) : tierOfExp((p.exp ?? (p as unknown as { score?: number }).score) || 0);
  return t.name;
}

/**
 * 突破演出：全屏金光 + 境界跨越 + 赞词 + 音效。
 * 无头模拟（isSim）下静默跳过，不做 DOM 操作。
 */
export async function playBreakthrough(from: Realm, to: Realm): Promise<void> {
  Sound.play('breakthrough');
  if (isSim()) return;
  const host = document.getElementById('fxLayer') || document.body;
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'bt-fx';
  el.innerHTML = `<div class="bt-rays"></div><div class="bt-halo"></div>
    <div class="bt-pair"><span class="bt-from">${REALM_LABEL[from]}</span><span class="bt-arrow">➜</span><span class="bt-to">${REALM_LABEL[to]}</span></div>
    <div class="bt-title">境界突破</div>
    <div class="bt-word">${BREAKTHROUGH_WORD[to]}</div>`;
  host.appendChild(el);
  await sleep(2600);
  el.remove();
}

/** 账号档案的展示用境界名 */
export function realmName(p: Profile | PublicProfile): string {
  return currentTier(p).name;
}
