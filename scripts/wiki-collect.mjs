// wiki-collect.mjs
// 把 docs/md 的「角色/」「物事/」「技能/」词条抽取、归一化、去重，
// 附加游戏化标注，输出到 docs/整理/ 下的 Markdown 速查总表。
//
// 设计：
//  - 零第三方依赖（仅 fs/path/url）。
//  - 防御式解析：缺失字段填「—」，单文件解析异常不阻断整体，计入 unparsed 日志。
//  - 物事/ 类别文件各自有独立的「一览表」列结构；法器.md 用按品阶 bullet；法宝列表.md 用分势力表。
//  - 物事/ 与 技能/ 同名条目按名称去重合并（技能文件信息更完整，优先保留其字段）。
//  - 法阵/ 子目录（法阵列表.md / 广开道德金光大阵.md）内容已包含在 物事/法阵.md 中，跳过以免重复。
//
// 用法：node scripts/wiki-collect.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname, resolve, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MD = join(ROOT, 'docs', 'md');
const OUT = join(ROOT, 'docs', '整理');
const ROLE_DIR = join(MD, '角色');
const WUSHI_DIR = join(MD, '物事');
const SKILL_DIR = join(MD, '技能');
const ROLE_IMG = join(ROOT, 'docs', '游戏手册', '角色图鉴.md');

const NONE = '—';
const unparsed = [];
const warn = (m) => { unparsed.push(m); process.stderr.write('[warn] ' + m + '\n'); };

// ---------- 文件系统 ----------
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
// 读取并去除 UTF-8 BOM（部分 wiki 文件带 BOM，影响 ^#/^## 锚点匹配）
function read(p) {
  return readFileSync(p, 'utf8').replace(/^﻿/, '');
}

// ---------- 文本清洗 ----------
function stripLinks(s) {
  return s
    .replace(/\[\[([^\]]+)\]\]/g, (_, c) => c.split('/').pop())
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}
function clean(s) {
  if (s == null) return NONE;
  return stripLinks(String(s)).replace(/\s+/g, ' ').trim() || NONE;
}
function trunc(s, n = 44) {
  const t = clean(s);
  return t.length > n ? t.slice(0, n) + '…' : t;
}

// ---------- 表格解析 ----------
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => clean(c));
}
function parseTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim().startsWith('|')) {
      const header = splitRow(lines[i]);
      const nxt = lines[i + 1] || '';
      if (/^\s*\|?[\s:|-]+\|?\s*$/.test(nxt) && nxt.includes('-')) {
        const rows = [];
        let j = i + 2;
        while (j < lines.length && lines[j].trim().startsWith('|')) {
          rows.push(splitRow(lines[j]));
          j++;
        }
        tables.push({ header, rows });
        i = j;
        continue;
      }
    }
    i++;
  }
  return tables;
}
function parseBlockKV(text) {
  const tables = parseTables(text);
  // 优先选中信息块表（首项为 项/项目/含「名称」）
  const chosen = tables.find((t) => {
    const h = t.header.map((x) => x.replace(/[*\s]/g, ''));
    return h.length === 2 && (h[0] === '项' || h[0] === '项目' || h[0].includes('名称'));
  });
  if (chosen) {
    const map = {};
    for (const r of chosen.rows) if (r.length >= 2) map[r[0]] = r[1];
    return map;
  }
  // 兜底：合并所有两列表
  const map = {};
  for (const t of tables) if (t.header.length === 2) for (const r of t.rows) if (r.length >= 2) map[r[0]] = r[1];
  return map;
}
// 多标签同义解析
function getKey(kv, ...keys) {
  for (const k of keys) if (kv[k] && kv[k] !== NONE) return kv[k];
  return NONE;
}
function findTable(tables, pred) {
  return tables.find((t) => pred(t.header.map((x) => x.replace(/[*\s]/g, ''))));
}

