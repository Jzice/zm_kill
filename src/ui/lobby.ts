/* ==================== 大厅 UI / 选角 / 扩展包管理 / 房间成员 ==================== */
import type { Character, FactionId, GameMode, Gender, PublicProfile, Role } from '../core/types';
import { MODE_DESC, MODE_LABEL, isZml } from '../core/mode';
import { escapeHtml, inputValue } from '../core/dom';
import { Sound } from '../core/sound';
import { FACTIONS } from '../data/factions';
import { ROLES, ROLE_CONFIG, ROLE_ICON, CHARACTERS } from '../data/characters';
import { PACKETS, charPoolForPacket, packetName, isExpansion, canEnablePacket } from '../data/packets';
import type { PacketId } from '../data/packets';
import { charCardHtml } from './reveal';
import { NET } from '../net/network';
import {
  AVATAR_OPTIONS,
  DEFAULT_AVATAR,
  GENDER_OPTIONS,
  MOOD_ICON_OPTIONS,
  genderIcon,
  realmBarPct,
  PROFILE,
  refreshProfileUI,
  ACHIEVEMENTS,
  saveProfile,
  setters,
  showAchievements,
} from '../profile/profile';
import { bottleneckText, currentTier, nextTier, realmNameOfPublic } from '../profile/realm';
import {
  customCharsFor,
  getInstalledPacks,
  installPackFromText,
  setPackEnabled,
  removePack,
  clearAllPacks,
  setCustomAllowed,
} from '../data/packRegistry';
import { openPackEditor } from './packEditor';
import { startSingle } from '../game/setup';
import { DEFAULT_TIMER_SEC, TIMER_OPTIONS } from '../game/timer';
import { CARD_PACKS, cardPackName, normalizeCardPacks } from '../data/cardPacks';
import type { CardPackId } from '../data/cardPacks';
import { CARD_CATALOG } from '../data/cardCatalog';
import { ZML_DECK_TOTAL } from '../data/zml/cards.zml';

/* ---- 大厅选择状态（原版全局变量，仅本模块写入，其他模块只读） ---- */
export let SELECTED_COUNT = 5;
export let SELECTED_CHAR: Character | null = null;
export let SELECTED_FACTION: FactionId = 'chuqin';
export let SELECTED_MODE: 'single' | 'host' | 'join' = 'single';
/** 扩展包：角色池范围（首版仅 'all'） */
export let SELECTED_PACKET: PacketId = 'all';
export let USER_CHOSEN = false;
/** 随机模式预览角色：未手动选择时随机派发，一次预览后保持稳定（开局所见即所得） */
let RANDOM_CHAR: Character | null = null;
export let SELECTED_ROLE: Role | 'random' = 'random';
/** 回合限时：开关 + 档位（10 / 20 / 30 秒），默认开启 20 秒 */
export let SELECTED_TIMER_ON = true;
export let SELECTED_TIMER_SEC: number = DEFAULT_TIMER_SEC;
/**
 * 牌库扩展包（与角色扩展包 SELECTED_PACKET 相互独立）：决定牌堆在修真牌堆之上追加哪些扩展卡。
 * 由本模块独占持有（其他模块只读 / 通过 toggleCardPack 修改），不对外赋值。
 */
export let SELECTED_CARD_PACKS: CardPackId[] = [];

/**
 * 对局模式（规则层）：zml=掌门路（默认）/ war=开辟战争，均基于修真内核。
 * 注意与上方的 SELECTED_MODE（single / host / join 联机模式）区分：两者互不影响。
 * 由本模块独占持有，其他模块只读；通过 setRuleMode 修改。
 */
export let SELECTED_RULE_MODE: GameMode = 'zml';

/** 切换对局模式（大厅设置；联机时以房主选择为准） */
export function setRuleMode(m: GameMode): void {
  SELECTED_RULE_MODE = m;
  Sound.play('click');
  saveSetupPrefs();
  renderRuleModePicker();
  renderCardPackPicker();
}

/** 对局模式选择器：掌门路 / 开辟战争 */
export function renderRuleModePicker(): void {
  const box = document.getElementById('ruleModePicker');
  if (!box) return;
  const ids: GameMode[] = ['zml', 'war'];
  box.innerHTML = ids
    .map(
      (m) =>
        `<button class="opt-btn ${SELECTED_RULE_MODE === m ? 'active' : ''}" onclick="setRuleMode('${m}')">${MODE_LABEL[m]}<small>${MODE_DESC[m]}</small></button>`,
    )
    .join('');
}

/** 开局选择本地记忆：玩家总数 / 回合限时（开关与秒数），写入 localStorage 记住上一次选择 */
const SETUP_PREFS_KEY = 'xuetangsha_setup_v1';
interface SetupPrefs {
  count?: number;
  timerOn?: boolean;
  timerSec?: number;
  cardPacks?: string[];
}

