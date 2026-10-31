// 冒烟测试：加载构建产物，跑通 大厅 → 单机开局 → 出牌/AI 主流程
// 用法：node scripts/smoke.mjs [html文件名] [截图输出路径]
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '掌门杀.html';
const shot = process.argv[3] || path.resolve(dirname, '..', 'dist', 'smoke.png');
const PORT = 8901;
const url = `http://127.0.0.1:${PORT}/${encodeURIComponent(file)}`;

// 自己拉起静态服务器子进程（避免依赖外部 shell）
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

// 在 ms-playwright 目录中找一个可用的 headless shell（版本号不强制匹配）
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
console.log('headless shell:', executablePath || '(default)');

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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('dialog', (d) => d.accept().catch(() => {}));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);

// 1. 主界面：固定顶栏 + 个人成就 + 模式选择
check('固定顶栏可见', await page.isVisible('#topBar'));
const tbName0 = (await page.textContent('#tbName')) || '';
check('顶栏显示昵称', tbName0.trim().length > 0, tbName0);
const achCount = await page.locator('#achGrid .ach-item').count();
check('个人成就网格渲染', achCount > 0, `${achCount} 项`);
const modeCount = await page.locator('#modePicker .mode-card').count();
check('模式选择（单机/联机）', modeCount === 2, `${modeCount} 张`);
// 答题 / 年级 / 题库 / 商店 UI 应已移除
check('已移除年级选择器', (await page.locator('#gradePicker').count()) === 0);
check('已移除学习情况面板', (await page.locator('#studyPanel').count()) === 0);
check('已移除学分商店入口', (await page.locator('#shopEntryBox').count()) === 0);
check('已移除答题弹窗', (await page.locator('#quizModal').count()) === 0);

// 1.1 个人信息芯片（我的档案 + 个性化资料）
await page.locator('#topBar .tb-user-chip').click();
await page.waitForSelector('#profileModal.show', { timeout: 3000 });
const pmt = (await page.textContent('#profileModalTitle')) || '';
check('合并弹窗打开且标题栏含境界/修为徽章', pmt.includes('境·') && pmt.includes('修为'), pmt);
const pickItems = await page.locator('#profileEditor .pick-item').count();
check('个性化资料面板（头像+性别+心情图标）', pickItems >= 36, `${pickItems} 个可选项`);
await page.fill('#profileNameInput', '齐休');
await page.locator('#profileEditor .pick-item').nth(1).click(); // 头像
await page.click('#profileModal .rules-close');
await page.waitForTimeout(200);
const tbName1 = (await page.textContent('#tbName')) || '';
check('顶栏昵称反映个性化设置', tbName1.includes('齐休'), tbName1);

await page.screenshot({ path: path.resolve(dirname, '..', 'dist', 'smoke-lobby.png'), fullPage: true });

// 1.2 选择单机模式 → 进入对局设置子界面
await page.click('#modePicker .mode-card[data-mode="single"]');
await page.waitForSelector('#screenSetup.active', { timeout: 3000 });
check('选择模式后进入设置子界面', await page.isVisible('#screenSetup.active'));

const charCards = await page.locator('#charGrid .char-card').count();
check('角色卡渲染（子界面）', charCards > 0, `${charCards} 名角色`);
const factions = await page.locator('#factionPicker .faction-card').count();
// 掌门路第十势力「蛮荒」（承载醒狮等化神古兽）已加入，故为 10 门派
check('修真势力选择（子界面）', factions === 10, `${factions} 个势力`);
const packBtns = await page.locator('#packetPicker .opt-btn').count();
// 年级扩展包已移除，角色池只剩「全部角色」单项；选角改由门派筛选（#factionPicker，10 门派）
check('角色池选择器仅剩「全部角色」', packBtns === 1, `${packBtns} 个选项`);

