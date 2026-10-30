/* ==================== 个人档案 / 修为境界 / 成就 / 结算 ==================== */
import type {
  Achievement,
  Gender,
  PlayerIdentity,
  Profile,
  PublicProfile,
  Realm,
} from '../core/types';
import { escapeHtml } from '../core/dom';
import { REALM_LABEL } from '../core/mode';
import { showSettle } from '../ui/settle';
import { G } from '../game/state';
import { addLog } from '../game/log';
import { NET } from '../net/network';
import {
  REALM_TIERS,
  bottleneckText,
  checkBreakthrough,
  currentTier,
  nextTier,
  playBreakthrough,
  tierOfExp,
  type RealmLike,
} from './realm';

/** 存档 key：沿用旧名以保证老玩家档案可读（v1 结构内的 score 会自动折算为 exp） */
const PROFILE_KEY = 'xuetangsha_profile_v1';

/* ==================== 修为结算常量 ==================== */
/** 胜利基础修为 */
export const EXP_WIN = 120;
/** 败北基础修为 */
export const EXP_LOSE = 40;
/** 每击杀 1 名角色的修为 */
export const EXP_PER_KILL = 15;
/** 连胜加成：连胜 n（n≥2）时 +(n-1)×步进，最多 3 级 */
export const EXP_STREAK_STEP = 20;
export const EXP_STREAK_MAX_STEP = 3;
/** 主公获胜加成 */
export const EXP_LORD_BONUS = 30;
/** 内奸获胜加成（独赢最难，加成最高） */
export const EXP_SPY_BONUS = 40;
/** 每解锁 1 个新成就的修为 */
export const EXP_PER_ACH = 30;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ==================== 个性化选项 ==================== */
export const DEFAULT_AVATAR = '🧑‍🎓';
export const DEFAULT_MOOD_ICON = '🙂';

/** 可选头像（emoji） */
export const AVATAR_OPTIONS: string[] = [
  '🧑‍🎓','👦','👧','🧒','👨‍🏫','👩‍🏫','🧑‍🏫','👨‍🎓','👩‍🎓','🧑‍🔬','👨‍🔬','👩‍🔬',
  '🧑‍🎨','👨‍🎤','🧑‍💻','🦸','🦹','🧙','🧝','🤴','👸','🥷','🕵️','🧑‍🚀',
];

/** 可选心情图标（emoji） */
export const MOOD_ICON_OPTIONS: string[] = [
  '🙂','😀','😎','🤔','😤','🥳','😴','🤯','🥰','😭','🤡','👻',
  '💪','🔥','🌟','🍀','🎯','📚','✏️','🎧','☕','🌙','⚡','🏆',
];

/** 性别选项：值 / 显示名 / 图标 */
export const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: '男生', icon: '👦' },
  { value: 'female', label: '女生', icon: '👧' },
  { value: 'hidden', label: '保密', icon: '🕶️' },
];

export function genderIcon(g: Gender): string {
  return GENDER_OPTIONS.find((x) => x.value === g)?.icon ?? '🕶️';
}

export function genderLabel(g: Gender): string {
  return GENDER_OPTIONS.find((x) => x.value === g)?.label ?? '保密';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', name: '初入江湖', desc: '完成第一局游戏', icon: '🎒' },
  { id: 'first_win', name: '首战告捷', desc: '赢得第一场胜利', icon: '🏆' },
  { id: 'win_3', name: '连胜三场', desc: '取得3连胜', icon: '🔥' },
  { id: 'win_5', name: '五连绝胜', desc: '取得5连胜', icon: '🎯' },
  { id: 'lord_win', name: '君临天下', desc: '以主公身份获胜', icon: '👑' },
  { id: 'rebel_win', name: '揭竿而起', desc: '以反贼身份获胜', icon: '⚔️' },
  { id: 'spy_win', name: '暗度陈仓', desc: '以内奸身份获胜', icon: '🦊' },
  { id: 'kill_3', name: '杀伐果断', desc: '单局击杀3名角色', icon: '💀' },
  { id: 'kill_5', name: '伏尸百万', desc: '单局击杀5名角色', icon: '☠️' },
  { id: 'games_50', name: '阅尽千帆', desc: '累计完成50局', icon: '📖' },
  { id: 'win_20', name: '百战功成', desc: '累计取得20场胜利', icon: '🗡️' },
  { id: 'realm_yuanying', name: '元婴大成', desc: '境界突破至元婴', icon: '🪷' },
  { id: 'realm_huashen', name: '化神显圣', desc: '境界突破至化神', icon: '🌌' },
  { id: 'realm_lianxu', name: '炼虚合道', desc: '境界突破至炼虚', icon: '✨' },
  { id: 'realm_dujie', name: '天劫加身', desc: '境界突破至渡劫', icon: '🐉' },
];