/** 读取上一次的开局选择并套用（须在渲染选择器 / 绑定滑块之前调用） */
export function restoreSetupPrefs(): void {
  try {
    const raw = localStorage.getItem(SETUP_PREFS_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as SetupPrefs;
    if (typeof p.count === 'number') SELECTED_COUNT = Math.max(2, Math.min(8, Math.round(p.count)));
    if (typeof p.timerOn === 'boolean') SELECTED_TIMER_ON = p.timerOn;
    if (typeof p.timerSec === 'number') SELECTED_TIMER_SEC = Math.max(5, Math.min(120, Math.round(p.timerSec)));
    if (Array.isArray(p.cardPacks)) SELECTED_CARD_PACKS = normalizeCardPacks(p.cardPacks);
  } catch {
    /* 忽略损坏的本地数据，沿用默认值 */
  }
}

/** 保存当前开局选择到 localStorage（每次改动人数 / 限时后调用） */
export function saveSetupPrefs(): void {
  try {
    localStorage.setItem(
      SETUP_PREFS_KEY,
      JSON.stringify({
        count: SELECTED_COUNT,
        timerOn: SELECTED_TIMER_ON,
        timerSec: SELECTED_TIMER_SEC,
        cardPacks: SELECTED_CARD_PACKS,
      }),
    );
  } catch {
    /* 隐私模式 / 存储不可用时静默忽略 */
  }
}

/** 扩展包选择器：角色池范围（首版仅 'all'，全部免费并列） */
export function renderPacketPicker(): void {
  const box = document.getElementById('packetPicker');
  if (!box) return;
  box.innerHTML = PACKETS.map((p) => {
    const n = charPoolForPacket(p.id).length;
    const tail = n ? `${n}角色` : '暂无角色';
    const enabled = canEnablePacket(p.id);
    const badge = packStateBadge(p.id);
    const lockedCls = enabled ? '' : ' pk-locked';
    return `<button class="opt-btn ${p.id === SELECTED_PACKET ? 'active' : ''}${lockedCls}" data-packet="${p.id}" onclick="setPacket('${p.id}')">${p.icon} ${p.name}<small>${p.desc} · ${tail}</small><div class="pk-badges">${badge}</div></button>`;
  }).join('');
  const hint = document.getElementById('packetHint');
  if (hint) {
    const n = charPoolForPacket(SELECTED_PACKET).length;
    hint.textContent = `当前：${packetName(SELECTED_PACKET)} —— 共 ${n} 名角色`;
  }
}

/**
 * 牌库扩展包选择器（多选）：在基础牌堆之上追加扩展卡牌。
 * 与「角色扩展包」#packetPicker 相互独立——前者管牌堆，后者管角色池。
 */
export function renderCardPackPicker(): void {
  const box = document.getElementById('cardPackPicker');
  if (!box) return;
  box.innerHTML = CARD_PACKS.map((p) => {
    if (p.id === 'core') {
      return `<button class="opt-btn pk-locked" data-cardpack="core" title="基础牌堆恒启用，不可关闭">${p.icon} ${p.name}<small>${p.desc}</small><div class="pk-badges"><span class="pk-badge">✅ 恒启用</span></div></button>`;
    }
    const types = Object.values(CARD_CATALOG).filter((d) => d.pack === p.id).length;
    const cards = Object.values(CARD_CATALOG).reduce((s, d) => s + (d.pack === p.id ? d.count : 0), 0);
    const on = SELECTED_CARD_PACKS.includes(p.id);
    return `<button class="opt-btn ${on ? 'active' : ''}" data-cardpack="${p.id}" onclick="toggleCardPack('${p.id}')">${p.icon} ${p.name}<small>${p.desc}</small><div class="pk-badges"><span class="pk-badge">${types}种 · ${cards}张</span>${on ? '<span class="pk-badge">✅ 已启用</span>' : ''}</div></button>`;
  }).join('');
  const hint = document.getElementById('cardPackHint');
  if (hint) {
    hint.textContent = SELECTED_CARD_PACKS.length
      ? `当前牌库：修真牌堆 ${ZML_DECK_TOTAL} 张（已勾选 ${SELECTED_CARD_PACKS.map(cardPackName).join(' / ')}；扩展卡尚未修真化，暂不投放牌堆）`
      : `当前牌库：仅修真牌堆 ${ZML_DECK_TOTAL} 张（未启用任何扩展卡包）`;
  }
}

/** 勾选 / 取消一个牌库扩展包（core 不可切换） */
export function toggleCardPack(id: CardPackId): void {
  if (id === 'core') return;
  Sound.play('click');
  const at = SELECTED_CARD_PACKS.indexOf(id);
  if (at >= 0) SELECTED_CARD_PACKS.splice(at, 1);
  else SELECTED_CARD_PACKS.push(id);
  saveSetupPrefs();
  renderCardPackPicker();
}

/** 回合限时选择器：不限时 / 10 / 20 / 30 秒 */
export function renderTimerPicker(): void {
  const box = document.getElementById('timerPicker');
  if (!box) return;
  const off = `<button class="opt-btn ${SELECTED_TIMER_ON ? '' : 'active'}" onclick="setTimerOn(false)">♾️ 不限时<small>传统节奏，慢慢思考</small></button>`;
  const secs = TIMER_OPTIONS.map(
    (o) =>
      `<button class="opt-btn ${SELECTED_TIMER_ON && SELECTED_TIMER_SEC === o.sec ? 'active' : ''}" onclick="setTimerSec(${o.sec})">⏱ ${o.label}<small>每次决策限时 ${o.sec} 秒</small></button>`,
  ).join('');
  box.innerHTML = off + secs;
  const hint = document.getElementById('timerHint');
  if (hint) {
    hint.textContent = SELECTED_TIMER_ON
      ? `当前：每次决策限时 ${SELECTED_TIMER_SEC} 秒 —— 出牌超时自动结束出牌，防御超时承受伤害，濒死超时放弃，答题超时算答错`
      : '当前：不限时（AI 回合不计时，仅对真人玩家的决策计时）';
  }
}

export function setTimerOn(on: boolean): void {
  Sound.play('click');
  SELECTED_TIMER_ON = on;
  saveSetupPrefs();
  renderTimerPicker();
  renderSetupSummary();
}

export function setTimerSec(sec: number): void {
  Sound.play('click');
  SELECTED_TIMER_SEC = sec;
  SELECTED_TIMER_ON = true;
  saveSetupPrefs();
  renderTimerPicker();
  renderSetupSummary();
}

export function setPacket(id: PacketId): void {
  Sound.play('click');
  // 首版扩展包均为免费并列选项，不再按次计费
  if (!canEnablePacket(id)) return;
  SELECTED_PACKET = id;
  renderPacketPicker();
  // 切换扩展包后角色池变化：确保已选阵营/角色仍有效
  const pool = charPoolForPacket(SELECTED_PACKET);
  if (!pool.length) {
    renderFactionPicker();
    renderCharPicker();
    return;
  }
  if (!pool.some((c) => c.faction === SELECTED_FACTION)) {
    USER_CHOSEN = false;
    SELECTED_FACTION = pool[0].faction;
  }
  if (!SELECTED_CHAR || !pool.some((c) => c.id === SELECTED_CHAR!.id)) SELECTED_CHAR = null;
  renderFactionPicker();
  renderCharPicker();
  pushGuestPref();
}

export function getAvailableRoles(count: number): Role[] {
  const deck = ROLE_CONFIG[count] || ROLE_CONFIG[4];
  return [...new Set(deck)];
}

export function renderRolePicker(): void {
  const grid = document.getElementById('rolePicker');
  if (!grid) return;
  const roles = getAvailableRoles(SELECTED_COUNT);
  let html = `<div class="role-card ${SELECTED_ROLE === 'random' ? 'selected' : ''}" style="border-color:#8a6d3b;color:#8a6d3b;" onclick="selectRole('random')"><div class="r-icon">🎲</div><div class="r-name">随机</div></div>`;
  roles.forEach((r) => {
    const info = ROLES[r];
    html += `<div class="role-card ${SELECTED_ROLE === r ? 'selected' : ''}" style="border-color:${info.color};color:${info.color};" onclick="selectRole('${r}')"><div class="r-icon">${ROLE_ICON[r] || '❓'}</div><div class="r-name">${info.name}</div></div>`;
  });
  grid.innerHTML = html;
}

export function selectRole(r: Role | 'random'): void {
  Sound.play('click');
  SELECTED_ROLE = r;
  renderRolePicker();
}

export function renderFactionPicker(): void {
  const grid = document.getElementById('factionPicker');
  if (!grid) return;
  const pool = charPoolForPacket(SELECTED_PACKET);
  const fset = new Set(pool.map((c) => c.faction));
  grid.innerHTML = Object.entries(FACTIONS)
    .map(([k, f]) => {
      const disabled = !fset.has(k as FactionId);
      const cnt = pool.filter((c) => c.faction === k).length;
      return `<div class="faction-card ${k === SELECTED_FACTION && !disabled ? 'selected' : ''}" style="border-color:${f.color};color:${f.color};${disabled ? 'opacity:.35;' : ''}${k === SELECTED_FACTION && !disabled ? 'box-shadow:0 0 16px ' + f.color : ''}" onclick="selectFaction('${k}')">
      <div class="f-icon">${f.icon}</div>
      <div class="f-name" style="color:${f.color};">${f.name}</div>
      <div class="f-desc">${disabled ? '本门派暂无角色' : '主公技：' + f.lordSkill.name + ' · ' + cnt + '角色'}</div>
    </div>`;
    })
    .join('');
}

export function selectFaction(k: FactionId): void {
  Sound.play('click');
  const pool = charPoolForPacket(SELECTED_PACKET).filter((c) => c.faction === k);
  if (!pool.length) {
    alert('当前该阵营暂无角色');
    return;
  }
  USER_CHOSEN = true;
  SELECTED_FACTION = k;
  if (!SELECTED_CHAR || SELECTED_CHAR.faction !== k) SELECTED_CHAR = pool[0];
  renderFactionPicker();
  renderCharPicker();
  pushGuestPref();
}

export function renderCharPicker(): void {
  const grid = document.getElementById('charGrid');
  if (!grid) return;
  const full = mergedCharPool(SELECTED_PACKET);
  const pool = full.filter((c) => c.faction === SELECTED_FACTION);
  const hint = document.getElementById('charPoolHint');
  if (hint) hint.textContent = `（当前可选角色池共 ${full.length} 名，含已解锁扩展包角色）`;
  if (!pool.length) {
    grid.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">该阵营当前暂无角色</div>';
    const pv0 = document.getElementById('charPreview');
    if (pv0) pv0.innerHTML = '';
    return;
  }
  if (!SELECTED_CHAR || !pool.some((c) => c.id === SELECTED_CHAR!.id)) SELECTED_CHAR = pool[0];
  grid.innerHTML = pool
    .map((c) => {
      const f = FACTIONS[c.faction];
      const sel = SELECTED_CHAR && SELECTED_CHAR.id === c.id;
      return `<div class="char-card ${sel ? 'selected' : ''}" style="border-color:${f.color};color:${f.color};${sel ? 'box-shadow:0 0 16px ' + f.color : ''}" onclick="selectChar('${c.id}')">
      <div class="faction-badge" style="color:${f.color};">${f.icon}</div>
      <div class="ctop"><span class="cavatar">${c.avatar}</span><div><div class="cname" style="color:${f.color};">${c.name}</div><div class="ctitle">${c.title}</div></div></div>
      <div class="csubject" style="color:${f.color};">${f.name} · 体力${c.hp}</div>
      <div class="cskill">${c.talents.map((s) => `<b>${s.name}</b>：${s.desc}`).join('<br>')}</div>
      
    </div>`;
    })
    .join('');
  renderCharPreview();
}

/** 角色预览：完整武将卡（随机派发时展示将使用的角色并支持「换一个」；手动选择后展示已选角色） */
export function renderCharPreview(): void {
  const box = document.getElementById('charPreview');
  if (!box) return;
  const c = USER_CHOSEN ? SELECTED_CHAR : randomPreviewChar();
  if (!c) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = charCardHtml(c, {
    label: USER_CHOSEN ? '✅ 已选择' : '🎲 随机派发',
    random: !USER_CHOSEN,
  });
}

/** 随机模式：开局前更换随机派发的武将（重新派发后仍保持「开局所见即所得」） */
export function rerollRandomChar(): Character | null {
  if (USER_CHOSEN) return SELECTED_CHAR;
  const pool = mergedCharPool(SELECTED_PACKET);
  if (!pool.length) return null;
  let c = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && RANDOM_CHAR && c.id === RANDOM_CHAR.id) {
    const others = pool.filter((x) => x.id !== RANDOM_CHAR!.id);
    c = others[Math.floor(Math.random() * others.length)];
  }
  RANDOM_CHAR = c;
  SELECTED_FACTION = c.faction;
  SELECTED_CHAR = c;
  Sound.play('click');
  renderFactionPicker();
  renderCharPicker();
  return c;
}

