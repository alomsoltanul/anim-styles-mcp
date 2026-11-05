// Paper-cut stop-motion kit for fact reels. A page gives data and small drawing functions to PAPER.reel({...}); this file does the schedule
// (reading time from pace.js), the torn cards, the rolling numbers, the sliding scenes, the ground, the grain and the sound cues.
// Render at 12 fps with no motion blur (style.json: fps 12, sub 1). Load order: pace.js, paper.js, then the page script that calls PAPER.reel.
(() => {
  'use strict';
  const W = 1080, H = 1920, CX = 540, FPS = 12, FONT = 'Noto';
  const Q = new URLSearchParams(location.search), RENDER = Q.has('render');
  if (RENDER) document.body.classList.add('render');
  const cv = document.getElementById('c'), x = cv.getContext('2d');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, v) => { const u = clamp((v - a) / (b - a)); return u * u * (3 - 2 * u); };
  const easeOut = u => 1 - (1 - u) ** 3, easeIO = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  let LOCALE = 'en-US';                                 // PAPER.reel({ locale }) sets this; 'bn-BD' gives Bangla digits, 'ja-JP' Japanese grouping
  const num = (n, d = 0) => n.toLocaleString(LOCALE, { maximumFractionDigits: d, minimumFractionDigits: d });

  const THEMES = {
    green: { bg: '#0E4A3B', bg2: '#17634F', ground: '#0A3A2E' }, indigo: { bg: '#1E2A5E', bg2: '#2E3E82', ground: '#141C42' },
    maroon: { bg: '#5C1B26', bg2: '#7C2A36', ground: '#3E1019' }, teal: { bg: '#0D5560', bg2: '#157483', ground: '#083A42' },
    plum: { bg: '#3C2354', bg2: '#553374', ground: '#27153A' }, night: { bg: '#13202E', bg2: '#21364A', ground: '#0B141D' },
    earth: { bg: '#5A3A1E', bg2: '#7A5230', ground: '#3B2410' },
  };
  const INK = '#1E1C18', CARD = '#F4EBD8', CARD2 = '#E4D8BE', RED = '#D5362B', RED2 = '#8F2019', GOLD = '#E9AC2F', MUTE = '#6E6450', SKY = '#8FC6C9', LEAF = '#5FA463';
  const TOP = 172, CARD_BOTTOM = 910;                   // the card sits below the platform's top buttons
  const ART = { x: 70, y: 945, w: 940, h: 680, cx: CX, cy: 1285 };     // where a stop's drawing lives: under the card, above the ground

  // ---------- paper ----------
  let B = 0;                                            // boil: 0,1,2, changes 6 times a second, so hand-cut edges shiver like stop-motion
  const tex = (() => { const o = document.createElement('canvas'); o.width = 540; o.height = 960; const g = o.getContext('2d'), d = g.createImageData(540, 960), r = rng(7);
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 0; d.data[i + 3] = r() * 23; } g.putImageData(d, 0, 0); return o; })();
  function piece(path, fill, lift = 10) {               // one cut-out: path is a function that traces on x
    x.save(); x.shadowColor = 'rgba(25,15,5,.40)'; x.shadowBlur = lift; x.shadowOffsetY = lift * .55; x.shadowOffsetX = lift * .1; x.fillStyle = fill; x.beginPath(); path(); x.fill(); x.restore();
  }
  // Hand-cut outlines: straight scissor runs between jittered points. seed keeps a shape's own wobble, B makes it shiver.
  const J = (seed, i, amt) => (hash(seed * 13.7 + i * 3.1 + B * 57.3) - .5) * amt;
  function poly(pts, seed = 1, amt = 3) { pts.forEach((p, i) => { x[i ? 'lineTo' : 'moveTo'](p[0] + J(seed, i, amt), p[1] + J(seed + 9, i, amt)); }); x.closePath(); }
  function circ(cx, cy, r, seed = 1, n = 0) { n = n || Math.max(12, Math.min(40, r / 3 | 0)); for (let i = 0; i < n; i++) { const a = i / n * 6.2832, q = r + J(seed, i, Math.min(5, r * .05)); x[i ? 'lineTo' : 'moveTo'](cx + q * Math.cos(a), cy + q * Math.sin(a)); } x.closePath(); }
  const rectPts = (px, py, w, h, rot = 0) => { const c = Math.cos(rot), s = Math.sin(rot), hw = w / 2, hh = h / 2; return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([a, b]) => [px + a * c - b * s, py + a * s + b * c]); };
  function rect(px, py, w, h, rot = 0, seed = 1, amt = 3) { poly(rectPts(px, py, w, h, rot), seed, amt); }
  function tornPath(l, tp, r, b, seed, rough = 7, tilt = 0) {
    const R = rng(seed * 31 + B), pts = [[l, tp + tilt], [r, tp - tilt], [r + tilt * .6, b - tilt], [l - tilt * .6, b + tilt]];
    pts.forEach((p, i) => { const q = pts[(i + 1) % 4], n = Math.max(2, Math.hypot(q[0] - p[0], q[1] - p[1]) / 17 | 0); for (let k = 0; k < n; k++) { const u = k / n; x[i + k ? 'lineTo' : 'moveTo'](p[0] + (q[0] - p[0]) * u + (R() - .5) * rough, p[1] + (q[1] - p[1]) * u + (R() - .5) * rough); } });
    x.closePath();
  }
  const sheet = (l, tp, r, b, fill = CARD, seed = 3, lift = 22, tilt = 9) => piece(() => tornPath(l, tp, r, b, seed, 7, tilt), fill, lift);
  function tape(px, py, rot = -.5, w = 130) { x.save(); x.translate(px, py); x.rotate(rot); x.fillStyle = 'rgba(233,172,47,.84)'; x.fillRect(-w / 2, -18, w, 38); x.restore(); }

  // ---------- text ----------
  const lines = [];                                     // for textCheck: every line that had to shrink
  function fit(s, size, weight, maxw = 930) { x.font = `${weight} ${size}px ${FONT}`; const w = x.measureText(s).width; if (w > maxw) { lines.push([Math.round(w), size, s]); return size * maxw / w; } return size; }
  function T(s, px, py, size, weight, col, al = 'center', maxw = 930) { const z = fit(s, size, weight, maxw); x.font = `${weight} ${z}px ${FONT}`; x.textAlign = al; x.textBaseline = 'alphabetic'; x.fillStyle = col; x.fillText(s, px, py); }
  function big(s, py, size = 226, col = RED, dark = RED2, maxw = 900, px = CX) { const z = fit(s, size, 900, maxw), o = Math.max(4, z * .036); T(s, px + o, py + o, z, 900, dark, 'center', 2000); T(s, px, py, z, 900, col, 'center', 2000); }
  function strip(s, py, fill = INK, col = CARD, size = 54, seed = 5) { const z = fit(s, size, 800, 800); x.font = `800 ${z}px ${FONT}`; const w = Math.max(380, x.measureText(s).width + 96); piece(() => tornPath(CX - w / 2, py - z * 1.02, CX + w / 2, py + z * .46, seed, 6, 3), fill, 8); T(s, CX, py, z, 800, col, 'center', 2000); }

  // ---------- ready-made cut-outs (px,py = bottom centre unless noted; s = scale) ----------
  const icon = {
    person(px, py, h, fill = CARD, seed = 1) { const r = h * .15; piece(() => { circ(px, py - h + r, r, seed, 14); }, fill, 5); piece(() => { poly([[px - h * .2, py], [px - h * .24, py - h * .62], [px, py - h * .74], [px + h * .24, py - h * .62], [px + h * .2, py]], seed + 2, 2); }, fill, 5); },
    drop(px, py, r, fill = SKY, seed = 1) { piece(() => { const n = 20; for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, k = Math.sin(a / 2) ** 3, q = r * (1 - .1 * k); x[i ? 'lineTo' : 'moveTo'](px + q * Math.sin(a) * .82 + J(seed, i, 2), py - r * .3 - r * Math.cos(a) * (1 + .5 * (Math.cos(a) > 0 ? 1 : 0)) + J(seed + 3, i, 2)); } x.closePath(); }, fill, 7); },
    heart(px, py, r, fill = RED, seed = 1) { piece(() => { const n = 26; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, hx = 16 * Math.sin(a) ** 3, hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); x[i ? 'lineTo' : 'moveTo'](px + hx * r / 16 + J(seed, i, 2.4), py - hy * r / 16 + J(seed + 1, i, 2.4)); } x.closePath(); }, fill, 10); },
    moon(px, py, r, fill = CARD) { piece(() => { x.arc(px, py, r, .25 * Math.PI, 1.75 * Math.PI, false); x.arc(px + r * .42, py, r * .78, 1.72 * Math.PI, .28 * Math.PI, true); x.closePath(); }, fill, 8); },
    sun(px, py, r, fill = GOLD, seed = 1) { piece(() => circ(px, py, r, seed), fill, 9); },
    star(px, py, r, fill = GOLD, seed = 1, n = 5) { piece(() => { const p = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, q = i % 2 ? r * .46 : r; p.push([px + q * Math.cos(a), py + q * Math.sin(a)]); } poly(p, seed, 1.6); }, fill, 5); },
    house(px, py, s, fill = CARD, roof = RED, seed = 1) { piece(() => rect(px, py - 45 * s, 120 * s, 90 * s, 0, seed), fill, 7); piece(() => poly([[px - 82 * s, py - 86 * s], [px, py - 150 * s], [px + 82 * s, py - 86 * s]], seed + 1, 2), roof, 7); },
    phone(px, py, s, fill = INK, screen = SKY, seed = 1) { piece(() => rect(px, py - 110 * s, 118 * s, 220 * s, 0, seed), fill, 9); piece(() => rect(px, py - 110 * s, 98 * s, 180 * s, 0, seed + 1, 2), screen, 2); },
    bus(px, py, s, fill = RED, seed = 1) { piece(() => rect(px, py - 85 * s, 300 * s, 130 * s, 0, seed), fill, 9); for (let i = 0; i < 4; i++) piece(() => rect(px - 105 * s + i * 70 * s, py - 105 * s, 50 * s, 42 * s, 0, seed + i, 2), SKY, 2); for (const d of [-90, 90]) piece(() => circ(px + d * s, py - 18 * s, 25 * s, seed + d, 12), INK, 4); },
    rickshaw(px, py, s, fill = GOLD, seed = 1) { piece(() => { x.arc(px, py - 165 * s, 72 * s, Math.PI, 0); x.closePath(); }, RED, 7); piece(() => rect(px, py - 100 * s, 120 * s, 62 * s, 0, seed), fill, 7); piece(() => poly([[px + 60 * s, py - 84 * s], [px + 150 * s, py - 84 * s], [px + 155 * s, py - 66 * s], [px + 60 * s, py - 66 * s]], seed, 2), INK, 4); for (const d of [-40, 150]) piece(() => circ(px + d * s, py - 34 * s, 34 * s, seed + d, 14), INK, 4); },
    plane(px, py, s, fill = CARD, seed = 1) { piece(() => poly([[px - 150 * s, py], [px + 120 * s, py - 28 * s], [px + 158 * s, py - 12 * s], [px + 120 * s, py + 12 * s], [px + 20 * s, py + 18 * s], [px - 40 * s, py + 88 * s], [px - 74 * s, py + 88 * s], [px - 40 * s, py + 20 * s], [px - 120 * s, py + 24 * s], [px - 152 * s, py + 62 * s], [px - 170 * s, py + 62 * s]], seed, 2), fill, 8); },
    stalk(px, py, h, fill = GOLD, seed = 1) { piece(() => poly([[px - 3, py], [px - 3, py - h], [px + 3, py - h], [px + 3, py]], seed, 1), LEAF, 3); for (let i = 0; i < 7; i++) { const yy = py - h + i * h * .08, d = i % 2 ? 1 : -1; piece(() => { x.ellipse(px + d * 11, yy, 12, 6.5, d * .6, 0, 6.2832); }, fill, 3); } },
    bee(px, py, s, seed = 1) { piece(() => { x.ellipse(px - 14 * s, py - 34 * s, 28 * s, 15 * s, -.5, 0, 6.2832); }, 'rgba(244,235,216,.92)', 3); piece(() => { x.ellipse(px + 16 * s, py - 34 * s, 28 * s, 15 * s, .5, 0, 6.2832); }, 'rgba(244,235,216,.92)', 3); piece(() => { x.ellipse(px, py, 44 * s, 28 * s, 0, 0, 6.2832); }, GOLD, 5); for (const d of [-14, 8]) { x.fillStyle = INK; x.fillRect(px + d * s, py - 26 * s, 11 * s, 52 * s); } piece(() => circ(px + 46 * s, py - 2 * s, 15 * s, seed, 10), INK, 2); },
    ant(px, py, s, fill = INK, seed = 1) { for (const [d, r] of [[-26, 13], [0, 9], [22, 11]]) piece(() => circ(px + d * s, py, r * s, seed + d, 10), fill, 2); x.strokeStyle = fill; x.lineWidth = 2.6 * s; for (const d of [-6, 2, 10]) { x.beginPath(); x.moveTo(px + d * s, py); x.lineTo(px + (d - 8) * s, py + 15 * s); x.moveTo(px + d * s, py); x.lineTo(px + (d + 7) * s, py - 15 * s); x.stroke(); } },
    flower(px, py, r, fill = CARD, mid = GOLD, seed = 1) { for (let i = 0; i < 6; i++) { const a = i * 1.0472; piece(() => circ(px + r * .62 * Math.cos(a), py + r * .62 * Math.sin(a), r * .44, seed + i, 10), fill, 3); } piece(() => circ(px, py, r * .36, seed + 7, 10), mid, 2); },
  };
  // The dark strip at the bottom gives every reel a place. Each ground is two layers of cut paper.
  function skyline(y, col, seed, sc = 1) { piece(() => { x.moveTo(0, H); x.lineTo(0, y); const r = rng(seed); let px = -40; while (px < W + 40) { const w = (90 + r() * 120) * sc, h = (40 + r() * 170) * sc, kind = r(); x.lineTo(px, y - h); if (kind < .4) { x.lineTo(px + w / 2, y - h - w * .42); x.lineTo(px + w, y - h); } else if (kind < .7) { x.lineTo(px + w * .36, y - h); x.lineTo(px + w * .36, y - h - 46 * sc); x.lineTo(px + w * .64, y - h - 46 * sc); x.lineTo(px + w * .64, y - h); x.lineTo(px + w, y - h); } else x.lineTo(px + w, y - h); x.lineTo(px + w, y); px += w; } x.lineTo(W, H); x.closePath(); }, col, 14); }
  function hills(y, col, seed, amp = 60) { piece(() => { x.moveTo(0, H); const r = rng(seed), a = r() * 6, b = r() * 6; for (let px = 0; px <= W; px += 40) x.lineTo(px, y + amp * Math.sin(px / 210 + a) * .6 + amp * Math.sin(px / 90 + b) * .3); x.lineTo(W, H); x.closePath(); }, col, 14); }
  function city(y, col, seed) { piece(() => { x.moveTo(0, H); const r = rng(seed); let px = -20; x.lineTo(px, y); while (px < W + 20) { const w = 60 + r() * 90, h = 20 + r() * 90; x.lineTo(px, y - h); x.lineTo(px + w, y - h); px += w; } x.lineTo(W + 20, H); x.closePath(); }, col, 14); }
  function sea(y, col, seed) { piece(() => { x.moveTo(0, H); for (let px = 0; px <= W; px += 30) x.lineTo(px, y + 16 * Math.sin(px / 44 + seed + B * 1.2)); x.lineTo(W, H); x.closePath(); }, col, 12); }
  const ground = {
    town(th) { skyline(1780, th.bg2, 21, .8); skyline(1850, th.ground, 9, .62); },
    village(th) { hills(1730, th.bg2, 4, 40); hills(1810, th.ground, 8, 30); },
    city(th) { city(1800, th.bg2, 5); city(1860, th.ground, 12); },
    sea(th) { sea(1730, th.bg2, 1); sea(1810, th.ground, 3); },
    plain(th) { hills(1790, th.ground, 2, 18); },
  };

  // ---------- the reel ----------
  function reel(o) {
    LOCALE = o.locale || 'en-US';
    const th = THEMES[o.theme || 'green'], S = o.stops, n = S.length, MOVE = o.move || .75, { readTime, FACT_DELAY } = PACE;
    const HOLDS = S.map(p => PACE.hold([p.name, p.unit, ...(p.fact || [])].filter(Boolean), p.labels || 0));
    const T_HOOK = Math.max(4.6, readTime(o.hook));
    const SCH = []; let tt = T_HOOK;
    S.forEach((p, k) => { SCH.push({ start: tt, arr: tt + MOVE, leave: tt + MOVE + HOLDS[k] }); tt += MOVE + HOLDS[k]; });
    const E0 = tt, E1 = E0 + MOVE, DUR = E1 + Math.max(4.5, readTime(o.end.concat(o.cta ? [o.cta] : [])));
    window.DUR = DUR; window.SCH = SCH; window.T_HOOK = T_HOOK; window.E1 = E1; window.LAST = n - 1;
    window.CUES = [{ t: .05, k: 'paper' }, { t: .4, k: 'digits' },
      ...SCH.flatMap((s, i) => [{ t: s.start, k: 'whoosh', i }, { t: s.arr - .08, k: 'slap' }, { t: s.arr + .05, k: 'digit' }, { t: s.arr + FACT_DELAY, k: 'paper' }]),
      { t: E0, k: 'whoosh', i: n }, { t: E1, k: 'drop' }, ...(o.cues ? o.cues(SCH) : [])];
    const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), mid = '#' + hx(th.bg).map((v, i) => Math.round(lerp(v, hx(th.bg2)[i], .5)).toString(16).padStart(2, '0')).join('');
    const G = { x, th, t: 0, B: 0, since: 0, k: -1, m: 0, from: -1, to: -1, ART, SCH, S, hold: 0 };

    function card(k, tq) {
      if (k < 0) { const hn = o.hookNum; sheet(44, TOP, 1036, hn ? 800 : 580, CARD, 3); o.hook.forEach((s, i) => T(s, CX, (hn ? 306 : 350) + i * 100, 74, 800, INK));
        if (hn) { const u = easeOut(clamp(tq / (hn.dur || 2.4))), v = hn.log ? 10 ** lerp(Math.log10(hn.from), Math.log10(hn.to), u) : lerp(hn.from, hn.to, u); big((hn.pre || '') + num(v, hn.dec || 0) + (hn.post || ''), 658, hn.size || 190); if (hn.unit) T(hn.unit, CX, 746, 44, 700, MUTE); } return; }
      if (k >= n) { sheet(44, TOP, 1036, TOP + 88 + (o.end.length + (o.cta ? 1.4 : 0)) * 92, CARD, 4); o.end.forEach((s, i) => T(s, CX, TOP + 148 + i * 88, 58, 800, INK)); if (o.cta) strip(o.cta, TOP + 148 + o.end.length * 88 + 34, RED, CARD, 46); return; }
      const p = S[k], since = tq - SCH[k].arr; sheet(44, TOP, 1036, CARD_BOTTOM, CARD, 3 + k);
      T(p.name, CX, 286, 60, 700, INK);
      let val = p.num;
      if (p.val !== undefined) { const v0 = p.from ?? 0, u = easeOut(clamp((since + .15) / .85)); val = (p.pre || '') + num(lerp(v0, p.val, u), p.dec || 0) + (p.post || ''); }
      big(val, 498, p.size || 214);
      if (p.unit) strip(p.unit, 622, INK, CARD, 50, 5 + k);
      const f = p.fact || [], u = smooth(FACT_DELAY - .1, FACT_DELAY, since) > .5 ? 1 : 0;
      if (u) f.forEach((s, i) => T(s, CX, 738 + i * 66, 44, 600, INK));
    }
    function scene(k, dx, tq) {
      x.save(); x.translate(dx, 0); if (dx) { x.translate(CX, 960); x.rotate(dx / 1180 * .035); x.translate(-CX, -960); }
      G.k = k; G.since = k < 0 ? tq : k >= n ? tq - E1 : tq - SCH[k].arr;
      G.hold = k < 0 ? T_HOOK : k >= n ? DUR - E1 : HOLDS[k];
      const art = k < 0 ? o.hookArt : k >= n ? o.endArt : S[k].art; if (art) art(G);
      card(k, tq); x.restore();
    }
    function frame(t) {
      const tq = Math.floor(t * FPS + 1e-6) / FPS; B = Math.floor(tq * 6) % 3; G.t = tq; G.B = B; lines.length = 0;
      let a = -1, b = null, m = 0;
      if (tq >= T_HOOK) { a = n; for (let k = 0; k < n; k++) { if (tq < SCH[k].arr) { a = k - 1; b = k; m = easeIO((tq - SCH[k].start) / MOVE); break; } if (tq < SCH[k].leave) { a = k; break; } }
        if (a === n && tq < E1) { a = n - 1; b = n; m = easeIO((tq - E0) / MOVE); } }
      G.from = a; G.to = b === null ? a : b; G.m = m;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = th.bg; x.fillRect(0, 0, W, H);
      sheet(-30, 870, W + 30, H + 30, mid, 2, 16, 12);
      if (o.back) o.back(G);
      if (o.fixed) o.fixed(G);
      if (b === null) scene(a, 0, tq); else { scene(a, -m * 1180, tq); scene(b, (1 - m) * 1180, tq); }
      (ground[o.ground || 'town'])(th);
      if (o.front) o.front(G);
      x.save(); x.imageSmoothingEnabled = true; x.drawImage(tex, 0, 0, W, H); x.restore();
    }
    window.seek = frame;
    // Lists every line that had to shrink to fit, as [width, asked size, text]. Run it in the browser console.
    window.textCheck = () => { const out = []; const ts = [0, ...SCH.map(s => s.arr + 1.2), E1 + 1]; ts.forEach(t => { frame(t); out.push(...lines.map(l => [...l])); }); return out; };
    window.prepare = async () => {
      await Promise.all(['900 60px Noto', '800 60px Noto', '700 60px Noto', '600 60px Noto'].map(f => document.fonts.load(f, 'Ag 123 অ 働'))); await document.fonts.ready; frame(0); return { dur: DUR, cues: window.CUES };
    };
    if (!RENDER) { const t0 = performance.now(); window.prepare().then(() => { const loop = () => { frame(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }); }
    return G;
  }

  window.PAPER = { reel, W, H, CX, ART, THEMES, x, piece, poly, circ, rect, sheet, tornPath, tape, T, big, strip, fit, icon, ground, clamp, lerp, smooth, easeOut, easeIO, rng, hash, num, J,
    INK, CARD, CARD2, RED, RED2, GOLD, MUTE, SKY, LEAF };
})();
