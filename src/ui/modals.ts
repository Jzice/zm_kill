/* ==================== 规则弹窗 ==================== */
import { FACTIONS } from '../data/factions';
import { allTrickDefs } from '../data/knowledgeTricks';
import type { FactionId } from '../core/types';
import { CHARACTERS } from '../data/characters';
import {
  ACHIEVEMENTS,
  EXP_LORD_BONUS,
  EXP_LOSE,
  EXP_PER_ACH,
  EXP_PER_KILL,
  EXP_SPY_BONUS,
  EXP_STREAK_MAX_STEP,
  EXP_STREAK_STEP,
  EXP_WIN,
  PROFILE,
} from '../profile/profile';
import { REALM_TIERS } from '../profile/realm';
import { defOf } from '../data/talentdefs';
import { CARD_PACKS } from '../data/cardPacks';
import { CARD_CATALOG } from '../data/cardCatalog';

/** 各 tab（顺序即高度测量顺序） */
const RULE_TABS = ['basic', 'factions', 'cards', 'chars', 'ach', 'packs'];

/** 知识点锦囊规则书分区（首版仅保留直接生效的策略型） */
function knowledgeTrickHtml(): string {
  const items = Object.values(allTrickDefs());
  if (!items.length) return '';
  const lis = items.map((d) => `<li><b>【${d.name}】</b>${d.desc}</li>`).join('');
  return `<div class="rule-section"><h4>📚 知识点锦囊</h4><div style="font-size:11px;color:var(--muted);margin-bottom:5px">由知识点凝练的锦囊；均可被【不在算中】抵消。</div><ul>${lis}</ul></div>`;
}
/**
 * 牌库扩展包规则书分区：按卡包分组渲染全部扩展卡（卡名沿用通用卡牌命名）。
 * 与知识点锦囊同构——纯数据驱动，新增卡牌只加 CARD_CATALOG 一条记录即自动出现。
 */
function cardPackHtml(): string {
  const groups = CARD_PACKS.filter((p) => p.id !== 'core')
    .map((p) => {
      const items = Object.values(CARD_CATALOG).filter((d) => d.pack === p.id);
      if (!items.length) return '';
      const lis = items
        .map(
          (d) =>
            `<li><b>【${d.name}】</b><span style="font-size:10px;color:var(--muted)">×${d.count}</span> ${d.desc}</li>`,
        )
        .join('');
      return `<div style="padding:6px 8px;background:rgba(0,0,0,.18);border-radius:6px;border-left:3px solid #b57fff;margin-bottom:6px"><div style="font-size:12px;font-weight:700;color:#b57fff">${p.icon} ${p.name} · ${p.origin}</div><div style="font-size:10px;color:var(--muted);margin:2px 0">${p.desc}</div><ul style="margin-top:2px">${lis}</ul></div>`;
    })
    .join('');
  if (!groups) return '';
  return `<div class="rule-section"><h4>🂠 牌库扩展包（需在「牌库扩展包」中勾选启用）</h4><div style="font-size:11px;color:var(--muted);margin-bottom:5px">以下卡牌在修真基础牌堆之上追加，卡名与规则内核一致。</div>${groups}</div>`;
}

/** 各 tab 内容自然高度的最大值（与视口无关，缓存以免重复测量） */
let rulesNaturalMax = 0;
/** 视口尺寸变化监听（窗口变小/变大时重新套用 85vh 上限） */
let rulesRO: ResizeObserver | null = null;

/**
 * 解除高度限制后依次渲染各 tab，量出内容自然高度的最大值。
 * 必须临时解除 max-height，否则盒子被 85vh 截断、量到的只是上限而非真实内容高度。
 */
function measureRulesNaturalMax(): number {
  if (rulesNaturalMax > 0) return rulesNaturalMax;
  const box = document.querySelector<HTMLElement>('#rulesModal .rules-box');
  if (!box) return 0;
  const keepH = box.style.height;
  const keepMaxH = box.style.maxHeight;
  box.style.height = 'auto';
  box.style.maxHeight = 'none';
  let max = 0;
  for (const t of RULE_TABS) {
    renderRulesContent(t);
    max = Math.max(max, box.scrollHeight);
  }
  box.style.height = keepH;
  box.style.maxHeight = keepMaxH;
  rulesNaturalMax = max;
  return max;
}