export function selectChar(id: string): void {
  Sound.play('click');
  USER_CHOSEN = true;
  // 优先从「当前上下文的角色池」取，保证自选角色带上门派主题技能；
  // 联机加入方用「房主基础包 ∪ 自己叠加扩展包」的有效池，房主/单机用合并池。找不到时回退原始数据。
  const searchPool =
    SELECTED_MODE === 'join'
      ? effectiveCharPool(REMOTE_BASE_PACKET, SELECTED_EXTRA_PACKETS)
      : mergedCharPool(SELECTED_PACKET);
  SELECTED_CHAR = searchPool.find((c) => c.id === id) || CHARACTERS.find((c) => c.id === id) || null;
  renderCharPicker();
  pushGuestPref();
}

/** 选角池 = 原著角色池 + 自定义扩展包角色（已移除学堂杀年级包与 108 名生成角色） */
export function mergedCharPool(packet: PacketId): Character[] {
  const base = charPoolForPacket(packet);
  const ids = new Set(base.map((c) => c.id));
  // 自定义扩展包角色：追加式并入，受「仅单机/房主」限制（联机加入方返回空）
  const custom = customCharsFor(packet).filter((c) => !ids.has(c.id));
  return [...base, ...custom];
}

/**
 * 某座位的有效角色池 = 基础包（房主统一选包）∪ 该玩家本局叠加启用的扩展包（个人叠加）。
 * 复用 mergedCharPool 的「基础池 + 扩展角色」规则，逐包合并并去重。
 */
export function effectiveCharPool(base: PacketId, extra: PacketId[]): Character[] {
  const seen = new Map<string, Character>();
  const add = (list: Character[]): void => {
    for (const c of list) if (!seen.has(c.id)) seen.set(c.id, c);
  };
  add(mergedCharPool(base));
  for (const p of extra) if (p !== base) add(mergedCharPool(p));
  return [...seen.values()];
}

/* ==================== 扩展包按次使用（学习解锁机制） ==================== */

/** 联机加入方：房主统一选的基础包（由 room_state 下发，未同步前回退到本地默认值） */
export let REMOTE_BASE_PACKET: PacketId = 'all';

/** 本地玩家的「个人叠加扩展包」（联机加入方在房主基础包之上额外启用的包；单机/房主恒为空） */
export let SELECTED_EXTRA_PACKETS: PacketId[] = [];

/** 把一次扩展包使用预览渲染成状态徽标文案（首版恒为「永久免费」） */
function packStateBadge(_id: PacketId): string {
  return '<span class="pk-badge free">永久免费</span>';
}

/* ==================== 加入档：阵营 / 角色选择（同步给房主） ==================== */

/** 联机加入方：在房主基础包之上叠加启用自己的扩展包（个人叠加，不受房主限制） */
export function toggleExtraPacket(id: PacketId): void {
  Sound.play('click');
  if (!isExpansion(id)) return;
  if (!canEnablePacket(id)) return;
  if (SELECTED_EXTRA_PACKETS.includes(id)) SELECTED_EXTRA_PACKETS = SELECTED_EXTRA_PACKETS.filter((x) => x !== id);
  else SELECTED_EXTRA_PACKETS = [...SELECTED_EXTRA_PACKETS, id];
  renderExtraPackPicker();
  renderJoinPickers();
  pushGuestPref();
}

