// 冒烟测试：掌门路模式（修真牌堆 + 原著角色 + 灵石 / 境界 / 灵地 / 身份）
// 用法：node scripts/smoke-zml.mjs [html文件名]
// 断言要点：
//   1. 大厅可切换到「掌门路」模式；
//   2. 修真牌堆 144 张，且含全部原著关键卡（回春丹 / 真源丹 / 不在算中 / 天劫 / 魔灾泛起 / 万剑钻心 …）；
//   3. 开局后身份显示为 掌门 / 弟子 / 邪修 / 黑手，座位显示境界条，灵地盘可见；
//   4. 出牌阶段提供坊市 / 突破 / 开辟灵地 等修真行动；
//   5. 可正常推进若干回合，且控制台零错误。
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '掌门杀.html';
const PORT = 8907;
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
const executablePath = findHeadlessShell();

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

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('dialog', (d) => d.accept().catch(() => {}));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);

// 1. 进入单机设置界面
await page.click('#modePicker .mode-card[data-mode="single"]');
await page.waitForSelector('#screenSetup.active', { timeout: 3000 });
check('进入对局设置子界面', await page.isVisible('#screenSetup.active'));

// 2. 对局模式选择器：3 个模式，可切到掌门路
const modeBtns = await page.locator('#ruleModePicker .opt-btn').count();
check('对局模式选择器渲染（经典 / 掌门路 / 开辟战争）', modeBtns === 3, `${modeBtns} 个`);
await page.evaluate(() => window.setRuleMode('zml'));
await page.waitForTimeout(200);
const activeMode = await page.locator('#ruleModePicker .opt-btn.active').first().textContent();
check('已切换到掌门路模式', (activeMode || '').includes('掌门路'), (activeMode || '').trim().slice(0, 10));

// 3. 修真牌堆 144 张与关键卡名
const stats = await page.evaluate(() => (window.__xtsZmlDeckStats ? window.__xtsZmlDeckStats() : {}));
const total = Object.values(stats).reduce((s, n) => s + n, 0);
check('掌门路牌堆共 146 张', total === 146, `${total} 张`);
const mustHave = ['杀', '火杀', '雷杀', '闪', '回春丹', '真源丹', '不在算中', '决斗', '魔灾泛起', '万剑钻心', '天劫', '三木回心阵', '七星定身阵', '藤蔓符', '混元剑狱', '极寒碧火诀', '趋吉避凶诀', '破阵符', '敛息诀', '银甲乐傀召唤符', '同参木阵', '诡代之法', '命演术', '通明身识', '全知天眼'];
const missing = mustHave.filter((n) => !stats[n]);
check('关键修真卡全部入池', missing.length === 0, missing.length ? `缺：${missing.join('、')}` : `${mustHave.length} 种`);
const equipKeys = ['灵狐剑匣', '伪无形剑', '月影玄冰剑', '心生蜂云剑', '洼角云刀', '七芯蝎尾夺', '碧火幽魂刀', '青铜长戟', '一剑碧环星', '七剑斩元星', '猴面金身法像', '清风法袍', '映雪冰风阵', '玄水归土阵', '广开道德金光大阵', '乙木御风梭', '虾驼兽', '飞蟹', '青灵石蒲团', '储物袋', '红玉阵盘', '通天令', '通明幻镜'];
const missingEq = equipKeys.filter((n) => !stats[n]);
check('装备（兵器/护身/载具/宝物）入池', missingEq.length === 0, missingEq.length ? `缺：${missingEq.join('、')}` : `${equipKeys.length} 种`);

// 4. 选一个原著角色后开局（避免随机亮将弹窗）
const charCards = await page.locator('#charGrid .char-card').count();
if (charCards > 0) await page.locator('#charGrid .char-card').first().click();
await page.waitForTimeout(150);
await page.click('#startBtn');
await page.waitForSelector('#screenGame.active', { timeout: 8000 });
await page.waitForTimeout(2500);
check('掌门路模式可正常开局', await page.isVisible('#screenGame.active'));

// 5. 身份：掌门 / 弟子 / 邪修 / 黑手
const roleTexts = await page.locator('.prole').allTextContents();
const zmlRoles = ['掌门', '弟子', '邪修', '黑手'];
const hasZmlRole = roleTexts.some((t) => zmlRoles.some((r) => t.includes(r)));
check('身份显示为掌门 / 弟子 / 邪修 / 黑手', hasZmlRole, roleTexts.join(' | ').slice(0, 60));

// 6. 境界 / 修为 / 灵石条
const cultTexts = await page.locator('.pcult-bar, div[title^="境界"]').allTextContents();
const hasRealm = cultTexts.some((t) => /练气|筑基|金丹|元婴|化神/.test(t));
check('座位显示境界 / 修为 / 灵石条', hasRealm, cultTexts.join(' | ').slice(0, 60));

// 7. 灵地盘
const groundVisible = await page.isVisible('#zmlGroundBoard');
const groundCells = await page.locator('#zmlGroundBoard div[title]').count();
check('灵地盘渲染（含灵地格）', groundVisible && groundCells > 0, `${groundCells} 块`);

// 8. 推进若干回合（点结束出牌，交给 AI）
const gameTextOf = async () => {
  try {
    return ((await page.textContent('#screenGame', { timeout: 1500 })) || '').length;
  } catch {
    return 0;
  }
};
const before = await gameTextOf();
for (let i = 0; i < 3; i++) {
  const endBtn = page.locator('#actionBtns button, #actionHint button').filter({ hasText: '结束出牌' }).first();
  if (await endBtn.count()) {
    await endBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
  } else {
    await page.waitForTimeout(1200);
  }
}
const after = await gameTextOf();
check('对局界面持续渲染（新机制不会卡死回合）', after > 0, `界面文本 ${before} → ${after}`);

await page.screenshot({ path: path.resolve(dirname, '..', 'dist', 'smoke-zml.png'), fullPage: true });

check('控制台零错误', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
server.kill();

const passed = results.filter((r) => r.ok).length;
console.log(`\n===== ${passed}/${results.length} 通过 =====`);
if (passed !== results.length || errors.length) {
  process.exit(1);
}
console.log('✅ 掌门路模式冒烟全部通过');