function defaultProfile(): Profile {
  return {
    name: '玩家',
    exp: 0,
    realm: REALM_TIERS[0].id,
    games: 0,
    wins: 0,
    winStreak: 0,
    bestStreak: 0,
    achievements: {},
    avatar: DEFAULT_AVATAR,
    gender: 'hidden',
    mood: '',
    moodIcon: DEFAULT_MOOD_ICON,
    themeMode: 'night',
    themeStyle: 'gold',
    // 已解锁（购买）内容
    unlockedChars: [],
    unlockedEquips: [],
    items: {},
    // 局前配装
    loadout: { weapon: null, armor: null, horsePlus: null, horseMinus: null, items: {} },
    newbieGift: false,
    // 扩展包每日免费使用计数（三包共享，每天 3 次，跨日重置）
    packUsage: { date: todayStr(), used: 0 },
  };
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>;
      // 旧档案兼容：原 score（积分）直接折算为 exp（修为），境界按修为回推
      const legacyScore = (p as unknown as { score?: number }).score;
      const exp = typeof p.exp === 'number' ? p.exp : typeof legacyScore === 'number' ? legacyScore : 0;
      return Object.assign(defaultProfile(), p, {
        exp,
        realm: p.realm || tierOfExp(exp).id,
        achievements: p.achievements || {},
        // 兼容旧档案：补齐个性化字段
        avatar: p.avatar || DEFAULT_AVATAR,
        gender: p.gender ?? 'hidden',
        mood: typeof p.mood === 'string' ? p.mood : '',
        moodIcon: p.moodIcon || DEFAULT_MOOD_ICON,
        unlockedChars: Array.isArray(p.unlockedChars) ? p.unlockedChars : [],
        unlockedEquips: Array.isArray(p.unlockedEquips) ? p.unlockedEquips : [],
        items: p.items && typeof p.items === 'object' ? p.items : {},
        loadout: p.loadout && typeof p.loadout === 'object'
          ? {
              weapon: p.loadout.weapon ?? null,
              armor: p.loadout.armor ?? null,
              horsePlus: p.loadout.horsePlus ?? null,
              horseMinus: p.loadout.horseMinus ?? null,
              items: p.loadout.items && typeof p.loadout.items === 'object' ? p.loadout.items : {},
            }
          : { weapon: null, armor: null, horsePlus: null, horseMinus: null, items: {} },
        newbieGift: typeof p.newbieGift === 'boolean' ? p.newbieGift : false,
        // 兼容旧档案：补扩展包每日免费计数器
        packUsage:
          p.packUsage && typeof p.packUsage === 'object' && typeof p.packUsage.date === 'string'
            ? { date: p.packUsage.date, used: p.packUsage.used || 0 }
            : { date: todayStr(), used: 0 },
      });
    }
  } catch (e) {
    /* ignore */
  }
  return defaultProfile();
}

export let PROFILE: Profile = loadProfile();

export function saveProfile(): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(PROFILE));
  } catch (e) {
    /* ignore */
  }
}

/** 当前境界阶位（供 UI 复用，定义见 profile/realm.ts） */
export function profileTier() {
  return currentTier(PROFILE);
}

/** 下一阶（渡劫为顶点返回 null） */
export function profileNextTier() {
  return nextTier(PROFILE);
}

export function publicProfile(): PublicProfile {
  return {
    name: PROFILE.name,
    avatar: PROFILE.avatar || DEFAULT_AVATAR,
    gender: PROFILE.gender ?? 'hidden',
    mood: PROFILE.mood || '',
    moodIcon: PROFILE.moodIcon || DEFAULT_MOOD_ICON,
    exp: PROFILE.exp,
    realm: currentTier(PROFILE).id,
    games: PROFILE.games,
    wins: PROFILE.wins,
    achievements: PROFILE.achievements || {},
    bestStreak: PROFILE.bestStreak || 0,
  };
}

/** 本人的个性化身份（用于写入 Player.identity） */
export function localIdentity(): PlayerIdentity {
  return {
    name: PROFILE.name || '玩家',
    avatar: PROFILE.avatar || DEFAULT_AVATAR,
    gender: PROFILE.gender ?? 'hidden',
    mood: PROFILE.mood || '',
    moodIcon: PROFILE.moodIcon || DEFAULT_MOOD_ICON,
  };
}