/** 渲染加入方的「个人叠加扩展包」面板：展示房主基础包 + 可叠加的扩展包开关 */
export function renderExtraPackPicker(): void {
  const box = document.getElementById('extraPackPanel');
  if (!box) return;
  const base = REMOTE_BASE_PACKET;
  const baseName = packetName(base);
  const baseFree = base === 'all';
  // 年级扩展包（初中 / 高中）已移除，PACKETS 只保留 'all'；
  // 此处必须过滤掉协议中仍可能出现的 junior / senior，否则 PACKETS.find 为 undefined 会抛错。
  const toggles = (['junior', 'senior', 'all'] as PacketId[])
    .filter((id) => PACKETS.some((x) => x.id === id))
    .map((id) => {
      const on = SELECTED_EXTRA_PACKETS.includes(id);
      const enabled = canEnablePacket(id);
      const p = PACKETS.find((x) => x.id === id)!;
      const badge = packStateBadge(id);
      const lockedCls = enabled ? '' : ' pk-locked';
      return `<button class="opt-btn ${on ? 'active' : ''}${lockedCls}" data-epacket="${id}" onclick="toggleExtraPacket('${id}')">${p.icon} ${p.name}<small>叠加到 ${baseName} 之上</small><div class="pk-badges">${badge}</div></button>`;
    })
    .join('');
  const eff = effectiveCharPool(base, SELECTED_EXTRA_PACKETS);
  box.innerHTML = `
    <h3>◈ 扩展包 · 个人叠加 ◈ <span style="font-size:10px;color:var(--muted);font-weight:400;letter-spacing:0;">（房主基础包：${baseName}${baseFree ? '（免费）' : '（房主已选）'}；你可叠加启用自己的扩展包，不受房主限制）</span></h3>
    <div class="opt-row" id="extraPackPicker">${toggles}</div>
    <div class="scope-hint" id="extraPackHint">本局你的可选角色池共 <b>${eff.length}</b> 名（基础 + 已叠加扩展包）</div>`;
}

/** 渲染加入方专用选择器（使用全量角色池，不限定年级） */
export function renderJoinPickers(): void {
  const fp = document.getElementById('joinFactionPicker');
  if (fp) {
    fp.innerHTML = Object.entries(FACTIONS)
      .map(
        ([k, f]) =>
          `<div class="faction-card ${k === SELECTED_FACTION ? 'selected' : ''}" style="border-color:${f.color};color:${f.color};${k === SELECTED_FACTION ? 'box-shadow:0 0 16px ' + f.color : ''}" onclick="selectFaction('${k}')">
          <div class="f-icon">${f.icon}</div>
          <div class="f-name" style="color:${f.color};">${f.name}</div>
          <div class="f-desc">主公技：${f.lordSkill.name}</div></div>`,
      )
      .join('');
  }
  const cg = document.getElementById('joinCharGrid');
  if (cg) {
    // 加入方可选角色 = 房主基础包 ∪ 自己叠加启用的扩展包
    const pool = effectiveCharPool(REMOTE_BASE_PACKET, SELECTED_EXTRA_PACKETS).filter(
      (c) => c.faction === SELECTED_FACTION,
    );
    if (!SELECTED_CHAR || !pool.some((c) => c.id === SELECTED_CHAR!.id)) SELECTED_CHAR = pool[0] ?? null;
    cg.innerHTML = pool
      .map((c) => {
        const f = FACTIONS[c.faction];
        const sel = SELECTED_CHAR && SELECTED_CHAR.id === c.id;
        return `<div class="char-card ${sel ? 'selected' : ''}" style="border-color:${f.color};color:${f.color};${sel ? 'box-shadow:0 0 16px ' + f.color : ''}" onclick="selectChar('${c.id}')">
          <div class="faction-badge" style="color:${f.color};">${f.icon}</div>
          <div class="ctop"><span class="cavatar">${c.avatar}</span><div><div class="cname" style="color:${f.color};">${c.name}</div><div class="ctitle">${c.title}</div></div></div>
          <div class="csubject" style="color:${f.color};">${f.name} · 体力${c.hp}</div>
          <div class="cskill">${c.talents.map((s) => `<b>${s.name}</b>：${s.desc}`).join('<br>')}</div>
          </div>`;
      })
      .join('');
  }
}

/** 加入方选择阵营 / 角色后，把偏好同步给房主 */
export function pushGuestPref(): void {
  if (SELECTED_MODE !== 'join') return;
  if (NET.isHost) return; // 仅客户端发送
  NET.sendToHost({
    type: 'guest_pref',
    pref: {
      faction: SELECTED_FACTION,
      charId: SELECTED_CHAR ? SELECTED_CHAR.id : null,
      // 联机配装同步：上报本局携带的装备与道具，以及已解锁装备列表供房主校验
      loadout: PROFILE.loadout,
      unlockedEquips: PROFILE.unlockedEquips,
      // 个人叠加启用的扩展包（已付费/已用免费额度），房主据此在基础包之上追加角色池
      packets: SELECTED_EXTRA_PACKETS.slice(),
      // 牌库扩展包（与角色扩展包相互独立）：房主据此与自身选择取并集后合成牌堆
      cardPacks: SELECTED_CARD_PACKS.filter((p) => p !== 'core'),
    },
  });
  renderJoinPickers();
}

/* ==================== 二级菜单 / 子界面导航 ==================== */
const MODE_TITLE: Record<'single' | 'host' | 'join', string> = {
  single: '单机对局设置',
  host: '联机房主设置',
  join: '加入房间',
};

/** 进入对局设置子界面（选定模式后） */
export function enterSetup(mode: 'single' | 'host' | 'join'): void {
  SELECTED_MODE = mode;
  pickRandomCharIfNotChosen(); // 随机模式下进入设置即派发并展示随机角色（开局前可见）
  updateLobbyMode();
  renderSetupSummary();
  document.getElementById('screenLobby')!.classList.remove('active');
  document.getElementById('screenSetup')!.classList.add('active');
  // 非加入方（单机 / 房主）不存在个人叠加，清空残留；加入方渲染个人叠加面板并同步偏好
  if (mode !== 'join') SELECTED_EXTRA_PACKETS = [];
  if (mode === 'join') {
    renderExtraPackPicker();
    pushGuestPref();
  }
  Sound.play('click');
}

/** 返回主界面 */
export function backToLobby(): void {
  Sound.play('click');
  document.getElementById('screenSetup')!.classList.remove('active');
  document.getElementById('screenLobby')!.classList.add('active');
  renderSetupSummary();
}

