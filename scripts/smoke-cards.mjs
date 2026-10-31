// 冒烟测试：卡牌扩展包（牌库扩展包开关 + 缺卡补齐 + 零回归）
// 用法：node scripts/smoke-cards.mjs [html文件名]
// 断言重点：
//   1. 不启用扩展包时 buildDeck() 产物与基础 125 张**逐项一致**（零回归底线）
//   2. 各卡包勾选后对应卡牌按张数进入牌堆
//   3. 选择面板 / 本地记忆 / 规则书文案
//   4. 全卡包开局后 AI 能持续推进、无控制台报错（新卡不会让回合卡死）
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '掌门杀.html';
const PORT = 8913;
const url = `http://127.0.0.1:${PORT}/${encodeURIComponent(file)}`;

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
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
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
  const dirs = fs
    .readdirSync(base)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort()
    .reverse();
  for (const d of dirs) {
    const exe = path.join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

const results = [];
const errors = [];
function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) process.exitCode = 1;
}

if (!(await waitServer())) {
  console.error('❌ 静态服务器未能启动');
  server.kill();
  process.exit(1);
}

const browser = await chromium.launch(findHeadlessShell() ? { executablePath: findHeadlessShell() } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('dialog', (d) => d.accept().catch(() => {}));

await page.goto(url, { waitUntil: 'networkidle' });
// 清空上次的开局记忆，保证卡包勾选状态从「仅基础包」开始
await page.evaluate(() => localStorage.removeItem('xuetangsha_setup_v1'));
await page.reload({ waitUntil: 'networkidle' });

/* ---------- 1. 零回归：修真牌堆构成（237 张） ---------- */
// 牌堆已统一为「全修真」牌堆（`buildDeck` → `buildZmlDeck`，经典扩展包卡不再投放）。
// 下表是当前修真牌堆的各 sub 基线张数，用于回归比对。
const BASE = {
  // 基本牌（攻击 / 防御 / 恢复 / 增益）
  sha: 20, huo: 5, lei: 5, shan: 15, tao: 8, jiu: 5,
  // 通用锦囊
  wuzhong: 7, guohe: 8, shunshou: 5, juedou: 3, nanman: 7, wanjian: 3,
  taoyuan: 2, wuxie: 4, lebu: 5, shandian: 2, jiedao: 3, wugu: 2,
  tiesuo: 6, huogong: 6, bingliang: 2,
  // 角色专属 / 机制锦囊
  mingyan: 6, tongshi: 2, guidai: 2, daizheng: 1, quanzhi: 1, dan: 3,
  // 装备（兵器 / 防具 / 坐骑 / 法宝）
  weapon: 11, armor: 7, 'horse+': 6, 'horse-': 5, fabao: 70,
};

const baseStats = await page.evaluate(() => window.__xtsDeckStats([]));
let baseOk = true;
const diffs = [];
for (const [sub, n] of Object.entries(BASE)) {
  if ((baseStats[sub] || 0) !== n) {
    baseOk = false;
    diffs.push(`${sub}: 期望 ${n} 实际 ${baseStats[sub] || 0}`);
  }
}
check('零回归·修真牌堆各子类张数与基线一致', baseOk, diffs.length ? diffs.join('；') : `${Object.keys(BASE).length} 个子类全部匹配`);
const baseTotal = Object.values(baseStats).reduce((s, n) => s + n, 0);
check('零回归·修真牌堆总量 = 237 张', baseTotal === 237, `共 ${baseTotal} 张`);
// 扩展包专属 sub 不应出现在基础牌堆中（经典扩展包卡尚未修真化，暂不投放）
const EXTRA_ONLY = ['zhiji', 'shuishui', 'caomu', 'yuanjiao', 'yiyi', 'huoshao', 'diaohu', 'lianjun', 'chiling', 'wuxieguo', 'qilin', 'zhuque', 'yinyue', 'qixing', 'taiping', 'mingguang', 'wuliu', 'muyu'];
const noExtra = EXTRA_ONLY.every((s) => !baseStats[s]);
check('零回归·未启用扩展包时牌堆不含扩展包专属卡', noExtra, noExtra ? '' : EXTRA_ONLY.filter((s) => baseStats[s]).join('/'));

/* ---------- 1.5 属性攻防体系（仅掌门路）：数据自检 ---------- */
const att = await page.evaluate(() => window.__xtsAttrInfo());
check(
  '61 名角色全部有道统',
  att.characters === 61 && att.missingTaoism === 0,
  `${att.characters} 人 / 缺失 ${att.missingTaoism}`,
);
const WANT_TAO = { dao: 46, fo: 4, ru: 5, mo: 2, gui: 2, waidao: 2 };
const badTao = Object.entries(WANT_TAO).filter(([k, n]) => (att.taoism[k] || 0) !== n);
check(
  '道统分布与设定一致（道 46 / 佛 4 / 儒 5 / 魔 2 / 鬼 2 / 外道 2）',
  badTao.length === 0,
  badTao.length ? badTao.map(([k, n]) => `${k} 期望 ${n} 实际 ${att.taoism[k] || 0}`).join('；') : '全部匹配',
);
check('灵兽之躯标记（5 人）', att.lingshou.length === 5, att.lingshou.join('、'));
check(
  '道统 6 环闭环（道→鬼→儒→外道→佛→魔→道）',
  att.taoismRing.join(',') === 'dao>gui,gui>ru,ru>waidao,waidao>fo,fo>mo,mo>dao',
  att.taoismRing.join('、'),
);
check(
  '五行环闭环（金克木…火克金）',
  att.elementRing.join(',') === 'metal>wood,wood>earth,earth>water,water>fire,fire>metal',
  att.elementRing.join('、'),
);
const s = att.sample;
check(
  '相克判定（道统 / 五行 / 道德鬼物 / 风毒 / 缺属性）',
  s.foVsMo === 'win' &&
    s.moVsFo === 'lose' &&
    s.woodVsEarth === 'win' &&
    s.earthVsWood === 'lose' &&
    s.woodVsMetal === 'lose' &&
    s.sameMetal === 'judge' &&
    s.daodeVsGuiwu === 'win' &&
    s.duVsFeng === 'lose' &&
    s.noneAttr === 'none',
  JSON.stringify(s),
);
const WANT_ATTR = { wood: 8, metal: 5, fire: 13, lei: 5, shou: 4, water: 2, earth: 1, feng: 1, daode: 1, du: 2, guiwu: 1 };
const badAttr = Object.entries(WANT_ATTR).filter(([k, n]) => (att.attrs[k] || 0) !== n);
check(
  '卡牌属性标注齐备（五行 / 雷 / 兽 / 道德 / 鬼物 / 风 / 毒）',
  badAttr.length === 0,
  badAttr.length
    ? badAttr.map(([k, n]) => `${k} 期望 ${n} 实际 ${att.attrs[k] || 0}`).join('；')
    : `11 类共 ${Object.values(att.attrs).reduce((a, b) => a + b, 0)} 张`,
);

/* ---------- 2. 各卡包勾选后卡牌入池 ---------- */
// 说明：牌堆已统一为「全修真」牌堆（`buildDeck` 不再投放经典扩展包卡——
// 麒麟弓 / 朱雀羽扇 / 太平要术 / 明光铠 / 吴六剑 / 木牛流马 / 赤兔 等扩展卡牌名
// 尚未修真化，混入修真牌堆会造成两套命名）。因此勾选扩展包**不应**改变牌堆构成，
// 待扩展包完成修真化后，再把下列目标张数恢复为「勾选后按张数入池」的断言。
const EXPECT_TARGET = {
  // 哼哈真言 ×2 + 麒麟弓 + 朱雀羽扇（武器 10 → 12）
  junzheng: { bingliang: 2, weapon: 12 },
  // 银月枪 + 七星刀（武器 12）+ 太平要术 + 明光铠（防具 8）
  shenhua: { weapon: 12, armor: 8 },
  // 吴六剑（武器 11）+ 木牛流马（宝物 1）+ 三匹 +1 马 + 三匹 -1 马
  sp: { weapon: 11, fabao: 1, 'horse+': 6, 'horse-': 6 },
  yingbian: { zhiji: 2, shuishui: 2, caomu: 2, yuanjiao: 1, yiyi: 1, huoshao: 1 },
  guozhan: { wuxieguo: 2, diaohu: 2, lianjun: 1, chiling: 1 },
};
for (const pack of Object.keys(EXPECT_TARGET)) {
  const st = await page.evaluate((p) => window.__xtsDeckStats([p]), pack);
  const diff = Object.entries(BASE).filter(([sub, n]) => (st[sub] || 0) !== n);
  check(
    `卡包「${pack}」勾选后不改变修真牌堆构成（扩展卡待修真化）`,
    diff.length === 0,
    diff.length ? diff.map(([s, n]) => `${s}: 基础 ${n} 实际 ${st[s] || 0}`).join('；') : '与基础牌堆一致',
  );
}

/* ---------- 3. 选择面板与本地记忆 ---------- */
await page.click('#modePicker .mode-card[data-mode="single"]');
await page.waitForSelector('#screenSetup.active', { timeout: 3000 });
const cpBtns = await page.locator('#cardPackPicker .opt-btn').count();
check('牌库扩展包面板渲染（6 个卡包）', cpBtns === 6, `${cpBtns} 个`);
const coreClickable = await page.locator('#cardPackPicker .opt-btn[data-cardpack="core"]').getAttribute('onclick');
check('基础牌堆恒启用且不可关闭', coreClickable === null || coreClickable === '');

await page.evaluate(() => window.toggleCardPack('junzheng'));
await page.evaluate(() => window.toggleCardPack('guozhan'));
const cpActive = await page.locator('#cardPackPicker .opt-btn.active').count();
check('多选勾选生效（军争篇 + 国战篇）', cpActive === 2, `${cpActive} 个已启用`);
const cpHint = (await page.textContent('#cardPackHint')) || '';
check('面板提示反映当前牌库', cpHint.includes('军争篇') && cpHint.includes('国战'), cpHint.trim().slice(0, 40));
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('xuetangsha_setup_v1') || '{}').cardPacks || []);
check('勾选结果持久化到 localStorage', saved.includes('junzheng') && saved.includes('guozhan'), saved.join(','));

