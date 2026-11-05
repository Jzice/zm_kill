/* ==================== Canvas 2D 粒子舞台（仙侠流光层） ====================
 * 与 DOM 特效层并列：DOM 负责牌面/光环，Canvas 负责剑气拖尾、灵尘、符文飞散。
 * 零外部资源；import 时不创建 DOM、不启动 rAF，全部由 mountFxStage() 懒初始化。
 */
import type { FxEvent, FxLevel, FxTheme } from './fxEvent';
import { FX_PALETTE, fxThemeOf } from './fxEvent';
import { isSim } from './dom';
import { FX as RenderFX } from './fx';

type FxMode = 'linear' | 'inward' | 'spiral' | 'rise' | 'ash';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  theme: FxTheme;
  mode: FxMode;
  glyph: string;
  angle: number;
  spin: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  vr: number;
  life: number;
  maxLife: number;
  theme: FxTheme;
  angle: number;
  spin: number;
}

const GLYPHS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷', '敕', '令'];
const THEMES: FxTheme[] = ['blade', 'talisman', 'ward', 'spirit', 'relic', 'neutral'];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let level: FxLevel = 'lite';
let mounted = false;
let raf = 0;
let lastTs = 0;
let frameCount = 0;
let vw = 0;
let vh = 0;
let dpr = 1;
let paletteKey = '';

const particles: Particle[] = [];
const particlePool: Particle[] = [];
const rings: Ring[] = [];
const sprites = new Map<FxTheme, HTMLCanvasElement>();

/** 调色板副本：relic / neutral 跟随主题 CSS 变量，其余为固定仙霞色 */
const palettes: Record<FxTheme, { main: string; glow: string; spark: string }> = {
  blade: { ...FX_PALETTE.blade },
  talisman: { ...FX_PALETTE.talisman },
  ward: { ...FX_PALETTE.ward },
  spirit: { ...FX_PALETTE.spirit },
  relic: { ...FX_PALETTE.relic },
  neutral: { ...FX_PALETTE.neutral },
};

function reducedMotion(): boolean {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function enabled(): boolean {
  return mounted && !isSim() && level !== 'off' && !reducedMotion();
}

function particleCap(): number {
  const base = level === 'full' ? 240 : 100;
  return vw <= 600 ? Math.floor(base / 2) : base;
}

function scale(): number {
  return vw <= 600 ? 0.72 : 1;
}

function newParticle(): Particle {
  return {
    x: 0, y: 0, vx: 0, vy: 0, gravity: 0,
    life: 0, maxLife: 1, size: 6, alpha: 1,
    theme: 'neutral', mode: 'linear', glyph: '', angle: 0, spin: 0,
  };
}

function acquire(): Particle {
  return particlePool.pop() ?? newParticle();
}

/** 光点精灵：预渲染径向渐变，避免逐粒子 shadowBlur */
function buildSprites(): void {
  sprites.clear();
  for (const t of THEMES) {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    if (!g) continue;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, palettes[t].spark);
    grad.addColorStop(0.28, palettes[t].main);
    grad.addColorStop(0.65, palettes[t].glow + '88');
    grad.addColorStop(1, palettes[t].glow + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites.set(t, c);
  }
}

/** 主题切换时刷新一次调色板（不在每帧读 getComputedStyle） */
function refreshPalette(): void {
  const key = `${document.body?.dataset.mode ?? ''}|${document.body?.dataset.theme ?? ''}`;
  if (key === paletteKey) return;
  paletteKey = key;
  try {
    const cs = getComputedStyle(document.body);
    const gold = cs.getPropertyValue('--gold').trim();
    const accent = cs.getPropertyValue('--accent-strong').trim();
    if (gold) {
      palettes.relic.main = gold;
      palettes.neutral.main = gold;
    }
    if (accent) {
      palettes.relic.spark = accent;
      palettes.neutral.spark = accent;
    }
  } catch (e) {
    /* 保留固定仙霞色兜底 */
  }
  buildSprites();
}

function resize(): void {
  if (!canvas || !ctx) return;
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = vw <= 600 ? 1 : Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.floor(vw * dpr));
  canvas.height = Math.max(1, Math.floor(vh * dpr));
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  refreshPalette();
}