/** 主界面配置摘要：只显示设置后的结果 */
export function renderSetupSummary(): void {
  const box = document.getElementById('setupSummary');
  if (!box) return;
  const faction = FACTIONS[SELECTED_FACTION];
  const roleName = SELECTED_ROLE === 'random' ? '随机' : ROLES[SELECTED_ROLE].name;
  const charName = SELECTED_CHAR ? `${SELECTED_CHAR.avatar} ${SELECTED_CHAR.name}` : '未选择';
  const modeName =
    SELECTED_MODE === 'single' ? '单机对局' : SELECTED_MODE === 'host' ? '创建房间' : '加入房间';
  box.innerHTML = `
    <div class="sum-row"><span class="sum-k">模式</span><b>${modeName}</b></div>
    <div class="sum-row"><span class="sum-k">人数</span><b>${SELECTED_COUNT} 人</b>（含 ${SELECTED_COUNT - 1} 名 AI）</div>
    <div class="sum-row"><span class="sum-k">身份</span><b>${roleName}</b></div>
    <div class="sum-row"><span class="sum-k">阵营</span><b style="color:${faction.color}">${faction.icon} ${faction.name}</b></div>
    <div class="sum-row"><span class="sum-k">角色</span><b>${charName}</b></div>
    <div class="sum-tip">选择上方任一模式即进入设置界面修改</div>`;
}

/** 个人信息（点头像）：我的档案 + 个性化资料 合并弹窗 */
export function openProfileMenu(): void {
  Sound.play('click');
  showAchievements(PROFILE, '我的档案', { editor: true });
  renderProfileEditor(); // 填充档案弹窗内的编辑器容器
}

/* ==================== 自定义扩展包管理 ==================== */

/** 联机加入方不可用自定义扩展包（仅房主/单机生效） */
function packDisabledHint(): string {
  if (SELECTED_MODE === 'join') {
    return '<div class="bank-info warn">⚠️ 你正在「加入服务器」，自定义扩展包仅房主 / 单机可用。加入后由房主统一携带。</div>';
  }
  return '';
}

export function openPackMenu(): void {
  Sound.play('click');
  renderPackList();
  document.getElementById('packModal')!.classList.add('show');
}

export function closePackMenu(): void {
  document.getElementById('packModal')!.classList.remove('show');
}

export function renderPackList(): void {
  const box = document.getElementById('packList');
  if (!box) return;
  const packs = getInstalledPacks();
  if (SELECTED_MODE === 'join') {
    box.innerHTML = packDisabledHint() + '<div class="bank-info">暂无（加入服务器时不显示自定义扩展包）</div>';
    return;
  }
  if (!packs.length) {
    box.innerHTML = '<div class="bank-info">尚未安装任何扩展包。<br>点下方「导入本地文件」或「从 URL 加载」，或用「🧩 编辑器」自制。</div>';
    return;
  }
  box.innerHTML = packs
    .map((p) => {
      const nC = (p.characters || []).length;
      const nK = (p.cards || []).length;
      return `<div class="pack-item">
        <label class="pack-enable"><input type="checkbox" ${p.enabled ? 'checked' : ''} onchange="togglePack('${p.id}')"> 启用</label>
        <div class="pack-meta">
          <b>${escapeHtml(p.name)}</b> <span class="pack-id">${escapeHtml(p.id)}</span>
          <span class="pack-counts">角色 ${nC} · 锦囊 ${nK}</span>
          ${p.author ? `<span class="pack-author">by ${escapeHtml(p.author)}</span>` : ''}
        </div>
        <div class="pack-desc">${escapeHtml(p.desc || '')}</div>
        <div class="pack-actions">
          <button class="btn btn-sm" onclick="editPackFromMenu('${p.id}')">✏️ 编辑</button>
          <button class="btn btn-sm" onclick="removePackConfirm('${p.id}')">🗑️ 移除</button>
        </div>
      </div>`;
    })
    .join('');
}

export function togglePack(id: string): void {
  const p = getInstalledPacks().find((x) => x.id === id);
  if (!p) return;
  setPackEnabled(id, !p.enabled);
  renderPackList();
  // 角色池变化：刷新选将 / 阵营 / 扩展包展示
  renderCharPicker();
  renderFactionPicker();
  renderPacketPicker();
}

export function removePackConfirm(id: string): void {
  const p = getInstalledPacks().find((x) => x.id === id);
  if (!p) return;
  if (!confirm(`确认移除扩展包「${p.name}」？该操作不可恢复（已落盘内容会删除）。`)) return;
  removePack(id);
  renderCharPicker();
  renderFactionPicker();
  renderPacketPicker();
  renderPackList();
}

export function clearAllPacksConfirm(): void {
  if (!confirm('确认清空全部自定义扩展包？')) return;
  clearAllPacks();
  renderCharPicker();
  renderFactionPicker();
  renderPacketPicker();
  renderPackList();
}

export function importPackFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const r = installPackFromText(String(reader.result ?? ''));
    if (r.ok) {
      renderPackList();
      renderCharPicker();
      renderFactionPicker();
      alert(`✅ 扩展包「${r.pack!.name}」已安装并启用\n\n告警：${r.warnings.length ? r.warnings.join('\n') : '无'}`);
    } else {
      alert('❌ 安装失败：\n' + r.errors.join('\n'));
    }
    input.value = '';
  };
  reader.readAsText(file);
}

export function loadPackFromUrl(): void {
  const v = inputValue('packUrlInput').trim();
  if (!v) {
    alert('请输入扩展包 URL（.json）');
    return;
  }
  fetch(v)
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then((t) => {
      const r = installPackFromText(t);
      if (r.ok) {
        renderPackList();
        renderCharPicker();
        renderFactionPicker();
        alert(`✅ 扩展包「${r.pack!.name}」已安装并启用`);
      } else {
        alert('❌ 安装失败：\n' + r.errors.join('\n'));
      }
    })
    .catch((e) => alert('❌ 加载失败：' + (e as Error).message));
}

/** 编辑指定 id 的已安装包（无 id 则新建空白包） */
export function editPackFromMenu(id?: string): void {
  openPackEditor(id);
}

/* ==================== 固定顶栏 / 个人成就 / 设置抽屉 ==================== */
export function renderTopBar(): void {
  const lv = currentTier(PROFILE);
  const nx = nextTier(PROFILE);
  const av = document.getElementById('tbAvatar');
  const nm = document.getElementById('tbName');
  const lvEl = document.getElementById('tbLevel');
  const sc = document.getElementById('tbScore');
  const pg = document.getElementById('tbProgress');
  if (av) av.textContent = PROFILE.avatar || DEFAULT_AVATAR;
  if (nm) nm.textContent = PROFILE.name || '玩家';
  if (lvEl) {
    lvEl.textContent = lv.name;
    lvEl.dataset.realm = lv.id;
  }
  if (sc) sc.textContent = `${PROFILE.exp} 修为`;
  if (pg) {
    const pct = realmBarPct(PROFILE);
    const bt = bottleneckText(PROFILE);
    const tip = !nx
      ? '已至渡劫 · 羽化可期'
      : bt
        ? `⚠ 瓶颈未破：${bt}`
        : `距「${nx.name}」还需 ${Math.max(0, nx.min - PROFILE.exp)} 修为`;
    pg.style.width = `${pct}%`;
    pg.classList.toggle('bottleneck', !!bt);
    const prog = pg.parentElement as HTMLElement | null;
    if (prog) prog.title = tip;
  }
}

