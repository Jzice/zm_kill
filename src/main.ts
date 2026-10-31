/* ==================== 入口 ====================
 * 职责：1) 挂载内联事件所需的 window 全局函数；2) 执行初始化序列（与原版脚本底部一致）。
 * 业务逻辑全部在各模块中，本文件不做任何游戏逻辑。
 */
import './style.css';

import { G } from './game/state';
import { dealDamage, checkWin } from './game/damage';
import { useSkill } from './game/actions';

import type { Element, FactionId, GameMode, Taoism } from './core/types';
import { ELEMENT_KE, TAOISM_KE, attrRelation, taoismRelation } from './data/zml/attr';
import { setSim, sleep, togglePanel } from './core/dom';
import { CHARACTERS } from './data/characters';
import { renderRuleModePicker, setRuleMode } from './ui/lobby';
import { FACTIONS } from './data/factions';
import { defOf, TALENT_DEFS } from './data/talentdefs';
import { buildDeck } from './data/cards';
import { ZML_ALL } from './data/zml/cards.zml';
import { ZML_UPGRADE_TALENT_LIST, unlockableUpgrades } from './data/zml/upgradeTalents.zml';
import { normalizeCardPacks, withCore } from './data/cardPacks';
import { initPacks } from './data/packRegistry';
import {
  canBeTarget,
  cardImmuneTo,
  distTrapOf,
  enemyEquipVoidOf,
  horseDistOf,
  shaRedirectOf,
  skillRedirectOf,
} from './game/talentEngine';
import { toggleSound, loadSoundPref, refreshSoundSwitch, updateSoundButtons } from './core/sound';

import { exitGame, hostStartGame, startSingle } from './game/setup';
import { activeLoopCount } from './game/loop';
import { aiTurnsOf } from './game/aibrain';
import { getPolicy, resetPolicy, setPolicy } from './game/aipolicy';
import type { AiPolicy } from './game/aipolicy';
import { clickHandCard, clickTargetSeat } from './ui/hand';
import { handleLocalChoice, resolveChoice } from './game/choice';
import { defaultChoiceFor } from './game/timer';
import { closeMarkMenu, openMarkMenu, setMark } from './game/marks';
import { closeProfileModal, refreshProfileUI, showAchievements } from './profile/profile';
import { sendChat } from './game/chat';
import { bindNetChat, sendNetChat, toggleNetChat } from './ui/netchat';
import { bindLogResize } from './ui/logresize';
import { bindNotify, closeNotifyPanel, notifyJump, toggleNotifyPanel } from './ui/notify';
import { applyTheme, closeThemePanel, openThemePanel, setThemeMode, setThemeStyle } from './ui/theme';
import { closeRules, openRules, switchRulesTab } from './ui/modals';
import { copyInviteLink, nativeShare } from './ui/share';
import {
  backToLobby,
  bindCountSlider,
  bindLobbyEvents,
  enterSetup,
  openProfileMenu,
  ensureCharValid,
  renderAchievements,
  renderCharPicker,
  // 自定义扩展包管理
  openPackMenu,
  closePackMenu,
  renderPackList,
  importPackFile,
  loadPackFromUrl,
  togglePack,
  removePackConfirm,
  clearAllPacksConfirm,
  editPackFromMenu,
  renderFactionPicker,
  renderPacketPicker,
  renderCardPackPicker,
  toggleCardPack,
  renderTimerPicker,
  setPacket,
  toggleExtraPacket,
  setTimerOn,
  setTimerSec,
  renderProfileEditor,
  pickSeatMember,
  randomizeSeats,
  requestSeatMove,
  renderRolePicker,
  renderSetupSummary,
  renderTopBar,
  restoreSetupPrefs,
  selectAvatar,
  selectChar,
  selectFaction,
  selectGender,
  selectMoodIcon,
  selectRole,
  setNetMode,
  setPlayerCount,
  updateAIHint,
  updateLobbyMode,
  viewMemberProfile,
} from './ui/lobby';
import { initTimerTicker } from './ui/timer';
import { closeSettle, requestRematch, settleReturn, startSingleGame } from './ui/settle';
import { closeRoom, createRoom, joinRoom, leaveRoom } from './net/rooms';
import { rerollRandomChar } from './ui/lobby';
import {
  closeLlmSettings,
  llmSetEnabled,
  llmSetField,
  llmSetProvider,
  llmSetTakeoverAll,
  llmSetDebug,
  llmTestConn,
  llmToggleSeat,
  openLlmSettings,
  renderLlmSetupPanel,
} from './ui/llmSettings';
import { revealCancel, revealConfirm, revealReroll } from './ui/reveal';
import { useItem } from './game/actions';