function stopFrame(): void {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  lastTs = 0;
}

function startFrame(): void {
  if (raf || !ctx) return;
  raf = requestAnimationFrame(tick);
}

function onResize(): void {
  resize();
  if (document.hidden) stopFrame();
  else if (particles.length || rings.length) startFrame();
}

function onVisibility(): void {
  if (document.hidden) {
    stopFrame();
  } else {
    resize();
    if (particles.length || rings.length) startFrame();
  }
}

/** 懒挂载：无头模拟 / 关闭 / 系统减弱动效时完全不创建 Canvas */
export function mountFxStage(): void {
  if (mounted || isSim() || level === 'off' || reducedMotion()) return;
  const host = document.getElementById('fxLayer');
  if (!host) return;
  const c = document.createElement('canvas');
  c.className = 'fx-canvas';
  c.setAttribute('aria-hidden', 'true');
  host.appendChild(c);
  const g = c.getContext('2d');
  if (!g) {
    c.remove();
    return;
  }
  canvas = c;
  ctx = g;
  mounted = true;
  resize();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
}

export function setStageLevel(next: FxLevel): void {
  level = next;
  if (next === 'off') {
    particles.length = 0;
    rings.length = 0;
    stopFrame();
    if (ctx) ctx.clearRect(0, 0, vw, vh);
    return;
  }
  if (!mounted) mountFxStage();
}

/** 调试 / 冒烟探针 */
export function getFxStageStats(): { mounted: boolean; level: FxLevel; particles: number; rings: number; frames: number } {
  return { mounted, level, particles: particles.length, rings: rings.length, frames: frameCount };
}

function spawn(
  x: number, y: number, theme: FxTheme, count: number, mode: FxMode,
  speed: number, life: number, size: number, glyph = false,
): void {
  const cap = particleCap();
  for (let i = 0; i < count && particles.length < cap; i++) {
    const p = acquire();
    const a = (Math.PI * 2 * i) / Math.max(1, count) + Math.random() * 0.5;
    const s = speed * (0.45 + Math.random() * 0.75);
    p.x = x;
    p.y = y;
    p.angle = a;
    p.spin = (Math.random() - 0.5) * 0.16;
    p.mode = mode;
    p.theme = theme;
    p.size = size * scale() * (0.65 + Math.random() * 0.8);
    p.life = p.maxLife = life * (0.7 + Math.random() * 0.6);
    p.alpha = 1;
    p.glyph = glyph && Math.random() < 0.45 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : '';
    p.gravity = mode === 'rise' ? -0.012 : mode === 'ash' ? 0.035 : 0.006;
    if (mode === 'inward') {
      p.x = x + Math.cos(a) * 78 * scale();
      p.y = y + Math.sin(a) * 78 * scale();
      p.vx = -Math.cos(a) * s;
      p.vy = -Math.sin(a) * s;
    } else if (mode === 'spiral') {
      p.x = x + Math.cos(a) * 54 * scale();
      p.y = y + Math.sin(a) * 54 * scale();
      p.vx = -Math.cos(a) * s * 0.6 - Math.sin(a) * s;
      p.vy = -Math.sin(a) * s * 0.6 + Math.cos(a) * s;
    } else if (mode === 'rise') {
      p.x = x + (Math.random() - 0.5) * 62 * scale();
      p.y = y + 22 * scale();
      p.vx = (Math.random() - 0.5) * 0.7;
      p.vy = -s * 0.7;
    } else if (mode === 'ash') {
      p.x = x + (Math.random() - 0.5) * 90 * scale();
      p.vy = -s * 0.35;
      p.vx = (Math.random() - 0.5) * s;
    } else {
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
    }
    particles.push(p);
  }
}

