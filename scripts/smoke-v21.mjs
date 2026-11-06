// 引擎查询层专项冒烟（原 v2.1 创意机制）：免疫指定牌 / 花色免疫 / 距离陷阱 /
// 装备失效 / 马政 / 效果转移 / 空城。
// 用法：node scripts/smoke-v21.mjs [html文件名]
//
// 旧版靠随机开局「开到墨子 / 法拉第 / 徐霞客…」这些经典模式角色，Phase 1 移除经典角色池后
// 会一直空转。现改为从真实 TALENT_DEFS 中按效果原语找出技能定义，注入到确定性对局状态，
// 再断言 window.xtsV21（actions.ts / rules.ts / turn.ts 实际消费的查询层）——覆盖同一批机制且可复现。
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '掌门杀.html';
const PORT = 8905;
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
  const dirs = fs.readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse();
  for (const d of dirs) {
    const exe = path.join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

const errors = [];
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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('dialog', (d) => d.accept().catch(() => {}));

await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#modePicker .mode-card[data-mode="single"]');
await page.waitForSelector('#screenSetup.active', { timeout: 3000 });
await page.click('#startBtn');
await page.waitForSelector('#revealModal.show', { timeout: 3000 });
await page.click('#revealBody button[onclick="revealConfirm()"]');
await page.waitForSelector('#screenGame.active', { timeout: 5000 });
await page.waitForFunction(() => window.__game?.G.players.length >= 3, { timeout: 8000 });
await page.evaluate(() => {
  window.__game.G.gameOver = true;
  window.__game.G.players.forEach((p) => { p.hand = []; });
  window.setFxLevel('off');
});
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const A = window.__audit;
  const G = window.__game.G;
  const V = window.xtsV21;
  const defs = Object.values(A.TALENT_DEFS);
  const byEffect = (kind, pred = () => true) => {
    for (const d of defs) {
      const e = (d.effects || []).find((x) => x.kind === kind && pred(x));
      if (e) return { id: d.id, e };
    }
    return null;
  };
  const setTalents = (idx, ids, hand = []) => {
    const p = G.players[idx];
    p.alive = true;
    p.hp = 4; p.maxHp = 4;
    p.talents = ids.filter(Boolean).map((id) => ({ id, name: A.defOf(id)?.name || id, type: 'active', desc: '' }));
    p.skillUse = {};
    p.skillGame = {};
    p.hand = hand;
    p.equip = { weapon: null, armor: null, horsePlus: null, horseMinus: null };
    return p;
  };
  const probe = (idx) => ({
    immuneName: (n) => V.cardImmune(idx, n),
    target: (scope, name, suit) => V.canBeTarget(idx, scope, name, suit),
    void: (slot) => V.equipVoid(idx, slot),
    distTrap: () => V.distTrap(idx),
    horseDist: () => V.horseDist(idx),
    shaRedirect: () => V.shaRedirect(idx),
    skillRedirect: () => V.skillRedirect(idx),
  });
  const R = { found: {}, errors: [] };
  const run = (key, fn) => { try { R[key] = fn(); } catch (e) { R.errors.push(`${key}: ${e.message}`); } };

  // 1. 指定牌名免疫（含「单体锦囊仍可指定」的反例）
  run('cardImmune', () => {
    const hit = byEffect('cardImmune', (e) => (e.names || []).length > 0);
    if (!hit) return null;
    R.found.cardImmune = hit.id;
    setTalents(1, [hit.id]);
    const name = hit.e.names[0];
    return {
      id: hit.id,
      hit: probe(1).immuneName(name),
      blocked: !probe(1).target('skill', name),
      other: probe(1).target('skill', '破阵符'),
    };
  });

  // 2. 花色免疫
  run('suitImmune', () => {
    const hit = byEffect('suitImmune', (e) => (e.suits || []).length > 0);
    if (!hit) return null;
    R.found.suitImmune = hit.id;
    setTalents(1, [hit.id]);
    const suit = hit.e.suits[0];
    const otherSuit = ['♠', '♥', '♦', '♣'].find((s) => !hit.e.suits.includes(s));
    return { id: hit.id, blocked: !probe(1).target('skill', '破阵符', suit), allowed: otherSuit ? probe(1).target('skill', '破阵符', otherSuit) : true };
  });

  // 3. 锦囊免疫 / 杀与决斗免疫的作用域
  // 登记表里缺失的 scope 用测试定义补齐（TALENT_DEFS 是普通 Record，defOf 会即时读取），
  // 目的是覆盖 canBeTarget 的作用域分支而不是依赖某一届角色池。
  const ensureImmune = (scope) => {
    const hit = byEffect('immune', (e) => e.scope === scope);
    if (hit) return hit.id;
    const id = `__parity_immune_${scope}`;
    A.TALENT_DEFS[id] = {
      id, name: '测试免疫', kind: 'passive', timing: 'passive', desc: '',
      effects: [{ kind: 'immune', scope }],
    };
    return id;
  };
  run('immuneScope', () => {
    const all = ensureImmune('skill');
    const sd = ensureImmune('shaAndJuedou');
    R.found.immune = [all, sd];
    setTalents(1, [all]);
    const skillOnly = { skill: !probe(1).target('skill'), sha: probe(1).target('sha'), juedou: probe(1).target('juedou') };
    setTalents(1, [sd]);
    return { skillOnly, sd: { sha: !probe(1).target('sha'), juedou: !probe(1).target('juedou'), skill: probe(1).target('skill') } };
  });

  // 4. 空城（无手牌才免疫杀 / 决斗）
  run('noHandImmune', () => {
    const hit = byEffect('noHandImmune');
    if (!hit) return null;
    R.found.noHandImmune = hit.id;
    setTalents(1, [hit.id], []);
    const empty = !probe(1).target('sha');
    setTalents(1, [hit.id], [{ id: 999001, name: '手牌', type: 'basic', sub: 'none', suit: '♠', num: 1 }]);
    return { empty, withCard: probe(1).target('sha') };
  });

  // 5. 敌人装备区失效
  run('enemyEquipVoid', () => {
    const hit = byEffect('enemyEquipVoid', (e) => (e.slots || []).length > 0);
    if (!hit) return null;
    R.found.enemyEquipVoid = hit.id;
    setTalents(1, [hit.id]);
    const slots = hit.e.slots;
    return {
      id: hit.id,
      hit: slots.every((s) => probe(1).void(s)),
      notListed: ['weapon', 'armor', 'horsePlus', 'horseMinus'].filter((s) => !slots.includes(s)).every((s) => !probe(1).void(s)),
    };
  });

  // 6. 距离陷阱
  run('distTrap', () => {
    const hit = byEffect('distTrap');
    if (!hit) return null;
    R.found.distTrap = hit.id;
    setTalents(1, [hit.id]);
    return { id: hit.id, value: probe(1).distTrap(), expected: hit.e.min };
  });

  // 7. 马政：双马叠加减免
  run('horseDist', () => {
    const hit = byEffect('horseDist');
    if (!hit) return null;
    R.found.horseDist = hit.id;
    const p = setTalents(1, [hit.id]);
    const before = probe(1).horseDist();
    p.equip.horsePlus = { id: 999101, name: '+1载具', type: 'equip', sub: 'horse+', suit: '♠', num: 1 };
    p.equip.horseMinus = { id: 999102, name: '-1载具', type: 'equip', sub: 'horse-', suit: '♠', num: 1 };
    return { before, after: probe(1).horseDist(), expected: hit.e.n * 2 };
  });

  // 8. 目标转移（杀 / 锦囊互不影响）
  run('redirect', () => {
    const sr = byEffect('skillRedirect');
    const hr = byEffect('shaRedirect');
    if (!sr || !hr) return null;
    R.found.redirect = [sr.id, hr.id];
    setTalents(1, [sr.id]);
    const skillOnly = { skill: probe(1).skillRedirect(), sha: probe(1).shaRedirect() };
    setTalents(1, [hr.id]);
    return { skillOnly, shaOnly: { sha: probe(1).shaRedirect(), skill: probe(1).skillRedirect() } };
  });

  // 9. 探针基础面
  run('surface', () => ({ players: V.players().length, charOf: typeof V.charOf(0) === 'string' }));
  return R;
});