/* ---- 1. window 全局挂载（供 HTML 内联 onclick / 动态模板调用） ---- */
window.togglePanel = togglePanel;
window.toggleSound = toggleSound;
window.exitGame = exitGame;
window.startSingle = startSingle;
window.hostStartGame = hostStartGame;
window.createRoom = createRoom;
window.closeRoom = closeRoom;
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.openRules = openRules;
window.closeRules = closeRules;
window.switchRulesTab = switchRulesTab;
window.openMarkMenu = openMarkMenu;
window.setMark = setMark;
window.closeMarkMenu = closeMarkMenu;
window.showAchievements = showAchievements;
window.closeProfileModal = closeProfileModal;
window.viewMemberProfile = viewMemberProfile;
window.sendChat = sendChat;
window.sendNetChat = sendNetChat;
window.toggleNetChat = toggleNetChat;
window.toggleNotifyPanel = toggleNotifyPanel;
window.closeNotifyPanel = closeNotifyPanel;
window.notifyJump = notifyJump;
window.openThemePanel = openThemePanel;
window.closeThemePanel = closeThemePanel;
window.setThemeMode = setThemeMode;
window.setThemeStyle = setThemeStyle;
window.clickHandCard = clickHandCard;
window.clickTargetSeat = clickTargetSeat;
window.handleLocalChoice = handleLocalChoice;
window.selectAvatar = selectAvatar;
window.selectGender = selectGender;
window.selectMoodIcon = selectMoodIcon;
window.setPlayerCount = setPlayerCount;
window.selectRole = selectRole;
// 二级菜单与子界面导航
window.openProfileMenu = openProfileMenu;
// 自定义扩展包管理
window.openPackMenu = openPackMenu;
window.closePackMenu = closePackMenu;
window.renderPackList = renderPackList;
window.importPackFile = importPackFile;
window.loadPackFromUrl = loadPackFromUrl;
window.togglePack = togglePack;
window.removePackConfirm = removePackConfirm;
window.clearAllPacksConfirm = clearAllPacksConfirm;
window.editPackFromMenu = editPackFromMenu;
window.backToLobby = backToLobby;
window.enterSetup = enterSetup;
window.setNetMode = setNetMode;
window.setPacket = setPacket;
window.toggleExtraPacket = toggleExtraPacket;
window.setTimerOn = setTimerOn;
window.setTimerSec = setTimerSec;
window.renderPacketPicker = renderPacketPicker;
window.renderCardPackPicker = renderCardPackPicker;
window.toggleCardPack = toggleCardPack;
window.setRuleMode = (m: string) => setRuleMode(m as GameMode);
/** 冒烟测试专用：掌门路修真牌堆的「卡名 → 张数」统计（scripts/smoke-zml.mjs） */
window.__xtsZmlDeckStats = (): Record<string, number> => {
  const deck = buildDeck({ mode: 'zml' });
  const out: Record<string, number> = {};
  for (const c of deck) out[c.name] = (out[c.name] || 0) + 1;
  return out;
};
/**
 * 冒烟测试专用：按给定卡包合成牌堆并返回「sub → 张数」统计。
 * 用于断言「修真牌堆各子类张数基线」（scripts/smoke-cards.mjs）。
 */
window.__xtsDeckStats = (packs?: string[]): Record<string, number> => {
  const ids = Array.isArray(packs) ? normalizeCardPacks(packs) : [];
  const deck = buildDeck({ packs: withCore(ids) });
  const out: Record<string, number> = {};
  for (const c of deck) out[c.sub] = (out[c.sub] || 0) + 1;
  return out;
};
/**
 * 冒烟测试专用：属性攻防体系自检（scripts/smoke-cards.mjs）。
 * 返回角色道统分布、卡牌属性统计与相克环，供断言「61 人全有道统」「五行 / 道统环闭环」。
 */
