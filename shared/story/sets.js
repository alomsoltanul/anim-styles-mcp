// Story engine, part 4: rooms, streets, furniture and props. Each item is drawn once; the function it returns moves it.
// Sets sit in world units: 1080 x 1920 for a reel, 1920 x 1080 for a wide film. `room`, `wallplain`, `desk`, `dark` and `street` fill either shape.
import { H, ITEMS, S, SHADOW, T, W, clamp, eo, hash, inSpan, kf, lg, normTimes, patCheck, patDots, rg, shade } from './core.js';
import { fo } from './cards.js';

const TS = spans => (spans || []).map(([a, b]) => [T(a), T(b)]);
const PAL = ['#2F6F9F', '#D7263D', '#E9A23B', '#2E7D6B', '#6D3B8C', '#C2603A', '#3E7C78', '#B8913A'];

ITEMS.room = (g, it) => {
  const hy = it.hy ?? 800, wall = it.wall || '#E8DCC6', floor = it.floor || '#8C5B3A';
  S('rect', { x: -200, y: -200, width: W + 400, height: hy + 200, fill: lg([[0, shade(wall, .06)], [1, shade(wall, -.07)]]) }, g);
  if (it.panel) S('rect', { x: -200, y: hy - 230, width: W + 400, height: 230, fill: shade(wall, -.06) }, g);
  S('rect', { x: -200, y: hy - 16, width: W + 400, height: 16, fill: shade(floor, -.15) }, g);
  S('rect', { x: -200, y: hy, width: W + 400, height: H - hy + 200, fill: lg([[0, shade(floor, .05)], [1, shade(floor, -.18)]]) }, g);
  for (let y = hy + 40, k = 0; y < H + 100; y += 30 + k * 12, k++) S('line', { x1: -200, y1: y, x2: W + 200, y2: y, stroke: shade(floor, -.2), 'stroke-width': 2, opacity: .35 }, g);
  if (it.light) S('path', { d: it.light, fill: '#FFF6DE', opacity: .13 }, g);
};
ITEMS.wallplain = (g, it) => { S('rect', { x: -300, y: -300, width: W + 600, height: H + 600, fill: lg([[0, shade(it.c || '#E8DCC6', .05)], [1, shade(it.c || '#E8DCC6', -.1)]]) }, g); };
ITEMS.dark = (g, it) => { S('rect', { x: -300, y: -300, width: W + 600, height: H + 600, fill: rg([[0, it.c || '#2a2320'], [1, shade(it.c || '#2a2320', -.6)]], .5, .45, .75) }, g); };
ITEMS.desk = (g, it) => { const c = it.c || '#7a4e30'; S('rect', { x: -300, y: -300, width: W + 600, height: H + 600, fill: rg([[0, shade(c, .12)], [1, shade(c, -.35)]], .5, .45, .8) }, g); for (let i = 0; i < 18; i++) S('path', { d: `M -300,${i * 75 - 100 + hash(i) * 30} C 600,${i * 75 - 80} 1300,${i * 75 - 130} 2300,${i * 75 - 90}`, stroke: shade(c, -.2), 'stroke-width': 2 + hash(i + 3) * 3, fill: 'none', opacity: .3 }, g); };
ITEMS.window = (g, it) => {
  const w = it.w || 300, h = it.h || 360, sky = it.sky || 'day';
  const SK = { day: [['0', '#9fd0ee'], ['1', '#e6f2f6']], night: [['0', '#0b1630'], ['1', '#25365e']], evening: [['0', '#f2a65a'], ['1', '#f6d7a7']] }[sky];
  S('rect', { x: -w / 2 - 16, y: -h / 2 - 16, width: w + 32, height: h + 32, rx: 4, fill: '#8a5a36' }, g);
  S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: lg(SK.map(([o, c]) => [o, c])) }, g);
  if (sky === 'night') { S('circle', { cx: w * .22, cy: -h * .24, r: 26, fill: '#F6F1D3' }, g); for (let i = 0; i < 14; i++) S('circle', { cx: -w / 2 + hash(i) * w, cy: -h / 2 + hash(i + 9) * h * .5, r: 1.6, fill: '#fff', opacity: .8 }, g); for (let i = 0; i < 6; i++) { const bx = -w / 2 + i * w / 6, bh = 60 + hash(i + 2) * 110; S('rect', { x: bx, y: h / 2 - bh, width: w / 6 - 4, height: bh, fill: '#0a1124' }, g); for (let j = 0; j < 4; j++) if (hash(i * 7 + j) > .45) S('rect', { x: bx + 10 + (j % 2) * 18, y: h / 2 - bh + 12 + Math.floor(j / 2) * 26, width: 9, height: 12, fill: '#F2C94C', opacity: .85 }, g); } }
  if (sky === 'day') { S('ellipse', { cx: -w * .2, cy: -h * .2, rx: 50, ry: 16, fill: '#fff', opacity: .8 }, g); S('ellipse', { cx: w * .15, cy: -h * .05, rx: 36, ry: 12, fill: '#fff', opacity: .7 }, g); }
  S('rect', { x: -5, y: -h / 2, width: 10, height: h, fill: '#8a5a36' }, g); S('rect', { x: -w / 2, y: -5, width: w, height: 10, fill: '#8a5a36' }, g);
  for (let i = 1; i < 6; i++) S('line', { x1: -w / 2 + i * w / 6, y1: -h / 2, x2: -w / 2 + i * w / 6, y2: h / 2, stroke: '#3b3b3b', 'stroke-width': 4, opacity: .55 }, g);
  if (it.curtain !== false) {
    const cf = patDots(it.curtain || '#B23A55', 'rgba(255,255,255,.55)'), cw = w * .32;
    S('rect', { x: -w / 2 - 50, y: -h / 2 - 50, width: w + 100, height: 12, rx: 6, fill: '#5d3a22' }, g);
    const cl = S('path', { d: `M ${-w / 2 - 40},${-h / 2 - 44} L ${-w / 2 - 40 + cw},${-h / 2 - 44} Q ${-w / 2 + cw * .55},${0} ${-w / 2 - 40 + cw * .7},${h / 2 + 60} L ${-w / 2 - 40},${h / 2 + 60} Z`, fill: cf }, g);
    const cr = S('path', { d: `M ${w / 2 + 40},${-h / 2 - 44} L ${w / 2 + 40 - cw},${-h / 2 - 44} Q ${w / 2 - cw * .55},${0} ${w / 2 + 40 - cw * .7},${h / 2 + 60} L ${w / 2 + 40},${h / 2 + 60} Z`, fill: cf }, g);
    return lt => { const s = Math.sin(lt * 1.3) * 1.2; cl.setAttribute('transform', `skewX(${s})`); cr.setAttribute('transform', `skewX(${-s})`); };
  }
};
ITEMS.door = (g, it) => {
  const w = it.w || 260, h = it.h || 520, part = it.part || 'all';
  if (part !== 'front') { S('rect', { x: -w / 2, y: -h, width: w, height: h, fill: lg([[0, '#2b2420'], [1, '#4a3b30']]) }, g); }
  if (part === 'back') return;
  S('path', { d: `M ${-w / 2 - 22},0 L ${-w / 2 - 22},${-h - 22} L ${w / 2 + 22},${-h - 22} L ${w / 2 + 22},0 L ${w / 2},0 L ${w / 2},${-h} L ${-w / 2},${-h} L ${-w / 2},0 Z`, fill: '#7a4a2a' }, g);
  const cur = S('g', {}, g);
  const cf = patDots(it.curtain || '#B23A55', 'rgba(255,255,255,.5)', 40, 4);
  S('path', { d: `M ${-w / 2},${-h} L ${w / 2},${-h} L ${w / 2},${-h * .18} Q 0,${-h * .1} ${-w / 2},${-h * .18} Z`, fill: cf }, cur);
  for (let i = 1; i < 6; i++) S('line', { x1: -w / 2 + i * w / 6, y1: -h, x2: -w / 2 + i * w / 6, y2: -h * .16, stroke: 'rgba(0,0,0,.12)', 'stroke-width': 3 }, cur);
  S('rect', { x: -w / 2 - 14, y: -h - 12, width: w + 28, height: 12, rx: 5, fill: '#4b2f1b' }, g);
  return lt => { const o = kf(it.open, lt) ?? 0; cur.setAttribute('transform', `translate(${w / 2},0) scale(${1 - o * .72},1) translate(${-w / 2},0)`); };
};
ITEMS.clock = (g, it) => {
  const r = it.r || 52;
  S('circle', { r: r + 9, fill: '#6b4428' }, g); S('circle', { r, fill: '#FBF7EE' }, g);
  for (let i = 0; i < 12; i++) S('line', { x1: 0, y1: -r + 6, x2: 0, y2: -r + (i % 3 ? 11 : 16), stroke: '#333', 'stroke-width': i % 3 ? 2 : 4, transform: `rotate(${i * 30})` }, g);
  const hh = S('line', { x1: 0, y1: 6, x2: 0, y2: -r * .5, stroke: '#222', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  const mm = S('line', { x1: 0, y1: 8, x2: 0, y2: -r * .78, stroke: '#222', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
  S('circle', { r: 5, fill: '#D7263D' }, g);
  return lt => { const m = (it.m0 ?? 610) + (kf(it.speed, lt) ?? 1 / 60) * lt; mm.setAttribute('transform', `rotate(${m * 6})`); hh.setAttribute('transform', `rotate(${m / 2})`); };
};
ITEMS.fan = (g, it) => {
  S('rect', { x: -7, y: -900, width: 14, height: 860, fill: '#a9a39a' }, g);
  S('ellipse', { cx: 0, cy: -40, rx: 46, ry: 22, fill: '#cfc8bd' }, g);
  const sq = S('g', { transform: 'translate(0,-20) scale(1,.26)' }, g), rot = S('g', {}, sq), ghost = S('g', {}, sq);
  const blade = p => [0, 120, 240].forEach(a => S('path', { d: 'M 20,-16 C 140,-34 300,-36 330,0 C 300,36 140,34 20,16 Z', fill: '#ddd6ca', stroke: '#b9b0a2', 'stroke-width': 4, transform: `rotate(${a})` }, p));
  blade(rot); blade(ghost);
  S('ellipse', { cx: 0, cy: -20, rx: 40, ry: 18, fill: '#b9b1a5' }, g); S('ellipse', { cx: 0, cy: -10, rx: 20, ry: 8, fill: '#8d867c' }, g);
  // angle = integral of speed (rev/s) over time, sampled so seek() stays stateless
  const sp = it.speed ?? 2.2, cache = [0]; const dt = 1 / 120;
  return lt => {
    while ((cache.length - 1) * dt < lt) { const t = (cache.length - 1) * dt; cache.push(cache.at(-1) + (kf(sp, t) ?? 0) * 360 * dt); }
    const a = cache[Math.min(cache.length - 1, Math.round(lt / dt))], v = kf(sp, lt) ?? 0;
    rot.setAttribute('transform', `rotate(${a})`); ghost.setAttribute('transform', `rotate(${a - Math.min(40, v * 9)})`);
    ghost.setAttribute('opacity', clamp(v / 3) * .55); rot.setAttribute('opacity', 1 - clamp(v / 3) * .45);
  };
};
ITEMS.frame = (g, it) => {
  const w = it.w || 220, h = it.h || 170;
  S('rect', { x: -w / 2 - 14, y: -h / 2 - 14, width: w + 28, height: h + 28, rx: 3, fill: it.fc || '#5b3a20', filter: SHADOW }, g);
  S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: it.kind === 'empty' ? '#e9e4da' : '#FFFBF0' }, g);
  if (it.kind === 'art') { S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: lg([[0, '#9cc9d8'], [1, '#e9d8b4']]) }, g); S('path', { d: `M ${-w / 2},${h / 2} L ${-w / 4},0 L 0,${h / 4} L ${w / 4},${-h / 6} L ${w / 2},${h / 2} Z`, fill: '#5e8c61' }, g); S('circle', { cx: w / 4, cy: -h / 4, r: 16, fill: '#f6d36b' }, g); }
  if (it.kind === 'calli') { S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#1f5c45' }, g); S('path', { d: `M ${-w * .32},${h * .1} C ${-w * .2},${-h * .3} ${-w * .05},${h * .3} ${w * .05},${-h * .1} S ${w * .25},${h * .25} ${w * .33},${-h * .2}`, stroke: '#E9C46A', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g); S('circle', { cx: -w * .1, cy: -h * .28, r: 5, fill: '#E9C46A' }, g); }
  if (it.html) fo(g, -w / 2, -h / 2, w, h, it.html, it);
  if (it.kind === 'empty') S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: 'url(#glass)', opacity: .5 }, g);
};
ITEMS.shelf = (g, it) => {
  const w = it.w || 300, h = it.h || 420;
  S('rect', { x: -w / 2, y: -h, width: w, height: h, rx: 6, fill: '#6e4528' }, g);
  for (let r = 0; r < 3; r++) { const y = -h + 24 + r * (h - 48) / 3, hh = (h - 48) / 3 - 14; S('rect', { x: -w / 2 + 18, y, width: w - 36, height: hh, fill: '#3d2a1c' }, g); for (let k = 0; k < 4; k++) { const x = -w / 2 + 40 + k * (w - 80) / 4 + 10, cc = ['#E9C46A', '#5FA8D3', '#F4A6A6', '#9ED9B0', '#ffffff'][(r * 4 + k) % 5]; if ((r + k) % 3 === 0) S('ellipse', { cx: x + 14, cy: y + hh - 34, rx: 26, ry: 26, fill: 'none', stroke: cc, 'stroke-width': 5 }, g); else S('path', { d: `M ${x},${y + hh - 4} L ${x + 4},${y + hh - 40} L ${x + 26},${y + hh - 40} L ${x + 30},${y + hh - 4} Z`, fill: cc }, g); } S('rect', { x: -w / 2 + 18, y, width: w - 36, height: hh, fill: 'url(#glass)', opacity: .35 }, g); }
};
ITEMS.sofa = (g, it) => {
  const w = it.w || 760, c = it.c || '#8E2F45', part = it.part || 'all';
  if (part !== 'front') { S('rect', { x: -w / 2 + 30, y: -330, width: w - 60, height: 290, rx: 46, fill: lg([[0, shade(c, .08)], [1, shade(c, -.12)]]) }, g); const n = Math.round(w / 260); for (let i = 1; i < n; i++) S('line', { x1: -w / 2 + 30 + i * (w - 60) / n, y1: -300, x2: -w / 2 + 30 + i * (w - 60) / n, y2: -80, stroke: shade(c, -.2), 'stroke-width': 4 }, g); }
  if (part === 'back') return;
  S('rect', { x: -w / 2 + 40, y: -110, width: w - 80, height: 70, rx: 22, fill: shade(c, .1) }, g);
  S('rect', { x: -w / 2 + 40, y: -64, width: w - 80, height: 50, rx: 10, fill: shade(c, -.1) }, g);
  [-1, 1].forEach(sd => S('rect', { x: sd < 0 ? -w / 2 - 6 : w / 2 - 70, y: -190, width: 76, height: 176, rx: 30, fill: lg([[0, shade(c, .06)], [1, shade(c, -.14)]]) }, g));
  [-1, 1].forEach(sd => S('rect', { x: sd * (w / 2 - 50) - 8, y: -14, width: 16, height: 18, fill: '#3b2416' }, g));
  S('ellipse', { cx: 0, cy: 6, rx: w / 2, ry: 16, fill: '#000', opacity: .14 }, g);
};
const FOOD = {
  mishti: (p, x) => { S('circle', { cx: x, cy: -14, r: 15, fill: '#7b3f1d' }, p); S('circle', { cx: x - 5, cy: -19, r: 4, fill: '#fff', opacity: .45 }, p); },
  roshogolla: (p, x) => { S('circle', { cx: x, cy: -14, r: 15, fill: '#FFF7E6', stroke: '#e7dcc6', 'stroke-width': 2 }, p); },
  samosa: (p, x) => { S('path', { d: `M ${x - 20},-4 L ${x},-34 L ${x + 20},-4 Z`, fill: '#D99B3F', stroke: '#b97b26', 'stroke-width': 2, 'stroke-linejoin': 'round' }, p); },
  chanachur: (p, x) => { S('path', { d: `M ${x - 28},-18 Q ${x},18 ${x + 28},-18 Z`, fill: '#fff', stroke: '#ccc', 'stroke-width': 2 }, p); for (let i = 0; i < 9; i++) S('circle', { cx: x - 18 + hash(i) * 36, cy: -20 + hash(i + 4) * 6, r: 3, fill: ['#c8862d', '#e3b55f', '#8a5a2b'][i % 3] }, p); },
  cup: (p, x) => { S('ellipse', { cx: x, cy: -2, rx: 26, ry: 7, fill: '#fff', stroke: '#c9c1b2', 'stroke-width': 2 }, p); S('path', { d: `M ${x - 16},-34 L ${x + 16},-34 L ${x + 12},-6 L ${x - 12},-6 Z`, fill: '#fff', stroke: '#c9c1b2', 'stroke-width': 2 }, p); S('ellipse', { cx: x, cy: -34, rx: 16, ry: 4, fill: '#9b5b2e' }, p); },
  apple: (p, x) => { S('circle', { cx: x, cy: -16, r: 15, fill: '#D7263D' }, p); S('path', { d: `M ${x},-31 l 3,-8`, stroke: '#5b3a20', 'stroke-width': 3 }, p); },
  banana: (p, x) => { S('path', { d: `M ${x - 24},-12 Q ${x},6 ${x + 24},-18 Q ${x},-2 ${x - 24},-12 Z`, fill: '#F2C94C', stroke: '#d1a72e', 'stroke-width': 2 }, p); },
  biscuit: (p, x) => { S('rect', { x: x - 20, y: -18, width: 40, height: 14, rx: 3, fill: '#E3B55F', stroke: '#c18f3a', 'stroke-width': 2 }, p); },
};
ITEMS.table = (g, it) => {
  const w = it.w || 820;
  S('ellipse', { cx: 0, cy: 150, rx: w / 2, ry: 18, fill: '#000', opacity: .15 }, g);
  [-1, 1].forEach(sd => S('rect', { x: sd * (w / 2 - 50) - 9, y: 20, width: 18, height: 130, fill: '#4b2f1b' }, g));
  S('rect', { x: -w / 2, y: 0, width: w, height: 22, rx: 8, fill: '#5b3a20' }, g);
  S('path', { d: `M ${-w / 2 + 10},0 L ${-w / 2 + 50},-50 L ${w / 2 - 50},-50 L ${w / 2 - 10},0 Z`, fill: 'rgba(190,225,235,.55)', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 3 }, g);
  S('path', { d: `M ${-w / 2 + 80},-46 L ${-w / 2 + 120},-46 L ${-w / 2 + 70},-4 L ${-w / 2 + 30},-4 Z`, fill: '#fff', opacity: .35 }, g);
  const plates = [];
  (it.food || []).forEach((f, i, a) => {
    const x = -w / 2 + 100 + i * (w - 200) / Math.max(1, a.length - 1), p = S('g', { transform: `translate(${x},-26)` }, g);
    if (f !== 'cup' && f !== 'chanachur') { S('ellipse', { cx: 0, cy: 0, rx: 46, ry: 12, fill: '#fafcfd', stroke: '#c6ced4', 'stroke-width': 2 }, p); }
    const items = S('g', {}, p), n = f === 'cup' || f === 'chanachur' ? 1 : 2;
    for (let k = 0; k < n; k++) FOOD[f](items, n === 1 ? 0 : (k - .5) * 30);
    plates.push(items);
  });
  if (it.paper) { const np = S('g', { transform: 'translate(150,-34) rotate(-6)' }, g); fo(np, -110, -36, 220, 72, `<div style="background:#f3efe4;height:100%;border-radius:4px;padding:6px 10px;box-sizing:border-box;font-family:Montserrat;font-weight:900;font-size:17px;color:#222;letter-spacing:1px">DAILY ENGLISH<div style="height:5px;background:#bbb;margin:6px 0 4px"></div><div style="height:5px;background:#ccc;width:70%"></div></div>`, it); }
};
ITEMS.plate = (g, it) => {
  const n = it.n || 6, r = it.r || 1;
  S('ellipse', { cx: 0, cy: 10, rx: 220, ry: 54, fill: '#dfe5ea' }, g); S('ellipse', { cx: 0, cy: 0, rx: 220, ry: 54, fill: '#fafcfd', stroke: '#c6ced4', 'stroke-width': 3 }, g);
  const sw = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * 120, y = Math.sin(a) * 26 - 16, p = S('g', { transform: `translate(${x},${y})` }, g); S('circle', { r: 34, fill: '#7b3f1d' }, p); S('circle', { cx: -10, cy: -12, r: 9, fill: '#fff', opacity: .4 }, p); sw.push(p); }
  return lt => sw.forEach((p, i) => { const te = (it.eat || [])[i]; p.setAttribute('opacity', te != null && lt > T(te) ? 0 : 1); });
};
ITEMS.plant = (g, it) => { S('path', { d: 'M -46,0 L 46,0 L 36,-80 L -36,-80 Z', fill: it.c || '#B5643C' }, g); S('rect', { x: -50, y: -92, width: 100, height: 16, rx: 6, fill: shade(it.c || '#B5643C', -.15) }, g); for (let i = 0; i < 7; i++) S('ellipse', { cx: -40 + i * 13, cy: -150 - hash(i) * 50, rx: 18, ry: 60, fill: ['#4E8F55', '#3C7A46', '#5FA36A'][i % 3], transform: `rotate(${-35 + i * 11},${-40 + i * 13},-92)` }, g); };
ITEMS.rail = (g, it) => {
  const y = it.y0 ?? 0, c = it.c || '#2f3438';
  S('rect', { x: -200, y, width: W + 400, height: 18, rx: 6, fill: c }, g);
  S('rect', { x: -200, y: y + 290, width: W + 400, height: 400, fill: '#bfb3a2' }, g);
  for (let x = -160; x < W + 200; x += 60) { S('rect', { x, y: y + 18, width: 8, height: 272, fill: c }, g); if ((x / 60) % 2 === 0) S('circle', { cx: x + 30, cy: y + 150, r: 22, fill: 'none', stroke: c, 'stroke-width': 6 }, g); }
  S('rect', { x: -200, y: y + 140, width: W + 400, height: 8, fill: c }, g);
};
ITEMS.sky = (g, it) => {
  const k = it.kind || 'evening';
  const st = { evening: [[0, '#5d4a7a'], [.55, '#d77a72'], [1, '#f6c27a']], morning: [[0, '#8ccbea'], [1, '#f4e6cc']], night: [[0, '#0a1430'], [1, '#2b3a66']] }[k];
  S('rect', { x: -300, y: -300, width: W + 600, height: H + 600, fill: lg(st) }, g);
  if (k === 'evening') S('circle', { cx: 1450, cy: 610, r: 70, fill: '#ffe2a8', opacity: .9 }, g);
  for (let i = 0; i < 22; i++) { const x = -100 + i * 100, bh = 120 + hash(i + 40) * 260, c = k === 'evening' ? '#6b4c6e' : '#9aa7b3'; S('rect', { x, y: 760 - bh, width: 90, height: bh + 400, fill: c, opacity: .9 }, g); if (hash(i + 70) > .4) S('rect', { x: x + 25, y: 760 - bh - 30, width: 40, height: 30, fill: c }, g); for (let j = 0; j < 6; j++) if (hash(i * 9 + j) > .55) S('rect', { x: x + 12 + (j % 3) * 26, y: 780 - bh + Math.floor(j / 3) * 40, width: 14, height: 18, fill: '#F7D488', opacity: k === 'evening' ? .75 : .3 }, g); }
  if (it.line) { S('path', { d: 'M -100,120 Q 960,200 2100,110', stroke: '#444', 'stroke-width': 3, fill: 'none' }, g); [[620, '#C0392B'], [860, '#3d6fb6'], [1180, '#F2C94C']].forEach(([x, c], i) => S('path', { d: `M ${x - 50},${150 + i * 4} L ${x + 50},${152 + i * 4} L ${x + 40},${290 + i * 10} L ${x - 44},${286 + i * 10} Z`, fill: i === 0 ? patCheck('#C0392B', '#2E7D32', 24, .55) : c }, g)); }
};
// street seen down the road: objects on both pavements come towards the camera (z shrinks). v = speed, signs = text on signs and shops.
ITEMS.street = (g, it) => {
  const vx = W / 2, vy = H * .48;
  S('rect', { x: -300, y: -300, width: W + 600, height: vy + 300, fill: lg([[0, '#8fcbe8'], [1, '#f4e3c4']]) }, g);
  for (let i = 0; i < 26; i++) { const x = vx - 400 + i * 32, bh = 30 + hash(i + 11) * 90; S('rect', { x, y: vy - bh, width: 30, height: bh, fill: '#b9aa9b', opacity: .8 }, g); }
  S('rect', { x: -300, y: vy, width: W + 600, height: H - vy + 300, fill: '#a99c8c' }, g);
  S('path', { d: `M ${vx - 30},${vy} L ${vx + 30},${vy} L ${vx + 1050},${H + 10} L ${vx - 1050},${H + 10} Z`, fill: lg([[0, '#8b8682'], [1, '#5e5955']]) }, g);
  const dash = S('g', {}, g), objs = S('g', {}, g);
  const proj = (X, z) => [vx + X * 900 / z, vy + (H - vy) / z, 1 / z];
  const N = 14, Z0 = .55, Z1 = 9, v = it.v ?? 1.6;
  const signs = it.signs || ['Corner Store', 'ONE WAY', 'Hotel', 'NO PARKING', 'Tailor', 'SLOW', 'Bakery'];
  const kinds = []; for (let k = 0; k < N; k++) kinds.push({ side: k % 2 ? 1 : -1, type: ['pole', 'sign', 'tree', 'shop'][k % 4], txt: signs[k % signs.length], col: ['#D7263D', '#2E7D32', '#1F4E8C', '#E9A23B', '#6D3B8C'][k % 5], ph: k / N });
  return lt => {
    dash.innerHTML = ''; objs.innerHTML = '';
    for (let k = 0; k < 16; k++) { const z = Z0 + ((k / 16 * (Z1 - Z0) - lt * v * 1.4) % (Z1 - Z0) + (Z1 - Z0)) % (Z1 - Z0), z2 = z + .22; const [x1, y1, s1] = proj(0, z), [x2, y2, s2] = proj(0, z2); S('path', { d: `M ${x1 - 9 * s1 * 2},${y1} L ${x1 + 9 * s1 * 2},${y1} L ${x2 + 9 * s2 * 2},${y2} L ${x2 - 9 * s2 * 2},${y2} Z`, fill: '#f0eadc', opacity: .9 }, dash); }
    const list = kinds.map(o => ({ ...o, z: Z0 + (((o.ph * (Z1 - Z0)) - lt * v) % (Z1 - Z0) + (Z1 - Z0)) % (Z1 - Z0) })).sort((a, b) => b.z - a.z);
    for (const o of list) {
      const X = o.side * (o.type === 'shop' ? 1.75 : 1.28), [x, y, s] = proj(X, o.z), q = S('g', { transform: `translate(${x},${y}) scale(${s})`, opacity: clamp((Z1 - o.z) / 1.5) }, objs);
      if (o.type === 'pole') { S('rect', { x: -9, y: -760, width: 18, height: 760, fill: '#7d7a76' }, q); S('rect', { x: -70, y: -730, width: 140, height: 12, fill: '#6b6865' }, q); for (let i = 0; i < 5; i++) S('path', { d: `M -60,${-718 + i * 3} q ${-200 * o.side} ${60 + i * 14} ${-420 * o.side} ${10 + i * 6}`, stroke: '#2b2b2b', 'stroke-width': 3, fill: 'none' }, q); S('ellipse', { cx: 0, cy: -690, rx: 50, ry: 22, fill: 'none', stroke: '#2b2b2b', 'stroke-width': 4 }, q); }
      else if (o.type === 'tree') { S('rect', { x: -14, y: -260, width: 28, height: 260, fill: '#6b4a2c' }, q); S('circle', { cx: 0, cy: -330, r: 120, fill: '#4E8F55' }, q); S('circle', { cx: -70, cy: -280, r: 80, fill: '#3C7A46' }, q); S('circle', { cx: 70, cy: -290, r: 86, fill: '#5FA36A' }, q); }
      else if (o.type === 'sign') { S('rect', { x: -6, y: -420, width: 12, height: 420, fill: '#7d7a76' }, q); const en = /^[A-Z ]+$/.test(o.txt); S('rect', { x: -170, y: -540, width: 340, height: 130, rx: 10, fill: en ? '#1F6F43' : '#F2C94C', stroke: '#fff', 'stroke-width': 6 }, q); S('text', { x: 0, y: -458, 'text-anchor': 'middle', 'font-family': en ? 'Montserrat' : 'Noto', 'font-weight': 800, 'font-size': en ? 54 : 44, fill: en ? '#fff' : '#1E1B18' }, q).textContent = o.txt; }
      else { S('rect', { x: -260, y: -700, width: 520, height: 700, fill: shade(o.col, .55) }, q); S('rect', { x: -240, y: -210, width: 480, height: 210, fill: '#3b2f28' }, q); S('rect', { x: -250, y: -330, width: 500, height: 110, fill: o.col }, q); S('text', { x: 0, y: -258, 'text-anchor': 'middle', 'font-family': 'Noto', 'font-weight': 800, 'font-size': 52, fill: '#fff' }, q).textContent = o.txt; for (let j = 0; j < 6; j++) S('rect', { x: -200 + (j % 3) * 150, y: -640 + Math.floor(j / 3) * 150, width: 90, height: 100, fill: '#cfe3ee', stroke: '#fff', 'stroke-width': 6 }, q); }
    }
  };
};
// rickshaw from behind-ish front: origin = ground under the front wheel
ITEMS.rickshaw = (g, it) => {
  const root = S('g', {}, g);
  const wheel = (x, rx, ry) => { const w = S('g', { transform: `translate(${x},${-ry})` }, root); S('ellipse', { rx, ry, fill: 'none', stroke: '#2a2a2a', 'stroke-width': 12 }, w); S('ellipse', { rx: rx * .78, ry: ry * .86, fill: 'none', stroke: '#9a9a9a', 'stroke-width': 3 }, w); const sp = S('g', {}, w); for (let i = 0; i < 6; i++) S('line', { x1: 0, y1: -ry * .85, x2: 0, y2: ry * .85, stroke: '#b5b5b5', 'stroke-width': 2, transform: `rotate(${i * 30}) scale(${rx / ry},1)` }, sp); return sp; };
  const rw = [wheel(-230, 34, 120), wheel(230, 34, 120)];
  // hood
  const hood = S('g', {}, root);
  S('path', { d: 'M -250,-420 C -270,-800 270,-800 250,-420 Z', fill: '#2a1720' }, hood);
  S('path', { d: 'M -250,-420 C -270,-800 270,-800 250,-420', stroke: '#E63946', 'stroke-width': 34, fill: 'none' }, hood);
  S('path', { d: 'M -232,-430 C -250,-770 250,-770 232,-430', stroke: '#F2C94C', 'stroke-width': 10, fill: 'none' }, hood);
  for (let i = 0; i < 24; i++) { const a = Math.PI * (1 - i / 23), x = Math.cos(a) * 262, y = -430 - Math.sin(a) * 305; S('path', { d: `M ${x - 7},${y} L ${x + 7},${y} L ${x},${y + 24} Z`, fill: ['#E63946', '#2A9D8F', '#F2C94C', '#3d6fb6'][i % 4], transform: `rotate(${(a * 180 / Math.PI - 90) * -.6},${x},${y})` }, hood); }
  [-1, 1].forEach(sd => { S('path', { d: `M ${sd * 250},-420 L ${sd * 262},-250 L ${sd * 200},-250 L ${sd * 196},-420 Z`, fill: '#3d6fb6' }, hood); S('circle', { cx: sd * 228, cy: -340, r: 16, fill: '#F2C94C' }, hood); S('circle', { cx: sd * 228, cy: -340, r: 7, fill: '#E63946' }, hood); });
  const pas = S('g', {}, root); // it.passenger is drawn here
  S('rect', { x: -230, y: -300, width: 460, height: 110, rx: 18, fill: '#C1121F' }, root);
  S('rect', { x: -230, y: -300, width: 460, height: 24, rx: 10, fill: '#E5383B' }, root);
  [-140, 0, 140].forEach(x => { S('circle', { cx: x, cy: -238, r: 26, fill: '#F2C94C' }, root); S('circle', { cx: x, cy: -238, r: 11, fill: '#2A9D8F' }, root); });
  S('rect', { x: -60, y: -190, width: 120, height: 150, fill: '#3a3a3a' }, root);
  const rid = S('g', {}, root);
  // handle + front wheel
  const fw = wheel(0, 18, 82);
  S('path', { d: 'M -150,-330 Q 0,-350 150,-330', stroke: '#c9c9c9', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }, root);
  S('rect', { x: -9, y: -330, width: 18, height: 170, fill: '#bdbdbd' }, root);
  [-1, 1].forEach(sd => S('rect', { x: sd * 150 - 16, y: -342, width: 32, height: 24, rx: 10, fill: '#222' }, root));
  S('circle', { cx: 110, cy: -352, r: 15, fill: '#E9C46A', stroke: '#b8913a', 'stroke-width': 3 }, root);
  const sub = [];
  if (it.passenger) { const pg = S('g', { transform: `translate(${it.passenger.x ?? 30},${it.passenger.y ?? -300}) scale(${it.passenger.s ?? .62})` }, pas); sub.push(ITEMS.char(pg, normTimes({ ...it.passenger, x: 0, y: 0 }))); }
  if (it.rider) { const rg2 = S('g', { transform: `translate(${it.rider.x ?? -10},${it.rider.y ?? -160}) scale(${it.rider.s ?? .72})` }, rid); sub.push(ITEMS.char(rg2, normTimes({ ...it.rider, x: 0, y: 0, legs: true, pose: 'handle' }))); }
  return lt => {
    root.setAttribute('transform', `translate(0,${Math.sin(lt * 10) * 2.5})`);
    rw.forEach(w => w.setAttribute('transform', `rotate(${(lt * 140) % 30})`)); fw.setAttribute('transform', `rotate(${(lt * 200) % 30})`);
    sub.forEach(f => f && f(lt));
  };
};
// wall calendar: pages [[t, month, day, +offset s]], the old page flips up on each change
ITEMS.cal = (g, it) => {
  const w = it.w || 250, h = it.h || 290, pages = (it.pages || [[0, 'January', '1']]).map(r => [T(r[0]) + (r[3] || 0), r[1], r[2]]);
  S('rect', { x: -w / 2 + 8, y: -h / 2 + 12, width: w, height: h, rx: 14, fill: '#000', opacity: .15 }, g);
  const page = () => {
    const q = S('g', {}, g);
    S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: '#FFFDF7', stroke: '#d9cfbd', 'stroke-width': 3 }, q);
    S('path', { d: `M ${-w / 2},${-h / 2 + 74} L ${-w / 2},${-h / 2 + 14} Q ${-w / 2},${-h / 2} ${-w / 2 + 14},${-h / 2} L ${w / 2 - 14},${-h / 2} Q ${w / 2},${-h / 2} ${w / 2},${-h / 2 + 14} L ${w / 2},${-h / 2 + 74} Z`, fill: '#D7263D' }, q);
    const m = S('text', { x: 0, y: -h / 2 + 52, 'text-anchor': 'middle', 'font-family': 'Noto', 'font-weight': 700, 'font-size': 38, fill: '#fff' }, q);
    const d = S('text', { x: 0, y: h / 2 - 46, 'text-anchor': 'middle', 'font-family': 'Noto', 'font-weight': 800, 'font-size': 150, fill: '#2a2219' }, q);
    return { q, m, d };
  };
  const base = page(), top = page();
  [-1, 1].forEach(sd => S('rect', { x: sd * w * .28 - 7, y: -h / 2 - 18, width: 14, height: 36, rx: 7, fill: '#555' }, g));
  return lt => {
    let k = 0; pages.forEach((p, i) => { if (lt >= p[0]) k = i; });
    base.m.textContent = pages[k][1]; base.d.textContent = pages[k][2];
    const since = lt - pages[k][0], fd = it.flip || .26;
    if (k > 0 && since < fd) {
      const pv = pages[k - 1], p = eo(since / fd); top.m.textContent = pv[1]; top.d.textContent = pv[2];
      top.q.setAttribute('transform', `translate(0,${-h / 2}) scale(1,${Math.max(.001, 1 - p)}) translate(0,${h / 2})`); top.q.style.display = '';
    } else top.q.style.display = 'none';
  };
};
// bed seen from its foot (origin = floor under the foot board); the blanket is a separate item so a sleeper fits between
ITEMS.bed = (g, it) => {
  const w = it.w || 520;
  S('rect', { x: -w / 2, y: -480, width: w, height: 270, rx: 34, fill: '#7a4a2a' }, g);
  S('rect', { x: -w / 2 + 26, y: -454, width: w - 52, height: 210, rx: 22, fill: '#8e5a35' }, g);
  [-1, 1].forEach(sd => S('ellipse', { cx: sd * w * .22, cy: -250, rx: 112, ry: 44, fill: '#F4EFE6', stroke: '#d8d0c2', 'stroke-width': 3 }, g));
  S('rect', { x: -w / 2 - 10, y: -236, width: w + 20, height: 120, fill: '#EDE6DA' }, g);
};
ITEMS.blanket = (g, it) => {
  const w = it.w || 540;
  S('path', { d: `M ${-w / 2},-206 Q 0,-240 ${w / 2},-206 L ${w / 2 + 14},-40 L ${-w / 2 - 14},-40 Z`, fill: patCheck(it.c || '#3d6fb6', '#ffffff', 44, .22) }, g);
  S('path', { d: `M ${-w / 2},-206 Q 0,-240 ${w / 2},-206`, stroke: shade(it.c || '#3d6fb6', -.2), 'stroke-width': 6, fill: 'none' }, g);
  S('rect', { x: -w / 2 - 14, y: -40, width: w + 28, height: 40, rx: 4, fill: '#5b3a20' }, g);
  [-1, 1].forEach(sd => S('rect', { x: sd * (w / 2 + 2) - 8, y: 0, width: 16, height: 26, fill: '#3b2416' }, g));
};
// small side table, origin = floor; top at y -175
ITEMS.stand = (g, it) => {
  const w = it.w || 190;
  S('ellipse', { cx: 0, cy: 4, rx: w / 2 + 10, ry: 12, fill: '#000', opacity: .14 }, g);
  [-1, 1].forEach(sd => S('rect', { x: sd * (w / 2 - 22) - 8, y: -170, width: 16, height: 170, fill: '#5b3a20' }, g));
  S('rect', { x: -w / 2, y: -186, width: w, height: 24, rx: 6, fill: '#7a4a2a' }, g);
  S('rect', { x: -w / 2 + 14, y: -150, width: w - 28, height: 50, rx: 4, fill: '#6b4428' }, g);
  S('circle', { cx: 0, cy: -125, r: 6, fill: '#E9C46A' }, g);
};
// twin-bell alarm clock, rings (shakes) inside `ring` spans
ITEMS.alarm = (g, it) => {
  const r = it.r || 60, ring = TS(it.ring), body = S('g', {}, g), waves = S('g', {}, g);
  [-1, 1].forEach(sd => S('circle', { cx: sd * r * .62, cy: -r * .86, r: r * .32, fill: '#E9C46A', stroke: '#b8913a', 'stroke-width': 4 }, body));
  [-1, 1].forEach(sd => S('line', { x1: sd * r * .5, y1: r * .7, x2: sd * r * .78, y2: r * 1.05, stroke: '#333', 'stroke-width': 8, 'stroke-linecap': 'round' }, body));
  S('circle', { r, fill: '#D7263D' }, body); S('circle', { r: r * .8, fill: '#FFFDF7' }, body);
  for (let i = 0; i < 12; i++) S('line', { x1: 0, y1: -r * .7, x2: 0, y2: -r * (i % 3 ? .62 : .56), stroke: '#555', 'stroke-width': i % 3 ? 3 : 5, transform: `rotate(${i * 30})` }, body);
  S('line', { x1: 0, y1: 0, x2: 0, y2: -r * .56, stroke: '#222', 'stroke-width': 5, 'stroke-linecap': 'round' }, body);
  S('line', { x1: 0, y1: 0, x2: 0, y2: -r * .38, stroke: '#222', 'stroke-width': 7, 'stroke-linecap': 'round', transform: 'rotate(150)' }, body);
  S('circle', { r: 5, fill: '#222' }, body);
  [-1, 1].forEach(sd => [0, 1].forEach(k => S('path', { d: `M ${sd * (r + 18 + k * 18)},${-r * .5} Q ${sd * (r + 30 + k * 18)},0 ${sd * (r + 18 + k * 18)},${r * .5}`, stroke: '#2a2219', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, waves)));
  return lt => { const on = inSpan(ring, lt); body.setAttribute('transform', on ? `rotate(${Math.sin(lt * 70) * 9}) translate(${Math.sin(lt * 55) * 3},0)` : ''); waves.style.display = on && Math.floor(lt * 8) % 2 ? '' : 'none'; };
};
// closed hardcover, seen from the back (held up to read)
ITEMS.book = (g, it) => {
  const w = it.w || 150, h = it.h || 196, c = it.c || '#2F6F9F';
  S('rect', { x: -w / 2 + 6, y: -h / 2 + 6, width: w, height: h, rx: 6, fill: '#FFF8E8', stroke: '#d8cfbd', 'stroke-width': 2 }, g);
  S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 6, fill: c, stroke: shade(c, -.3), 'stroke-width': 3 }, g);
  S('rect', { x: -w / 2, y: -h / 2, width: 18, height: h, rx: 4, fill: shade(c, -.2) }, g);
  S('rect', { x: -w / 2 + 36, y: -h / 2 + 42, width: w - 60, height: 10, rx: 5, fill: '#fff', opacity: .6 }, g);
  S('rect', { x: -w / 2 + 36, y: -h / 2 + 64, width: w - 90, height: 8, rx: 4, fill: '#fff', opacity: .45 }, g);
};
// pile of books or diaries lying flat; n (keyframes) = how many have landed, each drops in from above
ITEMS.pile = (g, it) => {
  const N = it.max || 20, nk = Array.isArray(it.n) ? it.n.map(r => [T(r[0]), r[1]]) : it.n, diary = it.kind === 'diary', bs = []; let y = 0;
  for (let i = 0; i < N; i++) {
    const h = diary ? 34 : 22 + hash(i + 1) * 14, w = diary ? 200 : 150 + hash(i + 3) * 56, dx = (hash(i + 7) - .5) * (diary ? 16 : 26), c = diary ? ['#3E7C78', '#C2603A', '#6D3B8C', '#2F6F9F', '#B8913A'][i % 5] : PAL[i % PAL.length];
    const b = S('g', {}, g);
    S('rect', { x: -w / 2 + dx, y: y - h, width: w, height: h, rx: 5, fill: c, stroke: shade(c, -.28), 'stroke-width': 2 }, b);
    S('rect', { x: w / 2 + dx - 14, y: y - h + 5, width: 10, height: h - 10, rx: 2, fill: '#FFF8E8' }, b);
    if (diary) S('rect', { x: -w / 2 + dx + 70, y: y - h + 10, width: 60, height: 14, rx: 3, fill: '#FFF8E8', opacity: .85 }, b);
    else S('rect', { x: -w / 2 + dx + 14, y: y - h + h / 2 - 3, width: w * .45, height: 6, rx: 3, fill: '#fff', opacity: .5 }, b);
    bs.push(b); y -= h;
  }
  return lt => { const n = kf(nk, lt) ?? N; bs.forEach((b, i) => { const p = clamp((n - i) * 1.4); b.style.display = p <= 0 ? 'none' : ''; b.setAttribute('transform', `translate(0,${(1 - eo(p)) * -220})`); b.setAttribute('opacity', clamp(p * 4)); }); };
};
// "z Z Z" drifting up from a sleeper
ITEMS.zzz = (g, it) => {
  const zs = [0, 1, 2].map(k => { const t = S('text', { 'font-family': 'Montserrat', 'font-weight': 900, 'font-size': 46 + k * 16, fill: '#3B2A22' }, g); t.textContent = 'Z'; return t; });
  return lt => zs.forEach((t, k) => { const p = (lt * .55 + k / 3) % 1; t.setAttribute('x', 20 + p * 70 + k * 6); t.setAttribute('y', -p * 190); t.setAttribute('opacity', Math.sin(p * Math.PI)); });
};
// street of old pastel buildings for a reel (gy = where the buildings meet the pavement)
ITEMS.lane = (g, it) => {
  const gy = it.gy || 1180;
  S('rect', { x: -500, y: -500, width: 2100, height: gy + 500, fill: lg([[0, it.sky1 || '#CFE3EA'], [1, it.sky2 || '#F4EAD6']]) }, g);
  const cols = ['#C9B79C', '#D9A79A', '#A9B49A', '#E2C68F', '#B7C3C9', '#D7B9A6', '#9FB4A3'];
  for (let x = -320, i = 0; x < 1450; i++) {
    const bw = 220 + hash(i + 2) * 90, bh = 560 + hash(i + 5) * 420, c = cols[i % cols.length], top = gy - bh, b = S('g', {}, g);
    S('rect', { x, y: top, width: bw, height: bh + 10, fill: lg([[0, shade(c, .04)], [1, shade(c, -.08)]]) }, b);
    S('rect', { x: x - 8, y: top - 14, width: bw + 16, height: 22, fill: shade(c, -.18) }, b);
    for (let ry = top + 70; ry < gy - 230; ry += 150) {
      const n = bw > 270 ? 3 : 2, ww = 46, gap = (bw - n * ww) / (n + 1);
      for (let k = 0; k < n; k++) {
        const wx = x + gap + k * (ww + gap);
        S('rect', { x: wx - 6, y: ry - 6, width: ww + 12, height: 84, fill: shade(c, -.2) }, b);
        S('rect', { x: wx, y: ry, width: ww, height: 72, fill: hash(i * 13 + k + ry) > .5 ? '#5E8C6A' : '#3d3a36' }, b);
        if (hash(i * 7 + k + ry) > .5) S('line', { x1: wx + ww / 2, y1: ry, x2: wx + ww / 2, y2: ry + 72, stroke: shade(c, -.35), 'stroke-width': 3 }, b);
      }
      if (hash(i + ry) > .55) { S('rect', { x: x + 12, y: ry + 72, width: bw - 24, height: 10, fill: '#3b3b3b' }, b); for (let px = x + 20; px < x + bw - 20; px += 18) S('rect', { x: px, y: ry + 46, width: 4, height: 28, fill: '#3b3b3b' }, b); }
      if (hash(i * 3 + ry) > .78) S('rect', { x: x + bw - 70, y: ry + 10, width: 48, height: 34, rx: 4, fill: '#EDEDE8', stroke: '#b9b5ac', 'stroke-width': 2 }, b);
    }
    S('rect', { x: x + 14, y: gy - 170, width: bw - 28, height: 170, fill: '#8f8a84' }, b);
    for (let sy = gy - 160; sy < gy; sy += 16) S('line', { x1: x + 14, y1: sy, x2: x + bw - 14, y2: sy, stroke: '#77726c', 'stroke-width': 2 }, b);
    x += bw;
  }
  [0, 1, 2].forEach(k => S('path', { d: `M -400,${300 + k * 26} Q 540,${430 + k * 34} 1500,${280 + k * 22}`, stroke: '#3a3633', 'stroke-width': 3, fill: 'none', opacity: .8 }, g));
  S('rect', { x: -500, y: gy, width: 2100, height: 1400, fill: lg([[0, '#D9CDB6'], [1, '#C8B99E']]) }, g);
  for (let y = gy + 60, k = 0; y < 2500; y += 70 + k * 10, k++) S('line', { x1: -500, y1: y, x2: 1600, y2: y, stroke: '#B9A98D', 'stroke-width': 3 }, g);
  S('rect', { x: 60, y: 520, width: 14, height: gy - 520 + 120, fill: '#4b5a55' }, g);
  S('path', { d: 'M 74,540 Q 130,520 160,560', stroke: '#4b5a55', 'stroke-width': 10, fill: 'none' }, g);
  S('ellipse', { cx: 166, cy: 566, rx: 26, ry: 12, fill: '#F7E7B0' }, g);
};
// tea stall (origin = pavement under the counter centre). part back = wall, shelves, awning, sign; front = counter, stove, jars, shutter
ITEMS.stall = (g, it) => {
  const part = it.part || 'all', sh = it.shutter || 0;
  if (part !== 'front') {
    [-1, 1].forEach(sd => S('rect', { x: sd * 320 - 12, y: -1000, width: 24, height: 1000, fill: '#5b3a20' }, g));
    S('rect', { x: -300, y: -930, width: 600, height: 600, fill: '#4a3424' }, g);
    [-800, -660, -520].forEach((y, r) => { S('rect', { x: -290, y, width: 580, height: 12, fill: '#6b4428' }, g); for (let k = 0; k < 7; k++) { const c = PAL[(k + r * 3) % PAL.length], x = -268 + k * 80; if ((k + r) % 2) { S('rect', { x, y: y - 82, width: 56, height: 82, rx: 14, fill: 'rgba(220,240,250,.5)', stroke: '#cfe0e6', 'stroke-width': 2 }, g); S('rect', { x: x + 4, y: y - 94, width: 48, height: 14, rx: 4, fill: '#C2603A' }, g); for (let j = 0; j < 3; j++) S('circle', { cx: x + 16 + j * 12, cy: y - 18 - (j % 2) * 16, r: 9, fill: '#E3B55F' }, g); } else S('rect', { x: x + 4, y: y - 70, width: 48, height: 70, rx: 3, fill: c }, g); } });
    for (let k = 0; k < 5; k++) S('rect', { x: -250 + k * 34, y: -912, width: 28, height: 40, rx: 3, fill: PAL[(k + 2) % PAL.length] }, g);
    const aw = S('g', {}, g);
    for (let k = 0; k < 16; k++) S('rect', { x: -340 + k * 42.5, y: -1000, width: 42.5, height: 96, fill: k % 2 ? '#F4EFE6' : '#2F6F9F' }, aw);
    for (let k = 0; k < 16; k++) S('path', { d: `M ${-340 + k * 42.5},-904 a 21.25,18 0 0 0 42.5,0 Z`, fill: k % 2 ? '#F4EFE6' : '#2F6F9F' }, aw);
    S('rect', { x: -250, y: -1100, width: 500, height: 96, rx: 8, fill: '#F2C94C', stroke: '#b8913a', 'stroke-width': 5 }, g);
    S('text', { x: 0, y: -1036, 'text-anchor': 'middle', 'font-family': 'Noto', 'font-weight': 800, 'font-size': 54, fill: '#3B2A22' }, g).textContent = it.sign || 'TEA STALL';
    S('g', { transform: 'translate(262,-880)' }, g).innerHTML = '<path d="M 0,0 L 0,26" stroke="#6b4428" stroke-width="4"/>' + [-14, 0, 14].map((x, i) => `<path d="M ${x},24 q ${-6 + i * 6},46 ${8 + i * 2},70" stroke="#E9C46A" stroke-width="14" fill="none" stroke-linecap="round"/>`).join('');
  }
  if (part === 'back') return;
  S('rect', { x: -320, y: -350, width: 640, height: 26, rx: 6, fill: '#6b4428' }, g);
  S('rect', { x: -310, y: -326, width: 620, height: 326, fill: '#8a5a36' }, g);
  S('rect', { x: -282, y: -300, width: 564, height: 250, rx: 6, fill: '#2E7D6B' }, g);
  S('text', { x: 0, y: -158, 'text-anchor': 'middle', 'font-family': 'Noto', 'font-weight': 800, 'font-size': 64, fill: '#FFF3E2' }, g).textContent = it.counter ?? 'Tea · Biscuits';
  S('rect', { x: -250, y: -460, width: 120, height: 112, rx: 10, fill: '#B5643C' }, g);
  S('path', { d: 'M -232,-462 Q -190,-500 -148,-462 Z', fill: '#F2994A', opacity: .9 }, g);
  S('ellipse', { cx: -190, cy: -515, rx: 62, ry: 50, fill: '#C9CED3', stroke: '#9aa1a8', 'stroke-width': 4 }, g);
  S('path', { d: 'M -134,-520 L -88,-566 L -80,-556 L -128,-500 Z', fill: '#B9BFC5' }, g);
  S('path', { d: 'M -232,-548 Q -190,-640 -148,-548', stroke: '#6b6f73', 'stroke-width': 8, fill: 'none' }, g);
  S('rect', { x: -212, y: -572, width: 44, height: 14, rx: 6, fill: '#9aa1a8' }, g);
  const steam = [0, 1, 2].map(k => S('path', { d: 'M 0,0 q -16,-30 0,-60 q 16,-30 0,-60', stroke: '#fff', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, g));
  [130, 220].forEach(x => { S('rect', { x: x - 38, y: -470, width: 76, height: 120, rx: 16, fill: 'rgba(220,240,250,.55)', stroke: '#cfe0e6', 'stroke-width': 3 }, g); S('rect', { x: x - 34, y: -486, width: 68, height: 18, rx: 6, fill: '#D7263D' }, g); for (let j = 0; j < 5; j++) S('circle', { cx: x - 18 + (j % 3) * 18, cy: -380 - Math.floor(j / 3) * 26, r: 12, fill: '#E3B55F', stroke: '#c18f3a', 'stroke-width': 2 }, g); });
  let shut = null;
  if (sh > 0) {
    shut = S('g', {}, g); const hh = 930 * sh;
    S('rect', { x: -306, y: -930, width: 612, height: hh, fill: lg([[0, '#A7A9AB'], [1, '#8C8E90']]) }, shut);
    for (let y = -918; y < -930 + hh; y += 18) S('line', { x1: -306, y1: y, x2: 306, y2: y, stroke: '#7d7f81', 'stroke-width': 3 }, shut);
    S('rect', { x: -306, y: -930 + hh - 22, width: 612, height: 22, fill: '#6f7173' }, shut);
    S('rect', { x: -30, y: -930 + hh - 50, width: 60, height: 14, rx: 7, fill: '#555' }, shut);
  }
  return lt => { if (!shut) steam.forEach((s, k) => { const p = (lt * .45 + k / 3) % 1; s.setAttribute('transform', `translate(${-96 + Math.sin(p * 6 + k) * 8},${-570 - p * 120}) scale(${.6 + p * .6})`); s.setAttribute('opacity', Math.sin(p * Math.PI) * .7); }); else steam.forEach(s => s.setAttribute('opacity', 0)); };
};
ITEMS.bench = (g, it) => {
  const w = it.w || 440, sh = it.seat || 250;
  S('ellipse', { cx: 0, cy: 6, rx: w / 2 + 20, ry: 14, fill: '#000', opacity: .14 }, g);
  [-1, 1].forEach(sd => S('rect', { x: sd * (w / 2 - 34) - 9, y: -sh, width: 18, height: sh, fill: '#5b3a20' }, g));
  S('rect', { x: -w / 2, y: -sh - 18, width: w, height: 30, rx: 6, fill: '#8a5a36' }, g);
  S('rect', { x: -w / 2, y: -sh + 6, width: w, height: 10, fill: '#6b4428' }, g);
};

// desk seen from the front (origin = floor under the desk centre, top at y -330); people sit behind it
ITEMS.deskf = (g, it) => {
  const w = it.w || 1000;
  S('rect', { x: -w / 2, y: -340, width: w, height: 30, rx: 8, fill: '#7a4a2a' }, g);
  S('rect', { x: -w / 2 + 20, y: -312, width: w - 40, height: 312, fill: lg([[0, '#8e5a35'], [1, '#6b4428']]) }, g);
  [-1, 1].forEach(sd => S('rect', { x: sd * w * .25 - 90, y: -270, width: 180, height: 90, rx: 8, fill: '#9a6740', stroke: '#6b4428', 'stroke-width': 4 }, g));
  [-1, 1].forEach(sd => S('circle', { cx: sd * w * .25, cy: -225, r: 7, fill: '#E9C46A' }, g));
};
// laptop seen from behind: lid back on the desk (origin = desk top under the hinge)
ITEMS.laptopb = (g, it) => {
  const w = it.w || 380, h = it.h || 250;
  S('path', { d: `M ${-w / 2},0 L ${w / 2},0 L ${w / 2 - 12},${-h} L ${-w / 2 + 12},${-h} Z`, fill: lg([[0, '#C9CED3'], [1, '#A7AEB5']]), stroke: '#8d949b', 'stroke-width': 4 }, g);
  S('circle', { cx: 0, cy: -h / 2, r: 26, fill: '#E2733A', opacity: .9 }, g);
  S('rect', { x: -w / 2 - 20, y: -8, width: w + 40, height: 14, rx: 6, fill: '#8d949b' }, g);
  S('path', { d: `M ${-w / 2 + 12},${-h} L ${w / 2 - 12},${-h}`, stroke: '#9fd8ff', 'stroke-width': 6, opacity: .7 }, g);
};
ITEMS.chairb = (g, it) => { S('rect', { x: -130, y: -560, width: 260, height: 330, rx: 50, fill: it.c || '#3B2A22' }, g); S('rect', { x: -110, y: -540, width: 220, height: 290, rx: 40, fill: shade(it.c || '#3B2A22', .12) }, g); };
ITEMS.lamp = (g) => { S('rect', { x: -60, y: -14, width: 120, height: 14, rx: 6, fill: '#2a2219' }, g); S('path', { d: 'M 0,-14 L -30,-200 L 40,-260', stroke: '#2a2219', 'stroke-width': 10, fill: 'none' }, g); S('path', { d: 'M 10,-300 L 100,-250 L 60,-200 Z', fill: '#E9A23B' }, g); S('ellipse', { cx: 80, cy: -225, rx: 40, ry: 14, fill: '#FFF3C4', opacity: .8 }, g); };
ITEMS.mug = (g) => { S('rect', { x: -32, y: -80, width: 64, height: 80, rx: 10, fill: '#2E7D6B' }, g); S('path', { d: 'M 32,-60 q 30,0 30,24 q 0,24 -30,24', stroke: '#2E7D6B', 'stroke-width': 10, fill: 'none' }, g); };
ITEMS.bag = (g, it) => { S('g', {}, g).innerHTML = '<path d="M -120,-70 L 120,-70 L 150,160 L -150,160 Z" fill="#C7A36B"/><path d="M -120,-70 L 120,-70 L 126,-20 L -126,-20 Z" fill="#a8844f"/><path d="M -90,-70 C -90,-220 90,-220 90,-70" stroke="#8a6a3e" stroke-width="16" fill="none"/><path d="M -60,40 l 120,0 M -60,80 l 120,0" stroke="#a8844f" stroke-width="6"/>'; };
ITEMS.spot = (g, it) => { S('path', { d: `M ${-(it.w || 160)},-900 L ${it.w || 160},-900 L ${(it.w || 160) * 2.6},0 L ${-(it.w || 160) * 2.6},0 Z`, fill: lg([[0, '#FFF3C4', .55], [1, '#FFF3C4', .05]]) }, g); S('ellipse', { cx: 0, cy: 0, rx: (it.w || 160) * 2.6, ry: 60, fill: '#FFF3C4', opacity: .2 }, g); };
ITEMS.glow = (g, it) => { S('circle', { r: it.r || 420, fill: rg([[0, it.c || '#9fd8ff', .5], [1, it.c || '#9fd8ff', 0]]) }, g); };
