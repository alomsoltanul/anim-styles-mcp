// Explainer engine: cream "investigative" graphics cut against a talking head. A page sets window.EXPLAINER = { scenes: [...] } and loads this as a module.
// window.prepare() -> { dur, cues }, window.seek(t) draws from t alone, so any frame can be rendered in any order.
// Text markup in every scene: *red*  {red + hand-drawn circle}  _accent script_  ~muted~  ==highlighter==  ##redacted##  | = new line
import { footage } from '../footage.js';

const Q = new URLSearchParams(location.search), RENDER = Q.has('render');
const SPEC = window.EXPLAINER;
const W = 1080, H = SPEC.h || 1920;
const C = { bg: '#F4F2EC', ink: '#151515', red: '#E1262C', muted: '#8E8A82', lgrey: '#D9D5CD', lred: '#F4BFC1', land: '#E0DDD5' };
const LOCALE = SPEC.locale || 'en-US';

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, d) => clamp((t - a) / d);
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eob = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = (n, dec = 0, group = true) => n.toLocaleString(LOCALE, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: group });
const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})`; };
const graphemes = s => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map(x => x.segment);
const seeded = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
function el(tag, cls, parent, style, text) {
  const e = document.createElement(tag); if (cls) e.className = cls; if (style) Object.assign(e.style, style);
  if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e;
}
function svgel(tag, attrs, parent) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e;
}
const fullColor = k => (k === 'red' || k === 'circ' || k === 'acc') ? C.red : k === 'mut' ? C.muted : C.ink;
const lightColor = k => (k === 'red' || k === 'circ' || k === 'acc') ? C.lred : C.lgrey;

// Markup -> word spans, plus groups for circles, highlights and redactions.
function rich(parent, src) {
  const words = [], groups = [];
  let line = el('div', 'ln', parent);
  for (const seg of String(src).split(/(\*[^*]+\*|\{[^}]+\}|_[^_]+_|~[^~]+~|==[^=]+==|##[^#]+##|\|)/)) {
    if (!seg) continue;
    if (seg === '|') { line = el('div', 'ln', parent); continue; }
    let kind = 'n', txt = seg;
    if (/^\*.+\*$/.test(seg)) { kind = 'red'; txt = seg.slice(1, -1); }
    else if (/^\{.+\}$/.test(seg)) { kind = 'circ'; txt = seg.slice(1, -1); }
    else if (/^_.+_$/.test(seg)) { kind = 'acc'; txt = seg.slice(1, -1); }
    else if (/^~.+~$/.test(seg)) { kind = 'mut'; txt = seg.slice(1, -1); }
    else if (/^==.+==$/.test(seg)) { kind = 'hl'; txt = seg.slice(2, -2); }
    else if (/^##.+##$/.test(seg)) { kind = 'rd'; txt = seg.slice(2, -2); }
    let host = line, g = null;
    if (kind === 'circ' || kind === 'hl' || kind === 'rd') { host = el('span', 'g g-' + kind, line); g = { kind, el: host, words: [] }; groups.push(g); }
    for (const p of txt.split(/(\s+)/)) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { host.appendChild(document.createTextNode(' ')); continue; }
      const w = el('span', 'w k-' + kind, host, null, p); w.dataset.kind = kind; words.push(w); if (g) g.words.push(w);
    }
  }
  return { words, groups };
}
const times = (n, start, step, at) => at && at.length ? at : Array.from({ length: n }, (_, i) => start + i * step);
function relRect(e, ref) { const a = e.getBoundingClientRect(), b = ref.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; }
// Shrinks a box of .ln lines until the widest line fits. Runs after the build, so long copy never leaves the frame.
function fitLines(box, max = W - 90) {
  const widest = Math.max(...[...box.querySelectorAll('.ln')].map(l => { l.style.display = 'inline-block'; const w = l.offsetWidth; l.style.display = ''; return w; }));
  if (widest > max) box.style.fontSize = parseFloat(getComputedStyle(box).fontSize) * max / widest + 'px';
}
function fitWidth(e, max) { const w = e.scrollWidth; if (w > max) e.style.fontSize = parseFloat(getComputedStyle(e).fontSize) * max / w + 'px'; }

// A hand-drawn marker loop around a rect, drawn with pathLength=1 dashes.
function scribble(r, seed = 1, padX = 16, padY = 8) {
  let s = seed * 7919 + 13; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rx = r.w / 2 + padX, ry = r.h / 2 + padY, a0 = -2.5 + rnd() * .5, tilt = (-4 + rnd() * 3) * Math.PI / 180, pts = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90, a = a0 + t * 2.22 * Math.PI, wob = 1 + .035 * Math.sin(t * 9 + seed) + (t > .82 ? .07 * (t - .82) / .18 : 0);
    const x = Math.cos(a) * rx * wob, y = Math.sin(a) * ry * wob;
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
}
function circles(host, groups, seed = 3) {
  if (!groups.length) return [];
  const svg = svgel('svg', { class: 'ov', width: host.offsetWidth || W, height: host.offsetHeight || H }, host);
  return groups.map((g, i) => ({ g, p: svgel('path', { d: scribble(relRect(g.el, host), seed + i), fill: 'none', stroke: C.red, 'stroke-width': 5.5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, svg) }));
}
const stroke = (p, k) => p.setAttribute('stroke-dashoffset', 1 - clamp(k));
function popWord(w, lt, tw) {
  const a = eo(prog(lt, tw, .22));
  w.style.opacity = a; w.style.transform = `translateY(${(1 - a) * 26}px)`;
  w.style.color = mix(lightColor(w.dataset.kind), fullColor(w.dataset.kind), prog(lt, tw + .12, .35));
}
function fillWord(w, lt, tw) { w.style.color = mix(lightColor(w.dataset.kind), fullColor(w.dataset.kind), eo(prog(lt, tw, .2))); }
function popIn(e, lt, at, from = .6, origin) {
  const k = prog(lt, at, .38); e.style.opacity = eo(k * 1.6);
  e.style.transform = (e.dataset.base || '') + ` scale(${lerp(from, 1, eob(k))})`; if (origin) e.style.transformOrigin = origin;
}
function tag(parent, text, x, y) { const t = el('div', 'tag', parent, { left: x + 'px', top: y + 'px' }); el('i', '', t); el('span', '', t, null, text); return t; }
function bgWord(parent, text, fit, bottom) { const e = el('div', 'bgword', parent, { fontSize: '100px', bottom: bottom + 'px' }, text); e.style.fontSize = 100 * W * fit / e.offsetWidth + 'px'; return e; }
function showBg(e, lt, at, dur) { if (!e) return; const k = eo(prog(lt, at, 1.0)); e.style.opacity = k * .085; e.style.transform = `translateX(-50%) scale(${1 + .05 * lt / dur})`; }

// ---------- scene types: update(s, lt, d, sc) ----------
// lt = seconds into the scene. sc.lq is the same clock held to 1/30 s: anything that steps, such as a counter, reads sc.lq so motion blur can't double-expose it.
const TYPES = {};

TYPES.title = {
  build(cam, d) {
    const s = {};
    if (d.bg) s.bg = bgWord(cam, d.bg, d.bg_fit || 1.0, H * .1);
    s.box = el('div', 'ab', cam, { left: '45px', right: '45px', top: H * (d.y || .45) + 'px', transform: 'translateY(-50%)', textAlign: 'center', fontSize: (d.size || 128) + 'px', fontWeight: 800, lineHeight: 1.3 });
    s.r = rich(s.box, d.text); fitLines(s.box);
    if (d.sub) { s.sub = el('div', 'ab', cam, { left: 0, right: 0, textAlign: 'center', fontSize: '46px', fontWeight: 600, color: C.muted }); s.sub.style.top = (s.box.offsetTop + s.box.offsetHeight / 2 + 30) + 'px'; s.subr = rich(s.sub, d.sub); fitLines(s.sub); }
    s.t = times(s.r.words.length, d.start ?? .25, d.step ?? .32, d.at);
    s.c = circles(cam, s.r.groups.filter(g => g.kind === 'circ'));
    if (s.subr) s.ts = times(s.subr.words.length, s.t.at(-1) + .4, d.step ?? .32, d.sub_at);
    return s;
  },
  update(s, lt, d, sc) {
    s.r.words.forEach((w, i) => popWord(w, lt, s.t[i]));
    if (s.subr) s.subr.words.forEach((w, i) => popWord(w, lt, s.ts[i]));
    s.c.forEach(c => stroke(c.p, eio(prog(lt, s.t[s.r.words.indexOf(c.g.words.at(-1))] + .35, .45))));
    showBg(s.bg, lt, d.bg_at ?? .8, sc.dur);
  }
};

TYPES.timeline = {
  build(cam, d) {
    const s = {}, lx = d.x || 540, len = H * (d.len || .58);
    s.line = el('div', 'ab', cam, { left: lx - 2 + 'px', top: 0, width: '4px', height: len + 'px', background: C.red, transformOrigin: '50% 0' });
    s.tags = (d.tags || []).map(t => { const e = tag(cam, t.t, lx - 23, 0); e.style.top = H * t.y - e.offsetHeight / 2 + 'px'; return e; });
    s.name = el('div', 'ab', cam, { left: '45px', right: '45px', top: len + 70 + 'px', textAlign: 'center', fontSize: (d.size || 84) + 'px', fontWeight: 800 });
    s.r = rich(s.name, d.name); fitLines(s.name);
    s.t = times(s.r.words.length, d.name_at ?? .15, .14);
    return s;
  },
  update(s, lt, d) {
    s.line.style.transform = `scaleY(${eio(prog(lt, 0, .7))})`;
    s.tags.forEach((e, i) => popIn(e, lt, d.tags[i].at ?? .4 + i * .6));
    s.r.words.forEach((w, i) => popWord(w, lt, s.t[i]));
  }
};

let arcIds = 0;
TYPES.map = {
  build(cam, d) {
    const s = {};
    const fc = topojson.feature(WORLD, WORLD.objects.countries);
    const pad = d.pad ?? 150, proj = d3.geoMercator().fitExtent([[pad, H * (d.top ?? .3)], [W - pad, H * (d.bottom ?? .68)]], { type: 'MultiPoint', coordinates: d.fit });
    const path = d3.geoPath(proj);
    s.wrap = el('div', 'ab', cam, { left: 0, top: 0, width: W + 'px', height: H + 'px' });
    const svg = svgel('svg', { class: 'ov', width: W, height: H }, s.wrap), g = svgel('g', {}, svg);
    s.paths = {};
    for (const f of fc.features) { const p = path(f); if (p) s.paths[f.id] = s.paths[f.properties.name] = svgel('path', { d: p, fill: C.land, stroke: C.bg, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, g); }
    s.hl = (d.hl || []).map(h => { const e = s.paths[h.id ?? h.name]; if (!e) console.error(`map: no country "${h.id ?? h.name}"`); return { e, to: h.color === 'red' ? C.red : '#2A2A2A', at: h.at ?? .2 }; });
    s.hl.forEach(h => h.e && g.appendChild(h.e)); // highlighted countries on top so borders stay crisp
    const top = svgel('g', {}, svg);
    if (d.arc) {
      const A = proj(d.arc.from), B = proj(d.arc.to), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
      let px = -dy / L, py = dx / L; if (py > 0) { px = -px; py = -py; }
      const k = (d.arc.bend ?? .28) * L, cx = (A[0] + B[0]) / 2 + px * k, cy = (A[1] + B[1]) / 2 + py * k, pd = `M${A}Q${cx},${cy} ${B}`;
      const m = svgel('mask', { id: 'arcm' + arcIds++ }, svgel('defs', {}, svg));
      s.reveal = svgel('path', { d: pd, fill: 'none', stroke: '#fff', 'stroke-width': 14, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, m);
      s.arc = svgel('path', { d: pd, fill: 'none', stroke: C.red, 'stroke-width': 5, 'stroke-dasharray': '16 12', 'stroke-linecap': 'round', mask: `url(#${m.id})` }, top);
      s.arcLen = s.arc.getTotalLength();
      s.dot = svgel('circle', { r: 11, fill: C.red, stroke: '#fff', 'stroke-width': 4, opacity: 0 }, top);
      cam.style.transformOrigin = `${cx}px ${(A[1] + B[1]) / 2}px`;
    }
    s.pins = (d.pins || []).map(p => {
      const [x, y] = proj(p.ll), c = svgel('circle', { cx: x, cy: y, r: 9, fill: '#fff', stroke: C.red, 'stroke-width': 4.5 }, top);
      const t = tag(s.wrap, p.label, 0, 0); t.style.transformOrigin = 'left center';
      if (p.side === 'left') { t.style.left = x - t.offsetWidth - 20 + 'px'; t.style.transformOrigin = 'right center'; } else t.style.left = x + 20 + 'px';
      t.style.top = y - t.offsetHeight / 2 + (p.dy || 0) + 'px';
      return { c, t, at: p.at ?? .5 };
    });
    if (d.title) { s.title = el('div', 'box', cam); rich(s.title, d.title); fitWidth(s.title, W - 90); s.title.style.left = (W - s.title.offsetWidth) / 2 + 'px'; s.title.style.top = H * .14 + 'px'; }
    if (d.counter) { s.cnt = el('div', 'box', cam, { color: 'var(--red2,#FF3B40)' }, fmt(d.counter.to) + (d.counter.suffix || '')); s.cnt.style.top = H * .74 + 'px'; s.cntW = s.cnt.offsetWidth; }
    sourceLine(cam, d.source);
    return s;
  },
  update(s, lt, d, sc) {
    s.wrap.style.transform = `scale(${lerp(1, d.zoom ?? 1.07, eio(lt / sc.dur))})`; s.wrap.style.transformOrigin = sc.cam.style.transformOrigin;
    s.hl.forEach(h => h.e && h.e.setAttribute('fill', mix(C.land, h.to, eo(prog(lt, h.at, .5)))));
    s.pins.forEach(p => { const k = eob(prog(lt, p.at, .35)); p.c.setAttribute('r', 9 * clamp(k, 0, 2)); popIn(p.t, lt, p.at + .08); });
    if (s.arc) {
      const k = eio(prog(lt, d.arc.at ?? 1, d.arc.dur ?? 1.8));
      s.reveal.setAttribute('stroke-dashoffset', 1 - k);
      const pt = s.arc.getPointAtLength(k * s.arcLen); s.dot.setAttribute('cx', pt.x); s.dot.setAttribute('cy', pt.y); s.dot.setAttribute('opacity', k > 0 ? 1 : 0);
    }
    if (s.title) { s.title.dataset.base = ''; popIn(s.title, lt, d.title_at ?? .1, .85); }
    if (s.cnt) {
      const c = d.counter, k = eio(prog(sc.lq, c.at ?? 1, c.dur ?? 1.8));
      s.cnt.textContent = fmt(lerp(c.from ?? 0, c.to, k)) + (c.suffix || ''); s.cnt.style.left = (W - s.cntW) / 2 + 'px'; s.cnt.style.minWidth = s.cntW - 48 + 'px'; s.cnt.style.textAlign = 'center';
      popIn(s.cnt, lt, (c.at ?? 1) - .25, .85);
    }
  }
};

