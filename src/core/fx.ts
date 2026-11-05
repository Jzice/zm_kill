/* ==================== 特效渲染器（DOM 动画层 · 仙侠法术） ====================
 * 纯本地渲染：不发射事件、不广播、不做强度判断（统一由 core/fxBus.ts 负责）。
 * 所有 DOM 结构均为「蓄光 → 飞行 → 爆闪 → 余烬」分层，样式见 style.css 特效层。
 */
import type { Card } from './types';
import type { WinCamp } from './fxEvent';
import { escapeHtml, sleep } from './dom';

export type { WinCamp } from './fxEvent';

function layer(): HTMLElement | null {
  return document.getElementById('fxLayer') || document.body || null;
}

/** 插入临时节点并按时移除（fxLayer 缺失时回退 body，无头环境自动安全） */
function put(el: HTMLElement, ms: number): void {
  const host = layer();
  if (!host) return;
  host.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function node(cls: string, html = ''): HTMLDivElement {
  const e = document.createElement('div');
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export const FX = {
  anchor(idx: number): { x: number; y: number } {
    const s = document.querySelector(`.seat[data-idx="${idx}"] .p-card`);
    if (!s) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = s.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  },
  attackLunge(idx: number): void {
    const e = document.querySelector(`.seat[data-idx="${idx}"] .p-card`);
    if (!e) return;
    e.classList.remove('attacking', 'fx-charge');
    void (e as HTMLElement).offsetWidth;
    e.classList.add('attacking', 'fx-charge', 'fx-theme-blade');
    setTimeout(() => e.classList.remove('attacking', 'fx-charge', 'fx-theme-blade'), 480);
  },
  hitShake(idx: number): void {
    const e = document.querySelector(`.seat[data-idx="${idx}"] .p-card`);
    if (!e) return;
    e.classList.remove('hit-shake');
    void (e as HTMLElement).offsetWidth;
    e.classList.add('hit-shake');
    setTimeout(() => e.classList.remove('hit-shake'), 520);
    const a = this.anchor(idx);
    const f = node('fx-impact fx-theme-blade', '<i class="fi-cross"></i><i class="fi-cross b"></i>');
    f.style.left = a.x - 45 + 'px';
    f.style.top = a.y - 45 + 'px';
    put(f, 560);
  },
  async flyCard(
    fi: number,
    ti: number,
    text: string,
    type = 'basic',
    dur = 520,
  ): Promise<void> {
    const from = this.anchor(fi),
      to = this.anchor(ti);
    const e = node('fly-card fx-theme-blade');
    if (type !== 'basic') e.classList.add(type);
    e.innerHTML = `<i class="fc-trail"></i><span class="fc-glyph">劍</span><span class="fc-name">${escapeHtml(text)}</span>`;
    e.style.left = from.x - 22 + 'px';
    e.style.top = from.y - 31 + 'px';
    const host = layer();
    if (!host) return;
    host.appendChild(e);
    const dx = to.x - from.x,
      dy = to.y - from.y;
    const frames: Keyframe[] = [
      { transform: 'translate(0,0) scale(.5)', opacity: 0, filter: 'brightness(2)' },
      { transform: 'translate(0,0) scale(1.08)', opacity: 1, offset: 0.14, filter: 'brightness(1.5)' },
      {
        transform: `translate(${dx * 0.5}px,${dy * 0.5 - 55}px) scale(1.1) rotate(180deg)`,
        opacity: 1,
        offset: 0.62,
        filter: 'brightness(1.3)',
      },
      {
        transform: `translate(${dx}px,${dy}px) scale(.5) rotate(360deg)`,
        opacity: 0.15,
        filter: 'brightness(1)',
      },
    ];
    const a = e.animate(frames, {
      duration: dur,
      easing: 'cubic-bezier(.45,.05,.65,.95)',
      fill: 'forwards',
    });
    await a.finished;
    e.remove();
  },
  async slash(idx: number): Promise<void> {
    const a = this.anchor(idx);
    this.hitShake(idx);
    const f = node(
      'fx-slash fx-theme-blade',
      '<i class="sl-core"></i><i class="sl-cut"></i><i class="sl-cut b"></i><span class="sl-word">斩</span>',
    );
    f.style.left = a.x - 60 + 'px';
    f.style.top = a.y - 60 + 'px';
    put(f, 880);
    await sleep(340);
  },
  async shield(idx: number): Promise<void> {
    const a = this.anchor(idx);
    const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
      .map((g, i) => `<i class="ward-trigram" style="--i:${i}">${g}</i>`)
      .join('');
    const r = node('shield-fx fx-theme-ward', `<span class="ward-core">守</span>${trigrams}`);
    r.style.left = a.x - 62 + 'px';
    r.style.top = a.y - 62 + 'px';
    put(r, 720);
    floatTextFx(idx, '护体', '#7fd8ff');
    await sleep(320);
  },
  healGlow(idx: number): void {
    const a = this.anchor(idx);
    const f = node('heal-fx fx-theme-spirit', '<i class="heal-orbit"></i><i class="heal-orbit b"></i><span class="heal-rune">生</span>');
    f.style.left = a.x - 46 + 'px';
    f.style.top = a.y - 46 + 'px';
    put(f, 950);
  },
  skillWave(idx: number): void {
    const a = this.anchor(idx);
    const runes = ['敕', '令', '法', '阵'].map((g, i) => `<i class="sr-rune" style="--i:${i}">${g}</i>`).join('');
    const f = node('skill-ripple fx-theme-talisman', `<i class="sr-disc"></i>${runes}`);
    f.style.left = a.x - 78 + 'px';
    f.style.top = a.y - 78 + 'px';
    put(f, 900);
  },
  async judge(idx: number, card: Card): Promise<void> {
    const a = this.anchor(idx);
    const isRed = card.suit === '♥' || card.suit === '♦';
    const f = node('judge-fx fx-theme-talisman ' + (isRed ? 'red' : 'black'));
    f.innerHTML = `<i class="jf-seal">卜</i><div class="jsuit">${escapeHtml(card.suit)}</div><div class="jnum">${escapeHtml(card.num)}</div><div class="jname">${escapeHtml(card.name)}</div>`;
    f.style.left = a.x - 30 + 'px';
    f.style.top = a.y - 44 + 'px';
    put(f, 900);
    await sleep(900);
  },
  /** 阵亡动画：显示身份与击杀者（二者可选） */
  async death(idx: number, roleText?: string, killerText?: string): Promise<void> {
    const a = this.anchor(idx);
    const f = node('death-fx fx-theme-neutral');
    f.innerHTML =
      '<i class="df-shard s1"></i><i class="df-shard s2"></i><i class="df-shard s3"></i>' +
      '<div class="df-title">道 消</div>' +
      (roleText ? `<div class="df-role">${escapeHtml(roleText)}</div>` : '') +
      (killerText ? `<div class="df-killer">${escapeHtml(killerText)}</div>` : '');
    f.style.left = a.x - 90 + 'px';
    f.style.top = a.y - 30 + 'px';
    put(f, 1250);
    await sleep(1250);
  },
};

export function floatTextFx(idx: number, text: string, color: string): void {
  const a = FX.anchor(idx);
  const f = node('float-text fx-theme-neutral');
  f.textContent = text;
  f.style.color = color;
  f.style.left = a.x - 16 + 'px';
  f.style.top = a.y - 14 + 'px';
  put(f, 1150);
}

/* ==================== 锦囊牌 / 装备 / 摸弃牌特效 ==================== */

/** 符箓卦纹：按锦囊子类区分（以朱砂篆字替代原 emoji） */
const TRICK_GLYPH: Record<string, string> = {
  wuzhong: '悟',
  guohe: '破',
  shunshou: '摄',
  juedou: '斗',
  nanman: '灾',
  wanjian: '剑',
  taoyuan: '生',
  wuxie: '解',
  lebu: '定',
  shandian: '劫',
};

/** 技能释放：双层逆转法阵 + 朱砂符牌翻出（符牌旋转须停在 rotateY(360deg) 正向） */
export async function trickCast(
  idx: number,
  cardName: string,
  sub: string,
  color = '#b57fff',
  dur = 900,
): Promise<void> {
  const a = FX.anchor(idx);
  const glyph = TRICK_GLYPH[sub] || '敕';
  const wrap = node('trick-fx fx-theme-talisman');
  wrap.style.left = a.x + 'px';
  wrap.style.top = a.y + 'px';
  wrap.innerHTML = `<div class="trick-ring tr1" style="border-color:${color}"></div>
    <div class="trick-ring tr2" style="border-color:${color}"></div>
    <div class="trick-card" style="border-color:${color}"><i class="tc-seal">敕</i><span class="tc-glyph">${glyph}</span><span class="tc-name">${escapeHtml(cardName)}</span></div>`;
  const host = layer();
  if (!host) return;
  host.appendChild(wrap);
  wrap.querySelectorAll<HTMLElement>('.trick-ring').forEach((ring, i) => {
    ring.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: `translate(-50%,-50%) scale(1.1) rotate(${i ? -120 : 120}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(-50%,-50%) scale(1.7) rotate(${i ? -260 : 260}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: 'ease-out', fill: 'forwards' },
    );
  });
  const card = wrap.querySelector<HTMLElement>('.trick-card');
  card?.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.4) rotateY(180deg)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.05) rotateY(360deg)', opacity: 1, offset: 0.4 },
      { transform: 'translate(-50%,-50%) scale(1.05) rotateY(360deg)', opacity: 1, offset: 0.7 },
      { transform: 'translate(-50%,-50%) scale(.85) rotateY(360deg) translateY(-24px)', opacity: 0 },
    ],
    { duration: dur, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' },
  );
  await sleep(dur * 0.72);
  setTimeout(() => wrap.remove(), dur);
}

/** 群攻技能：法阵自施法者向全体扩散 */
export async function aoeFx(fromIdx: number, targetIdx: number[], color = '#e74c3c'): Promise<void> {
  const from = FX.anchor(fromIdx);
  const wave = node('aoe-wave fx-theme-talisman', '<i class="aw-rune">阵</i>');
  wave.style.left = from.x + 'px';
  wave.style.top = from.y + 'px';
  wave.style.borderColor = color;
  const host = layer();
  if (host) host.appendChild(wave);
  wave.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.1)', opacity: 0.9 },
      { transform: 'translate(-50%,-50%) scale(2.4)', opacity: 0 },
    ],
    { duration: 620, easing: 'ease-out', fill: 'forwards' },
  );
  setTimeout(() => wave.remove(), 660);
  targetIdx.forEach((i, k) => {
    setTimeout(() => FX.hitShake(i), 120 + k * 90);
  });
  await sleep(360);
}

/** 装备：法宝光点螺旋凝形，定格于座位装备区 */
export async function equipFx(idx: number, cardName: string): Promise<void> {
  const a = FX.anchor(idx);
  const e = node('equip-fx fx-theme-relic');
  e.innerHTML = `<i class="eq-seal">宝</i><span class="eq-name">${escapeHtml(cardName)}</span>`;
  e.style.left = a.x + 'px';
  e.style.top = a.y + 'px';
  const host = layer();
  if (host) host.appendChild(e);
  e.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.5) translateY(-40px)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1) translateY(0)', opacity: 1, offset: 0.35 },
      { transform: 'translate(-50%,-50%) scale(.9) translateY(10px)', opacity: 0 },
    ],
    { duration: 760, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' },
  );
  await sleep(420);
  setTimeout(() => e.remove(), 400);
}

/** 摸牌：牌堆向座位飞符牌 */
export function drawFx(idx: number, n: number): void {
  const pile = document.querySelector<HTMLElement>('.pile-stack');
  const from = pile
    ? (() => {
        const r = pile.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const to = FX.anchor(idx);
  for (let i = 0; i < Math.min(n, 4); i++) {
    const e = node('fly-card draw fx-theme-relic', '<span class="fc-glyph">符</span>');
    e.style.left = from.x - 16 + 'px';
    e.style.top = from.y - 22 + 'px';
    const host = layer();
    if (!host) return;
    host.appendChild(e);
    e.animate(
      [
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.2 },
        {
          transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.5) rotate(180deg)`,
          opacity: 0.1,
        },
      ],
      { duration: 480, delay: i * 90, easing: 'cubic-bezier(.45,.05,.65,.95)', fill: 'forwards' },
    );
    setTimeout(() => e.remove(), 480 + i * 90 + 60);
  }
}