window.__xtsAttrInfo = () => {
  const deck = buildDeck({ mode: 'zml' });
  const taoism: Record<string, number> = {};
  const attrs: Record<string, number> = {};
  let missingTaoism = 0;
  for (const c of CHARACTERS) {
    if (c.taoism) taoism[c.taoism] = (taoism[c.taoism] || 0) + 1;
    else missingTaoism++;
  }
  for (const c of deck) if (c.attr) attrs[c.attr] = (attrs[c.attr] || 0) + 1;
  return {
    characters: CHARACTERS.length,
    missingTaoism,
    taoism,
    attrs,
    lingshou: CHARACTERS.filter((c) => c.lingshou).map((c) => c.name),
    taoismRing: (Object.keys(TAOISM_KE) as Taoism[]).map((t) => `${t}>${TAOISM_KE[t]}`),
    elementRing: (Object.keys(ELEMENT_KE) as Element[]).map((e) => `${e}>${ELEMENT_KE[e]}`),
    sample: {
      foVsMo: taoismRelation('fo', 'mo'),
      moVsFo: taoismRelation('mo', 'fo'),
      woodVsEarth: attrRelation('wood', 'earth'),
      earthVsWood: attrRelation('earth', 'wood'),
      sameMetal: attrRelation('metal', 'metal'),
      daodeVsGuiwu: attrRelation('daode', 'guiwu'),
      duVsFeng: attrRelation('du', 'feng'),
      woodVsMetal: attrRelation('wood', 'metal'),
      noneAttr: attrRelation(undefined, 'metal'),
    },
  };
};
window.requestSeatMove = requestSeatMove;
window.pickSeatMember = pickSeatMember;
window.randomizeSeats = randomizeSeats;
window.closeSettle = closeSettle;
window.settleReturn = settleReturn;
window.requestRematch = requestRematch;
window.startSingleGame = startSingleGame;
window.selectFaction = (k: string) => selectFaction(k as FactionId);
window.selectChar = selectChar;
// 随机武将预览卡 / 开局亮将
window.rerollRandomChar = rerollRandomChar;
window.revealConfirm = revealConfirm;
window.revealReroll = revealReroll;
window.revealCancel = revealCancel;
window.useItem = useItem;
// 大模型接管设置
window.openLlmSettings = openLlmSettings;
window.closeLlmSettings = closeLlmSettings;
window.llmSetProvider = llmSetProvider;
window.llmSetEnabled = llmSetEnabled;
window.llmSetTakeoverAll = llmSetTakeoverAll;
window.llmSetDebug = llmSetDebug;
window.llmToggleSeat = llmToggleSeat;
window.llmSetField = llmSetField;
window.llmTestConn = llmTestConn;

/** 动态测量顶栏实际高度（换行行数随屏宽变化），写入 CSS 变量供 body 顶部让位；
 *  并实测切换布局模式：单行放得下=单行(品牌左, 境界修为+按钮+个人信息靠右)；
 *  放不下=恒定两行(第一行 品牌左+个人信息右, 第二行 境界修为左+按钮组右)，更窄时整栏横向滚动 */
function syncTopBarHeight(): void {
  const tb = document.getElementById('topBar');
  if (!tb) return;
  const brand = tb.querySelector<HTMLElement>('.tb-brand');
  const chip = tb.querySelector<HTMLElement>('.tb-user-chip');
  const right = tb.querySelector<HTMLElement>('.tb-right');
  const stats = tb.querySelector<HTMLElement>('.tb-stats');
  const set = () => {
    document.documentElement.style.setProperty('--tb-h', tb.offsetHeight + 6 + 'px');
    if (!brand || !chip || !right) return;
    tb.classList.remove('tb-mode2'); // 先按默认样式测自然宽度
    const cs = getComputedStyle(tb);
    const avail = tb.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const gap = parseFloat(cs.columnGap) || 10;
    const nat = (el: HTMLElement) => el.scrollWidth + (el.offsetWidth - el.clientWidth);
    const wStats = stats ? nat(stats) : 0;
    // 单行放得下则单行；否则恒定两行（更窄时整栏横向滚动，含第一行，不再回落单行）
    const allFit = nat(brand) + wStats + nat(right) + nat(chip) + gap * 3 <= avail;
    const wantMode2 = !allFit;
    if (wantMode2 !== tb.classList.contains('tb-mode2')) tb.classList.toggle('tb-mode2', wantMode2);
  };
  // 测量过程会临时移除 tb-mode2（回到单行）再切回，属于「回调内改布局」；
  // 延到下一帧执行，避免 ResizeObserver 判定为 undelivered notifications 并报错
  const setLater = () => requestAnimationFrame(set);
  set();
  try {
    const ro = new ResizeObserver(setLater);
    ro.observe(tb);
    if (chip) ro.observe(chip);
    if (right) ro.observe(right);
  } catch (e) {
    window.addEventListener('resize', setLater);
  }
}

