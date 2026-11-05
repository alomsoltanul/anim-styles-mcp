// Small helpers for scenes.js. They only build item objects, so a scene can always write the object out by hand.
import { H, W } from './core.js';

export const ICO = {
  gym: '<svg width="96" height="56" viewBox="-48 -28 96 56"><rect x="-30" y="-5" width="60" height="10" rx="4" fill="#5a5f66"/><rect x="-42" y="-22" width="14" height="44" rx="4" fill="#2a2219"/><rect x="28" y="-22" width="14" height="44" rx="4" fill="#2a2219"/><rect x="-48" y="-14" width="8" height="28" rx="3" fill="#2a2219"/><rect x="40" y="-14" width="8" height="28" rx="3" fill="#2a2219"/></svg>',
  diary: '<svg width="66" height="84" viewBox="0 0 66 84"><rect x="4" y="2" width="58" height="80" rx="8" fill="#3E7C78"/><rect x="4" y="2" width="12" height="80" rx="4" fill="#2c5c59"/><rect x="24" y="22" width="30" height="10" rx="3" fill="#FFF8E8"/><path d="M 44,2 L 44,30 L 50,24 L 56,30 L 56,2" fill="#D7263D"/></svg>',
  alarm: '<svg width="80" height="84" viewBox="-40 -44 80 84"><circle cx="-20" cy="-27" r="11" fill="#E9C46A"/><circle cx="20" cy="-27" r="11" fill="#E9C46A"/><circle r="31" fill="#D7263D"/><circle r="24" fill="#FFFDF7"/><path d="M 0,0 L 0,-17 M 0,0 L 10,8" stroke="#222" stroke-width="5" stroke-linecap="round"/><path d="M -16,26 L -24,38 M 16,26 L 24,38" stroke="#333" stroke-width="6" stroke-linecap="round"/></svg>',
  books: '<svg width="80" height="70" viewBox="0 0 80 70"><rect x="6" y="48" width="68" height="18" rx="3" fill="#D7263D"/><rect x="12" y="30" width="60" height="18" rx="3" fill="#2F6F9F"/><rect x="4" y="12" width="64" height="18" rx="3" fill="#E9A23B"/></svg>',
  cup: '<svg width="72" height="72" viewBox="-36 -36 72 72"><ellipse cy="28" rx="30" ry="7" fill="#fff" stroke="#c9c1b2" stroke-width="2"/><path d="M -22,-24 L 22,-24 L 16,26 L -16,26 Z" fill="#fff" stroke="#c9c1b2" stroke-width="2.5"/><ellipse cy="-24" rx="22" ry="6" fill="#9b5b2e"/><path d="M 21,-14 q 16,4 -2,24" stroke="#c9c1b2" stroke-width="4" fill="none"/></svg>',
  coin: '<svg width="72" height="72" viewBox="-36 -36 72 72"><circle r="32" fill="#E9C46A" stroke="#b8913a" stroke-width="4"/><circle r="22" fill="none" stroke="#b8913a" stroke-width="3"/></svg>',
  sun: '<svg width="88" height="60" viewBox="-44 -40 88 60"><circle cy="10" r="24" fill="#F2994A"/>' + [0, 1, 2, 3, 4].map(k => `<path d="M 0,-14 L 0,-32" stroke="#F2994A" stroke-width="6" stroke-linecap="round" transform="rotate(${-60 + k * 30},0,10)"/>`).join('') + '<rect x="-44" y="10" width="88" height="14" fill="#fff"/></svg>',
};
export const CARD = 'display:inline-flex;align-items:center;gap:22px;background:#FFF9EE;border-radius:26px;padding:18px 30px 24px;box-shadow:0 14px 30px rgba(30,18,6,.26);font-weight:700;font-size:46px;color:#2a2219;white-space:nowrap';

// A cast member: C('lena', x, y, scale, { pose, expr, ... }).
export const C = (id, x, y, s, o = {}) => ({ k: 'char', id, x, y, s, ...o });
// Dark label at the top left. *red* is not parsed here: use <span class="F">word</span>.
export const TAG = (html, at = .15, y = H > W ? 270 : 90) => ({ k: 'html', screen: true, x: W / 2, y, w: W - 120, html: `<div style="text-align:left"><span class="tag" data-at="${at}" data-anim="up">${html}</span></div>` });
// Faint name low in the frame, for a credit or a handle.
export const MARK = (text, y = H > W ? 1700 : H - 60) => ({ k: 'html', screen: true, x: W / 2, y, w: W - 200, html: `<div style="text-align:center;font:600 34px Montserrat;letter-spacing:1px;color:rgba(255,255,255,.6);text-shadow:0 1px 4px rgba(40,25,10,.5)">${text}</div>` });
// Cream card that pops in. inner is HTML, often ICO.cup + 'Two teas'.
export const card = (inner, at, x, y, rot = 0, w = 560) => ({ k: 'html', screen: true, at, anim: 'pop', x, y, w, r: rot, html: `<div style="text-align:center"><span style="${CARD}">${inner}</span></div>` });
// Burst of yellow rays, on from `at` to `out`.
export const SPARK = (at, out, x, y, s = 1) => ({ k: 'html', screen: true, at, out, x, y, s, w: 260, html: '<svg width="260" height="260" viewBox="-130 -130 260 260">' + [...Array(8)].map((_, k) => `<path d="M 0,-70 L 0,-118" stroke="#F2C94C" stroke-width="12" stroke-linecap="round" transform="rotate(${k * 45})"/>`).join('') + '</svg>' });
// World point to screen point under a camera [x, y, zoom], so a screen item can point at something in the set.
export const Z = (cam, x, y) => [W / 2 + (x - cam[0]) * cam[2], H / 2 + (y - cam[1]) * cam[2]];
export const MOUTH = (cam, x, y, s) => Z(cam, x, y - 300 * s);
// Speech bubble at screen point b whose tail reaches tip, usually MOUTH(...).
export function bub(text, at, b, tip, o = {}) { const v = [tip[0] - b[0], tip[1] - b[1]], L = Math.hypot(...v), k = Math.max(0, 1 - 125 / L); return { k: 'bubble', screen: true, text, at, x: b[0], y: b[1], tail: [v[0] * k, v[1] * k], ...o }; }
export const chip = (text, at, x, y, o = {}) => ({ k: 'chip', screen: true, text, at, x, y, ...o });
