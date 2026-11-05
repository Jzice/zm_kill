// 特效冒烟：五套仙侠主题播放 / Canvas 粒子层 / 强度关闭 / 无头模拟 / 减弱动效
// 用法：node scripts/smoke-fx.mjs [html文件名]
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
const shot = path.resolve(dirname, '..', 'dist', 'smoke-fx.png');

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
  for (const d of fs.readdirSync(base).filter((x) => x.startsWith('chromium_headless_shell-')).sort().reverse()) {
    const exe = path.join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}

if (!(await waitServer())) {
  console.error('❌ 静态服务器未能启动');
  server.kill();
  process.exit(1);
}

const errors = [];
const browser = await chromium.launch(findHeadlessShell() ? { executablePath: findHeadlessShell() } : {});
function watch(page) {
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('dialog', (d) => d.accept().catch(() => {}));
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
watch(page);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);

check('特效调试探针可用', await page.evaluate(() => !!window.__fxDebug));
const st0 = await page.evaluate(() => window.__fxDebug.stage());
check('默认强度=标准且粒子舞台已挂载', st0.mounted === true && st0.level === 'lite', JSON.stringify(st0));

const themes = ['blade', 'ward', 'spirit', 'talisman', 'relic'];
for (const t of themes) {
  // emitted 为同步计数；played 在 await 渲染完成后才递增，故此处用 emitted 判定发射
  const before = await page.evaluate(() => window.__fxDebug.stats().emitted);
  await page.evaluate((k) => {
    void window.__fxDebug.fx[k](0);
  }, t);
  await page.waitForTimeout(140);
  const after = await page.evaluate(() => window.__fxDebug.stats().emitted);
  check(`主题 ${t} 发射成功`, after > before, `emitted ${before}→${after}`);
  if (t === 'blade') check('剑气 DOM 节点渲染', (await page.locator('.fx-slash').count()) > 0);
  if (t === 'ward') check('八卦护罩 DOM 节点渲染', (await page.locator('.shield-fx').count()) > 0);
  if (t === 'talisman') await page.screenshot({ path: shot });
}
const stAfter = await page.evaluate(() => window.__fxDebug.stage());
check('Canvas 粒子帧已运行', stAfter.frames > st0.frames, `frames ${st0.frames}→${stAfter.frames}`);
console.log('screenshot:', shot);

// 等待在途的 await 动画（slash/shield/trickCast/equipFx）全部结束，避免污染后续计数
await page.waitForTimeout(1200);
const playedAll = await page.evaluate(() => window.__fxDebug.stats().played);
check('五套主题渲染全部完成', playedAll >= themes.length, `played=${playedAll}`);

// 关闭特效：不播放、无粒子、rAF 停止
await page.evaluate(() => window.setFxLevel('off'));
await page.waitForTimeout(100);
const off0 = await page.evaluate(() => ({ stage: window.__fxDebug.stage(), stats: window.__fxDebug.stats() }));
await page.evaluate(() => {
  void window.__fxDebug.ping(0);
});
await page.waitForTimeout(220);
const off1 = await page.evaluate(() => ({ stage: window.__fxDebug.stage(), stats: window.__fxDebug.stats() }));
check('关闭强度：零播放且粒子清空',
  off1.stats.played === off0.stats.played && off1.stats.skipped > off0.stats.skipped && off1.stage.particles === 0,
  `skipped ${off0.stats.skipped}→${off1.stats.skipped}`);
check('关闭强度：动画帧已停止', off1.stage.frames === off0.stage.frames, `frames=${off1.stage.frames}`);

// 无头模拟：闸门在 fxBus 单点生效
await page.evaluate(() => window.setFxLevel('lite'));
await page.evaluate(() => window.xtsSim(true));
const sim0 = await page.evaluate(() => window.__fxDebug.stats());
await page.evaluate(() => {
  void window.__fxDebug.ping(0);
});
await page.waitForTimeout(120);
const sim1 = await page.evaluate(() => window.__fxDebug.stats());
check('无头模拟：零播放且安全降级', sim1.played === sim0.played && sim1.skipped > sim0.skipped,
  `skipped ${sim0.skipped}→${sim1.skipped}`);
await page.evaluate(() => window.xtsSim(false));

// 系统减弱动效：不挂载 Canvas，只保留静态牌面
const ctxR = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const pageR = await ctxR.newPage();
watch(pageR);
await pageR.goto(url, { waitUntil: 'domcontentloaded' });
await pageR.waitForTimeout(500);
const rStage = await pageR.evaluate(() => window.__fxDebug?.stage());
await pageR.evaluate(() => {
  void window.__fxDebug?.ping(0);
});
await pageR.waitForTimeout(120);
const rStats = await pageR.evaluate(() => window.__fxDebug?.stats());
check('减弱动效：粒子舞台不挂载', rStage?.mounted === false, `mounted=${rStage?.mounted}`);
check('减弱动效：零动画播放', (rStats?.played ?? 0) === 0 && (rStats?.skipped ?? 0) > 0,
  `played=${rStats?.played} skipped=${rStats?.skipped}`);

check('控制台零错误', errors.length === 0, errors.slice(0, 2).join(' ; '));

await browser.close();
server.kill();

const failed = results.filter((r) => !r.ok);
console.log(`\n===== ${results.length - failed.length}/${results.length} 通过 =====`);
if (failed.length) process.exit(1);