export function renderAchievements(): void {
  const grid = document.getElementById('achGrid');
  const sum = document.getElementById('achSummary');
  if (!grid) return;
  const got = ACHIEVEMENTS.filter((a) => (PROFILE.achievements || {})[a.id]);
  if (sum) sum.textContent = `已解锁 ${got.length}/${ACHIEVEMENTS.length}`;
  // 按当前用户实际成就状态展示：已解锁彩色高亮，未解锁灰化并显示解锁条件
  grid.innerHTML = ACHIEVEMENTS.map((a) => {
    const has = !!(PROFILE.achievements || {})[a.id];
    return `<div class="ach-item ${has ? 'unlocked' : 'locked'}" title="${escapeHtml(a.desc || '')}">
      <div class="ai">${has ? a.icon : '🔒'}</div>
      <div class="an">${escapeHtml(a.name)}</div>
      <div class="ap">${has ? '已解锁' : escapeHtml(a.desc || '')}</div></div>`;
  }).join('');
}



export function updateLobbyMode(): void {
  const hc = document.getElementById('hostConfig')!;
  const jc = document.getElementById('joinConfig')!;
  const np = document.getElementById('netModePanel')!;
  const sb = document.getElementById('startBtn') as HTMLButtonElement | null;
  const rc = document.getElementById('roomConfig');
  const title = document.getElementById('setupTitle');
  // 自定义扩展包「仅单机 / 房主」可用：联机加入方关闭
  setCustomAllowed(SELECTED_MODE !== 'join');
  if (title) title.textContent = MODE_TITLE[SELECTED_MODE];
  // 联机方式二选一只在联机模式显示
  np.style.display = SELECTED_MODE === 'single' ? 'none' : 'block';
  if (SELECTED_MODE === 'single') {
    hc.style.display = 'block';
    jc.style.display = 'none';
    if (rc) rc.style.display = 'none';
    if (sb) {
      sb.textContent = '开始单机对局';
      sb.onclick = startSingle;
      sb.style.display = 'block';
    }
  } else if (SELECTED_MODE === 'host') {
    hc.style.display = 'block';
    jc.style.display = 'none';
    if (rc) rc.style.display = 'block';
    if (sb) sb.style.display = 'none';
  } else {
    hc.style.display = 'none';
    jc.style.display = 'block';
    if (rc) rc.style.display = 'none';
    if (sb) sb.style.display = 'none';
    renderJoinPickers();
  }
}

/** 联机建立 / 加入 二选一 */
export function setNetMode(net: 'host' | 'join'): void {
  Sound.play('click');
  document.querySelectorAll('#netModePicker .opt-btn').forEach((x) => x.classList.remove('active'));
  const btn = document.querySelector(`#netModePicker .opt-btn[data-net="${net}"]`) as HTMLElement | null;
  if (btn) btn.classList.add('active');
  // 切换联机方式：把模式切到 host / join
  enterSetup(net === 'host' ? 'host' : 'join');
}

export function updateAIHint(): void {
  const h = document.getElementById('aiCountHint');
  if (!h) return;
  // AI 位 = 总人数 − 真人已加入人数（房主 + 已加入客人），随人数调整即时变化
  const ai = Math.max(0, SELECTED_COUNT - joinedHumans());
  h.textContent = ai > 0 ? `将补充 ${ai} 名 AI` : '真人已满，无 AI 位';
}

/** 保证当前选角在阵营池内合法 */
export function ensureCharValid(): void {
  const pool = mergedCharPool(SELECTED_PACKET).filter((c) => c.faction === SELECTED_FACTION);
  if (!pool.length) {
    const allPool = mergedCharPool(SELECTED_PACKET);
    if (allPool.length) {
      SELECTED_FACTION = allPool[0].faction;
      SELECTED_CHAR = allPool[0];
    }
    return;
  }
  if (!SELECTED_CHAR || !pool.some((c) => c.id === SELECTED_CHAR!.id)) SELECTED_CHAR = pool[0];
}

/** 随机模式预览角色：未手动选择时按当前扩展包随机派发；一次预览后保持稳定，保证开局「所见即所得」 */
export function randomPreviewChar(): Character | null {
  if (USER_CHOSEN) return SELECTED_CHAR;
  const pool = mergedCharPool(SELECTED_PACKET);
  if (!pool.length) return null;
  if (RANDOM_CHAR && pool.some((c) => c.id === RANDOM_CHAR!.id)) return RANDOM_CHAR;
  const fset = [...new Set(pool.map((c) => c.faction))];
  const faction = fset[Math.floor(Math.random() * fset.length)];
  const chars = pool.filter((c) => c.faction === faction);
  RANDOM_CHAR = chars[Math.floor(Math.random() * chars.length)];
  return RANDOM_CHAR;
}

/** 未手动选择时随机派发阵营与角色（复用开局前已预览的随机角色，保证一致） */
export function pickRandomCharIfNotChosen(): void {
  if (USER_CHOSEN) return;
  const c = randomPreviewChar();
  if (!c) return;
  SELECTED_FACTION = c.faction;
  SELECTED_CHAR = c;
  renderFactionPicker();
  renderCharPicker();
}

/** 大厅选择器事件绑定（原版在脚本顶层 addEventListener） */
export function bindLobbyEvents(): void {
  // 玩家总数改为滑块（见 bindCountSlider）
  document.getElementById('modePicker')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('.mode-card') as HTMLElement | null;
    if (!b) return;
    document.querySelectorAll('#modePicker .mode-card').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const mode = (b.dataset.mode as 'single' | 'host' | 'join' | 'net') || 'single';
    // 选定模式后进入对局设置子界面（联机卡默认建立服务器档，下一屏联机方式可切换）
    enterSetup(mode === 'net' ? 'host' : mode);
  });
  // 档案变更时同步刷新顶栏 / 成就网格
  window.addEventListener('profile-updated', () => {
    renderTopBar();
    renderAchievements();
  });
}

/* ==================== 房间成员列表 ==================== */
interface RoomStateLike {
  roomCode: string;
  hostName: string;
  members: { name: string; isHost: boolean; profile: PublicProfile | null }[];
  currentCount: number;
  targetCount: number;
  /** 房主统一选的基础扩展包（加入方据此预览个人叠加） */
  packet?: string;
}