window.copyInviteLink = copyInviteLink;
window.nativeShare = nativeShare;

/* ---- 无头模拟 / 技能自检（scripts/balance.mjs、scripts/smoke-talents.mjs 用） ---- */
window.xtsSim = (on: boolean) => setSim(!!on);
// AI 策略参数（A/B 对比与 scripts/tune-ai.mjs 参数校准入口）
window.xtsSetAiPolicy = (patch: Partial<AiPolicy> | null) => setPolicy(patch);
window.xtsGetAiPolicy = () => getPolicy();
window.xtsResetAiPolicy = () => resetPolicy();
window.xtsMakeAllAI = () => {
  G.players.forEach((p) => {
    p.isAI = true;
  });
  // 若真人座位正处于等待选择中，按默认规则放行，避免模拟卡死
  if (G.pendingResolve && G.pendingOptions?.length) {
    resolveChoice(defaultChoiceFor(G.pendingType || 'list', G.pendingOptions));
  }
};
window.xtsSnapshot = () => ({
  started: G.started,
  gameOver: G.gameOver,
  winner: G.winnerText || '',
  players: G.players.map((p) => ({
    name: p.name,
    char: p.charId || '',
    role: p.role,
    alive: p.alive,
    hp: p.hp,
  })),
});
window.xtsSkillAudit = () => {
  const missing: string[] = [];
  for (const c of CHARACTERS) for (const s of c.talents) if (!defOf(s.id)) missing.push(`${c.id}:${s.id}`);
  for (const f of Object.values(FACTIONS)) {
    const ls = f.lordSkill;
    if (ls && !defOf(ls.id)) missing.push(`lord:${ls.id}`);
  }
  const ids = Object.keys(TALENT_DEFS);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  // 掌门路：以主角齐休作为「三技能基准角色」（诸葛亮等名人角色已移除）
  const qixiu = CHARACTERS.find((c) => c.id === 'zml_qixiu')?.talents.map((s) => s.id) || [];
  const multi = CHARACTERS.filter((c) => c.talents.length >= 3).map((c) => c.id);
  // 角色升级天赋：不进任何角色池，只带 unlock 条件
  const upgrades = ZML_UPGRADE_TALENT_LIST.map((d) => ({
    id: d.id,
    name: d.name,
    unlock: d.unlock || null,
    inPool: CHARACTERS.some((c) => c.talents.some((s) => s.id === d.id)),
  }));
  return { total: ids.length, chars: CHARACTERS.length, missing, duplicates: dup, qixiu, multi, upgrades };
};

/**
 * 角色升级链自检（scripts/smoke-skills.mjs 断言用）：
 * 校验四剑卡名真实存在于牌堆、解锁条件里的 charId 真实存在、
 * 升级天赋均带 unlock 且不在任何角色天赋池内 —— 防止改名 / 手误造成静默失效。
 */
window.__xtsUpgradeProbe = () => {
  const deckNames = new Set<string>();
  for (const d of ZML_ALL) deckNames.add(d.name);
  const charIds = new Set(CHARACTERS.map((c) => c.id));
  const chain = ZML_UPGRADE_TALENT_LIST.map((d) => {
    const u = d.unlock;
    const equipMissing = !u || u.kind !== 'equip' ? [] : deckNames.has(u.equip) ? [] : [u.equip];
    const charMissing = u?.charId && !charIds.has(u.charId) ? [u.charId] : [];
    return {
      id: d.id,
      name: d.name,
      equip: u && u.kind === 'equip' ? u.equip : '',
      charId: u?.charId || '',
      hasUnlock: !!u,
      inPool: CHARACTERS.some((c) => c.talents.some((s) => s.id === d.id)),
      equipMissing,
      charMissing,
    };
  });
  return {
    total: chain.length,
    bad: chain.filter((c) => !c.hasUnlock || c.inPool || c.equipMissing.length || c.charMissing.length),
    chain,
  };
};

/**
 * 升级天赋条件判定自检（纯函数，不改动对局状态）：
 * 给定「角色 id + 装备卡名」，返回会被解锁的升级天赋 id 列表。
 * 用于冒烟脚本验证「角色 + 卡名」双重匹配（他人装备不应解锁）。
 */
window.__xtsUpgradeCheck = (charId: string, equip: string) =>
  unlockableUpgrades(charId, [equip]).map((d) => d.id);

/**
 * 高中扩展包 50 将专项指针（scripts/verify-senior50.mjs / smoke-talents.mjs 用）。
 * 返回高中段（高一上~高三下）角色清单，含学科分布与每名角色的技能明细。
 */