/** 把弹窗高度锁定为 min(内容自然高度上限, 85vh)，使切换 tab 时尺寸与位置恒定 */
function lockRulesHeight(): void {
  const box = document.querySelector<HTMLElement>('#rulesModal .rules-box');
  if (!box) return;
  const natural = measureRulesNaturalMax();
  if (natural <= 0) return; // 量不到高度时保持 CSS 自适应，避免塌成 0
  const cap = Math.round(window.innerHeight * 0.85);
  box.style.height = `${Math.min(natural, cap)}px`;
}

export function openRules(): void {
  const modal = document.getElementById('rulesModal')!;
  modal.classList.add('show');
  lockRulesHeight(); // 先锁定高度再切默认 tab，避免"先撑开再收缩"的跳动
  switchRulesTab('basic');
  if (!rulesRO && typeof ResizeObserver !== 'undefined') {
    rulesRO = new ResizeObserver(() => {
      if (document.getElementById('rulesModal')!.classList.contains('show')) lockRulesHeight();
    });
    rulesRO.observe(modal);
  }
}

export function closeRules(): void {
  document.getElementById('rulesModal')!.classList.remove('show');
}

/** 切换 tab：仅切换高亮与内容；高度已锁定，故不会引起弹窗缩放或位移 */
export function switchRulesTab(tab: string): void {
  document.querySelectorAll('.rule-tab').forEach((t) => t.classList.toggle('active', (t as HTMLElement).dataset.tab === tab));
  renderRulesContent(tab);
  document.getElementById('rulesContent')!.scrollTop = 0;
}