/* ---------- 4. 规则书「卡牌说明」含扩展卡 ---------- */
await page.evaluate(() => window.openRules());
await page.waitForSelector('#rulesModal.show', { timeout: 3000 });
await page.click('.rule-tab[data-tab="cards"]');
await page.waitForTimeout(150);
const cardsTxt = (await page.textContent('#rulesContent')) || '';
check('规则书含「牌库扩展包」分区', cardsTxt.includes('牌库扩展包'));
check(
  '规则书含扩展卡包卡名（哼哈真言 / 不在算中·国 / 木牛流马）',
  cardsTxt.includes('哼哈真言') && cardsTxt.includes('不在算中·国') && cardsTxt.includes('木牛流马'),
);
await page.click('#rulesModal .rules-close');
await page.waitForTimeout(150);

/* ---------- 5. 全卡包开局：AI 不卡死、无报错 ---------- */
// 前一步已勾选 junzheng / guozhan，此处只补勾其余三个（toggle 为开关，不可重复点已启用的）
await page.evaluate(() => {
  for (const p of ['shenhua', 'sp', 'yingbian']) window.toggleCardPack(p);
});
const allStats = await page.evaluate(() => window.__xtsDeckStats(['junzheng', 'shenhua', 'sp', 'yingbian', 'guozhan']));
check(
  '全卡包启用后牌堆仍为统一修真牌堆',
  allStats.bingliang === 2 && !allStats.wuxieguo && !allStats.zhiji && !allStats.diaohu,
  `bingliang=${allStats.bingliang} wuxieguo=${allStats.wuxieguo ?? 0} zhiji=${allStats.zhiji ?? 0} 共 ${Object.values(allStats).reduce((s, n) => s + n, 0)} 张`,
);
await page.click('#startBtn');
await page.waitForSelector('#revealModal.show', { timeout: 3000 }).catch(() => {});
if (await page.isVisible('#revealModal.show')) {
  await page.click('#revealBody button[onclick="revealConfirm()"]');
}
await page.waitForSelector('#screenGame.active', { timeout: 6000 });
check('全卡包可正常开局', await page.isVisible('#screenGame.active'));
await page.waitForTimeout(2000);