window.xtsSeniorPool = () => {
  return {
    count: CHARACTERS.length,
    byFaction: CHARACTERS.reduce<Record<string, number>>((acc, c) => {
      acc[c.faction] = (acc[c.faction] || 0) + 1;
      return acc;
    }, {}),
    chars: CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      faction: c.faction,
      hp: c.hp,
      talents: c.talents.map((s) => ({
        id: s.id,
        name: s.name,
        kind: defOf(s.id)?.kind || '',
        timing: defOf(s.id)?.timing || '',
        effects: (defOf(s.id)?.effects || []).map((e) => ({
          kind: e.kind,
          at: (e as { at?: string }).at || null,
        })),
      })),
    })),
  };
};

/**
 * 无头批量 AI 对战（scripts/balance.mjs 用）。
 * 每局随机角色开局并把所有座位交 AI 托管，跑到 gameOver 后统计胜率 / 存活率。
 * 返回各角色与各身份的累计战绩，供平衡微调。
 * @param seed 每局独立重置的可复现种子（base + 局序）；传 null 则走页面真实随机
 */
window.xtsAutoRun = async (n: number, seats = 5, policy?: Partial<AiPolicy> | null, seed?: number | null) => {
  setSim(true);
  if (policy) setPolicy(policy); // A/B 与 CEM 校准：批量跑局前切换策略参数
  const charIds = CHARACTERS.map((c) => c.id);
  const byChar: Record<string, { games: number; wins: number; alive: number }> = {};
  const byCharRole: Record<string, Record<string, { games: number; wins: number; alive: number }>> = {};
  const byRole: Record<string, { games: number; wins: number }> = {
    lord: { games: 0, wins: 0 },
    loyal: { games: 0, wins: 0 },
    rebel: { games: 0, wins: 0 },
    spy: { games: 0, wins: 0 },
  };
  let stalls = 0;
  let turns = 0;
  for (let i = 0; i < n; i++) {
    if (seed !== null && seed !== undefined) (window as unknown as { __xtsSeed?: (v: number) => void }).__xtsSeed?.(seed + i);
    setPlayerCount(seats);
    selectChar(charIds[Math.floor(Math.random() * charIds.length)]);
    await startSingle(); // 建局并启动 gameLoop（fire-and-forget）
    window.xtsMakeAllAI();
    let guard = 0;
    while (!G.gameOver && guard < 500000) {
      await sleep(0);
      guard++;
    }
    if (!G.gameOver) {
      stalls++;
      G.gameOver = true; // 防止死循环：强制结束本局
    }
    // 等待上一局的 gameLoop 彻底收尾再开下一局：否则旧循环会因为
    // G.gameOver 被新局重置而「复活」，导致 N 个循环并发驱动同一局（耗时 O(N²) 劣化）。
    let w = 0;
    while (activeLoopCount() > 0 && w < 200000) {
      await sleep(0);
      w++;
    }
    turns += aiTurnsOf(); // 局长度量（AI 回合数，resetBrain 于开局清零）
    const winner = G.winnerText;
    const winRoles: string[] =
      winner === '内奸获胜'
        ? ['spy']
        : winner === '反贼获胜'
          ? ['rebel']
          : winner === '主公与忠臣获胜'
            ? ['lord', 'loyal']
            : [];
    for (const p of G.players) {
      const cid = p.charId || '';
      if (!byChar[cid]) byChar[cid] = { games: 0, wins: 0, alive: 0 };
      byChar[cid].games++;
      if (winRoles.includes(p.role)) byChar[cid].wins++;
      if (p.alive) byChar[cid].alive++;
      const cr = (byCharRole[cid] ||= {});
      const rr = (cr[p.role] ||= { games: 0, wins: 0, alive: 0 });
      rr.games++;
      if (winRoles.includes(p.role)) rr.wins++;
      if (p.alive) rr.alive++;
      if (byRole[p.role]) {
        byRole[p.role].games++;
        if (winRoles.includes(p.role)) byRole[p.role].wins++;
      }
    }
  }
  return { games: n, stalls, turns, avgTurns: n ? turns / n : 0, byChar, byRole, byCharRole };
};

/**
 * v2.1 新机制调试查询面（scripts/smoke-v21.mjs 用）。
 * 这些函数就是 actions.ts / rules.ts / turn.ts 实际消费的引擎查询层，
 * 对它们断言即等价于验证「免疫 / 转移 / 距离陷阱 / 装备失效 / 马政」的接线是否正确。
 */