// ---------- 角色解析 ----------
function parseRole(path) {
  const text = read(path);
  const kv = parseBlockKV(text);
  const segs = path.split(/[\\/]/);
  const faction = kv['势力'] || segs[segs.length - 3] || NONE;
  const name = kv['姓名'] || basename(path, '.md');
  const benedictParts = [kv['真本命'], kv['诡代本命'], kv['同参']].filter((x) => x && x !== NONE);
  return {
    kind: 'role',
    name: clean(name),
    gender: kv['性别'] || NONE,
    faction: clean(faction),
    realm: kv['修为'] || NONE,
    benedict: benedictParts.length ? benedictParts.join('、') : NONE,
    source: kv['首次出现'] || NONE,
    related: benedictParts.length ? benedictParts.join('、') : NONE, // 关联物事 = 本命
    note: '',
  };
}

// ---------- 物事类别解析 ----------
function parseWushiCategory(path, category) {
  const text = read(path);
  const tables = parseTables(text);
  const rows = [];
  const push = (e) => rows.push({ kind: 'wushi', category, ...e });

  switch (category) {
    case '丹药': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('介绍'));
      if (!t) { warn(`${path}: 未找到丹药一览表`); break; }
      for (const r of t.rows) push({ name: r[0], rank: r[1] || NONE, related: r[2] || NONE, desc: r[3] || NONE });
      break;
    }
    case '功法': {
      const t = findTable(tables, (h) => h.join('|').includes('修炼者'));
      if (!t) { warn(`${path}: 未找到功法一览表`); break; }
      for (const r of t.rows) push({ name: r[0], rank: r[1] || NONE, sub: r[3] || NONE, related: r[4] || NONE, source: r[5] || NONE, desc: [r[2], r[3]].filter((x) => x && x !== NONE).join('/') });
      break;
    }
    case '符篆': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('属性'));
      if (!t) { warn(`${path}: 未找到符篆一览表`); break; }
      for (const r of t.rows) push({ name: r[0], rank: r[1] || NONE, sub: r[2] || NONE, desc: r[3] || NONE });
      break;
    }
    case '灵兽': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('境界'));
      if (!t) { warn(`${path}: 未找到灵兽一览表`); break; }
      for (const r of t.rows) push({ name: r[0], sub: r[1] || NONE, rank: r[2] || NONE, realm: r[3] || NONE, related: r[4] || NONE });
      break;
    }
    case '法阵': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('相关'));
      if (!t) { warn(`${path}: 未找到法阵一览表`); break; }
      for (const r of t.rows) push({ name: r[0], rank: r[1] || NONE, sub: r[2] || NONE, related: r[3] || NONE, desc: r[4] || NONE });
      break;
    }
    case '灵材': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('品阶'));
      if (!t) { warn(`${path}: 未找到灵材一览表`); break; }
      for (const r of t.rows) push({ name: r[0], sub: r[1] || NONE, rank: r[2] || NONE });
      break;
    }
    case '灵食': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('效果'));
      if (!t) { warn(`${path}: 未找到灵食一览表`); break; }
      for (const r of t.rows) push({ name: r[0], sub: r[1] || NONE, rank: r[2] || NONE, desc: r[3] || NONE });
      break;
    }
    case '灵植': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('介绍'));
      if (!t) { warn(`${path}: 未找到灵植一览表`); break; }
      for (const r of t.rows) push({ name: r[0], sub: r[1] || NONE, rank: r[2] || NONE, related: r[3] || NONE, desc: r[4] || NONE });
      break;
    }
    case '尸鬼': {
      const t = findTable(tables, (h) => h.includes('名称') && h.includes('品阶'));
      if (!t) { warn(`${path}: 未找到尸鬼一览表`); break; }
      for (const r of t.rows) push({ name: r[0], rank: r[1] || NONE, related: r[2] || NONE });
      break;
    }
    case '法宝': {
      // 分势力表：法宝 | 主人 | 等阶 | 特殊效果
      const ts = tables.filter((t) => t.header.includes('法宝') && t.header.includes('主人'));
      if (!ts.length) { warn(`${path}: 未找到法宝表`); break; }
      for (const t of ts) for (const r of t.rows) push({ name: r[0], faction: r[1] || NONE, rank: r[2] || NONE, desc: r[3] || NONE });
      break;
    }
    case '法器': {
      // 按品阶 bullet：- **一阶**：名、名、名
      const lines = text.split(/\r?\n/);
      let inSection = false;
      for (const line of lines) {
        if (/^##\s*一、按品阶汇总/.test(line)) { inSection = true; continue; }
        if (inSection && /^##\s/.test(line)) break;
        if (inSection) {
          const m = line.match(/^\s*-\s*\*\*([^*]+)\*\*[：:]\s*(.+)$/);
          if (m) {
            const rank = m[1].trim();
            const names = m[2].split(/[、，,]/).map((s) => clean(s)).filter((s) => s && s !== NONE);
            for (const n of names) push({ name: n, rank, note: '物事/法器·按品阶汇总', source: NONE });
          }
        }
      }
      if (rows.length === 0) warn(`${path}: 未解析到法器条目`);
      break;
    }
    default:
      warn(`${path}: 未知物事类别 ${category}`);
  }
  return rows;
}

