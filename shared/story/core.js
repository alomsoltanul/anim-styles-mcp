// Story engine, part 1: math, SVG helpers, keyframes, the time syntax and the item registry.
// Everything here is a plain function of its arguments, or of the shot being built or drawn (CUR).
export const NS = 'http://www.w3.org/2000/svg';
export const ITEMS = {};      // item kind -> (g, it) => optional update(lt). sets.js, cards.js and people.js fill this; scenes.js may add to it.
export let W = 1080, H = 1920, SPEC = null, CUR = null;
export const setSize = (w, h) => { W = w; H = h; };
export const setSpec = s => { SPEC = s; };
export const setCur = s => { CUR = s; };

export const stage = document.getElementById('stage') ?? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'stage' }));
stage.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><defs></defs></svg><div id="vig"></div><div id="grain"></div>');
export const DEFS = stage.querySelector('defs');
let UID = 0;

// ---------- utils
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const eio = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const back = t => { t = clamp(t); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const bn = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
export const uid = p => (p || 'u') + (++UID);
export const nextSeed = () => ++UID;
export const dsp = (el, on) => on ? el.removeAttribute('display') : el.setAttribute('display', 'none');
export function S(tag, a, p) { const e = document.createElementNS(NS, tag); if (a) for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
export function E(tag, cls, p, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (p) p.appendChild(e); return e; }
export function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
export function shade(h, a) { const c = hex2rgb(h), t = a < 0 ? 0 : 255, p = Math.abs(a); return '#' + c.map(v => Math.round(v + (t - v) * p).toString(16).padStart(2, '0')).join(''); }
export function lg(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units) {
  const id = uid('lg'), g = S('linearGradient', { id, x1, y1, x2, y2, gradientUnits: units }, DEFS);
  stops.forEach(([o, c, a]) => S('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, g)); return `url(#${id})`;
}
export function rg(stops, cx = .5, cy = .5, r = .5) {
  const id = uid('rg'), g = S('radialGradient', { id, cx, cy, r }, DEFS);
  stops.forEach(([o, c, a]) => S('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, g)); return `url(#${id})`;
}
export function patCheck(c1, c2, sz = 26, a = .4) {
  const id = uid('pc'), p = S('pattern', { id, width: sz, height: sz, patternUnits: 'userSpaceOnUse' }, DEFS);
  S('rect', { width: sz, height: sz, fill: c1 }, p); S('rect', { width: sz, height: sz * .3, fill: c2, opacity: a }, p); S('rect', { width: sz * .3, height: sz, fill: c2, opacity: a }, p);
  return `url(#${id})`;
}
export function patDots(bg, c, sz = 34, r = 3.2) {
  const id = uid('pd'), p = S('pattern', { id, width: sz, height: sz, patternUnits: 'userSpaceOnUse' }, DEFS);
  S('rect', { width: sz, height: sz, fill: bg }, p); S('circle', { cx: sz / 4, cy: sz / 4, r, fill: c }, p); S('circle', { cx: sz * .75, cy: sz * .75, r, fill: c }, p);
  return `url(#${id})`;
}
export const SHADOW = (() => { const f = S('filter', { id: 'ds', x: '-30%', y: '-30%', width: '160%', height: '160%' }, DEFS); S('feDropShadow', { dx: 0, dy: 10, stdDeviation: 12, 'flood-color': '#1a0f05', 'flood-opacity': .22 }, f); return 'url(#ds)'; })();

// keyframes: [[t, v...], ...] eased; a plain number/array is a constant. step(): last value whose time has passed.
export function kf(v, t) {
  if (v == null || !Array.isArray(v) || !Array.isArray(v[0])) return v;
  const val = k => k.length > 2 ? k.slice(1) : k[1];
  if (t <= v[0][0]) return val(v[0]);
  for (let i = 1; i < v.length; i++) if (t < v[i][0]) {
    const a = v[i - 1], b = v[i], p = eio((t - a[0]) / (b[0] - a[0]));
    if (a.length > 2) return a.slice(1).map((x, j) => lerp(x, b[j + 1], p));
    return typeof a[1] === 'number' ? lerp(a[1], b[1], p) : (p < .5 ? a[1] : b[1]);
  }
  return val(v.at(-1));
}
export function step(v, t, d) { if (v == null) return d; if (!Array.isArray(v) || !Array.isArray(v[0])) return v; let r = d; for (const k of v) if (t >= k[0]) r = k[1]; return r; }
export const inSpan = (spans, t) => !!spans && spans.some(([a, b]) => t >= a && t < b);

// ---------- time inside a shot: seconds, 'w12' (the 12th spoken word), '40%' of the shot, 'e-1' (1 s before its end)
export function T(v) {
  if (typeof v === 'number' || v == null) return v;
  if (Array.isArray(v)) return v.map(T);
  if (typeof v !== 'string') return v;
  if (v[0] === 'w') { const m = v.slice(1).split(/(?=[+-])/); return CUR.lead + Number(m[0]) / CUR.wps + (m[1] ? Number(m[1]) : 0); } // 'w6+.2' = .2 s after word 6; 'w0' = the line's first word
  if (v.endsWith('%')) return CUR.dur * Number(v.slice(0, -1)) / 100;
  if (v.startsWith('e')) return CUR.dur + Number(v.slice(1));
  return Number(v);
}
// convert every time field in an item (at, out, and the first entry of keyframe lists) once at build time
const TIMEKEYS = ['at', 'out'], LISTKEYS = ['expr', 'talk', 'pose', 'gaze', 'tilt', 'move', 'tears', 'sweat', 'speed', 'open', 'walk', 'eat', 'o', 'r', 'pedal'], SPANS = ['talk', 'tears', 'sweat', 'walk', 'pedal', 'eat'];
export function normTimes(it) {
  for (const k of TIMEKEYS) if (it[k] != null) it[k] = T(it[k]);
  for (const k of LISTKEYS) if (Array.isArray(it[k]) && Array.isArray(it[k][0])) it[k] = it[k].map(r => [T(r[0]), ...r.slice(1).map((x, j) => SPANS.includes(k) && j === 0 ? T(x) : x)]);
  return it;
}

// ---------- appear / disappear
export function appear(it, lt) {
  const at = it.at ?? 0, an = it.anim || (it.at != null ? 'pop' : 'none');
  let o = 1, s = 1, dx = 0, dy = 0, r = 0;
  const p = lt - at;
  if (p < 0) return { o: 0, s, dx, dy, r };
  if (an === 'pop') { s = lerp(.55, 1, back(p / .38)); o = clamp(p / .14); }
  else if (an === 'fade') o = clamp(p / .45);
  else if (an === 'drop') { dy = lerp(-90, 0, back(p / .45)); o = clamp(p / .15); }
  else if (an === 'up') { dy = lerp(70, 0, eo(p / .45)); o = clamp(p / .2); }
  else if (an === 'stamp') { s = lerp(2.3, 1, eo(p / .2)); o = clamp(p / .08); }
  else if (an === 'slideL') { dx = lerp(-700, 0, eo(p / .6)); }
  else if (an === 'slideR') { dx = lerp(700, 0, eo(p / .6)); }
  else if (an === 'swing') { r = lerp(-14, 0, back(p / .5)); o = clamp(p / .15); }
  if (it.out != null && lt > it.out) { const q = clamp((lt - it.out) / .3); o *= 1 - q; if (an === 'pop') s *= lerp(1, .85, q); }
  return { o, s, dx, dy, r };
}