window.xtsV21 = {
  /** 指定座位是否免疫某张牌名 */
  cardImmune: (idx: number, name: string) => cardImmuneTo(G.players[idx], name),
  /** 目标合法性（可带牌名 / 花色） */
  canBeTarget: (idx: number, scope: 'skill' | 'sha' | 'juedou' | 'equip', cardName?: string, cardSuit?: string) =>
    canBeTarget(idx, scope, cardName, cardSuit),
  /** 其他角色装备区指定槽位对目标是否失效 */
  equipVoid: (idx: number, slot: 'weapon' | 'armor' | 'horsePlus' | 'horseMinus') =>
    enemyEquipVoidOf(G.players[idx], slot),
  /** 距离陷阱阈值 */
  distTrap: (idx: number) => distTrapOf(G.players[idx]),
  /** 马政距离减免 */
  horseDist: (idx: number) => horseDistOf(G.players[idx]),
  /** 可否转移锦囊 / 杀 */
  skillRedirect: (idx: number) => skillRedirectOf(G.players[idx]),
  shaRedirect: (idx: number) => shaRedirectOf(G.players[idx]),
  /** 座位号 → 角色 id */
  charOf: (idx: number) => G.players[idx]?.charId || '',
  /** 当前对局玩家数组（供测试构造装备 / 标记等场景） */
  players: () => G.players,
};

/** 通过 ?room=XXXXXX 分享链接进入时，自动进入加入模式并预填房间号、发起加入 */
function handleSharedRoom(): void {
  let code = '';
  try {
    code = new URLSearchParams(location.search).get('room') || '';
  } catch {
    return;
  }
  if (!/^\d{6}$/.test(code)) return;
  enterSetup('join');
  const inp = document.getElementById('joinCode') as HTMLInputElement | null;
  if (inp) inp.value = code;
  const st = document.getElementById('joinStatus');
  if (st) st.textContent = `已自动填入房间号 ${code}，正在加入…`;
  setTimeout(() => {
    void joinRoom();
  }, 50);
}

/** 小屏(≤600px)时战报移到出牌区下方，宽屏还原到侧栏 */
function bindPlayLogRelayout(): void {
  const log = document.getElementById('playLogPanel');
  const side = document.querySelector('.side-panel');
  const area = document.getElementById('tableArea');
  if (!log || !side || !area) return;
  const mq = window.matchMedia('(max-width:600px)');
  const apply = () => {
    if (mq.matches) {
      area.appendChild(log);
    } else {
      side.insertBefore(log, side.firstChild);
    }
  };
  apply();
  try {
    mq.addEventListener('change', apply);
  } catch (e) {
    (mq as unknown as { addListener: (f: () => void) => void }).addListener(apply);
  }
}

/* ---- 2. 初始化序列（顺序与原版脚本底部一致） ---- */
function init(): void {
  applyTheme();
  restoreSetupPrefs(); // 恢复上次选择的玩家总数 / 回合限时（须在渲染选择器与绑定滑块前）
  initPacks(); // 重建自定义扩展包的运行时注册表（须在选将池渲染前）
  loadSoundPref();
  updateSoundButtons();
  refreshSoundSwitch();
  bindLobbyEvents();
  bindCountSlider();
  refreshProfileUI();
  renderProfileEditor();
  ensureCharValid();
  renderPacketPicker();
  renderRuleModePicker();
  renderCardPackPicker();
  renderTimerPicker();
  renderFactionPicker();
  renderCharPicker();
  renderRolePicker();
  updateAIHint();
  renderLlmSetupPanel();
  updateLobbyMode();
  renderSetupSummary();
  // 固定顶栏 / 个人成就
  renderTopBar();
  const verEl = document.getElementById('tbVersion');
  if (verEl) verEl.textContent = `v${__APP_VERSION__}`;
  renderAchievements();
  initTimerTicker(); // 回合倒计时刷新（房主与客人端共用 G.timerEnd）
  syncTopBarHeight();
  bindPlayLogRelayout();
  bindLogResize();
  bindNetChat();
  bindNotify();
  handleSharedRoom();

  window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error || e.message);
  });
}

init();

// 调试钩子：仅在 URL 带 ?debug=1 时暴露内部状态/函数，供自动化测试驱动（生产构建无此对象）
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __game: unknown }).__game = {
    get G() {
      return G;
    },
    dealDamage,
    checkWin,
    useSkill,
  };
}
