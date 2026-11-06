// 静态「规格 ↔ 实现」全量对照审计（零依赖，只读源码与手册）
// 用法：node scripts/audit-parity.mjs
// 目的：保证 229 张修真牌堆里每一张牌都有结算分支、每个装备 skill / judgeType / 天赋 id
//       都有实现，且代码、卡牌大全、规则书的口径一致；任何新增卡牌若忘记接结算都会在此报错。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const list = (dir) =>
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => path.join(dir, e.name));

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}
const eq = (a, b, label) => check(label, a === b, `${a} / 期望 ${b}`);

/* ---------------- 1. 解析牌堆定义（唯一真源） ---------------- */
const cardsSrc = read('src/data/zml/cards.zml.ts');
const GROUPS = ['ZML_BASIC', 'ZML_TRICK', 'ZML_EQUIP', 'ZML_SKILL_EXTRA', 'ZML_FABAO_ATK', 'ZML_FABAO_DEF'];
const EXPECTED_GROUP_COUNT = { ZML_BASIC: 58, ZML_TRICK: 56, ZML_EQUIP: 38, ZML_SKILL_EXTRA: 19, ZML_FABAO_ATK: 27, ZML_FABAO_DEF: 31 };

function parseGroup(name) {
  const re = new RegExp(`export const ${name}: ZmlCardDef\\[\\] = \\[([\\s\\S]*?)\\n\\];`);
  const m = cardsSrc.match(re);
  if (!m) return null;
  const defs = [];
  for (const line of m[1].split('\n')) {
    const head = line.match(/^\s*\{\s*sub:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/);
    if (!head) continue;
    const extra = (line.match(/extra:\s*\{([^}]*)\}/) || [])[1] || '';
    defs.push({
      sub: head[1],
      name: head[2],
      type: (line.match(/type:\s*'([^']+)'/) || [])[1] || '',
      count: Number((line.match(/count:\s*(\d+)/) || [])[1] || 0),
      skill: (extra.match(/skill:\s*'([^']+)'/) || [])[1] || '',
      judgeType: (extra.match(/judgeType:\s*'([^']+)'/) || [])[1] || '',
      equipSlot: (extra.match(/equipSlot:\s*'([^']+)'/) || [])[1] || '',
      wuxing: /wuxing:\s*true/.test(extra),
      desc: /desc:\s*'/.test(line),
      src: /src:\s*'/.test(line),
      group: name,
    });
  }
  return defs;
}