/** 由联机同步来的档案还原个性化身份 */
export function identityFromProfile(p: PublicProfile | null): PlayerIdentity | null {
  if (!p) return null;
  return {
    name: p.name || '玩家',
    avatar: p.avatar || DEFAULT_AVATAR,
    gender: p.gender ?? 'hidden',
    mood: p.mood || '',
    moodIcon: p.moodIcon || DEFAULT_MOOD_ICON,
  };
}

/* ==================== 个性化资料编辑 ==================== */
function setName(v: string): void {
  PROFILE.name = v.slice(0, 12);
  saveProfile();
}

function setAvatar(v: string): void {
  PROFILE.avatar = v;
  saveProfile();
}

function setGender(v: Gender): void {
  PROFILE.gender = v;
  saveProfile();
}

function setMood(v: string): void {
  PROFILE.mood = v.slice(0, 24);
  saveProfile();
}

function setMoodIcon(v: string): void {
  PROFILE.moodIcon = v;
  saveProfile();
}

export const setters = { setName, setAvatar, setGender, setMood, setMoodIcon };

export function achCount(p: Profile | PublicProfile): number {
  return Object.keys((p && p.achievements) || {}).length;
}

/** 当前境界 → 下一境界的修为进度百分比（满级或卡瓶颈时为 100） */
export function realmBarPct(p: RealmLike): number {
  const cur = currentTier(p);
  const nx = nextTier(p);
  if (!nx) return 100;
  if ((p.exp || 0) >= nx.min) return 100;
  const span = Math.max(1, nx.min - cur.min);
  return Math.max(2, Math.min(100, Math.round((((p.exp || 0) - cur.min) / span) * 100)));
}

export function refreshProfileUI(): void {
  const lv = currentTier(PROFILE),
    nx = nextTier(PROFILE);
  let barPct = 100;
  if (nx) {
    const base = lv.min,
      span = Math.max(1, nx.min - base);
    barPct = Math.max(2, Math.min(100, Math.round(((PROFILE.exp - base) / span) * 100)));
  }
  const wr = PROFILE.games ? Math.round((PROFILE.wins / PROFILE.games) * 100) : 0;
  const avatar = PROFILE.avatar || DEFAULT_AVATAR;
  const mood = PROFILE.mood || '';
  const moodIcon = PROFILE.moodIcon || DEFAULT_MOOD_ICON;
  const idtip = mood ? ` ${moodIcon} ${escapeHtml(mood)}` : '';

  // 主界面名片：只展示设置后的信息
  const nc = document.getElementById('nameCard');
  if (nc) {
    nc.innerHTML = `<div class="name-card">
      <div class="nc-avatar">${avatar}</div>
      <div class="nc-main">
        <div class="nc-name">${escapeHtml(PROFILE.name || '玩家')}<span class="nc-gender">${genderIcon(PROFILE.gender ?? 'hidden')}</span></div>
        <div class="nc-level">${lv.name} · 修为 ${PROFILE.exp}${nx ? ` / ${nx.min}` : ''}</div>
        ${mood ? `<div class="nc-mood">${moodIcon} ${escapeHtml(mood)}</div>` : ''}
        <div class="nc-stats">对局 ${PROFILE.games} ｜ 胜率 ${wr}% ｜ 成就 ${achCount(PROFILE)}/${ACHIEVEMENTS.length}</div>
      </div>
    </div>`;
  }

  // 兼容：若页面仍存在旧档案卡容器则一并渲染
  const el = document.getElementById('profileCard');
  if (el) {
    el.innerHTML = `<div class="profile-card">
    <div class="profile-avatar">${PROFILE.avatar || DEFAULT_AVATAR}</div>
    <div class="profile-main">
      <div class="profile-name">${escapeHtml(PROFILE.name || '玩家')} <span class="profile-gender">${genderIcon(PROFILE.gender ?? 'hidden')}</span></div>
      <div class="profile-level">${lv.name} · 修为 ${PROFILE.exp}${nx ? ` / ${nx.min}` : ''}</div>
      <div class="profile-bar"><i style="width:${barPct}%"></i></div>
      ${idtip ? `<div class="profile-mood">${idtip}</div>` : ''}
      <div class="profile-stats">对局 ${PROFILE.games} ｜ 胜场 ${PROFILE.wins}（${wr}%）｜ 最高连胜 ${PROFILE.bestStreak} ｜ 成就 ${achCount(PROFILE)}/${ACHIEVEMENTS.length}</div>
    </div>
    <button class="btn btn-sm" onclick="showAchievements(PROFILE,'我的成就')">🏅 查看成就</button>
  </div>`;
  }
  // 通知顶栏 / 成就网格刷新（lobby.ts 监听，避免循环依赖）
  try {
    window.dispatchEvent(new CustomEvent('profile-updated'));
  } catch (e) {
    /* ignore */
  }
}