function memberListHtml(members: RoomStateLike['members'], currentCount: number, targetCount: number, tail: string): string {
  let h = `<div style="color:#f5c542;font-size:11px;margin-bottom:4px;">房间成员（${currentCount}/${targetCount}）· 点击查看成就</div>`;
  members.forEach((m) => {
    const isHost = m.isHost;
    const icon = isHost ? '👑' : '🎓';
    const tag = isHost ? '房主' : '玩家';
    const tc = isHost ? '' : 'guest';
    const pf = m.profile;
    const lv = pf ? realmNameOfPublic(pf) : '未同步';
    const safeName = escapeHtml(m.name || '玩家');
    // 个性化：头像 / 性别 / 心情（未同步档案时用默认）
    const av = pf?.avatar || DEFAULT_AVATAR;
    const gd = genderIcon(pf?.gender ?? 'hidden');
    const mood = pf?.mood ? `<span class="rm-mood">${pf.moodIcon || '🙂'} ${escapeHtml(pf.mood)}</span>` : '';
    h += `<div class="rm-item ${isHost ? 'host' : ''}" onclick="viewMemberProfile('${safeName}',${m.profile ? JSON.stringify(m.profile).replace(/"/g, '&quot;') : 'null'})">
      <span class="rm-avatar">${av}</span>
      <span class="rm-name">${safeName} <span class="rm-gender">${gd}</span>${mood}</span>
      <span class="rm-hosticon">${icon}</span>
      <span class="rm-lv">${lv}</span>
      <span class="rm-tag ${tc}">${tag}</span>
    </div>`;
  });
  return h + tail;
}

export function updateHostRoomInfo(state: RoomStateLike): void {
  const info = document.getElementById('roomInfo');
  const ml = document.getElementById('hostMemberList');
  const sb = document.getElementById('hostStartBtn');
  const cb = document.getElementById('closeRoomBtn');
  const crb = document.getElementById('createRoomBtn');
  if (!info) return;
  info.innerHTML = `<div style="font-size:14px;letter-spacing:2px;margin-bottom:4px">房间号：<span style="font-size:20px;color:#f5c542;">${state.roomCode}</span></div>
    <div style="font-size:11px;color:#a89880">已加入：<b style="color:#f5c542">${state.currentCount}</b> / ${state.targetCount} 人</div>`;
  // 建房成功：信息行从「居中（创建房间按钮）」切换为「房间号左 + 按钮组右」
  info.parentElement?.classList.add('has-room');
  ml!.style.display = 'block';
  ml!.innerHTML = memberListHtml(state.members, state.currentCount, state.targetCount, '');
  sb!.style.display = 'block';
  cb!.style.display = 'inline-block';
  crb!.style.display = 'none';
  renderSeatPanel();
  syncCountSliderBounds(); // 已加入人数变化时同步人数下限
}

export function updateGuestRoomInfo(state: RoomStateLike): void {
  const st = document.getElementById('joinStatus');
  const ml = document.getElementById('guestMemberList');
  const lb = document.getElementById('leaveRoomBtn');
  const jb = document.getElementById('joinRoomBtn');
  if (!st) return;
  st.innerHTML = `<span style="color:#27ae60;">✅ 已连接房主：${escapeHtml(state.hostName)}</span>`;
  ml!.style.display = 'block';
  ml!.innerHTML = memberListHtml(
    state.members,
    state.currentCount,
    state.targetCount,
    '<div style="font-size:10px;color:#a89880;margin-top:6px;text-align:center">等待房主开始游戏…</div>',
  );
  lb!.style.display = 'inline-block';
  jb!.style.display = 'none';
  // 记录房主统一选的基础包，使个人叠加选项与可选角色池与房主一致
  if (state.packet) REMOTE_BASE_PACKET = state.packet as PacketId;
  renderExtraPackPicker();
  renderJoinPickers();
  renderSeatPanel();
  // 连接已建立：补发偏好（含局前配装与叠加扩展包），确保房主开局时收到（此前未连接时的发送会丢失）
  pushGuestPref();
}

/* ==================== 座位分配（默认随机 / 手动调整） ==================== */

/** 座主代他人调整时选中的成员 peerId（null 表示未选中） */
let seatPicking: string | null = null;

/** 渲染座位表：下标即座位号，缺位由 AI 补齐 */
export function renderSeatPanel(): void {
  const box = document.getElementById(NET.isHost ? 'hostSeatList' : 'guestSeatList');
  if (!box) return;
  if (!NET.isHost && !NET.seats.length) return; // 客人尚未收到座位表
  // 房主端取「目标人数」与已占座位数的较大值；客人端以房主同步来的座位表长度为准（房主权威），
  // 避免客人本地人数（与房主无关）导致 AI 空位数与房主不一致
  const total = NET.isHost ? Math.max(SELECTED_COUNT, NET.seats.length) : NET.seats.length;
  const myId = NET.myPeerId || '';
  const isHost = NET.isHost;
  const rows: string[] = [];
  const filledCount = NET.seats.filter(Boolean).length;
  for (let i = 0; i < total; i++) {
    const s = NET.seats[i] || null;
    const mine = !!s && s.peerId === myId;
    const member = s ? NET.roomMembers.find((m) => m.peerId === s.peerId) : null;
    const tag = s ? (member?.isHost ? '👑 房主' : '🎓 玩家') : '🤖 AI 补齐';
    const av = member?.profile?.avatar || (s ? DEFAULT_AVATAR : '🤖');
    const cls = s ? 'seat-slot filled' : 'seat-slot empty';
    const mineTag = mine ? '<span class="seat-mine">我</span>' : '';
    // 座主可为任意成员指定新座位（✥ = 调整此人）；未选中时点击行 = 自己换到该座位
    const fix = isHost && s && s.peerId !== myId
      ? `<button class="seat-fix ${seatPicking === s.peerId ? 'on' : ''}" onclick="event.stopPropagation();pickSeatMember('${s.peerId}')">✥</button>`
      : '';
    rows.push(
      `<div class="${cls}" onclick="requestSeatMove(${i})"><span class="seat-no">${i + 1}</span><span class="seat-av">${av}</span>` +
        `<span class="seat-name">${escapeHtml(s ? s.name : '空位')}${mineTag}</span><span class="seat-tag">${tag}</span>${fix}</div>`,
    );
  }
  const hostTools = isHost
    ? `<div class="seat-tools"><button class="btn btn-sm" onclick="randomizeSeats()">🎲 随机分配</button>` +
      `<span class="seat-tip">${seatPicking ? '已选中成员，点击目标座位完成移动' : '点行=自己换座；点 ✥ 可帮其他成员换座'}</span></div>`
    : `<div class="seat-tools"><span class="seat-tip">点击任意座位即可与该座位玩家互换；空位可直接落座</span></div>`;
  box.innerHTML =
    `<div class="seat-head">🪑 座位分配（真人 ${filledCount}/${total}）· 默认随机，可自行调整</div>` +
    `<div class="seat-list">${rows.join('')}</div>` +
    hostTools;
}

/** 座主：选中某成员，随后点击目标座位即可把 TA 移过去 */
export function pickSeatMember(peerId: string): void {
  if (!NET.isHost) return;
  Sound.play('click');
  seatPicking = seatPicking === peerId ? null : peerId;
  renderSeatPanel();
}

