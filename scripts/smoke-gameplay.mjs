// 全量玩法运行时验证：在真实单文件产物里驱动确定性场景，逐项验证卡牌结算、响应窗口、
// 装备附加效果、原著机制锦囊、判定阶段与距离/范围/手牌上限规则。
// 用法：node scripts/smoke-gameplay.mjs [html文件名]
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '掌门杀.html';
const PORT = 8921;
const url = `http://127.0.0.1:${PORT}/${encodeURIComponent(file)}?debug=1`;

const server = spawn(process.execPath, [path.join(dirname, 'serve-dist.mjs'), String(PORT)], {
  cwd: path.resolve(dirname, '..'),
  stdio: 'ignore',
});
async function waitServer(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.request({ host: '127.0.0.1', port: PORT, path: '/', method: 'HEAD', timeout: 1000 }, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}
function findHeadlessShell() {
  const base = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (!fs.existsSync(base)) return undefined;
  for (const d of fs.readdirSync(base).filter((x) => x.startsWith('chromium_headless_shell-')).sort().reverse()) {
    const exe = path.join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}

if (!(await waitServer())) {
  console.error('❌ 静态服务器未能启动');
  server.kill();
  process.exit(1);
}

const browser = await chromium.launch(findHeadlessShell() ? { executablePath: findHeadlessShell() } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#modePicker .mode-card[data-mode="single"]');
await page.waitForSelector('#screenSetup.active', { timeout: 3000 });
await page.click('#startBtn');
await page.waitForSelector('#revealModal.show', { timeout: 3000 });
await page.click('#revealBody button[onclick="revealConfirm()"]');
await page.waitForSelector('#screenGame.active', { timeout: 5000 });
await page.waitForFunction(() => window.__game && window.__game.G.players.length >= 3, { timeout: 8000 });
// 停住对局循环，等 AI 在途动作收尾，再进入确定性场景
await page.evaluate(() => {
  const G = window.__game.G;
  G.gameOver = true;
  G.players.forEach((p) => { p.hand = []; });
  window.setFxLevel('off'); // 关动画但不进入无头模拟（保留真人选择窗口）
});
await page.waitForTimeout(1500);

/* ---------------- 非交互场景：全部在页面内顺序执行 ---------------- */
const out = await page.evaluate(async () => {
  const A = window.__audit;
  const G = window.__game.G;
  const mk = (name, type, sub, suit = '♠', num = 1, extra = {}) => A.C(name, type, sub, suit, num, extra);
  const talent = (id, name, kind = 'active') => ({ id, name, type: 'active', desc: '', kind });

  function reset(human = -1) {
    G.gameOver = true;
    G.pendingOptions = null;
    G.pendingResolve = null;
    G.pendingPlayer = null;
    G.pendingType = null;
    G.players.forEach((p, i) => {
      p.alive = true;
      p.maxHp = 4;
      p.hp = 4;
      p.hand = [];
      p.equip = { weapon: null, armor: null, horsePlus: null, horseMinus: null };
      p.judge = [];
      p.chained = false;
      p.turned = false;
      p.shield = 0;
      p.talents = [];
      p.skillUse = {};
      p.skillGame = {};
      p.roleKnownTo = [];
      p.isAI = i !== human;
      p.aiMode = 'heuristic';
      // 中性角色 id：屏蔽开局随机角色带来的「道统相克 ±1 伤害」，让结算场景可复现
      p.charId = '__parity_test__';
      p.marks = {};
      const f = p.flags;
      f.shaUsed = 0; f.skillUsed = false; f.extraDamage = 0; f.jiuUsed = false;
      f.blockSuit = null; f.skipPlay = false; f.skipDraw = false; f.noSha = false;
      f.tongmingUsed = false; f.dmgReduce = 0; f.bonusDmg = 0;
      if (p.cult) { p.cult.benmingShown = false; p.cult.exp = 0; p.cult.benming = ['测试本命']; }
    });
    G.deck = [];
    G.discard = [];
    G.current = 0;
    return G;
  }

  function fp() {
    return JSON.stringify({
      hp: G.players.map((p) => p.hp),
      hand: G.players.map((p) => p.hand.length),
      eq: G.players.map((p) => [p.equip.weapon?.id, p.equip.armor?.id, p.equip.horsePlus?.id, p.equip.horseMinus?.id]),
      judge: G.players.map((p) => p.judge.length),
      chain: G.players.map((p) => p.chained),
      talents: G.players.map((p) => p.talents.length),
      skillUse: G.players.map((p) => Object.keys(p.skillUse || {}).length),
      exp: G.players.map((p) => p.cult?.exp || 0),
      benming: G.players.map((p) => p.cult?.benmingShown),
      roleKnown: G.players.map((p) => (p.roleKnownTo || []).length),
      deck: G.deck.length,
      discard: G.discard.length,
    });
  }

  window.__t = { reset, mk, talent, A, G };
  const R = { errors: [] };
  const run = async (key, fn) => {
    try { R[key] = await fn(); } catch (e) { R.errors.push(`${key}: ${e && e.message ? e.message : e}`); }
  };

  /* 1. 牌堆与定义一致 */
  await run('deck', () => {
    const deck = A.buildDeck();
    const bySub = {};
    deck.forEach((c) => { bySub[c.sub] = (bySub[c.sub] || 0) + 1; });
    return {
      total: deck.length,
      declared: A.ZML_DECK_TOTAL,
      defsTotal: A.ZML_ALL.reduce((s, d) => s + d.count, 0),
      noBlank: deck.every((c) => c.name && c.sub && c.suit && c.num != null),
      subCount: Object.keys(bySub).length,
      defSubCount: new Set(A.ZML_ALL.map((d) => d.sub)).size,
      wuxingNames: [...new Set(deck.filter((c) => c.wuxing === true).map((c) => c.name))].sort(),
    };
  });

  /* 2. 基本牌：恢复 / 增益每回合一次 */
  await run('basic', async () => {
    reset();
    G.players[0].hp = 2;
    await A.useTao(0, '回春丹');
    const healed = G.players[0].hp;
    await A.useJiu(0, '真源丹');
    const first = G.players[0].flags.extraDamage;
    await A.useJiu(0, '真源丹');
    return { healed, first, second: G.players[0].flags.extraDamage, jiuUsed: G.players[0].flags.jiuUsed };
  });

  /* 3. 全部锦囊 sub 逐个结算：不得静默空转 */
  await run('sweep', async () => {
    const subs = [...new Set(A.ZML_ALL.filter((d) => d.type === 'skill').map((d) => d.sub))]
      .filter((s) => s !== 'wuxie');
    const noop = [];
    for (const sub of subs) {
      reset();
      G.players.forEach((p, i) => {
        if (i > 0) p.hp = 2;
        p.hand = [mk('填充牌', 'basic', 'none', '♠', 3), mk('填充牌2', 'basic', 'none', '♠', 4), mk('填充牌3', 'basic', 'none', '♠', 5)];
        p.equip.weapon = mk('测试兵器', 'equip', 'weapon', '♠', 1, { range: 2 });
        p.equip.armor = mk('测试护具', 'equip', 'armor', '♠', 1);
        p.equip.horsePlus = mk('测试载具', 'equip', 'horse+', '♠', 1, { dist: 1 });
        p.equip.horseMinus = mk('测试载具2', 'equip', 'horse-', '♠', 1, { dist: 1 });
      });
      G.players[1].talents = [talent('t_normal', '普通天赋')];
      G.deck = Array.from({ length: 12 }, (_, i) => mk('牌堆' + i, 'basic', 'none', '♠', 3));
      const before = fp();
      await A.useSkill(0, mk('测试锦囊', 'skill', sub, '♠', 5), 1, 2);
      if (fp() === before) noop.push(sub);
    }
    return { count: subs.length, noop };
  });

  /* 3b. 属性攻防（道统相克）：道克鬼 +1、鬼被道克 -1（伤害可被完全抵消） */
  await run('attr', async () => {
    const hit = async (atk, def) => {
      reset();
      G.players[0].charId = atk;
      G.players[1].charId = def;
      await window.__game.dealDamage(0, 1, 1);
      return 4 - G.players[1].hp;
    };
    return { win: await hit('zml_qixiu', 'zml_shanuo'), lose: await hit('zml_shanuo', 'zml_qixiu'), neutral: await hit('__parity_test__', '__parity_test__') };
  });

  /* 4. 【无形】兵器：不可被破阵符 / 敛息诀指定 */
  await run('wuxing', async () => {
    reset();
    const p1 = G.players[1];
    p1.equip.weapon = A.buildDeck().find((c) => c.name === '幻日无形剑');
    p1.hand = [mk('手牌A', 'basic', 'none')];
    const blocks = { guohe: A.wuxingBlocks(p1, 'guohe'), shunshou: A.wuxingBlocks(p1, 'shunshou'), other: A.wuxingBlocks(p1, 'juedou') };
    await A.useSkill(0, mk('破阵符', 'skill', 'guohe', '♠', 5), 1, null);
    return { ...blocks, hand: p1.hand.length, weapon: !!p1.equip.weapon };
  });

  /* 5. 【无形鹤】不可被破阵符弃置；敛息诀仍可取得 */
  await run('wuxinghe', async () => {
    reset();
    const p1 = G.players[1];
    p1.hand = [];
    p1.equip.horseMinus = mk('无形鹤', 'equip', 'horse-', '♠', 1, { dist: 1 });
    await A.discardTargetCard(1, 0, '弃置', mk('破阵符', 'skill', 'guohe', '♠', 5));
    const afterGuohe = !!p1.equip.horseMinus;
    await A.discardTargetCard(1, 0, '获得', mk('敛息诀', 'skill', 'shunshou', '♠', 5));
    return { afterGuohe, afterShunshou: !!p1.equip.horseMinus, gained: G.players[0].hand.length };
  });

  /* 6. 【银背驮鳐】令万剑钻心无效 */
  await run('yaoyao', async () => {
    reset();
    G.players[1].equip.horsePlus = mk('银背驮鳐', 'equip', 'horse+', '♠', 1, { dist: 1 });
    await A.useSkill(0, mk('万剑钻心', 'skill', 'wanjian', '♠', 5), null, null);
    return { immune: G.players[1].hp, other: G.players[2].hp };
  });

  /* 7. 【飞蟹载客】相邻同门队友视为 +1，且不叠加 */
  await run('feixie', async () => {
    reset();
    G.players.forEach((p) => { p.faction = 'chuqin'; });
    const base = A.distBetween(0, 2);
    G.players[1].equip.horsePlus = mk('飞蟹', 'equip', 'horse+', '♠', 1, { dist: 1 });
    const escorted = A.distBetween(0, 2);
    const far = A.distBetween(0, 3);
    G.players[2].equip.horsePlus = mk('虾驼兽', 'equip', 'horse+', '♠', 1, { dist: 1 });
    const noStack = A.distBetween(0, 2);
    return { base, escorted, far, noStack };
  });

  /* 8. 诡代之法 / 本命代征：费用门槛、技能选择、持续时间与清理 */
  await run('copy', async () => {
    reset();
    const p0 = G.players[0];
    G.players[1].talents = [talent('t_limit', '限定技', 'limit'), talent('t_normal', '普通技')];
    const g = mk('诡代之法', 'skill', 'guidai', '♠', 5);
    const d = mk('本命代征', 'skill', 'daizheng', '♠', 5);
    p0.hand = [g];
    const gate1 = A.canUseCard(p0, g);
    p0.hand = [g, mk('填充', 'basic', 'none')];
    const gate2 = A.canUseCard(p0, g);
    p0.hand = [d, g];
    const gate3 = A.canUseCard(p0, d);
    p0.hand = [d, g, mk('填充2', 'basic', 'none')];
    const gate4 = A.canUseCard(p0, d);

    p0.hand = [mk('f1', 'basic', 'none'), mk('f2', 'basic', 'none'), mk('f3', 'basic', 'none')];
    await A.useSkill(0, g, 1, null);
    const guidai = {
      hand: p0.hand.length,
      id: p0.talents[0]?.id,
      until: p0.talents[0]?.copiedUntil,
      copied: !!p0.talents[0]?.copied,
    };
    A.cleanupCopiedTalents(0, 'turn'); // 'turn' 不应清掉 'nextTurn'
    const survivesTurnCleanup = p0.talents.length;
    A.cleanupCopiedTalents(0, 'nextTurn');
    const afterNextTurn = p0.talents.length;

    reset();
    G.players[1].talents = [talent('t_limit', '限定技', 'limit'), talent('t_normal', '普通技')];
    G.players[0].hand = [mk('f1', 'basic', 'none'), mk('f2', 'basic', 'none'), mk('f3', 'basic', 'none')];
    await A.useSkill(0, d, 1, null);
    const daizheng = {
      hand: G.players[0].hand.length,
      id: G.players[0].talents[0]?.id,
      until: G.players[0].talents[0]?.copiedUntil,
    };
    A.cleanupCopiedTalents(0, 'turn');
    const afterTurn = G.players[0].talents.length;

    reset();
    G.players[0].hand = [mk('f1', 'basic', 'none'), mk('f2', 'basic', 'none')];
    G.players[1].talents = [];
    await A.useSkill(0, g, 1, null);
    const noTargetSkill = { hand: G.players[0].hand.length, talents: G.players[0].talents.length };
    return { gate1, gate2, gate3, gate4, guidai, survivesTurnCleanup, afterNextTurn, daizheng, afterTurn, noTargetSkill };
  });

  /* 9. 观顶（AI 分支）：按价值取 1 张、其余按原序放回 */
  await run('guandingAi', async () => {
    reset();
    const c0 = mk('顶A', 'basic', 'shan', '♠', 1);
    const c1 = mk('顶B', 'basic', 'sha', '♥', 2);
    const c2 = mk('顶C', 'basic', 'tao', '♦', 3);
    G.deck = [c2, c1, c0]; // pop 顺序 c0 → c1 → c2
    await A.useSkill(0, mk('料敌机先', 'skill', 'guanding', '♠', 5), null, null);
    return {
      picked: G.players[0].hand.some((c) => c.id === c2.id),
      hand: G.players[0].hand.length,
      deck: G.deck.length,
      topIsC0: G.deck[G.deck.length - 1]?.id === c0.id,
      secondIsC1: G.deck[0]?.id === c1.id,
    };
  });

  /* 10. 通明身识：本回合不可被锦囊指定，回合初重置后恢复 */
  await run('tongshi', async () => {
    reset();
    await A.useSkill(0, mk('通明身识', 'skill', 'tongshi', '♠', 5), null, null);
    const immune = !A.canBeTarget(0, 'skill');
    const shaOk = A.canBeTarget(0, 'sha');
    A.resetTurnState(G.players[0]);
    return { immune, shaOk, afterReset: A.canBeTarget(0, 'skill') };
  });

  /* 11. 全知天眼：公开本命 + 结怨 */
  await run('quanzhi', async () => {
    reset();
    G.players[1].hand = [mk('手牌X', 'basic', 'none', '♥', 3)];
    const before = A.grudgeOf(1, 0);
    await A.useSkill(0, mk('全知天眼', 'skill', 'quanzhi', '♠', 5), 1, null);
    return { shown: G.players[1].cult?.benmingShown, grudge: A.grudgeOf(1, 0) - before };
  });

  /* 12. 筑基丹 / 命演术（每局一次 + 自损 1 点） */
  await run('danMingyan', async () => {
    reset();
    const exp0 = G.players[0].cult?.exp || 0;
    await A.useSkill(0, mk('筑基丹', 'skill', 'dan', '♠', 5), null, null);
    const expDelta = (G.players[0].cult?.exp || 0) - exp0;
    G.deck = [mk('红桃判定', 'basic', 'none', '♥', 3)];
    const hp0 = G.players[0].hp;
    await A.useSkill(0, mk('命演术', 'skill', 'mingyan', '♠', 5), 1, null);
    const first = { hp: G.players[0].hp, known: (G.players[1].roleKnownTo || []).includes(0) };
    G.deck = [mk('红桃判定2', 'basic', 'none', '♥', 3)];
    await A.useSkill(0, mk('命演术', 'skill', 'mingyan', '♠', 5), 1, null);
    return { expDelta, hp0, first, secondHp: G.players[0].hp };
  });

  /* 13. 判定阶段：三种延时锦囊 */
  await run('judge', async () => {
    const one = async (judgeType, suit, num) => {
      reset();
      G.players[1].judge.push({ ...mk('延时', 'skill', judgeType, '♠', 1), judgeType });
      G.deck = [mk('判定', 'basic', 'none', suit, num)];
      await A.judgePhase(G.players[1]);
      return { skipPlay: G.players[1].flags.skipPlay, skipDraw: G.players[1].flags.skipDraw, hp: G.players[1].hp, judge: G.players[1].judge.length };
    };
    return {
      lebu: await one('lebu', '♠', 5),
      bingliang: await one('bingliang', '♠', 5),
      shandian: await one('shandian', '♠', 5),
    };
  });

  /* 14. 范围 / 手牌上限 / 花色封锁 */
  await run('rules', async () => {
    reset();
    const p0 = G.players[0];
    p0.equip.weapon = mk('测试剑', 'equip', 'weapon', '♠', 1, { range: 3 });
    const range = A.attackRange(p0);
    p0.equip.armor = mk('储物袋', 'equip', 'fabao', '♠', 1, { skill: 'chuwu', equipSlot: 'armor', category: 'fabao' });
    const limit = A.handLimit(p0);
    p0.hand = [mk('攻击A', 'basic', 'sha', '♠', 1), mk('攻击B', 'basic', 'sha', '♥', 2)];
    p0.flags.blockSuit = '♠';
    const usable = A.usableHand(p0, (c) => c.sub === 'sha').map((c) => c.name);
    return { range, limit, usable };
  });

  /* 15. 编译产物里的单目标名单同源 */
  await run('singleList', () => ({ list: [...A.ZML_SINGLE_TARGET_SUBS] }));

  return R;
});

function v(key) { return out[key] || {}; }

check('调试探针与页面无运行时异常', out.errors.length === 0, out.errors.slice(0, 3).join(' ; '));
const deck = v('deck');
check('牌堆 229 张且与 ZML_ALL / ZML_DECK_TOTAL 同源', deck.total === 229 && deck.declared === 229 && deck.defsTotal === 229, `${deck.total}/${deck.declared}/${deck.defsTotal}`);
check('牌堆每张牌字段完整、sub 种类与定义一致', deck.noBlank && deck.subCount === deck.defSubCount, `${deck.subCount} 种`);
check('真实牌堆里五把【无形】剑携带 wuxing 标记（数据→运行时贯通）',
  JSON.stringify(deck.wuxingNames) === JSON.stringify(['幻影无形剑', '幻日无形剑', '幻星无形剑', '幻月无形剑', '伪无形剑'].sort()),
  (deck.wuxingNames || []).join(','));
const basic = v('basic');
check('恢复牌回 1 血；增益牌每回合限一次不叠加', basic.healed === 3 && basic.first === 1 && basic.second === 1 && basic.jiuUsed === true, JSON.stringify(basic));
const sweep = v('sweep');
check(`逐个结算 ${sweep.count || 0} 个锦囊 sub，无静默空转`, sweep.count >= 20 && sweep.noop?.length === 0, (sweep.noop || []).join(','));
const at = v('attr');
check('属性攻防：道统相克 +1 / 被克 -1（可为 0）/ 中性 1 点', at.win === 2 && at.lose === 0 && at.neutral === 1, JSON.stringify(at));
const wuxing = v('wuxing');
check('【无形】兵器免疫破阵符/敛息诀，且不误伤其它锦囊', wuxing.guohe === true && wuxing.shunshou === true && wuxing.other === false && wuxing.hand === 1 && wuxing.weapon === true, JSON.stringify(wuxing));
const wh = v('wuxinghe');
check('【无形鹤】不被破阵符弃置，但可被敛息诀取得', wh.afterGuohe === true && wh.afterShunshou === false && wh.gained === 1, JSON.stringify(wh));
const yy = v('yaoyao');
check('【银背驮鳐】免疫万剑钻心，其它角色照常受伤', yy.immune === 4 && yy.other === 3, JSON.stringify(yy));
const fx = v('feixie');
check('【飞蟹载客】相邻同门 +1、非相邻不生效、不与自身载具叠加', fx.base === 2 && fx.escorted === 3 && fx.far === 2 && fx.noStack === 3, JSON.stringify(fx));
const cp = v('copy');
check('诡代/代征费用门槛：牌不足时不可使用', cp.gate1 === false && cp.gate2 === true && cp.gate3 === false && cp.gate4 === true, JSON.stringify([cp.gate1, cp.gate2, cp.gate3, cp.gate4]));
check('诡代之法：弃 1 张、只复制非限定技、持续到下个回合开始', cp.guidai?.hand === 2 && cp.guidai?.id === 't_normal' && cp.guidai?.until === 'nextTurn' && cp.guidai?.copied === true && cp.survivesTurnCleanup === 1 && cp.afterNextTurn === 0, JSON.stringify(cp.guidai));
check('本命代征：弃 2 张、可复制限定技、本回合结束失效', cp.daizheng?.hand === 1 && cp.daizheng?.id === 't_limit' && cp.daizheng?.until === 'turn' && cp.afterTurn === 0, JSON.stringify(cp.daizheng));
check('无可复制天赋时不白扣手牌', cp.noTargetSkill?.hand === 2 && cp.noTargetSkill?.talents === 0, JSON.stringify(cp.noTargetSkill));
const gd = v('guandingAi');
check('观顶（AI）：取价值最高的 1 张，其余按原序放回', gd.picked === true && gd.hand === 1 && gd.deck === 2 && gd.topIsC0 === true && gd.secondIsC1 === true, JSON.stringify(gd));
const ts = v('tongshi');
check('通明身识：本回合免疫锦囊指定、回合初重置后恢复', ts.immune === true && ts.shaOk === true && ts.afterReset === true, JSON.stringify(ts));
const qz = v('quanzhi');
check('全知天眼：公开本命并令目标 +1 敌意', qz.shown === true && qz.grudge === 1, JSON.stringify(qz));
const dm = v('danMingyan');
check('筑基丹修为 +2；命演术红桃洞悉身份、自损 1 点、每局一次', dm.expDelta === 2 && dm.first?.hp === 3 && dm.first?.known === true && dm.secondHp === 3, JSON.stringify(dm));
const jd = v('judge');
check('判定阶段：七星定身阵跳出牌 / 哼哈真言跳摸牌 / 天劫 3 点雷伤', jd.lebu?.skipPlay === true && jd.bingliang?.skipDraw === true && jd.shandian?.hp === 1 && jd.shandian?.judge === 0, JSON.stringify(jd));
const rl = v('rules');
check('攻击范围取武器范围、储物袋手限 +2、花色封锁过滤可用牌', rl.range === 3 && rl.limit === 6 && rl.usable?.length === 1 && rl.usable?.[0] === '攻击B', JSON.stringify(rl));
const sl = v('singleList');
check('产物内单目标名单含 4 张掌门路原生锦囊（兼爱可转移）', ['mingyan', 'guidai', 'daizheng', 'quanzhi'].every((s) => sl.list?.includes(s)), (sl.list || []).join(','));

/* ---------------- 交互场景：真人响应窗口 / 观顶手动选择 ---------------- */
async function startResponse(setup) {
  await page.evaluate((cfg) => {
    const { reset, mk, A, G } = window.__t;
    reset(1);
    const p = G.players[1];
    p.hand = [mk('攻击A', 'basic', 'sha', '♠', 1), mk('攻击B', 'basic', 'sha', '♥', 2)];
    if (cfg.blockSuit) p.flags.blockSuit = cfg.blockSuit;
    window.__resp = { promise: A.respondToTrick(1, cfg.kind || 'sha'), ids: p.hand.map((c) => c.id) };
  }, setup);
  await page.waitForFunction(() => window.__game.G.pendingType === 'response' && window.__game.G.pendingOptions?.length, { timeout: 5000 });
  return page.evaluate(() => ({
    type: window.__game.G.pendingType,
    options: window.__game.G.pendingOptions.map((o) => String(o.value)),
    ids: window.__resp.ids,
  }));
}
async function finishResponse(value) {
  await page.evaluate((v) => window.handleLocalChoice(v), value);
  return page.evaluate(async () => ({
    played: await window.__resp.promise,
    hand: window.__game.G.players[1].hand.length,
    pending: window.__game.G.pendingOptions,
  }));
}

const r1 = await startResponse({});
check('真人有响应窗口且列出每张可出牌 + 放弃', r1.type === 'response' && r1.options.length === 3 && r1.options[2] === 'pass', r1.options.join(','));
const f1 = await finishResponse(`card_${r1.ids[1]}`);
check('响应窗口可指定打出第二张【攻击】', f1.played?.name === '攻击B' && f1.hand === 1 && f1.pending === null, JSON.stringify({ played: f1.played?.name, hand: f1.hand }));

const r2 = await startResponse({});
const f2 = await finishResponse('pass');
check('响应窗口可主动「放弃」且不弃牌', f2.played === null && f2.hand === 2, JSON.stringify({ played: f2.played, hand: f2.hand }));

const r3 = await startResponse({ blockSuit: '♠' });
check('响应窗口遵守花色封锁（被封锁牌不进入候选）', r3.options.length === 2 && r3.options[0] === `card_${r3.ids[1]}`, r3.options.join(','));
await finishResponse('pass');

// 观顶：真人手动挑选 3 张中的第 3 张
await page.evaluate(() => {
  const { reset, mk, A, G } = window.__t;
  reset(0);
  const c0 = mk('顶A', 'basic', 'none', '♠', 1);
  const c1 = mk('顶B', 'basic', 'none', '♥', 2);
  const c2 = mk('顶C', 'basic', 'tao', '♦', 3);
  G.deck = [c2, c1, c0];
  window.__gd = { promise: A.useSkill(0, mk('料敌机先', 'skill', 'guanding', '♠', 5), null, null), ids: [c0.id, c1.id, c2.id] };
});
await page.waitForFunction(() => window.__game.G.pendingOptions?.some((o) => String(o.value).startsWith('top_')), { timeout: 6000 });
const gdOpts = await page.evaluate(() => window.__game.G.pendingOptions.map((o) => String(o.value)));
await page.evaluate(() => window.handleLocalChoice('top_2'));
const gdRes = await page.evaluate(async () => {
  await window.__gd.promise;
  return {
    hand: window.__game.G.players[0].hand.map((c) => c.id),
    deck: window.__game.G.deck.map((c) => c.id),
    ids: window.__gd.ids,
  };
});
check('观顶给真人 3 选 1 的窗口', gdOpts.length === 3 && gdOpts.join(',') === 'top_0,top_1,top_2', gdOpts.join(','));
check('观顶手动选择生效且其余按原序放回', gdRes.hand.includes(gdRes.ids[2]) && gdRes.hand.length === 1 && gdRes.deck[1] === gdRes.ids[0] && gdRes.deck[0] === gdRes.ids[1], JSON.stringify(gdRes));

check('控制台零错误', errors.length === 0, errors.slice(0, 3).join(' ; '));

await browser.close();
server.kill();

const failed = results.filter((r) => !r.ok);
console.log(`\n===== 玩法运行时验证 ${results.length - failed.length}/${results.length} 通过 =====`);
if (failed.length) {
  console.log('失败项:', failed.map((f) => f.name).join(' | '));
  process.exit(1);
}