// 掌门路四槽制：武器 / 防具 / +1载具 / -1载具（法宝按特性落在武器或防具槽）
const slots = await page.locator('#seatRing .p-card .equip-slot').count();
check('座位装备槽含四槽制装备区（4 槽/人）', slots % 4 === 0 && slots > 0, `${slots} 个槽位`);

if (await page.isVisible('#quizModal.show')) {
  await page.click('.quiz-option').catch(() => {});
}
if (await page.isVisible('button:has-text("结束出牌")')) {
  await page.click('button:has-text("结束出牌")');
}
const logA = await page.locator('#playLogList .play-log-item').count();
// 人机混合推进：本局真人座位会挂起各种决策（参悟 / 出牌 / 出闪 / 选目标），
// 逐个点掉第一个可用选项，把回合交给 AI，再观察战报是否持续增长
for (let k = 0; k < 14; k++) {
  if (await page.isVisible('#quizModal.show')) {
    await page.click('.quiz-option').catch(() => {});
    await page.waitForTimeout(1200);
    continue;
  }
  const btn = page.locator('button[onclick*="handleLocalChoice"]:not([disabled])').first();
  if (await btn.count()) await btn.click().catch(() => {});
  await page.waitForTimeout(1200);
}
const logB = await page.locator('#playLogList .play-log-item').count();
check('人机混合推进（新卡不会让回合卡死）', logB > logA, `${logA} → ${logB} 条`);
check('无控制台报错', errors.length === 0, errors.slice(0, 2).join(' | '));

await page.screenshot({ path: path.resolve(dirname, '..', 'dist', 'smoke-cards.png'), fullPage: false });

const pass = results.filter((r) => r.ok).length;
console.log(`\n${pass}/${results.length} 项通过`);
await browser.close();
server.kill();
process.exit(pass === results.length ? 0 : 1);