/** 玩家请求换座：自己 ↔ 目标座位；座主若已选中某成员则改为移动该成员 */
export function requestSeatMove(toIndex: number): void {
  Sound.play('click');
  if (NET.isHost) {
    if (seatPicking) {
      // 座主代他人调整
      if (NET.moveSeat(seatPicking, toIndex)) seatPicking = '';
    } else if (NET.myPeerId) {
      NET.moveSeat(NET.myPeerId, toIndex);
    }
  } else {
    NET.sendToHost({ type: 'seat_move_request', toIndex });
  }
  renderSeatPanel();
}

/** 座主：全部成员重新随机落座 */
export function randomizeSeats(): void {
  if (!NET.isHost) return;
  Sound.play('click');
  seatPicking = null;
  NET.shuffleSeats();
  renderSeatPanel();
}

export function viewMemberProfile(name: string, profile: PublicProfile | null): void {
  if (!profile) {
    alert(`【${name}】尚未同步档案`);
    return;
  }
  const p = Object.assign(
    { name, exp: 0, realm: 'lianqi' as const, games: 0, wins: 0, achievements: {} },
    profile,
  ) as PublicProfile;
  showAchievements(p, `${name} 的成就`);
}

/* ==================== 个性化资料（昵称 / 头像 / 性别 / 心情） ==================== */
export function renderProfileEditor(): void {
  const box = document.getElementById('profileEditor');
  if (!box) return;
  const avatars = AVATAR_OPTIONS.map(
    (a) =>
      `<div class="pick-item ${a === PROFILE.avatar ? 'selected' : ''}" onclick="selectAvatar('${a}')">${a}</div>`,
  ).join('');
  const genders = GENDER_OPTIONS.map(
    (g) =>
      `<div class="pick-item pick-wide ${g.value === PROFILE.gender ? 'selected' : ''}" onclick="selectGender('${g.value}')">${g.icon} ${g.label}</div>`,
  ).join('');
  const icons = MOOD_ICON_OPTIONS.map(
    (i) =>
      `<div class="pick-item ${i === PROFILE.moodIcon ? 'selected' : ''}" onclick="selectMoodIcon('${i}')">${i}</div>`,
  ).join('');
  box.innerHTML = `
    <div class="pe-row">
      <label class="pe-label">昵称</label>
      <input type="text" id="profileNameInput" class="pe-input" maxlength="12" placeholder="给自己起个名字" value="${escapeHtml(PROFILE.name || '')}">
    </div>
    <div class="pe-row"><label class="pe-label">头像</label><div class="pick-grid" id="avatarGrid">${avatars}</div></div>
    <div class="pe-row"><label class="pe-label">性别</label><div class="pick-grid pick-grid-3">${genders}</div></div>
    <div class="pe-row">
      <label class="pe-label">心情</label>
      <input type="text" id="moodInput" class="pe-input" maxlength="24" placeholder="一句话心情（联机可见）" value="${escapeHtml(PROFILE.mood || '')}">
    </div>
    <div class="pe-row"><label class="pe-label">心情图标</label><div class="pick-grid" id="moodIconGrid">${icons}</div></div>
  `;
  const nameEl = document.getElementById('profileNameInput') as HTMLInputElement | null;
  nameEl?.addEventListener('input', () => {
    const v = (nameEl.value || '').trim().slice(0, 12);
    if (v) {
      setters.setName(v);
      refreshProfileUI();
    }
  });
  const moodEl = document.getElementById('moodInput') as HTMLInputElement | null;
  moodEl?.addEventListener('input', () => {
    setters.setMood(moodEl.value || '');
    refreshProfileUI();
  });
}

export function selectAvatar(v: string): void {
  Sound.play('click');
  setters.setAvatar(v);
  renderProfileEditor();
  refreshProfileUI();
}

export function selectGender(v: Gender): void {
  Sound.play('click');
  setters.setGender(v);
  renderProfileEditor();
  refreshProfileUI();
}

export function selectMoodIcon(v: string): void {
  Sound.play('click');
  setters.setMoodIcon(v);
  renderProfileEditor();
  refreshProfileUI();
}

/* ==================== 玩家总数滑块 ==================== */

/** 房间内真人总数（含房主）；非房主场景为 1（仅自己） */
function joinedHumans(): number {
  if (NET.mode === 'host' && NET.isHost) {
    return Math.max(1, NET.roomMembers.length, NET.seats.filter(Boolean).length);
  }
  return 1;
}

/** 人数下限：联机建房后不得低于已加入人数，且至少 2 人 */
export function minPlayerCount(): number {
  return Math.max(2, Math.min(8, joinedHumans()));
}

/**
 * 把座位表调整到目标人数：真人座位尽量保留原位（放不下的挪到空位），
 * 其余由 AI 空位补齐 —— 即 AI 位随总数即时增减。
 */
function resizeSeats(target: number): void {
  type Slot = NonNullable<(typeof NET)['seats'][number]>;
  const humans = NET.seats
    .map((s, i) => ({ s, i }))
    .filter((x): x is { s: Slot; i: number } => !!x.s);
  const arr: (Slot | null)[] = new Array(Math.max(target, humans.length)).fill(null);
  const spill: Slot[] = [];
  for (const { s, i } of humans) {
    if (i < arr.length) arr[i] = s;
    else spill.push(s);
  }
  for (const s of spill) {
    const free = arr.indexOf(null);
    if (free >= 0) arr[free] = s;
  }
  NET.seats = arr;
}

export function setPlayerCount(n: number): void {
  const min = minPlayerCount();
  const v = Math.max(min, Math.min(8, Math.round(n)));
  SELECTED_COUNT = v;
  const slider = document.getElementById('countSlider') as HTMLInputElement | null;
  if (slider) {
    slider.min = String(min); // 建房后滑块不可拖到已加入人数以下
    slider.value = String(v);
  }
  const label = document.getElementById('countValue');
  if (label) label.textContent = v + ' 人';
  updateAIHint();
  renderRolePicker();
  renderSeatPanel();
  if (NET.isHost && NET.mode === 'host') {
    resizeSeats(v); // AI 位随总数即时增减（真人座位保留）
    NET.broadcastSeats(); // 座位表（含 AI 空位）同步给客人
    NET.broadcastRoomState(); // 「已加入 X / Y 人」同步给客人
  }
  saveSetupPrefs();
  Sound.play('click');
}

/** 同步人数滑块下限：建房后随加入人数变化（有人加入则下限提高，有人退出则回落） */
export function syncCountSliderBounds(): void {
  const slider = document.getElementById('countSlider') as HTMLInputElement | null;
  if (!slider) return;
  const min = minPlayerCount();
  slider.min = String(min);
  if (Number(slider.value) < min) setPlayerCount(min);
}

export function bindCountSlider(): void {
  const slider = document.getElementById('countSlider') as HTMLInputElement | null;
  if (!slider) return;
  slider.value = String(SELECTED_COUNT);
  const label = document.getElementById('countValue');
  if (label) label.textContent = SELECTED_COUNT + ' 人';
  slider.addEventListener('input', () => {
    setPlayerCount(Number(slider.value));
  });
}


