/* ==================== 武将完整卡展示 + 开局亮将确认（v1.8.3） ====================
 * 随机模式下，开局前需完整展示将使用的武将（体力 / 技能 / 主公技 / 解锁来源），
 * 并允许「换一个」重新派发（仍在开局前，保持「开局所见即所得」）。
 * charCardHtml 由设置界面预览卡（lobby.renderCharPreview）与亮将弹窗共用。
 */
import type { Character } from '../core/types';
import { escapeHtml } from '../core/dom';
import { FACTIONS } from '../data/factions';
import { packOfChar } from '../data/packRegistry';
import { unlockEquipNameOf, upgradeDefsOfChar } from '../data/zml/upgradeTalents.zml';

/**
 * 紧凑一行式「升级技能」摘要（大厅角色格 / 角色图鉴用）：
 * 只列「装备【X】解锁【Y】」，不展开效果描述，避免挤爆小卡。
 */
export function upgradeSummaryHtml(c: Character): string {
  const ups = upgradeDefsOfChar(c.id);
  if (!ups.length) return '';
  const items = ups
    .map((d) => `装备【${escapeHtml(unlockEquipNameOf(d))}】解锁<b>${escapeHtml(d.name)}</b>`)
    .join('；');
  return `<div class="cskill-up" style="margin-top:3px;font-size:11px;color:#9ad0a0">🗡️ ${items}</div>`;
}

export interface CharCardOpts {
  /** 角标文案：「✅ 已选择」/「🎲 随机派发」 */
  label: string;
  /** 随机派发模式：控制「🎲 随机派发」角标与样式（不决定是否显示卡内换将按钮） */
  random: boolean;
  /** 是否在武将卡内部显示「🎲 换一个」按钮；缺省时跟随 random。
   *  亮将弹窗底部已有可用的换将按钮，故弹窗内传 false 避免重复且失效的卡内按钮。 */
  cardReroll?: boolean;
}

/** 完整武将卡 HTML（设置界面预览与开局亮将弹窗共用） */
export function charCardHtml(c: Character, opts: CharCardOpts): string {
  const f = FACTIONS[c.faction];
  /** 自定义扩展包角色：卡底标注来源包名；原著角色为 null，不输出该行 */
  const src = packOfChar(c.id);
  const talents = c.talents
    .map(
      (s) =>
        `<div class="rcp-skill"><b>${escapeHtml(s.name)}</b><span class="rcp-type">${
          s.type === 'active' ? '主动' : '触发'
        }</span>：${escapeHtml(s.desc)}</div>`,
    )
    .join('');
  /** 升级技能（本命法宝解锁）：不进随机池，需装备对应法宝，离身即失效 */
  const upgrades = upgradeDefsOfChar(c.id);
  const upHtml = upgrades.length
    ? `<div class="rcp-talents"><div style="font-size:10px;color:var(--muted);margin-bottom:2px">升级技能（装备本命法宝解锁，离身即失效）</div>${upgrades
        .map(
          (d) =>
            `<div class="rcp-skill" style="opacity:.72"><b>${escapeHtml(d.name)}</b><span class="rcp-type">未解锁</span>：装备【${escapeHtml(
              unlockEquipNameOf(d),
            )}】后解锁 —— ${escapeHtml(d.desc)}</div>`,
        )
        .join('')}</div>`
    : '';
  return `<div class="rcp ${opts.random ? 'random' : ''}">
    <div class="rcp-head">
      <span class="rcp-avatar">${c.avatar}</span>
      <div class="rcp-id">
        <div class="rcp-name" style="color:${f.color}">${escapeHtml(c.name)}</div>
        <div class="rcp-title">${escapeHtml(c.title || '')}</div>
      </div>
      <span class="rcp-label">${escapeHtml(opts.label)}</span>
    </div>
    <div class="rcp-meta" style="color:${f.color}">${f.icon} ${escapeHtml(f.name)} · 体力 ${c.hp}</div>
    <div class="rcp-talents"><div style="font-size:10px;color:var(--muted);margin-bottom:2px">天赋池（本局随机激活 2~3 门）</div>${talents}</div>
    ${upHtml}
    <div class="rcp-lord">👑 主公技 <b>${escapeHtml(f.lordSkill.name)}</b>：${escapeHtml(f.lordSkill.desc)}</div>
    ${src ? `<div class="rcp-src">📦 扩展包「${escapeHtml(src.name)}」</div>` : ''}
    ${(opts.cardReroll ?? opts.random) ? '<button class="btn btn-sm rcp-reroll" onclick="rerollRandomChar()">🎲 换一个</button>' : ''}
  </div>`;
}

/* ---------------- 开局亮将弹窗 ---------------- */

let revealResolve: ((c: Character | null) => void) | null = null;
let revealRerollFn: (() => Character | null) | null = null;
let revealChar: Character | null = null;

/**
 * 弹出亮将确认（随机模式专用）。返回确认使用的角色；
 * 返回 null 表示用户选择「返回设置」（调用方应中止开局）。
 */
export function confirmReveal(c: Character, onReroll: () => Character | null): Promise<Character | null> {
  return new Promise((resolve) => {
    revealResolve = resolve;
    revealRerollFn = onReroll;
    revealChar = c;
    renderReveal();
    document.getElementById('revealModal')?.classList.add('show');
  });
}

function renderReveal(): void {
  const body = document.getElementById('revealBody');
  if (!body || !revealChar) return;
  body.innerHTML =
    `<div class="rv-tip">本局你将使用以下武将，确认后开局（也可先换一个）</div>` +
    charCardHtml(revealChar, { label: '🎲 随机派发', random: true, cardReroll: false }) +
    `<div class="rv-actions">
      <button class="btn btn-accent" onclick="revealConfirm()">🎮 开始对局</button>
      <button class="btn" onclick="revealReroll()">🎲 换一个</button>
      <button class="btn" onclick="revealCancel()">↩ 返回设置</button>
    </div>`;
}

/** 确认开局 */
export function revealConfirm(): void {
  const c = revealChar;
  const r = revealResolve;
  closeReveal();
  r?.(c);
}

/** 亮将弹窗内换将 */
export function revealReroll(): void {
  const c = revealRerollFn?.();
  if (c) {
    revealChar = c;
    renderReveal();
  }
}

/** 返回设置（中止开局） */
export function revealCancel(): void {
  const r = revealResolve;
  closeReveal();
  r?.(null);
}

function closeReveal(): void {
  document.getElementById('revealModal')?.classList.remove('show');
  revealResolve = null;
  revealRerollFn = null;
  revealChar = null;
}