// ---------- 技能解析 ----------
// 自由格式技能条目（概述/属性·效果/持有者·使用者/出处）
function parseSkillFreeform(text, path) {
  const name = (text.match(/^#\s+(.+?)\s*$/m) || [])[1];
  if (!name) return null;
  const rankM = text.match(/品阶\*\*：\s*([无一二三四五六？?]阶[极上中下]*品?)/);
  const rank = rankM ? rankM[1] : NONE;
  const descM = text.match(/^##\s*概述\s*\n+([\s\S]*?)(?:\n##|$)/m);
  const desc = descM ? trunc(descM[1].replace(/\n+/g, ' '), 60) : NONE;
  const holderSec = text.match(/^##\s*持有者\/使用者\s*\n+([\s\S]*?)(?:\n##|$)/m);
  let related = NONE;
  if (holderSec) {
    const names = new Set();
    const re = /\[\[角色\/([^\]]+)\]\]/g;
    let mm;
    while ((mm = re.exec(holderSec[1]))) names.add(mm[1]);
    if (names.size) related = [...names].join('、');
  }
  const srcM = text.match(/第\d+章\s*[^\]\n]*/);
  const source = srcM ? clean(srcM[0]) : NONE;
  const subInfer = /符篆/.test(text) ? '符篆'
    : /灵兽/.test(text) ? '灵兽'
    : /法宝/.test(text) ? '法宝'
    : /法器/.test(text) ? '法器'
    : /阵法/.test(text) ? '法阵'
    : /功法/.test(text) ? '功法'
    : NONE;
  return { kind: 'wushi', category: '技能', name: clean(name), sub: subInfer, rank, faction: NONE, related, source, desc, note: '技能/条目(自由格式)' };
}

function parseSkill(path) {
  const text = read(path);
  const kv = parseBlockKV(text);
  const name = getKey(kv, '名称', '物品名称');
  if (!name || name === NONE) {
    const ff = parseSkillFreeform(text, path);
    if (!ff) { warn(`${path}: 技能缺少基础信息`); return null; }
    return ff;
  }
  // 描述：优先 描述 / 物品画像 / 简介 / 物品特点 / 概述 之后首段
  let desc = NONE;
  const dm = text.match(/^##\s*(描述|物品画像|简介|物品特点|概述)\s*\n+([\s\S]*?)(?:\n##|$)/m);
  if (dm) desc = trunc(dm[2].replace(/\n+/g, ' '), 60);
  return {
    kind: 'wushi',
    category: '技能',
    name: clean(name),
    sub: getKey(kv, '类别') || NONE,
    rank: getKey(kv, '阶位/品级', '阶位', '品级', '物品层级', '品阶') || NONE,
    faction: getKey(kv, '出处势力', '所属势力') || NONE,
    related: getKey(kv, '持有/使用者', '持有使用者', '使用者', '主人') || NONE,
    source: clean((getKey(kv, '首次出现章节', '首次出现') || '').replace(/^\[/, '').replace(/\]$/, '')),
    desc,
    note: '技能/条目',
  };
}

// ---------- 游戏化标注 ----------
const CARD_TYPE = {
  丹药: '锦囊', 法器: '装备', 法宝: '装备', 法阵: '装备', 符篆: '锦囊',
  功法: '技能', 灵材: '基本/锦囊(材料)', 灵食: '基本/锦囊', 灵植: '锦囊(材料)',
  灵兽: '锦囊(召唤)', 尸鬼: '锦囊(召唤)', 技能: '技能',
};
function cardTypeOf(e) {
  const sub = e.sub || '';
  if (/符篆/.test(sub)) return '锦囊';
  if (/法器|法宝/.test(sub)) return '装备';
  if (/阵法|法阵/.test(sub)) return '装备';
  if (/灵兽|灵植|灵材|尸鬼/.test(sub)) return '锦囊(材料/召唤)';
  if (/功法|天赋|本命/.test(sub)) return '技能';
  return CARD_TYPE[e.category] || '锦囊';
}

function rankKey(rank) {
  const s = String(rank);
  const map = { '无阶': 0, '一阶': 1, '二阶': 2, '三阶': 3, '四阶': 4, '五阶': 5, '六阶': 6, '？阶': 9, '?阶': 9 };
  for (const k of Object.keys(map)) if (s.startsWith(k)) return map[k];
  if (/^\d+阶/.test(s)) return 7;
  return 8;
}

// ---------- 主流程 ----------
function main() {
  const roles = [];
  const wushi = []; // {kind:'wushi', category, ...}
  const benedictNames = new Set();

  // 角色
  for (const p of walk(ROLE_DIR)) {
    const bn = basename(p);
    if (bn === 'README.md' || bn === '化神总览.md') continue;
    try {
      const r = parseRole(p);
      r.benedict.split('、').forEach((x) => { if (x && x !== NONE) benedictNames.add(x.replace(/[（(].*$/, '').trim()); });
      roles.push(r);
    } catch (e) { warn(`${p}: ${e.message}`); }
  }

  // 物事类别
  const wushiFiles = [
    ['丹药.md', '丹药'], ['功法.md', '功法'], ['符篆.md', '符篆'], ['灵兽.md', '灵兽'],
    ['法阵.md', '法阵'], ['灵材.md', '灵材'], ['灵食.md', '灵食'], ['灵植.md', '灵植'],
    ['尸鬼.md', '尸鬼'], ['法宝/法宝列表.md', '法宝'], ['法器.md', '法器'],
  ];
  for (const [rel, cat] of wushiFiles) {
    const p = join(WUSHI_DIR, rel);
    if (!existsSync(p)) { warn(`缺失物事文件: ${rel}`); continue; }
    try {
      const rows = parseWushiCategory(p, cat);
      if (!rows.length) warn(`${rel}: 0 条`);
      wushi.push(...rows);
    } catch (e) { warn(`${rel}: ${e.message}`); }
  }

  // 技能
  for (const p of walk(SKILL_DIR)) {
    try {
      const s = parseSkill(p);
      if (s) {
        if (s.sub && s.sub.includes('本命')) benedictNames.add(s.name);
        wushi.push(s);
      }
    } catch (e) { warn(`${p}: ${e.message}`); }
  }

  // 去重合并（物事 + 技能 同名）
  const byName = new Map();
  for (const e of wushi) {
    const key = e.name;
    if (!byName.has(key)) { byName.set(key, e); continue; }
    const prev = byName.get(key);
    // 优先保留字段更丰富的（技能优先），并合并非空字段
    const merge = (a, b) => {
      const out = { ...a };
      for (const k of Object.keys(b)) {
        if (b[k] != null && b[k] !== NONE) {
          if (out[k] == null || out[k] === NONE) out[k] = b[k];
          else if (k === 'note' && !String(out[k]).includes(String(b[k]))) out[k] = `${out[k]}; ${b[k]}`;
        }
      }
      return out;
    };
    const prefer = (a, b) => (a.category === '技能' ? a : b);
    byName.set(key, merge(prefer(prev, e), prefer(prev, e) === prev ? e : prev));
  }
  const wushiMerged = [...byName.values()];

  // 游戏化标注
  for (const e of wushiMerged) {
    e.cardType = cardTypeOf(e);
    const isB = benedictNames.has(e.name) || (e.sub && e.sub.includes('本命'));
    e.isBenedict = isB ? '是' : '否';
    e.modes = '掌门路';
  }

  // 角色入池 / 主公候选 交叉参考（来自 角色图鉴.md）
  const poolNames = new Set();
  const lordNames = new Set();
  if (existsSync(ROLE_IMG)) {
    const t = read(ROLE_IMG);
    for (const m of t.matchAll(/^###\s+(.+?)\s*[·．·]/gm)) poolNames.add(m[1].trim());
    for (const m of t.matchAll(/^###\s+(.+?)\s*$/gm)) {
      const nm = m[1].trim();
      if (!poolNames.has(nm)) poolNames.add(nm);
    }
    const lm = t.match(/掌门（主公位）候选\s*\n([^\n]+)/);
    if (lm) lm[1].split(/[、，,\s]+/).forEach((x) => { const n = x.trim().replace(/[。.]$/, ''); if (n) lordNames.add(n); });
  } else { warn('未找到 角色图鉴.md，入池标注跳过'); }

  for (const r of roles) {
    r.inPool = poolNames.has(r.name) ? '是' : '否';
    r.lord = lordNames.has(r.name) ? '主公候选' : NONE;
    r.modes = '掌门路';
    r.cardType = '角色卡';
  }

  // ---------- 渲染 ----------
  mkdirSync(OUT, { recursive: true });

  // 角色总表：按势力分组
  const roleByFaction = {};
  for (const r of roles) (roleByFaction[r.faction] ||= []).push(r);
  const factions = Object.keys(roleByFaction).sort((a, b) => roleByFaction[b].length - roleByFaction[a].length);
  let roleMd = '# 掌门杀 · 角色词条总表（来源基础材料）\n\n';
  roleMd += `> 自动生成自 \`docs/md/角色/\`（${roles.length} 份角色档案）。\n`;
  roleMd += '> 列：姓名 | 性别 | 势力 | 境界 | 本命(真/诡代/同参) | 首次出现 | 游戏化标注 | 关联物事 | 备注。\n';
  roleMd += '> 游戏化标注：角色卡(入池=是否已在《角色图鉴》角色池) 及 主公候选。\n\n';
  for (const f of factions) {
    const list = roleByFaction[f];
    roleMd += `## ${f}（${list.length}）\n\n`;
    roleMd += '| 姓名 | 性别 | 境界 | 本命 | 首次出现 | 游戏化标注 | 关联物事 | 备注 |\n';
    roleMd += '| --- | --- | --- | --- | --- | --- | --- | --- |\n';
    for (const r of list.sort((a, b) => rankKey(b.realm) - rankKey(a.realm) || a.name.localeCompare(b.name, 'zh'))) {
      const tag = [`角色卡(入池=${r.inPool})`];
      if (r.lord !== NONE) tag.push(r.lord);
      roleMd += `| ${r.name} | ${r.gender} | ${r.realm} | ${r.benedict} | ${r.source} | ${tag.join('；')} | ${r.related} | ${r.note || ''} |\n`;
    }
    roleMd += '\n';
  }

  // 物事总表：按大类分组
  const wByCat = {};
  for (const e of wushiMerged) (wByCat[e.category] ||= []).push(e);
  const catOrder = ['丹药', '法器', '法宝', '法阵', '符篆', '功法', '灵材', '灵食', '灵植', '灵兽', '尸鬼', '技能'];
  const cats = Object.keys(wByCat).sort((a, b) => (catOrder.indexOf(a) + 99) - (catOrder.indexOf(b) + 99));
  let wMd = '# 掌门杀 · 物事/技能词条总表（来源基础材料）\n\n';
  wMd += `> 自动生成自 \`docs/md/物事/\` 与 \`docs/md/技能/\`（共 ${wushiMerged.length} 条，已去重）。\n`;
  wMd += '> 列：名称 | 类别 | 品阶/等阶 | 所属势力/主人 | 描述/效果 | 来源章节 | 可对应卡牌类型 | 是否可作本命 | 适用玩法 | 关联角色 | 备注。\n\n';
  for (const c of cats) {
    const list = wByCat[c];
    wMd += `## ${c}（${list.length}）\n\n`;
    wMd += '| 名称 | 类别 | 品阶/等阶 | 所属势力/主人 | 描述/效果 | 来源章节 | 卡牌类型 | 本命 | 玩法 | 关联角色 | 备注 |\n';
    wMd += '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
    for (const e of list.sort((a, b) => rankKey(a.rank) - rankKey(b.rank) || a.name.localeCompare(b.name, 'zh'))) {
      wMd += `| ${e.name} | ${e.sub || NONE} | ${e.rank || NONE} | ${e.faction || NONE} | ${trunc(e.desc, 36)} | ${e.source || NONE} | ${e.cardType} | ${e.isBenedict} | ${e.modes} | ${e.related || NONE} | ${e.note || ''} |\n`;
    }
    wMd += '\n';
  }

  // README
  const readme = `# 整理说明（docs/整理）

本目录是《掌门杀》原著 wiki（\`docs/md/\`）的角色与物事/技能词条**来源基础材料**，供后续卡牌与玩法设定人工取用。

## 文件
- \`角色总表.md\`：来自 \`docs/md/角色/\` 的全部角色档案，按势力分节。
- \`物事总表.md\`：合并 \`docs/md/物事/\` 与 \`docs/md/技能/\`，按大类分节，同名条目已去重。

## 统一字段
- 角色：姓名、性别、势力、境界、本命(真/诡代/同参)、首次出现、游戏化标注、关联物事。
- 物事/技能：名称、类别(大类/小类·种类)、品阶或等阶、所属势力或主人、描述或效果、来源章节、可对应卡牌类型、是否可作本命、适用玩法、关联角色。

## 游戏化标注推导规则
- **可对应卡牌类型**：丹药→锦囊；法器/法宝/法阵→装备；符篆→锦囊；功法/技能→技能；灵材→基本/锦囊(材料)；灵食→基本/锦囊；灵植→锦囊(材料)；灵兽/尸鬼→锦囊(召唤)。
- **是否可作本命**：由角色档案「真本命/诡代本命/同参」反查，以及技能文件「类别」含「本命」者共同决定。
- **角色入池 / 主公候选**：交叉参考 \`docs/游戏手册/角色图鉴.md\`（角色池与主公候选名单）。
- **适用玩法**：默认「掌门路」。

## 再生方式
\`\`\`bash
node scripts/wiki-collect.mjs
\`\`\`
脚本零第三方依赖，遍历原始 MD 解析、归一化、去重、标注后输出本目录。原著 wiki 更新后重跑即可。

## 范围边界
- 不含 事件/势力/悬念/设定/地图；不直接生成 \`src/data\` 卡牌数据；不修改游戏运行逻辑。
- \`物事/法阵/\` 子目录为 \`物事/法阵.md\` 的重复/子集，已跳过以免重复。
`;

  writeFileSync(join(OUT, '角色总表.md'), roleMd, 'utf8');
  writeFileSync(join(OUT, '物事总表.md'), wMd, 'utf8');
  writeFileSync(join(OUT, 'README.md'), readme, 'utf8');

  process.stdout.write(`\n生成完成：角色 ${roles.length} 条，物事/技能 ${wushiMerged.length} 条（去重后）。\n`);
  if (unparsed.length) process.stdout.write(`警告 ${unparsed.length} 条，见 stderr。\n`);
}

main();