/** 弃牌：手牌区符牌散入弃牌堆 */
export function discardFx(idx: number): void {
  const to = document.querySelector<HTMLElement>('.pile-stack:last-of-type');
  const from = FX.anchor(idx);
  const dest = to
    ? (() => {
        const r = to.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    : { x: window.innerWidth - 60, y: window.innerHeight / 2 };
  const e = node('fly-card discard fx-theme-relic', '<span class="fc-glyph">散</span>');
  e.style.left = from.x - 16 + 'px';
  e.style.top = from.y - 22 + 'px';
  const host = layer();
  if (!host) return;
  host.appendChild(e);
  e.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dest.x - from.x}px,${dest.y - from.y}px) scale(.4) rotate(-160deg)`, opacity: 0.15 },
    ],
    { duration: 420, easing: 'ease-in', fill: 'forwards' },
  );
  setTimeout(() => e.remove(), 480);
}

/** 连击：剑气环 + 浮字 */
export function comboFx(idx: number, combo: number): void {
  floatTextFx(idx, `⚡${combo} 连击`, '#ffd166');
  const a = FX.anchor(idx);
  const r = node('skill-ripple combo fx-theme-blade', '<i class="sr-disc"></i>');
  r.style.left = a.x - 78 + 'px';
  r.style.top = a.y - 78 + 'px';
  put(r, 900);
}

/** 结算横幅（胜 / 负） */
export async function resultBanner(text: string, win: boolean): Promise<void> {
  const el = node('result-banner fx-theme-neutral ' + (win ? 'win' : 'lose'));
  el.innerHTML = `<i class="rb-ray"></i><span class="rb-icon">${win ? '☰' : '☷'}</span><span class="rb-text">${escapeHtml(text)}</span>`;
  const host = layer();
  if (!host) return;
  host.appendChild(el);
  el.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(-50%,-50%) scale(1.05)', opacity: 0 },
    ],
    { duration: 2000, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' },
  );
  await sleep(1400);
  setTimeout(() => el.remove(), 700);
}

/** 胜利方式：按获胜阵营区分不同个性动画（沿用既有 vic-* 样式钩子） */
export function victoryFx(camp: WinCamp, mountId = 'settleHero'): void {
  const mount = document.getElementById(mountId) || layer();
  if (!mount) return;
  const wrap = node(`vic-fx vic-${camp} fx-theme-neutral`);
  if (camp === 'lord') {
    wrap.innerHTML = `<div class="vic-beam"></div><div class="vic-rays"></div><div class="vic-icon">☰</div><div class="vic-word">证道</div>`;
  } else if (camp === 'rebel') {
    wrap.innerHTML = `<div class="vic-boom b1"></div><div class="vic-boom b2"></div><div class="vic-fire"></div><div class="vic-icon">☲</div><div class="vic-word">举义</div>`;
  } else if (camp === 'spy') {
    wrap.innerHTML = `<div class="vic-smoke"></div><div class="vic-cards">☵ ☷ ☰</div><div class="vic-icon">☵</div><div class="vic-word">渔利</div>`;
  } else {
    wrap.innerHTML = `<div class="vic-shard s1"></div><div class="vic-shard s2"></div><div class="vic-shard s3"></div><div class="vic-icon">☷</div><div class="vic-word">道消</div>`;
  }
  mount.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4000);
}