// A calendar page, and a clock when `time` is given. Without a time the page sits in the middle with the label under it.
TYPES.calendar = {
  build(cam, d) {
    const s = {}, cy = H * (d.y || .45), left = d.time ? 100 : 370;
    s.cal = el('div', 'cal', cam, { left: left + 'px', top: cy - 192 + 'px' });
    el('div', 'calh', s.cal, null, d.month); el('div', 'cald', s.cal, null, d.day); el('div', 'calw', s.cal, null, d.weekday);
    const R = 190;
    if (d.time) {
      const svg = svgel('svg', { class: 'ov', width: 2 * R + 20, height: 2 * R + 20, viewBox: `${-R - 10} ${-R - 10} ${2 * R + 20} ${2 * R + 20}` }, cam);
      Object.assign(svg.style, { left: 770 - R - 10 + 'px', top: cy - R - 10 + 'px', transformOrigin: '50% 50%' }); s.clock = svg;
      svgel('circle', { r: R - 6, fill: '#fff', stroke: C.ink, 'stroke-width': 10 }, svg);
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, l = i % 3 ? 14 : 26; svgel('line', { x1: Math.sin(a) * (R - 22), y1: -Math.cos(a) * (R - 22), x2: Math.sin(a) * (R - 22 - l), y2: -Math.cos(a) * (R - 22 - l), stroke: C.ink, 'stroke-width': i % 3 ? 4 : 7, 'stroke-linecap': 'round' }, svg); }
      s.hh = svgel('line', { x1: 0, y1: 16, x2: 0, y2: -88, stroke: C.ink, 'stroke-width': 13, 'stroke-linecap': 'round' }, svg);
      s.mh = svgel('line', { x1: 0, y1: 22, x2: 0, y2: -138, stroke: C.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
      svgel('circle', { r: 11, fill: C.ink }, svg);
    }
    s.lab = el('div', 'ab', cam, d.time ? { left: 770 - 300 + 'px', width: '600px', top: cy + R + 36 + 'px', textAlign: 'center', fontSize: '58px', fontWeight: 700 } : { left: '45px', right: '45px', top: cy + 240 + 'px', textAlign: 'center', fontSize: '58px', fontWeight: 700 });
    s.lr = rich(s.lab, d.label || ''); fitLines(s.lab, d.time ? 590 : W - 90);
    return s;
  },
  update(s, lt, d) {
    const k = prog(lt, .05, .55);
    s.cal.style.opacity = eo(k * 1.8); s.cal.style.transform = `translateY(${(1 - eob(k)) * -70}px) rotate(${lerp(-10, -3, eob(k))}deg)`;
    if (s.clock) {
      s.clock.style.opacity = eo(prog(lt, .3, .3)); s.clock.style.transform = `scale(${lerp(.6, 1, eob(prog(lt, .3, .4)))})`;
      const mins = (d.time[0] % 12) * 60 + d.time[1], m = mins * eio(prog(lt, .55, d.spin ?? 1.5));
      s.hh.setAttribute('transform', `rotate(${m / 2})`); s.mh.setAttribute('transform', `rotate(${m * 6})`);
    }
    s.lr.words.forEach((w, i) => popWord(w, lt, (d.label_at ?? (d.time ? 1.9 : .8)) + i * .15));
  }
};

TYPES.clipping = {
  build(cam, d) {
    const s = {};
    el('div', 'paper', cam);
    s.doc = el('div', 'ab doc', cam, { left: '95px', width: '890px', transformOrigin: '50% 40%' });
    el('div', 'mast', s.doc, null, d.paper);
    el('div', 'dline', s.doc, null, d.date || '');
    const all = [];
    const h = el('div', 'head', s.doc); all.push(...rich(h, d.head).groups);
    for (const p of d.body || []) all.push(...rich(el('p', 'body', s.doc), p).groups);
    s.marks = all;
    s.t = times(all.length, d.start ?? 1.0, d.step ?? .7, d.at);
    s.c = circles(s.doc, all.filter(g => g.kind === 'circ'), 7);
    s.doc.style.top = (d.top != null ? H * d.top : (H - s.doc.offsetHeight) / 2 - 30) + 'px';
    el('div', 'vig', cam);
    return s;
  },
  update(s, lt, d, sc) {
    const c = d.cam || {}, k = eio(lt / sc.dur);
    s.doc.style.transform = `translate(${lerp(c.x0 ?? 0, c.x1 ?? -10, k)}px,${lerp(c.y0 ?? 30, c.y1 ?? -50, k)}px) scale(${lerp(c.s0 ?? .96, c.s1 ?? 1.06, k)})`;
    s.doc.style.filter = `blur(${lerp(10, 0, eo(prog(lt, 0, .8))).toFixed(2)}px)`;
    s.marks.forEach((g, i) => {
      const p = eo(prog(lt, s.t[i], .45));
      if (g.kind === 'hl') g.el.style.backgroundSize = `${p * 100}% 80%`;
      if (g.kind === 'rd') { g.el.style.backgroundSize = `${p * 100}% 84%`; g.words.forEach(w => w.style.color = mix('#2B251B', '#141414', p)); }
      if (g.kind === 'circ') { const cc = s.c.find(x => x.g === g); stroke(cc.p, eio(prog(lt, s.t[i], .5))); }
    });
  }
};

TYPES.stat = {
  build(cam, d) {
    const s = {}, SZ = { xl: 150, l: 92, m: 54, s: 36 }, COL = { red: C.red, ink: C.ink, grey: C.muted, alarm: '#E1262C' }; // alarm stays red under any accent
    s.box = el('div', 'ab', cam, { left: 0, right: 0, top: H * (d.y || .46) + 'px', transform: 'translateY(-50%)', textAlign: 'center' });
    s.rows = d.rows.map((row, ri) => {
      const r = el('div', '', s.box, { display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '18px', lineHeight: 1.12, marginTop: (row.gap ?? (ri ? 10 : 0)) + 'px' });
      const segs = (row.segs || row).map(sg => {
        const e = el('span', '', r, { fontSize: SZ[sg.s || 'm'] + 'px', fontWeight: sg.s === 'xl' || sg.s === 'l' ? 800 : 700, color: COL[sg.c || 'ink'] });
        e.textContent = sg.count != null ? (sg.pre || '') + fmt(sg.count, sg.dec) + (sg.post || '') : sg.t; return { e, sg };
      });
      return { r, segs };
    });
    sourceLine(cam, d.source, .86);
    return s;
  },
  update(s, lt, d, sc) {
    s.rows.forEach((row, i) => {
      const at = d.at ? d.at[i] : .2 + i * .45, k = eo(prog(lt, at, .4));
      row.r.style.opacity = k; row.r.style.transform = `translateY(${(1 - k) * 30}px)`;
      row.segs.forEach(({ e, sg }) => { if (sg.count != null) e.textContent = (sg.pre || '') + fmt(sg.count * eo(prog(sc.lq, at, sg.dur ?? .9)), sg.dec) + (sg.post || ''); });
    });
  }
};

TYPES.quote = {
  build(cam, d) {
    const s = {}, top = H * (d.top ?? .3);
    if (d.bg) s.bg = bgWord(cam, d.bg, d.bg_fit || 1.0, H * .12);
    if (d.tag) { s.tag = tag(cam, d.tag, 0, top - 110); s.tag.style.left = W - 110 - s.tag.offsetWidth + 'px'; }
    s.qm = el('div', 'ab', cam, { left: '92px', top: top - 120 + 'px', fontFamily: 'Montserrat', fontWeight: 900, fontSize: '230px', lineHeight: 1, color: C.red, transformOrigin: '20% 60%' }, '“');
    s.box = el('div', 'ab', cam, { left: '110px', right: '70px', top: top + 40 + 'px', fontSize: (d.size || 76) + 'px', fontWeight: 800, lineHeight: 1.4 });
    s.r = rich(s.box, d.text); fitLines(s.box, W - 180);
    s.r.words.forEach(w => w.style.color = lightColor(w.dataset.kind));
    s.t = times(s.r.words.length, d.start ?? .55, d.step ?? .26, d.at);
    sourceLine(cam, d.source, .86);
    return s;
  },
  update(s, lt, d, sc) {
    s.box.style.opacity = eo(prog(lt, .1, .35));
    s.qm.style.opacity = eo(prog(lt, 0, .25)); s.qm.style.transform = `scale(${lerp(.5, 1, eob(prog(lt, 0, .4)))})`;
    if (s.tag) popIn(s.tag, lt, .25);
    s.r.words.forEach((w, i) => fillWord(w, lt, s.t[i]));
    showBg(s.bg, lt, d.bg_at ?? s.t.at(-1) + .3, sc.dur);
  }
};

TYPES.sheet = {
  build(cam, d) {
    const s = {}, cols = d.cols || [430, 400], top = H * (d.y ?? .36);
    if (d.top) { s.top = el('div', 'ab', cam, { left: '45px', right: '45px', top: top - 120 + 'px', textAlign: 'center', fontSize: '58px', fontWeight: 700 }); s.tr = rich(s.top, d.top); fitLines(s.top); }
    const wnd = el('div', 'xl', cam, { left: (W - 64 - cols.reduce((a, b) => a + b)) / 2 + 'px', top: top + 'px' }); s.wnd = wnd;
    const tb = el('div', 'xlt', wnd, null, d.title || 'data.xlsx');
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => el('i', '', tb, { left: 20 + i * 24 + 'px', background: c }));
    const fx = el('div', 'xlf', wnd); el('b', '', fx, null, 'fx'); s.fx = el('span', '', fx);
    const g = el('div', 'xlg', wnd, { gridTemplateColumns: `64px ${cols.map(c => c + 'px').join(' ')}` });
    el('div', 'hd', g); cols.forEach((_, i) => el('div', 'hd', g, null, 'ABCDEFG'[i]));
    const rows = [d.head, ...d.rows]; s.cells = [];
    rows.forEach((row, ri) => { el('div', 'rn', g, null, String(ri + 1)); row.forEach((txt, ci) => { const e = el('div', '', g); s.cells.push({ e, txt: String(txt), red: ri > 0 && (d.red || []).includes(ci), g: graphemes(String(txt)) }); }); });
    let t = d.start ?? .7; for (const c of s.cells) { c.t0 = t; c.t1 = t + Math.max(.18, c.g.length * (d.cps ?? .055)); t = c.t1 + (d.gap ?? .18); }
    return s;
  },
  update(s, lt, d, sc) {
    const k = eo(prog(lt, .05, .45)); s.wnd.style.opacity = k; s.wnd.style.transform = `translateY(${(1 - k) * 40}px)`;
    if (s.tr) s.tr.words.forEach((w, i) => popWord(w, lt, .15 + i * .18));
    let cur = null;
    for (const c of s.cells) {
      const n = Math.round(c.g.length * prog(sc.lq, c.t0, c.t1 - c.t0)); c.e.textContent = c.g.slice(0, n).join('');
      const done = prog(lt, c.t1, .25);
      c.e.style.background = c.red ? mix('#FFFFFF', '#F9D7D7', done) : ''; c.e.style.color = c.red ? mix(C.ink, C.red, done) : C.ink;
      c.e.style.fontWeight = c.red ? 700 : 500;
      if (sc.lq >= c.t0) cur = c;
    }
    s.cells.forEach(c => c.e.classList.toggle('cur', c === cur));
    s.fx.textContent = cur ? cur.e.textContent : '';
  }
};