/** 剑气爆闪：沿两道对角光刃散射，避免圆形火花掩盖「斩击」观感 */
function spawnCross(x: number, y: number, theme: FxTheme, count: number, speed: number, life: number, size: number): void {
  const cap = particleCap();
  for (let i = 0; i < count && particles.length < cap; i++) {
    const p = acquire();
    // 与 CSS .sl-cut 的两道光刃角度（-33° / 52°）对齐
    const a = (i % 2 === 0 ? -0.58 : 0.9) + (Math.random() - 0.5) * 0.22;
    const s = speed * (0.5 + Math.random() * 0.8);
    const off = (Math.random() - 0.5) * 30 * scale();
    p.x = x + Math.cos(a) * off;
    p.y = y + Math.sin(a) * off;
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s;
    p.gravity = 0.004;
    p.mode = 'linear';
    p.theme = theme;
    p.size = size * scale() * (0.6 + Math.random() * 0.9);
    p.life = p.maxLife = life * (0.7 + Math.random() * 0.6);
    p.alpha = 1;
    p.glyph = '';
    p.angle = a;
    p.spin = 0;
    particles.push(p);
  }
}

function addRing(x: number, y: number, theme: FxTheme, r: number, vr: number, life: number, spin = 0.02): void {
  if (rings.length > 12) return;
  rings.push({ x, y, r: r * scale(), vr: vr * scale(), life, maxLife: life, theme, angle: Math.random() * Math.PI, spin });
}

/** 剑气：沿飞行路径拖尾 + 终点十字爆闪 */
function blade(from: { x: number; y: number } | null, to: { x: number; y: number } | null, e: FxEvent): void {
  const at = to ?? from ?? { x: vw / 2, y: vh / 2 };
  const theme: FxTheme = 'blade';
  if (from && to && (Math.abs(to.x - from.x) > 4 || Math.abs(to.y - from.y) > 4)) {
    const steps = level === 'full' ? 22 : 12;
    for (let i = 0; i < steps && particles.length < particleCap(); i++) {
      const t = i / steps;
      const p = acquire();
      p.x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 10;
      p.y = from.y + (to.y - from.y) * t - 34 * Math.sin(Math.PI * t) + (Math.random() - 0.5) * 10;
      p.vx = (to.x - from.x) * 0.0028;
      p.vy = (to.y - from.y) * 0.0028;
      p.gravity = 0.004;
      p.mode = 'linear';
      p.theme = theme;
      p.size = (10 + Math.random() * 12) * scale();
      p.life = p.maxLife = 300 + Math.random() * 220;
      p.alpha = 1;
      p.glyph = '';
      p.angle = 0;
      p.spin = 0;
      particles.push(p);
    }
  }
  spawnCross(at.x, at.y, theme, level === 'full' ? 34 : 18, 4.4 * scale(), 460, 11);
  addRing(at.x, at.y, theme, 12, 2.6, 320, 0.05);
  if (e.kind === 'slash' || e.kind === 'hitShake') addRing(at.x, at.y, theme, 30, 1.6, 420, -0.04);
}

/** 符箓法阵：双层逆转法阵环 + 卦符飞散；群攻额外在每个目标处炸开 */
function talisman(from: { x: number; y: number } | null, to: { x: number; y: number } | null, e: FxEvent): void {
  const at = to ?? from ?? { x: vw / 2, y: vh / 2 };
  addRing(at.x, at.y, 'talisman', 26, 2.1, 620, 0.035);
  addRing(at.x, at.y, 'talisman', 46, -0.7, 720, -0.028);
  spawn(at.x, at.y, 'talisman', level === 'full' ? 26 : 14, 'linear', 2.2 * scale(), 680, 13, true);
  if (e.kind === 'aoe' && e.toList?.length) {
    for (const idx of e.toList) {
      const p = RenderFX.anchor(idx);
      addRing(p.x, p.y, 'talisman', 14, 1.7, 380, 0.04);
      spawn(p.x, p.y, 'talisman', 6, 'linear', 1.8 * scale(), 360, 8, true);
    }
  }
}

/** 八卦护罩：光点自外向内收拢 + 双层环壁 */
function ward(at: { x: number; y: number }): void {
  addRing(at.x, at.y, 'ward', 62, -0.55, 700, 0.045);
  addRing(at.x, at.y, 'ward', 44, -0.3, 620, -0.06);
  spawn(at.x, at.y, 'ward', level === 'full' ? 30 : 16, 'inward', 2.1 * scale(), 640, 10, false);
}

