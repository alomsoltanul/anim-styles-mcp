// Shared by the promo starters in styles/promo-*. Every colour comes from window.BRAND, so a film survives any palette.
export { clamp, seg, lerp, ease, rng, fontsReady } from '../time.js';
import { clamp, lerp } from '../time.js';

export const expoOut = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(k));
export const expoIn = k => k <= 0 ? 0 : Math.pow(2, 10 * (clamp(k) - 1));
export const expoIO = k => { k = clamp(k); if (k === 0 || k === 1) return k; return k < .5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2; };
// A damped spring from 0 to 1. dt in seconds, f in Hz, z the damping ratio.
export function spring(dt, f = 2.6, z = .84) {
  if (dt <= 0) return 0;
  const zz = Math.min(z, .97), w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - zz * zz);
  return 1 - Math.exp(-zz * w * dt) * (Math.cos(wd * dt) + zz * w / wd * Math.sin(wd * dt));
}
export const pulse = (dt, d = .3) => dt <= 0 || dt >= d ? 0 : Math.sin(Math.PI * dt / d) * (1 - dt / d) * 1.9;

// ---- Colour
const rgb = c => {
  let h = String(c).trim().replace('#', '');
  if (h.length === 3) h = [...h].map(x => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
};
const toHex = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, k) => { const x = rgb(a), y = rgb(b); return toHex(x.map((v, i) => lerp(v, y[i], k))); };
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
export const luma = c => { const [r, g, b] = rgb(c).map(lin); return .2126 * r + .7152 * g + .0722 * b; };
export const contrast = (a, b) => { const x = luma(a), y = luma(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
// Moves fg toward white or black until it reads on bg.
export function readable(fg, bg, min = 4.5) {
  const toward = luma(bg) < .3 ? '#ffffff' : '#000000';
  for (let k = 0; k <= 1.001; k += .05) { const c = mix(fg, toward, k); if (contrast(c, bg) >= min) return c; }
  return toward;
}
const best = (bg, list) => list.reduce((a, b) => contrast(b, bg) > contrast(a, bg) ? b : a);
// Same hue, lighter or darker. Lifts a dark colour and sinks a light one by default.
export function shade(c, amt) {
  const [r, g, b] = rgb(c).map(v => v / 255), hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo;
  let l = (hi + lo) / 2, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = 0;
  if (d) h = hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  l = clamp(l + (l < .5 ? amt : -amt));
  const C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs(h % 2 - 1)), m = l - C / 2;
  const f = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][Math.floor(h) % 6];
  return toHex(f.map(v => (v + m) * 255));
}

// ---- Brand. Reads window.BRAND, fills gaps, and publishes the palette as CSS variables.
export function useBrand() {
  const raw = window.BRAND ?? {};
  const c = { bg: '#101F35', ink: '#FBF7F2', accent: '#E63946', paper: '#F6F1E7', ...raw.colors };
  const colors = {
    ...c,
    onBg: readable(best(c.bg, [c.ink, c.paper]), c.bg, 7),      // text on the main field
    onPaper: readable(best(c.paper, [c.bg, c.ink]), c.paper, 7), // text on the paper field
    accentOnBg: readable(c.accent, c.bg, 3.4),       // accent as text on bg
    accentOnPaper: readable(c.accent, c.paper, 3.4), // accent as text on paper
    onAccent: contrast(c.ink, c.accent) >= 3.4 ? c.ink : best(c.accent, [c.bg, '#ffffff', '#101010']),   // big type, so the light option wins when it reads
    glow: shade(c.bg, .17),
  };
  colors.mutedBg = mix(colors.onBg, c.bg, .3);
  colors.mutedPaper = mix(colors.onPaper, c.paper, .36);
  const css = { bg: c.bg, ink: colors.onBg, accent: c.accent, paper: c.paper, 'on-paper': colors.onPaper, 'accent-bg': colors.accentOnBg, 'accent-paper': colors.accentOnPaper,
    'on-accent': colors.onAccent, glow: colors.glow, 'muted-bg': colors.mutedBg, 'muted-paper': colors.mutedPaper };
  for (const [k, v] of Object.entries(css)) document.documentElement.style.setProperty(`--${k}`, v);
  const products = (raw.products ?? []).filter(p => p?.title);
  return {
    name: raw.name ?? 'Your Brand', tagline: raw.tagline ?? '', url: raw.url ?? '', cta: raw.cta ?? '', logo: raw.logo ?? null, colors,
    products: products.length ? products : [{ title: raw.name ?? 'Your Brand', sub: raw.tagline ?? '' }],
  };
}