/** 渲染指定 tab 的规则内容（不含 tab 高亮与滚动重置，供高度测量复用） */
function renderRulesContent(tab: string): void {
  const el = document.getElementById('rulesContent')!;
  if (tab === 'basic') {
    el.innerHTML = `<div class="rule-section"><h4>🎯 游戏目标</h4><ul>
      <li><b>主公</b>：消灭所有反贼和内奸</li>
      <li><b>忠臣</b>：主公存活并消灭反贼和内奸</li>
      <li><b>反贼</b>：杀死主公</li>
      <li><b>内奸</b>：最后单挑杀死主公</li>
    </ul></div>
    <div class="rule-section"><h4>🔄 回合流程</h4><ol>
      <li>判定阶段：结算判定区</li>
      <li>摸牌阶段：摸2张牌</li>
      <li>出牌阶段：点击手牌出牌，点击座位卡选目标，点击技能发动</li>
      <li>弃牌阶段：点击手牌弃置</li>
    </ol></div>
    <div class="rule-section"><h4>📚 角色池与门派</h4><ul>
      <li>角色池为《修真门派掌门路》原著角色，按九大门派归类</li>
      <li><b>选角改由门派筛选</b>：选择某一门派时，仅该门派角色可选（可在大厅「门派」中切换）</li>
      <li>角色技能与卡牌均基于修真设定，详见「门派与主公技」与「卡牌大全」</li>
    </ul></div>
    <div class="rule-section"><h4>☯ 修为与境界</h4><ul>
      <li>每局结算得<b>修为</b>：胜利 +${EXP_WIN}，败北 +${EXP_LOSE}；每击杀 1 名角色 +${EXP_PER_KILL}；连胜每级 +${EXP_STREAK_STEP}（最多 +${EXP_STREAK_STEP * EXP_STREAK_MAX_STEP}）；主公获胜额外 +${EXP_LORD_BONUS}，内奸独赢额外 +${EXP_SPY_BONUS}；每解锁 1 个成就 +${EXP_PER_ACH}</li>
      <li>修为达阈值即<b>突破境界</b>：${REALM_TIERS.map((t) => `${t.name}(${t.min})`).join(' → ')}</li>
      <li>高阶设<b>瓶颈</b>：除修为外还需胜场 / 连胜 / 成就达标，未达标时修为继续累积，达成后自动突破</li>
      <li>档案保存在浏览器本地，换设备不会同步</li>
      <li>联机房间中点击成员即可查看其境界与成就</li>
    </ul></div>
    <div class="rule-section"><h4>🎲 天赋池与破境机缘</h4><ul>
      <li>每名角色持有 <b>4 门左右</b>天赋组成的「天赋池」；开局随机激活 <b>2~3 门</b>本局生效（池 ≤3 时全激活）</li>
      <li>掌门路模式境界突破成功后，获得<b>破境机缘</b>：从「再觉醒 1 门天赋池天赋」或「体力上限 +1 并回血」中二选一</li>
      <li><b>悟道</b>：出牌阶段每回合限一次，修为 +1</li>
      <li><b>筑基丹</b>：服用后修为 +2，可助你凑够突破所需的修为</li>
    </ul></div>
    <div class="rule-section"><h4>⚰️ 阵亡与身份公开</h4><ul>
      <li>角色阵亡后，其身份自动公开，所有玩家均可看到</li>
      <li>主公身份从一开始就公开</li>
    </ul></div>
    <div class="rule-section"><h4>👥 联机座位</h4><ul>
      <li>座位列表中<b>本人角色永远排在第一</b>，方便快速定位</li>
      <li>移动端座位卡可横向滑动查看全部玩家</li>
    </ul></div>`;
  } else if (tab === 'factions') {
    el.innerHTML = Object.entries(FACTIONS)
      .map(
        ([k, f]) =>
          `<div class="rule-section" style="padding:8px;background:rgba(0,0,0,.25);border-radius:6px;border-left:3px solid ${f.color};margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px"><span style="font-size:19px">${f.icon}</span><span style="color:${f.color};font-weight:700;font-size:13px">${f.name}</span><span style="font-size:11px;color:var(--muted)">${f.desc}</span></div>
      <div style="font-size:11px;margin-top:3px"><b style="color:#f5e0a0">${f.lordSkill.name}</b>：${f.lordSkill.desc}</div>
    </div>`,
      )
      .join('');
  } else if (tab === 'cards') {
    el.innerHTML = `<div class="rule-section"><h4>⚔️ 基本牌</h4><ul><li><b>攻击牌</b>：对目标造成 1 点伤害；分普通 / 火 / 雷三种属性，可触发【混元剑狱】传导，火属性受【映雪冰风阵】放大。由各类攻击功法、火系 / 雷系符箓与法宝代替。</li><li><b>防御牌</b>：抵消一次攻击；由各类身法 / 盾法代替。</li><li><b>恢复牌</b>：回复 1 点体力或濒死自救；由各类恢复丹药代替。</li><li><b>增益牌</b>：本回合下一张攻击牌伤害 +1，濒死时可自救；由各类增益丹药 / 符箓代替。</li></ul></div>
    <div class="rule-section"><h4>🎴 锦囊</h4><ul><li><b>趋吉避凶诀</b>：摸2张</li><li><b>破阵符</b>：弃一张牌</li><li><b>敛息诀</b>：获得距离1内一张牌</li><li><b>决斗</b>：轮流出攻击</li><li><b>魔灾泛起 / 万剑钻心</b>：需出攻击 / 防御（护身法阵可免疫）</li><li><b>三木回心阵</b>：全体回血</li><li><b>不在算中</b>：抵消锦囊</li><li><b>七星定身阵</b>：判定红桃则失效</li><li><b>天劫</b>：判定黑桃2-9受3点雷伤</li><li><b>银甲乐傀召唤符</b>：令其出攻击，否则交出武器</li><li><b>同参木阵</b>：亮牌后依次各取一张</li><li><b>混元剑狱</b>：横置/重置，或重铸摸一张</li><li><b>极寒碧火诀</b>：弃同花色牌造成1点火伤</li><li><b>命演术</b>：指定角色判定，红桃则查看其隐藏身份（仅你可见）；自损 1 体力，每局限 1 次</li></ul></div>${knowledgeTrickHtml()}
    <div class="rule-section"><h4>🛡️ 装备</h4><ul><li><b>灵狐剑匣</b>：出攻击次数无限制</li><li><b>洼角云刀</b>：攻击被防御后可再出攻击</li><li><b>七剑斩元星</b>：两张手牌当攻击</li><li><b>七芯蝎尾夺</b>：无视目标护身法器</li><li><b>心生蜂云剑</b>：对异性用攻击，对方令你摸一张或自弃一张</li><li><b>青铜长戟</b>：攻击被防御后弃两张牌强制命中</li><li><b>月影玄冰剑</b>：弃两张牌改为令其弃两张牌</li><li><b>一剑碧环星</b>：目标无手牌时伤害+1</li><li><b>猴面金身法像</b>：判定红视为防御</li><li><b>清风法袍</b>：黑色攻击无效</li><li><b>映雪冰风阵</b>：普通攻击/群攻锦囊无效，火属性伤害+1</li><li><b>乙木御风梭 / 载具</b>：影响距离</li></ul></div>
    <div class="rule-section"><h4>🔗 连环与翻面</h4><ul><li><b>连环（横置）</b>：被【混元剑狱】横置的角色受到属性伤害时，伤害传导给所有横置角色，随后全部重置</li><li><b>翻面</b>：与连环相互独立；翻面角色跳过其下一个回合并翻回正面</li></ul></div>${cardPackHtml()}`;
  } else if (tab === 'chars') {
    let html = '';
    const byFaction = new Map<FactionId, typeof CHARACTERS>();
    for (const c of CHARACTERS) {
      const arr = byFaction.get(c.faction) ?? [];
      arr.push(c);
      byFaction.set(c.faction, arr);
    }
    for (const [fid, chars] of byFaction) {
      const f = FACTIONS[fid];
      html += `<div class="rule-section"><h4>${f.icon} ${f.name}</h4>`;
      chars.forEach((c) => {
        const cf = FACTIONS[c.faction];
        html += `<div style="padding:7px;background:rgba(0,0,0,.25);border-radius:6px;border-left:3px solid ${cf.color};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:19px">${c.avatar}</span><span style="color:${cf.color};font-weight:700;font-size:13px">${c.name}</span><span style="font-size:11px;color:var(--muted)">${c.title} · ${cf.name} · 体力${c.hp}</span></div>
          <div style="font-size:11px;margin-top:3px">${c.talents.map((s) => {
            const d = defOf(s.id);
            const tag = d
              ? d.kind === 'limit'
                ? '★限定技'
                : d.kind === 'awaken'
                  ? '☆觉醒技'
                  : d.kind === 'lord'
                    ? '👑主公技'
                    : d.kind === 'passive'
                      ? '【锁】锁定技'
                      : d.timing === 'active'
                        ? '主动技'
                        : '触发技'
              : s.type === 'active'
                ? '主动技'
                : '触发技';
            return `<b style="color:#f5e0a0">${s.name}</b>（<span style="color:#c8b8f0">${tag}</span>）：${s.desc}`;
          }).join('<br>')}</div>
        </div>`;
      });
      html += `</div>`;
    }
    el.innerHTML = html;
  } else if (tab === 'ach') {
    el.innerHTML = `<div class="rule-section"><h4>🏅 成就一览</h4><div class="ach-grid">${
      ACHIEVEMENTS.map((a) => {
        const un = !!PROFILE.achievements[a.id];
        return `<div class="ach-item ${un ? 'unlocked' : 'locked'}"><div class="ach-icon">${un ? a.icon : '🔒'}</div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>`;
      }).join('')
    }</div></div>`;
  } else if (tab === 'packs') {
    el.innerHTML = `<div class="rule-section"><h4>🎁 扩展包</h4><ul>
      <li><b>全部</b>：掌门路原著角色池范围选项（免费并列）。</li>
      <li>切换扩展包会即时刷新可选角色池，联机时加入方可在房主基础包之上叠加。</li>
    </ul></div>
    <div class="rule-section"><h4>👥 联机：房主统一选包 + 个人叠加</h4><ul>
      <li>房主统一选<b>基础包</b>；每位玩家可在基础包之上<b>叠加启用</b>扩展包，角色池 = 基础 ∪ 个人叠加。</li>
      <li>中途加入接管 AI 角色；重新开局前可重选已启用扩展包内的任意角色。</li>
    </ul></div>`;
  }
}