export function showAchievements(p: Profile | PublicProfile, title: string, opts?: { editor?: boolean }): void {
  // 自我视图（editor）：标题栏附境界/修为徽章；他人档案仅标题
  const titleEl = document.getElementById('profileModalTitle')!;
  if (opts?.editor) {
    const lv0 = currentTier(p);
    titleEl.innerHTML = `${escapeHtml(title || '成就')}<span class="pm-badge">境·${lv0.name}</span><span class="pm-badge">⭐ 修为 ${p.exp || 0}</span>`;
  } else {
    titleEl.textContent = title || '成就';
  }
  const lv = currentTier(p);
  const bt = bottleneckText(p);
  const nxTier = nextTier(p);
  const avatar = (p as PublicProfile).avatar || DEFAULT_AVATAR;
  const gender = (p as PublicProfile).gender ?? 'hidden';
  const mood = (p as PublicProfile).mood || '';
  const moodIcon = (p as PublicProfile).moodIcon || DEFAULT_MOOD_ICON;
  const grid = ACHIEVEMENTS.map((a) => {
    const un = !!(p.achievements && p.achievements[a.id]);
    return `<div class="ach-item ${un ? 'unlocked' : 'locked'}"><div class="ach-icon">${un ? a.icon : '🔒'}</div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>`;
  }).join('');
  document.getElementById('profileModalBody')!.innerHTML = `
    <div class="rule-section" style="padding:10px;background:rgba(0,0,0,.25);border-radius:8px;border-left:3px solid var(--gold);margin-bottom:10px">
      <div style="font-size:15px;color:var(--gold);font-weight:700">${avatar} ${escapeHtml(p.name || '玩家')} <span style="font-size:12px">${genderIcon(gender)}</span>${mood ? `<span style="font-size:12px;color:var(--muted)"> ${moodIcon} ${escapeHtml(mood)}</span>` : ''}</div>
      <div style="font-size:11.5px;color:#8fd0ff;margin-top:3px">境界：${lv.name} ｜ 修为：${p.exp || 0} ｜ 对局：${p.games || 0} ｜ 胜场：${p.wins || 0}</div>
      <div class="pm-realmbar"><i style="width:${realmBarPct(p)}%"></i></div>
      <div style="font-size:11px;color:${bt ? '#ffb648' : '#b9e6ff'};margin-top:4px">${
        nxTier
          ? bt
            ? `⚠ 瓶颈未破：${escapeHtml(bt)}`
            : `距「${nxTier.name}」还需 ${Math.max(0, nxTier.min - (p.exp || 0))} 修为`
          : '☯ 已至渡劫 · 羽化可期'
      }</div>
    </div>
    <div class="rule-section"><h4>🏅 成就（${achCount(p)}/${ACHIEVEMENTS.length}）</h4>
      <div class="ach-grid">${grid}</div>
    </div>
    ${opts?.editor ? `<div class="rule-section"><h4>🎨 个性化资料</h4><div style="font-size:10.5px;color:var(--muted);margin-bottom:8px">设置后的信息会展示在主界面名片上，联机时其他玩家也能看到。</div><div id="profileEditor"></div></div>` : ''}
    ${opts?.editor ? '<div class="rule-section" id="wrongBookBox"></div>' : ''}`;
  document.getElementById('profileModal')!.classList.add('show');
}

export function closeProfileModal(): void {
  document.getElementById('profileModal')!.classList.remove('show');
}

/* ==================== 游戏结算 ==================== */
export function localPlayerWin(): boolean {
  if (!G.gameOver) return false;
  const me = G.players[G.myPlayerIdx];
  if (!me) return false;
  const wt = G.winnerText;
  if (wt === '反贼获胜') return me.role === 'rebel';
  if (wt === '内奸获胜') return me.role === 'spy';
  if (wt === '主公与忠臣获胜') return me.role === 'lord' || me.role === 'loyal';
  return false;
}