const groups = {};
for (const g of GROUPS) groups[g] = parseGroup(g);
check('六个牌堆分段均可解析', GROUPS.every((g) => groups[g] && groups[g].length > 0));
const defs = GROUPS.flatMap((g) => groups[g] || []);
const total = defs.reduce((s, d) => s + d.count, 0);
eq(total, 229, '牌堆总张数 = 229');
for (const g of GROUPS) {
  const n = (groups[g] || []).reduce((s, d) => s + d.count, 0);
  eq(n, EXPECTED_GROUP_COUNT[g], `${g} 张数`);
}
check('每张卡都有引擎 key / 卡名 / 类别 / 张数 / 描述 / 出处', defs.every((d) => d.sub && d.name && d.type && d.count > 0 && d.desc && d.src));
const pairs = defs.map((d) => `${d.sub}::${d.name}`);
check('无重复的 (sub, 卡名) 定义', new Set(pairs).size === pairs.length, `${pairs.length} 条`);
check('ZML_ALL 由六段拼接且总张数由 reduce 派生', /ZML_ALL[^=]*=\s*\[\s*\.\.\.ZML_BASIC[\s\S]*?\.\.\.ZML_SKILL_EXTRA\s*\]/.test(cardsSrc) && /ZML_ALL\.reduce\(/.test(cardsSrc));

/* ---------------- 2. 每张牌都能被结算 ---------------- */
const actionsSrc = read('src/game/actions.ts');
const turnSrc = read('src/game/turn.ts');
const engineSrc = [
  'src/game/actions.ts', 'src/game/turn.ts', 'src/game/damage.ts', 'src/game/rules.ts',
  'src/game/talentEngine.ts', 'src/game/skills.ts', 'src/game/skillfx.ts',
  ...list('src/game/zml'),
].map(read).join('\n');
const engineLiterals = new Set([...engineSrc.matchAll(/'([^'\n]+)'/g)].map((m) => m[1]));

const swStart = actionsSrc.indexOf('switch (card.sub) {');
const swEnd = actionsSrc.indexOf('// 使用锦囊后', swStart);
const switchBody = actionsSrc.slice(swStart, swEnd > swStart ? swEnd : undefined);
const handledSubs = new Set([...switchBody.matchAll(/case\s+'([^']+)'\s*:/g)].map((m) => m[1]));
const RESPONSE_ONLY = ['wuxie']; // 只能响应、不主动结算
const skillSubs = [...new Set(defs.filter((d) => d.type === 'skill').map((d) => d.sub))];
const missingSubs = skillSubs.filter((s) => !handledSubs.has(s) && !RESPONSE_ONLY.includes(s));
check(`全部 ${skillSubs.length} 个锦囊 sub 在 useSkill 的 switch 中有 case`, missingSubs.length === 0, missingSubs.join(', '));

const basicSubs = [...new Set(defs.filter((d) => d.type === 'basic').map((d) => d.sub))];
const BASIC_HANDLERS = {
  sha: /SHA_SUBS/.test(turnSrc) && /useSha\(/.test(turnSrc),
  huo: /SHA_SUBS/.test(turnSrc),
  lei: /SHA_SUBS/.test(turnSrc),
  shan: /requestOneShan|requestShan/.test(engineSrc),
  tao: /useTao\(/.test(turnSrc),
  jiu: /useJiu\(/.test(turnSrc),
};
check('基本牌六个 sub 均有出牌/响应入口', basicSubs.every((s) => BASIC_HANDLERS[s]), basicSubs.join(','));

const equipSubs = [...new Set(defs.filter((d) => d.type === 'equip').map((d) => d.sub))];
const EQUIP_SLOTS = ['weapon', 'armor', 'horse+', 'horse-', 'fabao'];
check('装备五类 sub 均落到 turn.ts 的四槽装备分支', equipSubs.every((s) => EQUIP_SLOTS.includes(s) && turnSrc.includes(`card.sub === '${s}'`)), equipSubs.join(','));

const skillKeys = [...new Set(defs.map((d) => d.skill).filter(Boolean))];
const missingSkills = skillKeys.filter((k) => !engineLiterals.has(k));
check(`全部 ${skillKeys.length} 个装备结算键被引擎引用`, missingSkills.length === 0, missingSkills.join(', '));

const judgeTypes = [...new Set(defs.map((d) => d.judgeType).filter(Boolean))];
check('全部延时判定类型在 judgePhase 中结算', judgeTypes.every((j) => turnSrc.includes(`j.judgeType === '${j}'`)), judgeTypes.join(','));

const equipSlots = [...new Set(defs.map((d) => d.equipSlot).filter(Boolean))];
check('法宝的 equipSlot 只有 weapon / armor 两种', equipSlots.every((s) => s === 'weapon' || s === 'armor'), equipSlots.join(','));

// 新增修真锦囊清单：必须与 switch 中实际存在的专属 case 完全一致
const newSubBlock = cardsSrc.match(/export const ZML_NEW_TRICK_SUBS: string\[\] = \[([\s\S]*?)\];/);
const newSubs = newSubBlock ? [...newSubBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
const expectedNew = ['guidai', 'daizheng', 'mingyan', 'guanding', 'tongshi', 'quanzhi', 'dan'];
check('ZML_NEW_TRICK_SUBS 清单与 7 个新增锦囊一致且全部有 case',
  newSubs.length === expectedNew.length && expectedNew.every((s) => newSubs.includes(s) && handledSubs.has(s)), newSubs.join(','));

// 【无形】兵器：卡面声明的免疫必须带 wuxing 标记，且引擎有对应判定
const wuxingDefs = defs.filter((d) => d.wuxing);
const WUXING_NAMES = ['伪无形剑', '幻日无形剑', '幻月无形剑', '幻星无形剑', '幻影无形剑'];
check('五把【无形】兵器均带 wuxing 标记',
  wuxingDefs.length === 5 && WUXING_NAMES.every((n) => wuxingDefs.some((d) => d.name === n)), wuxingDefs.map((d) => d.name).join(','));
check('【无形】/【无形鹤】/【银背驮鳐】/【飞蟹载客】均有结算分支',
  /export function wuxingBlocks/.test(read('src/game/rules.ts')) &&
  /无形鹤/.test(actionsSrc) && /银背驮鳐/.test(actionsSrc) && /feixieEscortOf/.test(read('src/game/rules.ts')));

/* ---------------- 3. 目标选择 / 兼爱转移名单同源 ---------------- */
const cardsDataSrc = read('src/data/cards.ts');
const singleBlock = cardsDataSrc.match(/export const ZML_SINGLE_TARGET_SUBS: string\[\] = \[([\s\S]*?)\];/);
const singleSubs = singleBlock ? [...singleBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
const EXPECTED_SINGLE = ['guohe', 'shunshou', 'juedou', 'lebu', 'huogong', 'mingyan', 'guidai', 'daizheng', 'quanzhi'];
check('单目标锦囊名单与规格一致', singleSubs.length === EXPECTED_SINGLE.length && EXPECTED_SINGLE.every((s) => singleSubs.includes(s)), singleSubs.join(','));
check('单目标名单在 turn.ts 与 actions.ts 共用（无第二份硬编码）',
  turnSrc.includes('ZML_SINGLE_TARGET_SUBS.includes(card.sub)') &&
  actionsSrc.includes('...ZML_SINGLE_TARGET_SUBS') &&
  !/\['guohe', 'shunshou', 'juedou', 'lebu', 'huogong', 'mingyan'/.test(turnSrc + actionsSrc));
check('单目标名单里的每个 sub 都确有牌堆实例', EXPECTED_SINGLE.every((s) => skillSubs.includes(s)));

/* ---------------- 4. 天赋 / 效果原语覆盖 ---------------- */
const dataFiles = list('src/data').concat(list('src/data/zml'));
const defFiles = dataFiles.map(read).join('\n');
const charSrc = read('src/data/zml/characters.zml.ts');
const factionsSrc = read('src/data/factions.ts');
const referenced = new Set();
for (const src of [charSrc, factionsSrc]) {
  for (const m of src.matchAll(/talentOf\('([^']+)'\)/g)) referenced.add(m[1]);
}
const poolBlock = charSrc.match(/const POOL_EXTRA: Record<string, string\[\]> = \{([\s\S]*?)\n\};/);
if (poolBlock) for (const m of poolBlock[1].matchAll(/'(zml_[^']+)'/g)) referenced.add(m[1]);
const defined = new Set([...defFiles.matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]));
const missingTalents = [...referenced].filter((id) => !defined.has(id));
check(`角色池 / 主公技引用的 ${referenced.size} 个天赋 id 全部有定义`, missingTalents.length === 0, missingTalents.slice(0, 8).join(', '));

const effectKinds = new Set([...defFiles.matchAll(/\bkind:\s*'([^']+)'/g)].map((m) => m[1]));
const NON_EFFECT_KINDS = new Set(['active', 'trigger', 'passive', 'limit', 'awaken', 'lord', 'convert', 'equip', 'item', 'realm', 'strategy', 'quiz']);
const primitives = [...effectKinds].filter((k) => !NON_EFFECT_KINDS.has(k));
const primitiveSrc = read('src/game/talentEngine.ts') + read('src/game/skillfx.ts');
const implemented = new Set([...primitiveSrc.matchAll(/case\s+'([^']+)'\s*:/g)].map((m) => m[1]));
const missingPrimitives = primitives.filter((k) => !implemented.has(k));
check(`天赋声明的 ${primitives.length} 种效果原语全部有分派 case`, missingPrimitives.length === 0, missingPrimitives.join(', '));

/* ---------------- 5. 手册 ↔ 数据一致性 ---------------- */
const catalog = read('docs/游戏手册/卡牌大全.md');
const rulesDoc = read('docs/游戏手册/玩法与规则.md');
const readme = read('docs/游戏手册/README.md');
const missingInCatalog = defs.filter((d) => !catalog.includes(d.name)).map((d) => d.name);
check(`《卡牌大全》收录全部 ${new Set(defs.map((d) => d.name)).size} 个卡名`, missingInCatalog.length === 0, [...new Set(missingInCatalog)].slice(0, 8).join(','));
check('手册三处牌堆总量口径均为 229', /229/.test(catalog) && /229/.test(rulesDoc) && /229/.test(readme));
check('规则书已写明本次新增/补全的玩法',
  ['响应窗口', '【无形】', '飞蟹载客', '诡代之法', '观顶', '全知天眼'].every((k) => rulesDoc.includes(k)));
check('源码注释不再残留旧牌堆数字 234 / 55 / 36 张',
  !/234 张/.test(cardsDataSrc + cardsSrc) && !/锦囊牌 55 张/.test(cardsSrc) && !/装备牌 36 张/.test(cardsSrc));

// 设计上「暂不投放」的扩展卡 / 知识点锦囊：有结算分支但不入牌堆，属于声明的排除项而非缺失实现
const deckSrc = cardsDataSrc;
const disabled = read('CHANGELOG.md').includes('暂不投放') && /buildDeck` 不投放它们/.test(read('src/game/aicounts.ts'));
check('扩展卡未投放是有声明的设计排除项（牌堆只遍历 ZML_ALL）',
  disabled && /for \(const def of ZML_ALL\)/.test(deckSrc) && /CARD_CATALOG/.test(read('src/data/cardCatalog.ts')));

/* ---------------- 汇总 ---------------- */
const failed = results.filter((r) => !r.ok);
console.log(`\n===== 静态对照审计 ${results.length - failed.length}/${results.length} 通过 =====`);
if (failed.length) {
  console.log('失败项:', failed.map((f) => f.name).join(' | '));
  process.exit(1);
}