// ---- Text. `*word*` in copy marks the accent.
const esc = s => String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
export const marked = (s, cls = 'hl') => esc(s).replace(/\*([^*]+)\*/g, `<span class="${cls}">$1</span>`);
export const plain = s => String(s).replace(/\*/g, '');
// Shrinks an element's font until one line fits maxW. Call after fonts are ready.
export function fit(e, maxW, min = 22) {
  e.style.whiteSpace = 'nowrap';
  const range = document.createRange();
  range.selectNodeContents(e);
  const size = parseFloat(getComputedStyle(e).fontSize), w = range.getBoundingClientRect().width;   // the text, not its box
  if (w > maxW) e.style.fontSize = `${Math.max(min, Math.floor(size * maxW / w))}px`;
  return parseFloat(e.style.fontSize || size);
}
// Breaks words into the fewest lines that fit maxW, with the line widths as even as they can be. width(text) measures one line.
export function balance(words, width, maxW) {
  const best = { lines: null, score: Infinity };
  for (let k = 1; k <= words.length && !best.lines; k++) {
    const walk = (i, left, acc) => {
      if (left === 1) {
        const lines = [...acc, words.slice(i).join(' ')], ws = lines.map(width), hi = Math.max(...ws);
        if (hi <= maxW && hi - Math.min(...ws) < best.score) { best.score = hi - Math.min(...ws); best.lines = lines; }
        return;
      }
      for (let j = i + 1; j <= words.length - left + 1; j++) walk(j, left - 1, [...acc, words.slice(i, j).join(' ')]);
    };
    walk(0, k, []);
  }
  return best.lines ?? words;
}
// Shrinks an element's font until wrapped text fits its own box height.
export function fitBox(e, maxH, min = 18) {
  let size = parseFloat(getComputedStyle(e).fontSize);
  while (e.scrollHeight > maxH && size > min) { size -= 2; e.style.fontSize = `${size}px`; }
  return size;
}

// ---- Brand marks
const kitCss = `
.wmark{display:inline-flex;align-items:center;position:relative;line-height:1;max-width:100%}
.wmark img{height:100%;width:auto;max-width:100%;object-fit:contain;display:block}
.wmark .wname{font-family:Montserrat;font-weight:800;letter-spacing:-.02em;white-space:nowrap;line-height:1}
.pcard{position:relative;overflow:hidden;box-sizing:border-box;display:block}
.pcard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.pcard .spine{position:absolute;left:0;top:0;bottom:0;background:var(--pc-accent)}
.pcard .pc-in{position:absolute;display:flex;flex-direction:column}
.pcard .pc-top{font-family:Montserrat;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pc-muted);white-space:nowrap;overflow:hidden}
.pcard .pc-title{font-family:Montserrat;font-weight:800;letter-spacing:-.02em;line-height:1.08;color:var(--pc-ink);overflow:hidden}
.pcard .pc-sub{font-family:In;font-weight:500;line-height:1.3;color:var(--pc-muted)}
.pcard .pc-rule{background:var(--pc-accent);border-radius:99px}
.pcard .pc-no{position:absolute;font-family:Montserrat;font-weight:800;color:var(--pc-ghost);line-height:.8;letter-spacing:-.04em}`;
function injectCss() {
  if (document.getElementById('kit-css')) return;
  const s = document.createElement('style');
  s.id = 'kit-css'; s.textContent = kitCss;
  document.head.append(s);
}

// The name as type, or BRAND.logo when there is one. A logo that fails to load falls back to the name (see settle).
export function wordmark(brand, { size = 48, color = 'currentColor' } = {}) {
  injectCss();
  const e = document.createElement('div');
  e.className = 'wmark';
  e.style.height = `${Math.round(size * 1.15)}px`;
  e.innerHTML = `<span class="wname" style="font-size:${size}px;color:${color}">${esc(brand.name)}</span>`;
  if (brand.logo) {
    const img = new Image();
    img.src = brand.logo; img.alt = '';
    img.dataset.replaces = 'name';
    e.firstChild.hidden = true;
    e.prepend(img);
  }
  return e;
}