TYPES.end = {
  build(cam, d) {
    const s = {}; cam.parentNode.classList.add('end'); cam.parentNode.style.background = '#000';
    s.t = el('div', 'endt', cam, { top: H * .45 - 100 + 'px' });
    s.ch = graphemes(d.text || 'SHARE').map(ch => el('span', '', s.t, null, ch));
    fitWidth(s.t, W);
    s.u = el('div', 'ab', cam, { height: '7px', background: '#fff', transformOrigin: '0 50%' });
    s.u.style.left = s.t.firstChild.offsetLeft + 'px'; s.u.style.width = s.t.offsetWidth - 2 * s.t.firstChild.offsetLeft + 'px'; s.u.style.top = H * .45 + 95 + 'px';
    return s;
  },
  update(s, lt) {
    s.ch.forEach((e, i) => { const k = prog(lt, .1 + i * .07, .35); e.style.opacity = eo(k * 1.5); e.style.transform = `translateY(${(1 - eob(k)) * -60}px)`; e.style.filter = `blur(${(1 - eo(k)) * 10}px)`; });
    s.u.style.transform = `scaleX(${eio(prog(lt, .1 + s.ch.length * .07 + .1, .45))})`;
  }
};

const IMG = {}; // preloaded images: path -> {w,h}
function icon(g, kind, x, y, s, fill, attrs = {}) {
  const grp = svgel('g', attrs, g);
  if (kind === 'house') {
    svgel('path', { d: `M${x - .5 * s},${y - .02 * s}L${x},${y - .5 * s}L${x + .5 * s},${y - .02 * s}Z`, fill }, grp);
    svgel('rect', { x: x - .37 * s, y: y - .08 * s, width: .74 * s, height: .55 * s, fill }, grp);
    svgel('rect', { x: x + .06 * s, y: y + .16 * s, width: .16 * s, height: .31 * s, fill: C.bg, opacity: .5 }, grp);
  } else {
    svgel('circle', { cx: x, cy: y - .3 * s, r: .19 * s, fill }, grp);
    svgel('path', { d: `M${x - .3 * s},${y + .5 * s}V${y + .06 * s}Q${x - .3 * s},${y - .08 * s} ${x - .15 * s},${y - .08 * s}H${x + .15 * s}Q${x + .3 * s},${y - .08 * s} ${x + .3 * s},${y + .06 * s}V${y + .5 * s}Z`, fill }, grp);
  }
  return grp;
}
function sourceLine(cam, text, y = .9) { if (text) el('div', 'ab', cam, { left: '40px', right: '40px', top: H * y + 'px', textAlign: 'center', fontSize: '28px', color: '#7C776E' }, text); }
function title(cam, text, y, size = 60) { if (!text) return null; const e = el('div', 'ab', cam, { left: '40px', right: '40px', top: H * y + 'px', textAlign: 'center', fontSize: size + 'px', fontWeight: 800 }); const r = rich(e, text); fitLines(e, W - 80); return r; }