const v = (k) => out[k];
check('查询层验证无内部异常', out.errors.length === 0, out.errors.join(' ; '));
const ci = v('cardImmune');
check('指定牌名免疫接线正确且不影响其它牌', ci && ci.hit === true && ci.blocked === true && ci.other === true, JSON.stringify(ci));
const si = v('suitImmune');
check('指定花色免疫仅对该花色生效', si && si.blocked === true && si.allowed === true, JSON.stringify(si));
const is = v('immuneScope');
check('免疫作用域：锦囊免疫 / 杀与决斗免疫互不串扰', is && is.skillOnly.skill === true && is.skillOnly.sha === true && is.skillOnly.juedou === true && is.sd.sha === true && is.sd.juedou === true && is.sd.skill === true, JSON.stringify(is));
const nh = v('noHandImmune');
check('空城：无手牌免疫【攻击】、有手牌即失效', nh && nh.empty === true && nh.withCard === true, JSON.stringify(nh));
const ev = v('enemyEquipVoid');
check('装备失效只对声明的槽位生效', ev && ev.hit === true && ev.notListed === true, JSON.stringify(ev));
const dt = v('distTrap');
check('距离陷阱阈值来自技能定义', dt && dt.value === dt.expected, JSON.stringify(dt));
const hd = v('horseDist');
check('马政：双马时减免 = 技能系数 × 2', hd && hd.before === 0 && hd.after === hd.expected, JSON.stringify(hd));
const rd = v('redirect');
check('转移技：【兼爱】只转锦囊、【散射】只转【攻击】', rd && rd.skillOnly.skill === true && rd.skillOnly.sha === false && rd.shaOnly.sha === true && rd.shaOnly.skill === false, JSON.stringify(rd));
const sf = v('surface');
check('查询面可读取玩家数组与座位角色 id', sf && sf.players >= 3 && sf.charOf === true, JSON.stringify(sf));
check('控制台零错误', errors.length === 0, errors.slice(0, 3).join(' ; '));

await browser.close();
server.kill();
const failed = results.filter((r) => !r.ok);
console.log(`\n===== 引擎查询层验证 ${results.length - failed.length}/${results.length} 通过 =====`);
if (failed.length) {
  console.log('失败项:', failed.map((f) => f.name).join(' | '));
  process.exit(1);
}