/** 青碧灵光：柔光自下升腾 */
function spirit(at: { x: number; y: number }): void {
  addRing(at.x, at.y, 'spirit', 22, 1.5, 620, 0.02);
  spawn(at.x, at.y, 'spirit', level === 'full' ? 26 : 14, 'rise', 1.9 * scale(), 760, 12, false);
}

/** 法宝凝形：光点螺旋汇聚成印 */
function relic(at: { x: number; y: number }, from: { x: number; y: number } | null): void {
  addRing(at.x, at.y, 'relic', 30, -0.5, 620, 0.06);
  spawn(at.x, at.y, 'relic', level === 'full' ? 28 : 15, 'spiral', 2.0 * scale(), 680, 10, false);
  if (from && eHasTravel(from, at)) spawn(from.x, from.y, 'relic', 8, 'linear', 1.4 * scale(), 420, 7, false);
}

function eHasTravel(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 60;
}

/** 余烬：判定 / 阵亡 / 结算横幅 / 胜利 */
function ash(at: { x: number; y: number }, e: FxEvent): void {
  const theme: FxTheme = e.kind === 'death' ? 'neutral' : 'relic';
  addRing(at.x, at.y, theme, 20, 1.8, 560, 0.018);
  spawn(at.x, at.y, theme, level === 'full' ? 22 : 12, 'ash', 1.6 * scale(), 780, 9, e.kind === 'judge');
}

/** 事件 → 粒子笔刷（即发即忘，绝不阻塞出牌流程） */
export function castFx(e: FxEvent): void {
  if (!enabled()) return;
  try {
    refreshPalette();
    const from = e.from != null ? RenderFX.anchor(e.from) : null;
    const to = e.to != null ? RenderFX.anchor(e.to) : null;
    const at = to ?? from ?? { x: vw / 2, y: vh / 2 };
    const theme = fxThemeOf(e);
    if (theme === 'blade') blade(from, to, e);
    else if (theme === 'talisman') talisman(from, to, e);
    else if (theme === 'ward') ward(at);
    else if (theme === 'spirit') spirit(at);
    else if (theme === 'relic') relic(at, from);
    else ash(at, e);
    startFrame();
  } catch (err) {
    console.error('[fxStage] 粒子播放失败', err);
  }
}

function tick(ts: number): void {
  frameCount++;
  const dt = Math.min(32, ts - (lastTs || ts)) / 16.67;
  lastTs = ts;
  if (!ctx) {
    raf = 0;
    return;
  }
  ctx.clearRect(0, 0, vw, vh);
  ctx.globalCompositeOperation = 'lighter';

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.life -= 16.67 * dt;
    r.r += r.vr * dt;
    r.angle += r.spin * dt;
    if (r.life <= 0 || r.r <= 0) {
      rings.splice(i, 1);
      continue;
    }
    const pal = palettes[r.theme];
    ctx.globalAlpha = Math.min(1, r.life / r.maxLife) * 0.72;
    ctx.strokeStyle = pal.main;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    // 八卦刻度：8 段短弧，随法阵旋转
    ctx.strokeStyle = pal.spark;
    ctx.lineWidth = 3;
    for (let k = 0; k < 8; k++) {
      const a = r.angle + (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, a, a + 0.16);
      ctx.stroke();
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 16.67 * dt;
    if (p.life <= 0) {
      particlePool.push(p);
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.982;
    p.vy = p.vy * 0.982 + p.gravity * dt;
    p.angle += p.spin * dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = p.alpha;
    if (p.glyph) {
      ctx.fillStyle = palettes[p.theme].spark;
      ctx.font = `${Math.round(p.size * 1.6)}px "STKaiti","KaiTi",serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    } else {
      const s = sprites.get(p.theme);
      if (s) ctx.drawImage(s, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  raf = particles.length || rings.length ? requestAnimationFrame(tick) : 0;
  if (!raf) lastTs = 0;
}