// A real article screenshot (img + boxes in image px) or a mock web article (markup ==hl== {circle} ##redact##).
TYPES.article = {
  build(cam, d, sc) {
    const s = {}; sc.root.style.background = d.bg || '#E8E5DE';
    s.card = el('div', 'art', cam, { left: '50px', width: '980px' });
    let groups = [];
    if (d.img) {
      const im = el('img', '', s.card, { display: 'block', width: '980px', height: 980 * IMG[d.img].h / IMG[d.img].w + 'px' }); im.src = d.img;
      const k = 980 / IMG[d.img].w;
      groups = (d.boxes || []).map(b => ({ kind: b.kind || 'hl', el: el('div', '', s.card, { position: 'absolute', left: b.x * k + 'px', top: b.y * k + 'px', width: b.w * k + 'px', height: b.h * k + 'px', mixBlendMode: 'multiply', backgroundRepeat: 'no-repeat', backgroundSize: '0% 100%', backgroundImage: `linear-gradient(${b.kind === 'red' ? 'rgba(226,38,44,.55)' : 'rgba(255,214,0,.75)'},${b.kind === 'red' ? 'rgba(226,38,44,.55)' : 'rgba(255,214,0,.75)'})` }) }));
      groups.forEach(g => { if (g.kind === 'ul') Object.assign(g.el.style, { mixBlendMode: 'normal', backgroundImage: 'linear-gradient(#FFD21F,#FFD21F)', backgroundPosition: '0 100%' }); }); // underline for dark pages: multiply vanishes on black
    } else {
      el('div', 'logo', s.card, null, d.paper || 'Sample News');
      el('div', 'nav', s.card, null, d.nav || 'Home World Business Science Opinion');
      groups.push(...rich(el('div', 'ah', s.card), d.head).groups);
      el('div', 'by', s.card, null, d.by || '');
      for (const p of d.body || []) groups.push(...rich(el('p', 'ap', s.card), p).groups);
      if (d.color !== 'red') groups.filter(g => g.kind === 'hl').forEach(g => g.el.classList.add('yel'));
    }
    const ch = s.card.offsetHeight; s.card.style.top = Math.max(H * .1, (H - ch) / 2) + 'px';
    s.marks = groups; s.t = times(groups.length, d.start ?? .9, d.step ?? .8, d.at);
    s.c = circles(s.card, groups.filter(g => g.kind === 'circ'), 5);
    const f = groups[0] ? relRect(groups[0].el, s.card) : { x: 490, y: ch / 2, w: 0, h: 0 };
    s.card.style.transformOrigin = `${f.x + f.w / 2}px ${f.y + f.h / 2}px`;
    if (d.trans) { s.trans = el('div', 'box', cam, { whiteSpace: 'normal', textAlign: 'center', fontSize: '48px', left: '70px', right: '70px' }); rich(s.trans, d.trans); s.trans.style.top = s.card.offsetTop + f.y + f.h / 2 + (ch - f.y - f.h / 2) * Math.max(d.s0 ?? 1, d.s1 ?? 1.12) + 60 + 'px'; } // a translated line under a foreign source, below the zoomed card
    sourceLine(cam, d.source, .93);
    return s;
  },
  update(s, lt, d, sc) {
    const k = eio(lt / sc.dur);
    s.card.style.transform = `translateY(${(1 - eo(prog(lt, 0, .5))) * 60}px) scale(${lerp(d.s0 ?? 1, d.s1 ?? 1.12, k)})`;
    s.card.style.opacity = eo(prog(lt, 0, .35));
    s.marks.forEach((g, i) => {
      const p = eo(prog(lt, s.t[i], .5));
      if (g.kind === 'circ') { const cc = s.c.find(x => x.g === g); if (cc) stroke(cc.p, eio(prog(lt, s.t[i], .5))); }
      else g.el.style.backgroundSize = `${p * 100}% ${g.kind === 'ul' ? 10 : g.el.classList.contains('g') ? 80 : 100}%`;
    });
    if (s.trans) popIn(s.trans, lt, d.trans_at ?? (s.t.at(-1) ?? .9) + .5, .85);
  }
};