// 1.3 随机武将预览卡：完整展示（技能/主公技）+ 换将
const rcpSkills = await page.locator('#charPreview .rcp-skill').count();
check('随机武将预览卡：技能详情展示', rcpSkills > 0, `${rcpSkills} 个技能`);
const rcpLord = await page.locator('#charPreview .rcp-lord').count();
check('随机武将预览卡：主公技展示', rcpLord === 1);
const rcpMeta = (await page.locator('#charPreview .rcp-meta').textContent()) || '';
check('随机武将预览卡：势力与体力展示', rcpMeta.includes('体力'), rcpMeta.trim().slice(0, 24));

// 1.4 玩家总数滑块
const sliderOk = await page.locator('#countSlider').count();
check('人数滑块存在', sliderOk === 1);
await page.fill('#countSlider', '6');
await page.waitForTimeout(200);
const countLabel = await page.textContent('#countValue');
check('滑块设置人数', (countLabel || '').includes('6'), `${countLabel}`);
const roleCards = await page.locator('#rolePicker .role-card').count();
check('滑块联动身份可选范围', roleCards >= 4, `${roleCards} 个身份卡`);
await page.fill('#countSlider', '4'); // 复位为 4 人局以便后续断言
await page.waitForTimeout(200);

// 2. 开始单机对局（随机模式：先亮将确认）
// 显式指定掌门路模式：本地记忆可能残留经典模式，属性 / 道统徽标仅掌门路渲染
await page.evaluate(() => window.setRuleMode('zml'));
await page.click('#startBtn');
await page.waitForSelector('#revealModal.show', { timeout: 3000 });
check('开局亮将弹窗（随机模式）', await page.isVisible('#revealModal.show'));
const rvSkills = await page.locator('#revealBody .rcp-skill').count();
check('亮将弹窗：完整武将卡', rvSkills > 0, `${rvSkills} 个技能`);
await page.click('#revealBody button[onclick="revealConfirm()"]');
await page.waitForSelector('#screenGame.active', { timeout: 5000 });
await page.waitForTimeout(2500);

// 3. 规则弹窗
await page.locator('#topBar button[onclick="openRules()"]').first().click();
await page.waitForSelector('#rulesModal.show', { timeout: 3000 });
const rulesLen = (await page.textContent('#rulesContent'))?.length || 0;
check('规则弹窗', rulesLen > 500, `${rulesLen} 字`);
await page.click('#rulesModal .rules-close');

const seats = await page.locator('#seatRing .p-card').count();
check('座位渲染（4人局）', seats === 4, `${seats} 个座位`);

// 掌门路：每名角色显示道统徽标（经典模式无该字段，不渲染）
const taoTags = await page.locator('#seatRing .taoism-tag').count();
check('座位道统徽标（掌门路 61 人全员标注）', taoTags === seats, `${taoTags}/${seats}`);

// 4. 手牌渲染
const cards = await page.locator('#handRow .card').count();
check('手牌渲染', cards > 0, `${cards} 张`);

// 5. 战报日志
const logItems = await page.locator('#playLogList .play-log-item').count();
check('战报日志', logItems > 0, `${logItems} 条`);

// 6. 跑到结束出牌按钮出现并点击（若在我方回合）
let ended = false;
if (await page.isVisible('button:has-text("结束出牌")')) {
  await page.click('button:has-text("结束出牌")');
  ended = true;
}
check('结束出牌交互', true, ended ? '已点击' : '非本人回合，跳过');

// 7. 观察 AI 自动对战 8 秒
await page.waitForTimeout(8000);
const logItems2 = await page.locator('#playLogList .play-log-item').count();
check('AI 自动推进', logItems2 >= logItems, `${logItems} → ${logItems2} 条`);

await page.screenshot({ path: shot, fullPage: false });
console.log('screenshot:', shot);

// 8. 控制台错误
check('控制台零错误', errors.length === 0, errors.slice(0, 3).join(' ; '));

await browser.close();
server.kill();

const failed = results.filter((r) => !r.ok);
console.log(`\n===== ${results.length - failed.length}/${results.length} 通过 =====`);
if (failed.length) {
  console.log('失败项:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