export function maybeSettle(): void {
  if (!G.gameOver || G.settled) return;
  G.settled = true;
  const win = localPlayerWin();
  PROFILE.games++;
  if (win) {
    PROFILE.wins++;
    PROFILE.winStreak++;
    if (PROFILE.winStreak > PROFILE.bestStreak) PROFILE.bestStreak = PROFILE.winStreak;
  } else PROFILE.winStreak = 0;
  /* ---- 修为结算：基础 + 斩敌 + 连胜 + 身份加成 ---- */
  const kills = G.myKills || 0;
  const detail: string[] = [];
  let gained = win ? EXP_WIN : EXP_LOSE;
  detail.push(`${win ? '胜' : '负'} +${gained}`);
  const killExp = kills * EXP_PER_KILL;
  if (killExp > 0) {
    gained += killExp;
    detail.push(`斩敌${kills} +${killExp}`);
  }
  if (PROFILE.winStreak >= 2) {
    const step = Math.min(PROFILE.winStreak - 1, EXP_STREAK_MAX_STEP);
    const streakExp = step * EXP_STREAK_STEP;
    gained += streakExp;
    detail.push(`${PROFILE.winStreak}连胜 +${streakExp}`);
  }
  const me = G.players[G.myPlayerIdx];
  if (win && me) {
    if (me.role === 'lord') {
      gained += EXP_LORD_BONUS;
      detail.push(`掌门独尊 +${EXP_LORD_BONUS}`);
    } else if (me.role === 'spy') {
      gained += EXP_SPY_BONUS;
      detail.push(`独赢天下 +${EXP_SPY_BONUS}`);
    }
  }

  const newAch: string[] = [];
  const unlock = (id: string): void => {
    // 忽略未定义的成就 id（如未设成就的中间境界）
    if (!PROFILE.achievements[id] && ACHIEVEMENTS.some((a) => a.id === id)) {
      PROFILE.achievements[id] = Date.now();
      newAch.push(id);
      gained += EXP_PER_ACH;
    }
  };
  unlock('first_game');
  if (win) unlock('first_win');
  if (PROFILE.winStreak >= 3) unlock('win_3');
  if (PROFILE.winStreak >= 5) unlock('win_5');
  if (me) {
    if (win && me.role === 'lord') unlock('lord_win');
    if (win && me.role === 'rebel') unlock('rebel_win');
    if (win && me.role === 'spy') unlock('spy_win');
  }
  if (kills >= 3) unlock('kill_3');
  if (kills >= 5) unlock('kill_5');
  if (PROFILE.games >= 50) unlock('games_50');
  if (PROFILE.wins >= 20) unlock('win_20');

  PROFILE.exp += gained;

  /* ---- 境界突破（修为 + 瓶颈条件同时满足） ---- */
  const bt = checkBreakthrough(PROFILE);
  let breakthrough: { from: Realm; to: Realm } | null = null;
  if (bt.ok && bt.next) {
    const from = currentTier(PROFILE).id;
    PROFILE.realm = bt.next;
    breakthrough = { from, to: bt.next };
    unlock(`realm_${bt.next}`);
  }
  saveProfile();

  const realmName = currentTier(PROFILE).name;
  addLog(`📊 本局结算：${win ? '胜利' : '败北'} ｜ 修为 +${gained}（${detail.join(' ｜ ')}）`, 'hl');
  if (breakthrough) {
    addLog(`🆙 打破瓶颈，突破至【${REALM_LABEL[breakthrough.to]}】！`, 'hl');
  }
  newAch.forEach((id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) addLog(`🏅 解锁成就【${a.name}】`, 'reward');
  });
  refreshProfileUI();
  if (NET.isHost && NET.mode === 'host') {
    NET.broadcast({ type: 'chat', name: '系统', text: `${PROFILE.name} 本局${win ? '胜利' : '败北'}，修为 +${gained}` });
    if (breakthrough) {
      NET.broadcast({ type: 'chat', name: '系统', text: `🆙 ${PROFILE.name} 突破至【${REALM_LABEL[breakthrough.to]}】！` });
    }
  }

  // 一局结束结算面板（突破时先播全屏演出，再展示结算）
  const settle = (): void =>
    showSettle({
      win,
      gained,
      detail,
      exp: PROFILE.exp,
      realm: realmName,
      breakthrough: breakthrough ? { from: REALM_LABEL[breakthrough.from], to: REALM_LABEL[breakthrough.to] } : null,
      bottleneck: breakthrough ? null : bottleneckText(PROFILE),
      nextRealm: nextTier(PROFILE)?.name ?? null,
      nextNeed: nextTier(PROFILE) ? Math.max(0, nextTier(PROFILE)!.min - PROFILE.exp) : 0,
      newAch: newAch
        .map((id) => ACHIEVEMENTS.find((x) => x.id === id))
        .filter((a): a is (typeof ACHIEVEMENTS)[number] => !!a)
        .map((a) => ({ icon: a.icon, name: a.name })),
    });
  if (breakthrough) void playBreakthrough(breakthrough.from, breakthrough.to).then(settle);
  else settle();
}