// Fits a wordmark's name to a width. A logo image needs nothing: it keeps its own height.
export const fitMark = (mark, maxW, min = 22) => { const n = mark.querySelector('.wname'); if (n && !n.hidden) fit(n, maxW, min); };

// A product as a cover. Uses p.image when there is one; otherwise draws a tidy card from the title.
// tone: 'paper' (light card), 'dark' (brand bg card) or 'accent'.
export function productCard(p, brand, { w = 420, h = 560, tone = 'paper', index = null, radius = null } = {}) {
  injectCss();
  const c = brand.colors, k = w / 420;
  const skin = {
    paper: { bg: c.paper, ink: c.onPaper, muted: c.mutedPaper, accent: c.accent },
    dark: { bg: c.bg, ink: c.onBg, muted: c.mutedBg, accent: c.accent },
    accent: { bg: c.accent, ink: c.onAccent, muted: mix(c.onAccent, c.accent, .22), accent: c.onAccent },
  }[tone];
  const e = document.createElement('div');
  e.className = 'pcard';
  Object.assign(e.style, { width: `${w}px`, height: `${h}px`, background: skin.bg, borderRadius: `${radius ?? 26 * k}px` });
  e.style.setProperty('--pc-ink', skin.ink); e.style.setProperty('--pc-muted', skin.muted); e.style.setProperty('--pc-accent', skin.accent);
  e.style.setProperty('--pc-ghost', mix(skin.bg, skin.ink, .1));
  const pad = 40 * k, spine = 16 * k;
  e.innerHTML = `<div class="drawn"><div class="spine" style="width:${spine}px"></div>
    ${index === null ? '' : `<div class="pc-no" style="right:${22 * k}px;bottom:${26 * k}px;font-size:${210 * k}px">${index}</div>`}
    <div class="pc-in" style="left:${pad + spine}px;right:${pad * .8}px;top:${pad}px;bottom:${pad}px">
      <div class="pc-top" style="font-size:${17 * k}px">${esc(brand.name)}</div>
      <div class="pc-rule" style="width:${72 * k}px;height:${7 * k}px;margin:${24 * k}px 0 ${26 * k}px"></div>
      <div class="pc-title" style="font-size:${58 * k}px">${esc(p.title)}</div>
      ${p.sub ? `<div class="pc-sub" style="font-size:${25 * k}px;margin-top:${22 * k}px">${esc(p.sub)}</div>` : ''}
    </div></div>`;
  if (p.image) {
    const img = new Image();
    img.src = p.image; img.alt = '';
    e.firstChild.style.visibility = 'hidden';
    e.append(img);
  }
  return e;
}
// Run once a card is in the document, so the title can be measured.
export function settleCard(e) {
  const box = e.querySelector('.pc-in'), title = e.querySelector('.pc-title');
  if (!box || !title) return;
  const other = [...box.children].filter(x => x !== title).reduce((s, x) => s + x.offsetHeight + parseFloat(getComputedStyle(x).marginTop) + parseFloat(getComputedStyle(x).marginBottom), 0);
  title.style.maxHeight = `${box.clientHeight - other}px`;
  let size = fitBox(title, box.clientHeight - other, 20);
  while (title.scrollWidth > title.clientWidth && size > 20) { size -= 2; title.style.fontSize = `${size}px`; }   // one long word
}

// Waits for every image. One that fails is dropped, and what it covered comes back.
export async function settle(root = document) {
  await Promise.all([...root.querySelectorAll('img')].map(img => img.decode().catch(() => {
    const host = img.parentElement;
    host?.querySelectorAll('.drawn, .wname').forEach(x => { x.hidden = false; x.style.visibility = ''; });
    img.remove();
  })));
}

// Live preview outside the renderer. Pages set window.prepare and window.seek first.
export function preview() {
  if (location.search.includes('render')) return;
  window.prepare().then(({ dur }) => {
    const t0 = performance.now();
    const tick = async () => { await window.seek(((performance.now() - t0) / 1000) % dur); requestAnimationFrame(tick); };
    tick();
  });
}