// Line or bar chart with a highlight bar and a callout tag.
TYPES.chart = {
  build(cam, d) {
    const s = {}; s.tr = title(cam, d.title, .17, 62);
    const x0 = 130, x1 = 960, y0 = H * (d.top ?? .3), y1 = H * (d.bottom ?? .66), n = d.values.length;
    const max = d.max ?? Math.max(...d.values) * (d.kind === 'bar' ? 1.18 : 1.06), min = d.min ?? (d.kind === 'bar' ? 0 : Math.min(...d.values) * .9), Y = v => y1 - (y1 - y0) * (v - min) / (max - min), X = i => x0 + (x1 - x0) * (n === 1 ? .5 : (d.kind === 'bar' ? (i + .5) / n : i / (n - 1)));
    const svg = svgel('svg', { class: 'ov', width: W, height: H }, cam);
    svgel('line', { x1: x0 - 20, x2: x1 + 20, y1, y2: y1, stroke: '#BDB8AE', 'stroke-width': 3 }, svg);
    s.vals = []; s.bars = [];
    d.labels.forEach((l, i) => el('div', 'ab', cam, { left: X(i) - 90 + 'px', width: '180px', top: y1 + 18 + 'px', textAlign: 'center', fontSize: '30px', fontWeight: 600, color: C.muted }, l));
    const fmtv = v => (d.pre || '') + fmt(v, d.dec) + (d.post || '');
    if (d.kind === 'bar') {
      const bw = (x1 - x0) / n * .58;
      d.values.forEach((v, i) => {
        s.bars.push({ r: svgel('rect', { x: X(i) - bw / 2, width: bw, y: y1, height: 0, rx: 6, fill: i === d.hl ? C.red : '#262626' }, svg), v, h: y1 - Y(v) });
        s.vals.push({ e: el('div', 'ab', cam, { left: X(i) - 120 + 'px', width: '240px', textAlign: 'center', fontSize: '40px', fontWeight: 800, color: i === d.hl ? C.red : C.ink }), v, y: Y(v) - 62 });
      });
    } else {
      const pts = d.values.map((v, i) => [X(i), Y(v)]);
      s.line = svgel('path', { d: 'M' + pts.map(p => p.join(',')).join('L'), fill: 'none', stroke: C.red, 'stroke-width': 7, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, svg);
      s.len = s.line.getTotalLength(); s.pts = pts;
      s.dot = svgel('circle', { r: 12, fill: C.red, stroke: '#fff', 'stroke-width': 4 }, svg);
      d.values.forEach((v, i) => s.vals.push({ e: el('div', 'ab', cam, { left: pts[i][0] - 120 + 'px', width: '240px', textAlign: 'center', fontSize: '36px', fontWeight: 800, color: i === n - 1 ? C.red : C.ink }), v, y: pts[i][1] - 66, show: d.show ? d.show.includes(i) : i === 0 || i === n - 1 || i === d.hl }));
    }
    s.vals.forEach(o => { o.e.style.top = o.y + 'px'; o.f = fmtv; });
    if (d.note) { const i = d.note.i ?? n - 1; s.note = tag(cam, d.note.t, 0, 0); s.note.style.left = Math.max(40, Math.min(W - 40 - s.note.offsetWidth, X(i) + 30)) + 'px'; s.note.style.top = Y(d.values[i]) - 150 + 'px'; }
    sourceLine(cam, d.source);
    return s;
  },
  update(s, lt, d, sc) {
    if (s.tr) s.tr.words.forEach((w, i) => popWord(w, lt, .1 + i * .15));
    const a = d.at ?? .6, n = d.values.length;
    if (s.bars.length) s.bars.forEach((b, i) => { const k = eo(prog(lt, a + i * (d.stagger ?? .18), .6)), kq = eo(prog(sc.lq, a + i * (d.stagger ?? .18), .6)); b.r.setAttribute('height', b.h * k); b.r.setAttribute('y', H * (d.bottom ?? .66) - b.h * k);
      const o = s.vals[i]; o.e.textContent = o.f(o.v * kq); o.e.style.opacity = k > .02 ? 1 : 0; o.e.style.top = H * (d.bottom ?? .66) - b.h * k - 62 + 'px'; });
    else {
      const k = eio(prog(lt, a, d.draw ?? 1.8)); s.line.setAttribute('stroke-dashoffset', 1 - k);
      const p = s.line.getPointAtLength(k * s.len); s.dot.setAttribute('cx', p.x); s.dot.setAttribute('cy', p.y); s.dot.setAttribute('opacity', k > 0 ? 1 : 0);
      s.vals.forEach((o, i) => { const kk = eo(prog(lt, a + (d.draw ?? 1.8) * (n === 1 ? 1 : i / (n - 1)) - .05, .3)); o.e.textContent = o.f(o.v); o.e.style.opacity = o.show ? kk : 0; });
    }
    if (s.note) popIn(s.note, lt, d.note.at ?? a + (d.draw ?? 1.8));
  }
};

// Two people or two options side by side: rows of figures, counted totals, a difference box.
TYPES.compare = {
  build(cam, d) {
    const s = { cols: [] }, top = H * (d.top ?? .22);
    el('div', 'ab', cam, { left: '538px', top: top + 'px', width: '4px', height: 470 + Math.max(d.left.rows.length, d.right.rows.length) * 68 + 'px', background: '#D6D1C7' });
    [d.left, d.right].forEach((c, ci) => {
      const cx = ci ? 795 : 285, col = { c, els: [] };
      const svg = svgel('svg', { class: 'ov', width: W, height: H }, cam);
      col.icon = icon(svg, c.icon || 'person', cx, top + 210, 190, ci ? C.red : '#242424');
      col.icon.style.transformOrigin = `${cx}px ${top + 300}px`;
      col.name = tag(cam, c.name, 0, top + 330); col.name.style.left = cx - col.name.offsetWidth / 2 + 'px';
      if (c.say) { col.bub = el('div', 'bub', cam, null, c.say); fitWidth(col.bub, 440); col.bub.style.left = Math.min(cx - 70, W - 30 - col.bub.offsetWidth) + 'px'; col.bub.style.top = top - 20 + 'px'; col.bub.style.transformOrigin = '40px 100%'; }
      col.rows = (c.rows || []).map(([k, v], ri) => {
        const r = el('div', 'ab', cam, { left: cx - 215 + 'px', width: '430px', top: top + 440 + ri * 68 + 'px', display: 'flex', justifyContent: 'space-between', fontSize: '36px' });
        el('span', '', r, { color: C.muted, fontWeight: 600 }, k); el('span', '', r, { fontWeight: 800 }, v); return r;
      });
      col.tot = el('div', 'ab', cam, { left: cx - 215 + 'px', width: '430px', top: top + 450 + col.rows.length * 68 + 'px', display: 'flex', justifyContent: 'space-between', fontSize: '48px', fontWeight: 800, borderTop: '3px solid #151515', paddingTop: '10px', color: ci ? C.red : C.ink });
      el('span', '', col.tot, null, c.total_label || 'Total'); col.totv = el('span', '', col.tot, null, (d.pre || '') + fmt(c.total, d.dec) + (d.post || ''));
      s.cols.push(col);
    });
    if (d.diff) { s.diff = el('div', 'box', cam); rich(s.diff, d.diff); fitWidth(s.diff, W - 90); s.diff.style.left = (W - s.diff.offsetWidth) / 2 + 'px'; s.diff.style.top = H * (d.diff_y ?? .74) + 'px'; }
    sourceLine(cam, d.source);
    return s;
  },
  update(s, lt, d, sc) {
    s.cols.forEach((col, ci) => {
      const a = (d.at || [.2, 1.0])[ci], k = eob(prog(lt, a, .45));
      col.icon.style.opacity = eo(prog(lt, a, .25)); col.icon.style.transform = `scale(${lerp(.4, 1, k)})`;
      popIn(col.name, lt, a + .15); if (col.bub) popIn(col.bub, lt, a + .3, .3);
      col.rows.forEach((r, ri) => { const kk = eo(prog(lt, a + .45 + ri * .15, .3)); r.style.opacity = kk; r.style.transform = `translateX(${(1 - kk) * (ci ? 40 : -40)}px)`; });
      const tk = prog(lt, a + .5 + col.rows.length * .15, .7), tq = prog(sc.lq, a + .5 + col.rows.length * .15, .7); col.tot.style.opacity = eo(tk * 2); col.totv.textContent = (d.pre || '') + fmt(col.c.total * eo(tq), d.dec) + (d.post || '');
    });
    if (s.diff) popIn(s.diff, lt, d.diff_at ?? 2.6, .8);
  }
};

TYPES.chapter = {
  build(cam, d, sc) {
    const s = {}, dark = d.bg === 'dark', wood = d.bg === 'wood';
    if (dark) sc.root.style.background = '#121212';
    if (wood) sc.root.style.background = 'radial-gradient(ellipse at 50% 40%,#D9A35E 0%,#B37A3C 55%,#7A4E22 100%)';
    if (d.n) s.n = el('div', 'chap-n', cam, { top: H * .3 + 'px' }, d.n);
    s.box = el('div', 'ab', cam, { left: '40px', right: '40px', top: H * .43 + 'px', textAlign: 'center', fontSize: (d.size || 112) + 'px', fontWeight: 800, color: dark || wood ? '#fff' : C.ink, lineHeight: 1.25 });
    s.r = rich(s.box, d.text); fitLines(s.box, W - 80);
    if (wood) s.r.words.forEach(w => { if (w.dataset.kind === 'n') w.dataset.kind = 'wood'; });
    s.line = el('div', 'ab', cam, { left: '390px', width: '300px', height: '8px', background: wood ? '#FFE07A' : C.red, top: s.box.offsetTop + s.box.offsetHeight + 26 + 'px', transformOrigin: '50% 50%' });
    if (d.sub) s.sub = el('div', 'ab', cam, { left: 0, right: 0, textAlign: 'center', top: s.box.offsetTop + s.box.offsetHeight + 64 + 'px', fontFamily: 'Montserrat,Noto', fontWeight: 600, fontSize: '30px', letterSpacing: '.24em', color: dark || wood ? 'rgba(255,255,255,.75)' : C.muted }, d.sub.toUpperCase());
    s.dark = dark || wood;
    return s;
  },
  update(s, lt) {
    if (s.n) { const k = eo(prog(lt, 0, .5)); s.n.style.opacity = k; s.n.style.transform = `translateY(${(1 - k) * -40}px)`; }
    s.r.words.forEach((w, i) => { const tw = .25 + i * .12, a = eo(prog(lt, tw, .3)); w.style.opacity = a; w.style.transform = `translateY(${(1 - a) * 30}px)`;
      w.style.color = s.dark ? (w.dataset.kind === 'red' || w.dataset.kind === 'circ' ? 'var(--red2,#FF4A4F)' : '#fff') : fullColor(w.dataset.kind); });
    s.line.style.transform = `scaleX(${eio(prog(lt, .5, .5))})`;
    if (s.sub) s.sub.style.opacity = eo(prog(lt, .8, .4));
  }
};

TYPES.list = {
  build(cam, d) {
    const s = {}; s.tr = title(cam, d.title, d.title_y ?? .22, 66);
    const y0 = H * (d.y ?? .34), gap = d.gap ?? 200;
    s.items = d.items.map((it, i) => {
      const r = el('div', 'ab', cam, { left: '110px', right: '70px', top: y0 + i * gap + 'px', display: 'flex', gap: '34px', alignItems: 'flex-start' });
      el('div', 'num', r, null, fmt(i + 1));
      const tx = el('div', '', r, { paddingTop: '4px' }); const t = el('div', '', tx, { fontSize: '52px', fontWeight: 800, lineHeight: 1.25 }); rich(t, it.t || it);
      if (it.sub) el('div', '', tx, { fontSize: '32px', color: C.muted, marginTop: '6px' }, it.sub);
      return r;
    });
    sourceLine(cam, d.source);
    return s;
  },
  update(s, lt, d) {
    if (s.tr) s.tr.words.forEach((w, i) => popWord(w, lt, .1 + i * .15));
    s.items.forEach((r, i) => { const k = eo(prog(lt, d.at ? d.at[i] : .6 + i * .7, .4)); r.style.opacity = k; r.style.transform = `translateX(${(1 - k) * -60}px)`; });
  }
};

// Pictogram grid of people or houses, some turn red, a big label under it.
TYPES.dots = {
  build(cam, d) {
    const s = {}; s.tr = title(cam, d.title, .17, 62);
    const cols = d.cols || 8, total = d.total || 48, rows = Math.ceil(total / cols), sz = d.size || 104, gx = 860 / cols, gy = sz * 1.15;
    const y0 = H * (d.y ?? .29) + sz / 2, svg = svgel('svg', { class: 'ov', width: W, height: H }, cam);
    const hl = new Set(d.hl_idx || Array.from({ length: d.hl || 0 }, (_, i) => Math.floor((i * 7919 + 13) % total)));
    s.icons = Array.from({ length: total }, (_, i) => {
      const x = 110 + gx * (i % cols + .5), y = y0 + gy * Math.floor(i / cols), g = icon(svg, d.icon || 'person', x, y, sz * .82, '#2A2A2A');
      g.style.transformOrigin = `${x}px ${y}px`; return { g, i, on: hl.has(i), r: i % cols + Math.floor(i / cols) };
    });
    s.maxR = cols + rows;
    if (d.label) { s.lab = el('div', 'ab', cam, { left: '45px', right: '45px', top: y0 + gy * rows + 10 + 'px', textAlign: 'center', fontSize: (d.label_size || 110) + 'px', fontWeight: 800 }); s.lr = rich(s.lab, d.label); fitLines(s.lab); }
    sourceLine(cam, d.source);
    return s;
  },
  update(s, lt, d) {
    if (s.tr) s.tr.words.forEach((w, i) => popWord(w, lt, .1 + i * .15));
    s.icons.forEach(o => { const k = prog(lt, .35 + o.r / s.maxR * .9, .35); o.g.style.opacity = eo(k * 1.5); o.g.style.transform = `scale(${lerp(.3, 1, eob(k))})`;
      o.g.querySelectorAll('circle,path,rect:not([opacity])').forEach(e => e.setAttribute('fill', o.on ? mix('#2A2A2A', C.red, prog(lt, d.hl_at ?? 1.6, .4)) : mix('#2A2A2A', '#CFCAC0', prog(lt, d.hl_at ?? 1.6, .4) * (d.fade_rest ? 1 : 0)))); });
    if (s.lr) s.lr.words.forEach((w, i) => popWord(w, lt, (d.label_at ?? 1.9) + i * .15));
  }
};

// Horizontal timeline of years.
TYPES.years = {
  build(cam, d) {
    const s = {}; s.tr = title(cam, d.title, .27, 68);
    const y = H * (d.y ?? .47), x0 = 110, x1 = 970, n = d.points.length;
    s.line = el('div', 'ab', cam, { left: x0 + 'px', width: x1 - x0 + 'px', top: y - 2 + 'px', height: '5px', background: '#262626', transformOrigin: '0 50%' });
    s.pts = d.points.map((p, i) => {
      const x = x0 + 40 + (x1 - x0 - 80) * (n === 1 ? .5 : i / (n - 1)), red = i === d.hl;
      const dot = el('div', 'ab', cam, { left: x - 17 + 'px', top: y - 17 + 'px', width: '34px', height: '34px', borderRadius: '50%', background: red ? C.red : '#262626', border: '6px solid ' + C.bg, boxSizing: 'border-box' });
      const yr = el('div', 'ab', cam, { left: x - 140 + 'px', width: '280px', top: y - 100 + 'px', textAlign: 'center', fontSize: '50px', fontWeight: 800, color: red ? C.red : C.ink }, p.y);
      const tx = el('div', 'ab', cam, { left: x - 130 + 'px', width: '260px', top: y + 40 + 'px', textAlign: 'center', fontSize: '34px', fontWeight: 600, color: C.muted, lineHeight: 1.3 }, p.t || '');
      return { dot, yr, tx };
    });
    sourceLine(cam, d.source);
    return s;
  },
  update(s, lt, d) {
    if (s.tr) s.tr.words.forEach((w, i) => popWord(w, lt, .1 + i * .15));
    s.line.style.transform = `scaleX(${eio(prog(lt, .2, .6))})`;
    s.pts.forEach((p, i) => { const at = d.points[i].at ?? .6 + i * .6; popIn(p.dot, lt, at, .2); [p.yr, p.tx].forEach((e, j) => { const k = eo(prog(lt, at + .1 + j * .1, .35)); e.style.opacity = k; e.style.transform = `translateY(${(1 - k) * (j ? 20 : -20)}px)`; }); });
  }
};

// Person card: black-and-white photo (a transparent PNG works best) over a red disc, name, role chip.
TYPES.profile = {
  build(cam, d) {
    const s = {}, cy = H * (d.y ?? .4), R = 250;
    s.disc = el('div', 'ab', cam, { left: 540 - R + 'px', top: cy - R + 'px', width: 2 * R + 'px', height: 2 * R + 'px', borderRadius: '50%', background: C.red });
    if (d.photo) { s.ph = el('img', '', cam, { position: 'absolute', height: 2 * R + 60 + 'px', left: 540 - (2 * R + 60) * IMG[d.photo].w / IMG[d.photo].h / 2 + 'px', top: cy - R - 60 + 'px', filter: 'grayscale(1) contrast(1.1)' }); s.ph.src = d.photo; if (d.round !== false && !/\.png$/i.test(d.photo)) { s.ph.style.clipPath = `circle(${R}px at 50% ${R + 60}px)`; } }
    else { const svg = svgel('svg', { class: 'ov', width: W, height: H }, cam); s.ph = icon(svg, 'person', 540, cy + 40, 2 * R * .95, '#1E1E1E'); }
    s.name = el('div', 'ab', cam, { left: '45px', right: '45px', top: cy + R + 50 + 'px', textAlign: 'center', fontSize: '84px', fontWeight: 800 }); s.nr = rich(s.name, d.name); fitLines(s.name);
    if (d.role) { s.role = el('div', 'chip', cam, null, d.role); s.role.style.left = (W - s.role.offsetWidth) / 2 + 'px'; s.role.style.top = cy + R + 175 + 'px'; s.roleW = s.role.offsetWidth; }
    if (d.note) { s.note = el('div', 'ab', cam, { left: '80px', right: '80px', top: cy + R + 250 + 'px', textAlign: 'center', fontSize: '42px', fontWeight: 600, color: C.muted }); s.notr = rich(s.note, d.note); }
    return s;
  },
  update(s, lt, d) {
    s.disc.style.transform = `scale(${eob(prog(lt, 0, .5))})`;
    const k = eo(prog(lt, .2, .5)); s.ph.style.opacity = k; s.ph.style.transform = `translateY(${(1 - k) * 50}px)`;
    s.nr.words.forEach((w, i) => popWord(w, lt, .5 + i * .14));
    if (s.role) { s.role.style.opacity = prog(lt, .9, .05); s.role.style.clipPath = `inset(0 ${100 - 100 * prog(lt, .9, .6)}% 0 0)`; }
    if (s.notr) s.notr.words.forEach((w, i) => popWord(w, lt, (d.note_at ?? 1.5) + i * .1));
  }
};

// ---------- footage: clips added with add_media, read as frames through shared/footage.js ----------
const CLIPS = {};
// Paints one frame. focus is where the crop sits, 0..1 on each axis, so a face can be kept in a tall frame.
function paintFrame(g, img, w, h, { fit = 'cover', zoom = 1, focus = [.5, .4] } = {}) {
  const iw = img.naturalWidth, ih = img.naturalHeight, k = (fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * zoom, dw = iw * k, dh = ih * k;
  g.clearRect(0, 0, w, h); g.drawImage(img, (w - dw) * focus[0], (h - dh) * focus[1], dw, dh);
}
const paintClip = async (s, name, at, opt) => { const c = CLIPS[name]; if (c) paintFrame(s.g, await c.at(at), s.cv.width, s.cv.height, opt); };
function chips(cam, d) {
  const out = {};
  out.list = [d.chip].flat().filter(Boolean).map((t, i) => { const c = el('div', 'chip', cam, null, t); c.style.left = (W - c.offsetWidth) / 2 + 'px'; c.style.top = H * (d.chip_y ?? .13) + i * 52 + 'px'; return c; });
  if (d.name) { out.name = el('div', 'ytag', cam, null, d.name); out.name.style.left = '60px'; out.name.style.top = H * (d.name_y ?? .55) + 'px'; out.g = graphemes(d.name); }
  return out;
}
function showChips(c, lt, d, sc) {
  const off = 1 - prog(lt, sc.dur - .3, .3);
  c.list.forEach((e, i) => { e.style.opacity = eo(prog(lt, .1 + i * .12, .25)) * off; });
  if (c.name) { const at = d.name_at ?? .4, n = Math.round(c.g.length * prog(sc.lq, at, c.g.length * .045)); c.name.textContent = c.g.slice(0, Math.max(1, n)).join(''); c.name.style.opacity = prog(lt, at, .05) * off; }
}
// Two-line captions: a small lead line and a big main line, words lighting up. Times come from `cards`, or spread over the scene from `say`.
function captionCards(cam, d, sc) {
  let cards = d.cards;
  if (!cards && d.say) {
    const words = String(d.say).split(/\s+/).filter(Boolean), sents = [], parts = []; let cur = [];
    words.forEach((w, i) => { cur.push(w); if (/[.?!।。？！]$/.test(w) || i === words.length - 1) { sents.push(cur); cur = []; } });
    for (const sw of sents) { const k = Math.ceil(sw.length / (d.max ?? 6)), n = Math.ceil(sw.length / k); for (let i = 0; i < sw.length; i += n) parts.push(sw.slice(i, i + n)); }
    const len = ws => ws.join(' ').length, total = parts.reduce((a, c) => a + len(c), 0), a0 = .1, a1 = sc.dur - .15; let t = a0;
    cards = parts.map(ws => { const n = Math.max(1, Math.floor(ws.length / 2)), dur = (a1 - a0) * len(ws) / total, c = { s: t, e: t + dur, top: ws.slice(0, n).join(' '), main: ws.slice(n).join(' ') }; t += dur; return c; });
  }
  return (cards || []).map(c => {
    const box = el('div', 'cap', cam, { top: H * (d.cap_y ?? .64) + 'px' });
    if (c.top) el('div', 't', box, null, c.top);
    const m = el('div', 'm', box), words = c.main.split(/\s+/).map(w => { const sp = el('span', '', m, null, w); m.appendChild(document.createTextNode(' ')); return sp; });
    fitWidth(m, 1000); box.style.display = 'none';
    return { c, box, words, wt: c.w || words.map((_, i) => c.s + (c.e - c.s) * i / words.length) };
  });
}
function showCaptions(cards, lt) {
  cards.forEach((k, i) => {
    const on = lt >= k.c.s && (lt < k.c.e || i === cards.length - 1); k.box.style.display = on ? 'block' : 'none'; if (!on) return;
    k.words.forEach((w, j) => { w.style.opacity = lt >= k.wt[j] ? 1 : .42; });
  });
}

// The talking head. clip: the name given to add_media. Without a clip the slot shows a placeholder, so a script can be drafted before anything is filmed.
// `from` (seconds into the clip) defaults to the film's own clock, so one sound.json track stays in sync while graphics cut in over the take.
TYPES.talk = {
  build(cam, d, sc) {
    const s = {};
    if (d.clip && CLIPS[d.clip]) {
      s.cv = el('canvas', '', cam, { position: 'absolute', left: 0, top: 0 }); s.cv.width = W; s.cv.height = H; s.g = s.cv.getContext('2d');
      el('div', 'ab', cam, { left: 0, right: 0, top: H * .56 + 'px', height: H * .44 + 'px', background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)' });
    } else {
      sc.root.classList.add('holder');
      el('div', 'hframe', cam, { top: H * .13 + 'px', height: H * .45 + 'px' });
      icon(svgel('svg', { class: 'ov', width: W, height: H }, cam), 'person', 540, H * .38, 420, 'rgba(255,255,255,.10)');
      el('div', 'hlabel', cam, { top: H * .52 + 'px' }, d.hint || 'Your talking clip goes here');
    }
    s.chips = chips(cam, d); s.cards = captionCards(cam, d, sc);
    return s;
  },
  update(s, lt, d, sc) {
    showChips(s.chips, lt, d, sc); showCaptions(s.cards, lt);
    if (!s.cv) return;
    const zoom = (d.zoom ?? (d.punch ? 1.2 : 1)) * lerp(1, d.push ?? 1, eio(lt / sc.dur));
    return paintClip(s, d.clip, (d.from ?? sc.t0) + lt, { zoom, focus: d.focus, fit: d.fit });
  }
};

// Sourced footage or a photo: clip (add_media video) or src (a file in assets/). box: { y, h } as fractions makes a band, otherwise full frame.
TYPES.media = {
  build(cam, d, sc) {
    const s = {}; sc.root.style.background = d.bg || '#050505';
    const y = H * (d.box?.y ?? 0), h = H * (d.box?.h ?? 1);
    if (d.clip) { s.cv = el('canvas', '', cam, { position: 'absolute', left: 0, top: y + 'px' }); s.cv.width = W; s.cv.height = h; s.g = s.cv.getContext('2d'); s.m = s.cv; }
    else { s.m = el('img', '', cam, { position: 'absolute', left: 0, width: W + 'px', top: y + 'px', height: h + 'px', objectFit: d.fit || 'cover', objectPosition: d.pos || '50% 50%' }); s.m.src = d.src; }
    if (d.box) for (const [top, dir] of [[y - 2, 'to bottom'], [y + h - 160, 'to top']]) // soft edges into the background
      el('div', 'ab', cam, { left: 0, right: 0, top: top + 'px', height: '162px', background: `linear-gradient(${dir}, ${d.bg || '#050505'}, transparent)` });
    if (d.text && !d.box) el('div', 'ab', cam, { left: 0, right: 0, top: 0, height: H * (d.shade ?? .34) + 'px', background: 'linear-gradient(to bottom, rgba(0,0,0,.8), rgba(0,0,0,.45) 55%, transparent)' }); // keeps the headline readable on full-frame footage
    if (d.sub && !d.box) el('div', 'ab', cam, { left: 0, right: 0, top: H * .6 + 'px', height: H * .4 + 'px', background: 'linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.5) 50%, transparent)' });
    if (d.text) { s.tx = el('div', 'ab mtx', cam, { left: '50px', right: '50px', top: H * (d.text_y ?? .14) + 'px', textAlign: 'center', fontSize: (d.size || 76) + 'px', fontWeight: 800, lineHeight: 1.18 }); s.tr = rich(s.tx, d.text); fitLines(s.tx, W - 100); }
    if (d.sub) { s.sb = el('div', 'ab mtx mut', cam, { left: '60px', right: '60px', top: H * (d.sub_y ?? .74) + 'px', textAlign: 'center', fontSize: (d.sub_size || 46) + 'px', fontWeight: 600, lineHeight: 1.3 }); s.sr = rich(s.sb, d.sub); fitLines(s.sb, W - 120); }
    s.chips = chips(cam, { ...d, chip_y: d.chip_y ?? .06 });
    sourceLine(cam, d.source, .955);
    return s;
  },
  update(s, lt, d, sc) {
    s.m.style.opacity = eo(prog(lt, 0, d.fade_in ?? .25));
    const pop = (w, at) => { const a = eo(prog(lt, at, .22)); w.style.opacity = a; w.style.transform = `translateY(${(1 - a) * 26}px)`; };
    if (s.tr) s.tr.words.forEach((w, i) => pop(w, d.at?.[i] ?? (d.start ?? .25) + i * (d.step ?? .1)));
    if (s.sr) s.sr.words.forEach((w, i) => pop(w, (d.sub_at ?? 1.2) + i * .06));
    showChips(s.chips, lt, d, sc);
    if (s.cv) return paintClip(s, d.clip, (d.from ?? 0) + lt * (d.rate ?? 1), { fit: d.fit, focus: d.focus });
  }
};

// ---------- timeline + film grain ----------
const stage = el('div', '', document.body), grainEl = el('div', '', stage); stage.id = 'stage'; grainEl.id = 'grain';
const GRAIN = [];
let SC = [], DUR = 0;
function makeGrain() {
  const r = seeded(5);
  for (let n = 0; n < 4; n++) {
    const cv = document.createElement('canvas'); cv.width = 360; cv.height = Math.round(360 * H / W);
    const x = cv.getContext('2d'), im = x.createImageData(cv.width, cv.height);
    for (let i = 0; i < im.data.length; i += 4) { const v = 255 - r() * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); GRAIN.push(`url(${cv.toDataURL()})`);
  }
}
const noSfx = new Set(['talk', 'media']);
window.prepare = async () => {
  await Promise.all(['800 40px Noto', '600 40px Noto', '700 40px DocSerif', '500 40px DocSerif', '40px Galada', '900 40px Montserrat', '800 40px Montserrat', '600 40px Montserrat'].map(f => document.fonts.load(f, 'Ag অক 働')));
  await document.fonts.ready;
  stage.style.height = H + 'px';
  makeGrain();
  if (SPEC.accent) { // a channel colour instead of red
    const toHex = rgb => '#' + rgb.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
    C.red = SPEC.accent; C.lred = toHex(mix(SPEC.accent, C.bg, .68));
    document.documentElement.style.setProperty('--red', SPEC.accent);
    document.documentElement.style.setProperty('--red2', SPEC.accent_on_dark || toHex(mix(SPEC.accent, '#FFFFFF', .45)));
  }
  if (SPEC.font) stage.style.fontFamily = `${SPEC.font},Noto,sans-serif`;
  await Promise.all([...new Set(SPEC.scenes.map(d => d.clip).filter(Boolean))].map(async name => {
    try { CLIPS[name] = await footage(name); } catch { console.error(`clip "${name}" not found. Add it with add_media, or drop clip from the scene to show the placeholder.`); }
  }));
  const srcs = [...new Set(SPEC.scenes.flatMap(d => [d.img, d.photo, d.type === 'media' ? d.src : null]).filter(Boolean))];
  await Promise.all(srcs.map(src => new Promise(r => { const im = new Image(); im.onload = () => { IMG[src] = { w: im.naturalWidth, h: im.naturalHeight }; im.decode().then(r, r); }; im.onerror = () => { console.error('image not found: ' + src); IMG[src] = { w: 16, h: 9 }; r(); }; im.src = src; })));
  let t = 0;
  SC = SPEC.scenes.map((d, i) => {
    const root = el('div', 'sc', stage), cam = el('div', 'cam', root);
    root.style.display = 'block';
    const sc = { i, type: d.type, d, root, cam, t0: t, dur: d.dur, t1: t + d.dur, lq: 0 };
    if (!TYPES[d.type]) throw new Error(`unknown scene type: ${d.type}`);
    sc.st = TYPES[d.type].build(cam, d, sc);
    root.style.display = 'none'; t += d.dur; return sc;
  });
  DUR = t;
  const cues = SC.flatMap(s => (s.d.sfx ?? (noSfx.has(s.type) || !s.i ? [] : [[.05, 'whoosh']])).map(([lt, k]) => ({ t: s.t0 + lt, k, ...(k === 'whoosh' ? { i: s.i % 2 } : {}) })));
  await window.seek(0);
  return { dur: DUR, cues };
};
const noPush = new Set(['clipping', 'map', 'article', 'talk']);
const grainFor = d => d.grain ?? (d.type === 'clipping' ? .16 : d.type === 'end' || d.type === 'talk' ? 0 : d.type === 'media' ? .04 : .06);
window.seek = t => {
  let cur = null;
  for (const s of SC) { const on = (t >= s.t0 && t < s.t1) || (s === SC.at(-1) && t >= s.t1); s.root.style.display = on ? 'block' : 'none'; if (on) cur = s; }
  if (!cur) return;
  const lt = Math.min(t - cur.t0, cur.dur);
  cur.lq = Math.round(t * 30) / 30 - cur.t0;
  if (!noPush.has(cur.type)) cur.cam.style.transform = `scale(${lerp(1, cur.d.push ?? 1.035, eio(lt / cur.dur))})`;
  const wait = TYPES[cur.type].update(cur.st, lt, cur.d, cur);
  grainEl.style.backgroundImage = GRAIN[Math.floor(t * 12) % 4];
  grainEl.style.opacity = grainFor(cur.d);
  return wait; // a Promise while a clip frame loads; the renderer awaits it before the screenshot
};
if (!RENDER) window.prepare().then(info => {
  document.body.style.zoom = Math.min(1, innerHeight / H);
  const t0 = performance.now(); const loop = () => { window.seek(((performance.now() - t0) / 1000) % info.dur); requestAnimationFrame(loop); }; loop();
});
